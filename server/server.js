const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initDB, getDBMode, sqlitePath } = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
let PORT = parseInt(process.env.PORT || 5001, 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS configuration (flexible in dev, explicit in production)
const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://localhost:5001',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true
}));

// Body parser middleware with sensible limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
app.use('/uploads', express.static(uploadsDir));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint with cloud/database status
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Student Lost & Found Portal API',
    databaseMode: getDBMode(),
    databaseLocation: getDBMode() === 'sqlite' ? sqlitePath : 'Managed PostgreSQL',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Student Lost & Found Portal REST API',
    databaseMode: getDBMode(),
    healthCheck: '/api/health',
    endpoints: {
      items: '/api/items',
      stats: '/api/items/stats',
      auth: '/api/auth'
    }
  });
});

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {})
  });
});

// Listen helper with automatic port fallback if occupied
const listenOnPort = (targetPort, maxRetries = 5) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(targetPort, () => {
      PORT = targetPort;
      console.log(`=================================================`);
      console.log(` 🎓 Lost & Found Portal API running on: http://localhost:${PORT}`);
      console.log(` 💾 Database Mode: ${getDBMode()}`);
      if (getDBMode() === 'sqlite') {
        console.log(` 📁 SQLite File: ${sqlitePath}`);
      }
      console.log(` 🌐 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=================================================`);
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && maxRetries > 0) {
        console.warn(`⚠️ Port ${targetPort} is in use, trying port ${targetPort + 1}...`);
        server.close();
        resolve(listenOnPort(targetPort + 1, maxRetries - 1));
      } else {
        reject(err);
      }
    });
  });
};

// Start server after DB initialization
const startServer = async () => {
  try {
    await initDB();
    const server = await listenOnPort(PORT);
    return server;
  } catch (err) {
    console.error('Failed to start server due to DB initialization error:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
