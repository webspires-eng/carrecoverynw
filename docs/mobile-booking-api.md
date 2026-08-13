# Mobile API — bookings, vehicle and address lookups

Seven endpoints: read, create and update bookings, plus four read-only
proxies over DVLA and Google so their keys stay on the server.

Everything below reflects what the website actually stores. Where the original
brief's field names didn't exist on this site, this document gives you the real
name instead of inventing one — read the **Things that differ from the brief**
section, there are three that will affect your code.

---

## Base URL

```
https://www.cartowingnearme.co.uk/api/mobile
```

So the endpoints are:

| Method | URL | Needs |
| --- | --- | --- |
| `GET` | `/api/mobile/bookings` | read |
| `POST` | `/api/mobile/bookings` | write |
| `PATCH` | `/api/mobile/bookings/{id}` | write |
| `GET` | `/api/mobile/vehicle/{registration}` | read |
| `GET` | `/api/mobile/places/autocomplete` | read |
| `GET` | `/api/mobile/places/details` | read |
| `GET` | `/api/mobile/distance` | read |

All four lookups are read-only — a read-only key can call every one of them.
They never create or modify anything.

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

Both endpoints require it. Missing, wrong, and revoked keys all return `401`
with `{"message": "Missing API key."}` / `{"message": "Invalid API key."}`.

> **Test credential:** ask the site owner. Keys are issued from the admin
> dashboard (**Settings → Mobile API Keys**), one per app or device, and are
> shown only once at creation — they're stored hashed, so nobody can look an
> existing key up afterwards. If you lose it, ask for a new one; that's normal
> and cheap.

Two things that follow from keys being per-device and revocable:

- **A key can be revoked at any time**, and takes effect on the next request
  with no deploy. Treat a sudden `401` as "this key is dead" — surface it as
  *"This device is no longer authorised — contact the office"* rather than
  retrying in a loop.
- **Keys can be read-only.** A read-only key can `GET /bookings` but gets `403`
  on `POST`. If your build only reads, ask for a read-only key. Otherwise ask
  for read & write.

Keep the key out of source control and out of any client-side logging.

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
| `401` | Missing, invalid, or revoked API key. Don't retry — the key needs replacing. |
| `403` | The key is read-only and tried to create a booking. Don't retry. |
| `429` | Rate limit exceeded. Honour the `Retry-After` header (seconds) and back off. |
| `500` | Server-side failure. Message is generic; retry is reasonable. |
| `503` | The server couldn't verify the key (database trouble). Retry with backoff. |

There is **no `409`/slot-conflict response** — see the caveats.

### Rate limiting

