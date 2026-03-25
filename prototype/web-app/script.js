const RANKS = "23456789TJQKA";
const SUITS = "shdc";

const $ = (id) => document.getElementById(id);

const SUIT_SYMBOL = { s: "♠", h: "♥", d: "♦", c: "♣" };
const SUIT_CLASS = { s: "suit-black", c: "suit-black", h: "suit-red", d: "suit-red" };

function rankDisplay(rank) {
  if (rank === "T") return "10";
  return rank;
}

function codeToCard(code) {
  if (!code || code.length !== 2) return null;
  const rank = code[0].toUpperCase();
  const suit = code[1].toLowerCase();
  if (!RANKS.includes(rank) || !SUITS.includes(suit)) return null;
  return { rank, suit, value: RANKS.indexOf(rank) + 2, code };
}

function cardToText(card) {
  return `${rankDisplay(card.rank)}${SUIT_SYMBOL[card.suit]}`;
}

const ALL_CARDS = [];
for (const r of RANKS) {
  for (const s of SUITS) {
    ALL_CARDS.push(codeToCard(`${r}${s}`));
  }
}

function buildDeck(excludeCodesSet) {
  if (!excludeCodesSet) return ALL_CARDS.slice();
  return ALL_CARDS.filter((c) => !excludeCodesSet.has(c.code));
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function cmpArrDesc(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const av = a[i] === undefined || a[i] === null ? 0 : a[i];
    const bv = b[i] === undefined || b[i] === null ? 0 : b[i];
    if (av !== bv) return av - bv;
  }
  return 0;
}

function evaluate5(cards) {
  const values = cards.map((c) => c.value).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const freq = new Map();
  values.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
  const groups = [...freq.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  const isFlush = suits.every((s) => s === suits[0]);
  const uniqueDesc = [...new Set(values)].sort((a, b) => b - a);

  let isStraight = false;
  let straightHigh = 0;
  if (uniqueDesc.length >= 5) {
    if (
      uniqueDesc[0] - 1 === uniqueDesc[1] &&
      uniqueDesc[1] - 1 === uniqueDesc[2] &&
      uniqueDesc[2] - 1 === uniqueDesc[3] &&
      uniqueDesc[3] - 1 === uniqueDesc[4]
    ) {
      isStraight = true;
      straightHigh = uniqueDesc[0];
    }
    if (
      uniqueDesc[0] === 14 &&
      uniqueDesc[1] === 5 &&
      uniqueDesc[2] === 4 &&
      uniqueDesc[3] === 3 &&
      uniqueDesc[4] === 2
    ) {
      isStraight = true;
      straightHigh = 5;
    }
  }

  // category: 8 straight flush ... 0 high card
  if (isStraight && isFlush) return [8, straightHigh];
  if (groups[0][1] === 4) {
    const kicker = groups[1][0];
    return [7, groups[0][0], kicker];
  }
  if (groups[0][1] === 3 && groups[1][1] === 2) return [6, groups[0][0], groups[1][0]];
  if (isFlush) return [5, ...values];
  if (isStraight) return [4, straightHigh];
  if (groups[0][1] === 3) {
    const kickers = groups.slice(1).map((x) => x[0]).sort((a, b) => b - a);
    return [3, groups[0][0], ...kickers];
  }
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const pairHigh = Math.max(groups[0][0], groups[1][0]);
    const pairLow = Math.min(groups[0][0], groups[1][0]);
    const kicker = groups[2][0];
    return [2, pairHigh, pairLow, kicker];
  }
  if (groups[0][1] === 2) {
    const kickers = groups.slice(1).map((x) => x[0]).sort((a, b) => b - a);
    return [1, groups[0][0], ...kickers];
  }
  return [0, ...values];
}

function bestOf7(cards) {
  let best = null;
  for (let a = 0; a < cards.length - 4; a += 1) {
    for (let b = a + 1; b < cards.length - 3; b += 1) {
      for (let c = b + 1; c < cards.length - 2; c += 1) {
        for (let d = c + 1; d < cards.length - 1; d += 1) {
          for (let e = d + 1; e < cards.length; e += 1) {
            const rank = evaluate5([cards[a], cards[b], cards[c], cards[d], cards[e]]);
            if (!best || compareRank(rank, best) > 0) best = rank;
          }
        }
      }
    }
  }
  return best;
}

function compareRank(a, b) {
  if (a[0] !== b[0]) return a[0] - b[0];
  return cmpArrDesc(a.slice(1), b.slice(1));
}

function partialStrength(hero, board) {
  const cards = [...hero, ...board];
  const vals = cards.map((c) => c.value);
  const freq = new Map();
  vals.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
  const counts = [...freq.values()].sort((a, b) => b - a);
  if (counts[0] >= 4) return 7;
  if (counts[0] === 3 && counts[1] >= 2) return 6;
  if (counts[0] === 3) return 3;
  if (counts[0] === 2 && counts[1] === 2) return 2;
  if (counts[0] === 2) return 1;
  return 0;
}

