# E2E Testing — How to run and write Playwright tests

**Audience:** anyone adding or debugging tests in `e2e/`
**Stack:** Playwright + the UIAnchor `ui()` fixture
**Related:** [UIANCHOR_GUIDELINES.md](./UIANCHOR_GUIDELINES.md) · `.cursor/rules/test-first.mdc`

Playwright does **not** boot the app for you — `playwright.config.ts` has no `webServer`
block. You must start MySQL and the dev server yourself before running any test.

---

## 1. Start the environment first

### Step 1 — MySQL (Docker)

```bash
docker info >/dev/null 2>&1 && echo "Docker: UP" || echo "Docker: DOWN — open Docker Desktop"
npm run docker:db          # starts the mysql container (idempotent)
docker compose ps          # mysql should be "running"
```

If Docker itself is down, open Docker Desktop and wait for the whale icon to settle
before re-running `npm run docker:db`. Every API route hits Prisma, so with no DB the
login route returns `503` and *every* test fails in a confusing way.

### Step 2 — Dev server on port 3000

Check before you start a second one:

```bash
curl -sf -o /dev/null http://localhost:3000 && echo "server: UP" || npm run dev
```

`baseURL` is `http://localhost:3000`, overridable with `BASE_URL`.

### Step 3 — Sanity check the whole stack

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/api/health
```

Anything other than `200` means fix the environment before blaming a test.

---

## 2. Running tests

| Command | What it runs |
|---|---|
| `npm run test:e2e` | everything (both projects) |
| `npm run test:e2e:superadmin-flow` | serial onboard flow, **headless** (fast) |
| `npm run test:e2e:superadmin-flow:headed` | same flow, watch the browser |
| `npx playwright test --project=chromium` | standalone specs only |
| `npx playwright test e2e/superadmin/onboard/06-book-appointment.spec.ts` | one file |
| `npx playwright test --headed` | watch a real browser |
| `npx playwright test --debug` | step through with the inspector |
| `npx playwright test --ui` | time-travel UI mode, best for locator debugging |

- **`chromium`** — normal independent specs across all portals (`doctor`, `finance`, `clinical`, `diagnostic`, `administrative`, `support`, `receptionist`, `public`, `signup`, `hospitaladmin`), ignoring the onboard glob.
- **`superadmin-onboard`** — the serial flow, `workers: 1`, one shared browser tab.

### The serial onboarding flow

`e2e/superadmin/onboard/` runs in filename order in **one browser context**, each spec
depending on the previous one:

| Spec | Does |
|---|---|
| `01-login` | superadmin signs in |
| `02-create-hospital` | creates hospital + admin |
| `03-hospital-admin-login` | that new admin signs in |
| `04-create-doctor` | creates doctor + full-week schedule |
| `05-create-patient` | registers patient |
| `06-book-appointment` | books patient with that doctor |
| `07-complete-appointment` | marks it completed |
| `08-reports` | asserts the KPIs |

You cannot run `06` on its own against a clean DB — run the whole project, or at minimum
everything from `01`.

`mode: "serial"` only skips later tests **inside the same file**. Across these eight files
the run stops on the first failure via `maxFailures: 1` plus a worker-scoped skip.

---

## 3. Writing a test

Follow `test-first.mdc`: write the test, watch it fail for the right reason, then implement.

### Step 1 — Anchor the UI, don't guess selectors

Never target CSS classes or visible copy. If a test needs a control, that control gets a
UIAnchor identity in the component:

```tsx
<Anchor.Input ui="hospitaladmin.doctors.form.name" value={name} onChange={…} />
<Anchor.Button ui="hospitaladmin.doctors.save" onClick={save}>Save</Anchor.Button>
```

Then regenerate the typed inventory, or `ui("…")` will not typecheck:

```bash
npm run uianchor:generate
```

For repeated rows, keep one shared `ui` id and disambiguate with `data-ui-instance`:

```tsx
<Anchor.Button ui="hospitaladmin.appointments.booking.doctor" data-ui-instance={d.name} … />
```

```ts
await ui("hospitaladmin.appointments.booking.doctor")
  .and(page.locator(`[data-ui-instance="${doctorDraft.name}"]`))
  .click();
```

### Step 2 — Use the fixtures

```ts
import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

