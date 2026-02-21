import { useState, useEffect, useCallback } from 'react';
import MapView from './components/MapView';
import SearchBar from './components/SearchBar';
import ScrapbookView from './components/ScrapbookView';
import AddMemoryModal from './components/AddMemoryModal';
import Timeline from './components/Timeline';
import Login from './components/Login';
import { useAuth } from './context/AuthContext';
import { getLocations, getLocation, createLocation, searchLocations, deleteLocation } from './api';

function App() {
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [showScrapbook, setShowScrapbook] = useState(false);
    const [showAddMemory, setShowAddMemory] = useState(false);
    const [mapCenter, setMapCenter] = useState([20, 0]);
    const [mapZoom, setMapZoom] = useState(3);
    const [flyTo, setFlyTo] = useState(null);
    const [userPosition, setUserPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTimeline, setShowTimeline] = useState(false);
    const { user, loading: authLoading, logout } = useAuth();

    // Fetch all locations on mount
    const fetchLocations = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const data = await getLocations();
            setLocations(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch locations:', err);
            setLocations([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchLocations();
        }
    }, [fetchLocations, user]);

    const handleFlyComplete = useCallback(() => setFlyTo(null), []);

    // Geolocation on mount
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setUserPosition([latitude, longitude]);
                    setMapCenter([latitude, longitude]);
                    setMapZoom(12);
                    setFlyTo({ lat: latitude, lng: longitude, zoom: 12 });
                },
                () => {
                    console.log('Geolocation denied, using default center');
                },
                { timeout: 8000 }
            );
        }
    }, []);

    // Handle pin drop on map
    const handleMapClick = async (lat, lng) => {
        const name = prompt('📍 Name this place:');
        if (!name) return;

        try {
            const newLoc = await createLocation({
                name,
                coordinates: { lat, lng }
            });
            setLocations(prev => [newLoc, ...prev]);
            setSelectedLocation(newLoc);
            setShowAddMemory(true);
        } catch (err) {
            console.error('Failed to create location:', err);
        }
    };

    // Handle location selection (from pin click or search)
    const handleLocationSelect = async (location) => {
        try {
            const fullLoc = await getLocation(location._id);
            setSelectedLocation(fullLoc);
            setShowScrapbook(true);
            setFlyTo({
                lat: fullLoc.coordinates.lat,
                lng: fullLoc.coordinates.lng,
                zoom: 14
            });
        } catch (err) {
            console.error('Failed to load location:', err);
        }
    };

    // Handle search
    const handleSearch = async (query) => {
        try {
            const results = await searchLocations(query);
            if (results.length > 0) {
                handleLocationSelect(results[0]);
            } else {
                // Use geocoding as fallback for map fly-to
                try {
                    const resp = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
                        {
                            headers: {
                                'User-Agent': 'TravelJournalApp/1.0'
                            }
                        }
                    );
                    const geoData = await resp.json();
                    if (geoData.length > 0) {
                        setFlyTo({
                            lat: parseFloat(geoData[0].lat),
                            lng: parseFloat(geoData[0].lon),
                            zoom: 12
                        });
                    }
                } catch (geoErr) {
                    console.error('Geocoding failed:', geoErr);
                }
            }
        } catch (err) {
            console.error('Search failed:', err);
        }
    };

    // Refresh selected location data
    const refreshSelectedLocation = async () => {
        if (selectedLocation) {
            try {
                const fullLoc = await getLocation(selectedLocation._id);
                setSelectedLocation(fullLoc);
                fetchLocations();
            } catch (err) {
                console.error('Failed to refresh:', err);
            }
        }
    };

    // Handle delete location
    const handleDeleteLocation = async (id) => {
        if (!window.confirm('Are you sure you want to delete this place?')) return;
        try {
            await deleteLocation(id);
            setLocations(prev => prev.filter(loc => loc._id !== id));
            if (selectedLocation && selectedLocation._id === id) {
                setSelectedLocation(null);
                setShowScrapbook(false);
                setShowAddMemory(false);
            }
        } catch (err) {
            console.error('Failed to delete location:', err);
            alert('Failed to delete location');
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-corkboard flex items-center justify-center">
                <p className="font-handwriting text-2xl text-ink animate-pulse">
                    Opening your journal... 📔
                </p>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    return (
        <div className="min-h-screen bg-corkboard">
            {/* Header */}
            <header className="relative z-10 bg-paper py-4 px-6 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📒</span>
                        <h1 className="font-serif text-3xl font-bold text-ink tracking-tight">
                            Travel Journal
                        </h1>
                        <span className="sticker sticker-yellow text-sm hidden sm:inline-flex">
                            ✈️ Memories
                        </span>
                        <button
                            onClick={() => setShowTimeline(true)}
                            className="ml-2 bg-white hover:bg-gray-50 text-ink px-3 py-1.5 rounded-md
                font-handwriting text-lg shadow-sm border border-gray-200 transition-colors"
                        >
                            📅 Timeline
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <SearchBar onSearch={handleSearch} />
                        <div className="flex items-center gap-2">
                            <span className="font-handwriting text-lg text-ink hidden md:inline">
                                Hi, {user?.name}
                            </span>
                            <button
                                onClick={logout}
                                className="bg-white hover:bg-red-50 text-red-500 px-3 py-1.5 rounded-md
                                         font-handwriting text-lg shadow-sm border border-red-100 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-[1] max-w-7xl mx-auto p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Map Section */}
                    <div className="lg:col-span-3 relative">
                        <div className="torn-paper rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
                            <div className="washi-tape washi-tape-top animate-shimmer"></div>
                            <div className="paperclip"></div>
                            <h2 className="font-handwriting text-2xl text-ink mb-3 pl-2 relative z-[1]">
                                📌 My Map
                            </h2>
                            <div style={{ height: '450px' }} className="rounded-lg overflow-hidden relative z-[1]">
                                <MapView
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    locations={locations}
                                    onMapClick={handleMapClick}
                                    onLocationSelect={handleLocationSelect}
                                    flyTo={flyTo}
                                    onFlyComplete={handleFlyComplete}
                                    onDelete={handleDeleteLocation}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Recent Locations */}
                    <div className="lg:col-span-2">
                        <div className="torn-paper rounded-lg">
                            <div className="washi-tape washi-tape-top washi-tape-yellow animate-shimmer"></div>
                            <h2 className="font-handwriting text-2xl text-ink mb-4 relative z-[1]">
                                📋 My Places
                            </h2>
                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 relative z-[1]">
                                {loading ? (
                                    <p className="font-handwriting text-lg text-gray-500 text-center py-8">
                                        Loading your memories...
                                    </p>
                                ) : locations.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="font-handwriting text-xl text-gray-500 mb-2">
                                            No places yet! 🗺️
                                        </p>
                                        <p className="font-handwriting text-gray-400">
                                            Click on the map to drop a pin
                                        </p>
                                    </div>
                                ) : (
                                    locations.map((loc) => (
                                        <div
                                            key={loc._id}
                                            className="group relative"
                                        >
                                            <button
                                                onClick={() => handleLocationSelect(loc)}
                                                className="w-full text-left bg-white bg-opacity-80 hover:bg-opacity-100 
                        p-3 rounded-md shadow-paper transition-all duration-200
                        hover:shadow-lifted hover:-translate-y-0.5 border border-gray-100 pr-10"
                                                style={{
                                                    transform: `rotate(${(Math.random() - 0.5) * 2}deg)`
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">📍</span>
                                                    <div>
                                                        <p className="font-serif font-semibold text-ink text-sm">
                                                            {loc.name}
                                                        </p>
                                                        <p className="font-handwriting text-gray-400 text-sm">
                                                            {loc.media?.length || 0} memories ·{' '}
                                                            {new Date(loc.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteLocation(loc._id);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
                                                transition-opacity duration-200 text-red-500 hover:text-red-700
                                                p-2 rounded-full hover:bg-red-50"
                                                title="Delete place"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add memory quick-action */}
                            {selectedLocation && (
                                <button
                                    onClick={() => setShowAddMemory(true)}
                                    className="mt-4 w-full py-3 bg-cork text-white font-handwriting 
                    text-xl rounded-md shadow-md hover:bg-cork-dark transition-colors
                    relative z-[1]"
                                >
                                    📸 Add Memory to {selectedLocation.name}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Scrapbook Full View */}
            {showScrapbook && selectedLocation && (
                <ScrapbookView
                    location={selectedLocation}
                    onClose={() => setShowScrapbook(false)}
                    onAddMemory={() => setShowAddMemory(true)}
                    onRefresh={refreshSelectedLocation}
                />
            )}

            {/* Add Memory Modal */}
            {showAddMemory && selectedLocation && (
                <AddMemoryModal
                    location={selectedLocation}
                    onClose={() => setShowAddMemory(false)}
                    onSuccess={() => {
                        setShowAddMemory(false);
                        refreshSelectedLocation();
                    }}
                />
            )}

            {/* Timeline View */}
            {showTimeline && (
                <Timeline
                    onClose={() => setShowTimeline(false)}
                    onLocationSelect={(loc) => {
                        setShowTimeline(false);
                        handleLocationSelect(loc);
                    }}
                />
            )}
        </div>
    );
}

export default App;
