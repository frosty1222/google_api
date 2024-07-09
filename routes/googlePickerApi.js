const express = require('express');
const router = express.Router();
const googleGoogleServicePickerApi = require('../controllers/GoogleServicePickerApi.js');
const { TokenCheckMiddleware } = require('../util/middleware.js');
router.get('/get-all-file',googleGoogleServicePickerApi.getAllFiles)
router.get('/show-picker',googleGoogleServicePickerApi.createPicker)
router.get('/download-picked-file/:fileId',googleGoogleServicePickerApi.downloadPickedFile)
router.post("/share-picked-file/:fileId",googleGoogleServicePickerApi.sharePickedFile)
module.exports = router;