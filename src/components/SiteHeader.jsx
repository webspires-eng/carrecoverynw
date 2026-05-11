"use client";

import Link from "next/link";
import { useState } from "react";
import { Phone, Menu, X, CalendarCheck } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import "../styles/sections/site-header.css";

export default function SiteHeader() {
    const { phone } = useSettings();
    const [open, setOpen] = useState(false);

    const displayPhone = phone ? phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3') : '0736 054 4819';
    const linkPhone = phone ? phone.replace(/\s+/g, '') : '07360544819';

    return (
        <header className="site-header" role="banner">
            <div className="site-header__inner">
                <Link href="/" className="site-header__logo" aria-label="Car Recovery UK home">
                    <span className="site-header__logo-mark">CAR</span>
                    <span className="site-header__logo-text">RECOVERY <em>UK</em></span>
                </Link>

                <nav
                    className={`site-header__nav ${open ? 'is-open' : ''}`}
                    aria-label="Primary"
                >
                    <Link href="/" onClick={() => setOpen(false)}>Home</Link>
                    <Link href="/areas" onClick={() => setOpen(false)}>Areas We Cover</Link>
                    <Link href="/about-us" onClick={() => setOpen(false)}>About</Link>
                    <Link href="/contact-us" onClick={() => setOpen(false)}>Contact</Link>
                    <Link
                        href="/booking"
                        className="site-header__book"
                        onClick={() => setOpen(false)}
                    >
                        <CalendarCheck size={16} />
                        Book Now
                    </Link>
                </nav>

                <Link href={`tel:${linkPhone}`} className="site-header__call" aria-label={`Call ${displayPhone}`}>
                    <Phone size={16} />
                    <span>{displayPhone}</span>
                </Link>

                <button
                    type="button"
                    className="site-header__toggle"
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                    onClick={() => setOpen(prev => !prev)}
                >
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>
        </header>
    );
}
