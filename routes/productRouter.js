const express = require('express');
const productsController = require('../controllers/productsController');
const reviewRouter = require('./reviewRouter');

const router = express.Router({ mergeParams: true });

router.use('/:proId/reviews', reviewRouter);

router.post(
  '/createProd',
  productsController.uploadProductImages,
  productsController.resizeProductImages,
  productsController.setSubclassificationID,
  productsController.createProduct
);
router.get('/', productsController.getAllProducts);
router.get('/getOneProd/:proId', productsController.getOneProducts);
router.get('/related/:proId', productsController.listRelated);
router.get('/search', productsController.listSearch);
router.get('/subclassification', productsController.listSubclassification);
router.patch('/updateProd/:proId', productsController.updateProduct);
router.delete('/deleteProd/:proId', productsController.deleteProduct);

router.param('proId', productsController.productById);

module.exports = router;
