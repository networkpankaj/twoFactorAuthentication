const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const User = require('../models/User');
require('dotenv').config();

const router = express.Router();

// Error handling middleware
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Sign-up route (POST)
router.post('/signup', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ msg: 'User already exists' });
  }

  user = new User({ email, password });
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  await user.save();

  res.status(201).json({ msg: 'User registered successfully' });
}));

// Sign-in route (POST)
router.post('/signin', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  const authToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({ token: authToken, msg: 'Login successful' });
}));

// 2FA verification route
router.post('/verify-2fa', asyncHandler(async (req, res) => {
  const { email, token } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  const isVerified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token
  });

  if (isVerified) {
    const authToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token: authToken, msg: '2FA verification successful' });
  } else {
    res.status(400).json({ msg: 'Invalid 2FA token' });
  }
}));

// 2FA setup route
router.post('/setup-2fa', asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ msg: 'User not found' });
  }

  const secret = speakeasy.generateSecret();
  user.twoFactorSecret = secret.base32;
  await user.save();

  res.status(200).json({
    secret: secret.base32,
    otpauth_url: secret.otpauth_url
  });
}));

module.exports = router;
