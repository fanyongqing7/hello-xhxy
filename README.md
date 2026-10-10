# hello-xhxy

[访问 Hello xhxy 首页](https://fanyongqing7.github.io/hello-xhxy/)

[比较三版首页设计](https://fanyongqing7.github.io/hello-xhxy/designs/)

[阅读 JavaGuide 面试知识体系](./java-guide/)

## 维护首页

- `index.html`：正式首页，采用 C 版明快数字花园；按主题组织内容。
- `designs/`：保留 A / B / C 三版设计预览。
- `assets/catalog.js`：内容数据。`guideSubjects` 是一级主题，`guideResources` 是主题下的内容入口；两者通过 `subjectId` 关联。
- 新增 AI、前端等主题时，在 `guideSubjects` 添加唯一 `id`、名称、说明和标签，再给 `guideResources` 添加对应 `subjectId` 的资源；卡片、搜索、筛选和数量自动更新。
- 每个资源的 `href` 填相对站点根目录的地址（如 `ai-guide/`）或 HTTPS 地址；既能指向独立文档，也能指向文档中的章节。当前 AI 入口指向已有 JavaGuide 的 AI 章节。
- `assets/home.js` 与 `assets/library.css` 是所有方案共用的目录交互和基础样式；`designs/designs.css` 是正式首页与三版预览共享的视觉样式。
- 使用 `npm test` 运行搜索边界、主题扩展、问答完整性和文档链接测试。
- 环境已有 Playwright 与 Chrome 时，可执行 `node tests/browser-check.cjs` 检查三版交互和 320–1440px 布局；直接读取文件，不启动本地服务。
- 推送到 `main` 后，GitHub Pages 自动构建发布；正文继续在 `/java-guide/` 阅读。

## 维护问答页

- `JavaGuide_面试知识体系.md` 保留为维护源；`java-guide/index.html` 是生成的完整静态页面，不要直接编辑。
- 首次构建先执行 `npm install --no-package-lock`，然后运行 `npm run build`。修改 Markdown、生成器或模板后，都需重新构建并提交生成的 HTML。
- 构建使用固定版本的 `marked` 开发依赖，负责保留 Markdown 的链接、代码、列表和强调格式；浏览器无此依赖，也无需联网加载外部脚本。
- `scripts/build-guide.cjs` 负责转换问答，`scripts/guide-template.html` 负责页面结构，`assets/guide.css` / `assets/guide.js` 负责阅读样式与检索。
- `**Q：问题**` 与后续 `A：答案` 生成一组原生 `details` 折叠；`**追问：**` / `**追问解答：**` 生成第二层折叠，默认均收起。
- 原目录中的章节锚点继续有效。`_config.yml` 排除 Markdown 源文件，避免它与 HTML 竞争同一个发布路径。
- 浏览器回归包含键盘展开、嵌套追问、搜索、窄屏、深链接及禁用 JavaScript 的阅读。
