const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	description: {
		type: String,
		trim: true
	},
	images: [
		{
			type: String,
			required: true
		}
	],
	price: {
		type: Number,
		required: true
	},
	quantity: {
		type: Number,
	},
	supplierId: {
		type: String,
		default: 'admin'
	},
	businessName: {
		type: String,
		required: true
	},
	barCode: {
		type: String,
		trim: true
	},
	status: {
		required: true,
		type: String,
		trim: true
	},
	marketing: {
		required: true,
		type: String,
		trim: true
	},
	category: {
		required: true,
		type: String,
	},
})


const Product = mongoose.model('Product', productSchema)
module.exports = Product