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
  const routes = Object.create(null);
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
  // 保留全局题号和章节锚点，但将每章 HTML 独立保存，页面不再载入整本书。
  function closeChapter() {
    closeTopic();
    if (!chapter) return;
    html += '</section>\n';
    chapter.html = html.slice(chapter.start);
    for (const match of chapter.html.matchAll(/\bid="([^"]+)"/g)) routes[match[1]] = chapter.file;
  }
  // 用 Markdown token 划分问答，避免把代码块内的 Q 或标题当成真实题目。
  for (const token of markdown.lexer(clean)) {
    if (token.type === "heading") {
      flushQuestion();
      if (token.depth === 1) continue;
      if (token.depth === 2) {
        skipToc = token.text === "目录";
        if (skipToc) continue;
        closeChapter();
        chapter = { title: token.text, id: headingId(token.text), count: 0, start: html.length, file: "chapter-" + String(chapters.length + 1).padStart(2, "0") + ".html" };
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
  closeChapter();
  if (!count) throw new Error("文档没有问答，停止生成以防覆盖已有页面");
  const nav = chapters.map((item, index) => '<a href="./' + item.file + '"><span>' + String(index + 1).padStart(2, "0") + '</span><span>' + escape(item.title.replace(/^[一二三四五六七八九十]+、/, "")) + '</span><small>' + (item.count || '↗') + '</small></a>').join("\n");
  // 正文若引用其他章的锚点，也随拆页更新，避免只有目录能跳转。
  chapters.forEach(page => {
    page.html = page.html.replace(/href="#([^"]+)"/g, (link, id) => routes[id] ? 'href="./' + routes[id] + '#' + id + '"' : link);
  });
  return { html, intro: render(intro), nav, count, chapters: chapters.length, pages: chapters, routes };
}

async function build() {
  const result = await renderGuide(fs.readFileSync(path.join(root, "..", "JavaGuide_面试知识体系.md"), "utf8"));
  const template = fs.readFileSync(path.join(__dirname, "guide-template.html"), "utf8");
  const fill = data => template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!Object.hasOwn(data, key)) throw new Error("模板变量缺失：" + key);
    return data[key];
  });
  const overview = '<div class="chapter-cards">' + result.pages.map((page, index) => '<a class="chapter-card" href="./' + page.file + '"><span class="section-label">CHAPTER / ' + String(index + 1).padStart(2, "0") + '</span><h2>' + escape(page.title) + '</h2><p>' + (page.count ? page.count + ' 个问题 · 答案默认收起' : '参考链接与资料边界') + '</p><span>进入阅读 ↗</span></a>').join('') + '</div>';
  const common = { ...result, pageClass: "", pageTitle: "JavaGuide 问答花园", heading: "选一个章节，<br>让理解<span>逐页生长。</span>", description: "每次专注一个方向。选择章节，进入独立的问答页面。", countLabel: "全书问题", pagination: "", redirectScripts: '<script src="./routes.js" defer></script><script src="../assets/guide-index.js" defer></script>' };
  const outputs = new Map([["index.html", fill({ ...common, html: overview })]]);
  result.pages.forEach((page, index) => {
    const previous = result.pages[index - 1], next = result.pages[index + 1];
    const pagination = '<nav class="chapter-pagination" aria-label="前后章节"><a href="' + (previous ? './' + previous.file : './index.html') + '">← ' + (previous ? escape(previous.title) : '章节总览') + '</a><a href="' + (next ? './' + next.file : './index.html') + '">' + (next ? escape(next.title) : '章节总览') + ' →</a></nav>';
    outputs.set(page.file, fill({ ...common, html: page.html, count: page.count, countLabel: "本章问题", pageClass: "chapter-page", pageTitle: escape(page.title), heading: escape(page.title), description: "先尝试回答，再展开对照。读完这一章，继续下一个方向。", nav: result.nav.replace('href="./' + page.file + '"', 'href="./' + page.file + '" aria-current="page"'), pagination, redirectScripts: "" }));
  });
  outputs.set("routes.js", '// Generated by scripts/build-guide.cjs. 兼容旧的章节、子节和题目链接。\nconst guideRoutes = ' + JSON.stringify(result.routes) + ';\n');
  const directory = path.join(root, "java-guide");
  fs.mkdirSync(directory, { recursive: true });
  // 先检查全部目标，再逐个原子替换；不得覆盖同目录中的人工页面。
  for (const name of outputs.keys()) {
    const destination = path.join(directory, name);
    if (fs.existsSync(destination) && !fs.readFileSync(destination, "utf8").includes("Generated by scripts/build-guide.cjs")) throw new Error("目标文件不是生成文件，拒绝覆盖：" + destination);
  }
  for (const [name, output] of outputs) {
    const destination = path.join(directory, name);
    fs.writeFileSync(destination + ".tmp", output);
    fs.renameSync(destination + ".tmp", destination);
  }
  console.log("Generated pages/java-guide: overview + " + result.chapters + " chapter pages; " + result.count + " questions");
}
if (require.main === module) build().catch(error => { console.error("build-guide: " + error.message); process.exitCode = 1; });
module.exports = { renderGuide };
