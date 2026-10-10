const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { guideTopics, filterTopics } = require("../assets/home.js");

// 锁定用户实际会遇到的搜索边界；新增主题不需要调整固定数量断言。
test("搜索处理空白、大小写、全角输入与多个关键词", () => {
  assert.equal(filterTopics(guideTopics, "  ").length, guideTopics.length);
  assert.deepEqual(filterTopics(guideTopics, "  ＲＥＤＩＳ  mysql ").map((topic) => topic.id), ["database"]);
  assert.deepEqual(filterTopics(guideTopics, "线程池").map((topic) => topic.id), ["jvm"]);
  assert.deepEqual(filterTopics(guideTopics, "redis", "基础能力"), []);
  assert.ok(filterTopics(guideTopics, "", "基础能力").every((topic) => topic.category === "基础能力"));
  assert.deepEqual(filterTopics(guideTopics, "<script>alert(1)</script>"), []);
  assert.deepEqual(filterTopics(guideTopics, "[.*"), []);
  assert.deepEqual(filterTopics([], "java"), []);
  assert.deepEqual(filterTopics(guideTopics, "", "不存在的分类"), []);
});

// 验证数据唯一且每个入口对应文档已有目录锚点，防止扩展时引入无效导航。
test("主题元数据完整，链接均对应现有文档目录", () => {
  const markdown = readFileSync(join(__dirname, "../JavaGuide_面试知识体系.md"), "utf8");
  assert.equal(new Set(guideTopics.map((topic) => topic.id)).size, guideTopics.length);
  for (const topic of guideTopics) {
    assert.ok(topic.title && topic.description && topic.category && topic.tags.length);
    if (topic.href) {
      assert.equal(new URL(topic.href, "https://fanyongqing7.github.io/hello-xhxy/").protocol, "https:");
    } else {
      assert.ok(markdown.includes(`](#${topic.anchor})`), `缺少目录锚点：${topic.anchor}`);
    }
  }
  const html = readFileSync(join(__dirname, "../index.html"), "utf8");
  for (const [, category] of html.matchAll(/data-category-link="([^"]+)"/g)) {
    assert.ok(guideTopics.some((topic) => topic.category === category), `学习路径缺少分类：${category}`);
  }
});
