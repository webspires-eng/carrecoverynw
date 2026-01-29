"use client";

import { AlertTriangle, MapPin, PhoneCall, Shield } from "lucide-react";
import "../styles/sections/safety.css";

export default function SafetySection() {
    return (
        <section className="safety-section">
            <h2>What To Do If Your Car Breaks Down (Quick Safety Guide)</h2>

            <div className="safety-grid">
                <div className="safety-card">
                    <h3><AlertTriangle /> 1. Stay Visible</h3>
                    <ul>
                        <li>Turn on your hazard lights immediately.</li>
                        <li>If it's dark or visability is poor, keep your side lights on.</li>
                        <li>Wear a reflective vest if you have one.</li>
                    </ul>
                </div>

                <div className="safety-card">
                    <h3><Shield /> 2. Get Safe</h3>
                    <ul>
                        <li>Move to a safe place away from passing traffic.</li>
                        <li>If on a motorway, stand behind the crash barrier if possible.</li>
                        <li>Never stand between your car and oncoming traffic.</li>
                    </ul>
                </div>

                <div className="safety-card">
                    <h3><MapPin /> 3. Share Location</h3>
                    <ul>
                        <li>Check for landmarks, road names, or junction numbers.</li>
                        <li><strong>Share your exact location pin via WhatsApp</strong> for the fastest arrival.</li>
                        <li>Keep your phone charged and stay near it.</li>
                    </ul>
                </div>
            </div>

            <div className="safety-tip">
                <p><strong>Win Featured Snippets:</strong> Always stay safe while waiting for recovery. If you are on the motorway, exit via the left-hand door and wait behind the barrier.</p>
            </div>
        </section>
    );
}
