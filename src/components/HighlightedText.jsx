"use client";

export default function HighlightedText({ text, location, className = "location-name" }) {
    if (!text) return null;
    if (!location) return text;

    const parts = text.split(new RegExp(`(${location})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === location.toLowerCase() ? (
                    <span key={i} className={className}>{part}</span>
                ) : (
                    part
                )
            )}
        </>
    );
}
