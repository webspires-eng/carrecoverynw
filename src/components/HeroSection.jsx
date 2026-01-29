"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { CircleCheck } from "lucide-react";

import { useSettings } from "@/components/SettingsProvider";

export default function HeroSection({ location = "West Midlands" }) {
    const { phone } = useSettings();
    const [isSticky, setIsSticky] = useState(false);

    // Format phone for display (e.g., 0736 054 4819)
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    // Clean phone for links (e.g., 07360544819)
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 600 && window.innerWidth <= 768) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const features = [
        "Rapid Response Time",
        "Transparent Pricing",
        "Latest Tow Trucks",
        "Trusted & Reliable Service",
        "24/7 Car Recovery Service",
        "Damage-Free Car Recovery",
    ];

    return (
        <>
            {/* Mobile Call Banner */}
            <div className={`call-banner ${isSticky ? "is-sticky" : ""}`}>
                <Link href={`tel:${linkPhone}`} className="call-box">
                    <div className="phone-icon">
                        <i className="fas fa-phone"></i>
                    </div>
                    <div className="call-details">
                        <span>{displayPhone}</span>
                        <span className="subtext">24/7 Service • Call Now</span>
                    </div>
                </Link>
                <p className="eta">Arrive in less than 15 Mins</p>
                <p style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>*Arrival times depend on traffic and exact location.</p>
            </div>

            {/* Hero Section */}
            <section className="layout1">
                <div className="title-info">
                    <h4>24 Hours</h4>
                    <h1>Car Recovery Service<br />In <span>{location}</span> &<br />Outskirts</h1>

                    <ul className="service-list">
                        {features.map((feature, index) => (
                            <li key={index}>
                                <CircleCheck size={30} color="white" fill="#158d3dff" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <div className="contact">
                        <Link href={`tel:${linkPhone}`}>
                            <button>
                                {displayPhone}
                                <span>24/7 Service • Call Now</span>
                            </button>
                        </Link>
                        <div className="contact-button">
                            <p>Arrive in less than 15 Mins</p>
                            <p style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>*Arrival times depend on traffic and exact location.</p>
                        </div>
                        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#ffb400', fontSize: '18px' }}>★★★★★</span>
                            <span style={{ fontWeight: '700', color: 'var(--primary-blue)' }}>5.0</span>
                            <span style={{ color: '#666', fontSize: '14px' }}>| 407 Google Reviews</span>
                        </div>
                    </div>
                </div>

                <div className="container-hero">
                    <div className="road"></div>
                    <Image
                        src="/van-CZQXbkbi.webp"
                        alt="Professional tow truck"
                        width={580}
                        height={400}
                        className="van"
                        priority
                    />
                </div>
            </section>
        </>
    );
}
