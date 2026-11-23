"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    MapPin, CalendarCheck, Search, Send, FileSearch, ScrollText,
    Settings, LogOut, ExternalLink, Menu, X, Truck,
} from "lucide-react";
import "../../styles/admin.css";
import "../../styles/admin-theme.css";

const NAV = [
    { label: "Manage", items: [
        { href: "/admin/bookings", text: "Bookings", Icon: CalendarCheck },
        { href: "/admin/areas", text: "Areas", Icon: MapPin },
    ] },
    { label: "Search", items: [
        { href: "/admin/seo", text: "SEO", Icon: Search },
        { href: "/admin/indexing", text: "Google Indexing", Icon: Send },
        { href: "/admin/content-audit", text: "Content Audit", Icon: FileSearch },
    ] },
    { label: "System", items: [
        { href: "/admin/logs", text: "Activity Logs", Icon: ScrollText },
        { href: "/admin/settings", text: "Settings", Icon: Settings },
    ] },
];

export default function AdminShell({ children }) {
    const pathname = usePathname() || "";
    const [open, setOpen] = useState(false);

    const logout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/signin";
    };

    return (
        <div className={`admin-shell${open ? " is-open" : ""}`}>
            <div className="admin-topbar">
                <button type="button" className="admin-topbar__btn" onClick={() => setOpen(true)} aria-label="Open menu">
                    <Menu size={22} />
                </button>
                <span className="admin-topbar__title">Admin</span>
            </div>

            {open && <div className="admin-shell__scrim" onClick={() => setOpen(false)} />}

            <aside className="admin-nav" aria-label="Admin navigation">
                <div className="admin-nav__brand">
                    <span className="admin-nav__logo"><Truck size={20} strokeWidth={2.2} /></span>
                    <span>
                        <strong>Car Recovery</strong>
                        <small>Admin panel</small>
                    </span>
                    <button type="button" className="admin-nav__close" onClick={() => setOpen(false)} aria-label="Close menu">
                        <X size={20} />
                    </button>
                </div>

                <nav className="admin-nav__groups">
                    {NAV.map((group) => (
                        <div key={group.label} className="admin-nav__group">
                            <span className="admin-nav__label">{group.label}</span>
                            {group.items.map(({ href, text, Icon }) => {
                                const active = pathname === href || pathname.startsWith(`${href}/`);
                                return (
                                    <Link
                                        key={href}
                                        prefetch={false}
                                        href={href}
                                        className={`admin-nav__link${active ? " is-active" : ""}`}
                                        aria-current={active ? "page" : undefined}
                                        onClick={() => setOpen(false)}
                                    >
                                        <Icon size={18} strokeWidth={2} />
                                        {text}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="admin-nav__foot">
                    <a href="/" target="_blank" rel="noopener" className="admin-nav__link">
                        <ExternalLink size={18} strokeWidth={2} />
                        View website
                    </a>
                    <button type="button" onClick={logout} className="admin-nav__link admin-nav__link--danger">
                        <LogOut size={18} strokeWidth={2} />
                        Log out
                    </button>
                </div>
            </aside>

            <div className="admin-shell__content">{children}</div>
        </div>
    );
}
