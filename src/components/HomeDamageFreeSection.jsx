"use client";

import { ShieldCheck, Truck, Anchor, Zap, CheckCircle2, XCircle, Award } from "lucide-react";
import "../styles/sections/damage-free.css";

const protectionPoints = [
    {
        icon: Truck,
        title: "Correct Truck for the Job",
        description: "Modern flatbeds and specialized equipment specifically chosen for your vehicle type."
    },
    {
        icon: Anchor,
        title: "Secure Loading & Strapping",
        description: "Professional soft-strap tie-downs ensure your car is secure without scratching wheels or suspension."
    },
    {
        icon: Zap,
        title: "Low Vehicle Friendly",
        description: "Specialized ramps for sports cars and lowered vehicles to prevent bumper or underbody damage."
    },
    {
        icon: ShieldCheck,
        title: "Trained Operators",
        description: "Our team performs safety checks at every stage of the loading and unloading process."
    }
];

export default function HomeDamageFreeSection() {
    return (
        <section className="damage-free">
            <div className="damage-free-header">
                <span className="damage-badge">Your Vehicle, Protected</span>
                <h2>Damage-Free Recovery: How We Protect Your Vehicle</h2>
                <p className="damage-subtitle">Professional equipment and trained operators ensure your vehicle arrives in the same condition</p>
            </div>

            <div className="damage-free-grid">
                <div className="protection-content">
                    {protectionPoints.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <div key={index} className="protection-item">
                                <div className="protection-icon">
                                    <IconComponent size={24} />
                                </div>
                                <div className="protection-text">
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </div>
                                <div className="item-number">{String(index + 1).padStart(2, '0')}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="visual-diff">
                    <div className="diff-header">
                        <Award size={32} className="diff-header-icon" />
                        <h4>Why the Right Equipment Matters</h4>
                    </div>
                    <div className="diff-box">
                        <div className="diff-item flatbed">
                            <div className="diff-icon good">
                                <CheckCircle2 size={28} />
                            </div>
                            <strong>Our Standards</strong>
                            <ul>
                                <li>Full-support flatbed recovery</li>
                                <li>Zero stress on transmission</li>
                                <li>Soft-strap protection</li>
                                <li>Insurance covered</li>
                            </ul>
                        </div>
                        <div className="diff-divider">
                            <span>VS</span>
                        </div>
                        <div className="diff-item other">
                            <div className="diff-icon bad">
                                <XCircle size={28} />
                            </div>
                            <strong>Cheap Operators</strong>
                            <ul>
                                <li>Generic towing methods</li>
                                <li>AWD system damage risk</li>
                                <li>Low bumper scrapes</li>
                                <li>Limited coverage</li>
                            </ul>
                        </div>
                    </div>
                    <div className="diff-footer">
                        <p>Don't risk damage with cheap operators. Choose professional quality.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
