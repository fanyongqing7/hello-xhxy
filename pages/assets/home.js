"use strict";

// 正式首页与三份设计预览共用此控制器，新增主题不需要改布局或分支判断。
function initializeLibrary() {
  const search = document.querySelector("#library-search");
  const select = document.querySelector("#subject-select");
  const grid = document.querySelector("#subject-grid");
  const list = document.querySelector("#resource-list");
  const count = document.querySelector("#library-count");
  const empty = document.querySelector("#library-empty");
  const base = new URL(document.body.dataset.siteRoot || "./", location.href);
  if (!search || !select || !grid || !list) return;

  // 统一以 textContent 插入可维护的数据，避免标题、标签被解析为 HTML。
  function node(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function chooseSubject(id, focusDirectory = false) {
    select.value = id;
    search.value = "";
    render();
    if (focusDirectory) document.querySelector("#resource-title").focus();
  }
  guideSubjects.forEach(subject => {
    const option = node("option", "", subject.name);
    option.value = subject.id;
    select.append(option);
    document.querySelectorAll("[data-subject-nav]").forEach(nav => {
      const button = node("button", "subject-nav-button", subject.name);
      button.type = "button";
      button.dataset.subject = subject.id;
      button.addEventListener("click", () => chooseSubject(subject.id, true));
      nav.append(button);
    });
  });

  function render() {
    const resources = filterResources(guideResources, guideSubjects, search.value, select.value);
    const matches = guideSubjects.filter(subject =>
      (select.value === "all" || select.value === subject.id) &&
      (!search.value.trim() || resources.some(resource => resource.subjectId === subject.id))
    );
    grid.replaceChildren(...matches.map(subject => {
      const card = node("button", "subject-card");
      card.type = "button";
      card.dataset.subject = subject.id;
      card.setAttribute("aria-label", "浏览" + subject.name + "目录");
      card.setAttribute("aria-controls", "resource-list");
      const top = node("div", "subject-top");
      top.append(node("span", "subject-symbol", subject.symbol), node("span", "subject-english", subject.english), node("span", "subject-arrow", "↗"));
      card.append(top, node("h3", "subject-name", subject.name), node("p", "subject-description", subject.description));
      const tags = node("div", "subject-tags");
      subject.tags.forEach(tag => tags.append(node("span", "", tag)));
      const footer = node("div", "subject-footer");
      const size = guideResources.filter(resource => resource.subjectId === subject.id).length;
      footer.append(node("span", "", size ? size + " 个内容入口" : "内容待整理"), node("span", "", "浏览目录 →"));
      card.append(tags, footer);
      card.addEventListener("click", () => chooseSubject(subject.id, true));
      return card;
    }));
    list.replaceChildren(...resources.map((resource, index) => {
      const link = node("a", "resource-row");
      link.href = new URL(resource.href, base).href;
      const info = node("div", "resource-info");
      info.append(node("h3", "", resource.title), node("p", "", resource.description));
      const subject = guideSubjects.find(item => item.id === resource.subjectId);
      const meta = node("div", "resource-meta", [subject?.name, resource.source, resource.type].filter(Boolean).join(" / "));
      info.append(meta);
      link.append(node("span", "resource-number", String(index + 1).padStart(2, "0")), info, node("span", "resource-arrow", "↗"));
      return link;
    }));
    empty.hidden = resources.length > 0;
    count.textContent = matches.length + " 个主题 · " + resources.length + " 个内容入口";
    const selected = guideSubjects.find(subject => subject.id === select.value);
    document.querySelector("#resource-title").textContent = selected ? selected.name + " · 内容目录" : "全部内容目录";
    document.querySelectorAll("[data-subject-nav] button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.subject === select.value)));
  }
  select.addEventListener("change", render);
  search.addEventListener("input", render);
  document.querySelector("#library-reset").addEventListener("click", () => {
    chooseSubject("all");
    search.focus();
  });
  document.querySelectorAll("[data-show-subject]").forEach(link => {
    link.addEventListener("click", () => chooseSubject(link.dataset.showSubject));
  });
  // 不接管输入法、表单及组合键；减少动效由样式中的系统偏好规则统一处理。
  document.addEventListener("keydown", event => {
    if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.key === "/" && !event.target.closest("input,textarea,select,[contenteditable]")) {
      event.preventDefault();
      search.focus();
    }
    if (event.key === "Escape" && document.activeElement === search) {
      search.value = "";
      render();
    }
  });
  document.querySelectorAll("[data-subject-count]").forEach(element => { element.textContent = guideSubjects.length; });
  document.querySelectorAll("[data-resource-count]").forEach(element => { element.textContent = guideResources.length; });
  render();
  document.querySelector("#library-controls").hidden = false;
}
if (typeof document !== "undefined") initializeLibrary();
