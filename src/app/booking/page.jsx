"use client";

import Link from "next/link";
import { useState } from "react";
import {
    MapPin, Phone, Clock, Shield, CheckCircle, Send,
    CalendarDays, Car, ArrowRight, Truck
} from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import Footer from "@/components/Footer";
import "../../styles/sections/booking.css";

const POPULAR_LOCATIONS = [
    { name: "Birmingham", slug: "birmingham", county: "West Midlands" },
    { name: "Manchester", slug: "manchester", county: "Greater Manchester" },
    { name: "London", slug: "london", county: "Greater London" },
    { name: "Leeds", slug: "leeds", county: "West Yorkshire" },
    { name: "Sheffield", slug: "sheffield", county: "South Yorkshire" },
    { name: "Liverpool", slug: "liverpool", county: "Merseyside" },
    { name: "Bristol", slug: "bristol", county: "Avon" },
    { name: "Coventry", slug: "coventry", county: "West Midlands" },
    { name: "Wolverhampton", slug: "wolverhampton", county: "West Midlands" },
    { name: "Nottingham", slug: "nottingham", county: "Nottinghamshire" },
    { name: "Leicester", slug: "leicester", county: "Leicestershire" },
    { name: "Derby", slug: "derby", county: "Derbyshire" },
    { name: "Stoke-on-Trent", slug: "stoke-on-trent", county: "Staffordshire" },
    { name: "Bradford", slug: "bradford", county: "West Yorkshire" },
    { name: "Walsall", slug: "walsall", county: "West Midlands" },
    { name: "Dudley", slug: "dudley", county: "West Midlands" },
];

const SERVICE_TYPES = [
    "Car Recovery",
    "Breakdown Assistance",
    "Accident Recovery",
    "Flat Tyre Change",
    "Jump Start / Battery",
    "Vehicle Transport",
    "Long Distance Towing",
    "Motorcycle Recovery",
];