function estimateDrawProbability(hero, board, samples = 2500) {
  if (board.length >= 5) return 0;
  let improve = 0;
  const known = [...hero, ...board];
  const base = partialStrength(hero, board);

  for (let i = 0; i < samples; i += 1) {
    const deck = buildDeck(new Set(known.map((c) => c.code)));
    shuffleInPlace(deck);
    const need = 5 - board.length;
    const futureBoard = [...board, ...deck.slice(0, need)];
    const finalRank = bestOf7([...hero, ...futureBoard]);
    if (finalRank[0] > base) improve += 1;
  }
  return improve / samples;
}

function computeWinRate(hero, board, oppCount, samples) {
  if (oppCount <= 0) return 1;
  let win = 0;
  let tie = 0;
  const known = [...hero, ...board];
  const exclude = new Set(known.map((c) => c.code));

  for (let i = 0; i < samples; i += 1) {
    const deck = buildDeck(exclude);
    shuffleInPlace(deck);

    let ptr = 0;
    const oppHands = [];
    for (let o = 0; o < oppCount; o += 1) {
      oppHands.push([deck[ptr], deck[ptr + 1]]);
      ptr += 2;
    }

    const missingBoard = 5 - board.length;
    const runout = deck.slice(ptr, ptr + missingBoard);
    const fullBoard = [...board, ...runout];

    const heroRank = bestOf7([...hero, ...fullBoard]);

    let result = 1;
    for (const hand of oppHands) {
      const oppRank = bestOf7([...hand, ...fullBoard]);
      const c = compareRank(heroRank, oppRank);
      if (c < 0) {
        result = -1;
        break;
      }
      if (c === 0 && result === 1) result = 0;
    }

    if (result > 0) win += 1;
    else if (result === 0) tie += 1;
  }

  return (win + tie * 0.5) / samples;
}

function actionLabelZh(action) {
  if (action === "fold") return "弃牌";
  if (action === "check") return "过牌";
  if (action === "call") return "跟注";
  if (action === "raise") return "加注";
  if (action === "all-in") return "全下";
  return action;
}

function streetDisplay(street) {
  if (street === "preflop") return "翻前";
  if (street === "flop") return "翻牌";
  if (street === "turn") return "转牌";
  if (street === "river") return "河牌";
  return street;
}

function recommend({ winRate, drawProb, pot, toCall, positionCategory, mode, heroStack }) {
  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;

  const posBoost = positionCategory === "后位" ? 0.03 : positionCategory === "前位" ? 0.0 : positionCategory === "盲注位" ? -0.01 : 0;
  const adjusted = Math.max(0, Math.min(1, winRate + posBoost));

  let action = "fold";
  let sizeHint = "0";

  // If all-in is effectively forced
  if (toCall > 0 && toCall >= heroStack) {
    action = "all-in";
    sizeHint = `全下（${heroStack}）`;
  } else if (toCall === 0) {
    action = adjusted > 0.66 ? "raise" : "check";
    if (action === "raise") sizeHint = `加注到 ${(heroStack > 0 ? (pot > 0 ? Math.max(toCall + 1, pot * 0.6) : 200) : 200).toFixed(0)}`;
  } else {
    if (adjusted > potOdds + 0.05) {
      action = "call";
      sizeHint = `${toCall}`;
    } else if (drawProb > 0.25) {
      action = "call";
      sizeHint = `${toCall}`;
    } else {
      action = "fold";
      sizeHint = "0";
    }
  }

  if (action === "raise") {
    const target = Math.max(2 * toCall, pot * 0.8 + toCall, 1);
    sizeHint = `加注到 ${target.toFixed(0)}`;
  }

  const reasons = [
    `胜率估计 ${Math.round(winRate * 100)}%（位置：${positionCategory}，模式：${mode === "fast" ? "快算" : "准算"}）`,
    `成牌概率约 ${Math.round(drawProb * 100)}%`,
    `底池赔率阈值约 ${Math.round(potOdds * 100)}%`,
    `需要补的金额：${toCall}，底池：${Math.round(pot)}`,
    "这是概率建议，不保证必胜",
  ];

  return { action, sizeHint, reasons, potOdds, adjusted };
}

function parseNaturalLanguage(text, playerIds) {
  const s = (text || "").trim();
  if (!s) return [];
  const chunks = s.split(/[；;。,\n]/).map((x) => x.trim()).filter(Boolean);

  const events = [];
  for (const c of chunks) {
    const parts = c.split(/\s+/).filter(Boolean);
    let actor = null;
    if (parts.length >= 2 && playerIds.includes(parts[0])) actor = parts[0];
    const rest = actor ? parts.slice(1).join(" ") : c;

    const lower = rest.toLowerCase();
    const amountMatch = rest.match(/(\d+)/);
    const amount = amountMatch ? Number(amountMatch[1]) : null;

    let action = null;
    if (/\bfold\b/i.test(rest) || /弃牌|弃/i.test(rest)) action = "fold";
    else if (/\bcheck\b/i.test(rest) || /过牌|过/i.test(rest)) action = "check";
    else if (/\bcall\b/i.test(rest) || /跟注/i.test(rest)) action = "call";
    else if (/\braise\b/i.test(rest) || /加注|加/i.test(rest)) action = "raise";
    else if (/(all-in|allin)/i.test(lower) || /全下|全押|全开/i.test(rest)) action = "all-in";

    if (!action) continue;
    events.push({ actor, action, amount });
  }
  return events;
}

