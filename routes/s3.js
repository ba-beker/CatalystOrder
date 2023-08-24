const express = require('express')
const supplier = require("../middlewares/supplier_auth")
const {generateUploadURL, generateDeleteURL} = require("../modules/s3")

// ! for theck: the auth middleware should be the supplier one?

const s3Router = express.Router()

s3Router.get('/api/s3-upload-url', supplier, async (req, res) => {
	const supplierName = decodeURIComponent(req.header('supplierName'))
	const productName = decodeURIComponent(req.header('productName'))
	const url = await generateUploadURL(supplierName, productName)
	res.send({ url })
})
s3Router.get('/api/s3-delete-url', supplier, async (req, res) => {
	const supplierName = req.header('supplierName')
	const productName = req.header('productName')
	const {images} = req.body
	const url = await generateDeleteURL(supplierName, productName)
	res.send({ url })
})






module.exports = s3Router