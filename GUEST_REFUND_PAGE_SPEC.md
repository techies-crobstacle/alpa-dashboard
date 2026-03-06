# Guest Refund Portal — Frontend Implementation Spec

**For:** WebApp Dev Team  
**Date:** March 3, 2026  
**Route:** `/guest/refund`  
**Access:** Public — no authentication required

---

## Overview

Guests who placed orders without an account have no access to the authenticated dashboard. This page gives them a dedicated public portal to:

1. Submit a refund or partial-refund request for their order
2. Track the status of any existing requests

The page is a **two-tab layout**:

| Tab | Purpose |
|---|---|
| Submit Request | Form to raise a new refund request |
| Track Requests | Search for existing requests by Order ID + Email |

---

## Route & Layout Requirements

- **URL**: `/guest/refund`
- **Auth guard**: None — this page must be outside any authentication middleware or layout that redirects to login
- **Layout**: Minimal — no sidebar, no topbar, no session check
- **Footer element**: A small link at the bottom — `"Have an account? Log in"` → `/login`

---

## Tab 1 — Submit Request

### Purpose
Allow a guest to submit a refund or partial-refund request for a delivered order.

### Form Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Order ID | Text input | Yes | The order's unique ID |
| Email Address | Email input | Yes | Must match the email used at checkout |
| Request Type | Dropdown/Select | Yes | Options: `Full Refund` (value: `refund`), `Partial Refund` (value: `partial_refund`) |
| Reason | Textarea | Yes | Minimum description of why the refund is needed |

### Submit Behaviour

**On submit**, call:

```
POST /api/orders/guest/refund-request
```

**Request body:**
```json
{
  "orderId": "order_cuid_here",
  "customerEmail": "guest@example.com",
  "requestType": "refund",
  "reason": "Item was damaged on arrival"
}
```

**On success (2xx):**
- Clear the form
- Show a **green success banner** containing:
  - A confirmation message, e.g. `"Your request has been submitted."`
  - The returned **Ticket ID** (from response body)
  - A **"Track It →"** button that:
    - Switches the active tab to **Track Requests**
    - Pre-fills the Order ID field in that tab with the value entered in the form

**On error:**
- Display the backend's `message` field in a toast/alert
- Common errors to handle:
  - `404` — Order not found
  - `400` — Email does not match / order is not eligible / reason missing
  - `409` — Request already exists for this order

---

## Tab 2 — Track Requests

### Purpose
Allow a guest to look up all refund requests associated with their order.

### Search Fields

| Field | Type | Required |
|---|---|---|
| Order ID | Text input | Yes |
| Email Address | Email input | Yes |

### Search Behaviour

**On search**, call:

```
GET /api/orders/guest/refund-requests?orderId=ORDER_ID&customerEmail=EMAIL
```

**On success:**
- Render a list of request cards (see Card Structure below)
- If no results, show a friendly empty state: `"No refund requests found for this order."`

**On error:**
- Show backend `message` in a toast/alert

---

### Request Card Structure

Each result card should show:

| Field | Display Label |
|---|---|
| `id` | Ticket ID |
| `requestType` | Type — `"Full Refund"` or `"Partial Refund"` |
| `status` | Current Status (styled badge) |
| `createdAt` | Submitted On (formatted date, e.g. `Mar 3, 2026`) |
| `reason` | Reason |

Each card should be **expandable**. When expanded, fetch the full detail:

```
GET /api/orders/guest/refund-requests/:requestId?orderId=ORDER_ID&customerEmail=EMAIL
```

**Expanded view shows additionally:**

| Field | Display Label |
|---|---|
| `adminResponse` | Admin Response (or `"Awaiting review"` if null) |
| `updatedAt` | Last Updated |
| Progress bar | Visual status stepper (see below) |

---

### Ticket Status Progress Bar

Show a horizontal stepper with 4 stages in order:

```
OPEN  →  IN_PROGRESS  →  RESOLVED  →  CLOSED
```

- Highlight completed stages (filled/colored)
- Highlight the current active stage
- Dim future stages

Status badge colour suggestions:

| Status | Colour |
|---|---|
| `OPEN` | Blue |
| `IN_PROGRESS` | Yellow / Amber |
| `RESOLVED` | Green |
| `CLOSED` | Grey |

---

## API Reference Summary

All three endpoints are **public** (no JWT required). Ownership is verified server-side by matching `orderId + customerEmail`.

### 1. Create Guest Refund Request

```
POST /api/orders/guest/refund-request
```

Body:
```json
{
  "orderId": "string",
  "customerEmail": "string",
  "requestType": "refund | partial_refund",
  "reason": "string"
}
```

Success response (201):
```json
{
  "message": "Refund request submitted successfully",
  "requestId": "ticket_cuid_here"
}
```

---

### 2. List All Guest Refund Requests

```
GET /api/orders/guest/refund-requests?orderId=ORDER_ID&customerEmail=EMAIL
```

Success response (200):
```json
[
  {
    "id": "ticket_cuid",
    "orderId": "order_cuid",
    "requestType": "refund",
    "reason": "Item damaged",
    "status": "OPEN",
    "priority": "MEDIUM",
    "adminResponse": null,
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z",
    "guestEmail": "guest@example.com"
  }
]
```

---

### 3. Get Single Guest Refund Request

```
GET /api/orders/guest/refund-requests/:requestId?orderId=ORDER_ID&customerEmail=EMAIL
```

Success response (200): same shape as a single item above.

---

## Common Error Cases

Always render the backend `message` field in a toast or inline alert.

| Code | Meaning |
|---|---|
| `400` | Invalid input / email mismatch / order not eligible |
| `404` | Order or ticket not found |
| `409` | Duplicate request for this order |
| `429` | Rate limit hit (5 req/min per IP) |

---

## UX Notes

- **Date formatting**: Display all ISO date strings in a human-readable format, e.g. `"Mar 3, 2026"`. Do not show raw ISO strings like `2026-03-03T00:00:00.000Z`.
- **Loading states**: Show a skeleton or spinner while API calls are in-flight.
- **Tab pre-fill from Submit**: When a user clicks `"Track It →"` after a successful submission, switch to Track tab and auto-populate the Order ID field so they don't have to re-enter it.
- **Mobile responsive**: The page should be usable on mobile (guest users often track on phone).
- **No auth redirects**: Make absolutely sure this route does not redirect to `/login` under any scenario.

---

## Security Notes (for your Backend team reference)

- Backend must verify `customerEmail === order.customerEmail` before creating or returning any ticket
- Rate-limit: 5 requests/minute per IP to prevent order enumeration
- `SupportTicket.userId` is nullable (already migrated via `20260303010000_support_ticket_guest_refund_tracking`)
- Guest orders are identified by `order.userId === null`
