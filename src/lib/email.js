import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '2525'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendBookingEmail(booking) {
    const to = process.env.BOOKING_EMAIL;
    const from = process.env.SMTP_FROM;

    if (!to || !from) {
        console.error('[Email] Missing BOOKING_EMAIL or SMTP_FROM env vars');
        return;
    }

    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #ed4705, #c93a04); padding: 30px 24px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 22px;">🚗 New Booking Request</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">A new recovery booking has been submitted</p>
            </div>
            <div style="padding: 28px 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600; width: 140px;">👤 Name</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; font-weight: 600;">${booking.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600;">📱 Phone</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;"><a href="tel:${booking.phone}" style="color: #2563eb; text-decoration: none;">${booking.phone}</a></td>
                    </tr>
                    ${booking.email ? `
                    <tr>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600;">📧 Email</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;"><a href="mailto:${booking.email}" style="color: #2563eb; text-decoration: none;">${booking.email}</a></td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600;">🔧 Service</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${booking.serviceType}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600;">📍 Pickup</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${booking.pickupLocation}</td>
                    </tr>
                    ${booking.dropoffLocation ? `
                    <tr>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600;">🏁 Drop-off</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${booking.dropoffLocation}</td>
                    </tr>` : ''}
                    ${booking.registrationNumber ? `
                    <tr>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600;">#️⃣ Reg Number</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px; text-transform: uppercase;">${booking.registrationNumber}</td>
                    </tr>` : ''}
                    ${booking.vehicleMake ? `
                    <tr>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600;">🚗 Vehicle</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${booking.vehicleMake}${booking.vehicleModel ? ' ' + booking.vehicleModel : ''}</td>
                    </tr>` : ''}
                    ${booking.message ? `
                    <tr>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600;">💬 Notes</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${booking.message}</td>
                    </tr>` : ''}
                </table>

                <div style="margin-top: 24px; text-align: center;">
                    <a href="https://www.cartowingnearme.co.uk/admin/bookings" style="display: inline-block; background: #253d98; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                        View in Admin Panel →
                    </a>
                </div>
            </div>
            <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
                Car Recovery NW · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Car Recovery Bookings" <${from}>`,
            to,
            subject: `🚗 New Booking: ${booking.name} — ${booking.serviceType}`,
            html,
        });
        console.log('[Email] Booking notification sent to', to);
    } catch (error) {
        console.error('[Email] Failed to send booking notification:', error.message);
    }
}
