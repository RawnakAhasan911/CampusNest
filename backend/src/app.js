/**
 * Express Application Setup
 * Student Housing & Roommate Finder Full-Stack Application
 */

const express = require('express');
const cors = require('cors');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const listingRoutes = require('./routes/listingRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const requestRoutes = require('./routes/requestRoutes');
const messageRoutes = require('./routes/messageRoutes');
const favouriteRoutes = require('./routes/favouriteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const cryptoRoutes = require('./routes/cryptoRoutes');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Student Housing & Roommate Finder',
    time: new Date().toISOString(),
    cryptoStatus: 'All Cryptographic Primitives Operational (Zero Library Crypto)',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/crypto', cryptoRoutes);

// Serve Frontend Static Assets
const path = require('path');
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// Universal fallback for SPA routing on non-API routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  next();
});

// 404 Route Handler for undefined API endpoints
app.use((req, res) => {
  res.status(404).json({ success: false, message: `API Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
