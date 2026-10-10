# hello-xhxy

[访问 Hello Guide 首页](https://fanyongqing7.github.io/hello-xhxy/)

[阅读 JavaGuide 面试知识体系](./java-guide/)

## 维护首页

- `index.html`：首页结构与学习路径。
- `assets/home.css`：配色、排版、响应式布局和动效。
- `assets/home.js`：`guideTopics` 维护主题名称、分类、关键词与文档锚点；新增条目会自动进入卡片、搜索、分类和统计。
- 新增同一文档内的章节时，先在文档中加入标题与目录，再补充对应主题记录。
- 新增独立文档或其他资源时，将记录中的 `anchor` 替换为 `href`，填入相对路径（如 `./new-guide/`）或 HTTPS 地址。
- 使用 `node --test tests/home.test.cjs` 运行搜索边界与主题链接测试。
- 推送到 `main` 后，GitHub Pages 自动构建发布；正文继续在 `/java-guide/` 阅读。
