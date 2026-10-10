"use strict";

// 新增主题只需补充一条记录；分类、统计和搜索都由此数据生成。
// 当前章节使用 anchor；独立文档或外部资源可改用 href，卡片结构不需要修改。
const guideTopics = [
  { id: "java", title: "Java 基础与集合", category: "基础能力", symbol: "{ }", description: "从语言特性到集合底层，理解日常代码背后的设计与取舍。", tags: ["面向对象", "HashMap", "泛型"], keywords: "集合 源码 异常 反射 序列化", anchor: "一java-基础与集合" },
  { id: "jvm", title: "Java 并发、JVM 与 IO", category: "核心进阶", symbol: "≈", description: "把线程、内存和运行时连起来，理解性能问题从哪里发生。", tags: ["线程池", "JVM", "GC"], keywords: "多线程 锁 ThreadLocal IO 内存 垃圾回收", anchor: "二java-并发jvm-与-io" },
  { id: "computer", title: "操作系统与计算机网络", category: "基础能力", symbol: "↔", description: "顺着一次请求，重新理解进程、协议与计算机协作的方式。", tags: ["操作系统", "TCP/IP", "HTTP"], keywords: "进程 网络 Linux UDP DNS HTTPS", anchor: "三操作系统与计算机网络" },
  { id: "algorithm", title: "数据结构与算法", category: "基础能力", symbol: "[ ]", description: "从结构出发选择解法，用复杂度和边界验证你的判断。", tags: ["数据结构", "复杂度", "DFS/BFS"], keywords: "算法 排序 二叉树 链表 图搜索 动态规划", anchor: "四数据结构与算法" },
  { id: "database", title: "数据库与存储", category: "核心进阶", symbol: "▤", description: "从查询到事务，从缓存到检索，掌握数据的完整流转路径。", tags: ["MySQL", "Redis", "ES"], keywords: "数据库 MongoDB Elasticsearch 缓存 索引 SQL 事务", anchor: "五数据库mysql--redis--mongodb--es" },
  { id: "architecture", title: "系统设计、框架与安全", category: "工程实践", symbol: "⌘", description: "理解框架解决的问题，建立从业务需求到系统设计的思考方式。", tags: ["Spring", "系统设计", "安全"], keywords: "框架 Spring Boot MyBatis 认证 鉴权 架构", anchor: "六系统设计常用框架与安全" },
  { id: "distributed", title: "分布式、高性能与高可用", category: "工程实践", symbol: "⋈", description: "面对跨节点协作与故障，做出有依据的性能和一致性取舍。", tags: ["分布式", "消息队列", "高可用"], keywords: "一致性 微服务 RPC Kafka MQ 性能 容灾 负载均衡", anchor: "七分布式高性能与高可用" },
  { id: "ai", title: "AI 应用开发与 AI 编程", category: "拓展方向", symbol: "✳", description: "从模型能力走向可用应用，探索 AI 开发的工作流与实践边界。", tags: ["AI 应用", "RAG", "Agent"], keywords: "人工智能 大模型 LLM 提示词 编程", anchor: "八ai-应用开发与-ai-编程" },
  { id: "career", title: "开发工具与面试准备", category: "工程实践", symbol: ">_", description: "整理工具链与项目经验，把会做的事讲成有证据的技术表达。", tags: ["Git", "开发工具", "面试"], keywords: "简历 求职 项目 Maven Docker 工具", anchor: "九开发工具与面试准备" }
];

// 多关键词取交集，兼容大小写、全角字符与多余空格；不把输入当正则表达式。
function filterTopics(topics, query = "", category = "全部") {
  const normalize = (value) => value.normalize("NFKC").toLocaleLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return topics.filter((topic) => {
    const text = normalize([topic.title, topic.description, topic.category, ...topic.tags, topic.keywords].join(" "));
    return (category === "全部" || topic.category === category) && terms.every((term) => text.includes(term));
  });
}

function initializeGuide() {
  const search = document.querySelector("#topic-search");
  const filters = document.querySelector("#topic-filters");
  const grid = document.querySelector("#topic-grid");
  const template = document.querySelector("#topic-template");
  const result = document.querySelector("#result-count");
  const empty = document.querySelector("#empty-state");
  let category = "全部";

  const categories = ["全部", ...new Set(guideTopics.map((topic) => topic.category))];
  categories.forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    button.dataset.category = name;
    button.setAttribute("aria-pressed", String(name === category));
    button.addEventListener("click", () => { category = name; render(); });
    filters.append(button);
  });

  function render() {
    const topics = filterTopics(guideTopics, search.value, category);
    const cards = topics.map((topic) => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.href = topic.href || "./java-guide/#" + topic.anchor;
      card.dataset.category = topic.category;
      // 所有可扩展文本都通过 textContent 插入，防止内容被当成 HTML 执行。
      card.querySelector("h3").textContent = topic.title;
      card.querySelector(".topic-symbol").textContent = topic.symbol;
      card.querySelector(".topic-category").textContent = topic.category;
      card.querySelector(".topic-description").textContent = topic.description;
      card.querySelector(".topic-number").textContent = "TOPIC " + String(guideTopics.indexOf(topic) + 1).padStart(2, "0");
      topic.tags.forEach((tag) => {
        const item = document.createElement("li");
        item.textContent = tag;
        card.querySelector(".topic-tags").append(item);
      });
      return card;
    });
    grid.replaceChildren(...cards);
    empty.hidden = topics.length > 0;
    result.textContent = `显示 ${topics.length} / ${guideTopics.length} 个知识主题`;
    filters.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.category === category));
    });
  }

  search.addEventListener("input", render);
  document.querySelector("#reset-search").addEventListener("click", () => {
    category = "全部";
    search.value = "";
    render();
    search.focus();
  });
  document.querySelectorAll("[data-category-link]").forEach((link) => {
    link.addEventListener("click", () => {
      category = link.dataset.categoryLink;
      search.value = "";
      render();
    });
  });
  // 输入框和组合键不触发快捷键，避免干扰中文输入与浏览器原有操作。
  document.addEventListener("keydown", (event) => {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "/" && !event.target.closest("input, textarea, select, [contenteditable]")) {
      event.preventDefault();
      search.focus();
    }
    if (event.key === "Escape" && document.activeElement === search) {
      search.value = "";
      render();
    }
  });
  document.querySelectorAll("[data-topic-total]").forEach((node) => { node.textContent = guideTopics.length; });
  render();
  document.querySelector("#library-tools").hidden = false;
}

// 复用同一检索逻辑做 Node 原生测试，浏览器不需要模块打包或额外依赖。
if (typeof module !== "undefined" && module.exports) module.exports = { guideTopics, filterTopics };
if (typeof document !== "undefined") initializeGuide();
