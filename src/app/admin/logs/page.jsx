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
        
        // Custom formatting for common fields to make it readable
        const parts = [];
        if (details.name || details.slug) parts.push(`Area: ${details.name || details.slug}`);
        if (details.url) parts.push(`URL: ${details.url}`);
        if (details.type) parts.push(`Type: ${details.type}`);
        
        // Fallback to JSON if it's a completely unfamiliar object
        if (parts.length === 0) {
            return <pre style={{ margin: 0, fontSize: '0.85em', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{JSON.stringify(details)}</pre>;
        }

        return parts.join(' | ');
    };

    return (
        <div className="admin-dashboard">
            <div className="admin-main">
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1>📋 Activity & Audit Log</h1>
                        <p>Track changes and SEO indexing events</p>
                    </div>
                    <div className="admin-header-actions">
                        <Link href="/admin/settings" className="btn btn-secondary">
                            ⚙️ Back to Settings
                        </Link>
                    </div>
                </header>

                {loading && logs.length === 0 ? (
                    <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>Loading logs...</p>
                    </div>
                ) : (
                    <>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length > 0 ? (
                                        logs.map(log => (
                                            <tr key={log.id}>
                                                <td style={{ whiteSpace: 'nowrap', color: '#666' }}>{formatDate(log.created_at)}</td>
                                                <td><strong>{formatAction(log.action)}</strong></td>
                                                <td>{renderDetails(log.details)}</td>
                                                <td>{getStatusBadge(log.status)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="empty-state">
                                                No activity logs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {pagination.totalPages > 1 && (
                            <div className="pagination">
                                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        className={`btn-page ${pagination.page === page ? 'active' : ''}`}
                                        onClick={() => fetchLogs(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
