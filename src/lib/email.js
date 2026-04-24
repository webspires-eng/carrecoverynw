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

const BRAND = {
    name: 'Car Recovery NW',
    domain: 'cartowingnearme.co.uk',
    adminUrl: 'https://www.cartowingnearme.co.uk/admin/bookings',
    primary: '#012169',
    primaryDark: '#001140',
    accent: '#ed4705',
    whatsapp: '#25d366',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const digits = (s) => String(s ?? '').replace(/[^\d]/g, '');

function buildHtml(booking, { resend = false } = {}) {
    const eyebrow = resend ? 'Booking resent' : 'New booking';
    const phoneDigits = digits(booking.phone);
    const formattedDate = new Date(booking.created_at || Date.now()).toLocaleString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    const bookingId = booking.id || booking._id || '';
    const shortId = bookingId ? `#${String(bookingId).slice(-6).toUpperCase()}` : '';

    const row = (label, value) => `
        <tr>
            <td style="padding:14px 0;border-bottom:1px solid #eef0f4;color:#64748b;font-size:13px;font-weight:600;width:130px;vertical-align:top;">${esc(label)}</td>
            <td style="padding:14px 0;border-bottom:1px solid #eef0f4;color:#0f172a;font-size:14px;font-weight:500;vertical-align:top;">${value}</td>
        </tr>
    `;

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(eyebrow)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,Arial,sans-serif;color:#0f172a;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f6fb;padding:32px 16px;">
  <tr><td align="center">

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">

      <!-- HERO -->
      <tr>
        <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryDark} 100%);padding:34px 32px 30px;color:#ffffff;">
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${BRAND.accent};margin-bottom:14px;">${esc(eyebrow)}</div>
          <h1 style="margin:0 0 10px;font-size:26px;line-height:1.2;font-weight:800;color:#ffffff;">${esc(booking.serviceType || 'Recovery request')}</h1>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${shortId ? `<td style="padding-right:14px;color:rgba(255,255,255,0.75);font-size:13px;font-weight:500;">Ref ${esc(shortId)}</td>` : ''}
              <td style="color:rgba(255,255,255,0.75);font-size:13px;font-weight:500;">${esc(formattedDate)}</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- DETAILS TABLE -->
      <tr>
        <td style="padding:8px 32px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${row('Name', esc(booking.name))}
            ${row('Phone', `<a href="tel:${esc(phoneDigits)}" style="color:${BRAND.primary};text-decoration:none;font-weight:600;">${esc(booking.phone)}</a>`)}
            ${booking.email ? row('Email', `<a href="mailto:${esc(booking.email)}" style="color:${BRAND.primary};text-decoration:none;">${esc(booking.email)}</a>`) : ''}
            ${row('Pickup', `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#eef4ff;color:${BRAND.primary};font-weight:600;font-size:13px;">${esc(booking.pickupLocation)}</span>`)}
            ${booking.dropoffLocation ? row('Drop-off', esc(booking.dropoffLocation)) : ''}
            ${booking.registrationNumber ? row('Reg', `<span style="font-family:'Courier New',monospace;background:#fbbf24;color:#0f172a;padding:3px 10px;border-radius:4px;font-weight:700;letter-spacing:1.5px;">${esc(booking.registrationNumber.toUpperCase())}</span>`) : ''}
            ${(booking.vehicleMake || booking.vehicleModel) ? row('Vehicle', esc([booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(' '))) : ''}
            ${booking.message ? row('Notes', `<span style="color:#475569;line-height:1.55;">${esc(booking.message)}</span>`) : ''}
          </table>
        </td>
      </tr>

      <!-- CTA ROW -->
      <tr>
        <td style="padding:24px 32px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:0 6px 10px 0;width:34%;">
                <a href="${BRAND.adminUrl}" style="display:block;text-align:center;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 8px;border-radius:8px;">Open admin</a>
              </td>
              <td style="padding:0 6px 10px;width:33%;">
                <a href="tel:${esc(phoneDigits)}" style="display:block;text-align:center;background:#ffffff;color:${BRAND.primary};text-decoration:none;font-weight:700;font-size:14px;padding:11px 8px;border-radius:8px;border:2px solid ${BRAND.primary};">Call customer</a>
              </td>
              <td style="padding:0 0 10px 6px;width:33%;">
                <a href="https://wa.me/${esc(phoneDigits)}" style="display:block;text-align:center;background:${BRAND.whatsapp};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 8px;border-radius:8px;">WhatsApp</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- META FOOTER -->
      ${booking.source_path || booking.page_title ? `
      <tr>
        <td style="padding:18px 32px 22px;color:#94a3b8;font-size:12px;line-height:1.6;border-top:1px solid #eef0f4;">
          ${booking.page_title ? `<div style="color:#64748b;font-weight:600;">${esc(booking.page_title)}</div>` : ''}
          ${booking.source_path ? `<div>${esc(booking.source_path)}</div>` : ''}
        </td>
      </tr>` : ''}

      <!-- BRAND STRIP -->
      <tr>
        <td style="background:${BRAND.primaryDark};padding:18px 32px;text-align:center;">
          <div style="color:#ffffff;font-weight:700;font-size:14px;letter-spacing:0.3px;">${esc(BRAND.name)}</div>
          <a href="https://${BRAND.domain}" style="color:rgba(255,255,255,0.7);font-size:12px;text-decoration:none;">${esc(BRAND.domain)}</a>
        </td>
      </tr>

    </table>

  </td></tr>
</table>
</body>
</html>`;
}

function buildText(booking, { resend = false } = {}) {
    const eyebrow = resend ? 'BOOKING RESENT' : 'NEW BOOKING';
    const phoneDigits = digits(booking.phone);
    const formattedDate = new Date(booking.created_at || Date.now()).toLocaleString('en-GB');
    const lines = [
        eyebrow,
        '======================',
        '',
        `Service: ${booking.serviceType || '-'}`,
        `Date:    ${formattedDate}`,
        '',
        `Name:    ${booking.name}`,
        `Phone:   ${booking.phone}  (tel:${phoneDigits})`,
        booking.email ? `Email:   ${booking.email}` : null,
        '',
        `Pickup:  ${booking.pickupLocation}`,
        booking.dropoffLocation ? `Dropoff: ${booking.dropoffLocation}` : null,
        '',
        booking.registrationNumber ? `Reg:     ${booking.registrationNumber.toUpperCase()}` : null,
        (booking.vehicleMake || booking.vehicleModel)
            ? `Vehicle: ${[booking.vehicleMake, booking.vehicleModel].filter(Boolean).join(' ')}`
            : null,
        booking.message ? `Notes:   ${booking.message}` : null,
        '',
        `WhatsApp: https://wa.me/${phoneDigits}`,
        `Admin:    ${BRAND.adminUrl}`,
        '',
        `— ${BRAND.name} · ${BRAND.domain}`,
    ].filter(Boolean);
    return lines.join('\n');
}

export async function sendBookingEmail(booking, options = {}) {
    const to = process.env.BOOKING_EMAIL;
    const from = process.env.SMTP_FROM;
    const resend = !!options.resend;

    if (!to || !from) {
        console.error('[Email] Missing BOOKING_EMAIL or SMTP_FROM env vars');
        return { ok: false, error: 'Missing email config' };
    }

    const subjectPrefix = resend ? '[Resend] ' : '';
    const subject = `${subjectPrefix}${booking.serviceType || 'Booking'} — ${booking.name} (${booking.pickupLocation || 'no location'})`;

    try {
        await transporter.sendMail({
            from: `"${BRAND.name} Bookings" <${from}>`,
            to,
            subject,
            text: buildText(booking, { resend }),
            html: buildHtml(booking, { resend }),
        });
        console.log('[Email] Booking notification sent to', to);
        return { ok: true };
    } catch (error) {
        console.error('[Email] Failed to send booking notification:', error.message);
        return { ok: false, error: error.message };
    }
}
