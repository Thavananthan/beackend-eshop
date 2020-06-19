const express = require('express');

const categoryController = require('../controllers/mainCategoryController.js');

const router = express.Router({ mergeParams: true });

router.post('/createMainCat', categoryController.createMaincategory);
router.get('/createMainCat', categoryController.getAllMainCategory);
router.get('/:id', categoryController.getOneMainCategory);
router.patch('/:id', categoryController.updateMaincategory);
router.delete('/:id', categoryController.deleteMainCategory);

//router.get('/:id', categoryController.read);

// sub category one

router.param('id', categoryController.categoryById);

module.exports = router;
