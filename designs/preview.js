"use strict";
// 仅允许三个静态预览地址，URL 参数不能注入任意 iframe 页面。
const designs = {
  a: { name: "A · 深色科技门户", description: "大标题、轨道图形、发光细节，强调探索感与技术氛围。" },
  b: { name: "B · 蓝白知识工作台", description: "侧栏、主题书架、紧凑目录，适合经常查找和阅读内容。" },
  c: { name: "C · 明快数字花园", description: "活泼拼贴、大色块与非对称构图，强调个人表达和持续生长。" }
};
const requested = new URLSearchParams(location.search).get("style");
const selected = Object.hasOwn(designs, requested) ? requested : "a";
const frame = document.querySelector("#design-frame");
frame.src = "./" + selected + ".html";
frame.title = designs[selected].name + "预览";
document.querySelector("#design-description").textContent = designs[selected].name + "：" + designs[selected].description;
document.querySelector("#open-design").href = "./" + selected + ".html";
document.querySelectorAll("[data-style]").forEach(link => {
  if (link.dataset.style === selected) link.setAttribute("aria-current", "page");
});
document.querySelectorAll("[data-width]").forEach(button => {
  button.addEventListener("click", () => {
    frame.classList.toggle("mobile", button.dataset.width === "mobile");
    document.querySelectorAll("[data-width]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
  });
});
