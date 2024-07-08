const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const userSchema = new Schema({
    name: String,
    fullName:String,
    email:{
      type:String,
      unique: true
    },
    password:String,
    status:{
       type:String,
       default:"active"
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', userSchema);
