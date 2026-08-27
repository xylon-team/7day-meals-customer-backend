# Endpoint Documentation Guideline

This document provides a standardized format for documenting API endpoints in the 7 Day Meals Staff Backend. Follow this structure to ensure consistency across all endpoint documentation.

---

## Document Structure

### 1. Title and Overview

```markdown
# [Resource Name] Endpoints

[Resource name] endpoints are defined in `src/[module]/[module].controller.ts`.

- **Base path:** `/[base-path]`
- **Authentication:** All routes require `Authorization: Bearer <admin_jwt>` and are protected by `AdminJwtAuthGuard`.
```

**Guidelines:**
- Use the resource name in the title (e.g., "Role Management Endpoints", "Staff Endpoints")
- Specify the controller file location
- Include the base path for all endpoints in this module
- State authentication requirements clearly

---

### 2. Legend Section

```markdown
---

## Legend

Parameters are labeled by location:

- **Path** — URL path segment (`:id`)
- **Query** — URL query string (`?key=value`)
- **Body** — JSON request body

---
```

**Guidelines:**
- Always include this section after the overview
- Use the exact text provided above
- This helps users understand where parameters should be placed

---

### 3. Data Models Section

```markdown
---

## Data Models

### [Model Name]

```json
{
  "field_name": type,
  "another_field": type
}
```

### [Related Model Name]

```json
{
  "field_name": type
}
```

### [Model with Variations]

Pass `?includeRelated=true` to `GET /endpoint` to include related data.

```json
{
  "field_name": type,
  "related_data": type[]
}
```

---
```

**Guidelines:**
- Document all main data models used by the endpoints
- Use JSON code blocks with **types** instead of example values (e.g., `number`, `string`, `boolean`, `type[]`, `Record<string, type>`)
- For enum or constrained values, note the valid options (e.g., `string ("active" | "inactive")`)
- For special formats, add context (e.g., `string (ISO 8601 datetime)`, `string (JWT)`)
- Include variations (e.g., with/without related data)
- Note any query parameters that modify the response structure

---

### 4. Table of Contents (Endpoints Only)

```markdown
---

## Table of Contents

- [1. List all permissions](#1-list-all-permissions)
- [2. Create a role](#2-create-a-role)
- [3. List all roles](#3-list-all-roles)
- [4. Search roles](#4-search-roles)
- [5. Get role by ID](#5-get-role-by-id)
- [6. Update role](#6-update-role)
- [7. Delete role](#7-delete-role)
- [8. Get role permissions](#8-get-role-permissions)
- [9. Assign permissions to role](#9-assign-permissions-to-role)
- [10. Remove permissions from role](#10-remove-permissions-from-role)

---
```

**Guidelines:**
- Add a Table of Contents section immediately after the Data Models section
- Include only endpoints in the TOC (not Data Models, Legend, or Common Errors)
- Use numbered links that match the endpoint numbering
- Use kebab-case for anchor IDs (e.g., "get-role-by-id" for "Get role by ID")
- Each link should be in the format: `- [Number. Title](#anchor-id)`

---

### 5. Endpoints Section

```markdown
---

## Endpoints

### 1. [Action] [Resource]

**Endpoint:** `[METHOD] /path`

**Description:** Brief description of what the endpoint does.

**Parameters:** None

**Response:**

```json
{
  "field": "value"
}
```

---
```

**Guidelines:**
- Number each endpoint sequentially
- Use action verbs (Create, List, Get, Update, Delete, Search, etc.)
- Include the HTTP method and full path
- Provide a clear, concise description
- Document all parameters with their types and whether they're required/optional
- Include example request bodies for POST/PATCH/PUT
- Include example responses in JSON format
- Separate each endpoint with a horizontal rule

---

### 6. Parameter Documentation Format

For endpoints with parameters, use the appropriate format:

**Path Parameters:**
```markdown
**Path Parameters:**

- `id` (number): resource ID.
```

