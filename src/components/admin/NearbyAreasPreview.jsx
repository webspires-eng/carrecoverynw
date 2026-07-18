"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drop into Add/Edit area forms. Pass either:
 *   <NearbyAreasPreview slug={existingSlug} />
 *   <NearbyAreasPreview lat={lat} lng={lng} />
 *
 * On initial mount with valid props the fetch fires immediately (no debounce)
 * so existing areas show their preview without the admin having to interact.
 * Subsequent prop changes (typing in lat/lng) are debounced 400ms.
 */
export default function NearbyAreasPreview({ slug, lat, lng }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const isFirstFetchRef = useRef(true);

    useEffect(() => {
        const hasGeo =
            typeof lat === "number" &&
            typeof lng === "number" &&
            !Number.isNaN(lat) &&
            !Number.isNaN(lng) &&
            lat !== 0 &&
            lng !== 0;
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
        setLoading(true);
        setError(null);

        const doFetch = async () => {
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
        };

        let timer;
        if (isFirstFetchRef.current) {
            isFirstFetchRef.current = false;
            doFetch();
        } else {
            timer = setTimeout(doFetch, 400);
        }

        return () => {
            ctrl.abort();
            if (timer) clearTimeout(timer);
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

/**
 * Relinks a single area (and only the neighbours affected by it) instead of
 * rebuilding links for the whole site. Disabled until the area has been saved
 * with coordinates, since the rebuild reads the stored record.
 */
export function RebuildAreaLinksButton({ slug, disabled = false, disabledHint }) {
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [result, setResult] = useState(null);

    const isDisabled = disabled || !slug || status === "loading";

    const handleClick = async () => {
        if (isDisabled) return;
        setStatus("loading");
        setResult(null);
        try {
            const res = await fetch("/api/admin/rebuild-area-links", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ slug }),
            });
            const json = await res.json();
            setResult(json);
            setStatus(json.success ? "success" : "error");
        } catch (err) {
            setResult({ error: err.message });
            setStatus("error");
        }
        setTimeout(() => setStatus("idle"), 6000);
    };

    const label =
        status === "loading"
            ? "Rebuilding…"
            : status === "success"
              ? "Links Rebuilt"
              : status === "error"
                ? "Rebuild Failed"
                : "↔ Rebuild This Area's Links";

    return (
        <div style={{ marginBottom: 12 }}>
            <button
                type="button"
                onClick={handleClick}
                disabled={isDisabled}
                className="btn btn-secondary"
                title={
                    isDisabled && disabledHint
                        ? disabledHint
                        : "Recalculate outbound + inbound links for this area only"
                }
                style={{ width: "100%", justifyContent: "center" }}
            >
                {label}
            </button>
            {isDisabled && disabledHint && status === "idle" && (
                <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>{disabledHint}</p>
            )}
            {result && status !== "loading" && (
                <p
                    style={{
                        fontSize: 12,
                        marginTop: 6,
                        color: status === "success" ? "#16a34a" : "#dc2626",
                    }}
                >
                    {status === "success"
                        ? `${result.outbound} outbound · ${result.inbound} inbound · ${result.neighboursUpdated} neighbour page${result.neighboursUpdated === 1 ? "" : "s"} updated`
                        : result.error || result.errors?.[0] || "Error"}
                </p>
            )}
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
