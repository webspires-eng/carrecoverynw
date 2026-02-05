"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '../../../styles/admin.css';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        business_name: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        favicon: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.success) {
                setSettings({ ...settings, ...data.data });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);

        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            alert('Error saving settings');
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
                        <p>Loading settings...</p>
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
                        <h1>⚙️ Settings</h1>
                        <p>Manage your business information and contact details</p>
                    </div>
                    <div className="admin-header-actions">
                        <Link href="/admin/areas" className="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back to Areas
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

                {/* Success Message */}
                {success && (
                    <div className="success-message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Settings saved successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="settings-grid">
                        {/* Business Information Card */}
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div className="settings-card-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                    </svg>
                                </div>
                                <h2>Business Information</h2>
                            </div>

                            <div className="form-group">
                                <label>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path>
                                        <path d="M1 21h22"></path>
                                    </svg>
                                    Business Name
                                </label>
                                <input
                                    type="text"
                                    value={settings.business_name}
                                    onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                                    placeholder="Car Recovery UK"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    Business Address
                                </label>
                                <textarea
                                    value={settings.address}
                                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                    Favicon URL / Path
                                </label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        value={settings.favicon}
                                        onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                                        placeholder="/favicon.png or https://example.com/icon.png"
                                    />
                                    {settings.favicon && (
                                        <div style={{ padding: '5px', background: '#eee', borderRadius: '4px' }}>
                                            <img src={settings.favicon} alt="Favicon Preview" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                                        </div>
                                    )}
                                </div>
                                <span className="input-hint">Path to your favicon (default is /truckicon.png)</span>
                            </div>
                        </div>

                        {/* Contact Information Card */}
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div className="settings-card-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                </div>
                                <h2>Contact Information</h2>
                            </div>

                            <div className="form-group">
                                <label>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={settings.phone}
                                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                    placeholder="07360544819"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                    WhatsApp Number
                                </label>
                                <input
                                    type="text"
                                    value={settings.whatsapp}
                                    onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                                    placeholder="447360544819"
                                />
                                <span className="input-hint">Include country code without + (e.g., 447360544819)</span>
                            </div>

                            <div className="form-group">
                                <label>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                        <polyline points="22,6 12,13 2,6"></polyline>
                                    </svg>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={settings.email}
                                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                    placeholder="info@carrecoveryuk.co.uk"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Link href="/admin/areas" className="btn btn-secondary">
                            Cancel
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
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
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
