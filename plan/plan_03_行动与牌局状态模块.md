---
level: 2
file_id: plan_03
parent: plan_01
status: pending
created: 2026-03-25 11:34
children: [plan_03_1, plan_03_2, plan_03_3]
estimated_time: 420分钟
---

# 模块：行动与牌局状态模块

## 目标
- 建立 preflop/flop/turn/river 状态机。
- 将按钮输入与自然语言输入统一为 ActionEvent。
- 维护 pot、toCall、有效筹码、在局玩家。

## 子任务
- `plan_03_1` HandState 与 ActionEvent 数据模型
- `plan_03_2` 行动合法性校验与状态流转
- `plan_03_3` 底池与筹码更新逻辑

## 验收
- [ ] 可完整记录一手牌全过程
- [ ] 行动顺序和阶段推进正确
- [ ] 底池与待跟注金额可追踪
