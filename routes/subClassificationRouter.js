const express = require('express');

const subclassification = require('../controllers/subClassificationController.js');
const router = express.Router({ mergeParams: true });

router.post(
  '/createSubCls',
  subclassification.uploadSubclsImages,
  subclassification.resizeSubclsImages,
  subclassification.setCategoyIDandSubcategortID,
  subclassification.createSubClassification
);

router.get('/', subclassification.getAllSubClassification);
router.get('/getOneSubCls/:subClsID', subclassification.getOneSubcategory);
router.patch(
  '/updateOneSubCls/:subClsID',
  subclassification.updateSubClassification
);

router.patch(
  '/updateSubclsImage/:subClsID',
  subclassification.uploadSubclsImages,
  subclassification.resizeSubclsImages,
  subclassification.updateSubClassificationImage
);

router.param('subClsID', subclassification.subClsById);

module.exports = router;
