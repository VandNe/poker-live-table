---
name: strategy-advice-engine
description: Generate explainable poker recommendations from hand state, board texture, position, and opponent behavior. Use when producing fold/call/raise/all-in advice with fast and accurate modes.
---

# Strategy Advice Engine

## Purpose

基于当前牌局状态，输出可解释的动作建议，并提供主引擎与备引擎两套结果。

## When To Use

- 用户请求实时建议
- 需要展示胜率、成牌概率、建议动作与下注区间
- 需要结合对手历史行为调整建议置信度

## Inputs

- `DecisionContext`（来自状态建模 skill）
- 英雄位置信息（BTN/SB/BB/UTG/...）
- 玩家画像与历史统计（可为空）
- 运行模式：`fast` 或 `accurate`

## Engine Policy

1. **Fast Mode（主）**
   - 小样本 Monte Carlo + 启发式规则
   - 目标：1-2 秒内返回
2. **Accurate Mode（备）**
   - 更高样本 Monte Carlo + 范围修正
   - 可异步返回，覆盖 fast 结果

## Recommendation Output

输出结构必须包含：

- `recommended_action`: fold/check/call/raise/all-in
- `size_hint`: 建议金额或区间
- `win_rate_estimate`: 胜率估计
- `draw_probability`: 成牌概率
- `confidence`: 置信度
- `reasons`: 3-5 条解释（位置、赔率、牌面纹理、对手倾向）
- `mode`: fast/accurate

## Opponent Context Rules

- 若对手历史出现高频诈唬成功，降低其 all-in 的可信强度权重
- 若对手为紧凶且持续施压，提高强范围假设权重
- 行为样本不足时，标注低置信度并回退默认模型

## Safety Rules

- 不输出“必胜”或绝对化语言
- 所有建议必须显示“这是概率建议而非保证”
- 信息不足时优先建议保守线并提示补充输入
