// Import from packages
const express = require("express")
const mongoose = require("mongoose")
// Import from other files
const authRouter = require("./routes/auth.js")
const supplierRouter = require("./routes/supplier.js")
const s3Router = require("./routes/s3.js")
const sellerRouter = require("./routes/seller.js")
require('dotenv').config()

// Init
const PORT = process.env.PORT
const DB = process.env.DB
const IP = process.env.IP
const app = express()

// middleware
app.use(express.json())
app.use(authRouter)
app.use(supplierRouter)
app.use(s3Router)
app.use(sellerRouter)

// connections
mongoose.connect(DB).then(() => {
	console.log("connected to mongo successfully!")
}).catch((e) => console.log(e))

app.listen(PORT, IP, () => {
	console.log(`connected to port ${PORT}`)
})
