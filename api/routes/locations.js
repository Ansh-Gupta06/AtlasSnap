import express from 'express';
import multer from 'multer';
import Location from '../models/Location.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const locations = await Location.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(locations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

router.get('/:id', async (req, res) => {
    try {
        const location = await Location.findOne({ _id: req.params.id, user: req.user.id });
        if (!location) return res.status(404).json({ error: 'Location not found' });
        res.json(location);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

router.post('/:id/media', upload.single('file'), async (req, res) => {
    try {
        const location = await Location.findOne({ _id: req.params.id, user: req.user.id });
        if (!location) return res.status(404).json({ error: 'Location not found' });

        const formData = new FormData();
        formData.append('image', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);

        const uploadRes = await fetch('https://sodhi.vercel.app/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error(`Sodhi upload failed: ${uploadRes.status}`);
        const { url } = await uploadRes.json();

        location.media.push({
            url,
            type: req.file.mimetype.startsWith('video') ? 'video' : 'photo',
            caption: req.body.caption || ''
        });

        await location.save();
        res.status(201).json(location);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
