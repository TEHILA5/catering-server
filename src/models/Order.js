const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
  selectedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Dish' }],
  numberOfGuests: { type: Number, required: true, min: 1 },
  eventDate: { type: Date, required: true },
  address: { type: String, required: true },
  // Price snapshot: the amount actually charged at order time.
  // Kept on the order so it stays accurate even if the package price changes later.
  totalPrice: { type: Number, required: true },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema, 'orders');
module.exports = Order;
