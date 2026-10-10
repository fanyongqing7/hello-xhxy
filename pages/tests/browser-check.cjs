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
      assert.match(decodeURI(await page.locator(".resource-row").getAttribute("href")), /java-guide\/chapter-08\.html/);
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
    // 问答页必须默认关闭，键盘可展开，搜索与原有章节深链接可以配合使用。
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(new URL("java-guide/index.html", root).href);
    assert.equal(await page.locator(".qa-item").count(), 0);
    assert.equal(await page.locator(".chapter-card").count(), 11);
    // 所有独立页面各含一章，来源页没有题目但不能出现搜索空态。
    let total = 0;
    for (let chapter = 1; chapter <= 11; chapter++) {
      await page.goto(new URL("java-guide/chapter-" + String(chapter).padStart(2, "0") + ".html", root).href);
      assert.equal(await page.locator(".qa-chapter").count(), 1);
      assert.equal(await page.locator('.chapter-menu a[aria-current="page"]').count(), 1);
      assert.equal(await page.locator(".qa-item[open]").count(), 0);
      assert(!(await page.locator("#qa-empty").isVisible()));
      total += await page.locator(".qa-item").count();
    }
    assert.equal(total, 1405);
    await page.goto(new URL("java-guide/chapter-01.html", root).href);
    const questionCount = await page.locator(".qa-item").count();
    assert.equal(questionCount, 148);
    assert.equal(await page.locator(".qa-item[open],.qa-follow[open]").count(), 0);
    await page.locator("#q-1>summary").focus();
    await page.keyboard.press("Enter");
    assert(await page.locator("#q-1>.qa-answer").isVisible());
    await page.locator("#q-1 .qa-follow>summary").click();
    assert(await page.locator("#q-1 .qa-follow-answer").isVisible());
    await page.locator("#qa-collapse").click();
    assert.equal(await page.locator(".qa-item[open],.qa-follow[open]").count(), 0);
    await page.locator("#qa-search").fill("ＪＶＭ");
    await page.waitForFunction(() => document.querySelector("#qa-status").textContent.startsWith("找到"));
    const found = await page.locator(".qa-item:not([hidden])").count();
    assert(found > 0 && found < questionCount);
    await page.locator("#qa-search").fill("<script>__nothing__");
    await page.locator("#qa-empty").waitFor({ state: "visible" });
    await page.locator("#qa-clear").click();
    assert.equal(await page.locator(".qa-item:not([hidden])").count(), questionCount);
    await page.goto(new URL("java-guide/index.html#q-1405", root).href);
    await page.waitForURL(/chapter-10\.html/);
    await page.waitForFunction(() => document.querySelector("#q-1405").open);
    await page.locator("#qa-search").fill("__nothing__");
    await page.locator("#qa-empty").waitFor({ state: "visible" });
    await page.locator('.chapter-menu a[href="./chapter-08.html"]').click();
    await page.waitForURL(/chapter-08\.html/);
    assert.equal(await page.locator("#qa-search").inputValue(), "");
    assert(await page.locator('[id="八ai-应用开发与-ai-编程"]').isVisible());
    await page.evaluate(() => { location.hash = "%invalid"; });
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "QA overflow at " + width);
    }
    // 关闭脚本也仍有完整问答，而且答案默认收起。
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noScript.newPage();
    await staticPage.goto(new URL("java-guide/index.html", root).href);
    await staticPage.locator('.chapter-card[href="./chapter-01.html"]').click();
    assert.equal(await staticPage.locator(".qa-item[open]").count(), 0);
    await staticPage.locator("#q-1>summary").click();
    assert(await staticPage.locator("#q-1>.qa-answer").isVisible());
    await noScript.close();
    console.log("PASS 11 chapter pages, 1405 questions, legacy redirects, QA, search, mobile, no-JS");
    assert.deepEqual(errors, []);
    console.log("PASS preview selection, URL allowlist, mobile toggle; zero JS errors");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
