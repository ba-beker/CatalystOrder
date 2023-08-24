const mongoose = require('mongoose');

const wishlistProductSchema = mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const WishlistProduct = mongoose.model('Wishlist_product', wishlistProductSchema);

module.exports = WishlistProduct;
