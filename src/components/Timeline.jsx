import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTimeline } from '../api';

export default function Timeline({ onClose, onLocationSelect }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTimeline();
    }, []);

    const fetchTimeline = async () => {
        try {
            const data = await getTimeline();
            setItems(data);
        } catch (err) {
            console.error('Failed to load timeline:', err);
        } finally {
            setLoading(false);
        }
    };

    // Group by date
    const groupedByDate = Array.isArray(items) ? items.reduce((acc, item) => {
        const dateKey = new Date(item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {}) : {};

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-crumpled w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl
          shadow-2xl mx-4 relative"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-20 bg-paper border-b border-gray-200 px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-serif text-3xl font-bold text-ink flex items-center gap-2">
                                📅 Timeline
                                <span className="sticker sticker-yellow text-sm">
                                    {items.length} memories
                                </span>
                            </h2>
                            <p className="font-handwriting text-gray-500 text-lg mt-1">
                                Your journey through time
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white hover:bg-gray-100 text-ink px-3 py-2 rounded-md
                font-handwriting text-lg shadow-sm border border-gray-200 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Timeline Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="text-center py-16">
                            <p className="font-handwriting text-2xl text-gray-400 animate-pulse">
                                Loading your timeline...
                            </p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="font-handwriting text-3xl text-gray-400 mb-3">
                                No memories yet! 📷
                            </p>
                            <p className="font-handwriting text-xl text-gray-400">
                                Add some photos to see your timeline
                            </p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Vertical timeline line */}
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-cork opacity-40" />

                            <AnimatePresence>
                                {Object.entries(groupedByDate).map(([date, dateItems], groupIdx) => (
                                    <div key={date} className="mb-8">
                                        {/* Date header */}
                                        <motion.div
                                            className="flex items-center gap-3 mb-4 relative z-10"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: groupIdx * 0.1 }}
                                        >
                                            {/* Timeline dot */}
                                            <div className="w-12 h-12 rounded-full bg-cork flex items-center justify-center
                        shadow-md flex-shrink-0 border-4 border-paper">
                                                <span className="text-white text-lg">📌</span>
                                            </div>
                                            <div className="torn-paper py-2 px-4 rounded-md inline-block">
                                                <h3 className="font-serif text-lg font-bold text-ink">
                                                    {date}
                                                </h3>
                                            </div>
                                        </motion.div>

                                        {/* Items for this date */}
                                        <div className="ml-14 space-y-4">
                                            {dateItems.map((item, i) => (
                                                <motion.div
                                                    key={item._id}
                                                    className="bg-white rounded-lg shadow-paper overflow-hidden border border-gray-100
                            hover:shadow-lifted transition-all duration-200 cursor-pointer"
                                                    style={{ transform: `rotate(${(Math.random() - 0.5) * 1.5}deg)` }}
                                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ delay: groupIdx * 0.1 + i * 0.06 }}
                                                    whileHover={{ scale: 1.02, rotate: 0 }}
                                                    onClick={() => {
                                                        if (item.location) {
                                                            onLocationSelect(item.location);
                                                            onClose();
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-stretch">
                                                        {/* Thumbnail */}
                                                        <div className="w-32 h-24 flex-shrink-0 relative">
                                                            {item.type === 'video' ? (
                                                                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                                                                    <video
                                                                        src={item.url}
                                                                        className="w-full h-full object-cover"
                                                                        preload="metadata"
                                                                    />
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                                                        <span className="text-white text-2xl">▶</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <img
                                                                    src={item.url}
                                                                    alt={item.caption}
                                                                    className="w-full h-full object-cover"
                                                                    loading="lazy"
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex-1 p-3 flex flex-col justify-center">
                                                            {item.caption && (
                                                                <p className="font-handwriting text-lg text-ink leading-tight mb-1">
                                                                    "{item.caption}"
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="sticker sticker-blue text-xs">
                                                                    📍 {item.location?.name || 'Unknown'}
                                                                </span>
                                                                <span className="font-handwriting text-xs text-gray-400">
                                                                    {new Date(item.createdAt).toLocaleTimeString('en-US', {
                                                                        hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Arrow */}
                                                        <div className="flex items-center px-3 text-gray-300">
                                                            <span className="text-lg">→</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
