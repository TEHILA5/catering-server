const packageService = require('../services/package.service');
const responseHandler = require('../utils/responseHandler');

class PackageController {
  
  async getAllPackages(req, res) {
    try {
      const packages = await packageService.getAllPackages();
      responseHandler.success(res, packages, 'Packages retrieved successfully');
    } catch (error) {
      responseHandler.error(res, error.message, 500);
    }
  }

  
  async getPackageById(req, res) {
    try {
      const { id } = req.params;
      const packageData = await packageService.getPackageById(id);
      responseHandler.success(res, packageData, 'Package retrieved successfully');
    } catch (error) {
      if (error.message === 'Package not found') {
        return responseHandler.error(res, error.message, 404);
      }
      responseHandler.error(res, error.message, 500);
    }
  }

  
  async createPackage(req, res) {
    try {
      const packageData = req.body;
      const newPackage = await packageService.createPackage(packageData);
      responseHandler.success(res, newPackage, 'Package created successfully', 201);
    } catch (error) {
      if (error.message.startsWith('Validation error')) {
        return responseHandler.error(res, error.message, 400);
      }
      responseHandler.error(res, error.message, 500);
    }
  }

  
  async updatePackage(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedPackage = await packageService.updatePackage(id, updateData);
      responseHandler.success(res, updatedPackage, 'Package updated successfully');
    } catch (error) {
      if (error.message === 'Package not found') {
        return responseHandler.error(res, error.message, 404);
      }
      if (error.message.startsWith('Validation error')) {
        return responseHandler.error(res, error.message, 400);
      }
      responseHandler.error(res, error.message, 500);
    }
  }

  
  async deletePackage(req, res) {
    try {
      const { id } = req.params;
      await packageService.deletePackage(id);
      responseHandler.success(res, null, 'Package deleted successfully');
    } catch (error) {
      if (error.message === 'Package not found') {
        return responseHandler.error(res, error.message, 404);
      }
      responseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = new PackageController();
