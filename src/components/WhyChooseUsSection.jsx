"use client";

import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";

export default function WhyChooseUsSection() {
    const { phone } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    const features = [
        {
            title: "Swift Response",
            description: "Immediate assistance when you need it most."
        },
        {
            title: "24/7 Availability",
            description: "We're here for you around the clock."
        },
        {
            title: "Expertise",
            description: "Skilled staff with years of industry experience."
        }
    ];

    return (
        <section className="layout-6">
            <div className="heading-6">
                <h1>WHY CHOOSE US</h1>
            </div>

            <div className="container-6">
                <div className="image-wrapper-container">
                    <div className="image-wrapper"></div>
                    <div className="image-container"></div>
                </div>

                <div className="text-container">
                    {features.map((feature, index) => (
                        <div key={index}>
                            <div className="service-item2">
                                <CircleCheck size={24} color="white" fill="#3ec56c" />
                                <h2>{feature.title}</h2>
                            </div>
                            <p>{feature.description}</p>
                        </div>
                    ))}

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
                    </div>
                </div>
            </div>
        </section>
    );
}
