# Authentication Endpoints

Authentication endpoints are defined in `src/auth/auth.controller.ts`.

- **Base path:** `/auth`
- **Authentication:** Only `logout` and `change-password` require `Authorization: Bearer <jwt>` and are protected by `JwtAuthGuard`. All other routes are public.

---

## Legend

Parameters are labeled by location:

- **Path** — URL path segment (`:id`)
- **Query** — URL query string (`?key=value`)
- **Body** — JSON request body

---

## Data Models

### Customer Credential

```json
{
  "customer_id": number,
  "email": string,
  "customer_password": string (bcrypt hash),
  "token_version": number
}
```

### Login Response

```json
{
  "access_token": string (JWT),
  "customer": {
    "customer_id": number,
    "fname": string,
    "lname": string,
    "email": string
  }
}
```

### Register Response

```json
{
  "customer_id": number,
  "email": string
}
```

### Message Response

```json
{
  "message": string
}
```

### Change Password Response

```json
{
  "access_token": string (JWT),
  "message": string
}
```

---

## Table of Contents

- [1. Register a customer](#1-register-a-customer)
- [2. Login](#2-login)
- [3. Logout](#3-logout)
- [4. Forgot password](#4-forgot-password)
- [5. Reset password](#5-reset-password)
- [6. Change password](#6-change-password)

---

## Endpoints

### 1. Register a customer

**Endpoint:** `POST /auth/register`

**Description:** Creates a new customer record and associated login credentials. The password is hashed with bcrypt before storage.

**Body Parameters (JSON):**

- `fname` (string, required): Customer's first name.
- `lname` (string, required): Customer's last name.
- `phone_number` (string, required): Customer's phone number.
- `email` (string, required): Customer's email address. Must be unique.
- `password` (string, required): Account password. Minimum 8 characters.
- `latitude` (string, optional): Customer's latitude coordinate.
- `longitude` (string, optional): Customer's longitude coordinate.
- `address_line_1` (string, optional): First line of the customer's address.
- `address_line_2` (string, optional): Second line of the customer's address.

**Request Body:**

```json
{
  "fname": "Hiruna",
  "lname": "Dilmith",
  "phone_number": "5558887766",
  "email": "hirunadilmith12@gmail.com",
  "password": "securepassword123",
  "latitude": "6.9271",
  "longitude": "79.8612",
  "address_line_1": "123 Main Street",
  "address_line_2": "Colombo"
}
```

**Response:**

```json
{
  "customer_id": 63,
  "email": "hirunadilmith12@gmail.com"
}
```

---

### 2. Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticates a customer with email and password, returning a JWT access token. The account must be active and not deleted.

**Body Parameters (JSON):**

- `email` (string, required): Customer's registered email address.
- `password` (string, required): Customer's account password.

**Request Body:**

```json
{
  "email": "hirunadilmith12@gmail.com",
  "password": "securepassword123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcl9pZCI6NjMsInRva2VuX3ZlcnNpb24iOjAsImlhdCI6MTc4NzgzNDk3OSwiZXhwIjoxNzg3OTIxMzc5fQ.CN7QqYGUG1h1N1zGvLzJyjHlRB8ZH4SvD28Q7_KxkXg",
  "customer": {
    "customer_id": 63,
    "fname": "Hiruna",
    "lname": "Dilmith",
    "email": "hirunadilmith12@gmail.com"
  }
}
```

---

### 3. Logout

**Endpoint:** `POST /auth/logout`

**Description:** Invalidates the current session by incrementing the customer's `token_version`, causing all existing JWTs for this customer to be rejected.

**Authentication:** Requires `Authorization: Bearer <jwt>`. Protected by `JwtAuthGuard`.

**Parameters:** None

**Response:**

```json
{
  "message": "Logged out"
}
```

---

### 4. Forgot password

**Endpoint:** `POST /auth/forgot-password`

**Description:** Generates a 4-digit OTP and sends it to the customer's email address. The OTP is hashed with bcrypt and stored with a 5-minute expiry. Always returns the same generic success message regardless of whether the email is registered, to prevent account enumeration.

**Body Parameters (JSON):**

- `email` (string, required): The email address to send the reset OTP to.

**Request Body:**

```json
{
  "email": "hirunadilmith12@gmail.com"
}
```

**Response:**

```json
{
  "message": "If the email is registered, an OTP has been sent."
}
```

---

### 5. Reset password

**Endpoint:** `POST /auth/reset-password`

**Description:** Verifies the OTP sent to the customer's email and sets a new password. On success, the OTP is deleted and `token_version` is incremented, invalidating all existing sessions (the user must log in again with the new password).

**Body Parameters (JSON):**

- `email` (string, required): The customer's email address.
- `otp` (string, required): The 4-digit OTP received via email. Must be exactly 4 characters.
- `new_password` (string, required): The new account password. Minimum 8 characters.

**Request Body:**

```json
{
  "email": "hirunadilmith12@gmail.com",
  "otp": "6022",
  "new_password": "newpassword789"
}
```

**Response:**

```json
{
  "message": "Password has been reset successfully"
}
```

---

### 6. Change password

**Endpoint:** `POST /auth/change-password`

**Description:** Allows an authenticated customer to change their password by providing their current password. On success, `token_version` is incremented (invalidating all other sessions) and a fresh JWT is returned for the current session, so the caller stays logged in.

**Authentication:** Requires `Authorization: Bearer <jwt>`. Protected by `JwtAuthGuard`.

**Body Parameters (JSON):**

- `current_password` (string, required): The customer's current password.
- `new_password` (string, required): The new account password. Minimum 8 characters.

**Request Body:**

```json
{
  "current_password": "securepassword123",
  "new_password": "newchanged456"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcl9pZCI6NjQsInRva2VuX3ZlcnNpb24iOjEsImlhdCI6MTc4NzgzNTQ3NSwiZXhwIjoxNzg3OTIxODc1fQ.FO8OXOVyfq-aZ1CFphBrFemijmgpRhWwxIInzI6T8OQ",
  "message": "Password changed successfully"
}
```

---

## Common Errors

- `400 Bad Request`: Validation errors (missing required fields, password too short, OTP wrong length, invalid email format). Also returned for an incorrect or expired OTP on `reset-password`, and for invalid registration data.
- `401 Unauthorized`: Missing or invalid JWT on guarded routes (`logout`, `change-password`). Also returned for invalid login credentials, an incorrect current password on `change-password`, or when a JWT has been invalidated by a `token_version` bump (after logout, password reset, or password change).
- `403 Forbidden`: Account is inactive or has been deleted (on `login`).
- `404 Not Found`: Customer not found when performing operations that reference an existing customer (e.g., `logout`, `change-password` when the account was deleted after the JWT was issued).
- `409 Conflict`: Email already registered (on `register`).
- `500 Internal Server Error`: Unexpected failures, including failures to send the reset email via SMTP (on `forgot-password`), or unexpected database errors.
