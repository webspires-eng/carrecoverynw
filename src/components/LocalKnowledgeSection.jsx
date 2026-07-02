import "../styles/sections/local-knowledge.css";

// Renders genuinely local, per-city content: postcode districts covered,
// common callout spots (landmarks / roads), and unique local paragraphs.
// All fields are optional — the section (or a row) simply doesn't render
// until real data is filled in via the content worksheet
// (scripts/export-content-worksheet.mjs → import-content-worksheet.mjs).
export default function LocalKnowledgeSection({
    location,
    postcodeDistricts = [],
    landmarks = [],
    localNotes = "",
}) {
    const hasPostcodes = Array.isArray(postcodeDistricts) && postcodeDistricts.length > 0;
    const hasLandmarks = Array.isArray(landmarks) && landmarks.length > 0;
    const hasNotes = typeof localNotes === "string" && localNotes.trim().length > 0;

    if (!hasPostcodes && !hasLandmarks && !hasNotes) return null;

    return (
        <section className="local-knowledge-section">
            <div className="local-knowledge-content">
                <h2>Local Recovery Knowledge: <span className="location-name">{location}</span></h2>

                {hasNotes && (
                    <div className="local-notes">
                        {localNotes.trim().split(/\n{2,}/).map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}
                    </div>
                )}

                {hasLandmarks && (
                    <div className="local-block">
                        <h3>Common callout spots in {location}</h3>
                        <div className="local-tags">
                            {landmarks.map((l) => (
                                <span key={l} className="local-tag">{l}</span>
                            ))}
                        </div>
                    </div>
                )}

                {hasPostcodes && (
                    <div className="local-block">
                        <h3>Postcode districts we cover</h3>
                        <div className="local-tags">
                            {postcodeDistricts.map((p) => (
                                <span key={p} className="local-tag postcode">{p}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
