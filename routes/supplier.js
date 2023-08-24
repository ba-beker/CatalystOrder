const express = require("express")
const User = require("../modules/user")
const supplier = require("../middlewares/supplier_auth")
const Product = require("../modules/product")
const Order = require("../modules/order")

const { deleteS3Images } = require("../modules/s3")
const supplierRouter = express.Router()

// Add products

supplierRouter.post("/supplier/add-product", supplier, async (req, res) => {
	try {
		const { name, description, images, barCode, price, quantity, supplierId, businessName, status, marketing, category} = req.body
		let product = new Product({
			name,
			description,
			images,
			price,
			quantity,
			supplierId,
			businessName,
			barCode,
			status,
			category,
			marketing,
		})
		product = await product.save() 
		res = res.json(product)

	} catch (e) {
		console.log(e)
		res.status(500).json({ error: e.message })
	}
})


// edit product
supplierRouter.put("/supplier/edit-product/:productId", supplier, async (req, res) => {
	try {
	  const { name, description, barCode, price, quantity, businessName, status, marketing,category } = req.body;
	  const productId = req.params.productId;
  
	  const updatedProduct = await Product.findByIdAndUpdate(
		productId,
		{
		  name,
		  description,
		  barCode,
		  price,
		  quantity,
		  businessName,
		  status,
		  category,
		  marketing,
		},
		{ new: true } // Return the updated product
	  );
  
	  if (!updatedProduct) {
		return res.status(404).json({ error: "Product not found" });
	  }
  
	  res.json(updatedProduct);
	} catch (e) {
	  res.status(500).json({ error: e.message });
	}
  });

// get products

supplierRouter.get("/supplier/get-products/:id", supplier, async (req, res) => {
	try {
		const supplierId = req.params.id
		const products = await Product.find({ supplierId })
		if (!products){
			return res.json([])
		}
		res.json(products)
	} catch (e) {
		res.status(500).json({ error: e.message }) 
	}
})

// delete a product

supplierRouter.delete("/supplier/delete-product", supplier, async (req, res) => {
	try {
		const {id, supplierName} = req.body
		let product = await Product.findByIdAndDelete(id)
		deleteS3Images(supplierName, product.name, product.images)
		res.json(product) 
	}catch(e) {
		res.status(500).json({ error: e.message })
	}
})

	// fetch orders
	supplierRouter.get('/api/orders-supplier/:supplierId', supplier, async (req, res) => {
		const supplierId = req.params.supplierId;
	  
		try {
			const isOrderExist = await Order.findOne({supplierId})
			if (!isOrderExist){
				return res.json([])
			}
			const orders = await Order.find({ supplierId });
			if (!orders) {
				return res.status(200).json([]);
			}
			res.status(200).json(orders.reverse());
		} catch (error) {
		  console.error('Error fetching user orders:', error);
		  res.status(500).json({ error: 'Internal server error' });
		}
	  });

	//   change post status
	supplierRouter.post("/supplier/update-post-status", supplier, async (req, res) => {
		const {email, shareToPublic} = req.body
		try {
			await User.updateOne({ email }, { shareToPublic: shareToPublic });
			console.log("success")
			res.json({ message: 'Email verified successfully.' });
		} catch (e) {
			res.status(400).json({ message: 'failed' });
		}
	})

module.exports = supplierRouter;