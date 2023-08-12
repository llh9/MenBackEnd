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

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.Auth_PASS,
    }
})

//testing success
transporter.verify((error,success) => {
    if(error) {
        console.log(error);
    }else{
        console.log("Ready for message");
        console.log(success);
    }
})

 // Signup
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
                        password: hashedPassword
                    });

                    newUser.save().then(result => (
                        res.status(200).json({
                            status: "SUCCESS", 
                            message: "Signup successful",
                            data: result,
                        })
                    ))
                    .catch(err => {
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
            if(data) {
                //User exists

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