const state = {
  config: {
    n: 6,
    playerIds: ["A", "B", "C", "D", "E", "F"],
    heroId: "A",
    dealerSeat: 0,
    sb: 100,
    bb: 100,
    startingStack: 10000,
    rebuyAmount: 5000,
  },
  hand: null,
  temp: {
    handSelection: [],
    boardSelection: [],
    requiredBoardCount: 3, // flop first
  },
};

function seatRoleLabel(seatIndex, hand) {
  const n = hand.n;
  const dealer = hand.dealerSeat;
  const sbSeat = (dealer + 1) % n;
  const bbSeat = (dealer + 2) % n;
  if (seatIndex === dealer) return "庄";
  if (seatIndex === sbSeat) return "小盲";
  if (seatIndex === bbSeat) return "大盲";
  return `位${seatIndex + 1}`;
}

function getAliveActiveSeats(hand) {
  return hand.players
    .map((p) => p.seatIndex)
    .filter((idx) => hand.players[idx].status === "active");
}

function firstToActSeat(hand) {
  const n = hand.n;
  const dealerSeat = hand.dealerSeat;
  const sbSeat = (dealerSeat + 1) % n;
  const bbSeat = (dealerSeat + 2) % n;
  if (hand.street === "preflop") {
    if (n === 2) return sbSeat;
    return (bbSeat + 1) % n; // UTG
  }
  return sbSeat;
}

function nextSeat(hand, fromSeat) {
  const n = hand.n;
  for (let step = 1; step <= n; step += 1) {
    const idx = (fromSeat + step) % n;
    const p = hand.players[idx];
    if (p && p.status === "active") return idx;
  }
  return null;
}

function isStreetOver(hand) {
  // Street ends when all active players have matched currentBet (or all-in already)
  for (const p of hand.players) {
    if (p.status !== "active") continue;
    if (!p.hasActed) return false;
    if (p.betInStreet !== hand.currentBet) return false;
  }
  return true;
}

function submitAction(hand, seatIndex, actionType, amountInput) {
  const p = hand.players[seatIndex];
  if (!p || p.status !== "active") return { ok: false, reason: "当前玩家不能行动" };

  const oldCurrentBet = hand.currentBet;
  const toCall = Math.max(0, hand.currentBet - p.betInStreet);
  const stackBefore = p.stack;
  const betBefore = p.betInStreet;

  let action = actionType;
  if (action === "check" && toCall > 0) action = "call";

  let invested = 0;
  let newBetInStreet = p.betInStreet;

  if (action === "fold") {
    p.status = "folded";
    p.hasActed = true;
  } else if (action === "check") {
    // do nothing
    if (toCall !== 0) return { ok: false, reason: "不能过牌（需要跟注）" };
    p.hasActed = true;
  } else if (action === "call") {
    if (toCall <= 0) {
      p.hasActed = true;
    } else if (p.stack >= toCall) {
      invested = toCall;
      p.stack -= toCall;
      newBetInStreet = p.betInStreet + toCall;
      p.betInStreet = newBetInStreet;
      p.hasActed = true;
    } else {
      invested = p.stack;
      p.stack = 0;
      newBetInStreet = p.betInStreet + invested;
      p.betInStreet = newBetInStreet;
      p.status = "allin";
      p.hasActed = true;
      if (newBetInStreet > hand.currentBet) hand.currentBet = newBetInStreet;
    }
  } else if (action === "raise") {
    const targetDefault = hand.currentBet === 0 ? Math.max(hand.sb * 2, 2) : hand.currentBet * 2;
    const target = Number(amountInput || 0) > hand.currentBet ? Number(amountInput) : targetDefault;
    const need = Math.max(0, target - p.betInStreet);
    if (need <= 0) return { ok: false, reason: "加注目标不正确" };

    if (p.stack >= need) {
      invested = need;
      p.stack -= need;
      newBetInStreet = p.betInStreet + need;
      p.betInStreet = newBetInStreet;
      p.hasActed = true;
      if (newBetInStreet > hand.currentBet) hand.currentBet = newBetInStreet;
    } else {
      invested = p.stack;
      p.stack = 0;
      newBetInStreet = p.betInStreet + invested;
      p.betInStreet = newBetInStreet;
      p.status = "allin";
      p.hasActed = true;
      if (newBetInStreet > hand.currentBet) hand.currentBet = newBetInStreet;
    }
  } else if (action === "all-in") {
    if (p.stack <= 0) return { ok: false, reason: "没有筹码" };
    invested = p.stack;
    p.stack = 0;
    newBetInStreet = p.betInStreet + invested;
    p.betInStreet = newBetInStreet;
    p.status = "allin";
    p.hasActed = true;
    if (newBetInStreet > hand.currentBet) hand.currentBet = newBetInStreet;
  }

  // Fold/check invested already handled
  if (action !== "fold" && action !== "check") {
    hand.pot += invested;
  }
  if (action === "call" && toCall > 0 && invested === 0) {
    // no-op (rare), kept for safety
    hand.pot += Math.max(0, p.betInStreet - betBefore);
  }

  // If currentBet increased, reset other active players' hasActed when they haven't matched
  if (hand.currentBet > oldCurrentBet) {
    for (const other of hand.players) {
      if (other.seatIndex === seatIndex) continue;
      if (other.status !== "active") continue;
      if (other.betInStreet < hand.currentBet) other.hasActed = false;
    }
  }

  hand.actionHistory.push({
    street: hand.street,
    seatIndex,
    actorId: p.id,
    position: p.positionLabel,
    action: action,
    betBefore,
    currentBet: hand.currentBet,
    pot: Math.round(hand.pot),
    ts: Date.now(),
  });

  return { ok: true, action, toCall, stackBefore, betBefore, currentBet: hand.currentBet };
}

