import { useState } from 'react';

export default function SearchBar({ onSearch }) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='Search a city... e.g. "Paris"'
                    className="search-tag w-56 sm:w-72 pl-8 pr-4"
                    id="search-input"
                />
            </div>
            <button
                type="submit"
                className="bg-cork hover:bg-cork-dark text-white px-4 py-2 rounded-md
          font-handwriting text-lg shadow-md transition-colors duration-200"
                id="search-button"
            >
                🔍 Find
            </button>
        </form>
    );
}