export default function BookingPage() {
    const { phone, whatsapp } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    const [selectedLocation, setSelectedLocation] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        pickupLocation: "",
        dropoffLocation: "",
        serviceType: "",
        vehicleMake: "",
        vehicleModel: "",
        message: "",
    });
    const [status, setStatus] = useState(null);

    const handleLocationChip = (locName) => {
        setSelectedLocation(locName);
        setFormData(prev => ({ ...prev, pickupLocation: locName }));
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (e.target.name === "pickupLocation") {
            setSelectedLocation(e.target.value);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Build WhatsApp message
        const msg = [
            `📋 *New Booking Request*`,
            ``,
            `👤 *Name:* ${formData.name}`,
            `📱 *Phone:* ${formData.phone}`,
            formData.email ? `📧 *Email:* ${formData.email}` : "",
            ``,
            `📍 *Pickup:* ${formData.pickupLocation}`,
            formData.dropoffLocation ? `🏁 *Drop-off:* ${formData.dropoffLocation}` : "",
            `🔧 *Service:* ${formData.serviceType}`,
            ``,
            formData.vehicleMake ? `🚗 *Vehicle:* ${formData.vehicleMake} ${formData.vehicleModel}` : "",
            formData.message ? `💬 *Notes:* ${formData.message}` : "",
        ].filter(Boolean).join("\n");

        const whatsappNumber = whatsapp || (linkPhone.startsWith('0') ? '44' + linkPhone.substring(1) : linkPhone);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

        window.open(whatsappUrl, "_blank");
        setStatus("success");

        setTimeout(() => setStatus(null), 5000);
    };

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

            {/* Hero */}
            <section className="booking-hero">
                <div className="booking-hero-content">
                    <div className="badge">
                        <CalendarDays size={16} />
                        Quick Online Booking
                    </div>
                    <h1>Book Your <span>Car Recovery</span> Now</h1>
                    <p>Fill in the form below and we'll get back to you within minutes. Available 24/7 across the UK for all types of vehicle recovery.</p>
                </div>
            </section>

            {/* Booking Form */}
            <div className="booking-form-container">
                <div className="booking-form-card">
                    <h2 className="form-title">Request a Recovery</h2>
                    <p className="form-subtitle">All fields marked with * are required. We'll respond via WhatsApp instantly.</p>

                    {status === "success" && (
                        <div className="booking-status success">
                            <CheckCircle size={20} />
                            Your booking request has been sent! We'll contact you shortly.
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            {/* Personal Details */}
                            <div className="form-group">
                                <label>Full Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="John Smith"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number <span className="required">*</span></label>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="07XXX XXXXXX"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Service Type <span className="required">*</span></label>
                                <select
                                    name="serviceType"
                                    value={formData.serviceType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select a service...</option>
                                    {SERVICE_TYPES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-divider" />

                            {/* Quick Location Selector */}
                            <div className="form-group full-width location-selector-section">
                                <div className="location-selector-title">
                                    <MapPin size={20} />
                                    Quick Pickup Location
                                </div>
                                <div className="pickup-locations-grid">
                                    {POPULAR_LOCATIONS.slice(0, 9).map(loc => (
                                        <div
                                            key={loc.slug}
                                            className={`location-chip ${selectedLocation === loc.name ? "active" : ""}`}
                                            onClick={() => handleLocationChip(loc.name)}
                                        >
                                            <span className="chip-icon">
                                                <MapPin size={14} />
                                            </span>
                                            {loc.name}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Manual Location Inputs */}
                            <div className="form-group">
                                <label>Pickup Location <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="pickupLocation"
                                    placeholder="e.g. M6 Junction 7, Birmingham"
                                    value={formData.pickupLocation}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Drop-off Location</label>
                                <input
                                    type="text"
                                    name="dropoffLocation"
                                    placeholder="e.g. Your home address or garage"
                                    value={formData.dropoffLocation}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-divider" />

                            {/* Vehicle Details */}
                            <div className="form-group">
                                <label>Vehicle Make</label>
                                <input
                                    type="text"
                                    name="vehicleMake"
                                    placeholder="e.g. BMW, Ford, Toyota"
                                    value={formData.vehicleMake}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Vehicle Model</label>
                                <input
                                    type="text"
                                    name="vehicleModel"
                                    placeholder="e.g. 3 Series, Focus, Corolla"
                                    value={formData.vehicleModel}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Additional Notes */}
                            <div className="form-group full-width">
                                <label>Additional Notes</label>
                                <textarea
                                    name="message"
                                    placeholder="Any additional details about your situation (e.g. car won't start, flat tyre on highway, accident scene)..."
                                    value={formData.message}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Submit */}
                            <button type="submit" className="booking-submit-btn">
                                <Send size={22} />
                                Send Booking Request via WhatsApp
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </form>

                    {/* Trust Badges */}
                    <div className="booking-trust-row">
                        <div className="trust-item">
                            <Clock size={16} />
                            <span>Response in Minutes</span>
                        </div>
                        <div className="trust-item">
                            <Shield size={16} />
                            <span>Fully Insured</span>
                        </div>
                        <div className="trust-item">
                            <CheckCircle size={16} />
                            <span>No Hidden Fees</span>
                        </div>
                        <div className="trust-item">
                            <Truck size={16} />
                            <span>Nationwide Coverage</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Locations  */}
            <section className="popular-locations">
                <h2 className="popular-locations-title">Popular Recovery Locations</h2>
                <p className="popular-locations-subtitle">Quick access to our most requested service areas</p>
                <div className="locations-grid">
                    {POPULAR_LOCATIONS.map(loc => (
                        <Link
                            key={loc.slug}
                            href={`/areas/${loc.slug}`}
                            className="location-card"
                        >
                            <div className="loc-icon">
                                <MapPin size={22} />
                            </div>
                            <h3>{loc.name}</h3>
                            <p>{loc.county}</p>
                        </Link>
                    ))}
                </div>
            </section>

            <Footer />
        </main>
    );
}
