import "../styles/sections/extra-content.css";

export default function ExtraContentSection({ content, location, majorRoads = [] }) {
    // If no content, don't render anything
    if (!content) return null;

    // Ensure content is a string
    const stringContent = String(content);
    if (stringContent.trim() === '') return null;

    // Replace {{location}} with area name
    let processedContent = stringContent.replace(/\{\{location\}\}/g, location || '');

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
