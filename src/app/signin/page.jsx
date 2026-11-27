"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/auth.css';

export default function SignIn() {
    const [passcode, setPasscode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passcode })
            });

            const data = await res.json();

            if (data.success) {
                router.push('/admin/areas');
                return;
            }
            setError(data.error || 'Wrong passcode');
            setPasscode('');
        } catch {
            setError('Something went wrong. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Admin Login</h1>
                    <p>Enter your passcode to manage the site</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="passcode">Passcode</label>
                        <input
                            id="passcode"
                            type="password"
                            inputMode="numeric"
                            autoComplete="current-password"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            placeholder="••••••••"
                            autoFocus
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading || !passcode}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
