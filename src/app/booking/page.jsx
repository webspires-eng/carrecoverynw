"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin, Phone, Clock, Shield, CheckCircle, Send,
    Car, ArrowRight, ArrowLeft, Truck, Search, AlertCircle,
    User, Mail, Wrench, MessageSquare, Check
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

const STEPS = [
    { id: 1, label: "Location", icon: MapPin },
    { id: 2, label: "Vehicle", icon: Car },
    { id: 3, label: "Contact", icon: User },
];

export default function BookingPage() {
    const { phone } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';
    const router = useRouter();

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
    const [stepError, setStepError] = useState("");

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
                setFormData(prev => ({
                    ...prev,
                    vehicleMake: data.data.make || prev.vehicleMake,
                    vehicleModel: data.data.model || prev.vehicleModel,
                }));
                setDvlaDetails(data.data);
                setDvlaStatus("success");
            } else {
                setDvlaStatus("error");
                setTimeout(() => setDvlaStatus(null), 4000);
            }
        } catch {
            setDvlaStatus("error");
            setTimeout(() => setDvlaStatus(null), 4000);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (stepError) setStepError("");
    };

    const goNext = () => {
        setStepError("");
        if (step === 1) {
            if (!formData.pickupLocation.trim() || !formData.dropoffLocation.trim()) {
                setStepError("Please enter both pickup and drop-off locations.");
                return;
            }
        }
        if (step === 2) {
            if (!dvlaDetails && (!formData.vehicleMake.trim() || !formData.vehicleModel.trim())) {
                setStepError("Please enter your vehicle make and model, or use the registration lookup.");
                return;
            }
        }
        setStep(s => s + 1);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = () => {
        setStepError("");
        setStep(s => s - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStepError("");
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
            <header className="booking-header">
                <Link href="/" className="booking-header-logo">
                    CAR <span>RECOVERY</span>
                </Link>
                <nav className="booking-header-nav">
                    <Link href="/">Home</Link>
                    <Link href={`tel:${linkPhone}`} className="booking-header-call">
                        <Phone size={18} />
                        <span>{displayPhone}</span>
                    </Link>
                </nav>
            </header>

            <section className="booking-hero booking-hero--compact">
                <div className="booking-hero-content">
                    <h1>Book Your <span>Recovery</span> in 60 Seconds</h1>
                    <p>No payment details needed. We&rsquo;ll call or WhatsApp you within minutes to confirm.</p>
                </div>
            </section>

            <div className="booking-form-container">
                <div className="booking-form-card">
                    {/* Stepper */}
                    <ol className="bk-stepper" aria-label="Booking progress">
                        {STEPS.map((s, i) => {
                            const StepIcon = s.icon;
                            const state = step > s.id ? "done" : step === s.id ? "current" : "upcoming";
                            return (
                                <li key={s.id} className={`bk-step bk-step--${state}`}>
                                    <div className="bk-step-circle">
                                        {state === "done" ? <Check size={16} strokeWidth={3} /> : <StepIcon size={16} />}
                                    </div>
                                    <span className="bk-step-label">{s.label}</span>
                                    {i < STEPS.length - 1 && <span className="bk-step-bar" />}
                                </li>
                            );
                        })}
                    </ol>

                    {status === "error" && (
                        <div className="booking-status error">
                            <AlertCircle size={18} />
                            Something went wrong. Please try again or call us directly.
                        </div>
                    )}

                    {stepError && (
                        <div className="booking-status error">
                            <AlertCircle size={18} />
                            {stepError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {step === 1 && (
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label htmlFor="pickupLocation">
                                        Pickup Location <span className="required">*</span>
                                    </label>
                                    <input
                                        id="pickupLocation"
                                        type="text"
                                        name="pickupLocation"
                                        placeholder="e.g. M6 Junction 7, Birmingham"
                                        value={formData.pickupLocation}
                                        onChange={handleChange}
                                        autoComplete="street-address"
                                        required
                                    />
                                    <small className="form-hint">Postcode, road, junction, or what3words.</small>
                                </div>
                                <div className="form-group full-width">
                                    <label htmlFor="dropoffLocation">
                                        Drop-off Location <span className="required">*</span>
                                    </label>
                                    <input
                                        id="dropoffLocation"
                                        type="text"
                                        name="dropoffLocation"
                                        placeholder="e.g. Home address or garage"
                                        value={formData.dropoffLocation}
                                        onChange={handleChange}
                                        autoComplete="street-address"
                                        required
                                    />
                                </div>
                                <div className="bk-actions">
                                    <button type="button" className="bk-btn bk-btn--primary" onClick={goNext}>
                                        Continue
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label htmlFor="registrationNumber">
                                        Registration Number <span className="form-optional">(recommended)</span>
                                    </label>
                                    <div className="bk-reg-input">
                                        <input
                                            id="registrationNumber"
                                            type="text"
                                            name="registrationNumber"
                                            placeholder="AB12 CDE"
                                            value={formData.registrationNumber}
                                            onChange={(e) => {
                                                setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() });
                                                setDvlaDetails(null);
                                                if (dvlaStatus === "error") setDvlaStatus(null);
                                            }}
                                            style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}
                                        />
                                        <button
                                            type="button"
                                            className="bk-btn bk-btn--secondary"
                                            onClick={handleDvlaLookup}
                                            disabled={dvlaStatus === "looking_up" || !formData.registrationNumber}
                                        >
                                            <Search size={16} />
                                            {dvlaStatus === "looking_up" ? "Searching…" : "Find vehicle"}
                                        </button>
                                    </div>
                                    {dvlaStatus === "error" && (
                                        <small className="form-error">
                                            <AlertCircle size={14} />
                                            We couldn&rsquo;t find that vehicle. Enter make &amp; model below.
                                        </small>
                                    )}
                                    {!dvlaDetails && (
                                        <small className="form-hint">We use the DVLA database to fill in your vehicle details automatically.</small>
                                    )}
                                </div>

                                {dvlaDetails ? (
                                    <div className="form-group full-width">
                                        <div className="bk-vehicle-card">
                                            <div className="bk-plate" aria-label="Vehicle registration plate">
                                                <span className="bk-plate-flag">UK</span>
                                                <span className="bk-plate-text">{formData.registrationNumber.toUpperCase()}</span>
                                            </div>

                                            <div className="bk-vehicle-title">
                                                <h3>{dvlaDetails.make}</h3>
                                                <p>
                                                    {[dvlaDetails.yearOfManufacture, dvlaDetails.colour, dvlaDetails.fuelType]
                                                        .filter(Boolean).join(' · ') || 'Vehicle details'}
                                                </p>
                                            </div>

                                            <dl className="bk-vehicle-meta">
                                                {dvlaDetails.engineCapacity && (
                                                    <>
                                                        <dt>Engine</dt>
                                                        <dd>{dvlaDetails.engineCapacity}cc</dd>
                                                    </>
                                                )}
                                                {dvlaDetails.taxStatus && (
                                                    <>
                                                        <dt>Tax</dt>
                                                        <dd>{dvlaDetails.taxStatus}</dd>
                                                    </>
                                                )}
                                                {dvlaDetails.motStatus && (
                                                    <>
                                                        <dt>MOT</dt>
                                                        <dd>{dvlaDetails.motStatus}</dd>
                                                    </>
                                                )}
                                                {dvlaDetails.co2Emissions > 0 && (
                                                    <>
                                                        <dt>CO₂</dt>
                                                        <dd>{dvlaDetails.co2Emissions} g/km</dd>
                                                    </>
                                                )}
                                            </dl>

                                            <button
                                                type="button"
                                                className="bk-btn bk-btn--ghost"
                                                onClick={() => setDvlaDetails(null)}
                                            >
                                                Use a different vehicle
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="vehicleMake">Make <span className="required">*</span></label>
                                            <input
                                                id="vehicleMake"
                                                type="text"
                                                name="vehicleMake"
                                                placeholder="BMW, Ford, Toyota"
                                                value={formData.vehicleMake}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="vehicleModel">Model <span className="required">*</span></label>
                                            <input
                                                id="vehicleModel"
                                                type="text"
                                                name="vehicleModel"
                                                placeholder="3 Series, Focus, Corolla"
                                                value={formData.vehicleModel}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="bk-actions bk-actions--split">
                                    <button type="button" className="bk-btn bk-btn--ghost" onClick={goBack}>
                                        <ArrowLeft size={18} />
                                        Back
                                    </button>
                                    <button type="button" className="bk-btn bk-btn--primary" onClick={goNext}>
                                        Continue
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name <span className="required">*</span></label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        placeholder="John Smith"
                                        value={formData.name}
                                        onChange={handleChange}
                                        autoComplete="name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Phone / WhatsApp <span className="required">*</span></label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        inputMode="tel"
                                        name="phone"
                                        placeholder="07XXX XXXXXX"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        autoComplete="tel"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email <span className="form-optional">(optional)</span></label>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="serviceType">Service Type <span className="required">*</span></label>
                                    <select
                                        id="serviceType"
                                        name="serviceType"
                                        value={formData.serviceType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select a service…</option>
                                        {SERVICE_TYPES.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="message">
                                        Anything Else? <span className="form-optional">(optional)</span>
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        placeholder="e.g. Car won't start, flat tyre on motorway, accident scene…"
                                        value={formData.message}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="bk-actions bk-actions--split">
                                    <button type="button" className="bk-btn bk-btn--ghost" onClick={goBack} disabled={status === "submitting"}>
                                        <ArrowLeft size={18} />
                                        Back
                                    </button>
                                    <button type="submit" className="bk-btn bk-btn--primary" disabled={status === "submitting"}>
                                        {status === "submitting" ? (
                                            <>Sending…</>
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Request Recovery
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="booking-trust-row">
                        <div className="trust-item">
                            <Clock size={16} />
                            <span>Response in minutes</span>
                        </div>
                        <div className="trust-item">
                            <Shield size={16} />
                            <span>Fully insured</span>
                        </div>
                        <div className="trust-item">
                            <CheckCircle size={16} />
                            <span>No hidden fees</span>
                        </div>
                        <div className="trust-item">
                            <Truck size={16} />
                            <span>UK-wide cover</span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="popular-locations">
                <h2 className="popular-locations-title">Popular Recovery Areas</h2>
                <p className="popular-locations-subtitle">Quick access to our most requested service areas</p>
                <div className="locations-grid">
                    {POPULAR_LOCATIONS.map(loc => (
                        <Link
                            key={loc.slug}
                            href={`/areas/${loc.slug}`}
                            className="location-card"
                        >
                            <div className="loc-icon">
                                <MapPin size={20} />
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
