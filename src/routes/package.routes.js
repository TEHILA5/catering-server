const express = require('express');
const packageController = require('../controllers/package.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/admin.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { packageSchema, updatePackageSchema } = require('../validations/package.validation');

const router = express.Router();

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
router.post('/', verifyToken, isAdmin, validate(packageSchema, 'body'), packageController.createPackage);

// PUT update package
router.put('/:id', verifyToken, isAdmin, validate(updatePackageSchema, 'body'), packageController.updatePackage);

// DELETE package
router.delete('/:id', verifyToken, isAdmin, packageController.deletePackage);

module.exports = router;
