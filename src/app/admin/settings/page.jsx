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
        address: ''
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

    if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your business information</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/admin/areas" className="btn-back">← Back to Areas</Link>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </header>

            {success && <div className="success-message">✓ Settings saved successfully!</div>}

            <form onSubmit={handleSubmit}>
                <div className="settings-grid">
                    <div className="settings-card">
                        <h2>Business Information</h2>

                        <div className="form-group">
                            <label>Business Name</label>
                            <input
                                type="text"
                                value={settings.business_name}
                                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                                placeholder="ABZ Car Recovery"
                            />
                        </div>

                        <div className="form-group">
                            <label>Business Address</label>
                            <textarea
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                placeholder="Your business address"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="settings-card">
                        <h2>Contact Information</h2>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="text"
                                value={settings.phone}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                placeholder="07360544819"
                            />
                        </div>

                        <div className="form-group">
                            <label>WhatsApp Number (with country code)</label>
                            <input
                                type="text"
                                value={settings.whatsapp}
                                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                                placeholder="447360544819"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={settings.email}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                placeholder="info@abzcarrecovery.co.uk"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
