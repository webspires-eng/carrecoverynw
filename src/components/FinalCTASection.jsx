"use client";

import Link from "next/link";
import { Phone, MessageSquare, Star } from "lucide-react";
import "../styles/sections/final-cta.css";
import { useSettings } from "@/components/SettingsProvider";

export default function FinalCTASection() {
    const { phone, whatsapp } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    return (
        <section className="final-cta">
            <div className="final-cta-content">
                <h2>Need 24/7 Car Recovery in West Midlands? Call Now</h2>
                <p>Fast, reliable recovery when you’re stuck — day or night. Send your location pin on WhatsApp and we’ll dispatch the nearest truck.</p>

                <div className="cta-buttons-large">
                    <Link href={`tel:${linkPhone}`} className="cta-btn-main call">
                        <Phone size={24} style={{ display: 'inline', marginRight: '10px' }} />
                        Call Now: {displayPhone}
                    </Link>
                    <Link href={`https://wa.me/${whatsapp}`} target="_blank" className="cta-btn-main whatsapp">
                        <MessageSquare size={24} style={{ display: 'inline', marginRight: '10px' }} />
                        WhatsApp Location
                    </Link>
                </div>

                <div className="final-proof">
                    <div className="proof-item">
                        <Star fill="#fffd00" color="#fffd00" />
                        <span>5.0 Google Rating</span>
                    </div>
                    <div className="proof-item">
                        <span>407+ Reviews</span>
                    </div>
                </div>
                <div style={{ marginTop: '20px', fontSize: '0.9rem', opacity: '0.7' }}>
                    *ETA depends on traffic & exact location.
                </div>
            </div>
        </section>
    );
}
