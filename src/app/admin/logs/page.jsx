"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '../../../styles/admin.css';

export default function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

    useEffect(() => {
        fetchLogs(pagination.page);
    }, [pagination.page]);

    const fetchLogs = async (page) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/logs?page=${page}&limit=50`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data);
                setPagination({
                    page: data.pagination.page,
                    totalPages: data.pagination.totalPages
                });
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
        setLoading(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatAction = (action) => {
        return action.replace(/_/g, ' ').toUpperCase();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'success':
                return <span className="status-badge status-active">Success</span>;
            case 'error':
                return <span className="status-badge status-inactive">Error</span>;
            case 'warning':
                return <span className="status-badge status-warning" style={{ backgroundColor: '#fff3cd', color: '#856404' }}>Warning</span>;
            default:
                return <span className="status-badge status-draft" style={{ backgroundColor: '#e2e3e5', color: '#383d41' }}>Info</span>;
        }
    };

    const renderDetails = (details) => {
        if (!details || Object.keys(details).length === 0) return '-';
        
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {details.name && <div style={{ fontSize: '0.85rem' }}><strong>Area:</strong> {details.name}</div>}
                {details.slug && !details.name && <div style={{ fontSize: '0.85rem' }}><strong>Slug:</strong> {details.slug}</div>}
                {details.url && (
                    <div style={{ fontSize: '0.8rem', color: '#4f46e5', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px', whiteSpace: 'nowrap' }} title={details.url}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px', verticalAlign: '-1px' }}>
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        {details.url}
                    </div>
                )}
                {details.type && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📝 Type: {details.type}</div>}
                {details.error && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>{details.error}</div>}
            </div>
        );
    };

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1>📋 Activity & Audit Log</h1>
                        <p>Track changes and SEO indexing events across the platform</p>
                    </div>
                    <div className="admin-header-actions">
                        <Link href="/admin/settings" className="btn btn-secondary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                            Back to Settings
                        </Link>
                    </div>
                </header>

                {loading && logs.length === 0 ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading activity logs...</p>
                    </div>
                ) : (
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                        <table className="areas-table" style={{ border: 'none', boxShadow: 'none' }}>
                            <thead>
                                <tr>
                                    <th>Date & Time</th>
                                    <th>Action</th>
                                    <th>Context / Details</th>
                                    <th style={{ textAlign: 'right' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? (
                                    logs.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ whiteSpace: 'nowrap', color: '#475569', fontSize: '0.8rem', verticalAlign: 'top', paddingTop: '16px' }}>
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td style={{ verticalAlign: 'top', paddingTop: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ padding: '6px', background: log.action.includes('GOOGLE') ? '#e0e7ff' : '#f1f5f9', borderRadius: '6px', color: log.action.includes('GOOGLE') ? '#4f46e5' : '#475569' }}>
                                                        {log.action.includes('GOOGLE') ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
                                                        ) : log.action.includes('DELETE') ? (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                        ) : (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                        )}
                                                    </div>
                                                    <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>{formatAction(log.action)}</strong>
                                                </div>
                                            </td>
                                            <td style={{ verticalAlign: 'top', paddingTop: '14px', paddingBottom: '14px' }}>
                                                {renderDetails(log.details)}
                                            </td>
                                            <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '16px' }}>
                                                {getStatusBadge(log.status)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="empty-state" style={{ border: 'none' }}>
                                            <div className="empty-state-icon" style={{ fontSize: '2rem', opacity: 0.3 }}>📭</div>
                                            <h3>No Activity Recorded</h3>
                                            <p style={{ margin: 0 }}>System events and Google Index submissions will appear here.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {pagination.totalPages > 1 && (
                            <div className="pagination" style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                <button className="pagination-btn" disabled={pagination.page <= 1} onClick={() => fetchLogs(pagination.page - 1)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg> Previous
                                </button>
                                <span className="pagination-info">Page {pagination.page} of {pagination.totalPages}</span>
                                <button className="pagination-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchLogs(pagination.page + 1)}>
                                    Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
