# hello-xhxy

[访问 Hello xhxy 首页](https://fanyongqing7.github.io/hello-xhxy/)

[比较三版首页设计](https://fanyongqing7.github.io/hello-xhxy/designs/)

[阅读 JavaGuide 章节目录](https://fanyongqing7.github.io/hello-xhxy/java-guide/)

## 目录结构

```text
hello-xhxy/
├── pages/                    # 前端页面及其工具，独立维护
│   ├── index.html            # C 版首页
│   ├── java-guide/           # 章节总览、11 个独立阅读页、旧链接映射
│   ├── assets/               # 内容数据、样式和浏览器脚本
│   ├── designs/              # 三版设计预览
│   ├── scripts/              # 问答生成器与模板
│   ├── tests/                # 数据与浏览器回归
│   └── package.json          # 前端构建命令与依赖
├── JavaGuide_面试知识体系.md   # 原始知识内容，保留维护
└── README.md
```

后续用途可在根目录新增与 `pages/` 同级的文件夹，不会被发布到网站。以下前端路径均相对 `pages/`。

## 维护首页

- `index.html`：正式首页，采用 C 版明快数字花园；按主题组织内容。
- `designs/`：保留 A / B / C 三版设计预览。
- `assets/catalog.js`：内容数据。`guideSubjects` 是一级主题，`guideResources` 是主题下的内容入口；两者通过 `subjectId` 关联。
- 新增 AI、前端等主题时，在 `guideSubjects` 添加唯一 `id`、名称、说明和标签，再给 `guideResources` 添加对应 `subjectId` 的资源；卡片、搜索、筛选和数量自动更新。
- 每个资源的 `href` 填相对站点根目录的地址（如 `ai-guide/`）或 HTTPS 地址；既能指向独立文档，也能指向文档中的章节。当前 AI 入口指向已有 JavaGuide 的 AI 章节。
- `assets/home.js` 与 `assets/library.css` 是所有方案共用的目录交互和基础样式；`designs/designs.css` 是正式首页与三版预览共享的视觉样式。
- 在仓库根目录执行 `npm --prefix pages test` 运行搜索边界、主题扩展、拆页完整性和文档链接测试。
- 环境已有 Playwright 与 Chrome 时，执行 `node pages/tests/browser-check.cjs` 检查页面交互和 320–1440px 布局；直接读取文件，不启动本地服务。
- 网站使用专用 `gh-pages` 分支，只有 `pages/index.html`、`assets/`、`designs/`、`java-guide/` 和 `.nojekyll` 会被发布。仓库内虽增加了 `pages/`，公网 URL 不增加这一层。
- 构建、测试并提交改动后，在根目录运行 `npm --prefix pages run deploy`，将已提交的前端静态文件同步到 `gh-pages`，随后 GitHub Pages 自动发布。仅推送 `main` 不会更新线上网站。

## 维护问答页

- 根目录 `JavaGuide_面试知识体系.md` 保留为维护源；`java-guide/index.html` 是章节总览，`chapter-01.html` 至 `chapter-11.html` 分别承载 9 个知识章节、深挖附录和资料来源，不要直接编辑生成页面。
- 在根目录首次执行 `npm --prefix pages install --no-package-lock`，然后运行 `npm --prefix pages run build`。修改 Markdown、生成器或模板后，都需重新构建并提交生成文件。
- 构建使用固定版本的 `marked` 开发依赖，负责保留 Markdown 的链接、代码、列表和强调格式；浏览器无此依赖，也无需联网加载外部脚本。
- `scripts/build-guide.cjs` 负责转换问答，`scripts/guide-template.html` 负责页面结构，`assets/guide.css` / `assets/guide.js` 负责阅读样式与检索。
- `**Q：问题**` 与后续 `A：答案` 生成一组原生 `details` 折叠；`**追问：**` / `**追问解答：**` 生成第二层折叠，默认均收起。
- 左侧目录、首页内容入口及前后章节导航均打开独立页面；搜索只检索本章。旧的 `/java-guide/#章节`、子节及 `#q-编号` 链接通过总览页自动转到对应新页。
- 旧链接自动转页需要 JavaScript；关闭脚本后仍可通过总览目录手动进入任意章节并折叠答案。
- 浏览器回归包含键盘展开、嵌套追问、搜索、窄屏、深链接及禁用 JavaScript 的阅读。
