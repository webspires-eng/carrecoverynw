-- Create areas table for car recovery locations
CREATE TABLE IF NOT EXISTS areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    county VARCHAR(255),
    region VARCHAR(255) DEFAULT 'West Midlands',
    
    -- SEO fields
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    -- Content fields
    h1_title VARCHAR(255),
    intro_text TEXT,
    
    -- Location data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    postcode_prefix VARCHAR(10),
    
    -- Nearby areas (JSON array of slugs)
    nearby_areas JSON,
    
    -- Major roads covered
    major_roads JSON,
    
    -- Custom content blocks (optional overrides)
    custom_services TEXT,
    custom_faqs JSON,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_region (region),
    INDEX idx_active (is_active)
);

-- Sample data insert
INSERT INTO areas (slug, name, county, region, h1_title, intro_text, postcode_prefix, major_roads) VALUES
('birmingham', 'Birmingham', 'West Midlands', 'West Midlands', '24/7 Car Recovery & Emergency Towing in Birmingham', 'Fast and reliable car recovery services across Birmingham city centre and surrounding areas. Our recovery team is on standby 24/7 to assist with breakdowns, accidents, and vehicle transport.', 'B', '["M6", "M5", "M42", "A38", "A45"]'),
('coventry', 'Coventry', 'West Midlands', 'West Midlands', '24/7 Car Recovery & Emergency Towing in Coventry', 'Professional car recovery and breakdown assistance in Coventry. We cover the entire city and surrounding towns with rapid response times.', 'CV', '["M6", "M42", "M69", "A45", "A46"]'),
('wolverhampton', 'Wolverhampton', 'West Midlands', 'West Midlands', '24/7 Car Recovery & Emergency Towing in Wolverhampton', 'Emergency car recovery services in Wolverhampton and the Black Country. Available around the clock for all vehicle recovery needs.', 'WV', '["M6", "M54", "A449", "A454"]'),
('dudley', 'Dudley', 'West Midlands', 'West Midlands', '24/7 Car Recovery & Emergency Towing in Dudley', 'Reliable car recovery and towing services in Dudley. Fast response times for breakdowns across the Black Country.', 'DY', '["M5", "A456", "A461"]'),
('solihull', 'Solihull', 'West Midlands', 'West Midlands', '24/7 Car Recovery & Emergency Towing in Solihull', 'Premium car recovery services in Solihull. Covering Solihull town centre, Birmingham Airport, and the NEC area.', 'B', '["M42", "M40", "A45", "A41"]');

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('business_name', 'Car Recovery UK'),
('phone', '07360544819'),
('whatsapp', '447360544819'),
('email', 'info@carrecoveryuk.co.uk'),
('address', 'West Midlands, UK');

-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
);

-- Insert default services
INSERT INTO services (name, description, icon, display_order, is_active) VALUES
('Vehicle Breakdown Recovery', 'Professional breakdown assistance with immediate response', 'wrench', 1, TRUE),
('Emergency Towing', '24/7 emergency towing services available', 'truck', 2, TRUE),
('Accident Recovery', 'Specialized accident recovery and vehicle transport', 'exclamation-triangle', 3, TRUE),
('Long Distance Transport', 'Safe and reliable vehicle transport across the UK', 'road', 4, TRUE),
('Fuel Delivery', 'Emergency fuel delivery service to get you back on the road', 'gas-pump', 5, TRUE),
('Lock Out Assistance', 'Professional vehicle lock out assistance', 'lock', 6, TRUE);

-- Create recoveries table
CREATE TABLE IF NOT EXISTS recoveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    customer_name VARCHAR(255),
    location VARCHAR(255),
    vehicle_type VARCHAR(255),
    image_url VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_order (display_order)
);

-- Insert sample recoveries
INSERT INTO recoveries (title, description, customer_name, location, vehicle_type, display_order, is_active) VALUES
('Fast Breakdown Recovery in Birmingham', 'Responded in 12 minutes to a stranded driver on the M6', 'John M.', 'Birmingham, M6', 'Audi A4', 1, TRUE),
('Emergency Tow from Coventry to Garage', 'Successfully transported damaged vehicle 25 miles safely', 'Sarah K.', 'Coventry to Warwick', 'BMW 3 Series', 2, TRUE),
('Accident Recovery Service', 'Swift and professional recovery from major accident scene', 'Mike T.', 'Wolverhampton', 'Mercedes C-Class', 3, TRUE),
('Fuel Delivery - Late Night Assistance', 'Delivered fuel to driver stranded on motorway at night', 'Emma L.', 'Solihull', 'Ford Focus', 4, TRUE),
('Vehicle Lock Out Resolution', 'Quick response to locked vehicle emergency', 'David R.', 'Dudley', 'VW Golf', 5, TRUE),
('Multi-Vehicle Accident Scene', 'Professional handling of complex multi-vehicle recovery', 'Robert J.', 'Birmingham Intersection', 'Multiple Vehicles', 6, TRUE);
