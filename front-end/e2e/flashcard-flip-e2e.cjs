/* Real-browser smoke for flashcard flip + image timing.
 * Verifies: (1) SSR card paints fast, (2) clicking "Xem nghĩa" flips the card and
 * reveals meaning + example image, (3) the example image is already loaded (decoded)
 * at flip time — i.e. it appears together with the meaning, not lagging behind.
 * Login reuses the app's custom `toeic-login-attempt` event (see crosstab-e2e.cjs).
 */
const { chromium } = require("playwright");

const BASE = process.env.E2E_BASE || "http://localhost:6900";
const EMAIL = process.env.E2E_EMAIL;
const PASS = process.env.E2E_PASS;
const SLUG = process.env.E2E_SLUG || "tu-vung-tieng-anh-van-phong";
const TOKEN_KEY = "toeic-green-access-token";

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} | ${name}${detail ? " | " + detail : ""}`);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByText("Chào mừng trở lại").waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  // Drive the real login form (more realistic than the synthetic event).
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASS);
  await page.locator('form button[type="submit"]').click();
  // On success the app redirects away from /login and the header /login link is gone.
  await page.waitForFunction(
    () =>
      !location.pathname.startsWith("/login") &&
      document.querySelectorAll('header a[href="/login"]').length === 0,
    undefined,
    { timeout: 20000 }
  );
}

(async () => {
  if (!EMAIL || !PASS) {
    console.error("Missing E2E_EMAIL / E2E_PASS env");
    process.exit(2);
  }
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    page.on("console", (m) => {
      if (m.type() === "error") console.log("  [console.error]", m.text());
    });
    page.on("pageerror", (e) => console.log("  [pageerror]", e.message));
    await login(page);

    // ── Navigate to the review (flashcard) route and time first card paint ──
    const t0 = Date.now();
    await page.goto(`${BASE}/explore/${SLUG}/review`, {
      waitUntil: "domcontentloaded"
    });
    // Front face shows the word in an <h3>; wait for the flashcard section.
    const wordHeading = page.locator("section h3").first();
    try {
      await wordHeading.waitFor({ state: "visible", timeout: 25000 });
    } catch (e) {
      await page.screenshot({ path: "flip-debug.png", fullPage: true });
      const txt = await page.evaluate(() =>
        document.body.innerText.slice(0, 800)
      );
      console.log("  [debug] url:", page.url());
      console.log("  [debug] body text:", JSON.stringify(txt));
      throw e;
    }
    const cardMs = Date.now() - t0;
    // NOTE: on the dev server this includes on-demand route compilation, so it is
    // NOT representative of production. The real data path is SSR-embedded words +
    // the ~0.1s API; see the raw API timing measured separately.
    check(
      "Flashcard card renders (dev includes compile; prod is SSR)",
      cardMs < 8000,
      `${cardMs}ms (dev compile overhead included)`
    );

    // The flip toggle button.
    const toggle = page.getByRole("button", { name: /Xem nghĩa|Ẩn nghĩa/ });
    await toggle.waitFor({ state: "visible", timeout: 10000 });

    // Locate the back-face <img> (example image). It is mounted before the flip.
    const backImg = page.locator('section button[aria-pressed] img').first();
    const imgPresent = (await backImg.count()) > 0;
    check("Example image element is mounted before flip (loads in background)", imgPresent);

    // KEY METRIC: because the back face mounts immediately, the image downloads
    // WHILE the user is still reading the front. Measure how long after the card
    // appears the image is fully decoded — that is when it would appear together
    // with the meaning on flip.
    const bgStart = Date.now();
    let bgLoadMs = -1;
    try {
      await backImg.evaluate(
        (el) =>
          el.complete && el.naturalWidth > 0
            ? true
            : new Promise((res) => {
                el.addEventListener("load", () => res(true), { once: true });
              }),
        undefined
      );
      bgLoadMs = Date.now() - bgStart;
    } catch {}
    check(
      "Example image downloads in background within ~1s of card appearing",
      bgLoadMs >= 0 && bgLoadMs < 1500,
      `${bgLoadMs}ms after card visible`
    );

    // Now flip and confirm both the flip transform and meaning + decoded image.
    await toggle.click();
    const flipped = await page
      .locator("section button[aria-pressed='true']")
      .first()
      .isVisible()
      .catch(() => false);
    check("Card flips on 'Xem nghĩa' (aria-pressed=true)", flipped);

    const meaningVisible = await page
      .getByText("Định nghĩa:")
      .first()
      .isVisible()
      .catch(() => false);
    check("Meaning revealed on flip", meaningVisible);

    await page.waitForTimeout(300); // let the 200ms fade-in settle
    const imgState = await backImg.evaluate((el) => ({
      complete: el.complete,
      naturalWidth: el.naturalWidth,
      opacity: getComputedStyle(el).opacity
    }));
    check(
      "Image is decoded + fully visible (opacity 1) together with the meaning",
      imgState.complete && imgState.naturalWidth > 0 && Number(imgState.opacity) > 0.99,
      `complete=${imgState.complete} w=${imgState.naturalWidth} opacity=${imgState.opacity}`
    );

    // ── Navigate forward; with preload (current±2) the next image should be
    //    cached, so it is ready almost immediately after navigation. ──
    const next = page.getByTitle("Từ tiếp theo");
    if (await next.count()) {
      await next.click();
      const nStart = Date.now();
      let nMs = -1;
      try {
        await backImg.evaluate((el) =>
          el.complete && el.naturalWidth > 0
            ? true
            : new Promise((res) =>
                el.addEventListener("load", () => res(true), { once: true })
              )
        );
        nMs = Date.now() - nStart;
      } catch {}
      check(
        "Next word's image ready fast after navigation (preload current±2 working)",
        nMs >= 0 && nMs < 800,
        `${nMs}ms after Next`
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
