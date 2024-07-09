const { google } = require("googleapis");
const BaseAuth = require("./BaseAuth");
const DriveFile = require("../models/DriveFile");
const axios = require("axios");
class GoogleServicePickerApi {
  constructor() {
    this.baseAuth = BaseAuth;
  }

  getAllFiles = async (req, res) => {
    await this.baseAuth.authorize(req, res);
    const drive = google.drive({ version: "v3", auth: this.baseAuth.auth });
    try {
      const response = await drive.files.list({
        pageSize: 100,
        fields: "nextPageToken, files(id, name)",
      });
      const files = response.data.files;
      if (files.length) {
        const saveFiles = files.map(async (file) => {
          const { id, name } = file;
          const storeDriveFile = new DriveFile({
            fileId: id,
            fileName: name,
          });
          await storeDriveFile.save();
        });
        await Promise.all(saveFiles);
        return res.status(201).json({
          files: files,
          success: true,
        });
      } else {
        return res.status(201).json({
          files: [],
          success: true,
        });
      }
    } catch (err) {
      console.error("Error listing files:", err);
      return res.status(500).json({
        files: [],
        success: false,
      });
    }
  };
  createPicker = async (req, res) => {
    res.render("show-picker");
  };
  downloadPickedFile = async (req, res) => {
    const { fileId } = req.params;
    await this.baseAuth.authorize();
    try {
      const drive = google.drive({ version: "v3", auth: this.baseAuth.auth });
      const response = await drive.files.get({
        fileId: fileId,
        fields: "id, name, mimeType, webContentLink",
      });

      const { name, mimeType, webContentLink } = response.data;
      const fileResponse = await axios.get(webContentLink, {
        responseType: "stream",
        headers: {
          Authorization: `Bearer ${this.baseAuth.auth.credentials.access_token}`,
        },
      });

      res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
      res.setHeader("Content-Type", mimeType);

      fileResponse.data.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).send("Error downloading file");
    }
  };

  sharePickedFile = async (req, res) => {
    await this.baseAuth.authorize();
    const drive = google.drive({ version: "v3", auth: this.baseAuth.auth });
  
    try {
      const { fileId } = req.params;
      const permission = {
        type: "user",
        role: "writer",
        emailAddress: "lovandong342@gmail.com",
      };
  
      // Using async/await with promise
      const response = await drive.permissions.create({
        fileId: fileId,
        resource: permission,
      });
  
      return res.status(200).json({
        success: true,
        data: response.data,
      });
    } catch (error) {
      console.error("Error sharing file:", error);
      return res.status(500).json({
        success: false,
        data: null,
        error: error.message,
      });
    }
  };  
}

module.exports = new GoogleServicePickerApi();
