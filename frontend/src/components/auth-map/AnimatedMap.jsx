import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function AnimatedMap({ children }) {
  return (
    <>
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={13}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}
      >
        <TileLayer url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png" />
      </MapContainer>
      
      {/* Dark gradient overlay to blend into the login UI nicely */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        background: 'linear-gradient(to right, #0A0F1C 0%, rgba(10,15,28,0.4) 50%, #0A0F1C 100%)',
        pointerEvents: 'none'
      }} />

      {/* SVG Container for the routes and animations */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
        {children}
      </div>
    </>
  );
}
