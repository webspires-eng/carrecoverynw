import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://awxsgqthlbxbglvjlqpb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3eHNncXRobGJ4YmdsdmpscXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjU0NDIsImV4cCI6MjA4NTgwMTQ0Mn0.Kpf7ZTHJQWYBf3Pudn0KP6nGfsZSqqld418Mmgf9OY4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupSupabase() {
    try {
        console.log('Setting up Supabase tables...');

        // Insert settings
        console.log('Adding settings...');
        const { error: settingsError } = await supabase
            .from('settings')
            .insert([
                { setting_key: 'business_name', setting_value: 'Car Recovery UK' },
                { setting_key: 'phone', setting_value: '07360544819' },
                { setting_key: 'whatsapp', setting_value: '447360544819' },
                { setting_key: 'email', setting_value: 'info@carrecoveryuk.co.uk' },
                { setting_key: 'address', setting_value: 'West Midlands, UK' }
            ]);
        if (settingsError) console.log('Settings (may already exist):', settingsError.message);

        // Insert services
        console.log('Adding services...');
        const { error: servicesError } = await supabase
            .from('services')
            .insert([
                { name: 'Vehicle Breakdown Recovery', description: 'Professional breakdown assistance with immediate response', icon: 'wrench', display_order: 1, is_active: true },
                { name: 'Emergency Towing', description: '24/7 emergency towing services available', icon: 'truck', display_order: 2, is_active: true },
                { name: 'Accident Recovery', description: 'Specialized accident recovery and vehicle transport', icon: 'exclamation-triangle', display_order: 3, is_active: true },
                { name: 'Long Distance Transport', description: 'Safe and reliable vehicle transport across the UK', icon: 'road', display_order: 4, is_active: true },
                { name: 'Fuel Delivery', description: 'Emergency fuel delivery service to get you back on the road', icon: 'gas-pump', display_order: 5, is_active: true },
                { name: 'Lock Out Assistance', description: 'Professional vehicle lock out assistance', icon: 'lock', display_order: 6, is_active: true }
            ]);
        if (servicesError) console.log('Services (may already exist):', servicesError.message);

        // Insert recoveries
        console.log('Adding recoveries...');
        const { error: recoveriesError } = await supabase
            .from('recoveries')
            .insert([
                { title: 'M6 Motorway Breakdown', description: 'Responded in 12 minutes to a stranded driver on the M6', customer_name: 'John M.', location: 'M6 Junction 6', vehicle_type: 'BMW 3 Series', display_order: 1, is_active: true },
                { title: 'Damaged Vehicle Transport', description: 'Successfully transported damaged vehicle 25 miles safely', customer_name: 'Sarah T.', location: 'Coventry to Warwick', vehicle_type: 'Toyota Corolla', display_order: 2, is_active: true },
                { title: 'Accident Scene Recovery', description: 'Swift and professional recovery from major accident scene', customer_name: 'Mike R.', location: 'Birmingham Intersection', vehicle_type: 'Mercedes C-Class', display_order: 3, is_active: true },
                { title: 'Fuel Delivery Service', description: 'Delivered fuel to driver stranded on motorway at night', customer_name: 'Emma L.', location: 'M42 Southbound', vehicle_type: 'Ford Focus', display_order: 4, is_active: true },
                { title: 'Vehicle Lock Out', description: 'Quick response to locked vehicle emergency', customer_name: 'David K.', location: 'Dudley Town Centre', vehicle_type: 'Volkswagen Golf', display_order: 5, is_active: true },
                { title: 'Multi-Vehicle Recovery', description: 'Professional handling of complex multi-vehicle recovery', customer_name: 'Robert J.', location: 'Wolverhampton M6', vehicle_type: 'Multiple Vehicles', display_order: 6, is_active: true }
            ]);
        if (recoveriesError) console.log('Recoveries (may already exist):', recoveriesError.message);

        // Insert areas
        console.log('Adding areas...');
        const { error: areasError } = await supabase
            .from('areas')
            .insert([
                { slug: 'birmingham', name: 'Birmingham', county: 'West Midlands', region: 'West Midlands', h1_title: '24/7 Car Recovery & Emergency Towing in Birmingham', intro_text: 'Fast and reliable car recovery services across Birmingham city centre and surrounding areas. Our recovery team is on standby 24/7 to assist with breakdowns, accidents, and vehicle transport.', postcode_prefix: 'B', major_roads: ['M6', 'M5', 'M42', 'A38', 'A45'], is_active: true },
                { slug: 'coventry', name: 'Coventry', county: 'West Midlands', region: 'West Midlands', h1_title: '24/7 Car Recovery & Emergency Towing in Coventry', intro_text: 'Professional car recovery and breakdown assistance in Coventry. We cover the entire city and surrounding towns with rapid response times.', postcode_prefix: 'CV', major_roads: ['M6', 'M42', 'M69', 'A45', 'A46'], is_active: true },
                { slug: 'wolverhampton', name: 'Wolverhampton', county: 'West Midlands', region: 'West Midlands', h1_title: '24/7 Car Recovery & Emergency Towing in Wolverhampton', intro_text: 'Emergency car recovery services in Wolverhampton and the Black Country. Available around the clock for all vehicle recovery needs.', postcode_prefix: 'WV', major_roads: ['M6', 'M54', 'A449', 'A454'], is_active: true },
                { slug: 'dudley', name: 'Dudley', county: 'West Midlands', region: 'West Midlands', h1_title: '24/7 Car Recovery & Emergency Towing in Dudley', intro_text: 'Reliable car recovery and towing services in Dudley. Fast response times for breakdowns across the Black Country.', postcode_prefix: 'DY', major_roads: ['M5', 'A456', 'A461'], is_active: true },
                { slug: 'solihull', name: 'Solihull', county: 'West Midlands', region: 'West Midlands', h1_title: '24/7 Car Recovery & Emergency Towing in Solihull', intro_text: 'Premium car recovery services in Solihull. Covering Solihull town centre, Birmingham Airport, and the NEC area.', postcode_prefix: 'B', major_roads: ['M42', 'M40', 'A45', 'A41'], is_active: true }
            ]);
        if (areasError) console.log('Areas (may already exist):', areasError.message);

        console.log('✅ Supabase setup completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

setupSupabase();
