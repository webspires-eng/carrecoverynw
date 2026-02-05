"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import '../../../../../styles/admin.css';

const DEFAULT_SERVICES_LIST = [
    { title: "Emergency Breakdown Recovery", description: "Available 24/7, our emergency recovery team handles breakdowns, accidents, and roadside issues across {{location}} & outskirts." },
    { title: "Roadside Assistance", description: "Quick fixes for flat tyres, jump starts, and minor mechanical issues to get you moving again fast." },
    { title: "Vehicle Transportation", description: "Safe, fully insured door-to-door transport for cars, vans, and motorcycles locally or nationwide." },
    { title: "Jump Start Service", description: "Fast battery revival service available 24/7. We'll get you started or recover you to a garage." },
    { title: "Low Vehicle Recovery", description: "Specialist flatbed trucks and ramps for sports cars, lowered vehicles, and luxury cars — damage-free guaranteed." },
    { title: "Motorway Recovery ({{majorRoads}})", description: "Priority dispatch for motorway breakdowns. We understand the urgency and safety risks involved." }
];

const DEFAULT_RECOVERIES_LIST = [
    { type: "Flat Battery", location_text: "{{location}} City Centre", description: "Jump start provided for a stranded driver. Recovery to local garage completed within 45 mins.", status_text: "Updates via WhatsApp", icon_name: "Battery", color_theme: "yellow" },
    { type: "Low Clearance", location_text: "{{location}}", description: "Specialized flatbed recovery for a sports car with low ground clearance. Damage-free loading guaranteed.", status_text: "Secure Transport", icon_name: "Car", color_theme: "blue" },
    { type: "Motorway Breakdown", location_text: "{{majorRoads}}", description: "Emergency recovery from a live lane. Location pin confirmed and truck dispatched immediately.", status_text: "Safe Destination", icon_name: "Route", color_theme: "orange" },
    { type: "Locked Wheels", location_text: "{{location}}", description: "Recovered a vehicle with seized brakes using specialized skates. Professional handling from start to finish.", status_text: "Damage-Free", icon_name: "Lock", color_theme: "green" },
    { type: "Accident Recovery", location_text: "{{location}}", description: "Post-accident vehicle recovery to a secure storage facility. Coordinated with emergency services.", status_text: "24/7 Response", icon_name: "TriangleAlert", color_theme: "red" },
    { type: "Transport", location_text: "{{location}} to London", description: "Pre-booked vehicle transportation for a classic car. Door-to-door service with full insurance coverage.", status_text: "Pre-booked", icon_name: "Truck", color_theme: "purple" }
];

