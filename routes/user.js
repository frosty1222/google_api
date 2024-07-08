const express = require('express');
const router = express.Router();
const user_controller = require('../controllers/UserController');
const { TokenCheckMiddleware } = require('../util/middleware.js');
router.get('/index',TokenCheckMiddleware,user_controller.index)
router.post('/user-login',user_controller.login)
router.get('/check-change-pass/:id',TokenCheckMiddleware,user_controller.checkChangePassWord);
router.post('/upload-avatar',TokenCheckMiddleware,user_controller.uploadAvatar);
router.post('/change-password',TokenCheckMiddleware,user_controller.changePassword);
router.get('/checkEmail/:email',TokenCheckMiddleware,user_controller.checkEmail);
router.post('/signup',TokenCheckMiddleware,user_controller.signup);
router.get('/avatar/:id',TokenCheckMiddleware,user_controller.getAvatar);
router.get('/block-user/:id',TokenCheckMiddleware,user_controller.blockAccount);
router.get('/unblock-user/:id',TokenCheckMiddleware,user_controller.unlockAccount);
router.put('/update-profile',TokenCheckMiddleware,user_controller.updateProfile);
router.post('/assign-role',TokenCheckMiddleware,user_controller.assignRole);
router.post('/add-new-role',TokenCheckMiddleware,user_controller.addRole);
router.get('/get-role-by-id/:id',TokenCheckMiddleware,user_controller.getRoleById);
router.get('/get-all-users',TokenCheckMiddleware,user_controller.getAllUsers);
module.exports = router;