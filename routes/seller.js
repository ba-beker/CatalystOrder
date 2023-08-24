const express = require("express")
const mongoose = require('mongoose');
const Product = require("../modules/product")
const auth = require("../middlewares/auth")
const WishlistProduct = require("../modules/whishlist_product")
const CartProduct = require("../modules/cart_product")
const cartItemSchema = require("../modules/cart_item")
const Order = require('../modules/order')
const supplierSchema = require("../modules/supplier")
const Suppliers = require('../modules/suppliers')
const User = require('../modules/user')
const crypto = require('crypto');
const { promisify } = require('util');
const Categories = require("../modules/categories");
const randomBytes = promisify(crypto.randomBytes)

const sellerRouter = express.Router()

// $ Home page

// get products
sellerRouter.get("/api/get-products/:userId", auth, async (req, res) => {
	try {
		const userId = req.params.userId
		let products = []
		const supplierDocument = await Suppliers.findOne({ userId })
		if (!supplierDocument) {
			return res.json([])
		}
		const suppliers = supplierDocument.suppliers
		for (let i = 0; i < suppliers.length; i++) {
			let supplierId = suppliers[i].supplierId.toString()
			let arr = await Product.find({ supplierId })
			if (!arr) {
				arr = []
			}
			products = products.concat(arr)
		}
		res.json(products)
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
}),
// get private products
sellerRouter.get("/api/get-private-products/:userId/:category", auth, async (req, res) => {
	try {
		const userId = req.params.userId
		const category = req.params.category
		let products = []
		const supplierDocument = await Suppliers.findOne({ userId })
		if (!supplierDocument) {
			return res.json([])
		}
		const suppliers = supplierDocument.suppliers
		for (let i = 0; i < suppliers.length; i++) {
			let supplierId = suppliers[i].supplierId.toString()
			let arr = await Product.find({ supplierId, category })
			if (!arr) {
				arr = []
			}
			products = products.concat(arr)
		}
		res.json(products)
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
}),
// get products
sellerRouter.get("/api/get-public-products/:userId/:category", auth, async (req, res) => {
	try {
		const category = req.params.category
		const userId = req.params.userId
		let products = []
		console.log(category)
		products = await Product.find({ category, marketing:"public" })
		console.log(products)
		res.json(products)
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
}),

	// $ Wishlist page
	// add a product to the wishlist
	sellerRouter.post('/api/wishlist', auth, async (req, res) => {
		const { productId, userId } = req.body;

		try {
			// Check if the product is already wishlisted by the user
			const existingWishlistedProduct = await WishlistProduct.findOne({ productId, userId });

			if (existingWishlistedProduct) {
				return res.status(400).json({ msg: 'Le produit est déjà dans la liste de souhaits' });
			}

			// Create a new wishlisted product document
			const wishlistedProduct = new WishlistProduct({ productId, userId });
			await wishlistedProduct.save();
			res.json(wishlistedProduct)
		} catch (error) {
			res.status(500).json({ error: 'Internal server error' });
		}
	});

// fetch the wishlist products
sellerRouter.get('/api/wishlist/:userId', auth, async (req, res) => {
	const userId = req.params.userId;

	try {
		// Retrieve the wishlisted products for the user and populate the product details
		const wishlistedProducts = await WishlistProduct.find({ userId }).populate('productId');

		// Extract the product details from the wishlisted products
		const products = wishlistedProducts.filter(product => product.productId !== null).map((wishlistedProduct) => wishlistedProduct.productId);

		res.json(products);
	} catch (error) {
		console.error('Error fetching wishlisted products:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// delete product from the wishlist
sellerRouter.delete('/api/wishlist/:productId/:userId', auth, async (req, res) => {
	const { productId, userId } = req.params;

	try {
		const product = await WishlistProduct.findOneAndDelete({ productId, userId });
		res.json(product)
	} catch (error) {
		console.error('Error removing product from wishlist:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// $ Cart page

// add product to cart
sellerRouter.post('/api/cart', auth, async (req, res) => {
	const { productId, userId, supplierId } = req.body;

	try {
		// Check if the product is already carted by the user
		const existingCartedProduct = await CartProduct.findOne({ productId, userId });

		if (existingCartedProduct) {
			return res.status(400).json({ msg: 'Le produit est déjà dans le panier' });
		}
		const existingFromOtherSupplier = await CartProduct.findOne({
			supplierId: { $ne: supplierId }, userId
		});
		if (existingFromOtherSupplier) {
			return res.status(400).json({ msg: 'Il y a un produit d\'un autre fournisseur dans le panier. Veuillez vider le panier d\'abord.' });
		}
		// Create a new carted product document
		const CartedProduct = new CartProduct({ productId, userId, supplierId });
		await CartedProduct.save();
		res.json(CartedProduct)
	} catch (error) {
		console.error('Error adding product to Cart:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// fetch the cart products
sellerRouter.get('/api/cart/:userId', auth, async (req, res) => {
	const userId = req.params.userId;

	try {
		// Retrieve the wishlisted products for the user and populate the product details
		let cartedProducts = await CartProduct.find({ userId }).populate('productId');
		cartedProducts = cartedProducts.filter(product => product.productId !== null)
		// Extract the product details from the wishlisted products
		const products = cartedProducts.map((cartedProduct) => cartedProduct.productId);
		res.json(products);
	} catch (error) {
		console.error('Error fetching carted products:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// delete product from the cart
sellerRouter.delete('/api/cart/:productId/:userId', auth, async (req, res) => {
	const { productId, userId } = req.params;

	try {
		const product = await CartProduct.findOneAndDelete({ productId, userId });
		res.json(product)
	} catch (error) {
		console.error('Error removing product from wishlist:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// $ orders page

// add order
sellerRouter.post("/api/add-order", auth, async (req, res) => {
	const { userId, date, total, supplierId, businessName, items , sellerName} = req.body
	try {
		let arr = []
		for (let i = 0; i < items.length; i++) {
			const product = await Product.findById(items[i][0]);
			const cartItemSchema = {
				name: product.name,
					description: product.description,
					images: product.images,
					price: product.price,
					quantity: items[i][1],
					supplierId: product.supplierId,
					businessName: product.businessName,
					barCode: product.barCode
			}
			arr.push(cartItemSchema)
		}
		const rawBytes = await randomBytes(8)
		const orderCode = rawBytes.toString('hex')
		let order = new Order({
			supplierId,
			date,
			total,
			businessName,
			orderCode,
			userId,
			products: arr,
			sellerName
		})
		order = await order.save()
		return res.json(order)
	} catch (e) {
		res.status(500).json({ error: 'Internal server error' });
	}
})

// fetch orders
sellerRouter.get('/api/orders/:userId', auth, async (req, res) => {
	const userId = req.params.userId;

	try {
		// Retrieve the orders for the user
		const isOrderExist = await Order.findOne({userId})
		if (!isOrderExist){
			return res.json([])
		}
		const orders = await Order.find({ userId });
		if (!orders) {
			return res.status(200).json([]);
		}
		res.status(200).json(orders.reverse());
	} catch (error) {
		console.error('Error fetching user orders:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// $ Suppliers page

// seller add a new supplier
sellerRouter.post("/api/add-supplier", auth, async (req, res) => {
	try {
		// Get the user ID from the request body
		const { supplierCode, userId } = req.body;

		let supplier = await User.findOne({ supplierCode })
		if (!supplier) {
			return res.status(400).json({ msg: 'Le fournisseur n\'existe pas' });
		}
		// Find the Suppliers document for the given user ID
		let supplierDocument = await Suppliers.findOne({ userId });

		// If the Suppliers document doesn't exist, create a new one
		if (!supplierDocument) {
			let arr = []
			let supplierSchema = { supplierId: supplier._id };
			arr.push(supplierSchema)
			supplierDocument = new Suppliers({ userId: userId, suppliers: arr });
			supplierDocument = await supplierDocument.save();
			res.json(supplierDocument)
		} else {


			let suppliers = supplierDocument.suppliers
			for (let i = 0; i < suppliers.length; i++) {
				if (suppliers[i].supplierId.toString() == supplier._id.toString()) {
					return res.status(400).json({ msg: 'Le fournisseur a déjà été ajouté.' });
				}

			}
			let supplierSchema = { supplierId: supplier._id };

			supplierDocument.suppliers.push(supplierSchema);
			supplierDocument = await supplierDocument.save();
			res.json(supplierDocument)

		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'An error occurred' });
	}
})

// fetch the suppliers 
sellerRouter.get('/api/get-suppliers/:userId', auth, async (req, res) => {
	const userId = req.params.userId;

	try {

		const supplierDocument = await Suppliers.findOne({ userId })
		if (!supplierDocument)
			return res.json([]);
		const supplierIds = supplierDocument.suppliers
		let suppliers = []
		for (let i = 0; i < supplierIds.length; i++) {
			let supplierId = supplierIds[i].supplierId.toString()
			let supplier = await User.findOne({ _id: supplierId })
			suppliers.push(supplier)
		}
		res.json(suppliers);
	} catch (error) {
		console.error('Error fetching wishlisted products:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// get categories
sellerRouter.get("/api/get-categories", async (req, res) => {
	try {
		const categories = await Categories.findOne({}, {_id: 0, __v: 0})
		res.json(categories)
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
})

module.exports = sellerRouter;