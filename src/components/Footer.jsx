"use client";

import Link from "next/link";
import { Phone, MapPin, Clock, ShieldCheck, ArrowRight } from "lucide-react";

import { useSettings } from "@/components/SettingsProvider";

export default function Footer() {
    const { business_name, phone } = useSettings();
    const currentYear = new Date().getFullYear();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    return (
        <footer className="main-footer">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Brand Section */}
                    <div className="footer-brand">
                        <div className="logo-text">
                            CAR <span>RECOVERY</span>
                        </div>
                        <p className="brand-desc">
                            The UK's most reliable 24/7 vehicle recovery and breakdown service.
                            We get you back on the road safely and swiftly, no matter the time or place.
                        </p>
                        <div className="trust-badge">
                            <ShieldCheck size={20} className="text-orange" />
                            <span>Fully Insured & Certified</span>
                        </div>
                    </div>

                    {/* Services Section */}
                    <div className="footer-column">
                        <h4>Our Services</h4>
                        <ul>
                            <li><Link href="#"><ArrowRight size={14} /> Emergency Towing</Link></li>
                            <li><Link href="#"><ArrowRight size={14} /> Roadside Assistance</Link></li>
                            <li><Link href="#"><ArrowRight size={14} /> Vehicle Transport</Link></li>
                            <li><Link href="#"><ArrowRight size={14} /> Jump Start Services</Link></li>
                            <li><Link href="#"><ArrowRight size={14} /> Battery Replacement</Link></li>
                        </ul>
                    </div>

                    {/* Quick Links Section */}
                    <div className="footer-column">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><Link href="#">About Our Company</Link></li>
                            <li><Link href="/areas">Areas We Cover</Link></li>
                            <li><Link href="#">Safety Guidelines</Link></li>
                            <li><Link href="#">Privacy Policy</Link></li>
                            <li><Link href="#">Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div className="footer-contact-box">
                        <h4>Emergency Contact</h4>
                        <div className="contact-item">
                            <Clock size={18} className="text-orange" />
                            <span>Available 24 Hours / 7 Days</span>
                        </div>
                        <Link href={`tel:${linkPhone}`} className="footer-cta">
                            <Phone size={20} fill="white" />
                            {displayPhone}
                        </Link>
                        <p className="cta-note">Average arrival time: 15-30 mins</p>
                        <div className="dmca-badge">
                            <img
                                src="https://images.dmca.com/Badges/dmca_protected_sml_120n.png?ID=your-id-here"
                                alt="DMCA.com Protection Status"
                            />
                        </div>
                    </div>
                </div>

                <div className="footer-divider"></div>

                <div className="footer-bottom">
                    <p>© {currentYear} {business_name || 'Car Recovery NW'}. All rights reserved.</p>
                    <div className="footer-legal">
                        <span>Designed for Reliability</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
