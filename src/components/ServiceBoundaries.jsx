"use client";

import "../styles/sections/service-boundaries.css";

export default function ServiceBoundaries() {
    return (
        <section className="service-boundaries">
            <h2>Before We Dispatch: Tell Us These Details</h2>

            <div className="boundaries-grid">
                <div className="boundary-card">
                    <h3>Vehicle Condition</h3>
                    <ul>
                        <li>Are the wheels locked or is it stuck in park?</li>
                        <li>Is there heavy accident damage to the suspension?</li>
                        <li>Is it a low-clearance or sports car?</li>
                        <li>Is the vehicle stuck in deep mud, snow, or a ditch?</li>
                    </ul>
                </div>

                <div className="boundary-card">
                    <h3>Your Location</h3>
                    <ul>
                        <li>Are you on a live lane or a motorway hard shoulder?</li>
                        <li>Is the vehicle in a multi-storey or underground car park?</li>
                        <li>Are there any height restrictions for our tow trucks?</li>
                    </ul>
                </div>

                <div className="boundary-card">
                    <h3>Safety & Passengers</h3>
                    <ul>
                        <li>Do you have any passengers (children or pets)?</li>
                        <li>Are you and your passengers in a safe location?</li>
                        <li>Do you need transport for multiple people?</li>
                    </ul>
                </div>
            </div>

            <div className="boundary-footer">
                <p><strong>Information Gain:</strong> Providing these details allows us to dispatch the correct equipment immediately, preventing any delays or complications upon arrival.</p>
            </div>
        </section>
    );
}
