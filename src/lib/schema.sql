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
