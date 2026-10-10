"use strict";

// 一级主题独立于文档；增加主题与资源记录即可扩展所有首页方案。
const guideSubjects = [
  { id: "java", name: "Java 与后端", english: "JAVA & BACKEND", symbol: "J", description: "从语言基础到分布式系统，建立完整的后端知识体系。", tags: ["Java", "JVM", "数据库", "系统设计"] },
  { id: "ai", name: "AI 与智能应用", english: "AI & INTELLIGENCE", symbol: "AI", description: "探索大模型、智能应用与 AI 编程，从现有入门内容开始。", tags: ["人工智能", "Agent", "RAG", "AI 编程"] }
];

// href 相对站点根目录，也支持 HTTPS；内容可来自任意文档，不绑定 JavaGuide。
const guideResources = [
  {
    "id": "java",
    "title": "Java 基础与集合",
    "category": "基础能力",
    "symbol": "{ }",
    "description": "从语言特性到集合底层，理解日常代码背后的设计与取舍。",
    "tags": [
      "面向对象",
      "HashMap",
      "泛型"
    ],
    "keywords": "集合 源码 异常 反射 序列化",
    "subjectId": "java",
    "href": "java-guide/#一java-基础与集合",
    "source": "JavaGuide",
    "type": "章节"
  },
  {
    "id": "jvm",
    "title": "Java 并发、JVM 与 IO",
    "category": "核心进阶",
    "symbol": "≈",
    "description": "把线程、内存和运行时连起来，理解性能问题从哪里发生。",
    "tags": [
      "线程池",
      "JVM",
      "GC"
    ],
    "keywords": "多线程 锁 ThreadLocal IO 内存 垃圾回收",
    "subjectId": "java",
    "href": "java-guide/#二java-并发jvm-与-io",
    "source": "JavaGuide",
    "type": "章节"
  },
  {
    "id": "computer",
    "title": "操作系统与计算机网络",
    "category": "基础能力",
    "symbol": "↔",
    "description": "顺着一次请求，重新理解进程、协议与计算机协作的方式。",
    "tags": [
      "操作系统",
      "TCP/IP",
      "HTTP"
    ],
    "keywords": "进程 网络 Linux UDP DNS HTTPS",
    "subjectId": "java",
    "href": "java-guide/#三操作系统与计算机网络",
    "source": "JavaGuide",
    "type": "章节"
  },
  {
    "id": "algorithm",
    "title": "数据结构与算法",
    "category": "基础能力",
    "symbol": "[ ]",
    "description": "从结构出发选择解法，用复杂度和边界验证你的判断。",
    "tags": [
      "数据结构",
      "复杂度",
      "DFS/BFS"
    ],
    "keywords": "算法 排序 二叉树 链表 图搜索 动态规划",
    "subjectId": "java",
    "href": "java-guide/#四数据结构与算法",
    "source": "JavaGuide",
    "type": "章节"
  },
  {
    "id": "database",
    "title": "数据库与存储",
    "category": "核心进阶",
    "symbol": "▤",
    "description": "从查询到事务，从缓存到检索，掌握数据的完整流转路径。",
    "tags": [
      "MySQL",
      "Redis",
      "ES"
    ],
    "keywords": "数据库 MongoDB Elasticsearch 缓存 索引 SQL 事务",
    "subjectId": "java",
    "href": "java-guide/#五数据库mysql--redis--mongodb--es",
    "source": "JavaGuide",
    "type": "章节"
  },
  {
    "id": "architecture",
    "title": "系统设计、框架与安全",
    "category": "工程实践",
    "symbol": "⌘",
    "description": "理解框架解决的问题，建立从业务需求到系统设计的思考方式。",
    "tags": [
      "Spring",
      "系统设计",
      "安全"
    ],
    "keywords": "框架 Spring Boot MyBatis 认证 鉴权 架构",
    "subjectId": "java",
    "href": "java-guide/#六系统设计常用框架与安全",
    "source": "JavaGuide",
    "type": "章节"
  },
  {
    "id": "distributed",
    "title": "分布式、高性能与高可用",
    "category": "工程实践",
    "symbol": "⋈",
    "description": "面对跨节点协作与故障，做出有依据的性能和一致性取舍。",
    "tags": [
      "分布式",
      "消息队列",
      "高可用"
    ],
    "keywords": "一致性 微服务 RPC Kafka MQ 性能 容灾 负载均衡",
    "subjectId": "java",
    "href": "java-guide/#七分布式高性能与高可用",
    "source": "JavaGuide",
    "type": "章节"
  },
  {
    "id": "ai",
    "title": "AI 应用开发与 AI 编程",
    "category": "拓展方向",
    "symbol": "✳",
    "description": "从模型能力走向可用应用，探索 AI 开发的工作流与实践边界。",
    "tags": [
      "AI 应用",
      "RAG",
      "Agent"
    ],
    "keywords": "人工智能 大模型 LLM 提示词 编程",
    "subjectId": "ai",
    "href": "java-guide/#八ai-应用开发与-ai-编程",
    "source": "JavaGuide",
    "type": "章节"
  },
  {
    "id": "career",
    "title": "开发工具与面试准备",
    "category": "工程实践",
    "symbol": ">_",
    "description": "整理工具链与项目经验，把会做的事讲成有证据的技术表达。",
    "tags": [
      "Git",
      "开发工具",
      "面试"
    ],
    "keywords": "简历 求职 项目 Maven Docker 工具",
    "subjectId": "java",
    "href": "java-guide/#九开发工具与面试准备",
    "source": "JavaGuide",
    "type": "章节"
  }
];

// 按主题 ID 筛选，检索同时覆盖主题和资源；输入按普通文本匹配，不执行 HTML 或正则。
function filterResources(resources, subjects, query = "", subjectId = "all") {
  const normalize = value => String(value || "").normalize("NFKC").toLowerCase();
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return resources.filter(resource => {
    const subject = subjects.find(item => item.id === resource.subjectId);
    const text = normalize([resource.title, resource.description, resource.keywords, ...(resource.tags || []), subject?.name, subject?.description, ...(subject?.tags || [])].join(" "));
    return (subjectId === "all" || resource.subjectId === subjectId) && terms.every(term => text.includes(term));
  });
}

if (typeof module !== "undefined" && module.exports) module.exports = { guideSubjects, guideResources, filterResources };
