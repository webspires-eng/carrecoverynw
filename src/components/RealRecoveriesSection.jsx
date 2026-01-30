"use client";

import { Battery, Car, Route, Lock, TriangleAlert, Truck, CheckCircle2, MapPin } from "lucide-react";
import "../styles/sections/real-recoveries.css";

const defaultRecoveriesList = [
    {
        type: "Flat Battery",
        location_text: "Birmingham City Centre",
        description: "Jump start provided for a stranded driver in a multi-storey car park. Recovery to local garage completed within 45 mins.",
        status_text: "Updates via WhatsApp",
        icon_name: "Battery",
        color_theme: "yellow"
    },
    {
        type: "Low Clearance",
        location_text: "Coventry",
        description: "Specialized flatbed recovery for a sports car with low ground clearance. Damage-free loading guaranteed.",
        status_text: "Secure Transport",
        icon_name: "Car",
        color_theme: "blue"
    },
    {
        type: "Motorway Breakdown",
        location_text: "M6 (Junction 6)",
        description: "Emergency recovery from a live lane on the M6. Location pin confirmed and truck dispatched immediately.",
        status_text: "Safe Destination",
        icon_name: "Route",
        color_theme: "orange"
    },
    {
        type: "Locked Wheels",
        location_text: "Wolverhampton",
        description: "Recovered a vehicle with seized brakes using specialized skates. Professional handling from start to finish.",
        status_text: "Damage-Free",
        icon_name: "Lock",
        color_theme: "green"
    },
    {
        type: "Accident Recovery",
        location_text: "Walsall",
        description: "Post-accident vehicle recovery to a secure storage facility. Coordinated with emergency services.",
        status_text: "24/7 Response",
        icon_name: "TriangleAlert",
        color_theme: "red"
    },
    {
        type: "Transport",
        location_text: "Solihull to London",
        description: "Pre-booked vehicle transportation for a classic car. Door-to-door service with full insurance coverage.",
        status_text: "Pre-booked",
        icon_name: "Truck",
        color_theme: "purple"
    }
];

const iconMap = {
    Battery,
    Car,
    Route,
    Lock,
    TriangleAlert,
    Truck
};

export default function RealRecoveriesSection({ location = "West Midlands", recoveries: dynamicRecoveries = [] }) {
    const recoveriesToDisplay = dynamicRecoveries.length > 0 ? dynamicRecoveries : defaultRecoveriesList;

    return (
        <section className="real-recoveries">
            <div className="recoveries-header">
                <span className="recoveries-badge">Real Results</span>
                <h2>Real Recoveries We Handle Every Week</h2>
                <p className="recoveries-subtitle">See the types of situations we resolve — professionally and promptly in {location}</p>
            </div>

            <div className="recoveries-grid">
                {recoveriesToDisplay.map((item, index) => {
                    const IconComponent = iconMap[item.icon_name] || Truck;
                    // Replace placeholders in text
                    const displayLocation = item.location_text.replaceAll('{{location}}', location);
                    const displayDescription = item.description.replaceAll('{{location}}', location);

                    return (
                        <div key={index} className={`recovery-card recovery-${item.color_theme}`}>
                            <div className="recovery-icon-wrapper">
                                <div className={`recovery-icon icon-${item.color_theme}`}>
                                    <IconComponent size={24} />
                                </div>
                            </div>
                            <div className="recovery-content">
                                <div className="recovery-header">
                                    <span className={`recovery-tag tag-${item.color_theme}`}>{item.type}</span>
                                    <h3>
                                        <MapPin size={16} className="location-icon" />
                                        {displayLocation}
                                    </h3>
                                </div>
                                <p>{displayDescription}</p>
                                <div className="recovery-meta">
                                    <span className="status">
                                        <CheckCircle2 size={14} />
                                        {item.status_text}
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
