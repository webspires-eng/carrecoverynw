"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import "../styles/sections/faq.css";

const defaultFaqs = [
    {
        q: "How fast can you reach me in West Midlands?",
        a: "We typically arrive within 15 to 30 minutes depending on your location. Our local dispatch system ensures the nearest driver is sent to you immediately."
    },
    {
        q: "Do you cover motorway recovery (M6/M5/M42)?",
        a: "Yes, we specialize in emergency motorway recovery on the M6, M5, M42 and major A-roads. We prioritize motorway call-outs due to safety risks."
    },
    {
        q: "How do I share my location on WhatsApp?",
        a: "Simply tap the '+' or paperclip icon in our WhatsApp chat, select 'Location', and then 'Send Your Current Location' for real-time navigation."
    },
    {
        q: "Can you recover low cars or sports cars damage-free?",
        a: "Yes, we use specialized flatbed recovery trucks and ramps designed for low-clearance vehicles to ensure 100% damage-free loading."
    },
    {
        q: "Can you tow my car to any garage or home address?",
        a: "Yes, we can recover your vehicle to any destination of your choice, whether it's your home address, a preferred local garage, or a dealership."
    },
    {
        q: "What payment methods do you accept?",
        a: "We accept all major credit/debit cards, bank transfers, and cash. You will receive a full receipt for your insurance or records."
    },
    {
        q: "Can I pre-book vehicle transportation?",
        a: "Absolutely. We offer scheduled vehicle transport for dealership pickups, car shows, or moving house. Call us for a customized quote."
    },
    {
        q: "Do you offer jump starts and battery assistance 24/7?",
        a: "Yes, we provide 24/7 jump start services. If your battery is dead, we'll get you started or recover you to a shop if a replacement is needed."
    },
    {
        q: "Will you keep me updated on the driver's ETA?",
        a: "Yes, we keep you updated throughout. You can track our progress via WhatsApp, and we'll call you once the driver is nearly there."
    },
    {
        q: "What areas outside West Midlands do you cover?",
        a: "While we focus on West Midlands (Birmingham, Coventry, etc.), we provide long-distance recovery across the UK if pre-arranged."
    },
    {
        q: "What information do you need when I call?",
        a: "We need your exact location (postcode or landmark), vehicle type, the nature of the issue, and your intended destination."
    },
    {
        q: "Are you available 24/7 including bank holidays?",
        a: "Yes, we are open 24 hours a day, 365 days a year, including Christmas Day, New Year, and all Bank Holidays."
    },
    {
        q: "How much does car recovery cost?",
        a: "Costs depend on distance and complexity. We provide a firm quote before we dispatch, so you know exactly what you'll pay."
    }
];

export default function FAQSection({ customFaqs = [] }) {
    const [activeIndex, setActiveIndex] = useState(null);

    const normalizedCustom = customFaqs.map(f => ({ q: f.question, a: f.answer }));
    const displayFaqs = normalizedCustom.length > 0 ? normalizedCustom : defaultFaqs;

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": displayFaqs.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
            }
        }))
    };

    return (
        <section className="faq-section">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <h2>Car Recovery & Towing FAQs</h2>
            <div className="faq-container">
                {displayFaqs.map((faq, index) => (
                    <div key={index} className={`faq-item ${activeIndex === index ? 'active' : ''}`}>
                        <button className="faq-question" onClick={() => toggleFAQ(index)}>
                            {faq.q}
                            {activeIndex === index ? <ChevronUp /> : <ChevronDown />}
                        </button>
                        <div className="faq-answer">
                            <p>{faq.a.split('.')[0]}.</p>
                            <p>{faq.a.split('.').slice(1).join('.')}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '30px', color: '#888' }}>
                <p>Have more questions? Call us 24/7 for immediate assistance.</p>
            </div>
        </section>
    );
}
