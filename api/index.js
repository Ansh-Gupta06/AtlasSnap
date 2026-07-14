import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import locationRoutes from './routes/locations.js';
import authRoutes from './routes/auth.js';

// Validate required environment variables
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is required');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Cache the MongoDB connection promise to reuse across serverless invocations
let cachedConnection = null;

async function connectDB() {
    if (cachedConnection) return cachedConnection;
    cachedConnection = mongoose.connect(MONGODB_URI);
    return cachedConnection;
}

// Ensure DB is connected before handling any request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Routes - Support both /api/ and root paths for serverless flexibility
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/locations', '/locations'], locationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel serverless
export default app;

// Start server only in local development (Vercel handles this via serverless)
if (!process.env.VERCEL) {
    connectDB()
        .then(() => {
            console.log('✅ Connected to MongoDB');
            app.listen(PORT, () => {
                console.log(`🚀 Server running on http://localhost:${PORT}`);
            });
        })
        .catch(err => {
            console.error('❌ MongoDB connection error:', err.message);
            process.exit(1);
        });
}
