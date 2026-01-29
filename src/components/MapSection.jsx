"use client";

import "../styles/sections/map-section.css";
import { Phone, MapPin, Clock, Building2 } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";

export default function MapSection({ location }) {
    const { business_name, phone, address } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    // Use location or fallback to Birmingham/West Midlands
    const mapQuery = location ? `${location}, UK` : 'West Midlands, UK';
    const serviceAreaText = location ? `${location} & Surrounding Areas` : (address || 'West Midlands & Surrounding Outskirts');

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
                            <p>{serviceAreaText}</p>
                        </div>
                    </div>
                </div>

                <div className="map-wrapper">
                    <iframe
                        width="100%"
                        height="450"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Map showing ${location || 'Service Area'}`}
                    ></iframe>
                </div>
            </div>
        </section>
    );
}
