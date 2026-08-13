# Booking API — for the mobile app

Two endpoints, as requested: list bookings and create a booking.

Everything below reflects what the website actually stores. Where the original
brief's field names didn't exist on this site, this document gives you the real
name instead of inventing one — read the **Things that differ from the brief**
section, there are three that will affect your code.

---

## Base URL

```
https://www.cartowingnearme.co.uk/api/mobile
```

So the two endpoints are:

| Method | URL |
| --- | --- |
| `GET` | `https://www.cartowingnearme.co.uk/api/mobile/bookings` |
| `POST` | `https://www.cartowingnearme.co.uk/api/mobile/bookings` |

HTTPS only. JSON in, JSON out. Send `Content-Type: application/json` on POST.

## Authentication

An API key in a header. Either of these works — use whichever your HTTP client
makes easiest:

```
X-API-Key: <key>
```
```
Authorization: Bearer <key>
```

Both endpoints require it. Missing or wrong key returns `401` with
`{"message": "Missing API key."}` / `{"message": "Invalid API key."}`.

> **Test credential:** ask the site owner for the key — it is set as the
> `MOBILE_API_KEY` environment variable on the server and is deliberately not
> committed to the repo. It is a single shared secret, so treat it as a secret:
> keep it out of source control and out of client-side logs.

---

## 1. `GET /bookings` — list bookings

Returns bookings newest first (by creation time).

Optional query parameter:

| Param | Default | Max | Meaning |
| --- | --- | --- | --- |
| `limit` | `100` | `500` | How many bookings to return |

There is **no paging** — no cursor, no `page` param, no `next` link. This
business has a few thousand bookings at most, so `limit` alone covers it. If you
need older records than the default window, raise `limit`.

### Response — `200`

The list is wrapped in `data`:

```json
{
  "data": [
    {
      "id": "6710c3f2a1b4c98e7d2f0a11",
      "service_name": "Car Recovery",
      "scheduled_at": "2026-08-12T14:32:07.000Z",
      "status": "pending",
      "website_status": "new",
      "customer_name": "James Whitfield",
      "customer_email": "j.whitfield@example.co.uk",
      "customer_phone": "07700 900142",
      "total": null,
      "currency": "GBP",
      "notes": "Front wheel locked up, car is on the hard shoulder.",
      "pickup_location": "M60 Junction 18, Manchester",
      "dropoff_location": "Kwik Fit, Bolton BL1 4RQ",
      "registration_number": "MA19 XKR",
      "vehicle_make": "Vauxhall",
      "vehicle_model": "Astra",
      "source": "website",
      "created_at": "2026-08-12T14:32:07.000Z",
      "updated_at": "2026-08-12T14:32:07.000Z"
    }
  ],
  "count": 1,
  "limit": 100
}
```

