"use client";

import Link from "next/link";
import "../styles/sections/coverage.css";

export default function HomeCoverageSection() {
    // Nationwide context for Home Page
    const location = "United Kingdom";

    // Major UK cities for nationwide coverage
    const displayedAreas = [
        "London", "Birmingham", "Manchester", "Glasgow",
        "Leeds", "Liverpool", "Newcastle", "Sheffield",
        "Bristol", "Nottingham", "Leicester", "Cardiff"
    ];

    // Major UK motorways
    const displayedRoads = ["M1", "M6", "M25", "M4", "M5", "M62", "M40", "A1(M)"];

    return (
        <section className="coverage-section">
            <div className="coverage-content">
                <h2>Nationwide Coverage Across the <span className="location-name">{location}</span></h2>
                <p className="coverage-text">
                    We provide 24/7 emergency car recovery and towing services across the entire <span className="location-name">{location}</span>.
                    No matter where you're stranded, our rapid response network is never far away.
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
