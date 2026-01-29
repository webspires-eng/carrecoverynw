"use client";

import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import "../styles/sections/404.css";

export default function NotFound() {
    const { phone } = useSettings();
    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1 className="nf-code">404</h1>
                <h2 className="nf-title">Oops! Page Not Found</h2>
                <p className="nf-desc">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>

                <div className="nf-cta">
                    <p className="nf-emergency">Need Emergency Assistance?</p>
                    <Link href={`tel:${linkPhone}`} className="nf-btn-call">
                        Call {displayPhone}
                    </Link>
                </div>

                <Link href="/" className="nf-btn-home">
                    Back to Home Page
                </Link>
            </div>
        </div>
    );
}
