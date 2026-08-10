# UIAnchor — Developer Guidelines

**Audience:** Frontend + E2E engineers working in MediNexPlus  
**Runtime contract:** `data-ui="<identity>"`  
**Helpers:** `@/lib/uianchor` · Playwright `ui()` fixture in `e2e/fixtures.ts`

UIAnchor gives interactive UI a **stable identity** shared by application code and Playwright. Prefer this over CSS classes, DOM depth, or visible copy.

---

## 1. Golden rules

**When to anchor**

> If an E2E test needs to click, fill, or assert a UI element, that element must have a stable UIAnchor identity.

Do **not** anchor every `<div>` / `<span>`. Only:

- form fields and submit actions
- primary navigation and logout
- important page landmarks (dashboard titles, empty states used in asserts)
- row/list actions that tests will target (later: with instance identity)

**Contract chain**

> One component declaration → one stable identity → one DOM contract (`data-ui`) → one Playwright locator.

Do not invent a second identity for the same control (e.g. both `data-ui` and a fragile CSS selector in E2E).

---

## 2. Source of truth

**Application component code owns the identity.** Everything else is emitted or consumed from it.

| Artifact | Role | Status in MediNexPlus |
|----------|------|------------------------|
| React `ui` prop / `data-ui` | **Source of truth** | ✅ shipped |
| DOM `data-ui="…"` | Runtime representation | ✅ shipped |
| Playwright `ui()` | Consumer | ✅ shipped |
| Runtime ID format validation | Dev-time guard | ✅ shipped |
| `ui-anchor.manifest.json` | Generated UI inventory | ✅ shipped |
| Generated TypeScript `UIAnchorId` | Compile-time ID checking | ✅ shipped |

```text
React Source (Anchor / data-ui)
         │
    ┌────┴────┐
    ▼         ▼
   DOM     Manifest (generated)
    │         │
    ▼         ▼
Playwright  Typed IDs (generated)
```

Regenerate after adding/changing anchors:

```bash
npm run uianchor:generate
```

Outputs: `src/lib/uianchor/ui-anchor.manifest.json` · `src/lib/uianchor/ids.generated.ts`  
Do not hand-edit those files.

Never reverse the flow: do not invent IDs only in tests or maintain a hand-written inventory of anchors.

---

## 3. DOM contract

```html
<button data-ui="hospitaladmin.nav.appointments">Appointments</button>
```

Playwright:

```ts
await ui("hospitaladmin.nav.appointments").click();
```

Internally this is `[data-ui="hospitaladmin.nav.appointments"]`. UIAnchor does not replace Playwright; it only provides deterministic component identity.

| Do | Don't |
|----|--------|
| Use `data-ui` | Use `data-testid` for new anchors |
| Use semantic HTML (`button`, `input`) | Fake buttons with `<div role="button">` unless required |
| Keep identity stable across redesigns | Encode CSS / layout into the ID |

Never derive identity from CSS classes, DOM position, visible text, or generated/random IDs.

---

## 4. Application API

```tsx
import { Anchor } from "@/lib/uianchor";

<Anchor.Input ui="auth.login.email" id="login-email" type="email" />
<Anchor.Button ui="auth.login.submit" type="submit">Sign In</Anchor.Button>
```

| Prop | Meaning |
|------|---------|
| `ui` | UIAnchor identity → becomes `data-ui` |
| `id` | Optional native HTML id (labels / a11y) |

**`ui` vs `id`:** Some UIAnchor specs use `id` for the stable identity. In MediNexPlus the prop is **`ui`**, so native HTML `id` stays free for accessibility and label association. Do not pass the UIAnchor identity as HTML `id`.

Primitives: `Anchor.Button` · `Anchor.Input` · `Anchor.Select` · `Anchor.Link` (native `<a>`).

For non-interactive landmarks (page titles), a plain element is fine:

```tsx
<div className="hd-pg-title" data-ui="hospitaladmin.dashboard">Dashboard</div>
```

---

## 5. Naming

### Format

```text
<domain>.<area>.<element>[.<action>]
```

- lowercase
- dot-separated
- each segment: `[a-z][a-z0-9-]*`
- **at least two segments**
- describe **what**, not **how**
- stable, semantic, human-readable, unique

Valid: `auth.login.submit`, `hospitaladmin.nav.logout`, `doctor.rx.save`  
Invalid: `Submit`, `btn1`, `auth_login`, `ui-83f92a`, `button:nth-child(2)`, `.primary-button`

### Domain prefixes (MediNexPlus)

| Prefix | Portal / area |
|--------|----------------|
| `auth.*` | All login/signup/forgot/change-password flows |
| `public.*` | Landing, navbar, booking, marketing |
| `shared.*` | Truly shared components used across portals (prefer portal-scoped when unclear) |
| `superadmin.*` | Super admin |
| `hospitaladmin.*` | Hospital admin |
| `doctor.*` | Doctor |
| `staff.*` | Staff / receptionist (staff shell) |
| `receptionist.*` | Dedicated receptionist dashboard only |
| `finance.*` | Finance head |
| `parentdept.*` | Parent department |
| `subdept.*` | Sub-department (use type suffix when needed: `subdept.pharmacy.*`) |
| `clinical.*` / `diagnostic.*` / `administrative.*` / `support.*` | Parent-dept flavor portals |

