"use client";

import "../styles/sections/google-reviews.css";
import { Star } from "lucide-react";

export default function GoogleReviewsProof() {
    return (
        <section className="reviews-proof">
            <span className="verified-label">Verified Google Reviews</span>
            <h2>5.0 Rated on Google (407 Reviews)</h2>

            <div className="rating-display">
                <span className="rating-number">5.0</span>
                <div className="stars-large">
                    <Star size={32} fill="#ffb400" stroke="none" />
                    <Star size={32} fill="#ffb400" stroke="none" />
                    <Star size={32} fill="#ffb400" stroke="none" />
                    <Star size={32} fill="#ffb400" stroke="none" />
                    <Star size={32} fill="#ffb400" stroke="none" />
                </div>
            </div>

            <div className="review-samples">
                <div className="review-sample-card">
                    <p>"Excellent service. Arrived in 20 mins as promised. Very professional and polite. Highly recommend ABZ Car Recovery."</p>
                    <span className="review-author">— Sarah J., Birmingham</span>
                </div>
                <div className="review-sample-card">
                    <p>"Locked my keys in the car at 2 AM. They came out immediately and got me back in without any damage. Lifesavers!"</p>
                    <span className="review-author">— Michael T., Coventry</span>
                </div>
                <div className="review-sample-card">
                    <p>"Best prices in the West Midlands. I called around 4 places and ABZ was the most honest and fastest."</p>
                    <span className="review-author">— Dave R., Wolverhampton</span>
                </div>
            </div>

            <p style={{ marginTop: '30px' }}>
                <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'underline' }}>
                    View all 407 reviews on Google Maps
                </a>
            </p>
        </section>
    );
}