test("hospital admin can register a patient", async ({ page, ui, patientDraft }) => {
  await page.goto("/hospitaladmin/dashboard?tab=patients");
  await ui("hospitaladmin.patients.create").click();
  // …
});
```

### Step 3 — Pick the right fixture scope

This is the single biggest footgun in the serial flow.

| Scope | Lifetime | Use for |
|---|---|---|
| test (default) | recreated **per spec file** | page objects, per-test throwaway data |
| `{ scope: "worker" }` | created **once** for the whole flow | identities shared across specs |

`doctorDraft`, `patientDraft`, and `appointmentDraft` are worker-scoped **on purpose**.
They mint values from `Date.now()`; if they were test-scoped, spec `05` would register one
phone number and spec `06` would search a different one and find nothing.

> Rule: if two spec files must act on the same record, the fixture that names it is
> worker-scoped. Anything derived at runtime (an id returned by the app) goes in `flowState`.

### Step 4 — Assert persistence, not just optimistic UI

A spec that ends the moment it clicks Save can be a false pass: the next spec calls
`page.goto()`, the in-flight `POST` is aborted, and nothing was written. Either assert
something that can only be true after the server answered, or wait for the response:

```ts
const saved = page.waitForResponse(
  (res) => res.url().includes("/availability")
    && res.request().method() === "POST"
    && res.status() === 200
);
await ui("hospitaladmin.doctors.schedule.save").click();
expect((await (await saved).json()).success).toBe(true);
```

Avoid assertions that are true before the action, like `toBeEnabled()` on a button that
was already enabled — it waits for nothing.

Prefer web-first assertions (`await expect(locator).toBeVisible()`) over
`waitForTimeout`; they retry until the timeout.

---

## 4. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Every spec fails at login, API `503` | MySQL not running | `npm run docker:db` |
| `net::ERR_CONNECTION_REFUSED` | dev server not running | `npm run dev` |
| `"x.y.z" is not assignable to parameter of type 'UIAnchorId'` | anchor added but inventory stale | `npm run uianchor:generate` |
| Search box filled but dropdown empty | test searched a value a different fixture instance created | make the draft fixture worker-scoped |
| "No available slots" when booking | doctor's weekly schedule never persisted | assert the `/availability` response in spec `04` |
| Login lands on dashboard but `waitForURL` times out | Next.js client nav never fires `load` | wait on the dashboard locator, not `until: "load"` |
| Later specs keep running after a fail | `serial` is per-file; `testInfo.skip()` does not abort | `maxFailures: 1` plus `test.skip()` in the shared fixture |

Useful when a UI symptom and the DB disagree:

```bash
docker compose exec -T mysql mysql -umedinex -pmedinexpassword medinexplus \
  -e "select doctorId, day, startTime, endTime, isActive from DoctorAvailability order by id desc limit 10;"
```

## 5. Run IDs, artifacts, and browser diagnostics

Every invocation prints a unique ID such as `20260817180542-k3m9xz`. All files from that
invocation live under:

```text
test-results/runs/<run-id>/
```

The run folder contains `run.json` with status and pass/fail counts. The latest ID is also
written to `test-results/latest-run-id.txt`.

```bash
npm run test:e2e:runs                         # list known runs
npm run test:e2e:artifacts -- latest          # files from the latest run
npm run test:e2e:artifacts -- <run-id>        # files from a specific run
npm run test:e2e:trace -- <run-id>            # list traces; opens the only one if there is just one
npm run test:e2e:trace -- <run-id> 06-book    # open a matching spec trace
npm run test:e2e:trace -- <run-id> 1          # open by 1-based index
npm run test:e2e:trace -- <run-id> all        # open each trace in order (close the viewer to continue)
E2E_RUN_ID=my-debug-run npm run test:e2e      # optional caller-supplied ID
```

Run IDs may contain letters, numbers, dots, underscores, and hyphens.

Normal Playwright projects use:

```ts
trace: "retain-on-failure"
video: "off"
screenshot: "only-on-failure"
```

The serial onboard project owns one browser context across all eight specs, so its fixture
captures the equivalent artifacts explicitly:

- a full-flow video, deleted when the complete flow passes
- `trace.zip` for every spec, and `failure.png` for a failing spec
- `diagnostics.json` for every spec

`diagnostics.json` contains:

- browser console messages and uncaught page errors
- failed requests and HTTP responses with status `400+`
- CDP performance metrics, navigation timing, resource count/duration, LCP and CLS
- cookie metadata plus local/session storage **keys**

Cookie and storage values are intentionally omitted so auth tokens never enter artifacts.
The trace still contains the complete request timeline, DOM snapshots and action screenshots.

The performance data is diagnostic, not a pass/fail budget. Add explicit thresholds only
after measuring stable baselines in CI. Lighthouse audits should be a separate test/project
because they are slower and answer a different question than the serial business flow.
