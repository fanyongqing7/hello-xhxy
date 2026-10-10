# hello-xhxy

[访问 Hello xhxy 首页](https://fanyongqing7.github.io/hello-xhxy/)

[比较三版首页设计](https://fanyongqing7.github.io/hello-xhxy/designs/)

[阅读 JavaGuide 面试知识体系](./java-guide/)

## 维护首页

- `index.html`：正式首页，名称为 Hello xhxy；按主题组织内容。
- `designs/`：A 深色科技门户、B 蓝白知识工作台、C 明快数字花园，选择后再将对应风格应用到正式首页。
- `assets/catalog.js`：内容数据。`guideSubjects` 是一级主题，`guideResources` 是主题下的内容入口；两者通过 `subjectId` 关联。
- 新增 AI、前端等主题时，在 `guideSubjects` 添加唯一 `id`、名称、说明和标签，再给 `guideResources` 添加对应 `subjectId` 的资源；卡片、搜索、筛选和数量自动更新。
- 每个资源的 `href` 填相对站点根目录的地址（如 `ai-guide/`）或 HTTPS 地址；既能指向独立文档，也能指向文档中的章节。当前 AI 入口指向已有 JavaGuide 的 AI 章节。
- `assets/home.js` 与 `assets/library.css` 是所有方案共用的目录交互和基础样式；`assets/home.css` 是当前首页样式，`designs/designs.css` 是三版预览样式。
- 使用 `node --test tests/*.test.cjs` 运行搜索边界、主题扩展和文档链接测试。
- 环境已有 Playwright 与 Chrome 时，可执行 `node tests/browser-check.cjs` 检查三版交互和 320–1440px 布局；直接读取文件，不启动本地服务。
- 推送到 `main` 后，GitHub Pages 自动构建发布；正文继续在 `/java-guide/` 阅读。
