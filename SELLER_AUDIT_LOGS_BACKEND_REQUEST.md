# Backend Request — Seller Audit Logs Access

> **Requested by:** Frontend / Dashboard Team  
> **Priority:** Medium  
> **Context:** The admin audit log endpoint (`/api/admin/audit-logs/products/:productId`) is already live and working. Sellers currently receive a `403` when their product detail page tries to fetch audit history. This request extends the **existing endpoint** to also accept Seller tokens — no new route needed.

---

## The Problem

The existing audit history component calls:

```
GET /api/admin/audit-logs/products/:productId
```

This route is gated to **Admin only**. When a Seller JWT is used, the backend returns `403`, and the dashboard shows:

> *"Audit history is visible to Admins only."*

Sellers should be able to view the audit history of **their own products**.

---

## Recommended Approach — Extend the Existing Endpoint (No New Route)

> ✅ This is simpler than creating a separate seller endpoint and requires **zero frontend changes**.

### Update:

```
GET /api/admin/audit-logs/products/:productId
```

Change the auth middleware on this route from:

```
Allow: ADMIN only
```

To:

```
Allow: ADMIN or SELLER
```

Then add the following ownership check **only when the caller is a Seller**:

---

## Security Rule (Critical — Sellers Only)

When the authenticated user's role is `SELLER`, before returning any logs, verify:

```
product.sellerId === authenticatedUser.id
  OR
product.userId === authenticatedUser.id
```

If the product does **not** belong to the requesting seller → respond with `403`:

```json
{
  "success": false,
  "message": "You do not have permission to view audit logs for this product."
}
```

This prevents Seller A from reading Seller B's audit history by guessing a product ID.

> **Admins are not subject to this ownership check** — they can view logs for any product, as today.

---

## Path Parameters

| Parameter   | Type   | Required | Description        |
|-------------|--------|----------|--------------------|
| `productId` | string | Yes      | The product's `id` |

---

## Query Parameters

| Parameter | Type   | Required | Default | Description             |
|-----------|--------|----------|---------|-------------------------|
| `page`    | number | No       | `1`     | Page number             |
| `limit`   | number | No       | `20`    | Results per page        |

---

## Response Shape — No Change Required

The response shape stays **exactly the same** as today. No frontend changes needed.

### Success `200`

```json
{
  "success": true,
  "productId": "cm7product456",
  "data": [
    {
      "id": "cm7abc123",
      "entityType": "PRODUCT",
      "entityId": "cm7product456",
      "action": "PRODUCT_APPROVED",
      "actorId": "cm7admin789",
      "actorEmail": "admin@alpa.com.au",
      "actorRole": "ADMIN",
      "actorIp": "203.0.113.5",
      "previousData": { ... },
      "newData": { ... },
      "changedFields": ["status", "isActive"],
      "reason": null,
      "userAgent": "Mozilla/5.0 ...",
      "requestId": null,
      "createdAt": "2026-03-06T10:45:00.000Z"
    }
  ],
  "meta": {
    "total": 7,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### Error Responses

| HTTP Code | Scenario                                              |
|-----------|-------------------------------------------------------|
| `401`     | Missing or invalid Bearer token                       |
| `403`     | Authenticated but product belongs to a different seller |
| `404`     | Product not found                                     |
| `500`     | Server error                                          |

```json
{
  "success": false,
  "message": "Description of the error"
}
```

---

## Optional — Strip Sensitive Fields for Sellers

The following fields are not displayed in the seller-facing UI. You may choose to strip them from the seller response to limit data exposure:

| Field       | Reason to strip                          |
|-------------|------------------------------------------|
| `actorIp`   | Internal admin IP — not relevant to seller |
| `userAgent` | Internal request metadata                |
| `requestId` | Internal correlation ID                  |

> These are optional omissions. Leaving them in will not break anything on the frontend.

---

## Frontend Impact After This Is Live

**None.** The frontend component already calls `/api/admin/audit-logs/products/:productId` and will continue to do so unchanged. Once the backend accepts Seller tokens on that same route, it will just work.

---

## Example Request (Seller)

```http
GET /api/admin/audit-logs/products/cm7product456?page=1&limit=20
Authorization: Bearer <seller_token>
```

---

## Checklist for Backend Dev

- [ ] Update auth middleware on `GET /api/admin/audit-logs/products/:productId` to allow `SELLER` role in addition to `ADMIN`
- [ ] When caller role is `SELLER`: verify `product.sellerId === req.user.id` (or `product.userId === req.user.id`)
- [ ] Return `403` if seller ownership check fails
- [ ] Admins bypass the ownership check entirely (no change to existing admin behaviour)
- [ ] Response shape remains unchanged
- [ ] (Optional) Strip `actorIp`, `userAgent`, `requestId` from the response when caller is a Seller
