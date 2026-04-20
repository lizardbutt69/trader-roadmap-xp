# Security Audit Report

**Date:** April 20, 2026  
**Scope:** Trading Journal App (trader-roadmap-xp)

---

## Summary

This audit identified 15 security issues across the codebase, including 3 critical vulnerabilities related to exposed credentials and missing validation, 4 high-severity issues with CORS and rate limiting, and several medium and low-priority concerns.

---

## 🔴 Critical Issues

### 1. Exposed Supabase Credentials
**File:** `/src/supabase.js:3-4`

```javascript
const supabaseUrl = 'https://zoqdjfadooxymwzyurhp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Risk:** Anon key is hardcoded in client-side code. While Supabase anon keys are designed for public use with RLS policies, this is still a credential leak that exposes the project identifier.

**Fix:** Move to environment variables:
```javascript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

---

### 2. API Key Stored in Database in Plaintext
**Files:** `api/ai-summary.js:43-50`, `trader-roadmap-xp.jsx`

User's Anthropic API keys are stored in the `profiles` table and retrieved without encryption.

**Risk:** Database breach exposes user's API keys. Keys are accessible by anyone with database read access.

**Fix Options:**
- Option A: Remove user-stored keys entirely, use server-side env var only
- Option B: Encrypt keys before storage using AES-256 with environment-derived key
- Option C: Use a key vault service

---

### 3. Missing Input Validation on URL Parameters
**File:** `api/market-data.js:19`

```javascript
const { ticker = "NQ=F", interval = "5m", range = "1d", period1, period2 } = req.query;
```

The `ticker` parameter is passed directly to Yahoo Finance API without validation.

**Risk:** 
- SSRF (Server-Side Request Forgery) if Yahoo Finance endpoint changes
- Injection attacks via malformed ticker symbols

**Fix:**
```javascript
const VALID_TICKER = /^[A-Z0-9=\.,\-]+$/;
if (!VALID_TICKER.test(ticker)) {
  return res.status(400).json({ error: "Invalid ticker format" });
}
```

---

## 🟠 High Severity Issues

### 4. CORS Configuration Allows Localhost in Production
**Files:** All API files (`api/ai-summary.js`, `api/market-data.js`, `api/news.js`, `api/tweets.js`)

```javascript
const ALLOWED_ORIGINS = [
  "https://trader-roadmap-xp.vercel.app",
  "http://localhost:5173",  // ← Dangerous in production
  "http://localhost:3000",
];
```

**Risk:** Production API endpoints accept requests from localhost, enabling CSRF attacks and making it easier for attackers to test exploits locally.

**Fix:** Use environment-based configuration:
```javascript
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production' 
  ? ["https://trader-roadmap-xp.vercel.app"]
  : ["http://localhost:5173", "http://localhost:3000"];
```

---

### 5. Missing Rate Limiting on Most Endpoints
**Files:** `api/ai-summary.js`, `api/market-data.js`

Only `/api/tweets.js` has rate limiting. Other endpoints have none.

**Risk:**
- API abuse and quota exhaustion (Anthropic API costs)
- Yahoo Finance proxy abuse leading to IP blocking
- Denial of Service

**Fix:** Add rate limiting to all endpoints:
```javascript
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip) {
  // ... implementation
}

// Use in handler:
const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress;
if (isRateLimited(ip)) {
  return res.status(429).json({ error: "Too many requests" });
}
```

---

### 6. Error Messages Leak Stack Traces
**File:** `api/news.js:30`

```javascript
return res.status(500).json({ error: e.message, stack: e.stack });
```

**Risk:** Exposes internal code structure, file paths, and potential vulnerabilities to attackers.

**Fix:**
```javascript
// Development only
if (process.env.NODE_ENV === 'development') {
  return res.status(500).json({ error: e.message, stack: e.stack });
}
// Production
return res.status(500).json({ error: "Internal server error" });
```

---

### 7. Missing Authentication on `/api/market-data.js`
**File:** `api/market-data.js`

The endpoint is completely unauthenticated. While it proxies public Yahoo Finance data, anyone can abuse your proxy.

**Risk:**
- Yahoo Finance rate limiting your server IP
- Bandwidth abuse
- Potential ToS violation

**Fix:** Add authentication check:
```javascript
const authHeader = req.headers.authorization;
if (!authHeader?.startsWith("Bearer ")) {
  return res.status(401).json({ error: "Authentication required" });
}
```

---

## 🟡 Medium Severity Issues

### 8. Insufficient Trade Form Validation
**File:** `src/trading.jsx:452-466`

```javascript
if (formAplus && !VALID_APLUS.has(formAplus)) return "Invalid A+ value.";
```

**Issue:** `VALID_APLUS` is referenced but undefined (runtime error).

**Additional issues:**
- No validation on `tags` array content
- `chart` URLs validated but profit parsing happens before validation
- No sanitization on text fields beyond length truncation

