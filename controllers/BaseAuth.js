const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
class BaseAuth{
    constructor(){
        this.auth = null;
        this.SCOPES = [
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file"
          ];
          this.TOKEN_PATH = path.join(__dirname, "token.json");
          this.CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
    }
    getauth(){
        return this.auth;
    }
    authorize = async (req, res) => {
        try {
          const CREDENTIALS_PATH = this.CREDENTIALS_PATH;
          const content = fs.readFileSync(CREDENTIALS_PATH);
          const credentials = JSON.parse(content);
          const { client_secret, client_id, redirect_uris } = credentials.web;
          const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
          );
          if (fs.existsSync(this.TOKEN_PATH)) {
            const token = fs.readFileSync(this.TOKEN_PATH);
            const tokenData = JSON.parse(token);
            oAuth2Client.setCredentials({
              access_token: tokenData.tokens.access_token,
              refresh_token: tokenData.tokens.refresh_token,
            });
            this.auth = oAuth2Client;
            // return res.status(201).json({
            //   token:JSON.parse(token)
            // });
          } else {
            return this.getNewToken(oAuth2Client, res);
          }
        } catch (error) {
          return res.status(500).json({
            error: error,
          });
        }
      };
      callback = async (req, res) => {
        const { code } = req.query;
    
        try {
          const CREDENTIALS_PATH = this.CREDENTIALS_PATH;
          const content = fs.readFileSync(CREDENTIALS_PATH);
          const credentials = JSON.parse(content);
          const { client_id, client_secret, redirect_uris } = credentials.web;
          if (!client_id)
            return res.json({
              error: "client id is not existing",
            });
          const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
          );
          const tokens = await oAuth2Client.getToken(code);
          const tokenData = JSON.parse(token);
          oAuth2Client.setCredentials({
            access_token: tokenData.tokens.access_token,
            refresh_token: tokenData.tokens.refresh_token,
          });
    
          // Save token to token.json file
          fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(tokens));
          this.auth = oAuth2Client;
    
          return res.json({
            data: oAuth2Client,
          });
        } catch (error) {
          console.error("Error retrieving access token", error);
          return res.status(500).json({ error: "Failed to retrieve access token" });
        }
      };
    
      getNewToken(oAuth2Client, res) {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: "offline",
          scope: this.SCOPES,
        });
        res.send(
          `Authorize this app by visiting this url: <a href="${authUrl}" target="_blank">${authUrl}</a>`
        );
        // console.log('Authorize this app by visiting this url:', authUrl);
        // const rl = require('readline').createInterface({
        //   input: process.stdin,
        //   output: process.stdout,
        // });
        // rl.question('Enter the code from that page here: ', (code) => {
        //   rl.close();
        //   oAuth2Client.getToken(code, (err, token) => {
        //     if (err) return console.error('Error retrieving access token', err);
        //     oAuth2Client.setCredentials(token);
        //     fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(token));
        //     this.auth = oAuth2Client;
        //   });
        // });
      }
}
module.exports = new BaseAuth();