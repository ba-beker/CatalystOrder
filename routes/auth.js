const express = require("express")
const User = require("../modules/user")
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const auth = require("../middlewares/auth")
const generateUploadURL = require("../modules/s3")
const crypto = require('crypto');
const { promisify } = require('util');
const LatestVersion = require("../modules/latest_version")
const Categories = require("../modules/categories")
const randomBytes = promisify(crypto.randomBytes)
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const authRouter = express.Router()

const SECRET_KEY = crypto.randomBytes(32).toString('hex');
require('dotenv').config()
const gmailPass = process.env.GMAIL_PASS
// signup route
authRouter.post("/api/signup", async (req, res) => {
	try {
		const { name, email, businessName, address, password, phone, type } = req.body

		console.log(businessName)
		let existingUser = await User.findOne({ email })
		if (existingUser) {
			return res.status(400).json({ msg: "Un utilisateur avec la même adresse e-mail existe déjà !" })
		}
		if (password.length < 6)
			return res.status(400).json({ msg: "Votre mot de passe est faible." })
		const hashedPass = await bcryptjs.hash(password, 8)
		// Generate a verification token
		// const secretKey = crypto.randomBytes(32).toString('hex');
		const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '3d' });

		if (type == "supplier") {
			const rawBytes = await randomBytes(16)
			const supplierCode = rawBytes.toString('hex')
			let user = new User({
				email,
				password: hashedPass,
				businessName,
				name,
				phone,
				address,
				type,
				supplierCode,
			})
			user = await user.save();
			res.json(user);
		} else {
			let user = new User({
				email,
				businessName,
				password: hashedPass,
				name,
				phone,
				address,
				type,
			})
			user = await user.save();
			res.json(user);
		}
		// Send the verification email
		sendVerificationEmail(email, token);

	} catch (e) {
		res.status(500).json({ error: e.message })
	}
}
)
// $ verify email
authRouter.get('/api/verify-email/:token', async (req, res) => {
	const { token } = req.params;
  
	try {
	  // Verify the token and extract the email
	  const { email } = jwt.verify(token, SECRET_KEY);
	  await User.updateOne({ email }, { confirmed: true });
  
	  // Update the user's email verification status in the database
  
	  res.json({ message: 'Email verified successfully.' });

	} catch (error) {
	  res.status(400).json({ message: 'Invalid or expired token.' });
	}
  });

// $ sign in
authRouter.post("/api/signin", async (req, res) => {
	try {
		const { email, password } = req.body
		const user = await User.findOne({ email })
		if (!user) {
			return res.status(400).json({ msg: "L'utilisateur avec cette adresse e-mail n'existe pas !" })
		}
		const isMatch = await bcryptjs.compare(password, user.password)
		if (!isMatch) {
			return res.status(400).json({ msg: "Wrong password!" })
		}
		if (user.confirmed) {
			// User's email is confirmed
			const token = jwt.sign({ id: user._id }, "passwordKey")
		// console.log({ token, ...user._doc })
		res.json({ token, ...user._doc })
		  } else {
			return res.status(400).json({ msg: "Nous vous avons envoyé un e-mail. Veuillez vérifier votre adresse e-mail en premier !" })
		  }
		
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
})
// $ token validation
authRouter.post("/tokenIsValid", async (req, res) => {
	try {
		const token = req.header('x-auth-token')
		if (!token) return res.json(false)
		const verified = jwt.verify(token, "passwordKey")
		if (!verified) return res.json(false)
		const user = await User.findById(verified.id)
		if (!user) return res.json(false)
		return res.json(true)
	} catch (e) {
		res.status(500).json({ error: e.message })
	}
})

// get user data
authRouter.get('/', auth, async (req, res) => {
	const user = await User.findById(req.user);
	res.json({ ...user._doc, token: req.token })
})

//  $ reset password
authRouter.post('/api/password-reset', async (req, res) => {
	const { email } = req.body;
  
	// Check if email exists in the user database
	const user = await User.findOne({ email });
	if (!user) {
	  return res.status(400).json({ msg: 'Adresse e-mail introuvable.' });
	}
	// Generate a random 6-digit number
	const resetNumber = Math.floor(100000 + Math.random() * 900000);
	const codeExpiration = new Date(Date.now() + 5 * 60 * 1000);
  
	// Associate the number with the user in the database
	user.codeCreatedAt = codeExpiration;
	user.resetNumber = resetNumber;
	await user.save();
  
	// Send the number to the user's email address
	// const resetMessage = `Your password reset number is: ${resetNumber}`;
	sendVerificationCode(email, resetNumber)

  
	res.json({ message: 'Code de réinitialisation de mot de passe envoyé à votre adresse e-mail.' });
  });

//   $ set new password
authRouter.post('/api/new-password', async (req, res) => {
	const { email, resetNumber, newPassword } = req.body;
	console.log(email, resetNumber, newPassword)
	// Check if email and reset number match in the user database
	const user = await User.findOne({ email });
	if (!user) {
	  return res.status(400).json({ message: 'Adresse e-mail invalide.' });
	}
  
	// Check if the reset number matches the one associated with the user
	if (user.resetNumber != resetNumber) {
	  return res.status(400).json({ msg: 'Code de réinitialisation invalide.' });
	}
	if (Date.now() > user.codeCreatedAt) {
		return res.status(400).json({ message: 'Le code de réinitialisation a expiré.' });
	  }
	// Update the user's password with the new password
	const hashedPass = await bcryptjs.hash(newPassword, 8)
	user.password = hashedPass;
	user.resetNumber = "";
	await user.save();
  
	res.json({ message: 'Réinitialisation du mot de passe réussie.' });
  });
  
// authRouter.get('/set-latest-version', async(req, res) =>{
// 	const version = 'hello'
// 	let categorie = new Categories({
// 		categories: ["hello", "there"],
// 	})
// 	newVersion = await categorie.save()
// 	res.json(newVersion)
// })

authRouter.get('/get-version', async (req, res) => {
	try {
		const version = await LatestVersion.findOne({})
		console.log(version)
		res.json(version)
	} catch (e) {
		res.status(500).json({ error: e.message })
	}


})


// function isGmail(email) {
// 	return email.endsWith('@gmail.com');
//   }
  
//   function isYahoo(email) {
// 	return email.endsWith('@yahoo.com') || email.endsWith('@yahoo.com.tw'); // Add more Yahoo domains if needed
//   }
// // Configure the transporterGmail for sending emails
const transporterGmail = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
	//   user: 'babekerm3@gmail.com',
	  user: process.env.GMAIL,
	  pass: gmailPass,
	},
  });

