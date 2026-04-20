"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
    "Other",
];

export default function BookingPage() {
    const { phone, whatsapp } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';
    const router = useRouter();

    const [selectedLocation, setSelectedLocation] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        pickupLocation: "",
        dropoffLocation: "",
        serviceType: "",
        registrationNumber: "",
        vehicleMake: "",
        vehicleModel: "",
        message: "",
    });
    const [status, setStatus] = useState(null);
    const [dvlaStatus, setDvlaStatus] = useState(null);
    const [dvlaDetails, setDvlaDetails] = useState(null);
    const [step, setStep] = useState(1);

    const handleDvlaLookup = async () => {
        if (!formData.registrationNumber) return;
        
        setDvlaStatus("looking_up");
        try {
            const res = await fetch('/api/dvla', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationNumber: formData.registrationNumber }),
            });
            const data = await res.json();

            if (data.success && data.data) {
                const make = data.data.make || formData.vehicleMake;
                const model = data.data.model || formData.vehicleModel;
                
                setFormData(prev => ({
                    ...prev,
                    vehicleMake: make,
                    vehicleModel: model,
                }));
                setDvlaDetails(data.data);
                setDvlaStatus("success");
                setTimeout(() => setDvlaStatus(null), 3000);
            } else {
                setDvlaStatus("error");
                setTimeout(() => setDvlaStatus(null), 3000);
            }
        } catch (error) {
            setDvlaStatus("error");
            setTimeout(() => setDvlaStatus(null), 3000);
        }
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("submitting");

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (!data.success) {
                setStatus("error");
                setTimeout(() => setStatus(null), 5000);
                return;
            }

            router.push('/booking/thank-you');
        } catch {
            setStatus("error");
            setTimeout(() => setStatus(null), 5000);
        }
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

                    {status === "error" && (
                        <div className="booking-status error">
                            Something went wrong. Please try again or call us directly.
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <h3 style={{ marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: "600" }}>Step 1: Recovery Locations</h3>
                                </div>
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
                                    <label>Drop-off Location <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="dropoffLocation"
                                        placeholder="e.g. Your home address or garage"
                                        value={formData.dropoffLocation}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group full-width" style={{ marginTop: "1rem" }}>
                                    <button 
                                        type="button" 
                                        className="booking-submit-btn"
                                        onClick={() => {
                                            if (!formData.pickupLocation || !formData.dropoffLocation) {
                                                alert("Please fill in both pickup and drop-off locations");
                                                return;
                                            }
                                            setStep(2);
                                        }}
                                    >
                                        Next: Vehicle Details
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="form-grid">
                                <div className="form-group full-width" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Step 2: Vehicle Details</h3>
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", padding: "0.5rem" }}
                                    >
                                        ← Back to Step 1
                                    </button>
                                </div>

                                <div className="form-group full-width">
                                    <label>Registration Number (Optional)</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            name="registrationNumber"
                                            placeholder="e.g. AB12 CDE"
                                            value={formData.registrationNumber}
                                            style={{ textTransform: 'uppercase' }}
                                            onChange={(e) => {
                                                setFormData({...formData, registrationNumber: e.target.value.toUpperCase()});
                                                setDvlaDetails(null);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleDvlaLookup}
                                            disabled={dvlaStatus === "looking_up" || !formData.registrationNumber}
                                            style={{
                                                padding: '0 20px',
                                                backgroundColor: '#2563eb',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {dvlaStatus === "looking_up" ? "Looking up..." : "Find Vehicle"}
                                        </button>
                                    </div>
                                    {dvlaStatus === "error" && <small style={{ color: 'red', marginTop: '6px', display: 'block', fontWeight: '500' }}>Could not find vehicle. Please enter details manually.</small>}
                                </div>

                                {dvlaDetails ? (
                                    <div className="form-group full-width">
                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                                <div style={{ background: '#fbbf24', borderRadius: '6px', display: 'flex', alignItems: 'center', border: '2px solid #000', overflow: 'hidden', width: '280px', height: '60px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                                    <div style={{ background: '#1d4ed8', color: '#fff', padding: '0 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                                                        <span style={{ fontSize: '10px' }}>🇬🇧</span>
                                                        <span style={{ fontSize: '12px' }}>UK</span>
                                                    </div>
                                                    <div style={{ flex: 1, textAlign: 'center', fontSize: '28px', fontWeight: 'bold', color: '#000', letterSpacing: '2px', fontFamily: 'monospace' }}>
                                                        {formData.registrationNumber.toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>{dvlaDetails.make}</h3>
                                                <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    {dvlaDetails.yearOfManufacture || 'N/A'} • {dvlaDetails.colour || 'N/A'} • {dvlaDetails.fuelType || 'N/A'}
                                                </p>
                                            </div>
                                            
                                            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 16px' }} />
                                            
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                                                <div style={{ color: '#64748b' }}>Engine</div>
                                                <div style={{ textAlign: 'right', fontWeight: '600' }}>{dvlaDetails.engineCapacity ? `${dvlaDetails.engineCapacity}cc` : 'N/A'}</div>
                                                
                                                <div style={{ color: '#64748b' }}>Tax</div>
                                                <div style={{ textAlign: 'right', fontWeight: '600' }}>{dvlaDetails.taxStatus || 'N/A'}</div>
                                                
                                                <div style={{ color: '#64748b' }}>MOT</div>
                                                <div style={{ textAlign: 'right', fontWeight: '600' }}>{dvlaDetails.motStatus || 'N/A'}</div>
                                                
                                                {dvlaDetails.co2Emissions && dvlaDetails.co2Emissions > 0 ? (
                                                    <>
                                                        <div style={{ color: '#64748b' }}>CO₂</div>
                                                        <div style={{ textAlign: 'right', fontWeight: '600' }}>{dvlaDetails.co2Emissions} g/km</div>
                                                    </>
                                                ): null}
                                            </div>

                                            <button type="button" onClick={() => setDvlaDetails(null)} style={{ marginTop: '24px', width: '100%', padding: '14px', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '16px' }}>
                                                Change car
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label>Vehicle Make <span className="required">*</span></label>
                                            <input
                                                type="text"
                                                name="vehicleMake"
                                                placeholder="e.g. BMW, Ford, Toyota"
                                                value={formData.vehicleMake}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Vehicle Model <span className="required">*</span></label>
                                            <input
                                                type="text"
                                                name="vehicleModel"
                                                placeholder="e.g. 3 Series, Focus, Corolla"
                                                value={formData.vehicleModel}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="form-group full-width" style={{ marginTop: "1rem" }}>
                                    <button 
                                        type="button" 
                                        className="booking-submit-btn"
                                        onClick={() => {
                                            if (!dvlaDetails && (!formData.vehicleMake || !formData.vehicleModel)) {
                                                alert("Please enter your vehicle make and model.");
                                                return;
                                            }
                                            setStep(3);
                                        }}
                                    >
                                        Next: Contact Details
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="form-grid">
                                <div className="form-group full-width" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Step 3: Contact Info & Service</h3>
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)}
                                        style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", padding: "0.5rem" }}
                                    >
                                        ← Back to Step 2
                                    </button>
                                </div>

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
                                    <label>Email Address <span className="required">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
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

                                <div className="form-group full-width">
                                    <label>Additional Notes</label>
                                    <textarea
                                        name="message"
                                        placeholder="Any additional details about your situation (e.g. car won't start, flat tyre on highway, accident scene)..."
                                        value={formData.message}
                                        onChange={handleChange}
                                    />
                                </div>

                                <button type="submit" className="booking-submit-btn">
                                    <Send size={22} />
                                    Get a Quote Now
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        )}
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
