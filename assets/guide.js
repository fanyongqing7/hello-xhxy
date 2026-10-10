"use strict";

// 内容已经是原生折叠 HTML；脚本仅增强检索、目录跳转和批量收起。
const qaSearch = document.querySelector("#qa-search");
const normalize = text => text.normalize("NFKC").toLowerCase();
const questions = [...document.querySelectorAll(".qa-item")].map(element => ({
  element,
  text: normalize(element.textContent + " " + (element.closest(".qa-topic")?.querySelector("h3")?.textContent || "") + " " + element.closest(".qa-chapter").querySelector("h2").textContent)
}));
const groups = [...document.querySelectorAll(".qa-topic,.qa-chapter")];
const status = document.querySelector("#qa-status");
let searchTimer;

function filterQuestions() {
  clearTimeout(searchTimer);
  const terms = normalize(qaSearch.value).trim().split(/\s+/).filter(Boolean);
  let count = 0;
  questions.forEach(({ element, text }) => {
    element.hidden = !terms.every(term => text.includes(term));
    if (!element.hidden) count++;
  });
  groups.forEach(group => { group.hidden = terms.length > 0 && !group.querySelector(".qa-item:not([hidden])"); });
  document.querySelector("#qa-empty").hidden = count > 0;
  status.textContent = terms.length ? "找到 " + count + " / " + questions.length + " 个问题 · 点击展开答案" : "共 " + questions.length + " 个问题 · 先想一想，再看答案";
}
qaSearch.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(filterQuestions, 120);
});
document.querySelector("#qa-clear").addEventListener("click", () => {
  qaSearch.value = "";
  filterQuestions();
  qaSearch.focus();
});
document.querySelector("#qa-collapse").addEventListener("click", () => {
  document.querySelectorAll(".qa-item[open],.qa-follow[open]").forEach(item => { item.open = false; });
});

// 深链接先清除筛选并展开所需祖先；旧章节地址与具体题目地址都可直接访问。
function revealHash(hash, scroll = true) {
  let id;
  try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (!target) return;
  if (qaSearch.value) { qaSearch.value = ""; filterQuestions(); }
  let parent = target;
  while (parent) {
    if (parent.matches("details")) parent.open = true;
    parent = parent.parentElement;
  }
  if (scroll) requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "instant" }));
}
window.addEventListener("hashchange", () => revealHash(location.hash));
document.addEventListener("click", event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) revealHash(link.getAttribute("href"), false);
});
document.addEventListener("keydown", event => {
  if (!questions.length) return;
  if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.key === "/" && !event.target.closest("input,textarea,select,[contenteditable]")) {
    event.preventDefault();
    qaSearch.focus();
  }
  if (event.key === "Escape" && document.activeElement === qaSearch) {
    qaSearch.value = "";
    filterQuestions();
  }
});
// 总览与资料来源页没有问答，不展示空搜索框或“没有结果”提示。
if (questions.length) {
  filterQuestions();
  document.querySelector("#guide-tools").hidden = false;
}
revealHash(location.hash);
