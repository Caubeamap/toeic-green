/* Multi-screen FPS / jank measurement during real interactions.
 * At 60FPS the frame budget is 16.7ms; a frame longer than that on a 60Hz display is a
 * dropped frame. Headless rAF is uncapped (idle frames ~5-8ms), so frames >16.7ms during
 * an interaction reliably indicate main-thread jank. We report: jankFrames (>16.7ms),
 * worstFrame (ms), longTasks (>50ms), TBT. Auth pages run on DEV 6868 (login works) — a
 * conservative bound since dev has extra overhead vs production.
 */
const { chromium } = require("playwright");
const BASE = process.env.E2E_BASE || "http://localhost:6868";
const EMAIL = process.env.E2E_EMAIL;
const PASS = process.env.E2E_PASS;
const REVIEW_SLUG = "tu-vung-tieng-anh-van-phong";
const TEST_SLUG = "practice-toeic-test-2";
const RESULT = process.env.E2E_RESULT || "/practice/ets-2026-test-10/results/e708491b-67b5-4bf6-9f88-3d89b48fbfe8";

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByText("Chào mừng trở lại").waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.locator('form button[type="submit"]').click();
  await page.waitForFunction(
    () => !location.pathname.startsWith("/login") && document.querySelectorAll('header a[href="/login"]').length === 0,
    undefined, { timeout: 20000 });
}

// Run `interact` (async, drives the page) while recording frames + long tasks.
async function record(page, durationMs) {
  return page.evaluate((durationMs) => new Promise((resolve) => {
    const deltas = []; let last = performance.now(); let running = true;
    let longTasks = 0, tbt = 0, po;
    try { po = new PerformanceObserver((l) => { for (const e of l.getEntries()) { longTasks++; tbt += Math.max(0, e.duration - 50); } }); po.observe({ entryTypes: ["longtask"] }); } catch {}
    function tick(now) { deltas.push(now - last); last = now; if (running) requestAnimationFrame(tick); }
    requestAnimationFrame((t) => { last = t; requestAnimationFrame(tick); });
    setTimeout(() => {
      running = false; if (po) po.disconnect();
      const d = deltas.slice(1);
      const jank = d.filter((x) => x > 16.7).length;
      const worst = d.length ? Math.max(...d) : 0;
      resolve({ frames: d.length, jankFrames: jank, worstFrame: Math.round(worst), longTasks, tbt: Math.round(tbt) });
    }, durationMs);
  }), durationMs);
}

// Programmatic scroll loop (drives layout/paint) for the duration.
async function autoScroll(page, ms) {
  await page.evaluate((ms) => {
    const end = performance.now() + ms; let dir = 1;
    function step() {
      if (performance.now() > end) return;
      const y = window.scrollY; window.scrollBy(0, 40 * dir);
      if (window.scrollY === y) dir = -dir; // bounce at edges
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, ms).catch(() => {});
}

const results = [];
async function measureScreen(page, name, durationMs, interact) {
  const p = interact ? interact() : autoScroll(page, durationMs);
  const m = await record(page, durationMs);
  await p?.catch?.(() => {});
  const verdict = m.jankFrames === 0 && m.longTasks === 0 ? "✅ smooth" : (m.longTasks > 0 ? "⚠️ long-tasks" : "• minor");
  results.push({ name, ...m, verdict });
  console.log(`${verdict.padEnd(14)} | ${name.padEnd(28)} jankFrames=${m.jankFrames} worst=${m.worstFrame}ms longTasks=${m.longTasks} TBT=${m.tbt}ms (frames=${m.frames})`);
}

(async () => {
  if (!EMAIL || !PASS) { console.error("Missing creds"); process.exit(2); }
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
  const ctx = await browser.newContext();
  try {
    const page = await ctx.newPage();
    await login(page);

    // 1. Home scroll
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(2500);
    await measureScreen(page, "Home (scroll)", 4000);

    // 2. Practice catalog scroll
    await page.goto(`${BASE}/practice`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(2500);
    await measureScreen(page, "Practice catalog (scroll)", 4000);

    // 3. Vocabulary list scroll
    await page.goto(`${BASE}/vocabulary`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(2800);
    await measureScreen(page, "Vocabulary list (scroll)", 4000);

    // 4. Explore collection words scroll (533-word collection, paginated)
    await page.goto(`${BASE}/explore/${REVIEW_SLUG}`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(2800);
    await measureScreen(page, "Explore words (scroll)", 4000);

    // 5. Flashcard review flip
    await page.goto(`${BASE}/explore/${REVIEW_SLUG}/review`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(3000);
    await measureScreen(page, "Flashcard (flip)", 4000, () => (async () => {
      const t = page.getByRole("button", { name: /Xem nghĩa|Ẩn nghĩa/ });
      for (let i = 0; i < 6; i++) { await t.click({ timeout: 800 }).catch(() => {}); await page.waitForTimeout(600); }
    })());

    // 6. Result review: navigate questions + scroll
    await page.goto(`${BASE}${RESULT}`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(3000);
    await measureScreen(page, "Result review (nav+scroll)", 4000, () => (async () => {
      const next = page.getByRole("button", { name: /Câu tiếp/ });
      for (let i = 0; i < 6; i++) { await next.first().click({ timeout: 800 }).catch(() => {}); await page.waitForTimeout(550); }
    })());

    // 7. Exam screen: audio playing + answer clicks (the previously-fixed hot path)
    await page.goto(`${BASE}/practice/${TEST_SLUG}/test?mode=full`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(3500);
    await page.evaluate(() => { const a = document.querySelector("audio"); if (a) { a.muted = true; const p = a.play(); if (p&&p.catch) p.catch(()=>{}); } });
    await measureScreen(page, "Exam (audio+answer)", 5000, () => (async () => {
      for (let i = 0; i < 6; i++) { await page.getByRole("button", { name: "A", exact: true }).first().click({ timeout: 800 }).catch(() => {}); await page.waitForTimeout(700); }
    })());

  } catch (err) {
    console.error("ERROR:", err && err.message ? err.message : err);
  } finally {
    await browser.close();
  }
  const bad = results.filter((r) => r.longTasks > 0 || r.jankFrames > 3);
  console.log(`\n==== ${results.length - bad.length}/${results.length} screens smooth (≤3 jank frames, 0 long-tasks) ====`);
  if (bad.length) console.log("Needs work: " + bad.map((b) => b.name).join(", "));
})();
