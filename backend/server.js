require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/income', require('./routes/income'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/goals', require('./routes/goals'));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  }
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});



app.listen(PORT, () => {
  console.log(`\n  MoneyMint is running!`);
  console.log(`  `);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Dev:     http://localhost:${PORT}\n`);
});

