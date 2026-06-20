/* Real cross-tab auth E2E using Playwright + system Chrome (channel: 'chrome').
 * Verifies BroadcastChannel + Web Locks behaviour in api.ts / auth-channel.ts:
 *  1. A fresh tab authenticates via the shared httpOnly refresh cookie.
 *  2. Cross-tab token sync: one tab's refresh broadcasts the rotated token; others adopt it.
 *  3. Reload preserves the session (no spurious logout on F5).
 *  4. No false logout when two fresh tabs refresh concurrently (Web Locks serialization).
 *  5. Logout in one tab propagates to all other tabs.
 * Tab "authenticated" signal = sessionStorage access token present; UI signal = absence of
 * the header /login link.
 */
const { chromium } = require("playwright");

const BASE = process.env.E2E_BASE || "http://localhost:6868";
const EMAIL = process.env.E2E_EMAIL;
const PASS = process.env.E2E_PASS;
const TOKEN_KEY = "toeic-green-access-token";

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
}

const token = (page) => page.evaluate((k) => sessionStorage.getItem(k), TOKEN_KEY);
const loginLinkCount = (page) =>
  page.locator('header a[href="/login"]').count();

async function waitToken(page, present, timeout = 15000) {
  try {
    await page.waitForFunction(
      ([k, want]) => (!!sessionStorage.getItem(k)) === want,
      [TOKEN_KEY, present],
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByText("Chào mừng trở lại").waitFor({ timeout: 15000 });
  await page.waitForTimeout(300); // let AuthPanel effect register the listener
  await page.evaluate(
    ({ email, password }) => {
      window.dispatchEvent(
        new CustomEvent("toeic-login-attempt", { detail: { email, password } })
      );
    },
    { email: EMAIL, password: PASS }
  );
  return waitToken(page, true);
}

(async () => {
  if (!EMAIL || !PASS) {
    console.error("Missing E2E_EMAIL / E2E_PASS env");
    process.exit(2);
  }
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();

  try {
    // ── PHASE 1: login + fresh-tab auth via shared cookie ──────────────────
    const a = await context.newPage();
    const okA = await login(a);
    const tokenA0 = await token(a);
    check("Tab A login sets access token", okA && !!tokenA0, `len=${tokenA0 && tokenA0.length}`);
    check(
      "Tab A UI authenticated (no /login link in header)",
      (await loginLinkCount(a)) === 0
    );

    const b = await context.newPage();
    await b.goto(`${BASE}/practice`, { waitUntil: "domcontentloaded" });
    const okB = await waitToken(b, true);
    const tokenB0 = await token(b);
    check(
      "Tab B (fresh tab) authenticates via shared httpOnly refresh cookie",
      okB && !!tokenB0,
      `len=${tokenB0 && tokenB0.length}`
    );

    // ── PHASE 2+3: reload A -> real refresh (rotates token) -> broadcast ────
    // Reloading A re-hydrates: it must do a REAL /auth/refresh (get user+profile,
    // so A stays authenticated) and rotate+broadcast the new token (so B adopts it).
    void tokenA0;
    const tokenBbefore = await token(b);
    await a.waitForTimeout(1300); // ensure the rotated JWT lands on a different iat second
    await a.reload({ waitUntil: "domcontentloaded" });
    await a.waitForTimeout(3000);
    const tokenAreload = await token(a);
    const aLoginLinks = await loginLinkCount(a);
    check(
      "Reload (F5) preserves the session (token kept + UI still authenticated)",
      !!tokenAreload && aLoginLinks === 0,
      `tokenPresent=${!!tokenAreload} loginLinks=${aLoginLinks}`
    );

    let adopted = false;
    try {
      await b.waitForFunction(
        ([k, old]) => {
          const t = sessionStorage.getItem(k);
          return !!t && t !== old;
        },
        [TOKEN_KEY, tokenBbefore],
        { timeout: 8000 }
      );
      adopted = true;
    } catch {}
    const tokenBafter = await token(b);
    check(
      "Cross-tab token sync: Tab B adopts the rotated token from Tab A's reload-refresh",
      adopted && tokenBafter !== tokenBbefore,
      `changed=${tokenBafter !== tokenBbefore}`
    );

    // ── PHASE 4: concurrent refresh, no false logout (Web Locks) ────────────
    const c = await context.newPage();
    const d = await context.newPage();
    await Promise.all([
      c.goto(`${BASE}/practice`, { waitUntil: "domcontentloaded" }),
      d.goto(`${BASE}/vocabulary`, { waitUntil: "domcontentloaded" }),
    ]);
    const okC = await waitToken(c, true, 15000);
    const okD = await waitToken(d, true, 15000);
    check(
      "No false logout when two fresh tabs refresh concurrently (Web Locks serialization)",
      okC && okD,
      `C=${okC} D=${okD}`
    );

    // ── PHASE 5: logout propagation ────────────────────────────────────────
    // Originate logout from an authenticated, non-reloaded tab.
    let origin = null;
    for (const p of [b, c, d, a]) {
      if (await p.evaluate((k) => !!sessionStorage.getItem(k), TOKEN_KEY)) {
        if ((await p.locator('header a[href="/login"]').count()) === 0) {
          origin = p;
          break;
        }
      }
    }
    const observer = [a, b, c, d].find((p) => p !== origin);
    if (!origin) {
      check("Logout propagation (could not find an authenticated origin tab)", false);
    } else {
      await origin.locator("header button:not([aria-label])").first().click();
      await origin.getByRole("button", { name: "Đăng xuất" }).click();
      const observerCleared = await waitToken(observer, false, 10000);
      const observerLoginLink = await loginLinkCount(observer);
      check(
        "Logout in one tab propagates: other tab clears token",
        observerCleared,
        `tokenCleared=${observerCleared}`
      );
      check(
        "Logout in one tab propagates: other tab UI shows login again",
        observerLoginLink > 0,
        `loginLinks=${observerLoginLink}`
      );
    }
  } catch (err) {
    console.error("E2E ERROR:", err && err.message ? err.message : err);
    results.push({ name: "script-exception", pass: false });
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n==== ${results.length - failed}/${results.length} checks passed ====`);
  process.exit(failed ? 1 : 0);
})();
