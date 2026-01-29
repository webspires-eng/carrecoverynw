"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import '../../../../../styles/admin.css';

export default function EditAreaPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    useEffect(() => {
        if (id) {
            fetchArea();
        }
    }, [id]);

    const fetchArea = async () => {
        try {
            const res = await fetch(`/api/areas/${id}`);
            const data = await res.json();

            if (data.success) {
                const area = data.data;
                setFormData({
                    name: area.name || '',
                    slug: area.slug || '',
                    county: area.county || '',
                    region: area.region || 'West Midlands',
                    postcode_prefix: area.postcode_prefix || '',
                    h1_title: area.h1_title || '',
                    intro_text: area.intro_text || '',
                    meta_title: area.meta_title || '',
                    meta_description: area.meta_description || '',
                    major_roads: Array.isArray(area.major_roads) ? area.major_roads.join(', ') : '',
                    latitude: area.latitude || '',
                    longitude: area.longitude || ''
                });
            } else {
                alert('Area not found');
                router.push('/admin/areas');
            }
        } catch (error) {
            console.error('Error fetching area:', error);
            alert('Error loading area data');
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/areas/${id}`, {
                method: 'PUT',
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
            alert('Error updating area');
        }

        setSaving(false);
    };

    if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div>
                    <h1>Edit Area</h1>
                    <p>Update location details for {formData.name}</p>
                </div>
                <Link href="/admin/areas" className="btn-back">← Back to List</Link>
            </header>

            <form onSubmit={handleSubmit} className="area-form">
                {/* Basic Information */}
                <div className="form-section">
                    <h2>Basic Information</h2>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Area Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>URL Slug *</label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>County</label>
                            <input
                                type="text"
                                value={formData.county}
                                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Region</label>
                            <input
                                type="text"
                                value={formData.region}
                                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Postcode Prefix</label>
                            <input
                                type="text"
                                value={formData.postcode_prefix}
                                onChange={(e) => setFormData({ ...formData, postcode_prefix: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Major Roads</label>
                            <input
                                type="text"
                                value={formData.major_roads}
                                onChange={(e) => setFormData({ ...formData, major_roads: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Location Coordinates */}
                <div className="form-section">
                    <h2>Location Coordinates</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Latitude</label>
                            <input
                                type="text"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Longitude</label>
                            <input
                                type="text"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* SEO Settings */}
                <div className="form-section">
                    <h2>SEO Settings</h2>

                    <div className="form-group full-width">
                        <label>H1 Title</label>
                        <input
                            type="text"
                            value={formData.h1_title}
                            onChange={(e) => setFormData({ ...formData, h1_title: e.target.value })}
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Meta Title</label>
                        <input
                            type="text"
                            value={formData.meta_title}
                            onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Meta Description</label>
                        <textarea
                            value={formData.meta_description}
                            onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Intro Text</label>
                        <textarea
                            value={formData.intro_text}
                            onChange={(e) => setFormData({ ...formData, intro_text: e.target.value })}
                            rows={4}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <Link href="/admin/areas" className="btn-cancel">Cancel</Link>
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Updating...' : 'Update Area'}
                    </button>
                </div>
            </form>
        </div>
    );
}
