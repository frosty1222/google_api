const { google } = require("googleapis");
const User = require("../models/User");
const AvailableSheet = require("../models/AvailableSheet");
const BaseAuth = require("./BaseAuth");

class GoogleServiceSpredSheetApi{
  constructor() {
    this.baseAuth = BaseAuth;
    this.sheetId = 0;
    this.spreadsheetId = "1FgDGAAL2PLAliyX3S2QcQuYdBKfmtTDqH8FX3IxKHQw";
    this.saveToMongo = this.saveToMongo.bind(this);
    this.updateMongoData = this.updateMongoData.bind(this);
    this.getSheetByRange = this.getSheetByRange.bind(this);
  }

  appendData = async (req, res) => {
    const { values } = req.body;
    let checkEmail = await User.findOne({ email: values.email });
    if (checkEmail) {
      return res.status(400).json({
        message: "Email already existed",
      });
    }
    await this.baseAuth.authorize(req, res);
    const data = [[values.name, values.email, values.password]];
    const sheets = google.sheets({ version: "v4", auth: this.baseAuth.auth });
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
    await this.baseAuth.authorize(req, res);
    if (!values.email) {
      return res.json({
        success: false,
        message: "can not update spredsheet",
      });
    }
    const data = [[values.name, values.email, values.password]];

    const sheets = google.sheets({ version: "v4", auth: this.baseAuth.auth });
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
    const sheets = google.sheets({ version: "v4", auth: this.baseAuth.auth });
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

  deleteDataSheet = async (req, res) => {
    const { rowIndex } = req.body;
    await this.baseAuth.authorize(req, res);
    const row = await this.getSheetByRange(rowIndex);
    if (row.length === 0) {
      return res.status(400).json({
        success: false,
      });
    }
    const sheets = google.sheets({ version: "v4", auth: this.baseAuth.auth });
    const request = {
      spreadsheetId: this.spreadsheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: this.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    };
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
      console.error("Error deleting row:", err);
      return res.status(500).json({
        success: false,
      });
    }
  };
  getSheetByRange = async (rowIndex) => {
    const sheets = google.sheets({ version: "v4", auth: this.baseAuth.auth });
    const range = `Sheet1!A${rowIndex + 1}:Z${rowIndex + 1}`;
    try {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      const row = result.data.values ? result.data.values[0] : [];
      return row;
    } catch (err) {
      console.error("Error backing up row:", err);
      throw err;
    }
  };

  getAllUserAvailableSpredSheet = async(req,res)=>{
    await this.baseAuth.authorize();
    const sheets = google.sheets({ version: 'v4', auth: this.baseAuth.auth });
      try {
        const response = await sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
        });
  
        const sheetDetails = response.data.sheets.map(sheet => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          spreadSheetId:this.spreadsheetId
        }));
        if(Object.keys(sheetDetails).length > 0){
           const savePromises = sheetDetails.map(async (sheet)=>{
            const {title,sheetId,spreadSheetId} = sheet;
            const checkExisting = await AvailableSheet.findOne({
              sheetId:sheetId,
              spreadSheetId:spreadSheetId
            })
            if(!checkExisting){
                const availableSheet = new AvailableSheet({
                  title:title,
                  sheetId:sheetId,
                  spreadSheetId:spreadSheetId
              })
            await availableSheet.save();
            }
           })
           await Promise.all(savePromises);
        }
        return res.status(200).json({
          success: true,
          sheets: sheetDetails ? sheetDetails:[],
        });
      } catch (error) {
        console.log(error)
        return res.status(500).json({
          success:false,
          files:null
        })
      }
  }
}

module.exports = new GoogleServiceSpredSheetApi();