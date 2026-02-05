"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../../../../styles/admin.css';

const AUTOSAVE_KEY = 'area_form_autosave';
const AUTOSAVE_DELAY = 1000;

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

export default function AddAreaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState('');
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        seo: true,
        faqs: false,
        services: false,
        recoveries: false
    });
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

    const clearAutosave = useCallback(() => {
        localStorage.removeItem(AUTOSAVE_KEY);
    }, []);

    const generateSlug = (name) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null,
                    nearby_areas: formData.nearby_areas ? formData.nearby_areas.split(',').map(r => r.trim()).filter(Boolean) : [],
                    custom_services: formData.custom_services.length > 0 ? JSON.stringify(formData.custom_services) : null,
                    custom_recoveries: formData.custom_recoveries.length > 0 ? JSON.stringify(formData.custom_recoveries) : null
                })
            });

            const data = await res.json();

            if (data.success) {
                clearAutosave();
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
            setAutoSaveStatus('Draft cleared');
            setTimeout(() => setAutoSaveStatus(''), 2000);
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1>Add New Area</h1>
                        <p>Create a new location page for your website</p>
                    </div>
                    <div className="admin-header-actions">
                        {autoSaveStatus && (
                            <span className="autosave-status">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                {autoSaveStatus}
                            </span>
                        )}
                        <Link href="/admin/areas" className="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back to List
                        </Link>
                        <button type="submit" form="area-form" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    Create Area
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
                                <div className="section-icon">📍</div>
                                <div>
                                    <h2>Basic Information</h2>
                                    <p className="section-desc">Required fields for the area page</p>
                                </div>
                            </div>
                            <svg className={`chevron ${expandedSections.basic ? 'expanded' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {expandedSections.basic && (
                            <div className="section-content">
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
                                        <label>Major Roads</label>
                                        <input
                                            type="text"
                                            value={formData.major_roads}
                                            onChange={(e) => setFormData({ ...formData, major_roads: e.target.value })}
                                            placeholder="e.g., M6, M5, A38"
                                        />
                                        <span className="input-hint">Comma-separated list of major roads</span>
                                    </div>
                                    <div className="form-group">
                                        <label>Nearby Areas</label>
                                        <input
                                            type="text"
                                            value={formData.nearby_areas}
                                            onChange={(e) => setFormData({ ...formData, nearby_areas: e.target.value })}
                                            placeholder="e.g., Solihull, Sutton Coldfield"
                                        />
                                        <span className="input-hint">Comma-separated list of nearby areas</span>
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
                                    <p className="section-desc">Auto-generated but can be customized</p>
                                </div>
                            </div>
                            <svg className={`chevron ${expandedSections.seo ? 'expanded' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {expandedSections.seo && (
                            <div className="section-content">
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
                        )}
                    </div>

                    {/* FAQs Section */}
                    <div className="form-section">
                        <div className="section-header-toggle" onClick={() => toggleSection('faqs')}>
                            <div className="section-header-left">
                                <div className="section-icon">❓</div>
                                <div>
                                    <h2>FAQs</h2>
                                    <p className="section-desc">{formData.custom_faqs.length} custom FAQ{formData.custom_faqs.length !== 1 ? 's' : ''} added</p>
                                </div>
                            </div>
                            <svg className={`chevron ${expandedSections.faqs ? 'expanded' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {expandedSections.faqs && (
                            <div className="section-content">
                                <div className="section-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setFormData({
                                        ...formData,
                                        custom_faqs: [...formData.custom_faqs, { question: '', answer: '' }]
                                    })}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        Add FAQ
                                    </button>
                                </div>

                                <div className="items-list">
                                    {formData.custom_faqs.map((faq, index) => (
                                        <div key={index} className="collapsible-item">
                                            <div className="collapsible-header">
                                                <span className="item-number">{index + 1}</span>
                                                <span className="item-title">{faq.question || 'New FAQ'}</span>
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
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="collapsible-content">
                                                <div className="form-group">
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
                                                <div className="form-group">
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
                                        </div>
                                    ))}
                                    {formData.custom_faqs.length === 0 && (
                                        <div className="empty-items">
                                            <p>No FAQs added yet. Click "Add FAQ" to create one.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Services Section */}
                    <div className="form-section">
                        <div className="section-header-toggle" onClick={() => toggleSection('services')}>
                            <div className="section-header-left">
                                <div className="section-icon">🔧</div>
                                <div>
                                    <h2>Services</h2>
                                    <p className="section-desc">{formData.custom_services.length} custom service{formData.custom_services.length !== 1 ? 's' : ''} • Uses defaults if empty</p>
                                </div>
                            </div>
                            <svg className={`chevron ${expandedSections.services ? 'expanded' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {expandedSections.services && (
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
                                        <option value="">+ Add From Defaults</option>
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
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
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
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="collapsible-content">
                                                <div className="form-group">
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
                                                <div className="form-group">
                                                    <label>Description</label>
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
                                                    <span className="input-hint">Use {"{{location}}"} and {"{{majorRoads}}"} for dynamic text.</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.custom_services.length === 0 && (
                                        <div className="empty-items">
                                            <p>Using global default services. Add overrides above to customize.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Real Recoveries Section */}
                    <div className="form-section">
                        <div className="section-header-toggle" onClick={() => toggleSection('recoveries')}>
                            <div className="section-header-left">
                                <div className="section-icon">🚗</div>
                                <div>
                                    <h2>Real Recoveries</h2>
                                    <p className="section-desc">{formData.custom_recoveries.length} custom recover{formData.custom_recoveries.length !== 1 ? 'ies' : 'y'} • Uses defaults if empty</p>
                                </div>
                            </div>
                            <svg className={`chevron ${expandedSections.recoveries ? 'expanded' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {expandedSections.recoveries && (
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
                                        <option value="">+ Add From Defaults</option>
                                        {DEFAULT_RECOVERIES_LIST.map((r, i) => {
                                            const isAdded = formData.custom_recoveries.some(added => added.type === r.type);
                                            if (isAdded) return null;
                                            return <option key={i} value={i}>{r.type} - {r.color_theme}</option>
                                        })}
                                    </select>
                                    <button type="button" className="btn btn-secondary" onClick={() => setFormData({
                                        ...formData,
                                        custom_recoveries: [...formData.custom_recoveries, { type: '', location_text: '', description: '', status_text: '', icon_name: 'Truck', color_theme: 'blue' }]
                                    })}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        Add Custom
                                    </button>
                                </div>

                                <div className="items-list">
                                    {formData.custom_recoveries.map((recovery, index) => (
                                        <div key={index} className="collapsible-item">
                                            <div className="collapsible-header">
                                                <span className="item-number">{index + 1}</span>
                                                <span className="item-title">{recovery.type || 'New Recovery'} - {recovery.location_text || 'No Location'}</span>
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
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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
                                                        placeholder="Enter details of the recovery..."
                                                        rows={2}
                                                    />
                                                </div>

                                                <div className="form-grid form-grid-3">
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
                                                            className="select-input"
                                                        >
                                                            <option value="Battery">🔋 Battery</option>
                                                            <option value="Car">🚗 Car</option>
                                                            <option value="Route">🛣️ Route</option>
                                                            <option value="Lock">🔒 Lock</option>
                                                            <option value="TriangleAlert">⚠️ Alert</option>
                                                            <option value="Truck">🚚 Truck</option>
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
                                                            className="select-input"
                                                        >
                                                            <option value="yellow">🟡 Yellow</option>
                                                            <option value="blue">🔵 Blue</option>
                                                            <option value="orange">🟠 Orange</option>
                                                            <option value="green">🟢 Green</option>
                                                            <option value="red">🔴 Red</option>
                                                            <option value="purple">🟣 Purple</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <span className="input-hint">Use {"{{location}}"} and {"{{majorRoads}}"} for dynamic text.</span>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.custom_recoveries.length === 0 && (
                                        <div className="empty-items">
                                            <p>Using global default recoveries. Add overrides above to customize.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions-sticky">
                        <button type="button" className="btn btn-secondary" onClick={handleClearDraft}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Clear Draft
                        </button>
                        <Link href="/admin/areas" className="btn btn-secondary">
                            Cancel
                        </Link>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    Create Area
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
