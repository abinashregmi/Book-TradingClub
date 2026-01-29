require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/book-trading-club')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Routes (to be added)
// app.use('/api/books', require('./routes/bookRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/trades', require('./routes/tradeRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
