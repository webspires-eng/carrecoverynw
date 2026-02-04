import pool from './src/lib/db.js';

async function updateRecoveries() {
    try {
        console.log('Updating recoveries in database...');
        
        // Clear existing recoveries
        await pool.execute('DELETE FROM recoveries');
        
        // Insert updated recoveries with more details
        const recoveries = [
            {
                title: 'M6 Motorway Breakdown',
                description: 'Responded in 12 minutes to a stranded driver on the M6',
                customer_name: 'John M.',
                location: 'M6 Junction 6',
                vehicle_type: 'BMW 3 Series',
                display_order: 1,
                is_active: 1
            },
            {
                title: 'Damaged Vehicle Transport',
                description: 'Successfully transported damaged vehicle 25 miles safely',
                customer_name: 'Sarah T.',
                location: 'Coventry to Warwick',
                vehicle_type: 'Toyota Corolla',
                display_order: 2,
                is_active: 1
            },
            {
                title: 'Accident Scene Recovery',
                description: 'Swift and professional recovery from major accident scene',
                customer_name: 'Mike R.',
                location: 'Birmingham Intersection',
                vehicle_type: 'Mercedes C-Class',
                display_order: 3,
                is_active: 1
            },
            {
                title: 'Fuel Delivery Service',
                description: 'Delivered fuel to driver stranded on motorway at night',
                customer_name: 'Emma L.',
                location: 'M42 Southbound',
                vehicle_type: 'Ford Focus',
                display_order: 4,
                is_active: 1
            },
            {
                title: 'Vehicle Lock Out',
                description: 'Quick response to locked vehicle emergency',
                customer_name: 'David K.',
                location: 'Dudley Town Centre',
                vehicle_type: 'Volkswagen Golf',
                display_order: 5,
                is_active: 1
            },
            {
                title: 'Multi-Vehicle Recovery',
                description: 'Professional handling of complex multi-vehicle recovery',
                customer_name: 'Robert J.',
                location: 'Wolverhampton M6',
                vehicle_type: 'Multiple Vehicles',
                display_order: 6,
                is_active: 1
            }
        ];
        
        for (const recovery of recoveries) {
            await pool.execute(
                'INSERT INTO recoveries (title, description, customer_name, location, vehicle_type, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [recovery.title, recovery.description, recovery.customer_name, recovery.location, recovery.vehicle_type, recovery.display_order, recovery.is_active]
            );
        }
        
        console.log('✅ Recoveries updated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Update failed:', error.message);
        process.exit(1);
    }
}

updateRecoveries();
