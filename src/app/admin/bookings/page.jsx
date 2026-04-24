"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    MapPin, Wrench, MessageSquare, Trash2, Phone, Mail,
    Search, LogOut, Settings, Globe, ClipboardList,
    Sparkles, CheckCheck, Truck, CheckCircle2, XCircle,
    ChevronDown, ChevronUp
} from 'lucide-react';
import '../../../styles/admin.css';

const STATUS_META = {
    new:        { label: 'New',        color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', Icon: Sparkles },
    confirmed:  { label: 'Confirmed',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', Icon: CheckCheck },
    dispatched: { label: 'Dispatched', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', Icon: Truck },
    completed:  { label: 'Completed',  color: '#0891b2', bg: '#f0f9ff', border: '#a5f3fc', Icon: CheckCircle2 },
    cancelled:  { label: 'Cancelled',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca', Icon: XCircle },
};

const STATUS_KEYS = ['new', 'confirmed', 'dispatched', 'completed', 'cancelled'];

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
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [expandedId, setExpandedId] = useState(null);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings?page=${page}&limit=25&search=${search}&status=${statusFilter}`);
            const data = await res.json();
            if (data.success) {
                setBookings(data.data);
                setPagination(data.pagination);
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

    const newCount = bookings.filter(b => b.status === 'new').length;
    const completedCount = bookings.filter(b => b.status === 'completed').length;

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1>
                            <ClipboardList size={26} strokeWidth={2.2} />
                            Bookings
                        </h1>
                        <p>Manage all car recovery booking requests</p>
                    </div>
                    <div className="admin-header-actions">
                        <Link href="/admin/areas" className="btn btn-secondary">
                            <MapPin size={16} />
                            Areas
                        </Link>
                        <Link href="/admin/seo" className="btn btn-secondary">
                            <Globe size={16} />
                            SEO
                        </Link>
                        <Link href="/admin/settings" className="btn btn-secondary">
                            <Settings size={16} />
                            Settings
                        </Link>
                        <button onClick={handleLogout} className="btn-logout">
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="stats-row bk-stats">
                    <div className="stat-card bk-stat">
                        <div className="bk-stat-label">Total Bookings</div>
                        <div className="bk-stat-value">{pagination.total}</div>
                    </div>
                    <div className="stat-card bk-stat bk-stat--accent">
                        <div className="bk-stat-label">New Requests</div>
                        <div className="bk-stat-value">{newCount}</div>
                    </div>
                    <div className="stat-card bk-stat">
                        <div className="bk-stat-label">Completed (page)</div>
                        <div className="bk-stat-value">{completedCount}</div>
                    </div>
                </div>

                {/* Controls */}
                <div className="admin-controls bk-controls">
                    <div className="search-container bk-search">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, email or location…"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="search-input"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="bk-filter-select"
                    >
                        <option value="all">All statuses</option>
                        {STATUS_KEYS.map(k => (
                            <option key={k} value={k}>{STATUS_META[k].label}</option>
                        ))}
                    </select>
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
                            const isNew = booking.status === 'new';

                            return (
                                <article
                                    key={booking.id}
                                    className={`bk-card ${isNew ? 'bk-card--new' : ''} ${isExpanded ? 'bk-card--open' : ''}`}
                                >
                                    <button
                                        type="button"
                                        className="bk-card-row"
                                        onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                                        aria-expanded={isExpanded}
                                    >
                                        <div className="bk-cell bk-cell--customer">
                                            <div className="bk-customer-name">{booking.name}</div>
                                            <a
                                                href={`tel:${booking.phone}`}
                                                className="bk-customer-phone"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <Phone size={12} />
                                                {booking.phone}
                                            </a>
                                        </div>

                                        <div className="bk-cell bk-cell--route">
                                            <div className="bk-route-from">
                                                <MapPin size={13} />
                                                <span>{booking.pickupLocation}</span>
                                            </div>
                                            {booking.dropoffLocation && (
                                                <div className="bk-route-to">→ {booking.dropoffLocation}</div>
                                            )}
                                        </div>

                                        <div className="bk-cell bk-cell--service">
                                            <Wrench size={13} />
                                            <span>{booking.serviceType}</span>
                                        </div>

                                        <div className="bk-cell bk-cell--status">
                                            <StatusBadge status={booking.status} />
                                        </div>

                                        <div className="bk-cell bk-cell--date">
                                            <span>{formatDate(booking.created_at)}</span>
                                            {isExpanded
                                                ? <ChevronUp size={16} className="bk-chev" />
                                                : <ChevronDown size={16} className="bk-chev" />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="bk-details">
                                            <div className="bk-details-grid">
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
                                                            const m = STATUS_META[s];
                                                            const active = booking.status === s;
                                                            return (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => handleStatusChange(booking.id, s)}
                                                                    disabled={active}
                                                                    className={`bk-status-pill ${active ? 'bk-status-pill--active' : ''}`}
                                                                    style={active ? { background: m.bg, color: m.color, borderColor: m.border } : undefined}
                                                                >
                                                                    {m.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDelete(booking.id)}
                                                    className="bk-btn-delete"
                                                >
                                                    <Trash2 size={14} />
                                                    Delete
                                                </button>
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
        </div>
    );
}
