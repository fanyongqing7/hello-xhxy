const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
const escape = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// 只在构建时解析 Markdown；发布的是完整 HTML，浏览器无需下载解析器。
async function renderGuide(source) {
  const { Marked } = await import(pathToFileURL(require.resolve("marked")).href);
  const markdown = new Marked({ renderer: {
    // 原文中的 HTML 示例作为文本显示，维护注释不进入正文。
    html({ text }) { return /^\s*<!--[\s\S]*-->\s*$/.test(text) ? "" : escape(text); }
  } });
  const clean = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .replace(/{%\s*(?:raw|endraw)\s*%}/g, "");
  const toc = new Map([...clean.matchAll(/^\s*- \[([^\]]+)\]\(#([^)]+)\)/gm)].map(match => [match[1], match[2]]));
  const usedIds = new Set();
  const headingId = title => {
    const base = toc.get(title) || title.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
    let id = base, suffix = 1;
    while (usedIds.has(id)) id = base + "-" + suffix++;
    usedIds.add(id);
    return id;
  };
  let html = "", intro = "", question = null, chapter = null, topicOpen = false, skipToc = false, count = 0;
  const chapters = [];
  const render = value => markdown.parse(value);
  function flushQuestion() {
    if (!question) return;
    if (!/^A[：:]/m.test(question.answer)) throw new Error("缺少答案：" + question.title);
    count++;
    chapter.count++;
    let answer = question.answer.replace(/^A[：:]\s*/m, "");
    let followHtml = "";
    const follow = /^\*\*追问[：:]\*\*\s*/m.exec(answer);
    if (follow) {
      const rest = answer.slice(follow.index + follow[0].length);
      const followAnswer = /^\*\*追问解答[：:]\*\*\s*/m.exec(rest);
      if (!followAnswer) throw new Error("缺少追问解答：" + question.title);
      followHtml = '<details class="qa-follow"><summary><span>再想一步</span>' + markdown.parseInline(rest.slice(0, followAnswer.index).trim()) + '</summary><div class="qa-follow-answer">' + render(rest.slice(followAnswer.index + followAnswer[0].length)) + '</div></details>';
      answer = answer.slice(0, follow.index);
    }
    html += '<details class="qa-item" id="q-' + count + '"><summary><span class="question-label" aria-hidden="true">Q<small>' + String(count).padStart(4, "0") + '</small></span><span class="question-text">' + markdown.parseInline(question.title) + '</span><span class="qa-toggle" aria-hidden="true"></span></summary><div class="qa-answer"><p class="answer-label">A / 参考解答</p>' + render(answer) + followHtml + '</div></details>\n';
    question = null;
  }
  function closeTopic() { if (topicOpen) { html += '</div>\n'; topicOpen = false; } }
  // 用 Markdown token 划分问答，避免把代码块内的 Q 或标题当成真实题目。
  for (const token of markdown.lexer(clean)) {
    if (token.type === "heading") {
      flushQuestion();
      if (token.depth === 1) continue;
      if (token.depth === 2) {
        skipToc = token.text === "目录";
        if (skipToc) continue;
        closeTopic();
        if (chapter) html += '</section>\n';
        chapter = { title: token.text, id: headingId(token.text), count: 0 };
        chapters.push(chapter);
        html += '<section class="qa-chapter" id="' + escape(chapter.id) + '"><header class="chapter-heading"><span>' + String(chapters.length).padStart(2, "0") + '</span><h2>' + markdown.parseInline(token.text) + '</h2></header>\n';
        continue;
      }
      if (skipToc) continue;
      if (token.depth === 3) { closeTopic(); html += '<div class="qa-topic">'; topicOpen = true; }
      html += '<h' + token.depth + ' id="' + escape(headingId(token.text)) + '">' + markdown.parseInline(token.text) + '</h' + token.depth + '>\n';
      continue;
    }
    if (skipToc) continue;
    const match = token.type === "paragraph" && /^\*\*Q[：:](.+)\*\*[ \t]*(?:\n|$)/.exec(token.raw);
    if (match) {
      flushQuestion();
      if (!chapter) throw new Error("问答必须位于章节内：" + match[1]);
      question = { title: match[1], answer: token.raw.slice(match[0].length) };
    } else if (question && token.type !== "hr") {
      question.answer += token.raw;
    } else {
      flushQuestion();
      if (chapter) html += render(token.raw);
      else intro += token.raw;
    }
  }
  flushQuestion();
  closeTopic();
  if (chapter) html += '</section>\n';
  if (!count) throw new Error("文档没有问答，停止生成以防覆盖已有页面");
  const nav = chapters.map((item, index) => '<a href="#' + escape(item.id) + '"><span>' + String(index + 1).padStart(2, "0") + '</span><span>' + escape(item.title.replace(/^[一二三四五六七八九十]+、/, "")) + '</span><small>' + (item.count || '↗') + '</small></a>').join("\n");
  return { html, intro: render(intro), nav, count, chapters: chapters.length };
}

async function build() {
  const result = await renderGuide(fs.readFileSync(path.join(root, "JavaGuide_面试知识体系.md"), "utf8"));
  const template = fs.readFileSync(path.join(__dirname, "guide-template.html"), "utf8");
  const output = template.replace(/\{\{(html|intro|nav|count|chapters)\}\}/g, (_, key) => result[key]);
  const destination = path.join(root, "java-guide", "index.html");
  // 临时文件替换，生成或校验失败时不损坏已发布版本。
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination) && !fs.readFileSync(destination, "utf8").includes("Generated by scripts/build-guide.cjs")) throw new Error("目标文件不是生成文件，拒绝覆盖：" + destination);
  fs.writeFileSync(destination + ".tmp", output);
  fs.renameSync(destination + ".tmp", destination);
  console.log("Generated java-guide/index.html: " + result.count + " questions, " + result.chapters + " chapters");
}
if (require.main === module) build().catch(error => { console.error("build-guide: " + error.message); process.exitCode = 1; });
module.exports = { renderGuide };
