const mongoose = require('mongoose');
const express = require('express')
const Schema = mongoose.Schema;
// const router = express.Router()


const UserVerificationSchema = new Schema({
    userId: String,
    uniqueString: String,
    password: String,
    createdAt: Date,
    expiresAt: Date,
});

const UserVerification = mongoose.model('User', UserVerificationSchema);
module.exports = UserVerification;