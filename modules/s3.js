const dotenv = require('dotenv');
const aws = require('aws-sdk');
const crypto = require('crypto');
const { promisify } = require('util');
const randomBytes = promisify(crypto.randomBytes)
require('dotenv').config()

const region = process.env.REGION
const bucketName = process.env.BUCKET_NAME
const accessKeyId = process.env.ACCESS_KEY_ID
const secretAccessKey = process.env.SECRET_ACCESS_KEY

const s3 = new aws.S3({ 
	region,
	accessKeyId,
	secretAccessKey,
	signatureVersion: process.env.SIGNATURE_VERSION
})

async function generateUploadURL(supplierName, productName) {
	const rawBytes = await randomBytes(16)
	const imageName = rawBytes.toString('hex')

	const params = ({
		Bucket: bucketName,
		Key: supplierName + "/" + productName + "/" + imageName + ".png",
		Expires: 60
	})
	const uploadURL = await s3.getSignedUrlPromise('putObject', params)
	return uploadURL
}

function deleteS3Images(supplierName, productName, images) {
	for (let i = 0; i < images.length; i++){
		let spliting = images[i].split('/')
		images[i] = spliting[spliting.length - 1]
		console.log(images[i])
		const params = {
			Bucket: bucketName,
			Key: supplierName + '/' + productName + '/' + images[i]
		}
		const uploadURL = s3.deleteObject(params, function(err, data) {
		})
	}
	}
module.exports = {generateUploadURL, deleteS3Images}