**Query Parameters:**
```markdown
**Query Parameters:**

- `paramName` (string, optional): description of the parameter.
- `anotherParam` (number, required): description of the parameter.
```

**Body Parameters:**
```markdown
**Body Parameters (JSON):**

- `fieldName` (string, required): field description.
- `anotherField` (number, optional): field description.
```

**Guidelines:**
- Always specify the data type (string, number, boolean, array, etc.)
- Always specify if the parameter is required or optional
- Provide clear descriptions for each parameter
- List parameters in the order they appear in the request

---

### 7. Request/Response Examples

**Request Body (for POST/PATCH/PUT):**
```markdown
**Request Body:**

```json
{
  "field_name": "value",
  "another_field": "value"
}
```
```

**Response:**
```markdown
**Response:**

```json
{
  "field_name": "value"
}
```
```

**Guidelines:**
- Use realistic, meaningful example values in endpoint request/response examples
- Keep examples concise but representative
- For array responses, show 1-2 items with `...` to indicate more
- For responses that vary based on parameters, show the most common case
- **Note:** Data Models section uses types, but endpoint examples use concrete values

---

### 8. Common Errors Section

```markdown
---

## Common Errors

- `400 Bad Request`: description of when this occurs.
- `401 Unauthorized`: description of when this occurs.
- `404 Not Found`: description of when this occurs.
- `409 Conflict`: description of when this occurs.
```

**Guidelines:**
- List all common HTTP status codes returned by the endpoints
- Provide brief descriptions of when each error occurs
- Include validation errors, authentication errors, and resource not found scenarios
- Order by most common to least common

---

## Complete Template

```markdown
# [Resource Name] Endpoints

[Resource name] endpoints are defined in `src/[module]/[module].controller.ts`.

- **Base path:** `/[base-path]`
- **Authentication:** All routes require `Authorization: Bearer <admin_jwt>` and are protected by `AdminJwtAuthGuard`.

---

## Legend

Parameters are labeled by location:

- **Path** — URL path segment (`:id`)
- **Query** — URL query string (`?key=value`)
- **Body** — JSON request body

---

## Data Models

### [Primary Model]

```json
{
  "field_name": type,
  "another_field": type
}
```

### [Related Model]

```json
{
  "field_name": type
}
```

---

## Table of Contents

- [1. [Action] [Resource]](#1-[action]-[resource])
- [2. [Action] [Resource]](#2-[action]-[resource])

---

## Endpoints

### 1. [Action] [Resource]

**Endpoint:** `[METHOD] /path`

**Description:** Brief description.

**Parameters:** None

**Response:**

```json
{
  "field": "value"
}
```

---

### 2. [Action] [Resource]

**Endpoint:** `[METHOD] /path`

**Description:** Brief description.

**Path Parameters:**

- `id` (number): resource ID.

**Body Parameters (JSON):**

- `field` (string, required): field description.

**Request Body:**

```json
{
  "field": "value"
}
```

**Response:**

```json
{
  "field": "value"
}
```

---

## Common Errors

- `400 Bad Request`: description.
- `401 Unauthorized`: description.
- `404 Not Found`: description.
- `409 Conflict`: description.
```

---

## Best Practices

1. **Be consistent:** Use the same terminology throughout the document
2. **Be concise:** Keep descriptions short and to the point
3. **Be accurate:** Ensure all examples match the actual API behavior
4. **Be complete:** Document all parameters, including optional ones
5. **Use real examples:** Avoid placeholder values like "foo" or "bar"
6. **Order logically:** Group related endpoints together (CRUD operations first, then specialized operations)
7. **Update regularly:** Keep documentation in sync with code changes
8. **Test examples:** Verify that all request/response examples actually work with the API

---

## File Naming Convention

Place endpoint documentation files in `docs/endpoint-documentation/` with the naming pattern:
- `[resource]-endpoints.md` (e.g., `role-endpoints.md`, `staff-endpoints.md`)

Use lowercase, hyphenated names for consistency.
