"use client";

import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";

export default function EmergencySection({ location = "West Midlands" }) {
    const { phone } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    return (
        <section className="layout3">
            <div className="content2">
                <h1>
                    Emergency Towing Service<br />
                    in <span style={{ color: '#fff' }}>{location}</span> & <span style={{ color: '#fff' }}>Outskirts</span>
                </h1>

                <div className="contact-container">
                    <Link href={`tel:${linkPhone}`}>
                        <button className="emergency-btn">
                            {displayPhone}
                            <span className="btn-subtext">24/7 Service • Call Now</span>
                        </button>
                    </Link>
                    <div className="contact-button">
                        <p>Arrive in less than 15 Mins</p>
                        <p style={{ fontSize: '10px', color: '#fff', marginTop: '2px', opacity: 0.8 }}>*Arrival times depend on traffic and exact location.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
