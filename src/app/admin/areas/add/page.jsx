"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';
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
    const [activeTab, setActiveTab] = useState('content');
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        h1_title: '',
        meta_title: '',
        meta_description: '',
        major_roads: '',
        latitude: '',
        longitude: '',
        nearby_areas: '',
        custom_faqs: [],
        custom_services: [],
        custom_recoveries: [],
        bottom_content: ''
    });

    const [expandedItems, setExpandedItems] = useState({
        faqs: null,
        services: null,
        recoveries: null
    });

    const toggleItem = (section, index) => {
        setExpandedItems(prev => ({
            ...prev,
            [section]: prev[section] === index ? null : index
        }));
    };

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
                router.push(`/admin/areas/${data.id}/edit`);
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
                meta_title: '',
                meta_description: '',
                major_roads: '',
                latitude: '',
                longitude: '',
                nearby_areas: '',
                custom_faqs: [],
                custom_services: [],
                custom_recoveries: [],
                bottom_content: ''
            });
            setAutoSaveStatus('Draft cleared');
            setTimeout(() => setAutoSaveStatus(''), 2000);
        }
    };

    const renderFAQs = () => (
        <div className="cms-panel">
            <div className="cms-panel-header">
                <div className="cms-panel-title">
                    <span className="cms-panel-icon">❓</span>
                    <span>FAQs</span>
                    {formData.custom_faqs.length > 0 && (
                        <span className="cms-count-badge">{formData.custom_faqs.length}</span>
                    )}
                </div>
                <button type="button" className="cms-add-btn" onClick={() => {
                    const newFaqs = [...formData.custom_faqs, { question: '', answer: '' }];
                    setFormData({ ...formData, custom_faqs: newFaqs });
                    setExpandedItems(prev => ({ ...prev, faqs: newFaqs.length - 1 }));
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add FAQ
                </button>
            </div>
            <div className="cms-panel-body">
                {formData.custom_faqs.length === 0 ? (
                    <div className="cms-empty-state">
                        <span className="cms-empty-icon">❓</span>
                        <p>No FAQs added yet</p>
                        <span className="cms-empty-hint">Click &quot;Add FAQ&quot; to create area-specific questions</span>
                    </div>
                ) : (
                    <div className="cms-items-list">
                        {formData.custom_faqs.map((faq, index) => (
                            <div key={index} className={`cms-item ${expandedItems.faqs === index ? 'cms-item-expanded' : ''}`}>
                                <div className="cms-item-header" onClick={() => toggleItem('faqs', index)}>
                                    <div className="cms-item-drag">
                                        <span className="cms-item-num">{index + 1}</span>
                                    </div>
                                    <div className="cms-item-preview">
                                        {faq.question || 'Untitled FAQ'}
                                    </div>
                                    <div className="cms-item-actions">
                                        <button type="button" className="cms-item-delete" onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this FAQ?')) {
                                                const newFaqs = formData.custom_faqs.filter((_, i) => i !== index);
                                                setFormData({ ...formData, custom_faqs: newFaqs });
                                            }
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                        <svg className={`cms-item-chevron ${expandedItems.faqs === index ? 'expanded' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </div>
                                </div>
                                {expandedItems.faqs === index && (
                                    <div className="cms-item-body">
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
                                                placeholder="Enter the question..."
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
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderServices = () => (
        <div className="cms-panel">
            <div className="cms-panel-header">
                <div className="cms-panel-title">
                    <span className="cms-panel-icon">🔧</span>
                    <span>Services</span>
                    {formData.custom_services.length > 0 && (
                        <span className="cms-count-badge">{formData.custom_services.length}</span>
                    )}
                </div>
                <div className="cms-header-actions">
                    <select
                        className="cms-select-small"
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
                        <option value="">+ From Defaults</option>
                        {DEFAULT_SERVICES_LIST.map((s, i) => {
                            const isAdded = formData.custom_services.some(added => added.title === s.title);
                            if (isAdded) return null;
                            return <option key={i} value={i}>{s.title}</option>
                        })}
                    </select>
                    <button type="button" className="cms-add-btn" onClick={() => {
                        const newServices = [...formData.custom_services, { title: '', description: '' }];
                        setFormData({ ...formData, custom_services: newServices });
                        setExpandedItems(prev => ({ ...prev, services: newServices.length - 1 }));
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Custom
                    </button>
                </div>
            </div>
            <div className="cms-panel-body">
                {formData.custom_services.length === 0 ? (
                    <div className="cms-empty-state">
                        <span className="cms-empty-icon">🔧</span>
                        <p>Using default services</p>
                        <span className="cms-empty-hint">Add custom services to override defaults for this area</span>
                    </div>
                ) : (
                    <div className="cms-items-list">
                        {formData.custom_services.map((service, index) => (
                            <div key={index} className={`cms-item ${expandedItems.services === index ? 'cms-item-expanded' : ''}`}>
                                <div className="cms-item-header" onClick={() => toggleItem('services', index)}>
                                    <div className="cms-item-drag">
                                        <span className="cms-item-num">{index + 1}</span>
                                    </div>
                                    <div className="cms-item-preview">
                                        {service.title || 'New Service'}
                                    </div>
                                    <div className="cms-item-actions">
                                        <button type="button" className="cms-item-delete" onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this service?')) {
                                                const newServices = formData.custom_services.filter((_, i) => i !== index);
                                                setFormData({ ...formData, custom_services: newServices });
                                            }
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                        <svg className={`cms-item-chevron ${expandedItems.services === index ? 'expanded' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </div>
                                </div>
                                {expandedItems.services === index && (
                                    <div className="cms-item-body">
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
                                                placeholder="Service description..."
                                                rows={3}
                                            />
                                            <span className="input-hint">Use {"{{location}}"} and {"{{majorRoads}}"} for dynamic text.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderRecoveries = () => (
        <div className="cms-panel">
            <div className="cms-panel-header">
                <div className="cms-panel-title">
                    <span className="cms-panel-icon">🚗</span>
                    <span>Real Recoveries</span>
                    {formData.custom_recoveries.length > 0 && (
                        <span className="cms-count-badge">{formData.custom_recoveries.length}</span>
                    )}
                </div>
                <div className="cms-header-actions">
                    <select
                        className="cms-select-small"
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
                        <option value="">+ From Defaults</option>
                        {DEFAULT_RECOVERIES_LIST.map((r, i) => {
                            const isAdded = formData.custom_recoveries.some(added => added.type === r.type);
                            if (isAdded) return null;
                            return <option key={i} value={i}>{r.type} ({r.color_theme})</option>
                        })}
                    </select>
                    <button type="button" className="cms-add-btn" onClick={() => {
                        const newRecs = [...formData.custom_recoveries, { type: '', location_text: '', description: '', status_text: '', icon_name: 'Truck', color_theme: 'blue' }];
                        setFormData({ ...formData, custom_recoveries: newRecs });
                        setExpandedItems(prev => ({ ...prev, recoveries: newRecs.length - 1 }));
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Custom
                    </button>
                </div>
            </div>
            <div className="cms-panel-body">
                {formData.custom_recoveries.length === 0 ? (
                    <div className="cms-empty-state">
                        <span className="cms-empty-icon">🚗</span>
                        <p>Using default recoveries</p>
                        <span className="cms-empty-hint">Add custom recovery examples for this area</span>
                    </div>
                ) : (
                    <div className="cms-items-list">
                        {formData.custom_recoveries.map((recovery, index) => (
                            <div key={index} className={`cms-item ${expandedItems.recoveries === index ? 'cms-item-expanded' : ''}`}>
                                <div className="cms-item-header" onClick={() => toggleItem('recoveries', index)}>
                                    <div className="cms-item-drag">
                                        <span className="cms-item-num">{index + 1}</span>
                                    </div>
                                    <div className="cms-item-preview">
                                        <span>{recovery.type || 'New Recovery'}</span>
                                        {recovery.color_theme && (
                                            <span className={`cms-color-dot cms-dot-${recovery.color_theme}`}></span>
                                        )}
                                    </div>
                                    <div className="cms-item-actions">
                                        <button type="button" className="cms-item-delete" onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this recovery?')) {
                                                const newRecs = formData.custom_recoveries.filter((_, i) => i !== index);
                                                setFormData({ ...formData, custom_recoveries: newRecs });
                                            }
                                        }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                        <svg className={`cms-item-chevron ${expandedItems.recoveries === index ? 'expanded' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </div>
                                </div>
                                {expandedItems.recoveries === index && (
                                    <div className="cms-item-body">
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Recovery Type</label>
                                                <input type="text" value={recovery.type}
                                                    onChange={(e) => { const r = [...formData.custom_recoveries]; r[index].type = e.target.value; setFormData({ ...formData, custom_recoveries: r }); }}
                                                    placeholder="e.g. Flat Battery" />
                                            </div>
                                            <div className="form-group">
                                                <label>Location Text</label>
                                                <input type="text" value={recovery.location_text}
                                                    onChange={(e) => { const r = [...formData.custom_recoveries]; r[index].location_text = e.target.value; setFormData({ ...formData, custom_recoveries: r }); }}
                                                    placeholder="e.g. Birmingham City Centre" />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Description</label>
                                            <textarea value={recovery.description}
                                                onChange={(e) => { const r = [...formData.custom_recoveries]; r[index].description = e.target.value; setFormData({ ...formData, custom_recoveries: r }); }}
                                                placeholder="Recovery details..." rows={2} />
                                        </div>
                                        <div className="form-grid form-grid-3">
                                            <div className="form-group">
                                                <label>Status Tag</label>
                                                <input type="text" value={recovery.status_text}
                                                    onChange={(e) => { const r = [...formData.custom_recoveries]; r[index].status_text = e.target.value; setFormData({ ...formData, custom_recoveries: r }); }}
                                                    placeholder="e.g. Safe Destination" />
                                            </div>
                                            <div className="form-group">
                                                <label>Icon</label>
                                                <select value={recovery.icon_name} className="select-input"
                                                    onChange={(e) => { const r = [...formData.custom_recoveries]; r[index].icon_name = e.target.value; setFormData({ ...formData, custom_recoveries: r }); }}>
                                                    <option value="Battery">🔋 Battery</option>
                                                    <option value="Car">🚗 Car</option>
                                                    <option value="Route">🛣️ Route</option>
                                                    <option value="Lock">🔒 Lock</option>
                                                    <option value="TriangleAlert">⚠️ Alert</option>
                                                    <option value="Truck">🚚 Truck</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Color</label>
                                                <select value={recovery.color_theme} className="select-input"
                                                    onChange={(e) => { const r = [...formData.custom_recoveries]; r[index].color_theme = e.target.value; setFormData({ ...formData, custom_recoveries: r }); }}>
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
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                {/* Top Bar */}
                <header className="cms-topbar">
                    <div className="cms-topbar-left">
                        <Link href="/admin/areas" className="cms-back-link">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Areas
                        </Link>
                        <span className="cms-topbar-divider">/</span>
                        <span className="cms-topbar-current">Add New</span>
                    </div>
                    <div className="cms-topbar-right">
                        {autoSaveStatus && (
                            <span className="autosave-status">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                </svg>
                                {autoSaveStatus}
                            </span>
                        )}
                        <button type="button" className="btn btn-secondary cms-topbar-btn" onClick={handleClearDraft}>
                            Clear Draft
                        </button>
                        <button type="submit" form="area-form" className="btn btn-primary cms-topbar-btn" disabled={loading}>
                            {loading ? (
                                <><div className="btn-spinner"></div>Creating...</>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    Publish
                                </>
                            )}
                        </button>
                    </div>
                </header>

                <form id="area-form" onSubmit={handleSubmit}>
                    {/* Title Section */}
                    <div className="cms-title-section">
                        <input
                            type="text"
                            className="cms-title-input"
                            value={formData.name}
                            onChange={(e) => setFormData({
                                ...formData,
                                name: e.target.value,
                                slug: generateSlug(e.target.value),
                                h1_title: `24/7 Car Recovery & Emergency Towing in ${e.target.value}`,
                                meta_title: `24/7 Car Recovery in ${e.target.value} | Car Recovery UK`,
                                meta_description: `Fast and reliable car recovery services in ${e.target.value}. Available 24/7 for breakdowns, accidents, and vehicle transport.`
                            })}
                            placeholder="Enter area name..."
                            required
                        />
                        <div className="cms-permalink">
                            <span className="cms-permalink-label">Permalink:</span>
                            <span className="cms-permalink-base">/area/</span>
                            <input
                                type="text"
                                className="cms-permalink-slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="slug"
                                required
                            />
                        </div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="cms-editor-layout">
                        {/* Main Content */}
                        <div className="cms-main-content">
                            <div className="cms-tabs">
                                {[
                                    { key: 'content', label: 'Content' },
                                    { key: 'faqs', label: 'FAQs', count: formData.custom_faqs.length },
                                    { key: 'services', label: 'Services', count: formData.custom_services.length },
                                    { key: 'recoveries', label: 'Recoveries', count: formData.custom_recoveries.length },
                                    { key: 'seo', label: 'SEO' },
                                ].map(tab => (
                                    <button key={tab.key} type="button"
                                        className={`cms-tab ${activeTab === tab.key ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.key)}>
                                        {tab.icon && <span>{tab.icon}</span>}
                                        {tab.label}
                                        {tab.count > 0 && <span className="cms-tab-badge">{tab.count}</span>}
                                    </button>
                                ))}
                            </div>

                            <div className="cms-tab-content">
                                {activeTab === 'content' && (
                                    <>


                                        <div className="cms-panel">
                                            <div className="cms-panel-header">
                                                <div className="cms-panel-title">
                                                    <span className="cms-panel-icon">✏️</span>
                                                    <span>Additional Content</span>
                                                </div>
                                            </div>
                                            <div className="cms-panel-body">
                                                <RichTextEditor
                                                    value={formData.bottom_content}
                                                    onChange={(content) => setFormData({ ...formData, bottom_content: content })}
                                                    placeholder="Add rich text content for the bottom of the page..."
                                                />
                                                <span className="input-hint">Use {"{{location}}"} for dynamic area name. Standard HTML supported.</span>
                                            </div>
                                        </div>

                                        <div className="cms-panel">
                                            <div className="cms-panel-header">
                                                <div className="cms-panel-title">
                                                    <span>Location Details</span>
                                                </div>
                                            </div>
                                            <div className="cms-panel-body">
                                                <div className="form-group">
                                                    <label>Major Roads</label>
                                                    <input type="text" value={formData.major_roads}
                                                        onChange={(e) => setFormData({ ...formData, major_roads: e.target.value })}
                                                        placeholder="M6, M5, A38" />
                                                    <span className="input-hint">Comma-separated</span>
                                                </div>
                                                <div className="form-group">
                                                    <label>Nearby Areas</label>
                                                    <input type="text" value={formData.nearby_areas}
                                                        onChange={(e) => setFormData({ ...formData, nearby_areas: e.target.value })}
                                                        placeholder="Solihull, Sutton Coldfield" />
                                                    <span className="input-hint">Comma-separated</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'faqs' && renderFAQs()}
                                {activeTab === 'services' && renderServices()}
                                {activeTab === 'recoveries' && renderRecoveries()}

                                {activeTab === 'seo' && (
                                    <div className="cms-panel">
                                        <div className="cms-panel-header">
                                            <div className="cms-panel-title">
                                                <span>Search Engine Optimization</span>
                                            </div>
                                        </div>
                                        <div className="cms-panel-body">
                                            <div className="form-group">
                                                <label>H1 Title</label>
                                                <input type="text" value={formData.h1_title}
                                                    onChange={(e) => setFormData({ ...formData, h1_title: e.target.value })}
                                                    placeholder="Main heading on the page" />
                                            </div>
                                            <div className="form-group">
                                                <label>Meta Title</label>
                                                <input type="text" value={formData.meta_title}
                                                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                                    placeholder="Browser tab / search results title" />
                                                <span className="input-hint">{formData.meta_title.length}/60 characters</span>
                                            </div>
                                            <div className="form-group">
                                                <label>Meta Description</label>
                                                <textarea value={formData.meta_description}
                                                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                                    placeholder="Search results description" rows={3} />
                                                <span className="input-hint">{formData.meta_description.length}/160 characters</span>
                                            </div>

                                            {(formData.meta_title || formData.meta_description) && (
                                                <div className="cms-seo-preview">
                                                    <div className="cms-seo-preview-label">Search Preview</div>
                                                    <div className="cms-seo-preview-title">{formData.meta_title || 'Page Title'}</div>
                                                    <div className="cms-seo-preview-url">yoursite.com/area/{formData.slug || '...'}</div>
                                                    <div className="cms-seo-preview-desc">{formData.meta_description || 'Page description...'}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="cms-sidebar">
                            {/* Publish Box */}
                            <div className="cms-sidebar-box cms-publish-box">
                                <div className="cms-sidebar-box-header">
                                    <h3>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        </svg>
                                        Publish
                                    </h3>
                                </div>
                                <div className="cms-sidebar-box-body">
                                    <div className="cms-publish-info">
                                        <div className="cms-publish-row">
                                            <span className="cms-publish-label">Status:</span>
                                            <span className="cms-status-badge cms-status-draft">Draft</span>
                                        </div>
                                        <div className="cms-publish-row">
                                            <span className="cms-publish-label">URL:</span>
                                            <span className="cms-publish-value cms-publish-url">/area/{formData.slug || '...'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="cms-sidebar-box-footer">
                                    <button type="submit" className="btn btn-primary cms-publish-btn" disabled={loading}>
                                        {loading ? (
                                            <><div className="btn-spinner"></div>Creating...</>
                                        ) : 'Publish Area'}
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic Variables */}
                            <div className="cms-sidebar-box">
                                <div className="cms-sidebar-box-header">
                                    <h3>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="16 18 22 12 16 6"></polyline>
                                            <polyline points="8 6 2 12 8 18"></polyline>
                                        </svg>
                                        Variables
                                    </h3>
                                </div>
                                <div className="cms-sidebar-box-body">
                                    <div className="cms-var-list">
                                        <div className="cms-var-item">
                                            <code>{"{{location}}"}</code>
                                            <span>{formData.name || '...'}</span>
                                        </div>
                                        <div className="cms-var-item">
                                            <code>{"{{majorRoads}}"}</code>
                                            <span>{formData.major_roads || '...'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
