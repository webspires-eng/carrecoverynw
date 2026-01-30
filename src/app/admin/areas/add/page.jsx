"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../../../../styles/admin.css';

const AUTOSAVE_KEY = 'area_form_autosave';
const AUTOSAVE_DELAY = 1000; // 1 second debounce

const DEFAULT_SERVICES_LIST = [
    { title: "Emergency Breakdown Recovery", description: "Available 24/7, our emergency recovery team handles breakdowns, accidents, and roadside issues across {{location}} & outskirts." },
    { title: "Roadside Assistance", description: "Quick fixes for flat tyres, jump starts, and minor mechanical issues to get you moving again fast." },
    { title: "Vehicle Transportation", description: "Safe, fully insured door-to-door transport for cars, vans, and motorcycles locally or nationwide." },
    { title: "Jump Start Service", description: "Fast battery revival service available 24/7. We'll get you started or recover you to a garage." },
    { title: "Low Vehicle Recovery", description: "Specialist flatbed trucks and ramps for sports cars, lowered vehicles, and luxury cars — damage-free guaranteed." },
    { title: "Motorway Recovery ({{majorRoads}})", description: "Priority dispatch for motorway breakdowns. We understand the urgency and safety risks involved." }
];

export default function AddAreaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        h1_title: '',
        intro_text: '',
        meta_title: '',
        meta_description: '',
        major_roads: '',
        latitude: '',
        longitude: '',
        nearby_areas: '',
        custom_faqs: [],
        custom_services: []
    });

    // Load autosaved data on mount
    useEffect(() => {
        const savedData = localStorage.getItem(AUTOSAVE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(parsed);
                setAutoSaveStatus('Draft restored');
                setTimeout(() => setAutoSaveStatus(''), 3000);
            } catch (e) {
                console.error('Failed to parse autosaved data');
            }
        }
    }, []);

    // Autosave with debounce
    useEffect(() => {
        const hasContent = formData.name || formData.slug || formData.intro_text;
        if (!hasContent) return;

        setAutoSaveStatus('Saving...');
        const timeoutId = setTimeout(() => {
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formData));
            setAutoSaveStatus('Draft saved');
            setTimeout(() => setAutoSaveStatus(''), 2000);
        }, AUTOSAVE_DELAY);

        return () => clearTimeout(timeoutId);
    }, [formData]);

    // Clear autosave data
    const clearAutosave = useCallback(() => {
        localStorage.removeItem(AUTOSAVE_KEY);
    }, []);

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
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    nearby_areas: formData.nearby_areas ? formData.nearby_areas.split(',').map(r => r.trim()).filter(Boolean) : [],
                    custom_services: formData.custom_services.length > 0 ? JSON.stringify(formData.custom_services) : null
                })
            });

            const data = await res.json();

            if (data.success) {
                clearAutosave(); // Clear autosave on successful submission
                router.push('/admin/areas');
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Error creating area');
        }

        setLoading(false);
    };

    const handleClearDraft = () => {
        if (confirm('Are you sure you want to clear the saved draft?')) {
            clearAutosave();
            setFormData({
                name: '',
                slug: '',
                slug: '',
                h1_title: '',
                intro_text: '',
                meta_title: '',
                meta_description: '',
                major_roads: '',
                latitude: '',
                longitude: '',
                nearby_areas: '',
                custom_faqs: [],
                custom_services: []
            });
            setAutoSaveStatus('Draft cleared');
            setTimeout(() => setAutoSaveStatus(''), 2000);
        }
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div>
                    <h1>Add New Area</h1>
                    <p>Create a new location page</p>
                </div>
                <div className="header-actions">
                    {autoSaveStatus && (
                        <span className="autosave-status">{autoSaveStatus}</span>
                    )}
                    <Link href="/admin/areas" className="btn-back">← Back to List</Link>
                </div>
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
                                    meta_title: `24/7 Car Recovery in ${e.target.value} | Car Recovery UK`,
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
                            <label>Major Roads (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.major_roads}
                                onChange={(e) => setFormData({ ...formData, major_roads: e.target.value })}
                                placeholder="e.g., M6, M5, A38"
                            />
                        </div>
                        <div className="form-group">
                            <label>Nearby Areas (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.nearby_areas}
                                onChange={(e) => setFormData({ ...formData, nearby_areas: e.target.value })}
                                placeholder="e.g., Solihull, Sutton Coldfield"
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


                {/* FAQs Section */}
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
                                            placeholder="e.g. How much does recovery cost?"
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
                                            placeholder="Enter the answer..."
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


                {/* Services Section */}
                <div className="form-section">
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2>Services Section Descriptions</h2>
                            <p className="section-desc">Add custom services for this area. If empty, global defaults will be used.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select
                                className="btn-secondary"
                                style={{ padding: '8px', cursor: 'pointer' }}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const selected = DEFAULT_SERVICES_LIST[e.target.value];
                                        setFormData({
                                            ...formData,
                                            custom_services: [...formData.custom_services, { ...selected }]
                                        });
                                        e.target.value = "";
                                    }
                                }}
                            >
                                <option value="">+ Add From Defaults</option>
                                {DEFAULT_SERVICES_LIST.map((s, i) => (
                                    <option key={i} value={i}>{s.title}</option>
                                ))}
                            </select>
                            <button type="button" className="btn-secondary" onClick={() => setFormData({
                                ...formData,
                                custom_services: [...formData.custom_services, { title: '', description: '' }]
                            })}>
                                + Add Custom
                            </button>
                        </div>
                    </div>

                    <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
                        {formData.custom_services.map((service, index) => (
                            <div key={index} className="form-group full-width" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', position: 'relative' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newServices = formData.custom_services.filter((_, i) => i !== index);
                                        setFormData({ ...formData, custom_services: newServices });
                                    }}
                                    style={{ position: 'absolute', top: '10px', right: '10px', background: '#dc3545', border: 'none', color: 'white', width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    ×
                                </button>
                                <label style={{ fontWeight: 'bold' }}>Service Title</label>
                                <input
                                    type="text"
                                    value={service.title}
                                    onChange={(e) => {
                                        const newServices = [...formData.custom_services];
                                        newServices[index].title = e.target.value;
                                        setFormData({ ...formData, custom_services: newServices });
                                    }}
                                    placeholder="e.g. 24/7 Breakdown Recovery"
                                    style={{ marginBottom: '10px' }}
                                />
                                <label style={{ fontWeight: 'bold' }}>Description</label>
                                <textarea
                                    value={service.description}
                                    onChange={(e) => {
                                        const newServices = [...formData.custom_services];
                                        newServices[index].description = e.target.value;
                                        setFormData({ ...formData, custom_services: newServices });
                                    }}
                                    placeholder="Enter description..."
                                    rows={3}
                                />
                                <span className="input-hint" style={{ fontSize: '0.8rem', color: '#6c757d' }}>Use {"{{location}}"} and {"{{majorRoads}}"} for dynamic text.</span>
                            </div>
                        ))}
                        {formData.custom_services.length === 0 && (
                            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#6c757d', fontStyle: 'italic', padding: '20px' }}>
                                Using global default services. Add overrides above to customize.
                            </p>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-clear-draft" onClick={handleClearDraft}>
                        Clear Draft
                    </button>
                    <Link href="/admin/areas" className="btn-cancel">Cancel</Link>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Area'}
                    </button>
                </div>
            </form>
        </div>
    );
}
