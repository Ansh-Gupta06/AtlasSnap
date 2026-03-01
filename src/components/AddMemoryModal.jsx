import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { saveMediaUrl } from '../api';

export default function AddMemoryModal({ location, onClose, onSuccess }) {
    const [files, setFiles] = useState([]);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        setFiles(selected);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
            f.type.startsWith('image/') || f.type.startsWith('video/')
        );
        setFiles(droppedFiles);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) return;

        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileType = file.type.startsWith('video') ? 'video' : 'photo';

                const formData = new FormData();
                formData.append('image', file);
                const uploadRes = await fetch('https://sodhi.vercel.app/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
                const { url } = await uploadRes.json();

                await saveMediaUrl(location._id, url, fileType, i === 0 ? caption : '');

                setProgress(Math.round(((i + 1) / files.length) * 100));
            }
            onSuccess();
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="torn-paper w-full max-w-lg mx-4 rounded-xl relative"
                initial={{ y: 100, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Washi tape top */}
                <div className="washi-tape washi-tape-top animate-shimmer"
                    style={{ background: 'var(--tape-pink)' }} />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-4 font-handwriting text-2xl text-gray-500 
            hover:text-ink transition-colors z-10"
                >
                    ✕
                </button>

                <h2 className="font-serif text-2xl font-bold text-ink mb-1 relative z-[1]">
                    📸 Add Memory
                </h2>
                <p className="font-handwriting text-lg text-gray-500 mb-5 relative z-[1]">
                    to <span className="text-ink font-semibold">{location.name}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-5 relative z-[1]">
                    {/* Drop Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-200 
              ${dragOver
                                ? 'border-cork bg-yellow-50 scale-[1.02]'
                                : 'border-gray-300 hover:border-cork hover:bg-yellow-50/50'
                            }
              ${files.length > 0 ? 'bg-green-50/50 border-green-300' : ''}
            `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleFileChange}
                        />
                        {files.length > 0 ? (
                            <div>
                                <p className="font-handwriting text-xl text-green-700 mb-2">
                                    ✅ {files.length} file{files.length > 1 ? 's' : ''} selected
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {files.map((f, i) => (
                                        <span key={i} className="sticker sticker-green text-xs">
                                            {f.name.length > 15 ? f.name.slice(0, 15) + '...' : f.name}
                                        </span>
                                    ))}
                                </div>
                                <p className="font-handwriting text-sm text-gray-400 mt-2">
                                    Click to change selection
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-4xl mb-2">📷</p>
                                <p className="font-handwriting text-xl text-gray-500">
                                    Drop photos & videos here
                                </p>
                                <p className="font-handwriting text-sm text-gray-400 mt-1">
                                    or click to browse
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Caption */}
                    <div>
                        <label className="font-handwriting text-lg text-ink block mb-1">
                            ✏️ Caption
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write a short note about this memory..."
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-md
                font-handwriting text-lg text-ink resize-none focus:outline-none 
                focus:border-cork shadow-sm"
                            rows={2}
                        />
                    </div>

                    {/* Progress bar */}
                    {uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-cork h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={files.length === 0 || uploading}
                        className="w-full py-3 bg-cork hover:bg-cork-dark disabled:bg-gray-300 
              text-white font-handwriting text-xl rounded-md shadow-md 
              transition-all duration-200 disabled:cursor-not-allowed"
                    >
                        {uploading
                            ? `Uploading... ${progress}%`
                            : `📌 Pin ${files.length || ''} Memor${files.length !== 1 ? 'ies' : 'y'}`
                        }
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
