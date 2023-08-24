const mongoose = require('mongoose');

const cartItemSchema = mongoose.Schema({
	productId: {
	  type: mongoose.Schema.Types.ObjectId,
	  ref: 'Product',
	  required: true,
	},
	quantity: {
	  type: Number,
	  default: 1,
	},
  });
  
  module.exports = cartItemSchema;