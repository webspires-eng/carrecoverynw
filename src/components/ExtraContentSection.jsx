"use client";

import "../styles/sections/extra-content.css";

export default function ExtraContentSection({ content, location, majorRoads = [] }) {
    if (!content || typeof content !== 'string') return null;

    // Replace {{location}} with area name
    let processedContent = content.replace(/\{\{location\}\}/g, location || '');

    // Replace {{majorRoads}}
    const roadsText = Array.isArray(majorRoads) ? majorRoads.join(', ') : (majorRoads || '');
    processedContent = processedContent.replace(/\{\{majorRoads\}\}/g, roadsText);

    return (
        <section className="extra-content-section" id="extra-content">
            <div className="container">
                <div
                    className="rich-text-content"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                />
            </div>
        </section>
    );
}
