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
        slug: '',
        h1_title: '',
        intro_text: '',
        meta_title: '',
        meta_description: '',
        major_roads: '',
        latitude: '',
        latitude: '',
        longitude: '',
        nearby_areas: '',
        custom_faqs: []
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
                    h1_title: area.h1_title || '',
                    intro_text: area.intro_text || '',
                    meta_title: area.meta_title || '',
                    meta_description: area.meta_description || '',
                    major_roads: (() => {
                        try {
                            const roads = typeof area.major_roads === 'string' && area.major_roads.startsWith('[')
                                ? JSON.parse(area.major_roads)
                                : area.major_roads;
                            return Array.isArray(roads) ? roads.join(', ') : (roads || '');
                        } catch { return area.major_roads || ''; }
                    })(),
                    latitude: area.latitude || '',
                    latitude: area.latitude || '',
                    longitude: area.longitude || '',
                    nearby_areas: (() => {
                        try {
                            const areas = typeof area.nearby_areas === 'string' && area.nearby_areas.startsWith('[')
                                ? JSON.parse(area.nearby_areas)
                                : area.nearby_areas;
                            return Array.isArray(areas) ? areas.join(', ') : (areas || '');
                        } catch { return area.nearby_areas || ''; }
                    })(),
                    custom_faqs: (() => {
                        try {
                            return typeof area.custom_faqs === 'string'
                                ? JSON.parse(area.custom_faqs)
                                : (area.custom_faqs || []);
                        } catch { return []; }
                    })()
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
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    nearby_areas: formData.nearby_areas ? formData.nearby_areas.split(',').map(r => r.trim()).filter(Boolean) : []
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
                            <label>Major Roads</label>
                            <input
                                type="text"
                                value={formData.major_roads}
                                onChange={(e) => setFormData({ ...formData, major_roads: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Nearby Areas (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.nearby_areas}
                                onChange={(e) => setFormData({ ...formData, nearby_areas: e.target.value })}
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

                <div className="form-section">
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2>FAQs</h2>
                            <p className="section-desc">Add area-specific frequently asked questions</p>
                        </div>
                        <button type="button" className="btn-secondary" onClick={() => setFormData({
                            ...formData,
                            custom_faqs: [...formData.custom_faqs, { question: '', answer: '' }]
                        })}>
                            + Add FAQ
                        </button>
                    </div>

                    <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                        {formData.custom_faqs.map((faq, index) => (
                            <details key={index} className="faq-item" style={{ background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', overflow: 'hidden' }}>
                                <summary style={{ padding: '15px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e9ecef' }}>
                                    <span>{faq.question || `FAQ #${index + 1}`}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent details toggle
                                            if (confirm('Delete this FAQ?')) {
                                                const newFaqs = formData.custom_faqs.filter((_, i) => i !== index);
                                                setFormData({ ...formData, custom_faqs: newFaqs });
                                            }
                                        }}
                                        style={{ background: '#dc3545', border: 'none', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1rem' }}
                                        title="Remove FAQ"
                                    >
                                        ×
                                    </button>
                                </summary>
                                <div style={{ padding: '20px' }}>
                                    <div className="form-group full-width">
                                        <label>Question</label>
                                        <input
                                            type="text"
                                            value={faq.question}
                                            onChange={(e) => {
                                                const newFaqs = [...formData.custom_faqs];
                                                newFaqs[index].question = e.target.value;
                                                setFormData({ ...formData, custom_faqs: newFaqs });
                                            }}
                                        />
                                    </div>
                                    <div className="form-group full-width" style={{ marginTop: '15px' }}>
                                        <label>Answer</label>
                                        <textarea
                                            value={faq.answer}
                                            onChange={(e) => {
                                                const newFaqs = [...formData.custom_faqs];
                                                newFaqs[index].answer = e.target.value;
                                                setFormData({ ...formData, custom_faqs: newFaqs });
                                            }}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </details>
                        ))}
                        {formData.custom_faqs.length === 0 && (
                            <p style={{ color: '#6c757d', fontStyle: 'italic', textAlign: 'center' }}>No FAQs added yet.</p>
                        )}
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
