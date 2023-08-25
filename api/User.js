 const express = require('express');
 const router = express.Router();
 //mongodb user model
 const User = require('./../models/User');

 //mongodb user verification model
 const UserVerification = require("./../models/UserVerification")
 
 //email handler
 const nodemailer = require('nodemailer');

 //unique string
 const {v4: uuidv4} = require("uuid");

 // env variables 
 require("dotenv").config();

 //password handler
 const bcrypt = require('bcrypt');


 const { Resend }  = require("resend")

const resend = new Resend(process.env.RESEND_API_KEY);

// resend.emails.send({
//     from: 'onboarding@resend.dev',
//     to: 'llh9@yahoo.com',
//     subject: 'Hello World',
//     html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
// }).then((res, req) => {
//     console.log('success')
//     console.log(`Response: ${res}`)
//     console.log(`Request: ${req}`)
// }).catch(error => console.log(error()))


//  let transporter = nodemailer.createTransport({
//   host: process.env.HOST_NAME,
//   port: process.env.EMAIL_PORT,
//      auth: {
//          user: process.env.AUTH_EMAIL,
//          pass: process.env.Auth_PASS,
//      }
//  })

//  //testing success
//  transporter.verify((error,success) => {
//      if(error) {
//          console.log(error);
//      }else{
//          console.log("Ready for message");
//          console.log(success);
//      }
//  })

 // Signup
 
 // Import the functions you need from the SDKs you need
//  const { initializeApp } = require("firebase/app");
//  const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
 // TODO: Add SDKs for Firebase products that you want to use
 // https://firebase.google.com/docs/web/setup#available-libraries
 
 // Your web app's Firebase configuration
 // For Firebase JS SDK v7.20.0 and later, measurementId is optional

 // Initialize Firebase
