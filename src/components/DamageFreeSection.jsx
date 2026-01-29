"use client";

import { ShieldCheck, Truck, Anchor, Zap } from "lucide-react";
import "../styles/sections/damage-free.css";

export default function DamageFreeSection() {
    return (
        <section className="damage-free">
            <h2>Damage-Free Recovery: How We Protect Your Vehicle</h2>

            <div className="damage-free-grid">
                <div className="protection-content">
                    <div className="protection-item">
                        <div className="protection-icon"><Truck /></div>
                        <div>
                            <h3>Correct Truck for the Job</h3>
                            <p>We use modern flatbeds and specialized equipment specifically chosen for your vehicle type.</p>
                        </div>
                    </div>
                    <div className="protection-item">
                        <div className="protection-icon"><Anchor /></div>
                        <div>
                            <h3>Secure Loading & Strapping</h3>
                            <p>Professional soft-strap tie-downs ensure your car is secure without scratching wheels or suspension.</p>
                        </div>
                    </div>
                    <div className="protection-item">
                        <div className="protection-icon"><Zap /></div>
                        <div>
                            <h3>Low Vehicle Friendly</h3>
                            <p>Specialized ramps for sports cars and lowered vehicles to prevent bumper or underbody damage.</p>
                        </div>
                    </div>
                    <div className="protection-item">
                        <div className="protection-icon"><ShieldCheck /></div>
                        <div>
                            <h3>Trained Operators</h3>
                            <p>Our team performs safety checks at every stage of the loading and unloading process.</p>
                        </div>
                    </div>
                </div>

                <div className="visual-diff">
                    <h4>Why the right equipment matters</h4>
                    <div className="diff-box">
                        <div className="diff-item flatbed">
                            <strong>ABZ Standards</strong>
                            <p>Full-support flatbed recovery. Zero stress on transmission.</p>
                        </div>
                        <div className="diff-item other">
                            <strong>Cheap Operators</strong>
                            <p>Generic towing that can damage AWD systems and low bumpers.</p>
                        </div>
                    </div>
                    <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#888' }}>
                        Differentiate vs cheap tow operators and directories. Choose professional quality.
                    </p>
                </div>
            </div>
        </section>
    );
}
