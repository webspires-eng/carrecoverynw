"use client";

import { useSettings } from "@/components/SettingsProvider";
import { Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FloatingActions() {
    const { phone } = useSettings();
    const [isVisible, setIsVisible] = useState(false);

    // Format phone for WhatsApp and Call links
    const cleanPhone = phone ? phone.replace(/\s+/g, '') : "07360544819";
    const whatsappLink = `https://wa.me/${cleanPhone.startsWith('0') ? '44' + cleanPhone.substring(1) : cleanPhone}`;
    const callLink = `tel:${cleanPhone}`;

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className={`floating-actions ${isVisible ? 'visible' : ''}`}>
            <Link href={callLink} className="action-btn call" aria-label="Call Now">
                <div className="icon-wrapper">
                    <Phone size={24} fill="currentColor" />
                    <span className="pulse-ring"></span>
                </div>
            </Link>
            <Link href={whatsappLink} className="action-btn whatsapp" aria-label="WhatsApp">
                <div className="icon-wrapper">
                    <FaWhatsapp size={32} />
                </div>
            </Link>

            <style jsx>{`
                .floating-actions {
                    position: fixed;
                    right: 20px;
                    bottom: 30px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    z-index: 99999;
                    pointer-events: none;
                    opacity: 0;
                    transform: translateX(40px);
                    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .floating-actions.visible {
                    opacity: 1;
                    transform: translateX(0);
                    pointer-events: auto;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }

                .icon-wrapper {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
                    position: relative;
                }

                .call .icon-wrapper {
                    background: var(--primary-orange, #ed4705);
                }

                .whatsapp .icon-wrapper {
                    background: #25D366;
                }

                .action-btn:hover {
                    transform: scale(1.1);
                }

                .action-btn:hover .icon-wrapper {
                    transform: translateY(-5px);
                }

                /* Pulse Animation for Call */
                .pulse-ring {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: var(--primary-orange, #ed4705);
                    opacity: 0.7;
                    z-index: -1;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% {
                        transform: scale(1);
                        opacity: 0.7;
                    }
                    100% {
                        transform: scale(1.6);
                        opacity: 0;
                    }
                }

                @media (max-width: 480px) {
                    .icon-wrapper {
                        width: 55px;
                        height: 55px;
                    }
                    .floating-actions {
                        right: 15px;
                        bottom: 25px;
                    }
                }
            `}</style>
        </div>
    );
}
