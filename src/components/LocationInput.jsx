"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

// UK location suggestions from postcodes.io (free, open data, no API key).
// Postcodes and place names are both searched; the customer can still type
// anything else (a road, a motorway junction, what3words) and carry on.
const API = "https://api.postcodes.io";
const POSTCODE_LIKE = /^[a-z]{1,2}\d/i;

async function fetchSuggestions(query, signal) {
    const q = encodeURIComponent(query);
    const get = (path) =>
        fetch(`${API}${path}`, { signal })
            .then((r) => (r.ok ? r.json() : { result: [] }))
            .then((d) => d.result || [])
            .catch(() => []);

    if (POSTCODE_LIKE.test(query)) {
        const rows = await get(`/postcodes?q=${q}&limit=6`);
        return rows.map((p) => ({
            key: p.postcode,
            label: [p.postcode, p.admin_ward, p.admin_district].filter(Boolean).join(", "),
        }));
    }

    const rows = await get(`/places?q=${q}&limit=6`);
    const seen = new Set();
    return rows
        .map((p) => ({
            key: p.code,
            label: [p.name_1, p.county_unitary || p.district_borough, p.region || p.country]
                .filter(Boolean)
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(", "),
        }))
        .filter((s) => (seen.has(s.label) ? false : seen.add(s.label)));
}

export default function LocationInput({ id, name, value, onChange, placeholder, required }) {
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const skipNext = useRef(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        const query = (value || "").trim();
        if (skipNext.current) {
            skipNext.current = false;
            return;
        }
        if (query.length < 2) return;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            const found = await fetchSuggestions(query, controller.signal);
            if (controller.signal.aborted) return;
            setItems(found);
            setActive(-1);
            setOpen(found.length > 0);
        }, 250);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [value]);

    useEffect(() => {
        const close = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const pick = (item) => {
        skipNext.current = true;
        onChange({ target: { name, value: item.label, type: "text" } });
        setOpen(false);
    };

    const onKeyDown = (e) => {
        if (!open || items.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % items.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
        } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(items[active]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    const showList = open && (value || "").trim().length >= 2;

    return (
        <div className="loc-input" ref={wrapRef}>
            <input
                id={id}
                type="text"
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={() => items.length > 0 && setOpen(true)}
                onKeyDown={onKeyDown}
                autoComplete="off"
                role="combobox"
                aria-expanded={showList}
                aria-controls={`${id}-list`}
                aria-autocomplete="list"
                required={required}
            />
            {showList && (
                <ul className="loc-input__list" id={`${id}-list`} role="listbox">
                    {items.map((item, i) => (
                        <li
                            key={item.key}
                            role="option"
                            aria-selected={i === active}
                            className={`loc-input__item${i === active ? " is-active" : ""}`}
                            onMouseDown={(e) => { e.preventDefault(); pick(item); }}
                            onMouseEnter={() => setActive(i)}
                        >
                            <MapPin size={16} aria-hidden="true" />
                            <span>{item.label}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