function resetHandState() {
  const c = state.config;
  const n = c.n;
  const heroId = c.heroId.trim();
  const playerIds = c.playerIds.slice(0, n);
  const dealerSeat = Number(c.dealerSeat);

  const players = [];
  for (let i = 0; i < n; i += 1) {
    players.push({
      seatIndex: i,
      id: playerIds[i] || `P${i + 1}`,
      stack: Number(c.startingStack),
      status: "active",
      betInStreet: 0,
      hasActed: false,
      positionLabel: "",
    });
  }

  for (const p of players) {
    p.positionLabel = seatRoleLabel(p.seatIndex, { n, dealerSeat });
  }

  const hand = {
    n,
    dealerSeat,
    sb: Number(c.sb),
    bb: Number(c.bb),
    pot: 0,
    currentBet: 0,
    street: "preflop",
    board: [],
    heroId,
    heroCards: [],
    players,
    currentActorSeat: null,
    actionHistory: [],
  };

  // set hero cards from selection
  const hc = state.temp.handSelection.slice();
  if (hc.length !== 2) throw new Error("请先选择两张手牌");
  hand.heroCards = hc.map(codeToCard);

  // post blinds
  const sbSeat = (dealerSeat + 1) % n;
  const bbSeat = (dealerSeat + 2) % n;

  const post = (seatIndex, amount) => {
    const pl = hand.players[seatIndex];
    const pay = Math.min(pl.stack, amount);
    pl.stack -= pay;
    pl.betInStreet = pay;
    pl.hasActed = false;
    if (pl.stack === 0 && pay > 0) pl.status = "allin";
    if (pay > 0) hand.pot += pay;
  };

  hand.currentBet = hand.bb;
  post(sbSeat, hand.sb);
  post(bbSeat, hand.bb);

  // first actor
  hand.currentActorSeat = firstToActSeat(hand);
  if (hand.players[hand.currentActorSeat].status !== "active") {
    hand.currentActorSeat = nextSeat(hand, hand.currentActorSeat);
  }

  return hand;
}

function resetPerStreet(hand) {
  hand.currentBet = 0;
  hand.board = hand.board || [];
  for (const p of hand.players) {
    if (p.status === "active") {
      p.betInStreet = 0;
      p.hasActed = false;
    }
  }
  hand.currentActorSeat = firstToActSeat(hand);
  if (hand.currentActorSeat == null) return;
  if (hand.players[hand.currentActorSeat].status !== "active") {
    hand.currentActorSeat = nextSeat(hand, hand.currentActorSeat);
  }
}

function availableCardsForBoard() {
  const handSet = new Set(state.temp.handSelection);
  return handSet;
}

function renderPicker(containerId, selectedCodes, requiredCount, unavailableSet) {
  const container = $(containerId);
  if (!container) return;
  container.innerHTML = "";

  for (const c of ALL_CARDS) {
    const code = c.code;
    const isSelected = selectedCodes.includes(code);
    const unavailable = unavailableSet && unavailableSet.has(code);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `cardBtn ${SUIT_CLASS[c.suit] || ""}`.trim();
    btn.textContent = `${rankDisplay(c.rank)}${SUIT_SYMBOL[c.suit]}`;
    btn.dataset.code = code;

    if (isSelected) btn.classList.add("selected");
    if (!isSelected && unavailable) {
      btn.classList.add("disabled");
      btn.disabled = true;
    }

    btn.addEventListener("click", () => {
      if (btn.disabled) return;

      const idx = selectedCodes.indexOf(code);
      if (idx >= 0) {
        selectedCodes.splice(idx, 1);
        renderPickers();
        return;
      }

      if (selectedCodes.length >= requiredCount) return;
      selectedCodes.push(code);
      renderPickers();
    });

    container.appendChild(btn);
  }

  const selectedRow = containerId === "handPicker" ? $("handSelectedRow") : $("boardSelectedRow");
  if (selectedRow) {
    if (selectedCodes.length === 0) selectedRow.textContent = "未选择";
    else selectedRow.textContent = selectedCodes.map((code) => cardToText(codeToCard(code))).join("  ");
  }
}

