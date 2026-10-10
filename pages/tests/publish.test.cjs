const { test } = require("node:test");
const assert = require("node:assert/strict");
const { selectSiteEntries } = require("../scripts/publish-pages.cjs");

// 发布边界必须排除前端工具和其他目录，缺少页面时停止而非发布残缺站点。
test("只发布 pages 的完整静态目录", () => {
  const names = [".nojekyll", "index.html", "assets", "designs", "java-guide", "scripts", "tests", "package.json", "other-project"];
  const tree = names.map(name => "100644 blob " + "a".repeat(40) + "\t" + name).join("\n");
  const output = selectSiteEntries(tree);
  assert.equal(output.trim().split("\n").length, 5);
  assert.doesNotMatch(output, /scripts|tests|package\.json|other-project/);
  assert.throws(() => selectSiteEntries(""), /缺少必需/);
});
