"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 6 different testimonial sets to rotate across area pages
const testimonialSets = [
    [
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
            text: "Top notch recovery service. Transparent about the cost from the start and no hidden fees. One of the best recovery teams I've ever used."
        }
    ],
    [
        {
            image: "/profile-2-Cyl0lhX-.jpeg",
            name: "Mark Thompson",
            rating: 5,
            text: "Called them at 2am when my car broke down on the motorway. They arrived within 20 minutes and had me sorted in no time. Exceptional service."
        },
        {
            image: "/testimonial-1.jpg",
            name: "Chris Evans",
            rating: 5,
            text: "Very professional team. They handled my vehicle with great care and the whole process was smooth from start to finish. Would use again without hesitation."
        },
        {
            image: "/testimonial_woman_white.png",
            name: "Emma Richardson",
            rating: 5,
            text: "Fantastic experience from start to finish. The operator on the phone was calm and reassuring, and the driver was friendly and efficient."
        }
    ],
    [
        {
            image: "/testimonial_woman_white.png",
            name: "Laura Mitchell",
            rating: 5,
            text: "I was nervous about the cost but they gave me a clear quote upfront with no surprises. The recovery was quick and damage-free. Excellent value."
        },
        {
            image: "/profile-2-Cyl0lhX-.jpeg",
            name: "Robert Clarke",
            rating: 5,
            text: "Had a flat tyre on a busy road and these guys came to the rescue. Polite, fast, and very reasonably priced. Can't recommend them enough."
        },
        {
            image: "/testimonial-1.jpg",
            name: "Thomas Wright",
            rating: 5,
            text: "Used their service twice now and both times have been faultless. Reliable, punctual, and genuinely caring about their customers."
        }
    ],
    [
        {
            image: "/testimonial-1.jpg",
            name: "Andrew Phillips",
            rating: 5,
            text: "My car wouldn't start in a supermarket car park and they were with me in under 25 minutes. Sorted the problem on the spot. Brilliant service."
        },
        {
            image: "/testimonial_woman_white.png",
            name: "Jessica Taylor",
            rating: 5,
            text: "As a woman driving alone at night, I felt very safe with their service. The driver was respectful, efficient, and got me home quickly."
        },
        {
            image: "/profile-2-Cyl0lhX-.jpeg",
            name: "Daniel Cooper",
            rating: 5,
            text: "They recovered my classic car with a flatbed truck and treated it like their own. No scratches, no damage. Absolute professionals."
        }
    ],
    [
        {
            image: "/profile-2-Cyl0lhX-.jpeg",
            name: "Peter Hughes",
            rating: 5,
            text: "Best recovery company I've dealt with. Fair pricing, quick response, and genuinely helpful staff. They went above and beyond for me."
        },
        {
            image: "/testimonial-1.jpg",
            name: "Steven Walker",
            rating: 5,
            text: "Called multiple companies and these were the only ones who could come within the hour. They arrived in 18 minutes. Outstanding response time."
        },
        {
            image: "/testimonial_woman_white.png",
            name: "Rachel Green",
            rating: 5,
            text: "Had an accident and was in shock. The recovery team were so kind and patient, explaining everything clearly. Made a terrible day much more bearable."
        }
    ],
    [
        {
            image: "/testimonial_woman_white.png",
            name: "Hannah Brooks",
            rating: 5,
            text: "My van broke down fully loaded and they managed to recover it safely without any issues. Really impressed with how they handled everything."
        },
        {
            image: "/profile-2-Cyl0lhX-.jpeg",
            name: "Michael Patterson",
            rating: 5,
            text: "Straightforward, honest, and reliable. No upselling, no hidden charges. Just good old-fashioned professional service. Five stars all day long."
        },
        {
            image: "/testimonial-1.jpg",
            name: "George Bennett",
            rating: 5,
            text: "They towed my car 30 miles to my preferred garage and the price was exactly what they quoted on the phone. Trustworthy and dependable."
        }
    ]
];

// Generate a consistent index from the location string so same city always gets same set
function getTestimonialSetIndex(location) {
    let hash = 0;
    for (let i = 0; i < location.length; i++) {
        const char = location.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % testimonialSets.length;
}

export default function TestimonialsSection({ location = "West Midlands" }) {
    const setIndex = getTestimonialSetIndex(location);
    const testimonials = testimonialSets[setIndex];

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
            <h1>5.0 Rated on Google (1207 Reviews)</h1>
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
                    View all 1207 reviews on Google Maps →
                </a>
            </p>
        </section>
    );
}
