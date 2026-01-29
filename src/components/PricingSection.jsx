"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import "../styles/sections/pricing.css";

export default function PricingSection() {
    return (
        <section className="pricing-section">
            <h2>Transparent Pricing — Know the Cost Before We Tow</h2>

            <div className="pricing-container">
                <div className="pricing-info">
                    <h3>What your quote includes:</h3>
                    <ul className="factors-list" style={{ marginBottom: '30px' }}>
                        <li><span>✔</span> On-site arrival & secure loading</li>
                        <li><span>✔</span> Full damage-free recovery to your destination</li>
                        <li><span>✔</span> Fully insured vehicle transport</li>
                    </ul>

                    <h3>What can affect the price:</h3>
                    <ul className="factors-list">
                        <li><span>Distance:</span> Fixed mileage rates apply.</li>
                        <li><span>Time:</span> Late-night/early-morning call-outs.</li>
                        <li><span>Complexity:</span> Stuck in gear, mud, or off-road recoveries.</li>
                    </ul>

                    <p style={{ marginTop: '20px', fontWeight: '800', color: 'var(--primary-blue)' }}>
                        “No work starts until you approve the price.”
                    </p>
                </div>

                <div className="whatsapp-quote-box">
                    <h4>Get a Fast Quote via WhatsApp</h4>
                    <p>Send these 4 details for an instant estimate:</p>
                    <ul className="quote-steps">
                        <li>1. Your Location (Pin/Postcode)</li>
                        <li>2. Vehicle Type</li>
                        <li>3. Issue (Won't start / Accident / Flat tyre)</li>
                        <li>4. Destination (Home / Garage)</li>
                    </ul>
                    <Link href="https://wa.me/447360544819" target="_blank" className="whatsapp-btn-large">
                        <MessageSquare size={24} />
                        WhatsApp Instant Quote
                    </Link>
                </div>
            </div>
        </section>
    );
}
