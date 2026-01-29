"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../../../styles/admin.css';

export default function AddAreaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        county: '',
        region: 'West Midlands',
        postcode_prefix: '',
        h1_title: '',
        intro_text: '',
        meta_title: '',
        meta_description: '',
        major_roads: '',
        latitude: '',
        longitude: ''
    });

    const generateSlug = (name) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/areas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    major_roads: formData.major_roads.split(',').map(r => r.trim()).filter(Boolean),
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null
                })
            });

            const data = await res.json();

            if (data.success) {
                router.push('/admin/areas');
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Error creating area');
        }

        setLoading(false);
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div>
                    <h1>Add New Area</h1>
                    <p>Create a new location page</p>
                </div>
                <Link href="/admin/areas" className="btn-back">← Back to List</Link>
            </header>

            <form onSubmit={handleSubmit} className="area-form">
                {/* Basic Information */}
                <div className="form-section">
                    <h2>Basic Information</h2>
                    <p className="section-desc">Required fields for the area page</p>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Area Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    name: e.target.value,
                                    slug: generateSlug(e.target.value),
                                    h1_title: `24/7 Car Recovery & Emergency Towing in ${e.target.value}`,
                                    meta_title: `24/7 Car Recovery in ${e.target.value} | ABZ Car Recovery`,
                                    meta_description: `Fast and reliable car recovery services in ${e.target.value}. Available 24/7 for breakdowns, accidents, and vehicle transport.`
                                })}
                                placeholder="e.g., Birmingham"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>URL Slug *</label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="e.g., birmingham"
                                required
                            />
                            <span className="input-hint">URL: /area/{formData.slug || 'slug'}</span>
                        </div>
                        <div className="form-group">
                            <label>County</label>
                            <input
                                type="text"
                                value={formData.county}
                                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                                placeholder="e.g., West Midlands"
                            />
                        </div>
                        <div className="form-group">
                            <label>Region</label>
                            <input
                                type="text"
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                placeholder="e.g., West Midlands"
                            />
                        </div>
                        <div className="form-group">
                            <label>Postcode Prefix</label>
                            <input
                                type="text"
                                value={formData.postcode_prefix}
                                onChange={(e) => setFormData({ ...formData, postcode_prefix: e.target.value })}
                                placeholder="e.g., B, CV, WV"
                            />
                        </div>
                        <div className="form-group">
                            <label>Major Roads (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.major_roads}
                                onChange={(e) => setFormData({ ...formData, major_roads: e.target.value })}
                                placeholder="e.g., M6, M5, A38"
                            />
                        </div>
                    </div>
                </div>

                {/* Location Coordinates */}
                <div className="form-section">
                    <h2>Location Coordinates</h2>
                    <p className="section-desc">Optional - Used for map display</p>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Latitude</label>
                            <input
                                type="text"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                placeholder="e.g., 52.4862"
                            />
                        </div>
                        <div className="form-group">
                            <label>Longitude</label>
                            <input
                                type="text"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                placeholder="e.g., -1.8904"
                            />
                        </div>
                    </div>
                </div>

                {/* SEO Settings */}
                <div className="form-section">
                    <h2>SEO Settings</h2>
                    <p className="section-desc">Auto-generated but can be customized</p>

                    <div className="form-group full-width">
                        <label>H1 Title</label>
                        <input
                            type="text"
                            value={formData.h1_title}
                            onChange={(e) => setFormData({ ...formData, h1_title: e.target.value })}
                            placeholder="Main heading on the page"
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Meta Title (for search results)</label>
                        <input
                            type="text"
                            value={formData.meta_title}
                            onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                            placeholder="Page title in browser tab and search results"
                        />
                        <span className="input-hint">{formData.meta_title.length}/60 characters</span>
                    </div>

                    <div className="form-group full-width">
                        <label>Meta Description</label>
                        <textarea
                            value={formData.meta_description}
                            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                            placeholder="Description shown in search results"
                            rows={3}
                        />
                        <span className="input-hint">{formData.meta_description.length}/160 characters</span>
                    </div>

                    <div className="form-group full-width">
                        <label>Intro Text</label>
                        <textarea
                            value={formData.intro_text}
                            onChange={(e) => setFormData({ ...formData, intro_text: e.target.value })}
                            placeholder="Introduction paragraph for the area (optional)"
                            rows={4}
                        />
                    </div>
                </div>

                {/* Section Customization - Placeholder */}
                <div className="form-section coming-soon">
                    <h2>Section Customization</h2>
                    <p className="section-desc">Configure which sections to show and customize content</p>

                    <div className="placeholder-box">
                        <p><strong>Coming Soon:</strong> Once you specify which sections should be dynamic vs static, we'll add controls here for:</p>
                        <ul>
                            <li>Toggle sections on/off per area</li>
                            <li>Custom content for dynamic sections</li>
                            <li>Area-specific FAQs</li>
                            <li>Custom testimonials by area</li>
                            <li>Nearby areas linking</li>
                        </ul>
                    </div>
                </div>

                <div className="form-actions">
                    <Link href="/admin/areas" className="btn-cancel">Cancel</Link>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Area'}
                    </button>
                </div>
            </form>
        </div>
    );
}
