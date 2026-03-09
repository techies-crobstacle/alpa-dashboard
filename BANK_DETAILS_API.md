# Bank Details — Integration Guide

> **Audience:** Frontend / Dashboard team  
> **Base URL:** All seller endpoints are prefixed with `/seller-onboarding`, admin endpoints with `/admin`  
> **Auth:** Every protected endpoint requires a Bearer token in the `Authorization` header

```
Authorization: Bearer <jwt_token>
```

---

## Table of Contents

1. [Overview & Flow](#1-overview--flow)
2. [Seller — Get Bank Details](#2-seller--get-bank-details)
3. [Seller — Request Bank Details Change](#3-seller--request-bank-details-change)
4. [Admin — List Bank Change Requests](#4-admin--list-bank-change-requests)
5. [Admin — Approve a Request](#5-admin--approve-a-request)
6. [Admin — Reject a Request](#6-admin--reject-a-request)
7. [Status & Error Reference](#7-status--error-reference)
8. [UI Implementation Notes](#8-ui-implementation-notes)

---

## 1. Overview & Flow

```
Seller views masked bank details on dashboard
        │
        ▼
Seller clicks "Request to Change Bank Details"
        │
        ▼
Seller fills form:
  • New Bank Name
  • New Account Name
  • New BSB
  • New Account Number
  • Current Account Password   ← verified server-side
  • Reason for change
        │
        ▼
POST /seller-onboarding/bank-details/change-request
        │
        ▼
Request created with status: PENDING
(only 1 pending request allowed at a time)
        │
        ▼
Admin reviews in dashboard
  ┌─────────────────────────────┐
  │  POST …/:id/approve         │  → updates live bank details atomically
  │  POST …/:id/reject          │  → stores rejection note, no change applied
  └─────────────────────────────┘
```

---

## 2. Seller — Get Bank Details

Fetch the authenticated seller's current bank details (masked for security) and any pending change request they have open.

### Request

```
GET /seller-onboarding/bank-details
Authorization: Bearer <seller_token>
```

### Success Response `200`

```json
{
  "success": true,
  "bankDetails": {
    "bankName": "Commonwealth Bank",
    "accountName": "John Smith",
    "bsb": "XXX-000",
    "accountNumber": "*****678"
  },
  "pendingChangeRequest": null
}
```

> **Note:** BSB first 3 digits are masked as `XXX`. Account number shows only the last 3 digits, rest are `*`.

#### When a pending change request exists

```json
{
  "success": true,
  "bankDetails": {
    "bankName": "Commonwealth Bank",
    "accountName": "John Smith",
    "bsb": "XXX-000",
    "accountNumber": "*****678"
  },
  "pendingChangeRequest": {
    "id": "clxyz123abc",
    "newBankDetails": {
      "bankName": "ANZ Bank",
      "accountName": "John Smith",
      "bsb": "013-000",
      "accountNumber": "87654321"
    },
    "reason": "Switched to a new bank account",
    "status": "PENDING",
    "createdAt": "2026-03-09T10:30:00.000Z"
  }
}
```

> When `pendingChangeRequest` is not `null`, show a banner/notice to the seller that a change request is under review. Disable the "Request Change" button.

#### When seller has no bank details on file

```json
{
  "success": true,
  "bankDetails": null,
  "pendingChangeRequest": null
}
```

### Error Responses

| Status | Reason |
|--------|--------|
| `401` | Token missing or expired |
| `404` | Seller profile not found |
| `500` | Server error |

---

## 3. Seller — Request Bank Details Change

Submit a request to update bank details. A current account password is required for security verification. Only **one pending request** is allowed at a time.

### Request

```
POST /seller-onboarding/bank-details/change-request
Authorization: Bearer <seller_token>
Content-Type: application/json
```

### Request Body

```json
{
  "bankName": "ANZ Bank",
  "accountName": "John Smith",
  "bsb": "013-000",
  "accountNumber": "87654321",
  "currentPassword": "seller_current_password",
  "reason": "I have switched to a new bank account for my business"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `bankName` | string | ✅ | Name of the bank |
| `accountName` | string | ✅ | Name on the account |
| `bsb` | string | ✅ | 6-digit BSB, with or without hyphen |
| `accountNumber` | string | ✅ | Bank account number |
| `currentPassword` | string | ✅ | Seller's current login password (verified server-side) |
| `reason` | string | ✅ | Min 10 characters |

### Success Response `201`

```json
{
  "success": true,
  "message": "Bank details change request submitted successfully. It will be reviewed by our team.",
  "requestId": "clxyz123abc"
}
```

### Error Responses

| Status | Body `message` | Reason |
|--------|---------------|--------|
| `400` | `"bankName, accountName, bsb, accountNumber, currentPassword and reason are all required"` | Missing field(s) |
| `400` | `"Please provide a more detailed reason (at least 10 characters)"` | Reason too short |
| `401` | `"Incorrect password"` | Wrong current password |
| `404` | `"User not found"` | Token refers to deleted user |
| `409` | `"You already have a pending bank details change request. Please wait for it to be reviewed."` | Duplicate pending request |
| `500` | `"Server error"` | Server error |

---

## 4. Admin — List Bank Change Requests

Retrieve all bank change requests with optional status filtering and pagination.

### Request

```
GET /admin/bank-change-requests
Authorization: Bearer <admin_token>
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | `PENDING` \| `APPROVED` \| `REJECTED` | _(all)_ | Filter by status |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |

**Examples:**
```
GET /admin/bank-change-requests?status=PENDING
GET /admin/bank-change-requests?status=APPROVED&page=2&limit=10
```

### Success Response `200`

```json
{
  "success": true,
  "requests": [
    {
      "id": "clxyz123abc",
      "sellerId": "clseller456",
      "newBankDetails": {
        "bankName": "ANZ Bank",
        "accountName": "John Smith",
        "bsb": "013-000",
        "accountNumber": "87654321"
      },
      "reason": "I have switched to a new bank account for my business",
      "status": "PENDING",
      "reviewedBy": null,
      "reviewNote": null,
      "createdAt": "2026-03-09T10:30:00.000Z",
      "updatedAt": "2026-03-09T10:30:00.000Z",
      "seller": {
        "userId": "clseller456",
        "storeName": "John's Art Studio",
        "businessName": "Smith Arts Pty Ltd",
        "bankDetails": {
          "bankName": "Commonwealth Bank",
          "accountName": "John Smith",
          "bsb": "062-000",
          "accountNumber": "12345678"
        },
        "user": {
          "email": "john@example.com",
          "name": "John Smith"
        }
      }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

> `seller.bankDetails` contains the **current live** bank details (unmasked). The `newBankDetails` field contains what the seller wants to change to. Display both side-by-side for admin to compare.

---

## 5. Admin — Approve a Request

Approves a pending bank change request. This **atomically** updates the seller's live bank details and marks the request as `APPROVED` in a single database transaction.

### Request

```
POST /admin/bank-change-requests/:id/approve
Authorization: Bearer <admin_token>
```

| Param | Description |
|-------|-------------|
| `:id` | The `id` of the bank change request |

### Request Body

None required.

### Success Response `200`

```json
{
  "success": true,
  "message": "Bank details change request approved and applied"
}
```

### Error Responses

| Status | Body `message` | Reason |
|--------|---------------|--------|
| `404` | `"Bank change request not found"` | Invalid ID |
| `409` | `"Request is already approved"` | Already actioned |
| `409` | `"Request is already rejected"` | Already actioned |
| `500` | `"Server error"` | Server error |

---

## 6. Admin — Reject a Request

Rejects a pending bank change request. The seller's live bank details are **not** modified.

### Request

```
POST /admin/bank-change-requests/:id/reject
Authorization: Bearer <admin_token>
Content-Type: application/json
```

| Param | Description |
|-------|-------------|
| `:id` | The `id` of the bank change request |

### Request Body

```json
{
  "reviewNote": "The provided BSB does not appear to be valid. Please resubmit with a correct BSB."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `reviewNote` | string | Optional | Reason for rejection shown to seller |

### Success Response `200`

```json
{
  "success": true,
  "message": "Bank details change request rejected"
}
```

### Error Responses

| Status | Body `message` | Reason |
|--------|---------------|--------|
| `404` | `"Bank change request not found"` | Invalid ID |
| `409` | `"Request is already approved"` | Already actioned |
| `409` | `"Request is already rejected"` | Already actioned |
| `500` | `"Server error"` | Server error |

---

## 7. Status & Error Reference

### `BankChangeStatus` Enum

| Value | Meaning |
|-------|---------|
| `PENDING` | Awaiting admin review |
| `APPROVED` | Approved — live bank details updated |
| `REJECTED` | Rejected — live bank details unchanged |

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `400` | Validation error — check `message` field |
| `401` | Unauthorized — invalid/missing token or wrong password |
| `404` | Record not found |
| `409` | Conflict — duplicate pending request or already actioned |
| `500` | Server error |

---

## 8. UI Implementation Notes

### Seller Dashboard — Bank Details Section

1. **On page load:** Call `GET /seller-onboarding/bank-details`
2. **Display masked details** in a read-only card:  
   - Bank Name, Account Name, BSB (`XXX-xxx`), Account Number (`*****123`)
3. **If `bankDetails` is `null`:** Show "No bank details on file" message
4. **If `pendingChangeRequest` is not `null`:**
   - Show a yellow info banner: _"A change request is currently under review"_
   - Display the requested new details in the banner for seller's reference
   - **Disable** the "Request Change" button
5. **If no pending request:** Show an active "Request to Change Bank Details" button

### Seller — Change Request Form

Required fields to collect:
- New Bank Name _(text input)_
- New Account Name _(text input)_
- New BSB _(text input, format hint: `XXX-XXX`)_
- New Account Number _(text input)_
- Reason for Change _(textarea, min 10 characters)_
- Current Password _(password input — do not store, send directly)_

On submit: `POST /seller-onboarding/bank-details/change-request`

Handle these specific error cases:
- `401 "Incorrect password"` → Show inline error on the password field
- `409` → Close form, refresh to show the existing pending request banner
- `400` → Show field-level or form-level validation error from `message`

### Admin Dashboard — Bank Change Requests

Suggested page layout:

1. **Tab/filter bar:** All | Pending | Approved | Rejected  
   → drives the `?status=` query param
2. **Request card / table row** showing:
   - Seller name, store name, email
   - Current bank details (from `seller.bankDetails`)
   - Requested new bank details (from `newBankDetails`)
   - Reason
   - Date submitted
   - Status badge
3. **Action buttons** (visible only when `status === "PENDING"`):
   - ✅ **Approve** → `POST /admin/bank-change-requests/:id/approve`
   - ❌ **Reject** → opens a small modal to enter an optional `reviewNote`, then `POST /admin/bank-change-requests/:id/reject`
4. After approve/reject, refresh the list

---

*Generated: March 9, 2026*
