---
level: 2
file_id: plan_04
parent: plan_01
status: pending
created: 2026-03-25 11:34
children: [plan_04_1, plan_04_2, plan_04_3]
estimated_time: 300分钟
---

# 模块：自然语言解析模块

## 目标
- 支持口语化行动描述转结构化事件。
- 主方案为模板+关键词解析，备方案为 MiniMax 增强。

## 子任务
- `plan_04_1` 文本模板语法与词表（fold/check/call/raise/all-in）
- `plan_04_2` 解析失败回退机制与人工确认
- `plan_04_3` MiniMax 可选接入（开关控制）

## 验收
- [ ] 常见短句可解析为标准事件
- [ ] 解析歧义时给出确认提示
- [ ] 可关闭云解析以节省额度
