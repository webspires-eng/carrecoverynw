"use client";

import Image from "next/image";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";

export default function StepsSection() {
    const { phone } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    const steps = [
        {
            icon: "/call-3-CKgjkqAH.png",
            title: "CONTACT AND DISPATCH",
            description: "We have fast response. From all emergency towing inquiries made it easier to accomplish by doing proper procedures."
        },
        {
            icon: "/truckicon.png",
            title: "SECURE TOWING",
            description: "Once we have your car, we will securely tow your vehicle to your desired final destination. We will ensure complete damage-free towing."
        },
        {
            icon: "/call-5-QnYEx6Ul.png",
            title: "TRANSPARENT BILLING",
            description: "All bills are transparent and fair pricing. Before we begin recovering your car, we make sure you know the price."
        }
    ];

    return (
        <section className="layout2">
            <h1>Get Your Car Recovered</h1>
            <h3>in 3 Easy Steps</h3>

            <div className="service">
                {steps.map((step, index) => (
                    <div key={index} className="contact1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Image
                            src={step.icon}
                            alt={step.title}
                            width={118}
                            height={118}
                            className="call"
                            style={{ objectFit: 'contain' }}
                        />
                        <h2 style={{
                            fontFamily: 'Rubik, sans-serif',
                            fontWeight: 800,
                            fontSize: '22px',
                            color: '#ED4705',
                            lineHeight: '22px',
                            marginTop: '20px',
                            marginBottom: '10px'
                        }}>
                            {step.title}
                        </h2>
                        <p>{step.description}</p>
                    </div>
                ))}
            </div>

            <div className="contact" style={{ marginTop: '30px', alignItems: 'center' }}>
                <Link href={`tel:${linkPhone}`}>
                    <button>
                        {displayPhone}
                        <span>24/7 Service • Call Now</span>
                    </button>
                </Link>
                <div className="contact-button" style={{ textAlign: 'center' }}>
                    <p>Arrive in less than 15 Mins</p>
                    <p style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>*Arrival times depend on traffic and exact location.</p>
                </div>
            </div>
        </section>
    );
}
