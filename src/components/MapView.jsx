import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom pushpin icon
const pushPinIcon = new L.DivIcon({
    className: 'custom-pin',
    html: `<div style="
    width: 28px; height: 28px; position: relative;
  ">
    <div style="
      width: 20px; height: 20px;
      background: radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b);
      border-radius: 50%;
      position: absolute; top: 0; left: 4px;
      box-shadow: 1px 2px 5px rgba(0,0,0,0.35);
    "></div>
    <div style="
      width: 3px; height: 12px;
      background: linear-gradient(#999, #666);
      position: absolute; top: 17px; left: 12px;
      border-radius: 0 0 2px 2px;
    "></div>
  </div>`,
    iconSize: [28, 32],
    iconAnchor: [14, 32],
    popupAnchor: [0, -32],
});

// Component to handle map click events
function MapClickHandler({ onClick }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        }
    });
    return null;
}

// Component to handle flyTo
function FlyToHandler({ flyTo, onComplete }) {
    const map = useMap();

    useEffect(() => {
        if (flyTo) {
            map.flyTo([flyTo.lat, flyTo.lng], flyTo.zoom || 14, {
                duration: 1.8,
                easeLinearity: 0.25
            });

            // Wait for animation to finish before calling onComplete
            const onMoveEnd = () => {
                map.off('moveend', onMoveEnd);
                if (onComplete) onComplete();
            };
            map.on('moveend', onMoveEnd);

            return () => map.off('moveend', onMoveEnd);
        }
    }, [flyTo, map, onComplete]);

    return null;
}

export default function MapView({
    center,
    zoom,
    locations,
    onMapClick,
    onLocationSelect,
    flyTo,
    onFlyComplete,
    onDelete
}) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapClickHandler onClick={onMapClick} />
            <FlyToHandler flyTo={flyTo} onComplete={onFlyComplete} />

            {Array.isArray(locations) && locations.map((loc) => (
                <Marker
                    key={loc._id}
                    position={[loc.coordinates?.lat || 0, loc.coordinates?.lng || 0]}
                    icon={pushPinIcon}
                    eventHandlers={{
                        click: () => onLocationSelect(loc)
                    }}
                >
                    <Popup minWidth={200}>
                        <div style={{ fontFamily: "'Caveat', cursive", fontSize: '1.15rem' }}>
                            <div className="mb-2 flex justify-between items-start">
                                <div>
                                    <strong style={{ fontSize: '1.3rem' }}>{loc.name}</strong>
                                    <br />
                                    <span style={{ color: '#888', fontSize: '0.9rem' }}>
                                        {loc.media?.length || 0} memories
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(loc._id);
                                    }}
                                    className="text-red-500 hover:text-red-700 ml-2"
                                    title="Delete place"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                >
                                    🗑️
                                </button>
                            </div>

                            {/* Photo Previews */}
                            {loc.media && loc.media.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                                    {loc.media.slice(0, 3).map((m, i) => (
                                        <div key={i} style={{
                                            width: '40px', height: '40px',
                                            borderRadius: '4px', overflow: 'hidden',
                                            border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }}>
                                            {m.type === 'video' ? (
                                                <div style={{ width: '100%', height: '100%', background: '#333' }} />
                                            ) : (
                                                <img
                                                    src={m.url}
                                                    alt=""
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    {loc.media.length > 3 && (
                                        <div style={{
                                            width: '40px', height: '40px',
                                            borderRadius: '4px', background: '#f0f0f0',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.8rem', color: '#888', border: '1px border #ccc'
                                        }}>
                                            +{loc.media.length - 3}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