### Portal-scoped vs shared

**Prefer portal-scoped IDs** for shell chrome (nav, logout):

```text
hospitaladmin.nav.logout
doctor.nav.logout
```

For shared panels reused in multiple portals (`AppointmentPanel`, `BillingQueue`), either:

1. **Portal-scoped via prop** (preferred for E2E clarity):

```tsx
<AppointmentPanel uiPrefix="hospitaladmin.appointments" />
```

2. Or **shared.*** only when the same E2E meaning is truly identical everywhere:

```text
shared.support.open
shared.notifications.bell
```

Decide per component; do not mix both styles on one control.

---

## 6. When to add an Anchor

**Add when:**

- Writing or planning an E2E that touches the control
- The control is a primary CTA, nav item, or form field
- Asserting “user reached this screen” (page landmark)

**Skip when:**

- Pure layout / decoration
- One-off copy that tests should not depend on
- Icons that only exist inside an already-anchored button

---

## 7. Playwright usage

```ts
import { test, expect } from "./fixtures";

test("…", async ({ page, ui }) => {
  await ui("auth.login.email").fill("admin@hospital.com");
  await ui("auth.login.submit").click();
  await expect(ui("hospitaladmin.dashboard")).toBeVisible();
});
```

Use Playwright’s built-in assertions (`toBeVisible`, `toBeEnabled`, …).  
Do **not** invent a custom assertion framework.

Avoid new selectors like:

```ts
page.locator(".mn-auth-btn")
page.getByText("Sign In")
page.locator("div > button:nth-child(2)")
```

for controls that already have (or should have) a UIAnchor.

---

## 8. Validation (current)

In development, invalid `ui` values throw:

```text
[UIAnchor] Invalid UI id "…"
```

Production skips format validation. Always emit `data-ui`.

Playwright `ui()` uses generated `UIAnchorId`, so typos like `auth.login.submt` fail at compile time after regenerate. See §11.

---

## 9. Lists and instance identity (Phase 2)

v0.1 helpers do **not** yet expose `instance()`. Until Phase 2 ships:

- Anchor **static** controls on list pages (create button, filters, empty state)
- For row actions, either wait for `data-ui-instance` support **or** temporarily scope with a stable unique `ui` that includes the entity id **only if** required for a specific test (document that exception)

Planned Phase 2 shape:

```html
<button data-ui="hospitaladmin.staff.row.edit" data-ui-instance="emp-42">
```

```ts
ui("hospitaladmin.staff.row.edit").instance("emp-42")
```

Do not use array indexes (`row(0)`) as identity.

---

## 10. Page Objects

UIAnchor complements Page Objects; it does not replace them.

```ts
// optional
const login = {
  email: ui("auth.login.email"),
  password: ui("auth.login.password"),
  submit: ui("auth.login.submit"),
};
```

Simple flows can call `ui(...)` directly.

---

## 11. Manifest + typed IDs

Shipped. `npm run uianchor:generate` (also `pretypecheck`) scans application anchors and writes:

**Manifest** (`src/lib/uianchor/ui-anchor.manifest.json`, not hand-maintained):

```json
{
  "schemaVersion": 1,
  "components": {
    "auth.login.email": { "type": "input" },
    "auth.login.password": { "type": "input" },
    "auth.login.submit": { "type": "button" }
  }
}
```

**TypeScript union** (`src/lib/uianchor/ids.generated.ts`):

```ts
type UIAnchorId =
  | "auth.login.email"
  | "auth.login.password"
  | "auth.login.submit";

ui("auth.login.submit"); // ✅
ui("auth.login.submt");  // ❌ compile-time error
```

Playwright `ui()` is typed with `UIAnchorId`. App `Anchor` `ui` props accept `UIAnchorId` with string fallback for dynamic `uiPrefix` templates. Runtime format validation still applies in development.

---

## 12. Scope (KISS / YAGNI)

UIAnchor solves one problem: **stable UI identity shared by app code and E2E**.

It should not become another frontend framework, test runner, assertion library, visual testing platform, or giant component registry. Use native React and Playwright wherever possible.

**Shipped now:** Anchor primitives · stable IDs · `data-ui` · Playwright `ui()` · format validation · generated manifest · typed `UIAnchorId`  

**Later only if needed:** instance identity · advanced diagnostics

---

## 13. PR checklist

Before merging UI that E2E (will) touch:

- [ ] Interactive controls use `Anchor.*` or explicit `data-ui`
- [ ] IDs follow `<domain>.<area>.<element>` and the portal prefix table
- [ ] Identity is on the `ui` prop (or `data-ui`), not HTML `id`
- [ ] HTML `id` kept for a11y where labels need it (`ui` ≠ HTML `id`)
- [ ] No new fragile CSS/text selectors for those controls in `e2e/`
- [ ] Landmark IDs only on screens that tests assert

---

## 14. One-sentence reminder

> Application owns the identity; Playwright consumes it — never guess from CSS or copy.
