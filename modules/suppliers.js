const mongoose = require('mongoose');
const supplierSchema = require('./supplier')

const suppliersSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  suppliers: [supplierSchema]
});

const Suppliers = mongoose.model('Supplier', suppliersSchema);
module.exports = Suppliers;