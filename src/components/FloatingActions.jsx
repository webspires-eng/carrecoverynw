"use client";

import { useSettings } from "@/components/SettingsProvider";
import { Phone, CalendarCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FloatingActions() {
    const { phone, whatsapp } = useSettings();
    const [isVisible, setIsVisible] = useState(false);

    const cleanPhone = phone ? phone.replace(/\s+/g, '') : "07360544819";
    const whatsappNumber = whatsapp || (cleanPhone.startsWith('0') ? '44' + cleanPhone.substring(1) : cleanPhone);
    const whatsappLink = `https://wa.me/${whatsappNumber}`;
    const callLink = `tel:${cleanPhone}`;

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 300);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const containerStyle = {
        position: 'fixed',
        right: '20px',
        bottom: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        zIndex: 99999,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(40px)',
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    };

    const iconWrapperBase = {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.3)',
    };

    return (
        <div style={containerStyle}>
            {/* Book Now Button */}
            <Link href="/booking" aria-label="Book Now" style={{ textDecoration: 'none' }}>
                <div style={{ ...iconWrapperBase, background: 'linear-gradient(135deg, #253d98, #1a3a8f)' }}>
                    <CalendarCheck size={28} color="white" />
                </div>
            </Link>
            {/* WhatsApp Button */}
            <Link href={whatsappLink} aria-label="WhatsApp" style={{ textDecoration: 'none' }}>
                <div style={{ ...iconWrapperBase, background: '#25D366' }}>
                    <FaWhatsapp size={32} color="white" />
                </div>
            </Link>
        </div>
    );
}
