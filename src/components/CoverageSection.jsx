"use client";

import Link from "next/link";
import "../styles/sections/coverage.css";

export default function CoverageSection({ location, majorRoads, nearbyAreas }) {
    const defaultAreas = [
        "Birmingham", "Coventry", "Wolverhampton", "Walsall",
        "Dudley", "Solihull", "West Bromwich", "Sutton Coldfield",
        "Halesowen", "Stourbridge", "Brierley Hill", "Oldbury"
    ];

    const defaultRoads = ["M6", "M5", "M42", "M54", "A45", "A38", "A41"];

    const displayedAreas = (nearbyAreas && nearbyAreas.length > 0) ? nearbyAreas : defaultAreas;
    const displayedRoads = (majorRoads && majorRoads.length > 0) ? majorRoads : defaultRoads;

    return (
        <section className="coverage-section">
            <div className="coverage-content">
                <h2>Areas We Cover in <span className="location-name">{location || 'West Midlands & Surrounding Outskirts'}</span></h2>
                <p className="coverage-text">
                    We provide 24/7 emergency car recovery and towing services across the entire <span className="location-name">{location || 'West Midlands'}</span> region.
                    No matter where you're stranded, our rapid response team is never far away.
                </p>

                <div className="priority-areas">
                    {displayedAreas.map((area) => (
                        <div key={area} className="area-tag">{area}</div>
                    ))}
                </div>

                <div className="roads-list">
                    <strong>Major Routes:</strong>
                    {displayedRoads.map((road) => (
                        <span key={road} className="road-badge">{road}</span>
                    ))}
                </div>

                <div className="stranded-mini-list">
                    <h4>Where you might be stranded:</h4>
                    <div className="stranded-items">
                        <span className="stranded-item">City Centres</span>
                        <span className="stranded-item">Retail Parks</span>
                        <span className="stranded-item">Residential Areas</span>
                        <span className="stranded-item">Motorways</span>
                        <span className="stranded-item">Industrial Estates</span>
                        <span className="stranded-item">Airports & Stations</span>
                    </div>
                </div>

                <div style={{ marginTop: '30px' }}>
                    <p>Not sure if we cover your area? <strong>Call/WhatsApp and we’ll confirm coverage.</strong></p>
                </div>
            </div>
        </section>
    );
}