function renderPickers() {
  renderPicker(
    "handPicker",
    state.temp.handSelection,
    2,
    new Set() // hand selection doesn't need unavailable
  );

  const unavailable = availableCardsForBoard();
  renderPicker("boardPicker", state.temp.boardSelection, state.temp.requiredBoardCount, unavailable);
  const title = $("boardPickerTitle");
  if (title) {
    const t = state.hand && state.hand.street ? state.hand.street : "preflop";
    const need = state.temp.requiredBoardCount;
    if (t === "preflop") title.textContent = `翻牌：选 ${need} 张公牌`;
    else if (t === "flop") title.textContent = `转牌：选 ${need} 张公牌`;
    else if (t === "turn") title.textContent = `河牌：选 ${need} 张公牌`;
    else title.textContent = `公牌：选 ${need} 张`;
  }

  // If the hand is active, board selection changes should immediately update stage buttons.
  if (state.hand) setStageButtons(state.hand);
}

function initDealerSeatOptions() {
  const nInput = $("nInput");
  const n = Number((nInput && nInput.value) ? nInput.value : 6);
  const sel = $("dealerSeatInput");
  if (!sel) return;
  sel.innerHTML = "";
  for (let i = 0; i < n; i += 1) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `座位 ${i + 1}`;
    sel.appendChild(opt);
  }
}

