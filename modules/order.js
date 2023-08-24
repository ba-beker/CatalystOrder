
const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String,
    required: true
  },
  total: {
    type: String,
    required: true
  },
  supplierId: {
    type: String,
    required: true
  },
  orderCode: {
    type: String,
    required: true
  },
  businessName: {
    type: String,
    required: true
  },
  sellerName: {
    type: String,
    required: true
  },
  products: [{
    quantity: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
        required: true,
      }
    ],
    price: {
      type: Number,
      required: true,
    },
    supplierId: {
      type: String,
      default: 'admin',
    },
    businessName: {
      type: String,
      required: true,
    },
    barCode: {
      type: String,
      trim: true,
    },
  }]
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
