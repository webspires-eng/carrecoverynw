"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '../../../styles/admin.css';

const STATUS_COLORS = {
    new: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', label: '🆕 New' },
    confirmed: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: '✅ Confirmed' },
    dispatched: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: '🚛 Dispatched' },
    completed: { bg: '#f0f9ff', color: '#0891b2', border: '#a5f3fc', label: '✔️ Completed' },
    cancelled: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: '❌ Cancelled' },
};

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
        if (!confirm('Are you sure you want to delete this booking?')) return;
        try {
            const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchBookings();
            }
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
            ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const newCount = bookings.filter(b => b.status === 'new').length;

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1>📋 Bookings</h1>
                        <p>Manage all car recovery booking requests</p>
                    </div>
                    <div className="admin-header-actions">
                        <Link href="/admin/areas" className="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            Areas
                        </Link>
                        <Link href="/admin/seo" className="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            SEO
                        </Link>
                        <Link href="/admin/settings" className="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            Settings
                        </Link>
                        <button onClick={handleLogout} className="btn-logout">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card">
                        <h3>{pagination.total}</h3>
                        <p>Total Bookings</p>
                    </div>
                    <div className="stat-card" style={{ borderLeft: '4px solid #ea580c' }}>
                        <h3>{newCount}</h3>
                        <p>New Requests</p>
                    </div>
                    <div className="stat-card">
                        <h3>{bookings.filter(b => b.status === 'completed').length}</h3>
                        <p>Completed</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="admin-controls">
                    <div className="search-container">
                        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name, phone, email, or location..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="search-input"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: 'white',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="new">🆕 New</option>
                            <option value="confirmed">✅ Confirmed</option>
                            <option value="dispatched">🚛 Dispatched</option>
                            <option value="completed">✔️ Completed</option>
                            <option value="cancelled">❌ Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Bookings List */}
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading bookings...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>No bookings found</h3>
                        <p>{search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Bookings will appear here when customers submit the form'}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                        {bookings.map((booking) => {
                            const sc = STATUS_COLORS[booking.status] || STATUS_COLORS.new;
                            const isExpanded = expandedId === booking.id;

                            return (
                                <div
                                    key={booking.id}
                                    style={{
                                        background: '#fff',
                                        borderRadius: '12px',
                                        border: `1px solid ${booking.status === 'new' ? '#fed7aa' : '#e2e8f0'}`,
                                        boxShadow: booking.status === 'new' ? '0 0 0 2px rgba(234,88,12,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {/* Main Row */}
                                    <div
                                        onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1.2fr 1fr 140px 100px',
                                            gap: '16px',
                                            padding: '18px 20px',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {/* Customer */}
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{booking.name}</div>
                                            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>
                                                <a href={`tel:${booking.phone}`} style={{ color: '#2563eb', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                                                    {booking.phone}
                                                </a>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                                                📍 {booking.pickupLocation}
                                            </div>
                                            {booking.dropoffLocation && (
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                                                    → {booking.dropoffLocation}
                                                </div>
                                            )}
                                        </div>

                                        {/* Service */}
                                        <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                                            🔧 {booking.serviceType}
                                        </div>

                                        {/* Status Badge */}
                                        <div>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '5px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.78rem',
                                                fontWeight: 600,
                                                background: sc.bg,
                                                color: sc.color,
                                                border: `1px solid ${sc.border}`,
                                            }}>
                                                {sc.label}
                                            </span>
                                        </div>

                                        {/* Date */}
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>
                                            {formatDate(booking.created_at)}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div style={{
                                            padding: '0 20px 20px',
                                            borderTop: '1px solid #f1f5f9',
                                            animation: 'slideIn 0.2s ease',
                                        }}>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                gap: '16px',
                                                padding: '16px 0',
                                            }}>
                                                {booking.email && (
                                                    <div>
                                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>Email</div>
                                                        <div style={{ fontSize: '0.9rem', color: '#334155' }}>{booking.email}</div>
                                                    </div>
                                                )}
                                                {booking.registrationNumber && (
                                                    <div>
                                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>Reg Number</div>
                                                        <div style={{ fontSize: '0.9rem', color: '#334155', textTransform: 'uppercase' }}>{booking.registrationNumber}</div>
                                                    </div>
                                                )}
                                                {(booking.vehicleMake || booking.vehicleModel) && (
                                                    <div>
                                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>Vehicle</div>
                                                        <div style={{ fontSize: '0.9rem', color: '#334155' }}>{[booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(' ')}</div>
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>Pickup</div>
                                                    <div style={{ fontSize: '0.9rem', color: '#334155' }}>{booking.pickupLocation}</div>
                                                </div>
                                                {booking.dropoffLocation && (
                                                    <div>
                                                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>Drop-off</div>
                                                        <div style={{ fontSize: '0.9rem', color: '#334155' }}>{booking.dropoffLocation}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {booking.message && (
                                                <div style={{
                                                    background: '#f8fafc',
                                                    borderRadius: '8px',
                                                    padding: '12px 16px',
                                                    marginBottom: '16px',
                                                    fontSize: '0.9rem',
                                                    color: '#475569',
                                                    lineHeight: 1.6,
                                                }}>
                                                    💬 {booking.message}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginRight: '8px' }}>Update Status:</span>
                                                {['new', 'confirmed', 'dispatched', 'completed', 'cancelled'].map(s => {
                                                    const c = STATUS_COLORS[s];
                                                    return (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleStatusChange(booking.id, s)}
                                                            disabled={booking.status === s}
                                                            style={{
                                                                padding: '6px 14px',
                                                                borderRadius: '8px',
                                                                border: `1px solid ${c.border}`,
                                                                background: booking.status === s ? c.bg : '#fff',
                                                                color: c.color,
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                                cursor: booking.status === s ? 'default' : 'pointer',
                                                                opacity: booking.status === s ? 0.6 : 1,
                                                                transition: 'all 0.2s',
                                                            }}
                                                        >
                                                            {c.label}
                                                        </button>
                                                    );
                                                })}

                                                <div style={{ marginLeft: 'auto' }}>
                                                    <button
                                                        onClick={() => handleDelete(booking.id)}
                                                        className="btn-delete"
                                                        style={{ fontSize: '0.8rem' }}
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {bookings.length > 0 && (
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            ← Previous
                        </button>
                        <span className="pagination-info">
                            Page {page} of {pagination.totalPages} ({pagination.total} total)
                        </span>
                        <button
                            className="pagination-btn"
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
