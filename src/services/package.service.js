const Package = require('../models/Package');

class PackageService {
  /**
   * Get all packages
   */
  async getAllPackages() {
    try {
      const packages = await Package.find().lean();
      return packages;
    } catch (error) {
      throw new Error(`Failed to retrieve packages: ${error.message}`);
    }
  }

  /**
   * Get package by ID
   */
  async getPackageById(id) {
    try {
      const packageData = await Package.findById(id).lean();
      if (!packageData) {
        throw new Error('Package not found');
      }
      return packageData;
    } catch (error) {
      if (error.message === 'Package not found') {
        throw error;
      }
      throw new Error(`Failed to retrieve package: ${error.message}`);
    }
  }

  /**
   * Create a new package
   */
  async createPackage(packageData) {
    try {
      const newPackage = await Package.create(packageData);
      return newPackage;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new Error(`Validation error: ${Object.values(error.errors).map(e => e.message).join(', ')}`);
      }
      throw new Error(`Failed to create package: ${error.message}`);
    }
  }

  /**
   * Update a package by ID
   */
  async updatePackage(id, updateData) {
    try {
      const packageData = await Package.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      if (!packageData) {
        throw new Error('Package not found');
      }
      return packageData;
    } catch (error) {
      if (error.message === 'Package not found') {
        throw error;
      }
      if (error.name === 'ValidationError') {
        throw new Error(`Validation error: ${Object.values(error.errors).map(e => e.message).join(', ')}`);
      }
      throw new Error(`Failed to update package: ${error.message}`);
    }
  }

  /**
   * Delete a package by ID
   */
  async deletePackage(id) {
    try {
      const packageData = await Package.findByIdAndDelete(id);
      if (!packageData) {
        throw new Error('Package not found');
      }
      return packageData;
    } catch (error) {
      if (error.message === 'Package not found') {
        throw error;
      }
      throw new Error(`Failed to delete package: ${error.message}`);
    }
  }
}

module.exports = new PackageService();
