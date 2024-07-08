const express = require('express');
const router = express.Router();
const googleServiceController = require('../controllers/GoogleServices');
const { TokenCheckMiddleware } = require('../util/middleware.js');
router.get('/get-data-sheet',googleServiceController.fetchData)
router.post('/add-data-sheet',googleServiceController.appendData)
router.put('/update-data-sheet',googleServiceController.editData)
router.get('/authorize',googleServiceController.authorize)
router.get('/callback',googleServiceController.callback)
router.delete('/delete-data-sheet',googleServiceController.deleteDataSheet)
module.exports = router;