> **Note:** the JSON above is built from the live schema, field for field, but it
> is **not** copied out of a production response — the values are illustrative
> and the customer details are made up. To capture a real one, see
> [Getting a real response](#getting-a-real-response) at the end.

### Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | MongoDB ObjectId as a string. Stable and never reused — safe as your dedupe key. |
| `service_name` | string \| null | The service the customer picked, e.g. `Car Recovery`, `Jump Start`, `Breakdown Recovery`. Free text from the site's service list, not a fixed enum. |
| `scheduled_at` | string | ISO 8601, always UTC (`Z`). **Read the caveat below — this is not an appointment time for most bookings.** |
| `status` | string | One of `pending`, `confirmed`, `completed`, `cancelled`. Mapped for you — see the status table. |
| `website_status` | string | The site's real internal status, unmapped. Included so nothing is hidden from you; ignore it if you don't need it. |
| `customer_name` | string \| null | |
| `customer_email` | string \| null | Often null — the website's booking form does not require an email. |
| `customer_phone` | string \| null | UK format as typed by the customer, e.g. `07700 900142`. Not normalised to E.164. |
| `total` | number \| null | A number, never a formatted string. **Usually `null`** — see caveat. |
| `currency` | string | Always `"GBP"`. UK-only business. |
| `notes` | string \| null | The customer's free-text message. |
| `pickup_location` | string \| null | Where the vehicle is. The most important field on a recovery job. |
| `dropoff_location` | string \| null | Where it's going. |
| `registration_number` | string \| null | UK number plate. |
| `vehicle_make` | string \| null | |
| `vehicle_model` | string \| null | |
| `source` | string | `website` (site form), `manual` (typed in by an admin), or `mobile-app` (created by you). |
| `created_at` | string | ISO 8601 UTC. When the booking was placed. |
| `updated_at` | string | ISO 8601 UTC. |

Any field marked `| null` can be null — the website's own form only requires
name, phone, pickup location and service, so the rest are frequently empty.
Don't assume presence.

### Status mapping

The website tracks a longer job lifecycle than the four statuses you support, so
it's collapsed for you in `status`. The raw value is in `website_status`:

| `website_status` | `status` you receive |
| --- | --- |
| `new` | `pending` |
| `confirmed` | `confirmed` |
| `dispatched` | `confirmed` |
| `completed` | `completed` |
| `cancelled` | `cancelled` |
| `lost` | `cancelled` |

`dispatched` means the job was accepted and a driver is on the way. There's no
"in progress" in your set, so it reads as `confirmed`. `lost` is an enquiry that
never converted, which reads as `cancelled`.

---

## 2. `POST /bookings` — create a booking

### Request

Field names are flexible — `snake_case`, `camelCase`, and the website's own
names are all accepted for every field. Send whichever you already have.

```json
{
  "customer_name": "James Whitfield",
  "customer_phone": "07700 900142",
  "customer_email": "j.whitfield@example.co.uk",
  "service_name": "Car Recovery",
  "pickup_location": "M60 Junction 18, Manchester",
  "dropoff_location": "Kwik Fit, Bolton BL1 4RQ",
  "registration_number": "MA19 XKR",
  "vehicle_make": "Vauxhall",
  "vehicle_model": "Astra",
  "notes": "Front wheel locked up, car is on the hard shoulder.",
  "scheduled_at": "2026-09-14T14:00:00Z",
  "total": 180.00
}
```

**Required — the request fails without all four:**

- `customer_name` (or `name`)
- `customer_phone` (or `phone`)
- `pickup_location` (or `pickupLocation`) ← **this one is not in your original brief**
- `service_name` (or `serviceName` / `serviceType`)

Everything else is optional. `total` must be a bare number if you send it
(`180.00`, not `"£180.00"`); it's normally left out, since the office prices the
job afterwards.

### Response — `201`

The created booking, in exactly the same shape as the list, including its `id`:

```json
{
  "id": "6710c3f2a1b4c98e7d2f0a12",
  "service_name": "Car Recovery",
  "scheduled_at": "2026-09-14T14:00:00.000Z",
  "status": "pending",
  "website_status": "new",
  "customer_name": "James Whitfield",
  "customer_email": "j.whitfield@example.co.uk",
  "customer_phone": "07700 900142",
  "total": 180,
  "currency": "GBP",
  "notes": "Front wheel locked up, car is on the hard shoulder.",
  "pickup_location": "M60 Junction 18, Manchester",
  "dropoff_location": "Kwik Fit, Bolton BL1 4RQ",
  "registration_number": "MA19 XKR",
  "vehicle_make": "Vauxhall",
  "vehicle_model": "Astra",
  "source": "mobile-app",
  "created_at": "2026-08-13T09:41:22.000Z",
  "updated_at": "2026-08-13T09:41:22.000Z"
}
```

New bookings always start at `status: "pending"` (`website_status: "new"`) and
are tagged `source: "mobile-app"` so the office can tell where they came from.

Creating a booking also fires the same email notification to the office that the
website form does, so app bookings get actioned the same way.

### Errors

Always this shape, with a message written for a human — safe to show as-is:

```json
{ "message": "Please provide the customer name, pickup location." }
```

| Status | When |
| --- | --- |
| `400` | Missing a required field, unparseable `scheduled_at`, negative/non-numeric `total`, or malformed JSON. |
| `401` | Missing or invalid API key. |
| `500` | Server-side failure. Message is generic; retry is reasonable. |
| `503` | The server is missing its API key configuration. Not retryable — tell the site owner. |

There is **no `409`/slot-conflict response** — see the caveats.

---

## Things that differ from the brief

Three that will affect your implementation.

### 1. `scheduled_at` is not an appointment time for existing bookings

This is an **emergency vehicle recovery** business, not an appointment-based
service. Customers report a broken-down vehicle and want it collected now.
The website has no calendar, no time slots, and no availability model — so
bookings placed through the website carry no scheduled time at all.

How the field behaves:

- Bookings **you create** with a `scheduled_at` store and return that value.
- Every other booking returns its `created_at` as `scheduled_at`.

The field is therefore always present and always a valid ISO 8601 timestamp, so
it's safe to parse unconditionally — but for website bookings it means "when
this was reported", not "when it's booked in". If you display it as an
appointment time, it will read as the past for essentially every existing
booking. Consider labelling it "Reported" when `source` is `website`, or sorting
on `created_at` instead.

Related: because there are no slots, **nothing can be double-booked**, so `POST`
never rejects with "that time slot is already booked". Don't build a UI branch
for it.

Also note the office's admin dashboard does not currently display
`scheduled_at`, so a time you send won't be visible to staff yet. Put anything
time-critical in `notes` too until that's added.

### 2. `pickup_location` is required on create

Not in your brief, but a recovery job without a location is not actionable — the
office cannot dispatch a truck to it. It's required by the website's own form
and it's required here. Make it a field in your booking flow.

`dropoff_location` is optional; plenty of customers don't know yet.

### 3. `total` is usually `null`

Pricing depends on distance, vehicle and time of day, so the office sets the
price after seeing the job. Expect `null` on most records and don't render
`£0.00`. You can send a `total` on create if your app quotes a price, and it
will be stored.

### Smaller notes

- `customer_email` is frequently `null` — the website form doesn't require it.
  Don't rely on email as an identifier.
- `customer_phone` is raw UK input (`07700 900142`, `+44 7700 900142`,
  `07700900142` all occur). Normalise on your side if you need to dial or match.
- `service_name` is free text from the site's editable service list, not a fixed
  enum. Don't switch on exact strings.

---

## Getting a real response

The maintainer should run this against production and paste the output back to
you, so you can map against genuine records rather than the illustrative sample
above:

```bash
curl -s -H "X-API-Key: $MOBILE_API_KEY" \
  "https://www.cartowingnearme.co.uk/api/mobile/bookings?limit=3" | jq
```

Create one:

```bash
curl -s -X POST \
  -H "X-API-Key: $MOBILE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "customer_phone": "07700 900000",
    "service_name": "Car Recovery",
    "pickup_location": "M60 Junction 18, Manchester",
    "notes": "Test booking - please ignore"
  }' \
  "https://www.cartowingnearme.co.uk/api/mobile/bookings" | jq
```

Note that a test POST creates a **real booking** and emails the office. Tell them
first, and delete it from the admin dashboard afterwards.

---

## Server-side setup checklist

For whoever deploys this:

1. Generate a key: `openssl rand -hex 32`
2. Add it as `MOBILE_API_KEY` in the Vercel project's environment variables
   (Production, and Preview if the app tests against previews).
3. Redeploy — env vars are read at runtime, but the deploy picks up the new var.
4. Verify with the `curl` above. Until the var is set, both endpoints return
   `503`; the API never falls open when the key is missing.

Implementation lives in `src/app/api/mobile/bookings/route.js`, with the key
check in `src/lib/apiAuth.js`. It reads and writes the same `bookings`
collection as the website form and the admin dashboard — it is a translation
layer, not a separate store.
