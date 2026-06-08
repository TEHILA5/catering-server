const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  selectedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  eventDate: { type: Date, required: true },
  address: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['ממתין לאישור', 'בוצע'], default: 'ממתין לאישור' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema, 'orders');
module.exports = Order;
