"use client";

import "../styles/sections/immediate-help.css";
import { Phone, MessageSquare, MapPin, Send } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";

export default function ImmediateHelpSection() {
    const { phone } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';

    return (
        <section className="immediate-help">
            <h2>Broken Down Now? Get Help in 60 Seconds</h2>

            <div className="help-process">
                <div className="process-card">
                    <Phone className="icon-orange" size={32} style={{ marginBottom: '15px', color: 'var(--primary-orange)' }} />
                    <h3>1. Call / WhatsApp</h3>
                    <p>Contact us immediately at {displayPhone} for a priority response.</p>
                </div>
                <div className="process-card">
                    <MapPin className="icon-orange" size={32} style={{ marginBottom: '15px', color: 'var(--primary-orange)' }} />
                    <h3>2. Share Location Pin</h3>
                    <p>Send your exact location pin via WhatsApp so our driver can find you instantly.</p>
                </div>
                <div className="process-card">
                    <Send className="icon-orange" size={32} style={{ marginBottom: '15px', color: 'var(--primary-orange)' }} />
                    <h3>3. Dispatch & ETA</h3>
                    <p>We dispatch the nearest truck and keep you updated on the exact arrival time.</p>
                </div>
            </div>

            <div className="needs-list-box">
                <h4>What we need for an instant quote:</h4>
                <div className="needs-grid">
                    <span className="need-item">Exact Location</span>
                    <span className="need-item">Vehicle Type</span>
                    <span className="need-item">Nature of Issue</span>
                    <span className="need-item">Destination</span>
                </div>
            </div>

            <div className="safety-strip">
                <p><strong>Safety First:</strong> Please turn your hazards on and move to a safe place. If you are on a motorway, wait behind the crash barrier away from traffic.</p>
            </div>
        </section>
    );
}
