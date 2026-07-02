"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    MapPin, Wrench, MessageSquare, Trash2,
    Search, LogOut, Settings, Globe, ClipboardList,
    Sparkles, CheckCheck, Truck, CheckCircle2, XCircle,
    ChevronDown, ChevronUp, Plus, X, AlertCircle,
    Ban, Pencil, PoundSterling, Car, User, StickyNote
} from 'lucide-react';
import '../../../styles/admin.css';

const STATUS_META = {
    new:        { label: 'New',        color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', Icon: Sparkles },
    confirmed:  { label: 'Confirmed',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', Icon: CheckCheck },
    dispatched: { label: 'Dispatched', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', Icon: Truck },
    completed:  { label: 'Completed',  color: '#0891b2', bg: '#f0f9ff', border: '#a5f3fc', Icon: CheckCircle2 },
    cancelled:  { label: 'Cancelled',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', Icon: XCircle },
    lost:       { label: 'Job Lost',   color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', Icon: Ban },
};

const STATUS_KEYS = ['new', 'confirmed', 'dispatched', 'completed', 'cancelled', 'lost'];

const SERVICE_TYPES = [
    "Car Recovery",
    "Breakdown Assistance",
    "Accident Recovery",
    "Flat Tyre Change",
    "Jump Start / Battery",
    "Vehicle Transport",
    "Long Distance Towing",
    "Motorcycle Recovery",
    "Other",
];

const EMPTY_BOOKING = {
    name: '',
    phone: '',
    email: '',
    pickupLocation: '',
    dropoffLocation: '',
    serviceType: '',
    registrationNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    message: '',
    status: 'new',
    price: '',
    bookingDate: '',
};

// Date → value usable in <input type="date">
function toDateInput(d) {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatMoney(n) {
    if (n === null || n === undefined || n === '') return null;
    const num = Number(n);
    if (Number.isNaN(num)) return null;
    return '£' + num.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function initialsOf(name) {
    return (name || '?')
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function StatusBadge({ status }) {
    const m = STATUS_META[status] || STATUS_META.new;
    const Icon = m.Icon;
    return (
        <span
            className="bk-status-badge"
            style={{ background: m.bg, color: m.color, borderColor: m.border }}
        >
            <Icon size={12} strokeWidth={2.5} />
            {m.label}
        </span>
    );
}

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [counts, setCounts] = useState({ total: 0, revenue: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [expandedId, setExpandedId] = useState(null);
    const [priceDraft, setPriceDraft] = useState('');
    const [priceSaving, setPriceSaving] = useState(false);

    // Booking modal (create + edit)
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_BOOKING);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [dvlaStatus, setDvlaStatus] = useState(null);
    const [dvlaInfo, setDvlaInfo] = useState(null);

    const handleDvlaLookup = async () => {
        if (!form.registrationNumber) return;
        setDvlaStatus('looking_up');
        setDvlaInfo(null);
        try {
            const res = await fetch('/api/dvla', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationNumber: form.registrationNumber }),
            });
            const data = await res.json();
            if (data.success && data.data) {
                // Overwrite make & model with the DVLA result.
                // DVLA doesn't return a model name, so compose one from year/colour/fuel.
                const v = data.data;
                setForm(prev => ({
                    ...prev,
                    vehicleMake: v.make || '',
                    vehicleModel: v.model || [v.yearOfManufacture, v.colour, v.fuelType].filter(Boolean).join(' '),
                }));
                setDvlaInfo(data.data);
                setDvlaStatus('success');
            } else {
                setDvlaStatus('error');
                setTimeout(() => setDvlaStatus(null), 4000);
            }
        } catch {
            setDvlaStatus('error');
            setTimeout(() => setDvlaStatus(null), 4000);
        }
    };

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings?page=${page}&limit=25&search=${encodeURIComponent(search)}&status=${statusFilter}`);
            const data = await res.json();
            if (data.success) {
                setBookings(data.data);
                setPagination(data.pagination);
                if (data.counts) setCounts(data.counts);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBookings();
    }, [page, search, statusFilter]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                fetchBookings();
            } else {
                alert('Failed to update status');
            }
        } catch {
            alert('Error updating booking');
        }
    };

    const handleSavePrice = async (id) => {
        setPriceSaving(true);
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: priceDraft === '' ? null : priceDraft }),
            });
            const data = await res.json();
            if (data.success) {
                fetchBookings();
            } else {
                alert(data.error || 'Failed to save job value');
            }
        } catch {
            alert('Error saving job value');
        }
        setPriceSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this booking? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) fetchBookings();
        } catch {
            alert('Error deleting booking');
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_BOOKING);
        setFormError('');
        setDvlaStatus(null);
        setDvlaInfo(null);
        setShowModal(true);
    };

    const openEdit = (booking) => {
        setEditingId(booking.id);
        setForm({
            name: booking.name || '',
            phone: booking.phone || '',
            email: booking.email || '',
            pickupLocation: booking.pickupLocation || '',
            dropoffLocation: booking.dropoffLocation || '',
            serviceType: booking.serviceType || '',
            registrationNumber: booking.registrationNumber || '',
            vehicleMake: booking.vehicleMake || '',
            vehicleModel: booking.vehicleModel || '',
            message: booking.message || '',
            status: booking.status || 'new',
            price: booking.price ?? '',
            bookingDate: toDateInput(booking.created_at),
        });
        setFormError('');
        setDvlaStatus(null);
        setDvlaInfo(null);
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
    };

    const handleFormChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (formError) setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim() || !form.pickupLocation.trim() || !form.serviceType) {
            setFormError('Name, phone, pickup location and service type are required.');
            return;
        }
        setSaving(true);
        try {
            const url = editingId ? `/api/bookings/${editingId}` : '/api/bookings';
            const method = editingId ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingId ? form : { ...form, manual: true }),
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                if (!editingId) {
                    setStatusFilter('all');
                    setSearch('');
                    setPage(1);
                }
                fetchBookings();
            } else {
                setFormError(data.error || 'Failed to save booking.');
            }
        } catch {
            setFormError('Something went wrong. Please try again.');
        }
        setSaving(false);
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/signin';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
            ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateShort = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
            ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const toggleExpand = (booking) => {
        const opening = expandedId !== booking.id;
        setExpandedId(opening ? booking.id : null);
        if (opening) setPriceDraft(booking.price ?? '');
    };

    const STAT_CARDS = [
        { key: 'all', label: 'Total Bookings', value: counts.total || 0, Icon: ClipboardList, tone: 'indigo' },
        { key: 'new', label: 'New Requests', value: counts.new || 0, Icon: Sparkles, tone: 'orange' },
        { key: 'completed', label: 'Completed', value: counts.completed || 0, Icon: CheckCircle2, tone: 'cyan' },
        { key: 'revenue', label: 'Revenue (completed)', value: formatMoney(counts.revenue) || '£0', Icon: PoundSterling, tone: 'green', isMoney: true },
    ];

    const TABS = [
        { key: 'all', label: 'All', count: counts.total || 0 },
        ...STATUS_KEYS.map(k => ({ key: k, label: STATUS_META[k].label, count: counts[k] || 0 })),
    ];

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                {/* Hero header */}
                <header className="bk-hero">
                    <div className="bk-hero-left">
                        <div className="bk-hero-icon">
                            <Truck size={22} strokeWidth={2.2} />
                        </div>
                        <div>
                            <h1>Bookings</h1>
                            <p>Manage all car recovery booking requests</p>
                        </div>
                    </div>
                    <div className="bk-hero-actions">
                        <Link href="/admin/areas" className="bk-nav-btn">
                            <MapPin size={15} />
                            Areas
                        </Link>
                        <Link href="/admin/seo" className="bk-nav-btn">
                            <Globe size={15} />
                            SEO
                        </Link>
                        <Link href="/admin/settings" className="bk-nav-btn">
                            <Settings size={15} />
                            Settings
                        </Link>
                        <button onClick={handleLogout} className="bk-nav-btn bk-nav-btn--danger">
                            <LogOut size={15} />
                            Logout
                        </button>
                        <button onClick={openCreate} className="bk-btn-new">
                            <Plus size={17} strokeWidth={2.5} />
                            New Booking
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="bk-stats">
                    {STAT_CARDS.map(card => {
                        const Icon = card.Icon;
                        const filterKey = card.key === 'revenue' ? 'completed' : card.key;
                        const active = statusFilter === filterKey && card.key !== 'revenue';
                        return (
                            <button
                                key={card.key}
                                type="button"
                                className={`bk-stat bk-stat--${card.tone} ${active ? 'bk-stat--active' : ''}`}
                                onClick={() => { setStatusFilter(filterKey); setPage(1); }}
                            >
                                <div className="bk-stat-icon">
                                    <Icon size={19} strokeWidth={2.2} />
                                </div>
                                <div className="bk-stat-body">
                                    <div className="bk-stat-label">{card.label}</div>
                                    <div className="bk-stat-value">{card.value}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Toolbar: tabs + search */}
                <div className="bk-toolbar">
                    <div className="bk-tabs" role="tablist">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={statusFilter === tab.key}
                                className={`bk-tab ${statusFilter === tab.key ? 'bk-tab--active' : ''}`}
                                onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                            >
                                {tab.label}
                                <span className="bk-tab-count">{tab.count}</span>
                            </button>
                        ))}
                    </div>
                    <div className="bk-search">
                        <Search size={17} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search name, phone, email, location…"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="search-input"
                        />
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading bookings…</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <ClipboardList size={48} strokeWidth={1.5} />
                        </div>
                        <h3>No bookings found</h3>
                        <p>{search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Bookings will appear here when customers submit the form.'}</p>
                    </div>
                ) : (
                    <div className="bk-list">
                        {bookings.map((booking) => {
                            const isExpanded = expandedId === booking.id;
                            const m = STATUS_META[booking.status] || STATUS_META.new;
                            const priceLabel = formatMoney(booking.price);

                            return (
                                <article
                                    key={booking.id}
                                    className={`bk-card ${isExpanded ? 'bk-card--open' : ''}`}
                                    style={{ '--bk-accent': m.color }}
                                >
                                    <button
                                        type="button"
                                        className="bk-card-row"
                                        onClick={() => toggleExpand(booking)}
                                        aria-expanded={isExpanded}
                                    >
                                        <div className="bk-cell bk-cell--customer">
                                            <div
                                                className="bk-avatar"
                                                style={{ background: m.bg, color: m.color, borderColor: m.border }}
                                            >
                                                {initialsOf(booking.name)}
                                            </div>
                                            <div className="bk-customer-name">
                                                {booking.name}
                                                {booking.source === 'manual' && (
                                                    <span className="bk-source-tag">M</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bk-cell bk-cell--route">
                                            <div className="bk-route-from">
                                                <MapPin size={13} />
                                                <span>{booking.pickupLocation}</span>
                                            </div>
                                        </div>

                                        <div className="bk-cell bk-cell--service">
                                            <div className="bk-service-name">
                                                <Wrench size={13} />
                                                <span>{booking.serviceType}</span>
                                                {priceLabel && (
                                                    <span className="bk-price-chip">{priceLabel}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bk-cell bk-cell--status">
                                            <StatusBadge status={booking.status} />
                                        </div>

                                        <div className="bk-cell bk-cell--date">
                                            <span>{formatDateShort(booking.created_at)}</span>
                                            {isExpanded
                                                ? <ChevronUp size={16} className="bk-chev" />
                                                : <ChevronDown size={16} className="bk-chev" />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="bk-details">
                                            <div className="bk-details-grid">
                                                <div className="bk-detail">
                                                    <div className="bk-detail-label">Phone</div>
                                                    <a className="bk-detail-value bk-link" href={`tel:${booking.phone}`}>
                                                        {booking.phone}
                                                    </a>
                                                </div>
                                                <div className="bk-detail">
                                                    <div className="bk-detail-label">Booked</div>
                                                    <div className="bk-detail-value">{formatDate(booking.created_at)}</div>
                                                </div>
                                                {booking.email && (
                                                    <div className="bk-detail">
                                                        <div className="bk-detail-label">Email</div>
                                                        <a className="bk-detail-value bk-link" href={`mailto:${booking.email}`}>
                                                            {booking.email}
                                                        </a>
                                                    </div>
                                                )}
                                                {booking.registrationNumber && (
                                                    <div className="bk-detail">
                                                        <div className="bk-detail-label">Reg Number</div>
                                                        <div className="bk-detail-value bk-detail-value--mono">
                                                            {booking.registrationNumber}
                                                        </div>
                                                    </div>
                                                )}
                                                {(booking.vehicleMake || booking.vehicleModel) && (
                                                    <div className="bk-detail">
                                                        <div className="bk-detail-label">Vehicle</div>
                                                        <div className="bk-detail-value">
                                                            {[booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(' ')}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="bk-detail">
                                                    <div className="bk-detail-label">Pickup</div>
                                                    <div className="bk-detail-value">{booking.pickupLocation}</div>
                                                </div>
                                                {booking.dropoffLocation && (
                                                    <div className="bk-detail">
                                                        <div className="bk-detail-label">Drop-off</div>
                                                        <div className="bk-detail-value">{booking.dropoffLocation}</div>
                                                    </div>
                                                )}
                                                <div className="bk-detail">
                                                    <div className="bk-detail-label">Job Value</div>
                                                    <div className="bk-detail-value">{priceLabel || '—'}</div>
                                                </div>
                                            </div>

                                            {booking.message && (
                                                <div className="bk-message">
                                                    <MessageSquare size={14} />
                                                    <p>{booking.message}</p>
                                                </div>
                                            )}

                                            <div className="bk-actions-bar">
                                                <div className="bk-status-toggle">
                                                    <span className="bk-status-toggle-label">Set status</span>
                                                    <div className="bk-status-toggle-group">
                                                        {STATUS_KEYS.map(s => {
                                                            const sm = STATUS_META[s];
                                                            const active = booking.status === s;
                                                            return (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => handleStatusChange(booking.id, s)}
                                                                    disabled={active}
                                                                    className={`bk-status-pill ${active ? 'bk-status-pill--active' : ''}`}
                                                                    style={active ? { background: sm.bg, color: sm.color, borderColor: sm.border } : undefined}
                                                                >
                                                                    {sm.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="bk-row-actions">
                                                    <div className="bk-price-edit">
                                                        <span className="bk-price-edit-symbol">£</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="0"
                                                            value={priceDraft}
                                                            onChange={e => setPriceDraft(e.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSavePrice(booking.id)}
                                                            disabled={priceSaving}
                                                        >
                                                            {priceSaving ? 'Saving…' : 'Save'}
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => openEdit(booking)}
                                                        className="bk-btn-edit"
                                                    >
                                                        <Pencil size={14} />
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(booking.id)}
                                                        className="bk-btn-delete"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}

                {bookings.length > 0 && (
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page {page} of {pagination.totalPages} · {pagination.total} total
                        </span>
                        <button
                            className="pagination-btn"
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Create / Edit booking modal */}
            {showModal && (
                <div className="bk-modal-overlay" onClick={closeModal}>
                    <div className="bk-modal" onClick={e => e.stopPropagation()}>
                        <div className="bk-modal-head">
                            <div className="bk-modal-head-icon">
                                {editingId ? <Pencil size={17} /> : <Plus size={18} strokeWidth={2.5} />}
                            </div>
                            <div className="bk-modal-head-text">
                                <h2>{editingId ? 'Edit Booking' : 'New Booking'}</h2>
                                <p>{editingId ? 'Update the booking details below' : 'Log a phone or WhatsApp booking'}</p>
                            </div>
                            <button type="button" className="bk-modal-close" onClick={closeModal} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="bk-modal-form">
                            <div className="bk-modal-body">
                                {formError && (
                                    <div className="bk-modal-error">
                                        <AlertCircle size={15} />
                                        {formError}
                                    </div>
                                )}

                                <div className="bk-form-section">
                                    <div className="bk-form-section-title">
                                        <User size={13} />
                                        Customer
                                    </div>
                                    <div className="bk-form-grid">
                                        <div className="bk-field">
                                            <label htmlFor="mb-name">Full Name *</label>
                                            <input id="mb-name" name="name" type="text" placeholder="John Smith"
                                                value={form.name} onChange={handleFormChange} required />
                                        </div>
                                        <div className="bk-field">
                                            <label htmlFor="mb-phone">Phone / WhatsApp *</label>
                                            <input id="mb-phone" name="phone" type="tel" placeholder="07XXX XXXXXX"
                                                value={form.phone} onChange={handleFormChange} required />
                                        </div>
                                        <div className="bk-field bk-field--full">
                                            <label htmlFor="mb-email">Email</label>
                                            <input id="mb-email" name="email" type="email" placeholder="john@example.com"
                                                value={form.email} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bk-form-section">
                                    <div className="bk-form-section-title">
                                        <MapPin size={13} />
                                        Job
                                    </div>
                                    <div className="bk-form-grid">
                                        <div className="bk-field">
                                            <label htmlFor="mb-pickup">Pickup Location *</label>
                                            <input id="mb-pickup" name="pickupLocation" type="text" placeholder="e.g. M6 Junction 7, Birmingham"
                                                value={form.pickupLocation} onChange={handleFormChange} required />
                                        </div>
                                        <div className="bk-field">
                                            <label htmlFor="mb-dropoff">Drop-off Location</label>
                                            <input id="mb-dropoff" name="dropoffLocation" type="text" placeholder="e.g. Home address or garage"
                                                value={form.dropoffLocation} onChange={handleFormChange} />
                                        </div>
                                        <div className="bk-field">
                                            <label htmlFor="mb-service">Service Type *</label>
                                            <select id="mb-service" name="serviceType" value={form.serviceType} onChange={handleFormChange} required>
                                                <option value="">Select a service…</option>
                                                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="bk-field">
                                            <label htmlFor="mb-date">Booking Date</label>
                                            <input id="mb-date" name="bookingDate" type="date"
                                                value={form.bookingDate} onChange={handleFormChange} />
                                        </div>
                                        <div className="bk-field">
                                            <label htmlFor="mb-status">Status</label>
                                            <select id="mb-status" name="status" value={form.status} onChange={handleFormChange}>
                                                {STATUS_KEYS.map(k => <option key={k} value={k}>{STATUS_META[k].label}</option>)}
                                            </select>
                                        </div>
                                        <div className="bk-field">
                                            <label htmlFor="mb-price">Job Value (£)</label>
                                            <input id="mb-price" name="price" type="number" min="0" step="0.01" placeholder="e.g. 120"
                                                value={form.price} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bk-form-section">
                                    <div className="bk-form-section-title">
                                        <Car size={13} />
                                        Vehicle
                                    </div>
                                    <div className="bk-form-grid">
                                        <div className="bk-field bk-field--full">
                                            <label htmlFor="mb-reg">Reg Number</label>
                                            <div className="bk-reg-lookup">
                                                <input id="mb-reg" name="registrationNumber" type="text" placeholder="AB12 CDE"
                                                    value={form.registrationNumber}
                                                    onChange={e => {
                                                        setForm(prev => ({ ...prev, registrationNumber: e.target.value.toUpperCase() }));
                                                        setDvlaInfo(null);
                                                        if (dvlaStatus === 'error') setDvlaStatus(null);
                                                    }}
                                                    style={{ textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }} />
                                                <button
                                                    type="button"
                                                    className="bk-btn-lookup"
                                                    onClick={handleDvlaLookup}
                                                    disabled={dvlaStatus === 'looking_up' || !form.registrationNumber}
                                                >
                                                    <Search size={15} />
                                                    {dvlaStatus === 'looking_up' ? 'Searching…' : 'Find vehicle'}
                                                </button>
                                            </div>
                                            {dvlaStatus === 'error' && (
                                                <small className="bk-field-error">
                                                    <AlertCircle size={13} />
                                                    Vehicle not found — enter make &amp; model manually.
                                                </small>
                                            )}
                                            {dvlaInfo && (
                                                <small className="bk-field-hint bk-field-hint--success">
                                                    <CheckCircle2 size={13} />
                                                    {[dvlaInfo.make, dvlaInfo.yearOfManufacture, dvlaInfo.colour, dvlaInfo.fuelType,
                                                      dvlaInfo.engineCapacity ? `${dvlaInfo.engineCapacity}cc` : null,
                                                      dvlaInfo.taxStatus ? `Tax: ${dvlaInfo.taxStatus}` : null,
                                                      dvlaInfo.motStatus ? `MOT: ${dvlaInfo.motStatus}` : null]
                                                        .filter(Boolean).join(' · ')}
                                                </small>
                                            )}
                                        </div>
                                        <div className="bk-field">
                                            <label htmlFor="mb-make">Make</label>
                                            <input id="mb-make" name="vehicleMake" type="text" placeholder="BMW, Ford"
                                                value={form.vehicleMake} onChange={handleFormChange} />
                                        </div>
                                        <div className="bk-field">
                                            <label htmlFor="mb-model">Model</label>
                                            <input id="mb-model" name="vehicleModel" type="text" placeholder="3 Series, Focus"
                                                value={form.vehicleModel} onChange={handleFormChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bk-form-section">
                                    <div className="bk-form-section-title">
                                        <StickyNote size={13} />
                                        Notes
                                    </div>
                                    <div className="bk-field">
                                        <textarea name="message" placeholder="Any extra details…" rows={3}
                                            value={form.message} onChange={handleFormChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="bk-modal-foot">
                                <button type="button" className="bk-btn-ghost" onClick={closeModal} disabled={saving}>
                                    Cancel
                                </button>
                                <button type="submit" className="bk-btn-save" disabled={saving}>
                                    {saving
                                        ? 'Saving…'
                                        : editingId
                                            ? <><CheckCheck size={16} /> Save Changes</>
                                            : <><Plus size={16} strokeWidth={2.5} /> Create Booking</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
