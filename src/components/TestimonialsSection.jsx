"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
    {
        image: "/testimonial-1.jpg",
        name: "James Harrison",
        rating: 5,
        text: "Incredible response time! I was stranded in the rain and they were there in 15 minutes. Professional, safe, and very fairly priced."
    },
    {
        image: "/testimonial_woman_white.png",
        name: "Sarah Jenkins",
        rating: 5,
        text: "Absolutely brilliant service. The driver was very helpful and got my car to the garage without any hassle. Highly recommend to everyone!"
    },
    {
        image: "/profile-2-Cyl0lhX-.jpeg",
        name: "David Miller",
        rating: 5,
        text: "Top notch recovery service. Transparent about the cost from the start and no hidden fees. Definitely the best in the West Midlands."
    }
];

export default function TestimonialsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const nextSlide = () => {
        if (!isMobile) return;
        setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        if (!isMobile) return;
        setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    useEffect(() => {
        if (!isMobile) return;
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [isMobile]);

    return (
        <section className="layout5">
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <span style={{ display: 'inline-block', background: '#e6ffed', color: '#1a7f37', padding: '5px 15px', borderRadius: '50px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '15px', border: '1px solid #2da44e33' }}>
                    Verified Google Reviews
                </span>
            </div>
            <h1>5.0 Rated on Google (407 Reviews)</h1>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-blue)' }}>5.0</span>
                <span style={{ color: '#ffb400', fontSize: '2rem' }}>★★★★★</span>
            </div>

            <div className="hrline">
                <hr />
            </div>

            <div className="testimonial-slider-container">
                <div
                    className="testimonial-track"
                    style={{
                        transform: isMobile ? `translateX(-${currentIndex * 100}%)` : 'none',
                        display: 'flex',
                        transition: isMobile ? 'transform 0.5s ease-in-out' : 'none'
                    }}
                >
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="testimonial-slide">
                            <div className="card">
                                <div className="profile-img">
                                    <Image
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        width={100}
                                        height={100}
                                    />
                                </div>
                                <div className="card-body">
                                    <p className="testimonial">"{testimonial.text}"</p>
                                    <div className="rating">
                                        <h5>{testimonial.name}</h5>
                                        <div className="stars">
                                            {"★".repeat(testimonial.rating)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Slider Arrows - Only on Mobile */}
                {isMobile && (
                    <div className="slider-controls">
                        <button onClick={prevSlide} className="slider-arrow prev" aria-label="Previous">
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={nextSlide} className="slider-arrow next" aria-label="Next">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}
            </div>
            <p style={{ textAlign: 'center', marginTop: '30px' }}>
                <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'underline' }}>
                    View all 407 reviews on Google Maps →
                </a>
            </p>
        </section>
    );
}
