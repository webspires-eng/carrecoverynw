"use client";

import { useEffect, useState } from "react";

/**
 * Drop into Add/Edit area forms. Pass either:
 *   <NearbyAreasPreview slug={existingSlug} />
 *   <NearbyAreasPreview lat={lat} lng={lng} />
 *
 * When `lat`/`lng` change the panel auto-refreshes (debounced).
 */
export default function NearbyAreasPreview({ slug, lat, lng }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const hasGeo = typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng);
        if (!slug && !hasGeo) return;

        const params = new URLSearchParams();
        if (hasGeo) {
            params.set("lat", String(lat));
            params.set("lng", String(lng));
            if (slug) params.set("slug", slug);
        } else if (slug) {
            params.set("slug", slug);
        }

        const ctrl = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/admin/internal-links/preview?${params.toString()}`,
                    { signal: ctrl.signal, credentials: "include" }
                );
                const json = await res.json();
                if (!json.success) throw new Error(json.error || "Preview failed");
                setData(json);
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => {
            ctrl.abort();
            clearTimeout(timer);
        };
    }, [slug, lat, lng]);

    return (
        <div className="nearby-preview" style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Nearby Areas Preview</h3>
            {loading && <p>Calculating…</p>}
            {error && <p style={{ color: "#b00" }}>Error: {error}</p>}
            {!loading && !error && data && (
                <>
                    <p style={{ fontSize: 13, color: "#555" }}>
                        Will link <strong>TO</strong> these {data.nearest.length} pages on publish:
                    </p>
                    <ul style={{ paddingLeft: 18 }}>
                        {data.nearest.map((a) => (
                            <li key={a.slug}>
                                {a.name} — {a.distanceKm.toFixed(1)} km
                            </li>
                        ))}
                    </ul>
                    <p style={{ fontSize: 13, color: "#555", marginTop: 12 }}>
                        {data.reverseTargets.length} existing pages will be updated to link <strong>back</strong> to this page.
                    </p>
                    {data.reverseTargets.length > 0 && (
                        <details>
                            <summary style={{ cursor: "pointer", fontSize: 13 }}>Show reverse-link targets</summary>
                            <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                                {data.reverseTargets.map((a) => (
                                    <li key={a.slug}>
                                        {a.name} — {a.distanceKm.toFixed(1)} km
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}
                </>
            )}
            {!loading && !error && !data && <p style={{ fontSize: 13, color: "#888" }}>Set latitude and longitude to see preview.</p>}
        </div>
    );
}

export function LinkStatusBadge({ outbound = 0, inbound = 0 }) {
    let color = "#c00";
    let status = "Not linked";
    if (outbound >= 6 && inbound >= 3) {
        color = "#0a7d2e";
        status = "Fully linked";
    } else if (outbound > 0 || inbound > 0) {
        color = "#b58105";
        status = "Partially linked";
    }
    const tooltip =
        `${status} — ${outbound} outbound, ${inbound} inbound\n` +
        `Green = ≥6 outbound + ≥3 inbound\n` +
        `Yellow = some links but not full\n` +
        `Red = no internal links yet`;
    return (
        <span
            title={tooltip}
            style={{
                display: "inline-block",
                padding: "2px 8px",
                background: color,
                color: "#fff",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                cursor: "help",
            }}
        >
            {outbound} out · {inbound} in
        </span>
    );
}
