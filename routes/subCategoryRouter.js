const express = require('express');
const sub_categoryController = require('../controllers/subCategoryController.js');

const router = express.Router({ mergeParams: true });

router.post(
  '/createSubCat',
  sub_categoryController.uploadSubcategoryImages,
  sub_categoryController.resizeSubcategoryImages,
  sub_categoryController.setCategoyID,
  sub_categoryController.createSubCategory
);
router.get('/', sub_categoryController.getAllSubcategory);
router.get('/getSubCat/:subcatID', sub_categoryController.getSubcategory);
router.patch(
  '/updateSubCat/:subcatID',
  sub_categoryController.updateSubCategory
);
router.patch(
  '/updateSubImage/:subcatID',
  sub_categoryController.uploadSubcategoryImages,
  sub_categoryController.resizeSubcategoryImages,
  sub_categoryController.updateSubcategoryImage
);
router.delete(
  '/deletesubCat/:subcatID',
  sub_categoryController.deletesubCategory
);

router.param('subcatID', sub_categoryController.subcategoryById);

module.exports = router;
