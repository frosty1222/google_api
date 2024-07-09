const express = require('express');
const router = express.Router();
const googleServiceController = require('../controllers/GoogleServiceSpredSheetApi.js');
const baseAuth = require('../controllers/BaseAuth.js');
const { TokenCheckMiddleware } = require('../util/middleware.js');
router.get('/get-data-sheet',googleServiceController.fetchData)
router.post('/add-data-sheet',googleServiceController.appendData)
router.put('/update-data-sheet',googleServiceController.editData)
router.get('/authorize',baseAuth.authorize)
router.get('/callback',baseAuth.callback)
router.delete('/delete-data-sheet',googleServiceController.deleteDataSheet)
router.get('/get-available-sheet',googleServiceController.getAllUserAvailableSpredSheet)
module.exports = router;