const mongoose = require('mongoose')

const categoriesSchema = mongoose.Schema({
	categories: [
		{
			type: String,
		}
	],
	categories_images: [
		{
			type: String,
		}
	],
})


const Categories = mongoose.model('Categorie', categoriesSchema)
module.exports = Categories