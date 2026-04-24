"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, FileCode, Bot, Link2 } from 'lucide-react';
import '../../../styles/admin.css';

export default function SEOPage() {
    const [seoSettings, setSeoSettings] = useState({
        schema_markup: '',
        robots_txt: '',
        canonical_base_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [schemaError, setSchemaError] = useState('');

    useEffect(() => {
        fetchSEOSettings();
    }, []);

    const fetchSEOSettings = async () => {
        try {
            const res = await fetch('/api/seo');
            const data = await res.json();
            if (data.success) {
                setSeoSettings(data.data);
            }
        } catch (error) {
            console.error('Error fetching SEO settings:', error);
        }
        setLoading(false);
    };

    const validateSchemaJSON = (value) => {
        if (!value.trim()) {
            setSchemaError('');
            return true;
        }
        try {
            JSON.parse(value);
            setSchemaError('');
            return true;
        } catch (e) {
            setSchemaError('Invalid JSON syntax: ' + e.message);
            return false;
        }
    };

    const handleSchemaChange = (value) => {
        setSeoSettings({ ...seoSettings, schema_markup: value });
        validateSchemaJSON(value);
    };

    const handleTestInGoogle = () => {
        const encoded = encodeURIComponent(seoSettings.schema_markup);
        window.open(`https://search.google.com/test/rich-results?code=${encoded}`, '_blank');
    };

    const handleViewRobotsLive = () => {
        const baseUrl = seoSettings.canonical_base_url || 'https://www.cartowingnearme.co.uk';
        window.open(`${baseUrl}/robots.txt`, '_blank');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (seoSettings.schema_markup && !validateSchemaJSON(seoSettings.schema_markup)) {
            setError('Please fix the JSON syntax errors before saving.');
            return;
        }

        setSaving(true);
        setSuccess(false);
        setError('');

        try {
            const res = await fetch('/api/seo', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(seoSettings)
            });

            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 4000);
            } else {
                setError(data.error || 'Failed to save SEO settings');
            }
        } catch (err) {
            setError('Error saving SEO settings');
        }

        setSaving(false);
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/signin';
    };

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="admin-main">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading SEO settings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Search size={24} strokeWidth={2.2} />SEO</h1>
                        <p>Manage schema markup, robots.txt, and canonical tags for your site.</p>
                    </div>
                    <div className="admin-header-actions">
                        <Link href="/admin/bookings" className="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Bookings
                        </Link>
                        <Link href="/admin/areas" className="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back to Dashboard
                        </Link>
                        <button onClick={handleLogout} className="btn-logout">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Success / Error Messages */}
                {success && (
                    <div className="success-message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        SEO settings saved successfully!
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Schema Markup Section */}
                    <div className="seo-section">
                        <div className="seo-section-header">
                            <div className="seo-section-title">
                                <span className="seo-section-icon"><FileCode size={22} /></span>
                                <div>
                                    <h2>Schema Markup (JSON-LD)</h2>
                                    <p className="seo-section-desc">
                                        This JSON-LD schema will be injected into every page&apos;s <code>&lt;head&gt;</code>. Use <a href="https://schema.org" target="_blank" rel="noopener noreferrer">schema.org</a> format.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleTestInGoogle}
                                className="btn-test-google"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                                Test in Google
                            </button>
                        </div>
                        <div className="seo-code-container">
                            <textarea
                                className={`seo-code-editor ${schemaError ? 'has-error' : ''}`}
                                value={seoSettings.schema_markup}
                                onChange={(e) => handleSchemaChange(e.target.value)}
                                rows={14}
                                spellCheck={false}
                                placeholder='{ "@context": "https://schema.org", ... }'
                            />
                            {schemaError && (
                                <div className="seo-json-error">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    {schemaError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Robots.txt Section */}
                    <div className="seo-section">
                        <div className="seo-section-header">
                            <div className="seo-section-title">
                                <span className="seo-section-icon"><Bot size={22} /></span>
                                <div>
                                    <h2>robots.txt</h2>
                                    <p className="seo-section-desc">
                                        Controls which pages search engine bots can crawl. Changes take effect immediately.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleViewRobotsLive}
                                className="btn-view-live"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15 3 21 3 21 9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                                View Live
                            </button>
                        </div>
                        <div className="seo-code-container">
                            <textarea
                                className="seo-code-editor seo-robots-editor"
                                value={seoSettings.robots_txt}
                                onChange={(e) => setSeoSettings({ ...seoSettings, robots_txt: e.target.value })}
                                rows={10}
                                spellCheck={false}
                                placeholder="User-agent: *&#10;Allow: /"
                            />
                        </div>
                    </div>

                    {/* Canonical Tags Section */}
                    <div className="seo-section">
                        <div className="seo-section-header">
                            <div className="seo-section-title">
                                <span className="seo-section-icon"><Link2 size={22} /></span>
                                <div>
                                    <h2>Canonical Tags</h2>
                                    <p className="seo-section-desc">
                                        The canonical base URL is used to generate <code>&lt;link rel=&quot;canonical&quot;&gt;</code> tags on all pages. This prevents duplicate content issues in search engines.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="seo-canonical-content">
                            <div className="form-group">
                                <label>Canonical Base URL</label>
                                <input
                                    type="url"
                                    value={seoSettings.canonical_base_url}
                                    onChange={(e) => setSeoSettings({ ...seoSettings, canonical_base_url: e.target.value })}
                                    placeholder="https://www.cartowingnearme.co.uk"
                                />
                                <span className="seo-example-output">
                                    Example output: <code>&lt;link rel=&quot;canonical&quot; href=&quot;{seoSettings.canonical_base_url || 'https://www.cartowingnearme.co.uk'}/product-1&amp;id=1&quot;&gt;</code>
                                </span>
                            </div>

                            <div className="seo-canonical-info">
                                <h3>How Canonical Tags Work:</h3>
                                <ul>
                                    <li>A <code>canonical</code> tag tells Google which version of a URL is the &quot;main&quot; one.</li>
                                    <li>Canonical tags are auto-generated on every page using this base URL + the current path.</li>
                                    <li>You can override the canonical URL per-page using the Meta Title/Description fields on each area.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="seo-form-actions">
                        <button type="submit" className="btn btn-primary btn-save-seo" disabled={saving}>
                            {saving ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    Save SEO Settings
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
