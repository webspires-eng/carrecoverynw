"use client";

import "../styles/sections/immediate-help.css";
import { Phone, MapPin, Truck } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";

export default function HomeImmediateHelpSection() {
    const { phone } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0778 673 8432';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07786738432';

    return (
        <section className="immediate-help">
            <h2>Broken Down Now? Get Help in 60 Seconds</h2>

            <div className="help-process">
                <div className="process-card">
                    <div className="process-icon">
                        <Phone size={28} strokeWidth={2} />
                    </div>
                    <h3>1. Call / WhatsApp</h3>
                    <p>Contact us immediately at <Link href={`tel:${linkPhone}`} className="phone-link">{displayPhone}</Link> for a priority response.</p>
                </div>
                <div className="process-card">
                    <div className="process-icon">
                        <MapPin size={28} strokeWidth={2} />
                    </div>
                    <h3>2. Share Location Pin</h3>
                    <p>Send your exact location pin via WhatsApp so our driver can find you instantly.</p>
                </div>
                <div className="process-card">
                    <div className="process-icon">
                        <Truck size={28} strokeWidth={2} />
                    </div>
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
