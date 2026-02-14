"use client";

import { CarFront, MapPin, Users, Lightbulb, CheckCircle2 } from "lucide-react";
import "../styles/sections/service-boundaries.css";

export default function HomeServiceBoundaries() {
    return (
        <section className="service-boundaries">
            <div className="boundaries-header">
                <span className="section-badge">Quick Info Needed</span>
                <h2>Before We Dispatch: Tell Us These Details</h2>
                <p className="section-subtitle">Help us send the right equipment first time — no delays, no surprises</p>
            </div>

            <div className="boundaries-grid">
                <div className="boundary-card">
                    <div className="card-icon-wrapper">
                        <div className="card-icon">
                            <CarFront size={28} />
                        </div>
                        <span className="card-number">01</span>
                    </div>
                    <h3>Vehicle Condition</h3>
                    <ul>
                        <li>
                            <CheckCircle2 size={16} className="list-icon" />
                            <span>Are the wheels locked or stuck in park?</span>
                        </li>
                        <li>
                            <CheckCircle2 size={16} className="list-icon" />
                            <span>Heavy accident damage to suspension?</span>
                        </li>
                        <li>
                            <CheckCircle2 size={16} className="list-icon" />
                            <span>Low-clearance or sports car?</span>
                        </li>
                        <li>
                            <CheckCircle2 size={16} className="list-icon" />
                            <span>Stuck in deep mud, snow, or ditch?</span>
                        </li>
                    </ul>
                </div>

                <div className="boundary-card featured">
                    <div className="card-icon-wrapper">
                        <div className="card-icon">
                            <MapPin size={28} />
                        </div>
                        <span className="card-number">02</span>
                    </div>
                    <h3>Your Location</h3>
                    <ul>
                        <li>
                            <CheckCircle2 size={16} className="list-icon" />
                            <span>On a live lane or motorway hard shoulder?</span>
                        </li>
                        <li>
                            <CheckCircle2 size={16} className="list-icon" />
                            <span>Multi-storey or underground car park?</span>
                        </li>
                        <li>
                            <CheckCircle2 size={16} className="list-icon" />
                            <span>Any height restrictions for tow trucks?</span>
                        </li>
                    </ul>
                </div>

                <div className="boundary-card">
                    <div className="card-icon-wrapper">
                        <div className="card-icon">
                            <Users size={28} />
                        </div>
                        <span className="card-number">03</span>
                    </div>
                    <h3>Safety & Passengers</h3>
                    <ul>
                        <li>
                            <CheckCircle2 size={16} className="list-icon" />
                            <span>Any passengers (children or pets)?</span>
                        </li>
                        <li>
                            <CheckCircle2 size={16} className="list-icon" />
                            <span>Are you in a safe location?</span>
                        </li>
                        <li>
                            <CheckCircle2 size={16} className="list-icon" />
                            <span>Need transport for multiple people?</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="boundary-footer">
                <div className="footer-content">
                    <Lightbulb className="footer-icon" size={32} />
                    <div className="footer-text">
                        <h4>Why This Matters</h4>
                        <p>Providing these details allows us to dispatch the <strong>correct equipment immediately</strong>, preventing any delays or complications upon arrival.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
