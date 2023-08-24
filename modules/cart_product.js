const mongoose = require('mongoose');

const cartProductSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  supplierId: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
});

const CartProduct = mongoose.model('Cart_product', cartProductSchema);

module.exports = CartProduct;