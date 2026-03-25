---
name: poker-state-modeling
description: Build and validate Texas Hold'em table state, seat mapping, betting rounds, and action event normalization. Use when modeling poker hand flow, pot updates, stack changes, and player history context.
---

# Poker State Modeling

## Purpose

把线下牌局输入稳定映射为可计算的数据状态，确保后续胜率与建议引擎输入一致。

## When To Use

- 用户提到：座位、位置、盲注、补码、行动记录
- 需要从自然语言或按钮行为转为结构化事件
- 需要校验一手牌的合法状态流转

## Core Workflow

1. 初始化牌桌
   - players: 2-10
   - blinds: default 100/100, 可自定义
   - seats: seat_id -> player_id
2. 初始化一手牌状态
   - street: preflop
   - hero_hole_cards / board_cards
   - pot / effective_stack / current_bet
3. 记录行动事件
   - action types: fold/check/call/raise/all-in
   - amount: 对于 raise/all-in 记录目标金额
   - source: button/nlp
4. 校验与归一化
   - 非法行动拒绝（如未到行动顺位）
   - raise 缺省值走默认倍率（2x）后可手改
5. 更新派生状态
   - pot、remaining_stack、side_pot
   - players_in_hand、aggressor、last_action
6. 进入下一街
   - preflop -> flop -> turn -> river -> showdown

## Required Data Objects

- `TableConfig`
- `PlayerProfile`
- `HandState`
- `ActionEvent`
- `PlayerStatsSnapshot`

## Validation Checklist

- [ ] 任意 action 都有 actor、street、timestamp
- [ ] 盲注和补码影响 stack 计算正确
- [ ] 翻牌圈前后行动顺序合法
- [ ] 所有金额单位一致

## Output Contract

输出必须包含：

- 当前 `HandState`
- 规范化 `ActionEvent[]`
- 面向建议引擎的 `DecisionContext`
