"use client";

import { AlertTriangle, MapPin, Shield, CheckCircle2, Lightbulb } from "lucide-react";
import "../styles/sections/safety.css";

const safetySteps = [
    {
        icon: AlertTriangle,
        number: "1",
        title: "Stay Visible",
        color: "yellow",
        points: [
            "Turn on your hazard lights immediately",
            "Keep side lights on if visibility is poor",
            "Wear a reflective vest if available"
        ]
    },
    {
        icon: Shield,
        number: "2",
        title: "Get Safe",
        color: "blue",
        points: [
            "Move away from passing traffic",
            "Stand behind the crash barrier on motorways",
            "Never stand between car and traffic"
        ]
    },
    {
        icon: MapPin,
        number: "3",
        title: "Share Location",
        color: "orange",
        points: [
            "Note landmarks or road names",
            "Share your exact location pin via WhatsApp",
            "Keep your phone charged and accessible"
        ],
        highlight: 1
    }
];

export default function SafetySection() {
    return (
        <section className="safety-section">
            <div className="safety-bg-pattern"></div>
            <div className="safety-container">
                <div className="safety-header">
                    <span className="safety-badge">Stay Safe</span>
                    <h2>What To Do If Your Car Breaks Down</h2>
                    <p className="safety-subtitle">Quick Safety Guide — Follow these steps while waiting for recovery</p>
                </div>

                <div className="safety-grid">
                    {safetySteps.map((step, index) => {
                        const IconComponent = step.icon;
                        return (
                            <div key={index} className={`safety-card card-${step.color}`}>
                                <div className="card-top">
                                    <div className={`step-icon icon-${step.color}`}>
                                        <IconComponent size={28} />
                                    </div>
                                    <span className="step-number">{step.number}</span>
                                </div>
                                <h3>{step.title}</h3>
                                <ul>
                                    {step.points.map((point, pIndex) => (
                                        <li key={pIndex} className={step.highlight === pIndex ? 'highlighted' : ''}>
                                            <CheckCircle2 size={16} className="check-icon" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                <div className="safety-tip">
                    <div className="tip-icon">
                        <Lightbulb size={28} />
                    </div>
                    <div className="tip-content">
                        <h4>Pro Tip</h4>
                        <p>On a motorway? Exit via the <strong>left-hand door</strong> and wait behind the safety barrier.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
