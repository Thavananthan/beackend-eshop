const express = require('express');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.get('/signout', authController.signout);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updateMYpassword',
  authController.protect,
  authController.updatePassword
);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getOneuser
);
router.get(
  '/alluser',
  authController.protect,
  authController.restictTo('admin'),
  userController.getalluser
);
router.delete('/deleteMe', authController.protect, userController.deleteMe);
router.patch('/updateMe', authController.protect, userController.updateMe);
router.patch(
  '/update/profileImg',
  authController.protect,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.userImage
);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.delete('/deleteMe', authController.protect, userController.deleteMe);
router.patch('/verify/:vtoken', authController.userVerify);

module.exports = router;
