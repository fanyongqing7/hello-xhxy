const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { renderGuide } = require("../scripts/build-guide.cjs");
const { guideResources } = require("../assets/catalog.js");

// 保证原文题目、追问与附录不会在生成过程中丢失，并保持现有章节 URL。
test("完整文档的问答、追问和旧锚点均进入静态 HTML", async () => {
  const source = readFileSync(join(__dirname, "../JavaGuide_面试知识体系.md"), "utf8");
  const result = await renderGuide(source);
  assert.equal(result.count, (source.match(/^\*\*Q[：:]/gm) || []).length);
  assert.equal((result.html.match(/class="qa-follow"/g) || []).length, (source.match(/^\*\*追问解答[：:]\*\*/gm) || []).length);
  assert.equal(result.chapters, 11);
  for (const resource of guideResources) assert.ok(result.html.includes('id="' + decodeURI(resource.href.split("#")[1]) + '"'));
  assert.ok(result.html.includes("{{1,0},{-1,0},{0,1},{0,-1}}"));
  assert.ok(result.html.includes("资料来源") && result.html.includes("跨章节深挖题"));
  assert.doesNotMatch(result.html, /<details[^>]*\bopen[\s>]/);
});

test("折叠生成器保留代码和独立内容，拒绝没有答案的问答", async () => {
  const result = await renderGuide('# 标题\n\n## 章节\n\n**Q：`<script>` 是什么？**\nA：普通文本。\n\n```text\n**Q：代码里的文字不应变成题目**\n```\n\n**追问：** 为什么？\n**追问解答：** 因为它是代码。\n\n### 独立说明\n\n保留这段说明。');
  assert.equal(result.count, 1);
  assert.match(result.html, /&lt;script&gt;/);
  assert.match(result.html, /保留这段说明/);
  await assert.rejects(renderGuide('## 章节\n\n**Q：无答案？**'), /缺少答案/);
  await assert.rejects(renderGuide(''), /没有问答/);
});
