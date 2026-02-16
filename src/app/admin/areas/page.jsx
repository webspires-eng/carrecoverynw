"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '../../../styles/admin.css';

const AUTOSAVE_KEY = 'area_form_autosave';

export default function AdminDashboard() {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [hasDraft, setHasDraft] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

    // Check for saved draft
    useEffect(() => {
        const savedData = localStorage.getItem(AUTOSAVE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.name || parsed.slug) {
                    setHasDraft(true);
                    setDraftName(parsed.name || 'Untitled');
                }
            } catch (e) {
                console.error('Failed to parse draft');
            }
        }
    }, []);

    const clearDraft = () => {
        if (confirm('Are you sure you want to discard this draft?')) {
            localStorage.removeItem(AUTOSAVE_KEY);
            setHasDraft(false);
            setDraftName('');
        }
    };

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/areas?page=${page}&limit=25&search=${search}`);
            const data = await res.json();
            if (data.success) {
                setAreas(data.data);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching areas:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAreas();
    }, [page, search]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this area?')) return;
        try {
            const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchAreas();
            }
        } catch (error) {
            alert('Error deleting area');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/signin';
    };

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1>Dashboard</h1>
                        <p>Manage your location pages for better local SEO</p>
                    </div>
                    <div className="admin-header-actions">
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

                {/* Draft Banner */}
                {hasDraft && (
                    <div className="draft-banner">
                        <div className="draft-info">
                            <span className="draft-icon">📝</span>
                            <div>
                                <strong>You have an unsaved draft</strong>
                                <span className="draft-name">"{draftName}"</span>
                            </div>
                        </div>
                        <div className="draft-actions">
                            <Link href="/admin/areas/add" className="btn-continue-draft">
                                Continue Editing
                            </Link>
                            <button onClick={clearDraft} className="btn-discard-draft">
                                Discard
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="stats-row">
                    <div className="stat-card">
                        <h3>{pagination.total}</h3>
                        <p>Total Areas</p>
                    </div>
                    <div className="stat-card">
                        <h3>{areas.filter(a => a.is_active !== false).length}</h3>
                        <p>Active on this page</p>
                    </div>
                    <div className="stat-card">
                        <h3>{pagination.totalPages}</h3>
                        <p>Total Pages</p>
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
                            placeholder="Search areas by name, county, or postcode..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="search-input"
                        />
                    </div>
                    <div className="view-toggle">
                        <button
                            className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                            onClick={() => setViewMode('cards')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Cards
                        </button>
                        <button
                            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                            Table
                        </button>
                    </div>
                    <Link href="/admin/areas/add" className="btn btn-accent">
                        Add New Area
                    </Link>
                </div>

                {/* Stats Bar */}
                <div className="stats-bar">
                    <span>Showing <strong>{areas.length}</strong> of <strong>{pagination.total}</strong> areas</span>
                    <span>Page <strong>{page}</strong> of <strong>{pagination.totalPages}</strong></span>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading areas...</p>
                    </div>
                ) : areas.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🗺️</div>
                        <h3>No areas found</h3>
                        <p>{search ? 'Try a different search term' : 'Get started by adding your first area'}</p>
                        {!search && (
                            <Link href="/admin/areas/add" className="btn btn-primary">
                                Add Your First Area
                            </Link>
                        )}
                    </div>
                ) : viewMode === 'cards' ? (
                    <div className="areas-grid">
                        {areas.map((area) => (
                            <div key={area.id} className="area-card">
                                <div className="area-card-header">
                                    <div>
                                        <h3 className="area-card-title">{area.name}</h3>
                                    </div>
                                    <span className={`area-card-status ${area.is_active !== false ? 'active' : 'inactive'}`}>
                                        {area.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="area-card-meta">


                                </div>
                                <div className="area-card-actions">
                                    <a
                                        href={`/area/${area.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-view"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                            <polyline points="15 3 21 3 21 9"></polyline>
                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                        </svg>
                                        View
                                    </a>
                                    <Link href={`/admin/areas/${area.id}/edit`} className="btn-edit">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                        </svg>
                                        Edit
                                    </Link>
                                    <button onClick={() => handleDelete(area.id)} className="btn-delete">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <table className="areas-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Slug</th>

                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {areas.map((area) => (
                                <tr key={area.id}>
                                    <td className="table-area-name">{area.name}</td>
                                    <td>
                                        <a href={`/area/${area.slug}`} target="_blank" rel="noopener noreferrer">
                                            /area/{area.slug}
                                        </a>
                                    </td>

                                    <td>
                                        <span className={`area-card-status ${area.is_active !== false ? 'active' : 'inactive'}`}>
                                            {area.is_active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <Link href={`/admin/areas/${area.id}/edit`} className="btn-edit">
                                                Edit
                                            </Link>
                                            <button onClick={() => handleDelete(area.id)} className="btn-delete">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {areas.length > 0 && (
                    <div className="pagination">
                        <button
                            className="pagination-btn"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            Previous
                        </button>
                        <span className="pagination-info">
                            Page {page} of {pagination.totalPages}
                        </span>
                        <button
                            className="pagination-btn"
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Next
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
