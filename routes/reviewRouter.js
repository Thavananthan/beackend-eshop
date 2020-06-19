const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.post(
  '/createReview',
  authController.protect,
  reviewController.setProductUserId,
  reviewController.createReview
);
router.get('/getOneReview/:review_ID', reviewController.getReview);
router.delete('/deleteReview/:review_ID', reviewController.deleteReview);
router.get('/', reviewController.getAllReviews);
router.patch('/updateReview/:review_ID', reviewController.updateReview);

router.param('review_ID', reviewController.reviewById);

module.exports = router;
