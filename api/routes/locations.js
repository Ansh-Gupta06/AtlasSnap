import express from 'express';
import multer from 'multer';
import path from 'path';
import Location from '../models/Location.js';
import authMiddleware from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Multer config — memory storage for serverless (buffer uploaded to Cloudinary)
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

// POST /api/locations/:id/media — Upload media to Cloudinary
router.post('/:id/media', upload.single('file'), async (req, res) => {
    try {
        const location = await Location.findOne({ _id: req.params.id, user: req.user.id });
        if (!location) return res.status(404).json({ error: 'Location not found' });

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileType = req.file.mimetype.startsWith('video') ? 'video' : 'photo';
        const resourceType = fileType === 'video' ? 'video' : 'image';

        // Upload buffer to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'atlassnap',
                    resource_type: resourceType,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        location.media.push({
            url: result.secure_url,
            publicId: result.public_id,
            type: fileType,
            caption: req.body.caption || ''
        });

        await location.save();
        res.status(201).json(location);
    } catch (err) {
        console.error('Upload error:', err);
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

// DELETE /api/locations/:id/media/:mediaId — Delete media from DB and Cloudinary
router.delete('/:id/media/:mediaId', async (req, res) => {
    try {
        const location = await Location.findOne({ _id: req.params.id, user: req.user.id });
        if (!location) return res.status(404).json({ error: 'Location not found' });

        const mediaItem = location.media.id(req.params.mediaId);
        if (mediaItem) {
            // Delete from Cloudinary if publicId exists
            if (mediaItem.publicId) {
                try {
                    const resourceType = mediaItem.type === 'video' ? 'video' : 'image';
                    await cloudinary.uploader.destroy(mediaItem.publicId, {
                        resource_type: resourceType,
                    });
                } catch (cloudErr) {
                    console.error('Cloudinary delete error (non-fatal):', cloudErr.message);
                }
            }
            mediaItem.deleteOne();
            await location.save();
        }
        res.json(location);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/locations/:id — Delete a location and all its Cloudinary media
router.delete('/:id', async (req, res) => {
    try {
        const location = await Location.findOne({ _id: req.params.id, user: req.user.id });
        if (!location) return res.status(404).json({ error: 'Location not found' });

        // Clean up all Cloudinary media for this location
        for (const media of location.media) {
            if (media.publicId) {
                try {
                    const resourceType = media.type === 'video' ? 'video' : 'image';
                    await cloudinary.uploader.destroy(media.publicId, {
                        resource_type: resourceType,
                    });
                } catch (cloudErr) {
                    console.error('Cloudinary delete error (non-fatal):', cloudErr.message);
                }
            }
        }

        await Location.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.json({ message: 'Location deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
