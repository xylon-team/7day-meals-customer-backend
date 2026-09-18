# Customer Notification Endpoints

Customer notification endpoints are defined in `src/notification/notification.controller.ts`.

- **Base path:** `/users/:userId/notifications`
- **Authentication:** None.

---

## Legend

Parameters are labeled by location:

- **Path** — URL path segment (`:id`)
- **Body** — JSON request body

---

## Data Models

### Notification

```json
{
  "notif_id": "number",
  "customer_id": "number",
  "title": "string",
  "message": "string",
  "type": "string",
  "created_at": "string (ISO 8601 datetime)",
  "read_at": "string (ISO 8601 datetime) | null"
}
```

---

## Table of Contents

- [1. List customer notifications](#1-list-customer-notifications)
- [1. Store a customer notification](#1-store-a-customer-notification)
- [2. List customer notifications](#2-list-customer-notifications)
- [3. Update a notification read status](#3-update-a-notification-read-status)

---

## Endpoints

### 1. Store a customer notification

**Endpoint:** `POST /users/:userId/notifications`

**Description:** Stores a new notification for the specified customer. New notifications are unread (`read_at` is `null`).

**Path Parameters:**

- `userId` (number): The customer's ID.

**Body Parameters (JSON):**

- `title` (string, required): Notification title, up to 200 characters.
- `message` (string, required): Notification message.
- `type` (string, required): Notification category, such as `delivery`, `order`, or `payment`.

**Request Body:**

```json
{
  "title": "Order dispatched",
  "message": "Your order #101 is on its way.",
  "type": "delivery"
}
```

**Response:**

```json
{
  "notif_id": 31,
  "customer_id": 63,
  "title": "Order dispatched",
  "message": "Your order #101 is on its way.",
  "type": "delivery",
  "created_at": "2026-09-18T09:30:00.000Z",
  "read_at": null
}
```

---

### 2. List customer notifications

**Endpoint:** `GET /users/:userId/notifications`

**Description:** Returns notifications belonging to the specified customer, newest first.

**Path Parameters:**

- `userId` (number): The customer's ID.

**Response:**

```json
[
  {
    "notif_id": 31,
    "customer_id": 63,
    "title": "Order dispatched",
    "message": "Your order #101 is on its way.",
    "type": "delivery",
    "created_at": "2026-09-18T09:30:00.000Z",
    "read_at": null
  }
]
```

---

### 3. Update a notification read status

**Endpoint:** `PATCH /users/:userId/notifications/:notificationId`

**Description:** Marks a notification belonging to the specified customer as read or unread. Marking it as read records the current server timestamp in `read_at`.

**Path Parameters:**

- `userId` (number): The customer's ID.
- `notificationId` (number): The notification ID.

**Body Parameters (JSON):**

- `is_read` (boolean, required): `true` marks the notification read; `false` clears its read timestamp.

**Request Body:**

```json
{
  "is_read": true
}
```

**Response:**

```json
{
  "notif_id": 31,
  "customer_id": 63,
  "title": "Order dispatched",
  "message": "Your order #101 is on its way.",
  "type": "delivery",
  "created_at": "2026-09-18T09:30:00.000Z",
  "read_at": "2026-09-18T10:00:00.000Z"
}
```

---

## Common Errors

- `400 Bad Request`: Validation failed, including a missing or non-boolean `is_read` value.
- `404 Not Found`: The specified customer or notification does not exist.
