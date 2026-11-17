// Run against a local Jekyll preview with Playwright available to Node.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:4000/academicpages.github.io/';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && /\/assets\/(js|models)\//.test(response.url())) errors.push(response.url());
    });
    assert.equal((await page.goto(base, { waitUntil: 'domcontentloaded' })).status(), 200);
    assert.equal(await page.locator('.archive-boot').isVisible(), true);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.boot-skip').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    await page.locator('.archive-boot').waitFor({ state: 'hidden' });
    await page.locator('.archive-scene.is-ready').waitFor({ timeout: 45000 });
    await page.waitForTimeout(1800);
    assert.equal(await page.locator('[data-file]').count(), 2);
    assert.equal(await page.locator('.archive-reader').isVisible(), false);

    for (const id of ['profile', 'research']) {
      const box = await page.locator(`#${id}`).boundingBox();
      assert(box.y >= 0 && box.y + box.height < 1000, `${id} must be on the initial screen`);
    }
    assert.equal(await page.evaluate(() => scrollY), 0);
    // Orbit input reaches the real canvas, and controls work independently of file navigation.
    assert.equal(await page.evaluate(() => document.elementFromPoint(600, 450).tagName), 'CANVAS');
    await page.mouse.move(600, 450);
    await page.mouse.down();
    await page.mouse.move(720, 500, { steps: 12 });
    assert.equal(await page.locator('.archive-scene.is-dragging').count(), 1);
    await page.mouse.up();
    await page.locator('[data-scene-action="zoom-in"]').click();
    await page.locator('[data-scene-action="zoom-out"]').click();
    await page.locator('[data-scene-action="reset"]').click();
    console.log('PASS: 3D loading, drag, zoom and reset');

    await page.locator('.archive-access').click();
    assert.equal(await page.locator('.archive-document:visible').getAttribute('id'), 'publications');
    assert.equal(await page.locator('#publications .paper em').count(), 5);
    assert(!(await page.locator('#publications').innerText()).includes('Accepted'));
    await page.locator('.archive-reader-scroll').evaluate(el => { el.scrollTop = el.scrollHeight; });
    const lastPaper = await page.locator('#publications .paper').last().boundingBox();
    assert(lastPaper.y + lastPaper.height < 805, 'Last paper must be readable within the scroll area');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.archive-overview').isVisible(), true);
    assert.equal(await page.locator('.archive-access').evaluate(el => el === document.activeElement), true);

    await page.locator('[data-file="internships"]').click();
    assert.equal(await page.locator('#archive-preview-title').innerText(), 'Internships');
    await page.locator('.archive-access').click();
    assert.equal(await page.locator('#internships .timeline__item').count(), 2);
    assert.equal(await page.locator('#internships .timeline__content > p:not(.timeline__company)').count(), 0);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.archive-document:visible').getAttribute('id'), 'publications');
    await page.goBack();
    assert.equal(await page.locator('.archive-overview').isVisible(), true);
    console.log('PASS: selection, reading, preserved content, Escape and browser history');

    for (const width of [1024, 768, 600, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.locator('#profile').isVisible(), true);
      assert.equal(await page.locator('#research').isVisible(), true);
      await page.locator('.archive-access').click();
      await page.waitForTimeout(600);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}px`);
      const lines = await page.locator('#research h3').evaluateAll(headings => headings.map(heading => {
        const range = document.createRange();
        range.selectNodeContents(heading);
        return new Set([...range.getClientRects()].map(rect => rect.top)).size;
      }));
      assert.deepEqual(lines, [1, 1, 1, 1], `Research titles at ${width}px`);
      await page.locator('.archive-back').click();
    }
    await page.locator('.archive-theme').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.reload();
    await page.locator('.archive-boot').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.deepEqual(errors, []);
    console.log('PASS: responsive layouts and persistent dark theme');
    await page.close();

    const fallback = await browser.newPage({ reducedMotion: 'reduce' });
    await fallback.route('**/*.glb', route => route.abort());
    await fallback.goto(base + '#internships');
    await fallback.locator('[data-scene="fallback"]').waitFor();
    assert.equal(await fallback.locator('#internships').isVisible(), true);
    assert.equal(await fallback.locator('.archive-inspect').isVisible(), false);
    await fallback.locator('.archive-back').click();
    assert.equal(await fallback.locator('#research').isVisible(), true);
    assert.equal(await fallback.locator('#profile').isVisible(), true);
    assert.equal(await fallback.locator('.archive-boot').isVisible(), false);
    await fallback.close();

    const staticPage = await browser.newPage({ javaScriptEnabled: false });
    await staticPage.goto(base);
    for (const file of ['publications', 'internships', 'research', 'profile']) {
      assert.equal(await staticPage.locator(`#${file}`).isVisible(), true);
    }
    await staticPage.close();
    console.log('PASS: reduced motion, unavailable 3D asset and JavaScript-free reading');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
