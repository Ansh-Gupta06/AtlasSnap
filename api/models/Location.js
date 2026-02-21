import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['photo', 'video'], required: true },
  caption: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  country: { type: String, default: '' },
  media: [MediaSchema],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

LocationSchema.index({ name: 'text' });
LocationSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

export default mongoose.model('Location', LocationSchema);
