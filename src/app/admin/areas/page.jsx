"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '../../../styles/admin.css';

export default function AdminDashboard() {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

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
            <header className="admin-header">
                <div>
                    <h1>Area Pages Dashboard</h1>
                    <p>Manage your 4000+ location pages</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/admin/settings" className="btn-edit" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>Settings</Link>
                    <button onClick={handleLogout} className="btn-logout">Logout</button>
                </div>
            </header>

            <div className="admin-controls">
                <input
                    type="text"
                    placeholder="Search areas..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="search-input"
                />
                <Link href="/admin/areas/add" className="btn-primary" style={{ textDecoration: 'none' }}>
                    + Add New Area
                </Link>
            </div>

            <div className="stats-bar">
                <span>Total Areas: <strong>{pagination.total}</strong></span>
                <span>Page {page} of {pagination.totalPages}</span>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <table className="areas-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Slug</th>
                            <th>County</th>
                            <th>Postcode</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {areas.map((area) => (
                            <tr key={area.id}>
                                <td>{area.name}</td>
                                <td><a href={`/area/${area.slug}`} target="_blank">/area/{area.slug}</a></td>
                                <td>{area.county || '-'}</td>
                                <td>{area.postcode_prefix || '-'}</td>
                                <td>
                                    <Link href={`/admin/areas/${area.id}/edit`} className="btn-edit" style={{ display: 'inline-block', textDecoration: 'none' }}>Edit</Link>
                                    <button onClick={() => handleDelete(area.id)} className="btn-delete">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <span>Page {page}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
        </div>
    );
}
