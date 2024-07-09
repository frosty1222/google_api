const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const availablesheetSchema = new Schema({
    title: String,
    sheetId:{
        type:String,
        unique:true
    },
    spreadSheetId:{
      type:String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('AvailableSheets', availablesheetSchema);
