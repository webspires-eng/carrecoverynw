"use client";

import "../styles/sections/map-section.css";
import { Phone, MapPin, Clock, Building2 } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";

export default function MapSection() {
    const { business_name, phone, address } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    return (
        <section className="map-section">
            <h2>Find Us / Service Area Map</h2>

            <div className="map-container-grid">
                <div className="nap-block">
                    <h3>Official Business NAP</h3>

                    <div className="nap-item">
                        <div className="icon-circle"><Building2 size={24} /></div>
                        <div>
                            <h4>Business Name</h4>
                            <p>{business_name || 'Car Recovery UK Services Ltd'}</p>
                        </div>
                    </div>

                    <div className="nap-item">
                        <div className="icon-circle"><Phone size={24} /></div>
                        <div>
                            <h4>Emergency Phone</h4>
                            <p><a href={`tel:${linkPhone}`} style={{ textDecoration: 'none', color: 'inherit' }}>{displayPhone}</a></p>
                        </div>
                    </div>

                    <div className="nap-item">
                        <div className="icon-circle"><Clock size={24} /></div>
                        <div>
                            <h4>Service Hours</h4>
                            <p>Available 24/7 (Emergency & Pre-booked)</p>
                        </div>
                    </div>

                    <div className="nap-item">
                        <div className="icon-circle"><MapPin size={24} /></div>
                        <div>
                            <h4>Primary Service Area</h4>
                            <p>{address || 'West Midlands & Surrounding Outskirts (Birmingham, Coventry, Wolverhampton, etc.)'}</p>
                        </div>
                    </div>
                </div>

                <div className="map-wrapper">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d155424.36395345717!2d-2.0306437505191986!3d52.497217346387!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4870942d1b417173%3A0xca81f1a4208a3562!2sBirmingham!5e0!3m2!1sen!2suk!4v1706530000000!5m2!1sen!2suk"
                        width="600"
                        height="450"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Google Map showing West Midlands Service Area"
                    ></iframe>
                </div>
            </div>
        </section>
    );
}
