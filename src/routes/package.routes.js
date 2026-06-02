const express = require('express');
const packageController = require('../controllers/package.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { validatePackage, validatePackageUpdate } = require('../validations/package.validation');

const router = express.Router();

// Validation middleware
const validateCreatePackage = (req, res, next) => {
  const { error, value } = validatePackage(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map(d => d.message).join(', '),
      data: null
    });
  }
  req.body = value;
  next();
};

const validateUpdatePackage = (req, res, next) => {
  const { error, value } = validatePackageUpdate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map(d => d.message).join(', '),
      data: null
    });
  }
  req.body = value;
  next();
};

/**
 * Public routes
 */

// GET all packages
router.get('/', packageController.getAllPackages);

// GET package by ID
router.get('/:id', packageController.getPackageById);

/**
 * Protected routes (admin only)
 */

// POST create new package
router.post('/', verifyToken, isAdmin, validateCreatePackage, packageController.createPackage);

// PUT update package
router.put('/:id', verifyToken, isAdmin, validateUpdatePackage, packageController.updatePackage);

// DELETE package
router.delete('/:id', verifyToken, isAdmin, packageController.deletePackage);

module.exports = router;
