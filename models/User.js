const mongoose = require('mongoose');
const express = require('express')
const Schema = mongoose.Schema;
// const router = express.Router()


const UserSchema = new Schema({
    name: String,
    email: String,
    password: String,
    dateOfBirth: Date
});

const User = mongoose.model('User', UserSchema);
module.exports = User;