Roughly **100 requests per minute per key**. Over that you get `429` with a
`Retry-After` header in seconds:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 43
```
```json
{ "message": "Too many requests. Please wait a moment and try again." }
```

Normal app use won't come close. You'll only hit it if you poll aggressively or
loop on an error — so back off on `429` rather than retrying immediately, and
don't refetch the whole list on a timer faster than once a minute.

---

## 3. `PATCH /bookings/{id}` — update a booking

`PATCH`, not `PUT` — this is a partial update.

```
PATCH /api/mobile/bookings/6710c3f2a1b4c98e7d2f0a11
```

### Request

**Send only what changed.** Anything absent is left exactly as it is.

```json
{
  "status": "confirmed",
  "dropoff_location": "Kwik Fit, Bolton BL1 4RQ",
  "total": 180.00
}
```

Every field from `POST /bookings` is editable, under any of the same spellings
(`snake_case`, `camelCase`, or the website's own names): `status`,
`customer_name`, `customer_phone`, `customer_email`, `service_name`,
`pickup_location`, `dropoff_location`, `registration_number`, `vehicle_make`,
`vehicle_model`, `notes`, `total`, `scheduled_at`.

**`null` clears, omitted leaves alone** — these are different:

```json
{ "dropoff_location": null }   // clears the dropoff address
{ }                            // changes nothing (returns 400)
```

An empty string is treated the same as `null`, since that's what a cleared text
box sends. A request with no recognised fields returns `400` rather than
silently doing nothing.

### Status mapping, in reverse

The four app statuses map back to `new` / `confirmed` / `completed` /
`cancelled` — **except** when the stored status is already a more specific form
of what you're sending, in which case it's left alone:

| Stored | You send | Result | Why |
| --- | --- | --- | --- |
| `dispatched` | `confirmed` | stays `dispatched` | a driver is already out; you're not un-dispatching them |
| `lost` | `cancelled` | stays `lost` | already cancelled, more specifically |
| `new` | `confirmed` | `confirmed` | a real transition |
| `dispatched` | `completed` | `completed` | a real transition |

`canceled`, `done` and `approved` are accepted as aliases. You can also send the
website's own values (`new`, `dispatched`, `lost`) directly if you ever want to
set them exactly — those are applied verbatim.

### Response — `200`

The **full updated booking**, identical in shape to a row from `GET /bookings`,
so you can write it straight into your local store:

```json
{
  "id": "6710c3f2a1b4c98e7d2f0a11",
  "service_name": "Car Recovery",
  "status": "confirmed",
  "website_status": "dispatched",
  "customer_name": "James Whitfield",
  "total": 180,
  "currency": "GBP",
  "updated_at": "2026-08-13T11:22:04.000Z"
}
```

(abbreviated — every field listed under `GET /bookings` is present)

### Conflicting edits — implemented

Someone in the office can be editing the same booking on the dashboard. This is
**opt-in**: send either an `If-Unmodified-Since` header or an `updated_at` field
in the body, carrying the `updated_at` you last saw.

```
If-Unmodified-Since: Thu, 13 Aug 2026 11:20:00 GMT
```
```json
{ "updated_at": "2026-08-13T11:20:00.000Z", "status": "confirmed" }
```

If the record changed after that moment you get `409`:

```json
{ "message": "Someone else updated this booking first. Reload it and try again." }
```

Reload the booking and let the user decide. **Send nothing and you get
last-write-wins**, which is a valid choice for a small team — but prefer the
`updated_at` form: it has millisecond precision, where the HTTP header format
only carries whole seconds and so is very slightly coarser.

The check is enforced at the write itself, not just read-then-write, so a change
landing in the gap is still caught.

### Errors

| Status | When |
| --- | --- |
| `400` | Unknown status, unparseable date, non-numeric or negative total, malformed JSON, or no recognised fields. |
| `401` | Missing, invalid or revoked key. |
| `403` | Read-only key. |
| `404` | No booking with that id (also returned for a malformed id). |
| `409` | Someone else updated it first — only when you send a precondition. |
| `429` | Rate limited. |

### No delete

There is no `DELETE`, deliberately, and we agree with your reasoning:
`status: "cancelled"` covers the real case and keeps the record. A mis-tap on a
phone is much easier than on a desktop, and a cancelled booking is recoverable
where a deleted one isn't. Ask if you genuinely need hard deletes.

---

## 4. `GET /vehicle/{registration}` — DVLA lookup

```
GET /api/mobile/vehicle/MA19XKR
```

The plate is normalised server-side — spaces and punctuation stripped,
uppercased — so `ma19 xkr`, `MA19XKR` and `MA19%20XKR` all resolve to the same
lookup. Send it however the user typed it.

### Response — `200`

```json
{
  "registration_number": "MA19XKR",
  "make": "VAUXHALL",
  "model": "ASTRA",
  "colour": "BLUE",
  "fuel_type": "PETROL",
  "year_of_manufacture": 2019,
  "engine_capacity": 1399,
  "wheelplan": "2 AXLE RIGID BODY",
  "tax_status": "Taxed",
  "tax_due_date": "2026-11-01",
  "mot_status": "Valid",
  "mot_expiry_date": "2026-09-14"
}
```

Every field except `registration_number` can be `null` — DVLA does not hold
everything for every vehicle. Render around missing values rather than assuming
presence.

**About `model`:** you were right that DVLA's Vehicle Enquiry Service doesn't
return it. This site already had a second source wired up — the DVSA MOT History
API — and the endpoint uses it to fill the gap when DVLA leaves `model` empty.
That enrichment only runs if the MOT credentials are configured on the server
(`MOT_TOKEN_URL`, `MOT_CLIENT_ID`, `MOT_CLIENT_SECRET`, `MOT_API_KEY`). **Ask the
site owner to confirm they're set** — if they aren't, everything else still works
and `model` simply comes back `null`. Never fail a booking over it.

### Errors

| Status | When |
| --- | --- |
| `400` | Empty or implausible registration (illegal characters, or not 2–8 alphanumerics). |
| `404` | `{"message": "No vehicle found for that registration."}` |
| `502` | DVLA failed, timed out, or isn't configured. Let staff type the details by hand. |

Results are **cached for 24 hours** per plate. Not longer, because `tax_status`
and `mot_status` genuinely change — but it does mean repeat lookups of a regular
customer's vehicle are free and instant.

---

## 5. `GET /places/autocomplete` — address suggestions

```
GET /api/mobile/places/autocomplete?q=M60%20junction&session=abc123
```

| Param | Required | Notes |
| --- | --- | --- |
| `q` | yes | Fewer than 3 characters returns `[]` without calling Google. |
| `session` | no | Passed straight through as Google's `sessiontoken`. |

Results are biased to the UK (`components=country:gb`).

### Response — `200`

```json
{
  "data": [
    {
      "place_id": "ChIJ...",
      "description": "M60 Junction 18, Manchester, UK",
      "main_text": "M60 Junction 18",
      "secondary_text": "Manchester, UK"
    }
  ]
}
```

`secondary_text` can be `null` on some results; `main_text` falls back to the
full description if Google omits the structured form.

**Please do send `session`.** Generate one token per address-entry session
(a UUID is fine), send it on every keystroke request, then send the *same* token
to `/places/details` when the user taps a result. That's what makes a series of
keystrokes bill as one lookup instead of eight.

Errors: `502` if Google is unreachable. An empty result set is a normal `200`
with `"data": []`, not an error.

---

## 6. `GET /places/details` — resolve a suggestion

```
GET /api/mobile/places/details?place_id=ChIJ...&session=abc123
```

### Response — `200`

```json
{
  "place_id": "ChIJ...",
  "address": "M60 Junction 18, Manchester M27 8UP, UK",
  "lat": 53.5123,
  "lng": -2.3456,
  "postcode": "M27 8UP"
}
```

`postcode` is `null` when Google doesn't return one (common for road junctions
and other non-addressable points). `lat`/`lng` are what let you show the job on a
map and hand off to directions.

| Status | When |
| --- | --- |
| `400` | No `place_id`. |
| `404` | Google doesn't recognise that `place_id` — it may have expired. Search again. |
| `502` | Google unreachable. |

**Call this exactly once per suggestion tapped**, with the same `session` token
you used for autocomplete. This response is deliberately not cached: the details
call is what closes a Google billing session, so short-circuiting it would make
Google bill every keystroke separately — caching here would cost *more*, not
less.

---

## 7. `GET /distance` — distance and drive time

```
GET /api/mobile/distance?from_lat=53.5123&from_lng=-2.3456&to_lat=53.5769&to_lng=-2.4282
```

Free-text addresses also work, though coordinates are preferred since you
already have them from `/places/details`:

```
GET /api/mobile/distance?from=Manchester&to=Bolton
```

Send either all four coordinates or both text fields — a partial set of
coordinates is a `400`, so you can't accidentally route from half a point.

### Response — `200`

```json
{
  "distance_metres": 18234,
  "distance_text": "18.2 miles",
  "duration_seconds": 1500,
  "duration_text": "25 mins"
}
```

Imperial units, since this is a UK road business. `distance_text` is Google's
own formatting with `mi` spelled out to `miles` (and `mile` at exactly 1);
very short distances come back in feet.

| Status | When |
| --- | --- |
| `400` | Missing or invalid coordinates, or a partial coordinate set. |
| `404` | `{"message": "No driving route found between those two places."}` |
| `502` | Google unreachable. |

Cached for an hour, keyed on the coordinate pair rounded to ~11 m, so repeated
quoting of the same job doesn't re-bill.

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

For whoever runs the website:

1. Sign in to the admin dashboard → **Settings** → **Mobile API Keys**.
2. **Generate key**, label it after the device or app it's for
   ("Atif's iPhone"), and tick **Read-only** if that client should not be able
   to create bookings.
3. Copy the key from the one-time reveal and send it to the app developer over
   something private. It cannot be retrieved later — if it's lost, revoke and
   generate another.
4. Verify with the `curl` above.

No deploy is needed to issue or revoke a key, and revoking takes effect on the
next request. The **Last used** column shows which keys are still in play, so
anything reading "Never" long after it was issued can be revoked safely.

### Upstream keys the lookups need

These already exist on the server for the website's own features; the lookup
endpoints reuse them. Nothing is exposed to the app.

| Variable | Powers | If missing |
| --- | --- | --- |
| `DVLA_API_KEY` | `/vehicle/{reg}` | `502`, staff type details manually |
| `GOOGLE_MAPS_API_KEY` | `/places/*`, `/distance` | `502`, staff type addresses manually |
| `MOT_TOKEN_URL`, `MOT_CLIENT_ID`, `MOT_CLIENT_SECRET`, `MOT_API_KEY` | the `model` field only | `model` is `null`, everything else works |

The MOT set is the one worth checking — it's optional, free to register for at
<https://documentation.history.mot.api.gov.uk/>, and it's the only reason
`model` is ever populated.

### Files

`src/app/api/mobile/` holds the six endpoints. Supporting libraries:
`mobileApi.js` (shared auth, CORS and error shape), `apiAuth.js` (key check),
`apiKeys.js` (storage — SHA-256 hashes, never plaintext), `rateLimit.js`
(throttling), `vehicleLookup.js` (DVLA + MOT), `googleMaps.js` (Places and
Distance Matrix), `lookupCache.js` (the Mongo-backed TTL cache), and
`src/components/admin/ApiKeysCard.jsx` (the dashboard UI).

Bookings read and write the same `bookings` collection as the website form and
the admin dashboard — a translation layer, not a separate store. The lookups
store nothing except cached upstream responses.
