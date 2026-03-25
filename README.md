# Poker Live Assistant

一个面向线下德州扑克场景的实时辅助项目，目标是让你在手机上快速录入牌局信息，并获得近似实时与高精度两套建议。

## 核心定位

- 手机可用优先：先做 Web App（手机浏览器直接打开）
- 线下实时输入：支持自然语言 + 快捷按钮混合录入
- 两套决策引擎：主引擎（快）+ 备引擎（更准）
- 本地优先：默认本地存储，不依赖付费服务器

## 当前目录

- `prd/`：需求与范围文档
- `plan/`：项目计划与分解任务
- `skills/`：供 AI 协作的领域技能
- `docs/`：设计补充文档
- `prototype/`：后续原型与演示

## 推荐提示词（来自你的索引）

1. `vibe-coding-cn/i18n/zh/prompts/coding_prompts/plan提示词.md`
2. `vibe-coding-cn/i18n/zh/prompts/coding_prompts/(21,1)_你是我的顶级编程助手，我将使用自然语言描述开发需求。请你将其转换为一个结构化、专业、详细、可执行的编程任务说明文档，输出.md`
3. `vibe-coding-cn/i18n/zh/prompts/coding_prompts/项目上下文文档生成.md`

## 下一步

先阅读 `plan/project_plan.md`，确认范围后再进入实现阶段。

## 静态托管（给手机随时打开）

当前原型是纯静态网页（不依赖后端）。

如果你要用 GitHub Pages 等静态托管：

1. 把仓库设置为部署根目录（`/`），确保能访问 `/index.html`
2. `index.html` 会自动加载 `./prototype/web-app/styles.css` 和 `./prototype/web-app/script.js`

这样电脑关不关都不影响访问。
