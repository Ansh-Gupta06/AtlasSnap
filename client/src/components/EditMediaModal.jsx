import { useState } from 'react';
import { motion } from 'framer-motion';
import { editMedia } from '../api';

export default function EditMediaModal({ locationId, media, onClose, onSuccess }) {
    const [caption, setCaption] = useState(media.caption || '');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await editMedia(locationId, media._id, { caption });
            onSuccess();
        } catch (err) {
            console.error('Edit failed:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
            <motion.div
                className="torn-paper w-full max-w-md mx-4 rounded-xl relative"
                initial={{ y: 80, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 80, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Washi tape */}
                <div className="washi-tape washi-tape-top animate-shimmer"
                    style={{ background: 'var(--tape-green)' }} />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-4 font-handwriting text-2xl text-gray-500
            hover:text-ink transition-colors z-10"
                >
                    ✕
                </button>

                <h2 className="font-serif text-2xl font-bold text-ink mb-4 relative z-[1]">
                    ✏️ Edit Memory
                </h2>

                {/* Preview */}
                <div className="relative z-[1] mb-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    {media.type === 'video' ? (
                        <video src={media.url} controls className="w-full max-h-48 object-cover" />
                    ) : (
                        <img src={media.url} alt={media.caption} className="w-full max-h-48 object-cover" />
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 relative z-[1]">
                    {/* Caption */}
                    <div>
                        <label className="font-handwriting text-lg text-ink block mb-1">
                            ✏️ Edit Caption
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write a caption for this memory..."
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md
                font-handwriting text-lg text-ink resize-none focus:outline-none
                focus:border-cork shadow-sm"
                            rows={3}
                            autoFocus
                        />
                    </div>

                    {/* Date info */}
                    <p className="font-handwriting text-sm text-gray-400">
                        📅 Taken on {new Date(media.createdAt).toLocaleDateString('en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 bg-cork hover:bg-cork-dark disabled:bg-gray-300
                text-white font-handwriting text-xl rounded-md shadow-md
                transition-all duration-200 disabled:cursor-not-allowed"
                        >
                            {saving ? '💾 Saving...' : '💾 Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-3 bg-white hover:bg-gray-50 text-ink font-handwriting
                text-lg rounded-md shadow-sm border border-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
