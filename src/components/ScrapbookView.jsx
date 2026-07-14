import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteMedia } from '../api';
import EditMediaModal from './EditMediaModal';

const tapeColors = [
    'var(--tape-blue)',
    'var(--tape-pink)',
    'var(--tape-green)',
    'var(--tape-yellow)',
];

const rotations = [-3, -2, -1, 0, 1, 2, 3];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export default function ScrapbookView({ location, onClose, onAddMemory, onRefresh }) {
    const [editingMedia, setEditingMedia] = useState(null);
    const [lightboxUrl, setLightboxUrl] = useState(null);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') setLightboxUrl(null); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const handleDelete = async (mediaId) => {
        if (!confirm('Remove this memory?')) return;
        try {
            await deleteMedia(location._id, mediaId);
            onRefresh();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    return (
        <>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-crumpled w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl 
            shadow-2xl mx-4 relative"
                    initial={{ scale: 0.85, y: 60, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.85, y: 60, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-20 bg-paper border-b border-gray-200 px-6 py-4 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-serif text-3xl font-bold text-ink flex items-center gap-2">
                                    📍 {location.name}
                                    <span className="sticker sticker-blue text-sm">
                                        {location.media?.length || 0} photos
                                    </span>
                                </h2>
                                <p className="font-handwriting text-gray-500 text-lg mt-1">
                                    {location.coordinates.lat.toFixed(4)}°, {location.coordinates.lng.toFixed(4)}° ·
                                    Added {new Date(location.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={onAddMemory}
                                    className="bg-cork hover:bg-cork-dark text-white px-4 py-2 rounded-md
                    font-handwriting text-lg shadow-md transition-colors"
                                >
                                    📸 Add
                                </button>
                                <button
                                    onClick={onClose}
                                    className="bg-white hover:bg-gray-100 text-ink px-3 py-2 rounded-md
                    font-handwriting text-lg shadow-sm border border-gray-200 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Media Grid — Masonry Collage */}
                    <div className="p-6">
                        {(!location.media || location.media.length === 0) ? (
                            <div className="text-center py-16">
                                <p className="font-handwriting text-3xl text-gray-400 mb-3">
                                    No memories here yet! 📷
                                </p>
                                <p className="font-handwriting text-xl text-gray-400">
                                    Add your first photo or video
                                </p>
                                <button
                                    onClick={onAddMemory}
                                    className="mt-6 bg-cork hover:bg-cork-dark text-white px-6 py-3 rounded-lg
                    font-handwriting text-xl shadow-md transition-colors"
                                >
                                    📸 Capture a Memory
                                </button>
                            </div>
                        ) : (
                            <div className="masonry-grid">
                                <AnimatePresence>
                                    {location.media.map((item, i) => {
                                        // Use item ID to seed random values so they don't change on re-render
                                        const seed = (item._id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                                        const rotation = rotations[seed % rotations.length];
                                        const tapeColor = tapeColors[seed % tapeColors.length];
                                        const showTapeTop = (seed % 3) === 0;
                                        const showTapeCorner = (seed % 4) === 0;
                                        const showPaperclip = (seed % 5) === 0;

                                        return (
                                            <motion.div
                                                key={item._id}
                                                className="polaroid relative group"
                                                style={{ transform: `rotate(${rotation}deg)` }}
                                                initial={{ opacity: 0, scale: 0.7, rotate: rotation * 3 }}
                                                animate={{ opacity: 1, scale: 1, rotate: rotation }}
                                                exit={{ opacity: 0, scale: 0.5 }}
                                                transition={{
                                                    type: 'spring',
                                                    damping: 20,
                                                    stiffness: 200,
                                                    delay: i * 0.08,
                                                }}
                                                whileHover={{ scale: 1.04, rotate: 0, zIndex: 20 }}
                                            >
                                                {/* Washi Tape Decorations */}
                                                {showTapeTop && (
                                                    <div
                                                        className="washi-tape washi-tape-top animate-shimmer"
                                                        style={{ background: tapeColor }}
                                                    />
                                                )}
                                                {showTapeCorner && (
                                                    <div
                                                        className="washi-tape washi-tape-top-right animate-shimmer"
                                                        style={{
                                                            background: tapeColors[(seed + 1) % tapeColors.length],
                                                        }}
                                                    />
                                                )}
                                                {showPaperclip && <div className="paperclip" />}

                                                {/* Media */}
                                                {item.type === 'video' ? (
                                                    <video
                                                        src={item.url}
                                                        controls
                                                        className="rounded-sm"
                                                        preload="metadata"
                                                    />
                                                ) : (
                                                    <img
                                                        src={item.url}
                                                        alt={item.caption || 'Travel memory'}
                                                        className="rounded-sm cursor-zoom-in"
                                                        loading="lazy"
                                                        onClick={() => setLightboxUrl(item.url)}
                                                    />
                                                )}

                                                {/* Caption */}
                                                {item.caption && (
                                                    <p className="caption">{item.caption}</p>
                                                )}

                                                {/* Date stamp */}
                                                <p className="font-handwriting text-xs text-gray-400 text-center mt-1">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </p>

                                                {/* Action buttons (Edit/Delete) */}
                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button
                                                        onClick={() => setEditingMedia(item)}
                                                        className="bg-white hover:bg-gray-100 text-ink rounded-full w-8 h-8 
                              flex items-center justify-center shadow-sm text-sm border border-gray-200"
                                                        title="Edit"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="bg-red-400 hover:bg-red-500 text-white rounded-full w-8 h-8 
                              flex items-center justify-center shadow-sm text-sm"
                                                        title="Remove"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            {/* Edit Modal */}
            {editingMedia && (
                <EditMediaModal
                    locationId={location._id}
                    media={editingMedia}
                    onClose={() => setEditingMedia(null)}
                    onSuccess={() => {
                        setEditingMedia(null);
                        onRefresh();
                    }}
                />
            )}

            {/* Lightbox */}
            {lightboxUrl && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.9)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setLightboxUrl(null)}
                >
                    <motion.img
                        src={lightboxUrl}
                        alt="Full view"
                        className="max-w-[92vw] max-h-[92vh] rounded-lg shadow-2xl object-contain"
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setLightboxUrl(null)}
                        className="absolute top-4 right-4 text-white text-3xl font-bold w-10 h-10
                            flex items-center justify-center rounded-full bg-black bg-opacity-50
                            hover:bg-opacity-80 transition-all"
                    >
                        ✕
                    </button>
                </motion.div>
            )}
        </>
    );
}
