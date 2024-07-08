const mongoose = require('mongoose');
async function connect(){
     try{
     await mongoose.connect('mongodb://127.0.0.1:27017/google_api',{
         useNewUrlParser: true,
         useUnifiedTopology:true
     })
     mongoose.set('strictQuery', false)
     console.log('Connect successfully!!!');
     }catch(error){
       console.log(error);
     }
}
module.exports = {connect}