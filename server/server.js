require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const locationRoutes = require('./routes/locations');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel-journal';

// Ensure uploads directory exists (only if not on Netlify/Serverless)
const uploadsDir = path.join(__dirname, 'uploads');
if (!process.env.NETLIFY && !fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for serverless
module.exports = app;

// Connect to MongoDB & start server only if not importing (standard node run)
if (require.main === module) {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB');
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
            });
        })
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message);
            console.log('⚠️  Starting server without MongoDB...');
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT} (no database)`);
            });
        });
}
