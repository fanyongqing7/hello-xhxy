const { execFileSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const siteFiles = [".nojekyll", "index.html", "assets", "designs", "java-guide"];

// 发布树只含静态站点；脚本、测试、内容源和其他同级项目都不会进入公网目录。
function selectSiteEntries(tree) {
  const lines = tree.trim().split("\n").filter(line => siteFiles.includes(line.split("\t")[1]));
  if (lines.length !== siteFiles.length) throw new Error("pages 缺少必需的静态文件，请先构建并提交");
  return lines.join("\n") + "\n";
}
function publish() {
  const git = (args, input) => execFileSync("git", args, { cwd: root, input, encoding: "utf8", timeout: 25000, stdio: ["pipe", "pipe", "pipe"] }).trim();
  if (git(["status", "--porcelain", "--", "pages"])) throw new Error("pages 有未提交修改，请先构建、检查并提交，再发布");
  console.log("读取已提交的 pages 静态文件…");
  const tree = git(["mktree"], selectSiteEntries(git(["ls-tree", "HEAD:pages"])));
  console.log("同步 gh-pages 发布分支…");
  git(["fetch", "origin", "gh-pages"]);
  const parent = git(["rev-parse", "FETCH_HEAD"]);
  const commit = git(["commit-tree", tree, "-p", parent, "-m", "Publish pages from " + git(["rev-parse", "--short", "HEAD"])]);
  // 普通快进推送；远端若已变化则失败，不强行覆盖其他人的发布。
  console.log("发布静态站点…");
  git(["push", "origin", commit + ":refs/heads/gh-pages"]);
  console.log("已推送 gh-pages，等待 GitHub Pages 构建完成。");
}
if (require.main === module) {
  try { publish(); } catch (error) {
    console.error("publish-pages: " + (error.stderr?.toString().trim() || error.message));
    process.exitCode = 1;
  }
}
module.exports = { selectSiteEntries };
