---
level: 2
file_id: plan_02
parent: plan_01
status: pending
created: 2026-03-25 11:34
children: [plan_02_1, plan_02_2, plan_02_3]
estimated_time: 360分钟
---

# 模块：牌桌与玩家模块

## 目标
- 支持 2-10 人牌桌配置、盲注配置、位置分配、补码录入。
- 支持按场次自定义玩家，并记录基础画像与行为历史。

## 子任务
- `plan_02_1` 数据结构定义（TableConfig / PlayerProfile / SeatMap）
- `plan_02_2` 牌桌配置 UI（人数、盲注、位置）
- `plan_02_3` 玩家画像与历史统计存储（本地）

## 验收
- [ ] 任意场次可快速完成牌桌与玩家初始化
- [ ] 盲注默认 100/100，支持改动
- [ ] 玩家行为统计可保存并读取
