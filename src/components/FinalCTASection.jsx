"use client";

import Link from "next/link";
import { Phone, MessageSquare, Star, Clock, Shield, MapPin } from "lucide-react";
import "../styles/sections/final-cta.css";
import { useSettings } from "@/components/SettingsProvider";

export default function FinalCTASection({ location = "West Midlands" }) {
    const { phone, whatsapp } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    return (
        <section className="final-cta">
            <div className="cta-bg-overlay"></div>
            <div className="final-cta-content">
                <div className="cta-badge-row">
                    <span className="cta-badge">
                        <Clock size={16} />
                        24/7 Available
                    </span>
                    <span className="cta-badge">
                        <Shield size={16} />
                        Fully Insured
                    </span>
                    <span className="cta-badge">
                        <MapPin size={16} />
                        {location}
                    </span>
                </div>

                <h2>Need 24/7 Car Recovery in <span className="location-name">{location}</span>?</h2>
                <p>Fast, reliable recovery when you're stuck — day or night. Send your location pin and we'll dispatch the nearest truck.</p>

                <div className="cta-buttons-large">
                    <Link href={`tel:${linkPhone}`} className="cta-btn-main call">
                        <div className="btn-icon">
                            <Phone size={28} />
                        </div>
                        <div className="btn-text">
                            <span className="btn-label">Call Now</span>
                            <span className="btn-number">{displayPhone}</span>
                        </div>
                    </Link>
                    <Link href={`https://wa.me/${whatsapp}`} target="_blank" className="cta-btn-main whatsapp">
                        <div className="btn-icon">
                            <MessageSquare size={28} />
                        </div>
                        <div className="btn-text">
                            <span className="btn-label">WhatsApp</span>
                            <span className="btn-number">Send Location</span>
                        </div>
                    </Link>
                </div>

                <div className="final-proof">
                    <div className="proof-stars">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={20} fill="#fffd00" color="#fffd00" />
                        ))}
                    </div>
                    <div className="proof-text">
                        <span className="rating">5.0</span>
                        <span className="reviews">1207+ Google Reviews</span>
                    </div>
                </div>

                <p className="cta-disclaimer">*ETA depends on traffic & exact location</p>
            </div>
        </section>
    );
}
