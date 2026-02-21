import express from 'express';
import multer from 'multer';
import path from 'path';
import Location from '../models/Location.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Multer config for serverless environment (disk storage is read-only)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext || mime) cb(null, true);
        else cb(new Error('Only image and video files are allowed'));
    }
});

// GET /api/locations — List only current user's locations
router.get('/', async (req, res) => {
    try {
        const locations = await Location.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(locations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/locations/search?name=Paris
router.get('/search', async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return res.status(400).json({ error: 'Name query required' });
        const locations = await Location.find({
            user: req.user.id,
            name: { $regex: name, $options: 'i' }
        }).sort({ createdAt: -1 });
        res.json(locations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/locations/timeline — Get all media across current user's locations, sorted by date
router.get('/timeline', async (req, res) => {
    try {
        const locations = await Location.find({ user: req.user.id, 'media.0': { $exists: true } });
        const timeline = [];
        locations.forEach(loc => {
            loc.media.forEach(m => {
                timeline.push({
                    _id: m._id,
                    url: m.url,
                    type: m.type,
                    caption: m.caption,
                    createdAt: m.createdAt,
                    location: {
                        _id: loc._id,
                        name: loc.name,
                        coordinates: loc.coordinates
                    }
                });
            });
        });
        timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(timeline);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/locations/:id — Get single location (if it belongs to user)
router.get('/:id', async (req, res) => {
    try {
        const location = await Location.findOne({ _id: req.params.id, user: req.user.id });
        if (!location) return res.status(404).json({ error: 'Location not found' });
        res.json(location);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/locations — Create a new location for the current user
router.post('/', async (req, res) => {
    try {
        const { name, coordinates, country } = req.body;
        if (!name || !coordinates) {
            return res.status(400).json({ error: 'Name and coordinates required' });
        }
        const location = new Location({
            name,
            coordinates,
            country,
            user: req.user.id
        });
        await location.save();
        res.status(201).json(location);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/locations/:id/media — Upload media
router.post('/:id/media', upload.single('file'), async (req, res) => {
    try {
        const location = await Location.findOne({ _id: req.params.id, user: req.user.id });
        if (!location) return res.status(404).json({ error: 'Location not found' });

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileName = `${uniqueSuffix}${path.extname(req.file.originalname)}`;
        const fileUrl = `/uploads/${fileName}`; // Note: Files are only stored in memory during the request. External storage (like AWS S3 or Cloudinary) is recommended for persistence.
        const fileType = req.file.mimetype.startsWith('video') ? 'video' : 'photo';

        location.media.push({
            url: fileUrl,
            type: fileType,
            caption: req.body.caption || ''
        });

        await location.save();
        res.status(201).json(location);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/locations/:id/media/:mediaId — Edit caption
router.put('/:id/media/:mediaId', async (req, res) => {
    try {
        const location = await Location.findOne({ _id: req.params.id, user: req.user.id });
        if (!location) return res.status(404).json({ error: 'Location not found' });

        const mediaItem = location.media.id(req.params.mediaId);
        if (!mediaItem) return res.status(404).json({ error: 'Media not found' });

        if (req.body.caption !== undefined) mediaItem.caption = req.body.caption;

        await location.save();
        res.json(location);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/locations/:id/media/:mediaId
router.delete('/:id/media/:mediaId', async (req, res) => {
    try {
        const location = await Location.findOne({ _id: req.params.id, user: req.user.id });
        if (!location) return res.status(404).json({ error: 'Location not found' });

        const mediaItem = location.media.id(req.params.mediaId);
        if (mediaItem) {
            mediaItem.deleteOne();
            await location.save();
        }
        res.json(location);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/locations/:id — Delete a location
router.delete('/:id', async (req, res) => {
    try {
        const result = await Location.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!result) return res.status(404).json({ error: 'Location not found' });
        res.json({ message: 'Location deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
