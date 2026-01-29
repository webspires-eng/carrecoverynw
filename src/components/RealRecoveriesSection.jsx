"use client";

import { Battery, Car, Route, Lock, TriangleAlert, Truck, CheckCircle2, MapPin } from "lucide-react";
import "../styles/sections/real-recoveries.css";

const recoveries = [
    {
        type: "Flat Battery",
        location: "Birmingham City Centre",
        description: "Jump start provided for a stranded driver in a multi-storey car park. Recovery to local garage completed within 45 mins.",
        status: "Updates via WhatsApp",
        icon: Battery,
        color: "yellow"
    },
    {
        type: "Low Clearance",
        location: "Coventry",
        description: "Specialized flatbed recovery for a sports car with low ground clearance. Damage-free loading guaranteed.",
        status: "Secure Transport",
        icon: Car,
        color: "blue"
    },
    {
        type: "Motorway Breakdown",
        location: "M6 (Junction 6)",
        description: "Emergency recovery from a live lane on the M6. Location pin confirmed and truck dispatched immediately.",
        status: "Safe Destination",
        icon: Route,
        color: "orange"
    },
    {
        type: "Locked Wheels",
        location: "Wolverhampton",
        description: "Recovered a vehicle with seized brakes using specialized skates. Professional handling from start to finish.",
        status: "Damage-Free",
        icon: Lock,
        color: "green"
    },
    {
        type: "Accident Recovery",
        location: "Walsall",
        description: "Post-accident vehicle recovery to a secure storage facility. Coordinated with emergency services.",
        status: "24/7 Response",
        icon: TriangleAlert,
        color: "red"
    },
    {
        type: "Transport",
        location: "Solihull to London",
        description: "Pre-booked vehicle transportation for a classic car. Door-to-door service with full insurance coverage.",
        status: "Pre-booked",
        icon: Truck,
        color: "purple"
    }
];

export default function RealRecoveriesSection() {
    return (
        <section className="real-recoveries">
            <div className="recoveries-header">
                <span className="recoveries-badge">Real Results</span>
                <h2>Real Recoveries We Handle Every Week</h2>
                <p className="recoveries-subtitle">See the types of situations we resolve — professionally and promptly</p>
            </div>

            <div className="recoveries-grid">
                {recoveries.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                        <div key={index} className={`recovery-card recovery-${item.color}`}>
                            <div className="recovery-icon-wrapper">
                                <div className={`recovery-icon icon-${item.color}`}>
                                    <IconComponent size={24} />
                                </div>
                            </div>
                            <div className="recovery-content">
                                <div className="recovery-header">
                                    <span className={`recovery-tag tag-${item.color}`}>{item.type}</span>
                                    <h3>
                                        <MapPin size={16} className="location-icon" />
                                        {item.location}
                                    </h3>
                                </div>
                                <p>{item.description}</p>
                                <div className="recovery-meta">
                                    <span className="status">
                                        <CheckCircle2 size={14} />
                                        {item.status}
                                    </span>
                                    <span className="verified">
                                        <CheckCircle2 size={14} />
                                        Verified
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
