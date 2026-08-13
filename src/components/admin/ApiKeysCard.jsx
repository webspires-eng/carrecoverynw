"use client";

// Mobile API key management, shown on /admin/settings.
//
// Keys are stored hashed, so this UI can never display an existing key — the
// plaintext appears exactly once, right after it's generated. Losing it means
// revoking and issuing another, which is cheap.
import { useState, useEffect, useCallback } from 'react';
import { KeyRound, Plus, Copy, Check, Trash2, AlertTriangle } from 'lucide-react';

function timeAgo(iso) {
    if (!iso) return 'Never';

    const then = new Date(iso);
    if (Number.isNaN(then.getTime())) return 'Never';

    const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
    if (seconds < 60) return 'Just now';

    const units = [
        ['minute', 60],
        ['hour', 60],
        ['day', 24],
        ['month', 30.44],
        ['year', 12],
    ];

    let value = seconds / 60;
    let label = 'minute';
    for (let i = 0; i < units.length; i++) {
        const [name, divisor] = units[i];
        if (i > 0) value /= divisor;
        label = name;
        const next = units[i + 1];
        if (!next || value < next[1]) break;
    }

    const rounded = Math.floor(value);
    return `${rounded} ${label}${rounded === 1 ? '' : 's'} ago`;
}

function formatDate(iso) {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ApiKeysCard() {
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [label, setLabel] = useState('');
    const [readOnly, setReadOnly] = useState(false);
    const [generating, setGenerating] = useState(false);

    // The one-time plaintext reveal. Cleared as soon as it's dismissed.
    const [newKey, setNewKey] = useState(null);
    const [copied, setCopied] = useState(false);

    const [revoking, setRevoking] = useState(null);

    const fetchKeys = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/api-keys');
            const data = await res.json();
            if (data.success) {
                setKeys(data.data);
                setError('');
            } else {
                setError(data.error || 'Could not load API keys.');
            }
        } catch {
            setError('Could not load API keys.');
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchKeys(); }, [fetchKeys]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!label.trim() || generating) return;

        setGenerating(true);
        setError('');

        try {
            const res = await fetch('/api/admin/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    label: label.trim(),
                    scopes: readOnly ? ['read'] : ['read', 'write'],
                }),
            });
            const data = await res.json();

            if (data.success) {
                setNewKey({ key: data.key, label: data.data.label });
                setCopied(false);
                setLabel('');
                setReadOnly(false);
                fetchKeys();
            } else {
                setError(data.error || 'Could not create the API key.');
            }
        } catch {
            setError('Could not create the API key.');
        }

        setGenerating(false);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(newKey.key);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setError('Could not copy automatically — select the key and copy it manually.');
        }
    };

    const handleRevoke = async (key) => {
        const confirmed = window.confirm(
            `Revoke "${key.label}"?\n\nAny app using this key stops working immediately. This cannot be undone.`
        );
        if (!confirmed) return;

        setRevoking(key.id);
        setError('');

        try {
            const res = await fetch(`/api/admin/api-keys/${key.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchKeys();
            } else {
                setError(data.error || 'Could not revoke the key.');
            }
        } catch {
            setError('Could not revoke the key.');
        }

        setRevoking(null);
    };

    return (
        <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
            <div className="settings-card-header">
                <div className="settings-card-icon">
                    <KeyRound size={24} strokeWidth={2} />
                </div>
                <h2>Mobile API Keys</h2>
            </div>

            <p className="input-hint" style={{ marginTop: 0, marginBottom: '20px' }}>
                Keys let the mobile app read and create bookings. Give each device or
                app its own key so you can revoke one without affecting the others.
            </p>

            {error && (
                <div
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px 14px', marginBottom: '16px',
                        background: '#fdecea', color: '#b3261e',
                        border: '1px solid #f5c6cb', borderRadius: '6px', fontSize: '14px',
                    }}
                >
                    <AlertTriangle size={18} /> {error}
                </div>
            )}

            {/* One-time reveal of a freshly generated key */}
            {newKey && (
                <div
                    style={{
                        padding: '16px', marginBottom: '20px',
                        background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#8a6d00', fontWeight: 600 }}>
                        <AlertTriangle size={18} />
                        Copy this key now — it will not be shown again
                    </div>

                    <p style={{ fontSize: '13px', color: '#6b5900', margin: '0 0 12px' }}>
                        Key for <strong>{newKey.label}</strong>. It is stored encrypted, so we
                        cannot show it to you again. If you lose it, revoke this key and
                        generate a new one.
                    </p>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                        <code
                            style={{
                                flex: '1 1 320px', padding: '12px', background: '#fff',
                                border: '1px solid #e0cf90', borderRadius: '6px',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                fontSize: '13px', wordBreak: 'break-all', userSelect: 'all',
                            }}
                        >
                            {newKey.key}
                        </code>
                        <button type="button" className="btn btn-primary" onClick={handleCopy} style={{ whiteSpace: 'nowrap' }}>
                            {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
                        </button>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setNewKey(null)}
                        style={{ marginTop: '12px' }}
                    >
                        I&apos;ve saved it
                    </button>
                </div>
            )}

            {/* Generate */}
            <form onSubmit={handleGenerate} style={{ marginBottom: '24px' }}>
                <div className="form-group">
                    <label htmlFor="api-key-label">Label</label>
                    <input
                        id="api-key-label"
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Atif's iPhone"
                        maxLength={60}
                    />
                    <span className="input-hint">So you can tell which key is which later.</span>
                </div>

                <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={readOnly}
                            onChange={(e) => setReadOnly(e.target.checked)}
                            style={{ width: 'auto', margin: 0 }}
                        />
                        Read-only
                    </label>
                    <span className="input-hint">
                        Can view bookings but not create them. Use for anyone outside the business.
                    </span>
                </div>

                <button type="submit" className="btn btn-primary" disabled={generating || !label.trim()}>
                    {generating ? <><div className="btn-spinner"></div> Generating...</> : <><Plus size={18} /> Generate key</>}
                </button>
            </form>

            {/* List */}
            {loading ? (
                <p className="input-hint">Loading keys...</p>
            ) : keys.length === 0 ? (
                <p className="input-hint">No API keys yet. Generate one to connect the mobile app.</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="areas-table" style={{ border: 'none', boxShadow: 'none' }}>
                        <thead>
                            <tr>
                                <th>Label</th>
                                <th>Key</th>
                                <th>Access</th>
                                <th>Created</th>
                                <th>Last used</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {keys.map((key) => (
                                <tr key={key.id} style={{ opacity: key.active ? 1 : 0.55 }}>
                                    <td>
                                        <strong>{key.label}</strong>
                                        {!key.active && (
                                            <span className="status-badge status-inactive" style={{ marginLeft: '8px' }}>
                                                Revoked
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '13px' }}>
                                        {key.prefix}…
                                    </td>
                                    <td>{key.scopes?.includes('write') ? 'Read & write' : 'Read-only'}</td>
                                    <td title={key.createdBy ? `by ${key.createdBy}` : undefined}>
                                        {formatDate(key.createdAt)}
                                    </td>
                                    <td>{key.active ? timeAgo(key.lastUsedAt) : '—'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        {key.active && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => handleRevoke(key)}
                                                disabled={revoking === key.id}
                                                style={{ color: '#b3261e', whiteSpace: 'nowrap' }}
                                            >
                                                <Trash2 size={16} />
                                                {revoking === key.id ? 'Revoking...' : 'Revoke'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
