# Customer Order Endpoints

Customer order endpoints are defined in `src/customer_order/customer_order.controller.ts`.

- **Base path:** `/users/:userId/orders`
- **Authentication:** All routes require `Authorization: Bearer <jwt>` and are protected by `JwtAuthGuard`.

---

## Legend

Parameters are labeled by location:

- **Path** — URL path segment (`:id`)
- **Query** — URL query string (`?key=value`)
- **Body** — JSON request body

---

## Data Models

### Customer Order

```json
{
  "order_id": number,
  "customer_id": number,
  "meal_id": number,
  "order_timestamp": string (ISO 8601 datetime),
  "delivery_person_id": number | null,
  "order_status": string,
  "payment_status": string,
  "delivery_status": string,
  "delivery_preferred_date": string (ISO 8601 datetime),
  "is_a_subscribed_meal": boolean,
  "offer_id": number | null
}
```

### Create Order Request

```json
{
  "customer_id": number,
  "meal_id": number,
  "order_status": string,
  "payment_status": string,
  "delivery_status": string,
  "delivery_preferred_date": string (ISO 8601 datetime),
  "is_a_subscribed_meal": boolean (optional),
  "delivery_person_id": number (optional),
  "offer_id": number (optional)
}
```

### Update Order Request

All fields are optional. At least one field must be provided.

```json
{
  "customer_id": number (optional),
  "meal_id": number (optional),
  "order_status": string (optional),
  "payment_status": string (optional),
  "delivery_status": string (optional),
  "delivery_preferred_date": string (ISO 8601 datetime, optional),
  "is_a_subscribed_meal": boolean (optional),
  "delivery_person_id": number (optional),
  "offer_id": number (optional)
}
```

---

## Table of Contents

- [1. Create an order](#1-create-an-order)
- [2. List all orders for a customer](#2-list-all-orders-for-a-customer)
- [3. Get an order by ID](#3-get-an-order-by-id)
- [4. Update an order](#4-update-an-order)

---

## Endpoints

### 1. Create an order

**Endpoint:** `POST /users/:userId/orders`

**Description:** Creates a new order for the specified customer. The `customer_id` from the request body is overridden with the `:userId` path parameter.

**Path Parameters:**

- `userId` (number): The customer's ID.

**Body Parameters (JSON):**

- `customer_id` (number, required): The customer's ID (overridden by the path parameter).
- `meal_id` (number, required): The meal plan ID to order.
- `order_status` (string, required): The initial order status.
- `payment_status` (string, required): The initial payment status.
- `delivery_status` (string, required): The initial delivery status.
- `delivery_preferred_date` (string, required): Preferred delivery date (ISO 8601 datetime).
- `is_a_subscribed_meal` (boolean, optional): Whether this order is for a subscribed meal. Defaults to `false`.
- `delivery_person_id` (number, optional): The assigned delivery person's ID.
- `offer_id` (number, optional): The applied offer's ID.

**Request Body:**

```json
{
  "customer_id": 63,
  "meal_id": 1,
  "order_status": "pending",
  "payment_status": "unpaid",
  "delivery_status": "not_dispatched",
  "delivery_preferred_date": "2026-09-01T10:00:00.000Z",
  "is_a_subscribed_meal": false,
  "offer_id": 5
}
```

**Response:**

```json
{
  "order_id": 101,
  "customer_id": 63,
  "meal_id": 1,
  "order_timestamp": "2026-08-27T18:40:00.000Z",
  "delivery_person_id": null,
  "order_status": "pending",
  "payment_status": "unpaid",
  "delivery_status": "not_dispatched",
  "delivery_preferred_date": "2026-09-01T10:00:00.000Z",
  "is_a_subscribed_meal": false,
  "offer_id": 5
}
```

---

### 2. List all orders for a customer

**Endpoint:** `GET /users/:userId/orders`

**Description:** Returns all orders belonging to the specified customer.

**Path Parameters:**

- `userId` (number): The customer's ID.

**Parameters:** None (beyond the path parameter)

**Response:**

```json
[
  {
    "order_id": 101,
    "customer_id": 63,
    "meal_id": 1,
    "order_timestamp": "2026-08-27T18:40:00.000Z",
    "delivery_person_id": null,
    "order_status": "pending",
    "payment_status": "unpaid",
    "delivery_status": "not_dispatched",
    "delivery_preferred_date": "2026-09-01T10:00:00.000Z",
    "is_a_subscribed_meal": false,
    "offer_id": 5
  }
]
```

---

### 3. Get an order by ID

**Endpoint:** `GET /users/:userId/orders/:orderId`

**Description:** Returns a single order belonging to the specified customer. The order must belong to the given customer (matched on both `order_id` and `customer_id`).

**Path Parameters:**

- `userId` (number): The customer's ID.
- `orderId` (number): The order's ID.

**Response:**

```json
{
  "order_id": 101,
  "customer_id": 63,
  "meal_id": 1,
  "order_timestamp": "2026-08-27T18:40:00.000Z",
  "delivery_person_id": null,
  "order_status": "pending",
  "payment_status": "unpaid",
  "delivery_status": "not_dispatched",
  "delivery_preferred_date": "2026-09-01T10:00:00.000Z",
  "is_a_subscribed_meal": false,
  "offer_id": 5
}
```

---

### 4. Update an order

**Endpoint:** `PATCH /users/:userId/orders/:orderId`

**Description:** Updates an order belonging to the specified customer. Only the provided fields are updated. The order must belong to the given customer (matched on both `order_id` and `customer_id`).

**Path Parameters:**

- `userId` (number): The customer's ID.
- `orderId` (number): The order's ID.

**Body Parameters (JSON):**

- `customer_id` (number, optional): The customer's ID.
- `meal_id` (number, optional): The meal plan ID to order.
- `order_status` (string, optional): The order status.
- `payment_status` (string, optional): The payment status.
- `delivery_status` (string, optional): The delivery status.
- `delivery_preferred_date` (string, optional): Preferred delivery date (ISO 8601 datetime).
- `is_a_subscribed_meal` (boolean, optional): Whether this order is for a subscribed meal.
- `delivery_person_id` (number, optional): The assigned delivery person's ID.
- `offer_id` (number, optional): The applied offer's ID.

**Request Body:**

```json
{
  "order_status": "confirmed",
  "payment_status": "paid"
}
```

**Response:**

```json
{
  "order_id": 101,
  "customer_id": 63,
  "meal_id": 1,
  "order_timestamp": "2026-08-27T18:40:00.000Z",
  "delivery_person_id": null,
  "order_status": "confirmed",
  "payment_status": "paid",
  "delivery_status": "not_dispatched",
  "delivery_preferred_date": "2026-09-01T10:00:00.000Z",
  "is_a_subscribed_meal": false,
  "offer_id": 5
}
```

---

## Common Errors

- `400 Bad Request`: Validation errors (missing required fields, invalid types, invalid date format). Also returned when a referenced entity (customer, meal plan, delivery person, or offer) does not exist on create or update.
- `401 Unauthorized`: Missing or invalid JWT, or when the JWT has been invalidated by a `token_version` bump (after logout, password reset, or password change).
- `404 Not Found`: Order not found for the given `orderId` and `userId` combination (on get or update), or a related record referenced in create/update does not exist.
- `409 Conflict`: Order creation or update conflicts with existing data (e.g., unique constraint violation).
- `500 Internal Server Error`: Unexpected database or server failures.
