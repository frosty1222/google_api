const { google } = require("googleapis");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");

class GoogleService {
  constructor() {
    this.SCOPES = [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/spreadsheets",
    ];
    this.TOKEN_PATH = path.join(__dirname, "token.json");
    this.CREDENTIALS_PATH = path.join(__dirname, "credentials.json");
    this.spreadsheetId = "1FgDGAAL2PLAliyX3S2QcQuYdBKfmtTDqH8FX3IxKHQw";
    this.auth = null;
    this.saveToMongo = this.saveToMongo.bind(this);
    this.updateMongoData = this.updateMongoData.bind(this);
    this.sheetId = 0;
    this.getSheetByRange = this.getSheetByRange.bind(this);
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

  appendData = async (req, res) => {
    const { values } = req.body;
    let checkEmail = await User.findOne({ email: values.email });
    if (checkEmail) {
      return res.status(400).json({
        message: "Email already existed",
      });
    }
    this.authorize(req, res);
    const data = [[values.name, values.email, values.password]];
    const sheets = google.sheets({ version: "v4", auth: this.auth });
    const request = {
      spreadsheetId: this.spreadsheetId,
      range: "Sheet1!A1:D1",
      valueInputOption: "USER_ENTERED",
      resource: { values: data },
    };

    try {
      const response = await sheets.spreadsheets.values.append(request);
      return res.json({
        data: response.data,
      });
    } catch (err) {
      console.error("Error appending data:", err);
    }
  };
  editData = async (req, res) => {
    const { values, rowIndex } = req.body;
    this.authorize(req, res);
    if (!values.email) {
      return res.json({
        success: false,
        message: "can not update spredsheet",
      });
    }
    const data = [[values.name, values.email, values.password]];

    const sheets = google.sheets({ version: "v4", auth: this.auth });
    const request = {
      spreadsheetId: this.spreadsheetId,
      range: `Sheet1!A${rowIndex}:C${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      resource: { values: data },
    };

    try {
      const response = await sheets.spreadsheets.values.update(request);
      if (response.data) {
        this.updateMongoData(values);
      }
      return res.json({
        data: response.data,
        success: true,
      });
    } catch (err) {
      console.error("Error appending data:", err);
    }
  };

  fetchData = async (req, res) => {
    const { range } = req.body;
    const sheets = google.sheets({ version: "v4", auth: this.auth });
    const spreadsheetId = "1FgDGAAL2PLAliyX3S2QcQuYdBKfmtTDqH8FX3IxKHQw";

    const request = {
      spreadsheetId: spreadsheetId,
      range: range,
      key: process.env.GOOGLE_CREDENTIAL,
    };

    try {
      const response = await sheets.spreadsheets.values.get(request);
      const rows = response.data.values;

      rows.shift();
      const savePromises = rows.map(async (data) => {
        const [name, email, password] = data;
        let checkEmail = await User.findOne({ email: email });
        if (!checkEmail) {
          const user = new User({
            name: name,
            email: email,
            password: password,
          });
          await user.save();
        }
      });
      await Promise.all(savePromises);
      const dataUser = await User.find();
      return res.json({
        result: dataUser,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({
        error: "Error fetching data",
      });
    }
  };

  saveToMongo = async (data) => {
    try {
      const user = new User({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      await user.save();
    } catch (error) {
      console.log(error);
    }
  };

  updateMongoData = async (data) => {
    await User.findOneAndUpdate({ email: data.email }, data, { new: true });
    return true;
  };

  deleteDataSheet = async (req,res)=>{
    const {rowIndex} = req.body;
    await this.authorize(req,res)
    const row = await this.getSheetByRange(rowIndex)
    if(row.length === 0){
      return res.status(400).json({
        success:false
      })
    }
    const sheets = google.sheets({ version: 'v4', auth: this.auth });
    const request = {
      spreadsheetId: this.spreadsheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: this.sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    }
    try {
      const response = await sheets.spreadsheets.batchUpdate(request);
      if (response && response.data.replies.length > 0) {
        await User.deleteOne({ email: row[1] });
    }

    return res.status(201).json({
        success: true,
        length: response.data.replies.length,
    });
    } catch (err) {
      console.error('Error deleting row:', err);
      return res.status(500).json({
        success:false
      })
    }
  }
  getSheetByRange=async(rowIndex)=>{
    const sheets = google.sheets({ version: 'v4', auth: this.auth });
    const range = `Sheet1!A${rowIndex + 1}:Z${rowIndex + 1}`;
    try {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });
  
      const row = result.data.values ? result.data.values[0] : [];
      return row;
    } catch (err) {
      console.error('Error backing up row:', err);
      throw err;
    }
  }
}

module.exports = new GoogleService();