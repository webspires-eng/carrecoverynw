"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, Loader2, Rocket, RotateCcw, Trash2, RefreshCw } from 'lucide-react';
import '../../../styles/admin.css';

export default function IndexingAdmin() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [batchSize, setBatchSize] = useState(50);
    const [filter, setFilter] = useState('all');
    const [log, setLog] = useState([]);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/indexing/bulk');
            const data = await res.json();
            if (data.success) setStats(data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const appendLog = (line) => {
        setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${line}`, ...prev].slice(0, 50));
    };

    const runBatch = async () => {
        if (!confirm(`Submit up to ${batchSize} pending URLs to Google Indexing API?`)) return;
        setRunning(true);
        appendLog(`Submitting batch of ${batchSize}...`);
        try {
            const res = await fetch('/api/indexing/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'run', batchSize }),
            });
            const data = await res.json();
            if (data.success) {
                appendLog(data.message);
                if (data.errors?.length) {
                    data.errors.forEach((e) => appendLog(`  ✗ ${e.url} — ${e.error}`));
                }
            } else {
                appendLog(`Error: ${data.error}`);
            }
        } catch (e) {
            appendLog(`Error: ${e.message}`);
        }
        setRunning(false);
        fetchStatus();
    };

    const retryFailed = async () => {
        if (!confirm('Mark all failed URLs as pending so they\'ll be tried again?')) return;
        setRunning(true);
        try {
            const res = await fetch('/api/indexing/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'retry-failed' }),
            });
            const data = await res.json();
            appendLog(data.message || 'Retry queued');
        } catch (e) {
            appendLog(`Error: ${e.message}`);
        }
        setRunning(false);
        fetchStatus();
    };

    const resetProgress = async () => {
        if (!confirm('Wipe ALL submission history? Every URL will be pending again.')) return;
        setRunning(true);
        try {
            const res = await fetch('/api/indexing/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset' }),
            });
            const data = await res.json();
            appendLog(data.message || 'Reset done');
        } catch (e) {
            appendLog(`Error: ${e.message}`);
        }
        setRunning(false);
        fetchStatus();
    };

    const filteredItems = (stats?.items || []).filter((it) => {
        if (filter === 'all') return true;
        return it.status === filter;
    });

    const statusColors = {
        submitted: '#22c55e',
        failed: '#ef4444',
        pending: '#94a3b8',
    };

    const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-GB') : '—');

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1>Google Indexing</h1>
                        <p>Bulk-submit URLs to Google's Indexing API to speed up crawling</p>
                    </div>
                    <div className="admin-header-actions">
                        <Link href="/admin/areas" className="btn btn-secondary">← Back to Areas</Link>
                    </div>
                </header>

                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading indexing status...</p>
                    </div>
                ) : !stats ? (
                    <div className="empty-state">
                        <p>Failed to load indexing status.</p>
                    </div>
                ) : (
                    <>
                        <div className="stats-row">
                            <div className="stat-card">
                                <h3>{stats.total}</h3>
                                <p>Total URLs</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: `4px solid ${statusColors.submitted}` }}>
                                <h3 style={{ color: statusColors.submitted }}>{stats.submitted}</h3>
                                <p>Submitted</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: `4px solid ${statusColors.failed}` }}>
                                <h3 style={{ color: statusColors.failed }}>{stats.failed}</h3>
                                <p>Failed</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: `4px solid ${statusColors.pending}` }}>
                                <h3 style={{ color: statusColors.pending }}>{stats.pending}</h3>
                                <p>Pending</p>
                            </div>
                        </div>

                        <div style={{
                            background: '#fef3c7',
                            border: '1px solid #fbbf24',
                            borderRadius: 8,
                            padding: 14,
                            margin: '18px 0',
                            fontSize: '0.9rem',
                            color: '#78350f',
                        }}>
                            <strong>Quota:</strong> Google limits this API to <strong>200 URL notifications/day</strong> per project.
                            Used in last 24h: <strong>{stats.recent24h}</strong>.
                        </div>

                        <div style={{
                            background: '#dcfce7',
                            border: '1px solid #22c55e',
                            borderRadius: 8,
                            padding: 14,
                            margin: '18px 0',
                            fontSize: '0.9rem',
                            color: '#14532d',
                        }}>
                            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Bot size={16} />Automatic weekly run:</strong> A Vercel Cron job runs every <strong>Monday at 03:00 UTC</strong> and
                            submits the next {190} pending URLs. Manual button below is only needed to force a run sooner.
                        </div>

                        <div className="admin-controls" style={{ gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <label style={{ fontSize: '0.9rem' }}>Batch size:</label>
                                <select
                                    value={batchSize}
                                    onChange={(e) => setBatchSize(Number(e.target.value))}
                                    disabled={running}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: 6,
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: 'white',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                    <option value={190}>190 (max/day)</option>
                                </select>
                            </div>
                            <button
                                className="btn btn-accent"
                                disabled={running || stats.pending === 0}
                                onClick={runBatch}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    {running ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Running…</> : <><Rocket size={14} />Submit Next {Math.min(batchSize, stats.pending)}</>}
                                </span>
                            </button>
                            <button
                                className="btn btn-secondary"
                                disabled={running || stats.failed === 0}
                                onClick={retryFailed}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><RotateCcw size={14} />Retry Failed ({stats.failed})</span>
                            </button>
                            <button
                                className="btn btn-secondary"
                                disabled={running}
                                onClick={resetProgress}
                                style={{ color: '#ef4444' }}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trash2 size={14} />Reset Progress</span>
                            </button>
                            <button
                                className="btn btn-secondary"
                                disabled={running}
                                onClick={fetchStatus}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><RefreshCw size={14} />Refresh</span>
                            </button>
                        </div>

                        {log.length > 0 && (
                            <div style={{
                                background: '#0f172a',
                                color: '#e2e8f0',
                                padding: 14,
                                borderRadius: 8,
                                fontFamily: 'monospace',
                                fontSize: '0.82rem',
                                maxHeight: 200,
                                overflowY: 'auto',
                                margin: '18px 0',
                            }}>
                                {log.map((line, i) => (
                                    <div key={i}>{line}</div>
                                ))}
                            </div>
                        )}

                        <div className="stats-bar" style={{ marginTop: 24 }}>
                            <span>Showing <strong>{filteredItems.length}</strong> of <strong>{stats.total}</strong> URLs</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {['all', 'pending', 'submitted', 'failed'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`view-toggle-btn ${filter === f ? 'active' : ''}`}
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <table className="areas-table" style={{ marginTop: 12 }}>
                            <thead>
                                <tr>
                                    <th>URL</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                    <th>Last Attempt</th>
                                    <th>Attempts</th>
                                    <th>Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.slice(0, 500).map((it) => (
                                    <tr key={it.url}>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            <a href={it.url} target="_blank" rel="noopener noreferrer">
                                                {it.url.replace(/^https?:\/\/[^/]+/, '')}
                                            </a>
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 10px',
                                                borderRadius: 12,
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: statusColors[it.status] + '22',
                                                color: statusColors[it.status],
                                                textTransform: 'capitalize',
                                            }}>
                                                {it.status}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.8rem', color: '#666' }}>{fmtDate(it.submitted_at)}</td>
                                        <td style={{ fontSize: '0.8rem', color: '#666' }}>{fmtDate(it.last_attempt_at)}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{it.attempts || 0}</td>
                                        <td style={{ fontSize: '0.8rem', color: '#ef4444', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {it.error || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredItems.length > 500 && (
                            <p style={{ textAlign: 'center', color: '#666', padding: 12 }}>
                                Showing first 500 — filter to narrow down.
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
