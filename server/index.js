const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const app = express();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visualization_dashboard';

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Data Visualization Dashboard API',
    version: '1.0.0',
    endpoints: ['/api/data', '/api/filters', '/api/stats', '/health']
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start server
const startServer = async () => {
  try {
    console.log('\n🚀 Starting API Server...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
    
    const Data = require('./models/Data');
    const count = await Data.countDocuments();
    console.log(`📊 ${count} records in database`);
    
    if (count === 0) console.log('⚠️  Run "node seed.js" to populate database');
    
    app.listen(PORT, () => {
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`📌 API: http://localhost:${PORT}/api/data\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
