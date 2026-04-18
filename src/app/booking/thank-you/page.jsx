"use client";

import Link from "next/link";
import { CheckCircle, Phone, Clock, Shield, ArrowLeft, MapPin } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import Footer from "@/components/Footer";
import "../../../styles/sections/booking.css";

export default function ThankYouPage() {
    const { phone } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    return (
        <main className="booking-page">
            {/* Header */}
            <header className="booking-header">
                <Link href="/" className="booking-header-logo">
                    CAR <span>RECOVERY</span>
                </Link>
                <nav className="booking-header-nav">
                    <Link href="/">← Home</Link>
                    <Link href={`tel:${linkPhone}`} className="booking-header-call">
                        <Phone size={18} />
                        <span>{displayPhone}</span>
                    </Link>
                </nav>
            </header>

            {/* Thank You Content */}
            <section style={{
                minHeight: '70vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
            }}>
                <div style={{
                    maxWidth: '650px',
                    width: '100%',
                    textAlign: 'center',
                }}>
                    {/* Success Icon */}
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e8f8ee, #d1f5dc)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 30px',
                        animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}>
                        <CheckCircle size={50} color="#158d3d" strokeWidth={2} />
                    </div>

                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 800,
                        color: '#121212',
                        marginBottom: '12px',
                        fontFamily: "'Rubik', sans-serif",
                    }}>
                        Thank You!
                    </h1>

                    <p style={{
                        fontSize: '1.2rem',
                        color: '#555',
                        lineHeight: 1.7,
                        marginBottom: '35px',
                    }}>
                        Your booking request has been received successfully. Our team will review your details and get back to you <strong>within minutes</strong>.
                    </p>

                    {/* Info Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '40px',
                    }}>
                        <div style={{
                            background: '#fff',
                            borderRadius: '14px',
                            padding: '24px 16px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                            border: '1px solid #eef0f4',
                        }}>
                            <Clock size={28} color="#ed4705" style={{ marginBottom: '10px' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121212', marginBottom: '4px' }}>Quick Response</h3>
                            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>We'll call you back within minutes</p>
                        </div>
                        <div style={{
                            background: '#fff',
                            borderRadius: '14px',
                            padding: '24px 16px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                            border: '1px solid #eef0f4',
                        }}>
                            <Shield size={28} color="#253d98" style={{ marginBottom: '10px' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121212', marginBottom: '4px' }}>Fully Insured</h3>
                            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>Your vehicle is in safe hands</p>
                        </div>
                        <div style={{
                            background: '#fff',
                            borderRadius: '14px',
                            padding: '24px 16px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                            border: '1px solid #eef0f4',
                        }}>
                            <MapPin size={28} color="#158d3d" style={{ marginBottom: '10px' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#121212', marginBottom: '4px' }}>Nationwide</h3>
                            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>Covering all of the UK 24/7</p>
                        </div>
                    </div>

                    {/* Urgent Box */}
                    <div style={{
                        background: 'linear-gradient(135deg, #fff7ed, #fff1e6)',
                        border: '1px solid #fed7aa',
                        borderRadius: '14px',
                        padding: '24px 30px',
                        marginBottom: '35px',
                    }}>
                        <p style={{ fontSize: '1rem', color: '#92400e', fontWeight: 600, margin: '0 0 10px' }}>
                            Need immediate help? Call us directly:
                        </p>
                        <Link
                            href={`tel:${linkPhone}`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: '#ed4705',
                                color: '#fff',
                                padding: '14px 32px',
                                borderRadius: '50px',
                                fontSize: '1.2rem',
                                fontWeight: 800,
                                textDecoration: 'none',
                                transition: 'all 0.3s',
                                boxShadow: '0 6px 20px rgba(237,71,5,0.3)',
                            }}
                        >
                            <Phone size={22} />
                            {displayPhone}
                        </Link>
                        <p style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '10px', marginBottom: 0 }}>
                            Available 24/7 including weekends & bank holidays
                        </p>
                    </div>

                    {/* Back Links */}
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#253d98',
                            fontWeight: 600,
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                        }}>
                            <ArrowLeft size={18} />
                            Back to Home
                        </Link>
                        <Link href="/booking" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#ed4705',
                            fontWeight: 600,
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                        }}>
                            Submit Another Request
                        </Link>
                    </div>
                </div>
            </section>

            <style>{`
                @keyframes popIn {
                    0% { transform: scale(0); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @media (max-width: 600px) {
                    .thank-you-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            <Footer />
        </main>
    );
}
