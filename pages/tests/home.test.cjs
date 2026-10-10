const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { guideSubjects, guideResources } = require("../assets/catalog.js");

// 检查主题与资源的关联，以及已收录章节链接；独立文档允许使用不同路径。
test("主题与资源 ID 唯一，所有章节入口有效", () => {
  const markdown = readFileSync(join(__dirname, "../../JavaGuide_面试知识体系.md"), "utf8");
  const subjects = new Set(guideSubjects.map(subject => subject.id));
  assert.equal(subjects.size, guideSubjects.length);
  assert.equal(new Set(guideResources.map(resource => resource.id)).size, guideResources.length);
  for (const resource of guideResources) {
    assert.ok(subjects.has(resource.subjectId));
    assert.ok(resource.title && resource.description && resource.tags.length);
    const url = new URL(resource.href, "https://fanyongqing7.github.io/hello-xhxy/");
    assert.equal(url.protocol, "https:");
    if (url.pathname.endsWith("/java-guide/")) {
      assert.ok(markdown.includes("](#" + decodeURIComponent(url.hash.slice(1)) + ")"), resource.href);
    } else if (resource.href.startsWith("java-guide/")) {
      const html = readFileSync(join(__dirname, "..", resource.href), "utf8");
      assert.equal((html.match(/class="qa-chapter"/g) || []).length, 1, resource.href);
    }
  }
});