// Create a transporter using Yahoo's SMTP settings
	const transporterYahoo = nodemailer.createTransport({
	host: 'smtp.mail.yahoo.com',
	port: 465,
	service: 'yahoo',
	secure: false, // Use SSL/TLS
	auth: {
	  user: process.env.YAHOO, // Your Yahoo email address
	  pass: process.env.YAHOO.PASSWORD, // Your Yahoo email password
	},
	logger: true
  });
  
function isGmail(email) {
	return email.endsWith('@gmail.com');
  }
  
  function isYahoo(email) {
	console.log('yahoo')
	return email.endsWith('@yahoo.com') || email.endsWith('@yahoo.com.tw'); // Add more Yahoo domains if needed
  }
  // Function to send the verification email
  function sendVerificationEmail(email, token) {
	if (isGmail(email)){
		const mailOptions = {
			  from: process.env.GMAIL,
			  to: email,
			  subject: 'Vérification de l\'adresse e-mail',
			  html: `<p>Veuillez cliquer sur le lien suivant pour vérifier votre adresse e-mail : <a href=YOURLINK${token}">Vérifier l'adresse e-mail.</a></p>`,
			};
		  
			transporterGmail.sendMail(mailOptions, (error, info) => {
			  if (error) {
				console.log('Error sending verification email:', error);
			  } else {
				console.log('Verification email sent:', info.response);
			  }
			});
	}else if (isYahoo(email)){
		const mailOptions = {
			  from: process.env.GMAIL,
			  to: email,
			  subject: 'Vérification de l\'adresse e-mail',
			  html: `<p>Veuillez cliquer sur le lien suivant pour vérifier votre adresse e-mail : <a href="LINK${token}">Vérifier l'adresse e-mail.</a></p>`,
			};
		  
			transporterGmail.sendMail(mailOptions, (error, info) => {
			  if (error) {
				console.log('Error sending verification email:', error);
			  } else {
				console.log('Verification email sent:', info.response);
			  }
			});
	}
  }
  function sendVerificationCode(email, code) {
	const mailOptions = {
	//   from: 'babekerm3@gmail.com',
	  from: 'solifyshop@gmail.com',
	  to: email,
	  subject: 'Votre code de réinitialisation de mot de passe',
	  html: `<p>Votre code de réinitialisation de mot de passe est le suivant : ${code} </p>`,
	};
  
	transporterGmail.sendMail(mailOptions, (error, info) => {
	  if (error) {
		console.log('Error sending verification email:', error);
	  } else {
		console.log('Verification email sent:', info.response);
	  }
	});
  }


module.exports = authRouter 