**Fix:**
```javascript
// Define the validation set
const VALID_APLUS = new Set(["Yes", "Yes But Execution Sucked", "Yes to No", "No"]);

// Add tag validation
const VALID_TAGS = new Set(["GXT", "TTFM", "CISD", "ICCISD", "1STG", "2STG", "SMT", "PSP", "SSMT", "SMTFILL"]);
function validateTags(tags) {
  return tags.every(tag => VALID_TAGS.has(tag));
}
```

---

### 9. LocalStorage XSS Vulnerability Pattern
**Files:** `trader-roadmap-xp.jsx`, `src/trading.jsx`

Multiple instances store data in localStorage without sanitization:

```javascript
localStorage.setItem("newsAlertsEnabled", "true");
localStorage.setItem("tradingLayout", JSON.stringify(newOrder));
```

**Risk:** If user input reaches localStorage and is later rendered unsafely, XSS could occur.

**Current Status:** Not directly exploitable (no `dangerouslySetInnerHTML` found in codebase).

**Recommendation:** Add a sanitization wrapper:
```javascript
function safeLocalStorageSet(key, value) {
  if (typeof value === 'string') {
    // Basic XSS prevention
    value = value.replace(/[<>]/g, '');
  }
  localStorage.setItem(key, value);
}
```

---

### 10. Missing CSRF Protection on State-Changing Operations
**Files:** All database mutation operations via Supabase

Supabase client-side operations use the user's session token, but there's no explicit CSRF token validation for the API routes.

**Risk:** Cross-Site Request Forgery attacks could trigger unwanted state changes.

**Fix:** 
- For custom API routes, validate Origin header matches expected domain
- Supabase RLS policies provide some protection, but explicit CSRF tokens add another layer

---

## 🟢 Low Severity / Best Practice Issues

### 11. Privacy Mode Toggle Stored Client-Side
**File:** `src/trading.jsx`

```javascript
const [privacyMode, setPrivacyMode] = useState(() => { 
  try { return localStorage.getItem("traderPrivacyMode") === "true"; } 
  catch { return false; } 
});
```

**Issue:** Privacy mode state can be tampered with client-side. Minor issue as this is a UI preference, not a security control.

---

### 12. Missing Content Security Policy Headers
**Risk:** No CSP headers configured to prevent XSS via injected scripts.

**Fix:** Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.anthropic.com;"
        }
      ]
    }
  ]
}
```

---

### 13. User Agent Spoofing
**File:** `api/market-data.js:27-30`

```javascript
headers: {
  "User-Agent": "Mozilla/5.0",
  "Accept": "application/json",
}
```

**Issue:** Hardcoded User-Agent may violate Yahoo Finance Terms of Service and could break unexpectedly if Yahoo changes their API requirements.

---

### 14. Database Migration Missing Encryption Columns
**File:** `supabase-migration.sql`

The `profiles.anthropic_api_key` column stores API keys in plaintext.

**Fix:** Either:
- Remove the column and use environment variables only
- Add encryption at rest via pgcrypto extension

---

### 15. Weak Type Checking on Numeric Fields
**File:** `src/trading.jsx` (multiple locations)

```javascript
profit: form.profit ? parseFloat(form.profit) : null,
```

**Issue:** No validation that `parseFloat` succeeded. `parseFloat("abc")` returns `NaN` which could corrupt calculations.

**Fix:**
```javascript
const parsedProfit = form.profit ? parseFloat(form.profit) : null;
if (form.profit && isNaN(parsedProfit)) {
  return "Invalid profit value";
}
```

---

## Summary Table

| Severity | Count | Categories |
|----------|-------|------------|
| 🔴 Critical | 3 | Credentials exposure, plaintext storage, missing validation |
| 🟠 High | 4 | CORS misconfig, rate limiting, error leaks, missing auth |
| 🟡 Medium | 4 | Form validation, XSS patterns, CSRF protection |
| 🟢 Low | 4 | Privacy, CSP headers, type checking, ToS compliance |

---

## Recommended Immediate Actions (Priority Order)

1. **🔴 Rotate Supabase credentials** and move to environment variables
2. **🔴 Remove or encrypt user-stored Anthropic API keys**
3. **🟠 Remove localhost from production CORS origins**
4. **🟠 Add rate limiting to `/api/ai-summary.js` and `/api/market-data.js`**
5. **🟠 Remove stack traces from production error responses**
6. **🟠 Add authentication to `/api/market-data.js`**
7. **🟡 Fix undefined `VALID_APLUS` validation set**
8. **🟢 Add Content Security Policy headers**

---

## Files Requiring Changes

| File | Issues |
|------|--------|
| `src/supabase.js` | Hardcoded credentials |
| `api/ai-summary.js` | Rate limiting, error handling |
| `api/market-data.js` | Input validation, auth, rate limiting |
| `api/news.js` | Error stack trace leak |
| `api/tweets.js` | CORS config (localhost in prod) |
| `src/trading.jsx` | Form validation, type checking |
| `trader-roadmap-xp.jsx` | CORS config, localStorage patterns |
| `supabase-migration.sql` | Encryption for API keys |
| `vercel.json` | CSP headers |
