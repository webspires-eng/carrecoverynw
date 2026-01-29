"use client";

import Link from "next/link";
import { MessageSquare, CheckCircle2, Clock, MapPin, CarFront, AlertTriangle, Home, Shield, Banknote } from "lucide-react";
import "../styles/sections/pricing.css";
import { useSettings } from "@/components/SettingsProvider";

export default function PricingSection() {
    const { whatsapp } = useSettings();

    return (
        <section className="pricing-section">
            <div className="pricing-header">
                <span className="pricing-badge">No Hidden Fees</span>
                <h2>Transparent Pricing — Know the Cost Before We Tow</h2>
                <p className="pricing-subtitle">We believe in upfront, honest pricing. Get your quote before we lift a wheel.</p>
            </div>

            <div className="pricing-container">
                <div className="pricing-info">
                    <div className="pricing-card includes">
                        <div className="pricing-card-header">
                            <Shield size={24} />
                            <h3>What Your Quote Includes</h3>
                        </div>
                        <ul className="factors-list">
                            <li>
                                <div className="factor-icon success">
                                    <CheckCircle2 size={18} />
                                </div>
                                <span>On-site arrival & secure loading</span>
                            </li>
                            <li>
                                <div className="factor-icon success">
                                    <CheckCircle2 size={18} />
                                </div>
                                <span>Full damage-free recovery to your destination</span>
                            </li>
                            <li>
                                <div className="factor-icon success">
                                    <CheckCircle2 size={18} />
                                </div>
                                <span>Fully insured vehicle transport</span>
                            </li>
                        </ul>
                    </div>

                    <div className="pricing-card affects">
                        <div className="pricing-card-header">
                            <Banknote size={24} />
                            <h3>What Can Affect the Price</h3>
                        </div>
                        <ul className="factors-list">
                            <li>
                                <div className="factor-icon warning">
                                    <MapPin size={18} />
                                </div>
                                <div className="factor-content">
                                    <strong>Distance</strong>
                                    <span>Fixed mileage rates apply</span>
                                </div>
                            </li>
                            <li>
                                <div className="factor-icon warning">
                                    <Clock size={18} />
                                </div>
                                <div className="factor-content">
                                    <strong>Time</strong>
                                    <span>Late-night/early-morning call-outs</span>
                                </div>
                            </li>
                            <li>
                                <div className="factor-icon warning">
                                    <AlertTriangle size={18} />
                                </div>
                                <div className="factor-content">
                                    <strong>Complexity</strong>
                                    <span>Stuck in gear, mud, or off-road</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="price-guarantee">
                        <span className="guarantee-badge">Our Promise</span>
                        <p>"No work starts until you approve the price."</p>
                    </div>
                </div>

                <div className="whatsapp-quote-box">
                    <div className="whatsapp-header">
                        <MessageSquare size={40} className="whatsapp-icon" />
                        <h4>Get a Fast Quote via WhatsApp</h4>
                        <p>Send these 4 details for an instant estimate:</p>
                    </div>
                    <ul className="quote-steps">
                        <li>
                            <span className="step-number">1</span>
                            <MapPin size={20} className="step-icon" />
                            <span>Your Location (Pin/Postcode)</span>
                        </li>
                        <li>
                            <span className="step-number">2</span>
                            <CarFront size={20} className="step-icon" />
                            <span>Vehicle Type</span>
                        </li>
                        <li>
                            <span className="step-number">3</span>
                            <AlertTriangle size={20} className="step-icon" />
                            <span>Issue (Won't start / Accident / Flat)</span>
                        </li>
                        <li>
                            <span className="step-number">4</span>
                            <Home size={20} className="step-icon" />
                            <span>Destination (Home / Garage)</span>
                        </li>
                    </ul>
                    <Link href={`https://wa.me/${whatsapp}`} target="_blank" className="whatsapp-btn-large">
                        <MessageSquare size={24} />
                        WhatsApp Instant Quote
                    </Link>
                    <p className="response-time">Average response: Under 2 minutes</p>
                </div>
            </div>
        </section>
    );
}
