// 一次性浏览器回归：直接读取静态文件，无需启动服务器；复用环境中的 Playwright/Chrome。
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
const root = pathToFileURL(path.resolve(__dirname, "../") + path.sep).href;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const file of ["index.html", "designs/a.html", "designs/b.html", "designs/c.html"]) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(new URL(file, root).href);
      assert.equal(await page.locator(".subject-card").count(), 2, file);
      assert.equal(await page.locator(".resource-row").count(), 9, file);
      await page.locator('.subject-card[data-subject="ai"]').click();
      assert.equal(await page.locator(".resource-row").count(), 1);
      assert.match(decodeURI(await page.locator(".resource-row").getAttribute("href")), /java-guide\/#八ai/);
      await page.locator("#subject-select").selectOption("all");
      await page.locator("#library-search").fill("Ｒｅｄｉｓ MySQL");
      assert.equal(await page.locator(".resource-row").count(), 1);
      await page.locator("#library-search").fill("<script>");
      assert(await page.locator("#library-empty").isVisible());
      await page.locator("#library-reset").click();
      assert.equal(await page.locator(".resource-row").count(), 9);
      // 覆盖装饰图形旋转后的边界，防止窄屏出现横向滚动。
      for (const width of [1440, 1024, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
        assert(dimensions.scroll <= dimensions.inner, file + " overflow at " + width + "px");
      }
      console.log("PASS", file, "responsive layout, search, reset, AI link");
    }
    for (const style of ["a", "b", "c", "__proto__", "https://example.com"]) {
      await page.goto(new URL("designs/index.html?style=" + encodeURIComponent(style), root).href);
      const selected = ["a", "b", "c"].includes(style) ? style : "a";
      assert.equal(await page.locator("#design-frame").getAttribute("src"), "./" + selected + ".html");
      await page.locator('[data-width="mobile"]').click();
      assert.match(await page.locator("#design-frame").getAttribute("class"), /mobile/);
    }
    assert.deepEqual(errors, []);
    console.log("PASS preview selection, URL allowlist, mobile toggle; zero JS errors");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