//  const app = initializeApp(firebaseConfig);
//  const auth = getAuth();
  
 router.post('/signup', (req, res) => {
    //create variables for the request body and set them as the req body
    let {name, email, password, dateOfBirth} = req.body;
    //trim off any white-space that may be present in any of the variables
    name = name.trim();
    email = email.trim();
    password = password.trim();
    dateOfBirth = dateOfBirth.trim();

    //check it any of the fields are empty and if so show an error message 
    if(name == "" || email == "" || password == "" || dateOfBirth == ""){
        res.json({
            status: "FAILED",
            message: "Empty input fields!"
        });
    //check if name entered is valid 
    }else if(!/^[a-zA-Z]*$/.test(name)){
        res.json({
            status: "FAILED",
            message: "Invalid name entered"
        })
    // check if email is valid 
    }else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: "FAILED",
            message: "Invalid email entered"
        })
    //check if date of birth is valid 
    }else if(!new Date(dateOfBirth).getTime()) {
        res.json({
            status: "FAILED",
            message: "Invalid date of birth entered"
        })
    //check if password is long enough (at least 8 characters long)
    }else if(password.length < 8) {
        res.json({
            status: "FAILED",
            message: "Password is too short"
        })
    }else {
        //check if user already exists
        User.find({email}).then(result => {
            if (result.length) {
                // A user already exists
                res.json({
                    status: "FAILED",
                    message: "User with the provided email already exists"
                })
            }else {
                //try to create new user

                //password handling
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    const newUser = new User({
                        name,
                        email,
                        dateOfBirth,
                        password: hashedPassword,
                        verified: false
                    });

                    newUser.save().then(result => {
                        //Handle account verification
                        sendVerificaitonEmail(result, res)
                        
                        res.status(200).json({
                            status: "SUCCESS", 
                            message: "Signup successful",
                            data: result,
                        })
                    }).catch(err => {
                        res.json({
                            status: "FAILED",
                            message: "An error occorred while saving the user!"
                        })
                    })
                })
            }
        }).catch(err => {
            console.log(err);
            res.json({
                status: "FAILED",
                message: "An error occorred while checking for an existing user!"
            })
        })
    }
 });

 //Email verification function
 const sendVerificaitonEmail = ({_id, email}, res) => {
    const currentUrl = "https://safe-wildwood-71389-fa56ad469b94.herokuapp.com/";

    const uniqueString = uuidv4() + _id;
    const saltRounds = 10;
    bcrypt.hash(uniqueString, saltRounds)
    .then((hashedUniqueString) => {
        //set values in userverification collection
        const newVerification = new UserVerification({
            userId: _id,
            uniqueString: hashedUniqueString,
            createdAt: Date.now(),
            expiresAt: Date.now() + 21600000
        })
        
        newVerification.save()
        .then((email) => {
            resend.emails.send({
                from: 'Intergrounds',
                to: `${email}, llh9@yahoo.com`,
                subject: 'Verify your email',
                html: `<p>Verify your email address to complete signup and login to your account.</p><p>This Link <b>expires in 6 hours</b>.</p><p>Click <a href=${currenturl + "user/verify" + "/" + uniqueString}>here</a> to procees.</p>`
            })
        
        }).catch((error) => {
            console.log(error);
            res.json({
                status: "FAILED",
                message: "Failed to verify email"
            })
        })
    }).catch((error) => {
        console.log(error);
        res.json({
            status: "FAILED",
            message: "Failed to send verification email"
        })
    })
 };

 //Route to handle email verificarion 
 router.get('/verify/:userId/:uniqueString', (req, res) => {
    let { userId, uniqueString } = req.params;

    UserVerification
    .find({userId})
    .then((result) => {
        if(result.length > 0) {
            //user verification record exists so we proceed to check for expiration
            const {expiresAtxpiresAt} = result[0];
            const hashedUniqueString = result[0].uniqueString;
            // checking for expired uniqueString
            if(expiresAt < Date.now()) {
                //record has expired so we delete it 
                UserVerification
                .deleteOne({userId})
                .then((result) =>{
                    User
                    .deleteOne({_id: userId})
                    .then(() => {
                        let message = "Link has expired. Please sign up again.";
                        res.redirect(`/user/verified/error=true&message=${message}`);
                    })
                    .catch(error => {
                        console.log(error);
                        let message = "An error occured while clearing expired user verification record";
                        res.redirect(`/user/verified/error=true&message=${message}`);
                    })
                })
                .catch((error) => {
                    console.log(error);
                    let message = "An error occured while clearing expired user verification record";
                    res.redirect(`/user/verified/error=true&message=${message}`);
                })
            }else {
                //valid record
                bcrypt.compare(uniqueString, hashedUniqueString)
                .then(result => {
                    if (result) {
                        //strings match
                        User.updateOne({_id: userId}, {verified: true})
                        .then(() =>{
                            UserVerification
                            .deleteOne({userId})
                            .then(() => {
                                //inform user of verification
                                res.sendFile(path.join(__dirname, "./../views/verified.html"));
                            })
                            .catch(error => {
                                console.log(error);
                                let message = "An error occured while finalizing user verification status.";
                                res.redirect(`/user/verified/error=true&message=${message}`);
                            })
                        })
                        .catch(error => {
                            console.log(error);
                            let message = "An error occured while updating user verification status.";
                            res.redirect(`/user/verified/error=true&message=${message}`);
        
                        })
                    }else{
                        let message = "Invalid Verification Details passed. Please Check Your Email.";
                        res.redirect(`/user/verified/error=true&message=${message}`);
                    }
                })
                .catch(error => {
                    console.log(error);
                    let message = "An error occured while comparing unique strings.";
                    res.redirect(`/user/verified/error=true&message=${message}`);

                })
            }
        } else {
            //user verification record doesnt exist 
            let message = "Account record does not exist or has been verified already. Please signup or signin.";
        res.redirect(`/user/verified/error=true&message=${message}`);
        }
    })
    .catch((error) => {
        console.log(error);
        let message = "An error occured while checking for existing user verification record";
        res.redirect(`/user/verified/error=true&message=${message}`);
    })
 })

 //Verified Confirmation Page
 router.post('/verified', (req, res) => {
    res.sendFile(path.join(__dirname, "./../views/verified.html"));
 })

 // Signin
 router.post('/signin', (req, res) => {
    //create variables for the request body and set them as the req body
    let {email, password} = req.body;
    //trim off any white-space that may be present in any of the variables
    email = email.trim();
    password = password.trim();
    //check it any of the fields are empty and if so show an error message 
    if(email == "" || password == ""){
        res.json({
            status: "FAILED",
            message: "Empty input fields!"
        });
    //check if email entered is valid 
    }else if(!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: "FAILED",
            message: "Invalid email entered"
        })
    //check if password is long enough (at least 8 characters long)
    }else if(password.length < 8) {
        res.json({
            status: "FAILED",
            message: "Password is too short"
        })
    }else {
        User.find({email}).then(data => {
            if(data.length) {
                //User exists so check if verified
                if(!data[0].verified) {
                    console.log(data[0])
                    res.json({
                        status: "Failed",
                        message: "Email hasn't been verified yet. Check your email.", 
                        data: data[0]
                    })
                }else{
                    const hashedPassword = data[0].password;
                    bcrypt.compare(password, hashedPassword).then(result => {
                        if(result) {
                            //Password match
                            res.status(200).json({
                                status: "SUCCESS",
                                message: "Signin Successful",
                                data: data
                            })
                        }else{
                            res.json({
                                status: "FAILED",
                                message: "Invalid password entered"
                            })
                        }
                    }).catch(err => {
                        res.jsom({
                            status: "FAILED", 
                            message: "An error occured while comparing passwords"
                        })
                    })
                }
            }else{
                res.jsom({
                    status: "FAILED",
                    message: "Invalid credentials entered!"
                })
            }
        }).catch(err => {
            res.json({
                status: "FAILED",
                message: "An error occured while checking for an existing user"
            })
        })
    }
 })

 module.exports = router;