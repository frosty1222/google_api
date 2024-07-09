const express = require('express');
const router = express.Router();
const googleServicePickerApiController = require('../controllers/GoogleServicePickerApi.js');
const { TokenCheckMiddleware } = require('../util/middleware.js');

module.exports = router;