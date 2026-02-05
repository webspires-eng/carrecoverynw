"use client";

import "../styles/sections/extra-content.css";

export default function ExtraContentSection({ content, location }) {
    if (!content) return null;

    // Replace {{location}} with area name
    const processedContent = content.replace(/\{\{location\}\}/g, location);

    return (
        <section className="extra-content-section">
            <div className="container">
                <div
                    className="rich-text-content"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                />
            </div>
        </section>
    );
}
