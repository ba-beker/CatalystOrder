const mongoose = require('mongoose');

const supplierSchema = mongoose.Schema({
	supplierId: {
	  type: mongoose.Schema.Types.ObjectId,
	  ref: 'User',
	},
  });
  
  module.exports = supplierSchema;