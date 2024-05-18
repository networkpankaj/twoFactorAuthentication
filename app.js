const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  throw new Error('MONGO_URI is not defined in the environment variables');
}

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Routes
app.use('/api/auth', require('./routes/auth'));

// Serve signup page
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + '/public/signup.html');
});

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);  // Log the error stack
  res.status(500).json({ msg: 'Something went wrong!', error: err.message });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
