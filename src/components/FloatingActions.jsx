"use client";

import { useSettings } from "@/components/SettingsProvider";
import { Phone, MessageCircle } from "lucide-react";
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
            <Link href={whatsappLink} className="action-btn whatsapp" aria-label="WhatsApp">
                <MessageCircle size={28} />
                <span>WhatsApp</span>
            </Link>
            <Link href={callLink} className="action-btn call" aria-label="Call Now">
                <Phone size={24} />
                <span>Call Now</span>
            </Link>

            <style jsx>{`
                .floating-actions {
                    position: fixed;
                    bottom: 20px;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: space-between;
                    padding: 0 20px;
                    z-index: 9999;
                    pointer-events: none;
                    opacity: 0;
                    transform: translateY(20px);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .floating-actions.visible {
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border-radius: 50px;
                    color: white;
                    font-weight: 700;
                    text-decoration: none;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                    transition: transform 0.2s ease;
                }

                .action-btn:active {
                    transform: scale(0.9);
                }

                .whatsapp {
                    background: #25D366;
                }

                .call {
                    background: var(--primary-orange, #ed4705);
                }

                .action-btn span {
                    font-size: 14px;
                }

                @media (min-width: 769px) {
                    .floating-actions {
                        display: none;
                    }
                }

                @media (max-width: 360px) {
                    .action-btn span {
                        display: none;
                    }
                    .action-btn {
                        padding: 12px;
                    }
                }
            `}</style>
        </div>
    );
}
