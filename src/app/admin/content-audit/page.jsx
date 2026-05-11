"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, Rocket, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import '../../../styles/admin.css';

const PAGE_LIMIT = 50;

export default function ContentAuditAdmin() {
    const [stats, setStats] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [filter, setFilter] = useState('thin'); // all | thin | clean
    const [search, setSearch] = useState('');
    const [batchSize, setBatchSize] = useState(3);
    const [useLlm, setUseLlm] = useState(true);
    const [autoLoop, setAutoLoop] = useState(false);
    const [log, setLog] = useState([]);
    const [page, setPage] = useState(0);

    const fetchAudit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/content-audit');
            const data = await res.json();
            if (data.success) {
                setStats(data.counts);
                setItems(data.items);
            } else {
                appendLog(`Error loading audit: ${data.error}`);
            }
        } catch (e) {
            appendLog(`Error: ${e.message}`);
        }
        setLoading(false);
    };

    useEffect(() => { fetchAudit(); }, []);

    const appendLog = (line) => {
        setLog(prev => [`[${new Date().toLocaleTimeString()}] ${line}`, ...prev].slice(0, 200));
    };

    const runRewrite = async (overrideSlugs = null) => {
        const target = overrideSlugs ?? null;
        const targetDesc = target ? `slug: ${target.join(', ')}` : `next ${batchSize} thin area(s)`;
        if (!confirm(`Rewrite ${targetDesc}? This calls the Claude API for each thin block.`)) return;
        setRunning(true);
        appendLog(`Starting rewrite — ${targetDesc}…`);
        try {
            const res = await fetch('/api/admin/content-audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    limit: target ? target.length : batchSize,
                    slugs: target,
                    useLlm,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                appendLog(`API error: ${data.error}`);
            } else {
                appendLog(`Processed ${data.processed}, updated ${data.updated}`);
                for (const r of data.results) {
                    if (r.updated) appendLog(`  ✓ /areas/${r.slug} — ${r.fields.join(', ')}`);
                    else if (r.error) appendLog(`  ✗ /areas/${r.slug} — ${r.error}`);
                    else if (r.skipped) appendLog(`  – /areas/${r.slug} — ${r.skipped}`);
                }
            }
            await fetchAudit();

            if (autoLoop && !target && data.success && data.updated > 0) {
                // continue automatically if there are still thin areas
                const remaining = (await (await fetch('/api/admin/content-audit')).json()).counts?.thin || 0;
                if (remaining > 0) {
                    appendLog(`Auto-loop: ${remaining} thin areas remaining. Continuing in 2s…`);
                    setTimeout(() => runRewrite(null), 2000);
                    return;
                }
            }
        } catch (e) {
            appendLog(`Error: ${e.message}`);
        }
        setRunning(false);
    };

    const filtered = useMemo(() => {
        let list = items;
        if (filter === 'thin') list = list.filter(i => i.is_thin);
        else if (filter === 'clean') list = list.filter(i => !i.is_thin);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(i =>
                i.name.toLowerCase().includes(q) ||
                i.slug.toLowerCase().includes(q) ||
                (i.county || '').toLowerCase().includes(q)
            );
        }
        return list;
    }, [items, filter, search]);

    const paginated = filtered.slice(page * PAGE_LIMIT, (page + 1) * PAGE_LIMIT);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_LIMIT));
    useEffect(() => { setPage(0); }, [filter, search]);

    const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—';

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1>Content Audit & Rewrite</h1>
                        <p>Flag area pages with thin content and rewrite them with the Semantic-EAV templater + Claude Sonnet.</p>
                    </div>
                    <div className="admin-header-actions">
                        <Link href="/admin/areas" className="btn btn-secondary">← Back to Areas</Link>
                    </div>
                </header>

                {loading && !stats ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading audit…</p>
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div className="stats-row">
                            <div className="stat-card">
                                <h3>{stats?.total ?? 0}</h3>
                                <p>Active Areas</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                <h3 style={{ color: '#ef4444' }}>{stats?.thin ?? 0}</h3>
                                <p>Flagged (Thin)</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
                                <h3 style={{ color: '#22c55e' }}>{stats?.clean ?? 0}</h3>
                                <p>Passing</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #f97316' }}>
                                <h3 style={{ color: '#f97316' }}>{stats?.services_thin ?? 0}</h3>
                                <p>Thin services</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #f97316' }}>
                                <h3 style={{ color: '#f97316' }}>{stats?.bottom_content_thin ?? 0}</h3>
                                <p>Thin bottom</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #f97316' }}>
                                <h3 style={{ color: '#f97316' }}>{stats?.faqs_missing ?? 0}</h3>
                                <p>Too few FAQs</p>
                            </div>
                        </div>

                        {/* Notice */}
                        <div style={{
                            background: '#fef3c7',
                            border: '1px solid #fbbf24',
                            borderRadius: 8,
                            padding: 14,
                            margin: '18px 0',
                            fontSize: '0.9rem',
                            color: '#78350f',
                        }}>
                            <strong>How it works:</strong> Each thin area is rebuilt with the EAV templater (using the area's own
                            major_roads / nearby_areas / county), then each block is rewritten by <strong>Qwen (DashScope)</strong>
                            with the locked-down system prompt. Bottom content is revalidated automatically. Recommended:
                            run with batch size <strong>3</strong> first and spot-check a page before scaling up.
                        </div>

                        {/* Controls */}
                        <div className="admin-controls" style={{ gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <label style={{ fontSize: '0.9rem' }}>Batch size:</label>
                                <select
                                    value={batchSize}
                                    onChange={(e) => setBatchSize(Number(e.target.value))}
                                    disabled={running}
                                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '0.85rem' }}
                                >
                                    <option value={1}>1</option>
                                    <option value={3}>3</option>
                                    <option value={5}>5 (max per request)</option>
                                </select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                                <input type="checkbox" checked={useLlm} onChange={(e) => setUseLlm(e.target.checked)} disabled={running} />
                                Use Claude rewrite (uncheck for templated draft only)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                                <input type="checkbox" checked={autoLoop} onChange={(e) => setAutoLoop(e.target.checked)} disabled={running} />
                                Auto-continue until done
                            </label>
                            <button className="btn btn-accent" disabled={running || (stats?.thin ?? 0) === 0} onClick={() => runRewrite()}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    {running
                                        ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Running…</>
                                        : <><Rocket size={14} />Rewrite Next {Math.min(batchSize, stats?.thin ?? 0)}</>}
                                </span>
                            </button>
                            <button className="btn btn-secondary" disabled={running || loading} onClick={fetchAudit}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <RefreshCw size={14} />Refresh audit
                                </span>
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="admin-controls" style={{ gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <label style={{ fontSize: '0.9rem' }}>Filter:</label>
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '0.85rem' }}
                                >
                                    <option value="thin">Flagged only ({stats?.thin ?? 0})</option>
                                    <option value="clean">Passing only ({stats?.clean ?? 0})</option>
                                    <option value="all">All ({stats?.total ?? 0})</option>
                                </select>
                            </div>
                            <input
                                type="text"
                                placeholder="Search slug / name / county…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '0.85rem', minWidth: 260 }}
                            />
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                Showing {paginated.length} of {filtered.length}
                            </span>
                        </div>

                        {/* Live log */}
                        {log.length > 0 && (
                            <div style={{
                                margin: '18px 0',
                                background: '#0f172a',
                                color: '#e2e8f0',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                fontSize: '0.78rem',
                                lineHeight: 1.5,
                                padding: 14,
                                borderRadius: 8,
                                maxHeight: 200,
                                overflowY: 'auto',
                            }}>
                                {log.map((line, i) => <div key={i}>{line}</div>)}
                            </div>
                        )}

                        {/* Table */}
                        <div style={{ overflowX: 'auto', marginTop: 18, border: '1px solid #e2e8f0', borderRadius: 8 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                    <tr>
                                        <th style={th}>Area</th>
                                        <th style={th}>County</th>
                                        <th style={th}>Status</th>
                                        <th style={th}>Services</th>
                                        <th style={th}>FAQs</th>
                                        <th style={th}>Bottom (words)</th>
                                        <th style={th}>Roads</th>
                                        <th style={th}>Updated</th>
                                        <th style={th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(it => (
                                        <tr key={it.slug} style={{ borderTop: '1px solid #e2e8f0' }}>
                                            <td style={td}>
                                                <a href={`/areas/${it.slug}`} target="_blank" rel="noreferrer" style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                                                    {it.name} <ExternalLink size={11} style={{ verticalAlign: 'middle', opacity: 0.6 }} />
                                                </a>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>/areas/{it.slug}</div>
                                            </td>
                                            <td style={td}>{it.county || '—'}</td>
                                            <td style={td}>
                                                {it.is_thin
                                                    ? <span style={badge('#fef2f2', '#b91c1c')}><AlertTriangle size={11} />Thin</span>
                                                    : <span style={badge('#f0fdf4', '#15803d')}><CheckCircle2 size={11} />Passing</span>}
                                            </td>
                                            <td style={td}>
                                                {it.services_count}
                                                {it.services_thin && <span style={miniBadge}>thin</span>}
                                            </td>
                                            <td style={td}>
                                                {it.faqs_count}
                                                {it.faqs_missing && <span style={miniBadge}>&lt; 5</span>}
                                            </td>
                                            <td style={td}>
                                                {it.bottom_words}
                                                {it.bottom_content_thin && <span style={miniBadge}>&lt; 400</span>}
                                            </td>
                                            <td style={td}>
                                                {it.major_roads_count}
                                                {it.major_roads_missing && <span style={miniBadge}>missing</span>}
                                            </td>
                                            <td style={{ ...td, color: '#64748b', whiteSpace: 'nowrap' }}>{fmt(it.updated_at)}</td>
                                            <td style={td}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                    disabled={running || !it.is_thin}
                                                    onClick={() => runRewrite([it.slug])}
                                                >
                                                    Rewrite
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '16px 0' }}>
                                <button className="btn btn-secondary" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>← Prev</button>
                                <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: '#64748b' }}>Page {page + 1} / {totalPages}</span>
                                <button className="btn btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Next →</button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

const th = { padding: '10px 12px', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' };
const td = { padding: '10px 12px', verticalAlign: 'top' };
const miniBadge = { marginLeft: 6, padding: '1px 6px', background: '#fef2f2', color: '#b91c1c', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600 };
const badge = (bg, fg) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: bg, color: fg, borderRadius: 999, fontSize: '0.75rem', fontWeight: 600 });
