"use client";

import { CircleCheck } from "lucide-react";
import HighlightedText from "@/components/HighlightedText";

export default function HomeServicesSection({ location = "United Kingdom", majorRoads = [], services: dynamicServices = [] }) {
    const majorRoadsStr = (majorRoads && majorRoads.length > 0)
        ? majorRoads.slice(0, 3).join('/')
        : "M6/M5/M42";

    const defaultServices = [
        {
            title: "Emergency Breakdown Recovery",
            description: `Available 24/7, our emergency recovery team handles breakdowns, accidents, and roadside issues across ${location}.`
        },
        {
            title: "Roadside Assistance",
            description: "Quick fixes for flat tyres, jump starts, and minor mechanical issues to get you moving again fast."
        },
        {
            title: "Vehicle Transportation",
            description: "Safe, fully insured door-to-door transport for cars, vans, and motorcycles locally or nationwide."
        },
        {
            title: "Jump Start Service",
            description: "Fast battery revival service available 24/7. We'll get you started or recover you to a garage."
        },
        {
            title: "Low Vehicle Recovery",
            description: "Specialist flatbed trucks and ramps for sports cars, lowered vehicles, and luxury cars — damage-free guaranteed."
        },
        {
            title: `Motorway Recovery (${majorRoadsStr})`,
            description: "Priority dispatch for motorway breakdowns. We understand the urgency and safety risks involved."
        }
    ];

    // Filter out incomplete dynamic services first
    const validDynamicServices = dynamicServices.filter(s => s.title && s.description);

    // Use dynamic services if valid ones exist, otherwise fallback to defaults
    // Specially handle stripping "& outskirts" for the home page with case-insensitive regex
    const servicesToDisplay = validDynamicServices.length > 0
        ? validDynamicServices.map(s => {
            let title = (s.title || '');
            let description = (s.description || '');

            // Case-insensitive replacement for "& outskirts" pattern
            const outskirtsRegex = /\{\{location\}\}\s*&\s*outskirts/gi;
            title = title.replace(outskirtsRegex, '{{location}}');
            description = description.replace(outskirtsRegex, '{{location}}');

            // Standard replacements
            title = title.replaceAll('{{majorRoads}}', majorRoadsStr).replaceAll('{{location}}', location);
            description = description.replaceAll('{{majorRoads}}', majorRoadsStr).replaceAll('{{location}}', location);

            // Final cleanup just in case " & outskirts" remains after replacement (e.g. hardcoded in DB)
            const finalOutskirtsRegex = /\s*&\s*outskirts/gi;
            title = title.replace(finalOutskirtsRegex, '');
            description = description.replace(finalOutskirtsRegex, '');

            return {
                ...s,
                title,
                description
            };
        })
        : defaultServices;

    return (
        <section className="layout4">
            <h2>
                24/7 Car Recovery in <span className="location-name">{location}</span>
            </h2>
            <p className="section-description">
                From emergency breakdowns to scheduled vehicle transport, we cover all your recovery needs in <span className="location-name">{location}</span> and beyond.
            </p>

            <div className="maintainence">
                <div className="m-image"></div>

                <div className="service2-list">
                    {servicesToDisplay.map((service, index) => (
                        <div key={index}>
                            <div className="service-item">
                                <CircleCheck size={22} color="white" fill="#3ec56c" />
                                <h2><HighlightedText text={service.title} location={location} /></h2>
                            </div>
                            <p><HighlightedText text={service.description} location={location} /></p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
