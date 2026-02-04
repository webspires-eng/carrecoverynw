import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ email, password });

        if (!user) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        // Set auth cookie
        const cookieStore = await cookies();
        cookieStore.set('admin_session', JSON.stringify({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role
        }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return NextResponse.json({
            success: true,
            user: { id: user._id.toString(), email: user.email, name: user.name }
        });
    } catch (error) {
        console.error('Login error:', error);
        const message = process.env.NODE_ENV === 'production'
            ? 'Server error'
            : (error?.message || 'Server error');
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
