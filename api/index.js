import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import locationRoutes from './routes/locations.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ansh:ansh@cluster0.r84hyiw.mongodb.net/travel-journal?retryWrites=true&w=majority&appName=Cluster0';


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - Support both /api/ and root paths for serverless flexibility
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/locations', '/locations'], locationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for serverless
export default app;

// Connect to MongoDB & start server (for local dev / direct node execution)
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
