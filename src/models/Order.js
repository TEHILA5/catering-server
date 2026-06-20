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
  // Order status. Starts "ממתין לתשלום"; flips to "מאושר" once payment is
  // confirmed — either by a successful server-side PayPal capture (never trusted
  // from the frontend) or by an admin manually marking it paid (cash / transfer).
  paymentStatus: {
    type: String,
    enum: ['ממתין לתשלום', 'מאושר'],
    default: 'ממתין לתשלום'
  },
  // PayPal references kept for traceability / reconciliation.
  paypalOrderId: { type: String },
  paypalCaptureId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema, 'orders');
module.exports = Order;
