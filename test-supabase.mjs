import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

async function testConnection() {
    try {
        console.log('Testing Supabase connection...');
        console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Key exists:', !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        const supabase = createClient(
            env.NEXT_PUBLIC_SUPABASE_URL,
            env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        console.log('Attempting to fetch settings...');
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Query error:', error);
        } else {
            console.log('✅ Connection successful! Data:', data);
        }
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}

testConnection();
