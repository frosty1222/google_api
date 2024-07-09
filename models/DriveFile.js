const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const drivepropertySchema = new Schema({
    title: String,
    fileId:{
        type:String,
        unique:true
    },
    fileName:{
      type:String
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('DriveProperties', drivepropertySchema);
