"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    MapPin, Wrench, MessageSquare, Trash2,
    Search, LogOut, Settings, Globe, ClipboardList,
    Sparkles, CheckCheck, Truck, CheckCircle2, XCircle,
    ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, X, AlertCircle,
    Ban, Pencil, PoundSterling, Car, User, StickyNote,
    Route, History
} from 'lucide-react';
import { loadGoogleMaps } from '../../../lib/googleMapsLoader';
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

const DRAFT_KEY = 'booking_draft';       // legacy single-draft key, migrated on load
const DRAFTS_KEY = 'booking_drafts';

function readDrafts() {
    try {
        const arr = JSON.parse(localStorage.getItem(DRAFTS_KEY) || 'null');
        return Array.isArray(arr) ? arr : [];
    } catch {
        return [];
    }
}

function newDraftId() {
    return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const FORM_STEPS = [
    { title: 'Location', Icon: MapPin },
    { title: 'Vehicle', Icon: Car },
    { title: 'Customer', Icon: User },
    { title: 'Job & Status', Icon: Wrench },
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
    const [step, setStep] = useState(0);
    const [form, setForm] = useState(EMPTY_BOOKING);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [dvlaStatus, setDvlaStatus] = useState(null);
    const [dvlaInfo, setDvlaInfo] = useState(null);
    const [draftRestored, setDraftRestored] = useState(false);
    const [drafts, setDrafts] = useState([]);
    const [draftId, setDraftId] = useState(null);

    const writeDrafts = (arr) => {
        localStorage.setItem(DRAFTS_KEY, JSON.stringify(arr));
        setDrafts(arr);
    };

    // Load drafts on mount, migrating the legacy single-draft key if present
    useEffect(() => {
        let arr = readDrafts();
        try {
            const legacy = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
            if (legacy && typeof legacy === 'object') {
                arr = [{ id: newDraftId(), form: { ...EMPTY_BOOKING, ...legacy }, updatedAt: new Date().toISOString() }, ...arr];
                localStorage.setItem(DRAFTS_KEY, JSON.stringify(arr));
            }
        } catch { /* corrupt legacy draft — drop it */ }
        localStorage.removeItem(DRAFT_KEY);
        setDrafts(arr);
    }, []);

    // Google Maps: selected places, distance result, embedded map
    const [mapsReady, setMapsReady] = useState(false);
    const [pickupPlace, setPickupPlace] = useState(null);
    const [dropoffPlace, setDropoffPlace] = useState(null);
    const [distance, setDistance] = useState(null);
    const pickupInputRef = useRef(null);
    const dropoffInputRef = useRef(null);
    const autocompletesRef = useRef([]);
    const mapDivRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);

    // Attach Places Autocomplete (UK-only) to the pickup/drop-off inputs while the modal is open
    useEffect(() => {
        if (!showModal) return;
        let cancelled = false;

        loadGoogleMaps()
            .then((google) => {
                if (cancelled || !google) return;
                const options = {
                    componentRestrictions: { country: 'gb' },
                    fields: ['formatted_address', 'geometry', 'place_id', 'name'],
                };
                const attach = (input, fieldName, setPlace) => {
                    if (!input) return null;
                    const ac = new google.maps.places.Autocomplete(input, options);
                    ac.addListener('place_changed', () => {
                        const place = ac.getPlace();
                        if (!place?.geometry?.location) return;
                        const address = place.formatted_address || place.name || input.value;
                        setForm(prev => ({ ...prev, [fieldName]: address }));
                        setPlace({
                            placeId: place.place_id,
                            lat: place.geometry.location.lat(),
                            lng: place.geometry.location.lng(),
                            address,
                        });
                    });
                    return ac;
                };
                autocompletesRef.current = [
                    attach(pickupInputRef.current, 'pickupLocation', setPickupPlace),
                    attach(dropoffInputRef.current, 'dropoffLocation', setDropoffPlace),
                ].filter(Boolean);
                setMapsReady(true);
            })
            .catch(err => console.error('Google Maps failed to load:', err));

        return () => {
            cancelled = true;
            autocompletesRef.current.forEach(ac => window.google?.maps?.event?.clearInstanceListeners(ac));
            autocompletesRef.current = [];
            mapRef.current = null;
            markersRef.current = [];
        };
    }, [showModal]);

    // Recalculate driving distance whenever both locations have a selected place
    useEffect(() => {
        if (!pickupPlace || !dropoffPlace) {
            setDistance(null);
            return;
        }
        let cancelled = false;
        setDistance({ status: 'loading' });
        const toParam = p => (p.placeId ? `place_id:${p.placeId}` : `${p.lat},${p.lng}`);
        fetch('/api/distance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ origin: toParam(pickupPlace), destination: toParam(dropoffPlace) }),
        })
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                if (data.success) {
                    setDistance({ status: 'ok', miles: data.distanceText, duration: data.durationText });
                } else {
                    setDistance({ status: 'error', message: data.error || 'Could not calculate distance' });
                }
            })
            .catch(() => {
                if (!cancelled) setDistance({ status: 'error', message: 'Could not calculate distance' });
            });
        return () => { cancelled = true; };
    }, [pickupPlace, dropoffPlace]);

    // Embedded map: markers on pickup/drop-off, fit bounds to both
    useEffect(() => {
        if (!showModal || !mapsReady) return;
        const google = window.google;
        const points = [pickupPlace, dropoffPlace].filter(Boolean);
        if (points.length === 0 || !mapDivRef.current) {
            // Map div is unmounted when no places are selected — drop the stale instance
            mapRef.current = null;
            markersRef.current = [];
            return;
        }

        if (!mapRef.current) {
            mapRef.current = new google.maps.Map(mapDivRef.current, {
                center: { lat: points[0].lat, lng: points[0].lng },
                zoom: 13,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            });
        }
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = points.map(p => new google.maps.Marker({
            map: mapRef.current,
            position: { lat: p.lat, lng: p.lng },
            title: p.address,
            label: {
                text: p === pickupPlace ? 'A' : 'B',
                color: '#ffffff', fontWeight: '700', fontSize: '12px',
            },
        }));
        if (points.length === 2) {
            const bounds = new google.maps.LatLngBounds();
            points.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
            mapRef.current.fitBounds(bounds, 48);
        } else {
            mapRef.current.setCenter({ lat: points[0].lat, lng: points[0].lng });
            mapRef.current.setZoom(13);
        }
    }, [showModal, mapsReady, pickupPlace, dropoffPlace]);

    // Manual distance calculation — also works with free-typed addresses
    // (no autocomplete selection needed; Distance Matrix accepts plain text)
    const handleCalcDistance = async () => {
        const pickupText = form.pickupLocation.trim();
        const dropoffText = form.dropoffLocation.trim();
        if (!pickupText || !dropoffText) return;
        const toParam = (place, text) =>
            place ? (place.placeId ? `place_id:${place.placeId}` : `${place.lat},${place.lng}`) : text;
        setDistance({ status: 'loading' });
        try {
            const res = await fetch('/api/distance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin: toParam(pickupPlace, pickupText),
                    destination: toParam(dropoffPlace, dropoffText),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setDistance({ status: 'ok', miles: data.distanceText, duration: data.durationText });
            } else {
                setDistance({ status: 'error', message: data.error || 'Could not calculate distance' });
            }
        } catch {
            setDistance({ status: 'error', message: 'Could not calculate distance' });
        }
    };

    // Draft auto-save: persist the New Booking form to localStorage (debounced 500ms)
    useEffect(() => {
        if (!showModal || editingId || !draftId) return;
        const timer = setTimeout(() => {
            const hasData = Object.keys(EMPTY_BOOKING).some(k => form[k] !== EMPTY_BOOKING[k]);
            const rest = readDrafts().filter(d => d.id !== draftId);
            if (hasData) {
                writeDrafts([{ id: draftId, form, updatedAt: new Date().toISOString() }, ...rest]);
            } else {
                writeDrafts(rest);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [form, showModal, editingId, draftId]);

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
        if (statusFilter === 'drafts') return;   // drafts live in localStorage, not the API
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

    const resetModalExtras = () => {
        setStep(0);
        setPickupPlace(null);
        setDropoffPlace(null);
        setDistance(null);
        setFormError('');
        setDvlaStatus(null);
        setDvlaInfo(null);
    };

    const handleNext = () => {
        setFormError('');
        setStep(s => Math.min(s + 1, FORM_STEPS.length - 1));
    };

    const goToStep = (i) => {
        setFormError('');
        setStep(i);
    };

    const openCreate = () => {
        setEditingId(null);
        // Resume the most recent draft if one survived a refresh / accidental close
        const existing = readDrafts();
        if (existing.length > 0) {
            setForm({ ...EMPTY_BOOKING, ...existing[0].form });
            setDraftId(existing[0].id);
            setDraftRestored(true);
        } else {
            setForm({ ...EMPTY_BOOKING, bookingDate: toDateInput(new Date()) });
            setDraftId(newDraftId());
            setDraftRestored(false);
        }
        resetModalExtras();
        setShowModal(true);
    };

    const resumeDraft = (draft) => {
        setEditingId(null);
        setForm({ ...EMPTY_BOOKING, ...draft.form });
        setDraftId(draft.id);
        setDraftRestored(false);
        resetModalExtras();
        setShowModal(true);
    };

    const deleteDraft = (id) => {
        if (!confirm('Delete this draft? This cannot be undone.')) return;
        writeDrafts(readDrafts().filter(d => d.id !== id));
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
        setDraftRestored(false);
        setDraftId(null);
        resetModalExtras();
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        if (!editingId && draftId) {
            const dirty = Object.keys(EMPTY_BOOKING).some(k => form[k] !== EMPTY_BOOKING[k]);
            if (dirty && confirm('Discard this booking draft?\n\nOK — discard it · Cancel — keep it in the Drafts tab')) {
                writeDrafts(readDrafts().filter(d => d.id !== draftId));
            }
        }
        setShowModal(false);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        // Manual edits invalidate the previously selected place (and its distance)
        if (name === 'pickupLocation') setPickupPlace(null);
        if (name === 'dropoffLocation') setDropoffPlace(null);
        if (formError) setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Enter on an intermediate step advances instead of submitting
        if (step < FORM_STEPS.length - 1) {
            handleNext();
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
                    if (draftId) writeDrafts(readDrafts().filter(d => d.id !== draftId));
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
        { key: 'drafts', label: 'Drafts', count: drafts.length },
        ...STATUS_KEYS.map(k => ({ key: k, label: STATUS_META[k].label, count: counts[k] || 0 })),
    ].filter(tab =>
        // Hide empty tabs, but always keep "All" and never hide the active tab
        tab.key === 'all' || tab.count > 0 || statusFilter === tab.key
    );

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
                {statusFilter === 'drafts' ? (
                    drafts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <StickyNote size={48} strokeWidth={1.5} />
                            </div>
                            <h3>No drafts</h3>
                            <p>Unfinished New Booking forms are saved here automatically.</p>
                        </div>
                    ) : (
                        <div className="bk-list">
                            {drafts.map(d => (
                                <article key={d.id} className="bk-card bk-draft-card">
                                    <div className="bk-draft-row">
                                        <div className="bk-cell bk-cell--customer">
                                            <div className="bk-avatar bk-avatar--draft">
                                                {initialsOf(d.form?.name)}
                                            </div>
                                            <div className="bk-customer-name">
                                                {d.form?.name || 'Untitled draft'}
                                            </div>
                                        </div>
                                        <div className="bk-cell bk-cell--route">
                                            <div className="bk-route-from">
                                                <MapPin size={13} />
                                                <span>{d.form?.pickupLocation || 'No pickup yet'}</span>
                                            </div>
                                        </div>
                                        <div className="bk-cell bk-cell--service">
                                            <div className="bk-service-name">
                                                <Wrench size={13} />
                                                <span>{d.form?.serviceType || '—'}</span>
                                            </div>
                                        </div>
                                        <div className="bk-cell bk-cell--date">
                                            <span>{formatDateShort(d.updatedAt)}</span>
                                        </div>
                                        <div className="bk-draft-actions">
                                            <button type="button" className="bk-btn-edit" onClick={() => resumeDraft(d)}>
                                                <Pencil size={14} />
                                                Resume
                                            </button>
                                            <button type="button" className="bk-btn-delete" onClick={() => deleteDraft(d.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )
                ) : loading ? (
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
                                                {booking.name || 'Unnamed'}
                                                {booking.source === 'manual' && (
                                                    <span className="bk-source-tag">M</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bk-cell bk-cell--route">
                                            <div className="bk-route-from">
                                                <MapPin size={13} />
                                                <span>{booking.pickupLocation || '—'}</span>
                                            </div>
                                        </div>

                                        <div className="bk-cell bk-cell--service">
                                            <div className="bk-service-name">
                                                <Wrench size={13} />
                                                <span>{booking.serviceType || '—'}</span>
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

                {statusFilter !== 'drafts' && bookings.length > 0 && (
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
                    <div className="bk-modal bk-modal--wide" onClick={e => e.stopPropagation()}>
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

                        <form onSubmit={handleSubmit} className="bk-modal-form" noValidate>
                            <div className="bk-modal-columns">
                            <div className="bk-modal-body">
                                {formError && (
                                    <div className="bk-modal-error">
                                        <AlertCircle size={15} />
                                        {formError}
                                    </div>
                                )}

                                {draftRestored && !editingId && (
                                    <div className="bk-draft-note">
                                        <History size={14} />
                                        <span>Unsaved draft restored — all drafts live in the Drafts tab.</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm({ ...EMPTY_BOOKING, bookingDate: toDateInput(new Date()) });
                                                setDraftId(newDraftId());
                                                setPickupPlace(null);
                                                setDropoffPlace(null);
                                                setDistance(null);
                                                setDraftRestored(false);
                                            }}
                                        >
                                            Start fresh
                                        </button>
                                    </div>
                                )}

                                <div className="bk-stepper">
                                    {FORM_STEPS.map((s, i) => {
                                        const SIcon = s.Icon;
                                        const done = i < step;
                                        return (
                                            <button
                                                key={s.title}
                                                type="button"
                                                className={`bk-stepper-item ${i === step ? 'bk-stepper-item--active' : ''} ${done ? 'bk-stepper-item--done' : ''}`}
                                                onClick={() => goToStep(i)}
                                            >
                                                <span className="bk-stepper-num">
                                                    {done ? <CheckCheck size={11} strokeWidth={3} /> : i + 1}
                                                </span>
                                                <SIcon size={13} />
                                                <span className="bk-stepper-label">{s.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="bk-step-pane" hidden={step !== 0}>
                                    <div className="bk-form-section">
                                        <div className="bk-form-section-title">
                                            <MapPin size={13} />
                                            Pickup &amp; Drop-off
                                        </div>
                                        <div className="bk-form-grid">
                                            <div className="bk-field bk-field--full">
                                                <label htmlFor="mb-pickup">Pickup Location</label>
                                                <input id="mb-pickup" name="pickupLocation" type="text" placeholder="e.g. M6 Junction 7, Birmingham"
                                                    ref={pickupInputRef} autoComplete="off"
                                                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                                                    value={form.pickupLocation} onChange={handleFormChange} />
                                            </div>
                                            <div className="bk-field bk-field--full">
                                                <label htmlFor="mb-dropoff">Drop-off Location</label>
                                                <input id="mb-dropoff" name="dropoffLocation" type="text" placeholder="e.g. Home address or garage"
                                                    ref={dropoffInputRef} autoComplete="off"
                                                    onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                                                    value={form.dropoffLocation} onChange={handleFormChange} />
                                            </div>
                                            <div className="bk-field bk-field--full">
                                                <label htmlFor="mb-service">Service Type</label>
                                                <select id="mb-service" name="serviceType" value={form.serviceType} onChange={handleFormChange}>
                                                    <option value="">Select a service…</option>
                                                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bk-step-pane" hidden={step !== 2}>
                                    <div className="bk-form-section">
                                        <div className="bk-form-section-title">
                                            <User size={13} />
                                            Customer
                                        </div>
                                        <div className="bk-form-grid">
                                            <div className="bk-field">
                                                <label htmlFor="mb-name">Full Name</label>
                                                <input id="mb-name" name="name" type="text" placeholder="John Smith"
                                                    value={form.name} onChange={handleFormChange} />
                                            </div>
                                            <div className="bk-field">
                                                <label htmlFor="mb-phone">Phone / WhatsApp</label>
                                                <input id="mb-phone" name="phone" type="tel" placeholder="07XXX XXXXXX"
                                                    value={form.phone} onChange={handleFormChange} />
                                            </div>
                                            <div className="bk-field bk-field--full">
                                                <label htmlFor="mb-email">Email</label>
                                                <input id="mb-email" name="email" type="email" placeholder="john@example.com"
                                                    value={form.email} onChange={handleFormChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bk-step-pane" hidden={step !== 1}>
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
                                </div>

                                <div className="bk-step-pane" hidden={step !== 3}>
                                <div className="bk-form-section">
                                    <div className="bk-form-section-title">
                                        <Wrench size={13} />
                                        Job
                                    </div>
                                    <div className="bk-form-grid">
                                        <div className="bk-field">
                                            <label htmlFor="mb-date">Booking Date</label>
                                            <input id="mb-date" name="bookingDate" type="date"
                                                value={form.bookingDate} onChange={handleFormChange} />
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

                                <div className="bk-form-section">
                                    <div className="bk-form-section-title">
                                        <PoundSterling size={13} />
                                        Value &amp; Status
                                    </div>
                                    <div className="bk-form-grid">
                                        <div className="bk-field">
                                            <label htmlFor="mb-price">Job Value (£)</label>
                                            <input id="mb-price" name="price" type="number" min="0" step="0.01" placeholder="e.g. 120"
                                                value={form.price} onChange={handleFormChange} />
                                        </div>
                                        <div className="bk-field bk-field--full">
                                            <label>Status</label>
                                            <div className="bk-status-picker" role="radiogroup" aria-label="Booking status">
                                                {STATUS_KEYS.map(k => {
                                                    const sm = STATUS_META[k];
                                                    const SIcon = sm.Icon;
                                                    const active = form.status === k;
                                                    return (
                                                        <button
                                                            key={k}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={active}
                                                            className={`bk-status-opt ${active ? 'bk-status-opt--active' : ''}`}
                                                            style={active ? { background: sm.bg, color: sm.color, borderColor: sm.border } : undefined}
                                                            onClick={() => setForm(prev => ({ ...prev, status: k }))}
                                                        >
                                                            <SIcon size={12} strokeWidth={2.5} />
                                                            {sm.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>

                            <aside className={`bk-modal-side bk-modal-side--step${step}`}>
                                <div className="bk-side-group bk-side-group--route">
                                <div className="bk-side-title">
                                    <Route size={13} />
                                    Route Preview
                                </div>
                                {(pickupPlace || dropoffPlace) ? (
                                    <div className="bk-map" ref={mapDivRef} />
                                ) : (
                                    <div className="bk-map-empty">
                                        <MapPin size={22} strokeWidth={1.8} />
                                        <span>Pick locations from the suggestions to preview the route on the map</span>
                                    </div>
                                )}
                                {distance && (
                                    <div className={`bk-distance-panel ${distance.status === 'error' ? 'bk-distance-panel--error' : ''}`}>
                                        <Route size={15} />
                                        {distance.status === 'loading' && <span>Calculating driving distance…</span>}
                                        {distance.status === 'ok' && (
                                            <span>
                                                <strong>{distance.miles}</strong>
                                                {distance.duration && (
                                                    <span className="bk-distance-duration"> · approx {distance.duration}</span>
                                                )}
                                            </span>
                                        )}
                                        {distance.status === 'error' && <span>{distance.message}</span>}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="bk-btn-calc"
                                    onClick={handleCalcDistance}
                                    disabled={!form.pickupLocation.trim() || !form.dropoffLocation.trim() || distance?.status === 'loading'}
                                >
                                    <Route size={14} />
                                    {distance?.status === 'loading' ? 'Calculating…' : 'Calculate distance'}
                                </button>
                                </div>

                                <div className="bk-side-group bk-side-group--summary">
                                <div className="bk-side-title">
                                    <ClipboardList size={13} />
                                    Summary
                                </div>
                                <div className="bk-side-summary">
                                    <div className="bk-side-row">
                                        <span>Customer</span>
                                        <strong>{form.name || '—'}</strong>
                                    </div>
                                    <div className="bk-side-row">
                                        <span>Phone</span>
                                        <strong>{form.phone || '—'}</strong>
                                    </div>
                                    <div className="bk-side-row">
                                        <span>Service</span>
                                        <strong>{form.serviceType || '—'}</strong>
                                    </div>
                                    <div className="bk-side-row">
                                        <span>Date</span>
                                        <strong>{form.bookingDate || '—'}</strong>
                                    </div>
                                    <div className="bk-side-row">
                                        <span>Vehicle</span>
                                        <strong>
                                            {[form.vehicleMake, form.vehicleModel].filter(Boolean).join(' ')
                                                || form.registrationNumber || '—'}
                                        </strong>
                                    </div>
                                    <div className="bk-side-row">
                                        <span>Job value</span>
                                        <strong>{formatMoney(form.price) || '—'}</strong>
                                    </div>
                                    {distance?.status === 'ok' && (
                                        <div className="bk-side-row">
                                            <span>Distance</span>
                                            <strong>{distance.miles}</strong>
                                        </div>
                                    )}
                                </div>
                                </div>
                            </aside>
                            </div>

                            <div className="bk-modal-foot">
                                {!editingId && (
                                    <span className="bk-foot-hint">
                                        <History size={13} />
                                        Draft saves automatically
                                    </span>
                                )}
                                <button type="button" className="bk-btn-ghost" onClick={closeModal} disabled={saving}>
                                    Cancel
                                </button>
                                {step > 0 && (
                                    <button type="button" className="bk-btn-ghost" onClick={() => goToStep(step - 1)} disabled={saving}>
                                        <ChevronLeft size={15} />
                                        Back
                                    </button>
                                )}
                                {step < FORM_STEPS.length - 1 ? (
                                    <button type="button" className="bk-btn-save" onClick={handleNext}>
                                        Next
                                        <ChevronRight size={15} />
                                    </button>
                                ) : (
                                    <button type="submit" className="bk-btn-save" disabled={saving}>
                                        {saving
                                            ? 'Saving…'
                                            : editingId
                                                ? <><CheckCheck size={16} /> Save Changes</>
                                                : <><Plus size={16} strokeWidth={2.5} /> Create Booking</>}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
