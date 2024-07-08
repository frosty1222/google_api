const crypto = require('crypto');
const key1 = crypto.randomBytes(32).toString('hex');
function generateRandomkey(){
   return key1;
}
module.exports = generateRandomkey();