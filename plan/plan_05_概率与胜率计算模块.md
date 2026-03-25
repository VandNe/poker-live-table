---
level: 2
file_id: plan_05
parent: plan_01
status: pending
created: 2026-03-25 11:34
children: [plan_05_1, plan_05_2, plan_05_3]
estimated_time: 480分钟
---

# 模块：概率与胜率计算模块

## 目标
- 提供主（快）备（准）两套引擎。
- 输入为当前牌局状态，输出为胜率、成牌概率、置信度。

## 子任务
- `plan_05_1` 手牌评估与牌型比较器
- `plan_05_2` Fast Monte Carlo（低采样）
- `plan_05_3` Accurate Monte Carlo（高采样 + 范围修正）

## 验收
- [ ] 主引擎延迟控制在 1-2 秒
- [ ] 备引擎结果可覆盖主结果
- [ ] 输出结构统一可供建议层消费
