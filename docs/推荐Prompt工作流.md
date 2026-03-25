# 推荐 Prompt 工作流

## 阶段 1：先计划（你当前阶段）

使用：

- `vibe-coding-cn/i18n/zh/prompts/coding_prompts/plan提示词.md`

用途：

- 只产出计划，不直接写代码
- 先锁定范围、模块和验收标准

## 阶段 2：需求结构化

使用：

- `vibe-coding-cn/i18n/zh/prompts/coding_prompts/(21,1)_你是我的顶级编程助手，我将使用自然语言描述开发需求。请你将其转换为一个结构化、专业、详细、可执行的编程任务说明文档，输出.md`

用途：

- 把聊天需求转成可执行任务说明
- 给后续编码与测试提供输入

## 阶段 3：上下文沉淀

使用：

- `vibe-coding-cn/i18n/zh/prompts/coding_prompts/项目上下文文档生成.md`

用途：

- 固化项目背景、架构和约束
- 降低后续 AI 协作跑偏概率
