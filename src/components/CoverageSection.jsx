"use client";

import Link from "next/link";
import "../styles/sections/coverage.css";

export default function CoverageSection() {
    const areas = [
        "Birmingham", "Coventry", "Wolverhampton", "Walsall",
        "Dudley", "Solihull", "West Bromwich", "Sutton Coldfield",
        "Halesowen", "Stourbridge", "Brierley Hill", "Oldbury"
    ];

    const roads = ["M6", "M5", "M42", "M54", "A45", "A38", "A41"];

    return (
        <section className="coverage-section">
            <div className="coverage-content">
                <h2>Areas We Cover in West Midlands & Surrounding Outskirts</h2>
                <p className="coverage-text">
                    We provide 24/7 emergency car recovery and towing services across the entire West Midlands region.
                    No matter where you're stranded, our rapid response team is never far away.
                </p>

                <div className="priority-areas">
                    {areas.map((area) => (
                        <div key={area} className="area-tag">{area}</div>
                    ))}
                </div>

                <div className="roads-list">
                    <strong>Major Routes:</strong>
                    {roads.map((road) => (
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
