# Customer Subscription Endpoints

Customer subscription endpoints are defined in `src/subscription/subscription.controller.ts`.

- **Base path:** `/users/:userId/subscriptions`
- **Authentication:** All routes require `Authorization: Bearer <jwt>` and are protected by `JwtAuthGuard`.
- **Ownership:** The `:userId` path parameter must match the customer ID in the JWT.

---

## Data Models

### Subscription

```json
{
  "subscription_id": 12,
  "customer_id": 63,
  "meal_id": 4,
  "subscribe_date": "2026-09-18T10:00:00.000Z",
  "canceled_date": null,
  "delivery_preferred_date": "2026-09-20T10:00:00.000Z",
  "next_delivery_date": "2026-09-27T10:00:00.000Z",
  "meal_plan": {},
  "customer_order": []
}
```

Each subscription contains one meal plan and can have multiple linked customer orders. A customer may have multiple subscriptions.

### Create Subscription Request

```json
{
  "meal_id": 4,
  "delivery_preferred_date": "2026-09-20T10:00:00.000Z"
}
```

The customer ID is taken from the URL and JWT. It must not be supplied in the request body.

---

## Table of Contents

- [1. Create a subscription](#1-create-a-subscription)
- [2. List subscriptions](#2-list-subscriptions)
- [3. Get a subscription](#3-get-a-subscription)
- [4. Update preferred delivery date](#4-update-preferred-delivery-date)
- [5. Cancel a subscription](#5-cancel-a-subscription)
- [6. Subscription delivery behavior](#6-subscription-delivery-behavior)

---

## Endpoints

### 1. Create a subscription

**Endpoint:** `POST /users/:userId/subscriptions`

Creates one subscription for an available meal plan. The first subscribed order is created in the same database transaction.

**Path Parameters:**

- `userId` (number): The authenticated customer's ID.

**Body Parameters:**

- `meal_id` (number, required): Available meal plan ID.
- `delivery_preferred_date` (string, required): Preferred delivery date in ISO 8601 format.

**Request Body:**

```json
{
  "meal_id": 4,
  "delivery_preferred_date": "2026-09-20T10:00:00.000Z"
}
```

The initial order is created with:

- `order_status`: `pending`
- `payment_status`: `unpaid`
- `delivery_status`: `not_dispatched`
- `is_a_subscribed_meal`: `true`
- `delivery_preferred_date`: The requested preferred date

**Response:** Returns the created subscription with its meal plan and initial linked order.

---

### 2. List subscriptions

**Endpoint:** `GET /users/:userId/subscriptions`

Returns all subscriptions belonging to the authenticated customer, including the meal plan and linked orders. Results are ordered by newest subscription first.

**Response:**

```json
[
  {
    "subscription_id": 12,
    "customer_id": 63,
    "meal_id": 4,
    "subscribe_date": "2026-09-18T10:00:00.000Z",
    "canceled_date": null,
    "delivery_preferred_date": "2026-09-20T10:00:00.000Z",
    "next_delivery_date": "2026-09-27T10:00:00.000Z",
    "meal_plan": {},
    "customer_order": []
  }
]
```

---

### 3. Get a subscription

**Endpoint:** `GET /users/:userId/subscriptions/:subscriptionId`

Returns one subscription only when it belongs to the authenticated customer. The response includes the meal plan and all linked orders.

**Path Parameters:**

- `userId` (number): The authenticated customer's ID.
- `subscriptionId` (number): The subscription ID.

---

### 4. Update preferred delivery date

**Endpoint:** `PATCH /users/:userId/subscriptions/:subscriptionId/pref-delivery-date`

Updates the subscription's preferred delivery date and resets its next delivery date to seven days after the new preferred date.

Existing orders are not changed by this endpoint.

**Request Body:**

```json
{
  "delivery_preferred_date": "2026-09-22T10:00:00.000Z"
}
```

Canceled subscriptions cannot update their preferred delivery date.

---

### 5. Cancel a subscription

**Endpoint:** `PATCH /users/:userId/subscriptions/:subscriptionId/cancel`

Cancels a subscription by setting `canceled_date`.

Cancellation does not delete or modify any existing customer orders. The recurring worker ignores the subscription after cancellation, so no later orders are created.

**Request Body:** None.

Calling the cancellation endpoint again is safe and leaves the original cancellation date unchanged.

---

## Subscription delivery behavior

- Each subscription represents one meal plan delivered as a seven-day package.
- The first order is created immediately when the subscription is created.
- `next_delivery_date` is initially set to seven days after the first preferred delivery date.
- The recurring worker runs when the application starts and then every 24 hours.
- When `next_delivery_date` is due, one linked subscribed order is created and the date advances by seven days.
- Only subscriptions with `canceled_date = null` are processed.
- The worker uses an atomic database claim to avoid duplicate orders during concurrent runs.
- Existing subscriptions with no `next_delivery_date` are initialized from their latest linked order or preferred delivery date.

---

## Common Errors

- `400 Bad Request`: Invalid customer ID, subscription ID, date, or an attempt to update a canceled subscription.
- `401 Unauthorized`: Missing, invalid, expired, or invalidated JWT.
- `403 Forbidden`: The URL `userId` does not match the authenticated customer.
- `404 Not Found`: Subscription or available meal plan not found.
- `409 Conflict`: Subscription creation conflicts with existing database data.
- `500 Internal Server Error`: Unexpected server or database failure.
