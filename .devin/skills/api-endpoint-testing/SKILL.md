---
name: api-endpoint-testing
description: This skill allows the agent to test API endpoints using PowerShell and output with proper formatting
---

## When to use this skill
Use this whenever testing HTTP endpoints from a Windows shell (PowerShell). `jq` is not available on default on Windows, so use PowerShell's native `ConvertTo-Json` cmdlet to format JSON responses for readability.

## Command format

Use `Invoke-RestMethod` for all API requests. It avoids the PowerShell quoting issues that can occur with `curl.exe` and inline JSON bodies.

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/users -Method GET -Headers @{Authorization="Bearer TOKEN"} | ConvertTo-Json -Depth 10
```

- `Invoke-RestMethod` automatically parses JSON responses into PowerShell objects.
- `ConvertTo-Json -Depth 10` ensures nested objects/arrays are fully expanded rather than truncated (PowerShell's default depth is 2).

## POST / PATCH / PUT with JSON body

```powershell
$body = '{"admin_username":"admin","admin_password":"password"}'
Invoke-RestMethod -Uri http://localhost:3000/auth/login -Method POST -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 10
```

The `$body` string is passed directly to `Invoke-RestMethod`, so double quotes are preserved without needing temp files or escaping.

## GET request with headers (e.g. auth token)

```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/users -Method GET -Headers @{Authorization="Bearer TOKEN"} | ConvertTo-Json -Depth 10
```

## Example formatted response

```json
{
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "statusCode": 401
}
```

This produces properly indented JSON instead of PowerShell's default table/column view, which makes error bodies and nested data much easier to read.

## Rules for the agent

1. **Read-only testing.** When testing endpoints and finding issues (errors, unexpected responses, bugs), only report the findings back to the user. Do NOT make any code changes to fix anything unless explicitly asked to.
2. Always format API responses through `ConvertTo-Json -Depth 10` before presenting them, rather than showing raw/minified JSON or PowerShell's default table view.
3. If a response is not valid JSON (e.g. HTML error page, empty body), report it as-is rather than trying to force it through `ConvertFrom-Json`.
4. **Test endpoints one by one in the same terminal window.** Do NOT batch multiple API calls together in a single bash call. Execute each request individually and wait for the response before proceeding to the next test. This ensures clear, readable output and proper error handling for each endpoint. All tests should be run sequentially in the same terminal session.
5. **Never create temp files.** Tokens, JSON bodies, and any other test data must be kept in the agent's memory context and passed inline in the command. Visibility in command output is acceptable unless the user explicitly asks for a different approach.
