"use client";

import { CircleCheck } from "lucide-react";

export default function ServicesSection({ location = "West Midlands" }) {
    const services = [
        {
            title: "Emergency Breakdown Recovery",
            description: `Available 24/7, our emergency recovery team handles breakdowns, accidents, and roadside issues across ${location} & outskirts.`
        },
        {
            title: "Roadside Assistance",
            description: "Quick fixes for flat tyres, jump starts, and minor mechanical issues to get you moving again fast."
        },
        {
            title: "Vehicle Transportation",
            description: "Safe, fully insured door-to-door transport for cars, vans, and motorcycles locally or nationwide."
        },
        {
            title: "Jump Start Service",
            description: "Fast battery revival service available 24/7. We'll get you started or recover you to a garage."
        },
        {
            title: "Low Vehicle Recovery",
            description: "Specialist flatbed trucks and ramps for sports cars, lowered vehicles, and luxury cars — damage-free guaranteed."
        },
        {
            title: "Motorway Recovery (M6/M5/M42)",
            description: "Priority dispatch for motorway breakdowns. We understand the urgency and safety risks involved."
        }
    ];

    return (
        <section className="layout4">
            <h2 style={{ color: 'var(--primary-orange)', fontSize: '40px', fontWeight: 800, lineHeight: '60px', fontFamily: "'Rubik', sans-serif", textAlign: 'center', marginBottom: '30px' }}>
                24/7 Recovery Services We Provide
            </h2>
            <p style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 40px', color: '#666' }}>
                From emergency breakdowns to scheduled vehicle transport, we cover all your recovery needs in {location} and beyond.
            </p>

            <div className="maintainence">
                <div className="m-image"></div>

                <div className="service2-list">
                    {services.map((service, index) => (
                        <div key={index}>
                            <div className="service-item">
                                <CircleCheck size={22} color="white" fill="#3ec56c" />
                                <h2>{service.title}</h2>
                            </div>
                            <p>{service.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
