"use client";

import "../styles/sections/real-recoveries.css";

const recoveries = [
    {
        type: "Flat Battery",
        location: "Birmingham City Centre",
        description: "Jump start provided for a stranded driver in a multi-storey car park. Recovery to local garage completed within 45 mins.",
        status: "Updates via WhatsApp"
    },
    {
        type: "Low Clearance",
        location: "Coventry",
        description: "Specialized flatbed recovery for a sports car with low ground clearance. Damage-free loading guaranteed.",
        status: "Secure Transport"
    },
    {
        type: "Motorway Breakdown",
        location: "M6 (Junction 6)",
        description: "Emergency recovery from a live lane on the M6. Location pin confirmed and truck dispatched immediately.",
        status: "Safe Destination"
    },
    {
        type: "Locked Wheels",
        location: "Wolverhampton",
        description: "Recovered a vehicle with seized brakes using specialized skates. Professional handling from start to finish.",
        status: "Damage-Free"
    },
    {
        type: "Accident Recovery",
        location: "Walsall",
        description: "Post-accident vehicle recovery to a secure storage facility. Coordinated with emergency services.",
        status: "24/7 Response"
    },
    {
        type: "Transport",
        location: "Solihull to London",
        description: "Pre-booked vehicle transportation for a classic car. Door-to-door service with full insurance coverage.",
        status: "Pre-booked"
    }
];

export default function RealRecoveriesSection() {
    return (
        <section className="real-recoveries">
            <h2>Real Recoveries We Handle Every Week</h2>
            <div className="recoveries-grid">
                {recoveries.map((item, index) => (
                    <div key={index} className="recovery-card">
                        <div className="recovery-header">
                            <span className="recovery-tag">{item.type}</span>
                            <h3>{item.location}</h3>
                        </div>
                        <p>{item.description}</p>
                        <div className="recovery-meta">
                            <span>{item.status}</span>
                            <span>Verified Recovery</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