function readSetupConfig() {
  const n = Number($("nInput").value || 6);
  const playerIds = ($("playerIdsInput").value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (playerIds.length < n) throw new Error("玩家ID数量不足");
  const heroId = ($("heroIdInput").value || "").trim();
  if (!heroId) throw new Error("请填写你的玩家ID");
  const dealerSeat = Number($("dealerSeatInput").value || 0);
  const sb = Number($("sbInput").value || 100);
  const bb = Number($("bbInput").value || 100);
  const startingStack = Number($("startingStackInput").value || 10000);
  const rebuyAmount = Number($("rebuyAmountInput").value || 0);

  state.config = {
    n,
    playerIds: playerIds.slice(0, n),
    heroId,
    dealerSeat,
    sb,
    bb,
    startingStack,
    rebuyAmount,
  };
}

function renderBoard(hand) {
  const slots = $("boardSlots");
  if (!slots) return;
  slots.innerHTML = "";
  for (let i = 0; i < 5; i += 1) {
    const slot = document.createElement("div");
    slot.className = "boardSlot";
    if (hand.board && hand.board[i]) {
      slot.classList.add("filled");
      slot.textContent = cardToText(hand.board[i]);
    } else {
      slot.textContent = "";
    }
    slots.appendChild(slot);
  }
}

function renderSeats(hand) {
  const seatsEl = $("seats");
  if (!seatsEl) return;
  seatsEl.innerHTML = "";

  for (let i = 0; i < hand.n; i += 1) {
    const p = hand.players[i];
    const seat = document.createElement("div");
    seat.className = "seat";
    if (p.id === hand.heroId) seat.classList.add("heroGlow");
    if (hand.currentActorSeat === i) seat.classList.add("currentActor");

    const angle = (Math.PI * 2 * i) / hand.n - Math.PI / 2;
    const radius = 44; // visually tuned
    const cx = 50;
    const cy = 52;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    seat.style.left = `${x}%`;
    seat.style.top = `${y}%`;

    const isDealer = i === hand.dealerSeat;
    const statusFold = p.status === "folded";
    const statusAllin = p.status === "allin";

    const marker = isDealer ? `<div class="marker">庄</div>` : `<div class="marker" style="opacity:.0">-</div>`;
    const turnTag = hand.currentActorSeat === i ? `<div class="turnTag">轮到</div>` : "";

    const cardRow = p.id === hand.heroId ? heroCardChips(hand.heroCards) : unknownCardChips();

    seat.innerHTML = `
      <div class="seatId">${escapeHtml(p.id)}${marker}${turnTag}</div>
      <div class="seatPos">${escapeHtml(p.positionLabel)}</div>
      <div class="stack">${Math.round(p.stack)}</div>
      ${statusFold ? `<div class="statusFold">弃</div>` : ""}
      ${statusAllin ? `<div class="statusAllIn">全下</div>` : ""}
      ${cardRow}
    `;
    seatsEl.appendChild(seat);
  }
}

function heroCardChips(cards) {
  if (!cards || cards.length !== 2) return "";
  return `<div class="cardChipRow">
    <div class="cardChip">${cardToText(cards[0])}</div>
    <div class="cardChip">${cardToText(cards[1])}</div>
  </div>`;
}

function unknownCardChips() {
  return `<div class="cardChipRow">
    <div class="cardChip unknown">?</div>
    <div class="cardChip unknown">?</div>
  </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function actionHintText(hand) {
  const seatIndex = hand.currentActorSeat;
  if (seatIndex == null) return "这一轮结束，去下一阶段。";
  const actor = hand.players[seatIndex];
  return `轮到 ${actor.id}（${actor.positionLabel}）`;
}

function setStageButtons(hand) {
  const street = hand.street;
  const over = isStreetOver(hand);
  const startFlopBtn = $("startFlopBtn");
  const startTurnBtn = $("startTurnBtn");
  const startRiverBtn = $("startRiverBtn");

  if (street === "preflop") {
    // Make it clickable after selecting enough board cards.
    // If actions are not finished yet, the click handler will show a message.
    startFlopBtn.disabled = !(state.temp.boardSelection.length === 3);
    startTurnBtn.disabled = true;
    startRiverBtn.disabled = true;
  } else if (street === "flop") {
    startFlopBtn.disabled = true;
    startTurnBtn.disabled = !(state.temp.boardSelection.length === 1);
    startRiverBtn.disabled = true;
  } else if (street === "turn") {
    startFlopBtn.disabled = true;
    startTurnBtn.disabled = true;
    startRiverBtn.disabled = !(state.temp.boardSelection.length === 1);
  } else {
    startFlopBtn.disabled = true;
    startTurnBtn.disabled = true;
    startRiverBtn.disabled = true;
  }
}

function renderActionPanel(hand) {
  if (hand.currentActorSeat == null) {
    $("handStatusPill").textContent = `进行中：${streetDisplay(hand.street)}（待下一位）`;
  } else {
    const actor = hand.players[hand.currentActorSeat];
    $("handStatusPill").textContent = `进行中：${streetDisplay(hand.street)} · 轮到 ${actor.id}`;
  }
  $("streetLabel").textContent = streetDisplay(hand.street);
  $("potLabel").textContent = Math.round(hand.pot);
  $("currentBetLabel").textContent = Math.round(hand.currentBet);
  $("orderLabel").textContent = "-";

  const actorSeat = hand.currentActorSeat;
  if (actorSeat == null) {
    $("currentActorText").textContent = "该阶段结束";
    $("toCallLabel").textContent = "0";
    $("actionHint").textContent = actionHintText(hand);
    return;
  }

  const actor = hand.players[actorSeat];
  $("currentActorText").textContent = `${actor.id}（${actor.positionLabel}）`;

  const hero = hand.players.find((p) => p.id === hand.heroId);
  const toCall = hero ? Math.max(0, hand.currentBet - hero.betInStreet) : 0;
  $("toCallLabel").textContent = Math.round(toCall);

  const uiToCall = Math.max(0, hand.currentBet - actor.betInStreet);
  const foldBtn = $("foldBtn");
  const checkBtn = $("checkBtn");
  const callBtn = $("callBtn");
  const raiseBtn = $("raiseBtn");
  const allInBtn = $("allInBtn");

  if (foldBtn) foldBtn.disabled = false;
  if (checkBtn) checkBtn.disabled = !(uiToCall === 0 && actor.status === "active");
  if (callBtn) callBtn.disabled = !(uiToCall > 0 && actor.status === "active" && actor.stack > 0);
  if (raiseBtn) {
    const canRaise = actor.status === "active" && actor.stack > 0;
    raiseBtn.disabled = !canRaise;
  }
  if (allInBtn) allInBtn.disabled = !(actor.status === "active" && actor.stack > 0);

  $("actionHint").textContent = actor.id === hand.heroId ? "轮到你了：点按钮输入。" : actionHintText(hand);
  $("orderLabel").textContent = `座位${actorSeat + 1}/${hand.n}`;
}

function renderActionsLog(hand) {
  const lines = (hand.actionHistory || [])
    .slice(-200)
    .map((a, idx) => `${idx + 1}. ${streetDisplay(a.street)} ${a.actorId}：${actionLabelZh(a.action)}（底池≈${a.pot}）`);
  $("actionsView").textContent = lines.join("\n") || "暂无";
}

function heroAdviceText(hand, mode) {
  const hero = hand.players.find((p) => p.id === hand.heroId);
  if (!hero) return "你还没设置手牌/身份。";
  if (!hand.heroCards || hand.heroCards.length !== 2) return "你还没选好两张手牌。";
  if (hand.street !== "preflop") {
    const need = hand.street === "flop" ? 3 : hand.street === "turn" ? 4 : 5;
    if (!hand.board || hand.board.length !== need) return "公牌还没准备好。";
  }

  const oppCount = Math.max(1, hand.players.filter((p) => p.status !== "folded" && p.id !== hand.heroId).length);
  const samples = mode === "fast" ? 2500 : 15000;
  const winRate = computeWinRate(hand.heroCards, hand.board || [], oppCount - 1, samples);
  const drawProb = estimateDrawProbability(hand.heroCards, hand.board || [], mode === "fast" ? 1000 : 4000);

  const toCall = Math.max(0, hand.currentBet - hero.betInStreet);
  const positionCategory = calcPositionCategory(hand, hero.seatIndex);

  const rec = recommend({
    winRate,
    drawProb,
    pot: hand.pot,
    toCall,
    positionCategory,
    mode,
    heroStack: hero.stack,
  });

  return [
    `模式：${mode === "fast" ? "快算" : "准算"}`,
    `胜率估计：${(winRate * 100).toFixed(1)}%`,
    `成牌概率：${(drawProb * 100).toFixed(1)}%`,
    `需要补的金额：${Math.round(toCall)}`,
    `建议：${actionLabelZh(rec.action)}`,
    `下注提示：${rec.sizeHint}`,
    "",
    "解释：",
    ...rec.reasons.map((r, i) => `${i + 1}. ${r}`),
  ].join("\n");
}

function calcPositionCategory(hand, seatIndex) {
  // Heuristic: based on order among active players for this stage
  const start = firstToActSeat(hand);
  const order = [];
  let cur = start;
  for (let i = 0; i < hand.n; i += 1) {
    if (hand.players[cur].status === "active") order.push(cur);
    cur = (cur + 1) % hand.n;
  }
  const idx = order.indexOf(seatIndex);
  if (idx < 0) return "其他";
  const n = Math.max(1, order.length);
  if (seatIndex === hand.dealerSeat || seatIndex === (hand.dealerSeat + 1) % hand.n || seatIndex === (hand.dealerSeat + 2) % hand.n) return "盲注位";
  return idx < n / 2 ? "前位" : "后位";
}

function renderAll() {
  const hand = state.hand;
  if (!hand) return;
  renderBoard(hand);
  renderSeats(hand);
  renderActionPanel(hand);
  renderActionsLog(hand);
  setStageButtons(hand);
}

function setStreet(street) {
  const hand = state.hand;
  if (!hand) return;
  if (street === "flop") {
    const cards = state.temp.boardSelection.map(codeToCard);
    if (cards.length !== 3) throw new Error("翻牌需要选 3 张公牌");
    hand.board = cards;
    hand.street = "flop";
    resetPerStreet(hand);
    state.temp.boardSelection = [];
    state.temp.requiredBoardCount = 1;
    renderPickers();
    renderAll();
    return;
  }
  if (street === "turn") {
    const cards = state.temp.boardSelection.map(codeToCard);
    if (cards.length !== 1) throw new Error("转牌需要选 1 张公牌");
    hand.board = [...hand.board, cards[0]];
    hand.street = "turn";
    resetPerStreet(hand);
    state.temp.boardSelection = [];
    state.temp.requiredBoardCount = 1;
    renderPickers();
    renderAll();
    return;
  }
  if (street === "river") {
    const cards = state.temp.boardSelection.map(codeToCard);
    if (cards.length !== 1) throw new Error("河牌需要选 1 张公牌");
    hand.board = [...hand.board, cards[0]];
    hand.street = "river";
    resetPerStreet(hand);
    state.temp.boardSelection = [];
    state.temp.requiredBoardCount = 0;
    renderPickers();
    renderAll();
  }
}

function resetAll() {
  state.hand = null;
  state.temp.handSelection = [];
  state.temp.boardSelection = [];
  state.temp.requiredBoardCount = 3;

  $("handStatusPill").textContent = "未开始手牌";
  $("resultView").textContent = "";
  $("actionsView").textContent = "暂无";
  $("streetLabel").textContent = "翻前";
  $("potLabel").textContent = "0";
  $("currentBetLabel").textContent = "0";
  $("toCallLabel").textContent = "0";
  $("currentActorText").textContent = "-";
  $("orderLabel").textContent = "-";
  $("actionHint").textContent = "开始后轮到谁就点谁。";

  $("boardSelectedRow").textContent = "未选择";
  $("handSelectedRow").textContent = "未选择";

  const startFlopBtn = $("startFlopBtn");
  const startTurnBtn = $("startTurnBtn");
  const startRiverBtn = $("startRiverBtn");
  if (startFlopBtn) startFlopBtn.disabled = true;
  if (startTurnBtn) startTurnBtn.disabled = true;
  if (startRiverBtn) startRiverBtn.disabled = true;

  $("boardPickerTitle").textContent = `翻牌：选 3 张公牌`;
  renderPickers();

  if ($("gamePanel")) $("gamePanel").classList.add("hidden");
  if ($("setupPanel")) $("setupPanel").classList.remove("hidden");
}

function updateRaiseInput(hand) {
  const raiseToInput = $("raiseToInput");
  if (!raiseToInput) return;
  const sb = hand.sb || 100;
  const defaultTarget = hand.currentBet === 0 ? sb * 2 : hand.currentBet * 2;
  if (Number(raiseToInput.value) <= 0) raiseToInput.value = String(defaultTarget);
}

// ---- UI wiring ----

function submitCurrentAction(actionType) {
  const hand = state.hand;
  if (!hand) return;
  if (isStreetOver(hand)) return;

  const seatIndex = hand.currentActorSeat;
  if (seatIndex == null) return;

  const raiseTo = $("raiseToInput") ? $("raiseToInput").value : 0;
  const res = submitAction(hand, seatIndex, actionType, actionType === "raise" ? raiseTo : null);
  if (!res.ok) {
    $("resultView").textContent = `动作失败：${res.reason}`;
    return;
  }

  if (isStreetOver(hand)) {
    hand.currentActorSeat = null;
  } else {
    hand.currentActorSeat = nextSeat(hand, seatIndex);
  }
  updateRaiseInput(hand);
  renderAll();
}

$("clearHandBtn").addEventListener("click", () => {
  state.temp.handSelection = [];
  renderPickers();
});

$("clearBoardBtn").addEventListener("click", () => {
  state.temp.boardSelection = [];
  renderPickers();
});

$("nInput").addEventListener("change", () => initDealerSeatOptions());

$("startHandBtn").addEventListener("click", () => {
  try {
    readSetupConfig();
    if (state.temp.handSelection.length !== 2) throw new Error("请先选择你的两张手牌");
    state.hand = resetHandState();
    updateRaiseInput(state.hand);

    // board selection is for flop next
    state.temp.boardSelection = [];
    state.temp.requiredBoardCount = 3;
    renderPickers();

    if ($("setupPanel")) $("setupPanel").classList.add("hidden");
    if ($("gamePanel")) $("gamePanel").classList.remove("hidden");
    renderAll();
    $("resultView").textContent = "轮到谁就点动作按钮输入。要看建议可以点“快算/准算”。";
  } catch (e) {
    alert(e.message || String(e));
  }
});

$("resetBtn").addEventListener("click", () => resetAll());

$("foldBtn").addEventListener("click", () => submitCurrentAction("fold"));
$("checkBtn").addEventListener("click", () => submitCurrentAction("check"));
$("callBtn").addEventListener("click", () => submitCurrentAction("call"));
$("raiseBtn").addEventListener("click", () => submitCurrentAction("raise"));
$("allInBtn").addEventListener("click", () => submitCurrentAction("all-in"));

$("parseNlBtn").addEventListener("click", () => {
  const hand = state.hand;
  if (!hand || isStreetOver(hand)) return;
  const seatIndex = hand.currentActorSeat;
  if (seatIndex == null) return;
  const actor = hand.players[seatIndex];

  const events = parseNaturalLanguage($("nlInput").value, state.config.playerIds);
  if (!events.length) {
    $("resultView").textContent = "解析失败：请输入例如“弃牌”、“过牌”、“跟注 200”、“加注 4000”、“全下 1200”。";
    return;
  }

  let ev = events[0];
  if (ev.actor && ev.actor !== actor.id) {
    const match = events.find((x) => !x.actor || x.actor === actor.id);
    if (match) ev = match;
  }

  if (!ev) return;
  const action = ev.action;
  if (action === "raise") {
    const amount = ev.amount === undefined || ev.amount === null ? $("raiseToInput").value : ev.amount;
    submitAction(hand, seatIndex, "raise", amount);
  } else if (action === "all-in") {
    submitAction(hand, seatIndex, "all-in", null);
  } else if (action === "call") {
    submitAction(hand, seatIndex, "call", null);
  } else if (action === "check") {
    submitAction(hand, seatIndex, "check", null);
  } else if (action === "fold") {
    submitAction(hand, seatIndex, "fold", null);
  }

  if (isStreetOver(hand)) hand.currentActorSeat = null;
  else hand.currentActorSeat = nextSeat(hand, seatIndex);
  updateRaiseInput(hand);
  renderAll();
  $("nlInput").value = "";
});

$("calcFastBtn").addEventListener("click", () => {
  const hand = state.hand;
  if (!hand) return;
  $("resultView").textContent = heroAdviceText(hand, "fast");
});

$("calcAccurateBtn").addEventListener("click", () => {
  const hand = state.hand;
  if (!hand) return;
  $("resultView").textContent = heroAdviceText(hand, "accurate");
});

$("startFlopBtn").addEventListener("click", () => {
  try {
    const hand = state.hand;
    if (!hand || hand.street !== "preflop") return;
    if (!isStreetOver(hand)) return alert("这一阶段还没结束，请先把行动录完。");
    if (state.temp.boardSelection.length !== 3) return alert("翻牌需要选 3 张公牌。");
    setStreet("flop");
    renderAll();
  } catch (e) {
    alert(e.message || String(e));
  }
});

$("startTurnBtn").addEventListener("click", () => {
  try {
    const hand = state.hand;
    if (!hand || hand.street !== "flop") return;
    if (!isStreetOver(hand)) return alert("这一阶段还没结束，请先把行动录完。");
    if (state.temp.boardSelection.length !== 1) return alert("转牌需要选 1 张公牌。");
    setStreet("turn");
    renderAll();
  } catch (e) {
    alert(e.message || String(e));
  }
});

$("startRiverBtn").addEventListener("click", () => {
  try {
    const hand = state.hand;
    if (!hand || hand.street !== "turn") return;
    if (!isStreetOver(hand)) return alert("这一阶段还没结束，请先把行动录完。");
    if (state.temp.boardSelection.length !== 1) return alert("河牌需要选 1 张公牌。");
    setStreet("river");
    renderAll();
  } catch (e) {
    alert(e.message || String(e));
  }
});

// ---- init ----

initDealerSeatOptions();
resetAll();