export default function EditAreaPage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedSection, setExpandedSection] = useState(null);
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
        custom_services: [],
        custom_recoveries: []
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
                    })(),
                    custom_services: (() => {
                        try {
                            return typeof area.custom_services === 'string'
                                ? JSON.parse(area.custom_services)
                                : (area.custom_services || []);
                        } catch { return []; }
                    })(),
                    custom_recoveries: (() => {
                        try {
                            return typeof area.custom_recoveries === 'string'
                                ? JSON.parse(area.custom_recoveries)
                                : (area.custom_recoveries || []);
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

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
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
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    nearby_areas: formData.nearby_areas ? formData.nearby_areas.split(',').map(r => r.trim()).filter(Boolean) : [],
                    custom_services: formData.custom_services.length > 0 ? JSON.stringify(formData.custom_services) : null,
                    custom_recoveries: formData.custom_recoveries.length > 0 ? JSON.stringify(formData.custom_recoveries) : null
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

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="admin-main">
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading area details...</p>
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
                        <h1>Edit Area</h1>
                        <p>Update location details for {formData.name}</p>
                    </div>
                    <div className="admin-header-actions">
                        <Link href="/admin/areas" className="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back to List
                        </Link>
                        <button type="submit" form="area-form" className="btn btn-primary" disabled={saving}>
                            {saving ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    Update Area
                                </>
                            )}
                        </button>
                    </div>
                </header>

                <form id="area-form" onSubmit={handleSubmit} className="area-form">
                    {/* Basic Information */}
                    <div className="form-section">
                        <div className="section-header-toggle" onClick={() => toggleSection('basic')}>
                            <div className="section-header-left">
                                <div className="section-icon">📝</div>
                                <div>
                                    <h2>Basic Information</h2>
                                    <p className="section-desc">Essential area details and roads</p>
                                </div>
                            </div>
                            <svg
                                className={`chevron ${expandedSection === 'basic' ? 'expanded' : ''}`}
                                width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {expandedSection === 'basic' && (
                            <div className="section-content">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Area Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="e.g. Birmingham"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>URL Slug *</label>
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            required
                                            placeholder="e.g. birmingham"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Major Roads (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={formData.major_roads}
                                            onChange={(e) => setFormData({ ...formData, major_roads: e.target.value })}
                                            placeholder="e.g. M6, A38, M42"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Nearby Areas (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={formData.nearby_areas}
                                            onChange={(e) => setFormData({ ...formData, nearby_areas: e.target.value })}
                                            placeholder="e.g. Solihull, Edgbaston"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SEO Settings */}
                    <div className="form-section">
                        <div className="section-header-toggle" onClick={() => toggleSection('seo')}>
                            <div className="section-header-left">
                                <div className="section-icon">🔍</div>
                                <div>
                                    <h2>SEO Settings</h2>
                                    <p className="section-desc">Optimize for search engines</p>
                                </div>
                            </div>
                            <svg
                                className={`chevron ${expandedSection === 'seo' ? 'expanded' : ''}`}
                                width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {expandedSection === 'seo' && (
                            <div className="section-content">
                                <div className="form-group full-width">
                                    <label>H1 Title</label>
                                    <input
                                        type="text"
                                        value={formData.h1_title}
                                        onChange={(e) => setFormData({ ...formData, h1_title: e.target.value })}
                                        placeholder="e.g. Breakdown Recovery in Birmingham"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Meta Title</label>
                                    <input
                                        type="text"
                                        value={formData.meta_title}
                                        onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                        placeholder="e.g. 24/7 Car Recovery Birmingham | Fast Response"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Meta Description</label>
                                    <textarea
                                        value={formData.meta_description}
                                        onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                        rows={3}
                                        placeholder="Brief description for search results..."
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Intro Text</label>
                                    <textarea
                                        value={formData.intro_text}
                                        onChange={(e) => setFormData({ ...formData, intro_text: e.target.value })}
                                        rows={4}
                                        placeholder="Introduction content for the area page..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FAQs Section */}
                    <div className="form-section">
                        <div className="section-header-toggle" onClick={() => toggleSection('faqs')}>
                            <div className="section-header-left">
                                <div className="section-icon">❓</div>
                                <div>
                                    <h2>FAQs</h2>
                                    <p className="section-desc">Area-specific questions</p>
                                </div>
                                <span className="item-number">{formData.custom_faqs.length}</span>
                            </div>
                            <svg
                                className={`chevron ${expandedSection === 'faqs' ? 'expanded' : ''}`}
                                width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {expandedSection === 'faqs' && (
                            <div className="section-content">
                                <div className="section-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setFormData({
                                        ...formData,
                                        custom_faqs: [...formData.custom_faqs, { question: '', answer: '' }]
                                    })}>
                                        Add FAQ
                                    </button>
                                </div>
                                <div className="items-list">
                                    {formData.custom_faqs.map((faq, index) => (
                                        <div key={index} className="collapsible-item">
                                            <div className="collapsible-header">
                                                <span className="item-number">{index + 1}</span>
                                                <input
                                                    type="text"
                                                    value={faq.question}
                                                    onChange={(e) => {
                                                        const newFaqs = [...formData.custom_faqs];
                                                        newFaqs[index].question = e.target.value;
                                                        setFormData({ ...formData, custom_faqs: newFaqs });
                                                    }}
                                                    placeholder="Question..."
                                                    className="item-title"
                                                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.95rem' }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-icon-delete"
                                                    onClick={() => {
                                                        if (confirm('Delete this FAQ?')) {
                                                            const newFaqs = formData.custom_faqs.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, custom_faqs: newFaqs });
                                                        }
                                                    }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="collapsible-content">
                                                <div className="form-group full-width">
                                                    <label>Answer</label>
                                                    <textarea
                                                        value={faq.answer}
                                                        onChange={(e) => {
                                                            const newFaqs = [...formData.custom_faqs];
                                                            newFaqs[index].answer = e.target.value;
                                                            setFormData({ ...formData, custom_faqs: newFaqs });
                                                        }}
                                                        rows={2}
                                                        placeholder="Answer..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.custom_faqs.length === 0 && (
                                        <div className="empty-items">No FAQs added yet.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Services Section */}
                    <div className="form-section">
                        <div className="section-header-toggle" onClick={() => toggleSection('services')}>
                            <div className="section-header-left">
                                <div className="section-icon">🛠️</div>
                                <div>
                                    <h2>Services</h2>
                                    <p className="section-desc">Custom services for area</p>
                                </div>
                                <span className="item-number">{formData.custom_services.length}</span>
                            </div>
                            <svg
                                className={`chevron ${expandedSection === 'services' ? 'expanded' : ''}`}
                                width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {expandedSection === 'services' && (
                            <div className="section-content">
                                <div className="section-actions">
                                    <select
                                        className="select-input"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const selected = DEFAULT_SERVICES_LIST[e.target.value];
                                                if (formData.custom_services.some(s => s.title === selected.title)) {
                                                    alert('This service has already been added.');
                                                    e.target.value = "";
                                                    return;
                                                }
                                                setFormData({
                                                    ...formData,
                                                    custom_services: [...formData.custom_services, { ...selected }]
                                                });
                                                e.target.value = "";
                                            }
                                        }}
                                    >
                                        <option value="">Add From Defaults</option>
                                        {DEFAULT_SERVICES_LIST.map((s, i) => {
                                            const isAdded = formData.custom_services.some(added => added.title === s.title);
                                            if (isAdded) return null;
                                            return <option key={i} value={i}>{s.title}</option>
                                        })}
                                    </select>
                                    <button type="button" className="btn btn-secondary" onClick={() => setFormData({
                                        ...formData,
                                        custom_services: [...formData.custom_services, { title: '', description: '' }]
                                    })}>
                                        Add Custom
                                    </button>
                                </div>

                                <div className="items-list">
                                    {formData.custom_services.map((service, index) => (
                                        <div key={index} className="collapsible-item">
                                            <div className="collapsible-header">
                                                <span className="item-number">{index + 1}</span>
                                                <span className="item-title">{service.title || 'New Service'}</span>
                                                <button
                                                    type="button"
                                                    className="btn-icon-delete"
                                                    onClick={() => {
                                                        if (confirm('Delete this service?')) {
                                                            const newServices = formData.custom_services.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, custom_services: newServices });
                                                        }
                                                    }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="collapsible-content">
                                                <div className="form-group full-width">
                                                    <label>Service Title</label>
                                                    <input
                                                        type="text"
                                                        value={service.title}
                                                        onChange={(e) => {
                                                            const newServices = [...formData.custom_services];
                                                            newServices[index].title = e.target.value;
                                                            setFormData({ ...formData, custom_services: newServices });
                                                        }}
                                                        placeholder="e.g. 24/7 Breakdown Recovery"
                                                    />
                                                </div>
                                                <div className="form-group full-width">
                                                    <label>Description</label>
                                                    <textarea
                                                        value={service.description}
                                                        onChange={(e) => {
                                                            const newServices = [...formData.custom_services];
                                                            newServices[index].description = e.target.value;
                                                            setFormData({ ...formData, custom_services: newServices });
                                                        }}
                                                        rows={2}
                                                        placeholder="Service description..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.custom_services.length === 0 && (
                                        <div className="empty-items">Using global default services.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recoveries Section */}
                    <div className="form-section">
                        <div className="section-header-toggle" onClick={() => toggleSection('recoveries')}>
                            <div className="section-header-left">
                                <div className="section-icon">🚛</div>
                                <div>
                                    <h2>Recoveries</h2>
                                    <p className="section-desc">Recent work examples</p>
                                </div>
                                <span className="item-number">{formData.custom_recoveries.length}</span>
                            </div>
                            <svg
                                className={`chevron ${expandedSection === 'recoveries' ? 'expanded' : ''}`}
                                width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {expandedSection === 'recoveries' && (
                            <div className="section-content">
                                <div className="section-actions">
                                    <select
                                        className="select-input"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const selected = DEFAULT_RECOVERIES_LIST[e.target.value];
                                                if (formData.custom_recoveries.some(r => r.type === selected.type)) {
                                                    alert('This recovery type has already been added.');
                                                    e.target.value = "";
                                                    return;
                                                }
                                                setFormData({
                                                    ...formData,
                                                    custom_recoveries: [...formData.custom_recoveries, { ...selected }]
                                                });
                                                e.target.value = "";
                                            }
                                        }}
                                    >
                                        <option value="">Add From Defaults</option>
                                        {DEFAULT_RECOVERIES_LIST.map((r, i) => {
                                            const isAdded = formData.custom_recoveries.some(added => added.type === r.type);
                                            if (isAdded) return null;
                                            return <option key={i} value={i}>{r.type}</option>
                                        })}
                                    </select>
                                    <button type="button" className="btn btn-secondary" onClick={() => setFormData({
                                        ...formData,
                                        custom_recoveries: [...formData.custom_recoveries, { type: '', location_text: '', description: '', status_text: '', icon_name: 'Truck', color_theme: 'blue' }]
                                    })}>
                                        Add Custom
                                    </button>
                                </div>

                                <div className="items-list">
                                    {formData.custom_recoveries.map((recovery, index) => (
                                        <div key={index} className="collapsible-item">
                                            <div className="collapsible-header">
                                                <span className="item-number">{index + 1}</span>
                                                <span className="item-title">{recovery.type || 'New Recovery'}</span>
                                                <button
                                                    type="button"
                                                    className="btn-icon-delete"
                                                    onClick={() => {
                                                        if (confirm('Delete this recovery?')) {
                                                            const newRecoveries = formData.custom_recoveries.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, custom_recoveries: newRecoveries });
                                                        }
                                                    }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="collapsible-content">
                                                <div className="form-grid">
                                                    <div className="form-group">
                                                        <label>Recovery Type</label>
                                                        <input
                                                            type="text"
                                                            value={recovery.type}
                                                            onChange={(e) => {
                                                                const newRecs = [...formData.custom_recoveries];
                                                                newRecs[index].type = e.target.value;
                                                                setFormData({ ...formData, custom_recoveries: newRecs });
                                                            }}
                                                            placeholder="e.g. Flat Battery"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Location Text</label>
                                                        <input
                                                            type="text"
                                                            value={recovery.location_text}
                                                            onChange={(e) => {
                                                                const newRecs = [...formData.custom_recoveries];
                                                                newRecs[index].location_text = e.target.value;
                                                                setFormData({ ...formData, custom_recoveries: newRecs });
                                                            }}
                                                            placeholder="e.g. Birmingham City Centre"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-group full-width">
                                                    <label>Description</label>
                                                    <textarea
                                                        value={recovery.description}
                                                        onChange={(e) => {
                                                            const newRecs = [...formData.custom_recoveries];
                                                            newRecs[index].description = e.target.value;
                                                            setFormData({ ...formData, custom_recoveries: newRecs });
                                                        }}
                                                        rows={2}
                                                        placeholder="Recovery details..."
                                                    />
                                                </div>

                                                <div className="form-grid-3">
                                                    <div className="form-group">
                                                        <label>Status Tag</label>
                                                        <input
                                                            type="text"
                                                            value={recovery.status_text}
                                                            onChange={(e) => {
                                                                const newRecs = [...formData.custom_recoveries];
                                                                newRecs[index].status_text = e.target.value;
                                                                setFormData({ ...formData, custom_recoveries: newRecs });
                                                            }}
                                                            placeholder="e.g. Safe Destination"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Icon</label>
                                                        <select
                                                            value={recovery.icon_name}
                                                            onChange={(e) => {
                                                                const newRecs = [...formData.custom_recoveries];
                                                                newRecs[index].icon_name = e.target.value;
                                                                setFormData({ ...formData, custom_recoveries: newRecs });
                                                            }}
                                                        >
                                                            <option value="Battery">Battery</option>
                                                            <option value="Car">Car</option>
                                                            <option value="Route">Route</option>
                                                            <option value="Lock">Lock</option>
                                                            <option value="TriangleAlert">Alert</option>
                                                            <option value="Truck">Truck</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Color Theme</label>
                                                        <select
                                                            value={recovery.color_theme}
                                                            onChange={(e) => {
                                                                const newRecs = [...formData.custom_recoveries];
                                                                newRecs[index].color_theme = e.target.value;
                                                                setFormData({ ...formData, custom_recoveries: newRecs });
                                                            }}
                                                        >
                                                            <option value="yellow">Yellow</option>
                                                            <option value="blue">Blue</option>
                                                            <option value="orange">Orange</option>
                                                            <option value="green">Green</option>
                                                            <option value="red">Red</option>
                                                            <option value="purple">Purple</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.custom_recoveries.length === 0 && (
                                        <div className="empty-items">Using global default recoveries.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Actions */}
                    <div className="form-actions-sticky">
                        <div className="location-hint" style={{ fontSize: '0.85rem', color: 'var(--admin-gray-600)' }}>
                            Dynamic: <strong>{"{{location}}"}</strong> = {formData.name || '...'} • <strong>{"{{majorRoads}}"}</strong> = {formData.major_roads || '...'}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link href="/admin/areas" className="btn btn-secondary">
                                Cancel
                            </Link>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? (
                                    <>
                                        <div className="btn-spinner"></div>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                            <polyline points="7 3 7 8 15 8"></polyline>
                                        </svg>
                                        Update Area
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
