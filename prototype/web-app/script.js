const RANKS = "23456789TJQKA";
const SUITS = "shdc";

const $ = (id) => document.getElementById(id);

function parseCard(token) {
  if (!token) return null;
  const t = token.trim();
  if (t.length !== 2) return null;
  const rank = t[0].toUpperCase();
  const suit = t[1].toLowerCase();
  if (!RANKS.includes(rank) || !SUITS.includes(suit)) return null;
  return { rank, suit, value: RANKS.indexOf(rank) + 2, code: `${rank}${suit}` };
}

function parseCards(text) {
  return (text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(parseCard)
    .filter(Boolean);
}

function buildDeck(excludeCards) {
  const used = new Set((excludeCards || []).map((c) => c.code));
  const deck = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      const code = `${r}${s}`;
      if (!used.has(code)) deck.push(parseCard(code));
    }
  }
  return deck;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function cmpArrDesc(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
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

function estimateDrawProbability(hero, board, n = 2000) {
  if (board.length >= 5) return 0;
  let improve = 0;
  const known = [...hero, ...board];
  const base = partialStrength(hero, board);
  for (let i = 0; i < n; i += 1) {
    const deck = buildDeck(known);
    shuffleInPlace(deck);
    const need = 5 - board.length;
    const futureBoard = [...board, ...deck.slice(0, need)];
    const finalRank = bestOf7([...hero, ...futureBoard]);
    if (finalRank[0] > base) improve += 1;
  }
  return improve / n;
}

function computeWinRate(hero, board, oppCount, samples) {
  if (oppCount <= 0) return 1;
  let win = 0;
  let tie = 0;
  const known = [...hero, ...board];

  for (let i = 0; i < samples; i += 1) {
    const deck = buildDeck(known);
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

function recommend({ winRate, drawProb, pot, toCall, position, mode }) {
  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
  const posBoost = /BTN|CO/i.test(position) ? 0.03 : /SB|BB/i.test(position) ? -0.01 : 0;
  const adjusted = Math.max(0, Math.min(1, winRate + posBoost));

  let action = "fold";
  let sizeHint = "0";
  if (adjusted > 0.65) {
    action = "raise";
    sizeHint = `建议加注到 ${(toCall > 0 ? toCall * 2 : pot * 0.6).toFixed(0)}`;
  } else if (adjusted > potOdds + 0.05) {
    action = "call";
    sizeHint = `${toCall}`;
  } else if (drawProb > 0.25 && toCall <= pot * 0.2) {
    action = "call";
    sizeHint = `${toCall}`;
  } else if (toCall === 0) {
    action = "check";
  }

  const reasons = [
    `胜率估计 ${Math.round(winRate * 100)}%，位置修正后 ${Math.round(adjusted * 100)}%`,
    `底池赔率阈值约 ${Math.round(potOdds * 100)}%`,
    `成牌概率约 ${Math.round(drawProb * 100)}%`,
    `模式：${mode === "fast" ? "主引擎（快）" : "备引擎（更准）"}`,
    "这是概率建议，不保证必胜",
  ];

  return { action, sizeHint, reasons, potOdds, adjusted };
}

function parseNaturalLanguage(text) {
  const chunks = (text || "")
    .split(/[；;。,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
  const events = [];
  // allow either:
  // - "B all-in 1200"
  // - "all-in 1200"
  // - "fold"
  const full = /^([A-Za-z0-9_-]+)\s+(fold|check|call|raise|all-in)(?:\s+(\d+))?$/i;
  const short = /^(fold|check|call|raise|all-in)(?:\s+(\d+))?$/i;
  for (const c of chunks) {
    let m = c.match(full);
    if (m) {
      events.push({ actor: m[1], action: m[2].toLowerCase(), amount: m[3] ? Number(m[3]) : null });
      continue;
    }
    m = c.match(short);
    if (m) {
      events.push({ actor: null, action: m[1].toLowerCase(), amount: m[2] ? Number(m[2]) : null });
    }
  }
  return events;
}

function labelForSeat(seatIndex, hand) {
  const n = hand.n;
  const dealerSeat = hand.dealerSeat;
  const sbSeat = (dealerSeat + 1) % n;
  const bbSeat = (dealerSeat + 2) % n;
  const coSeat = (dealerSeat - 1 + n) % n;
  if (seatIndex === dealerSeat) return "BTN";
  if (seatIndex === sbSeat) return "SB";
  if (seatIndex === bbSeat) return "BB";
  if (seatIndex === coSeat) return "CO";

  const utgSeat = (bbSeat + 1) % n;
  // count MP-like seats between UTG and CO
  let k = 0;
  let cur = utgSeat;
  while (cur !== coSeat) {
    if (cur === seatIndex) return k === 0 ? "UTG" : `MP+${k}`;
    k += 1;
    cur = (cur + 1) % n;
    if (k > n) break;
  }
  return "UTG+?";
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
  hand: null, // created when starting hand
  lastAdviceText: "",
};

function getAliveNonFoldedPlayers(hand) {
  return hand.players.filter((p) => p.status !== "folded");
}

function getActivePlayers(hand) {
  return hand.players.filter((p) => p.status === "active");
}

function getSeatByPlayerId(hand, pid) {
  const p = hand.players.find((x) => x.id === pid);
  return p ? p.seatIndex : null;
}

function firstToActSeat(hand) {
  const n = hand.n;
  const dealerSeat = hand.dealerSeat;
  const sbSeat = (dealerSeat + 1) % n;
  const bbSeat = (dealerSeat + 2) % n;
  if (hand.street === "preflop") {
    if (n === 2) return sbSeat;
    // UTG = seat after BB
    return (bbSeat + 1) % n;
  }
  // postflop: SB first
  return sbSeat;
}

function nextSeat(hand, fromSeat) {
  const n = hand.n;
  for (let step = 1; step <= n; step += 1) {
    const idx = (fromSeat + step) % n;
    const p = hand.players[idx];
    if (p.status === "active") return idx;
  }
  return null;
}

function isStreetOver(hand) {
  const contenders = getAliveNonFoldedPlayers(hand);
  if (contenders.length <= 1) return true;

  for (const p of hand.players) {
    if (p.status === "active") {
      if (!p.hasActed) return false;
      if (p.betInStreet !== hand.currentBet) return false;
    }
    // all-in players are considered "done" (MVP simplified: side pot not modeled)
  }
  return true;
}

function applyAction(hand, seatIndex, actionType, amountInput) {
  const p = hand.players[seatIndex];
  if (!p || p.status !== "active") return { ok: false, reason: "not active" };

  const toCall = Math.max(0, hand.currentBet - p.betInStreet);
  const stackBefore = p.stack;
  const betBefore = p.betInStreet;

  let action = actionType;
  if (action === "check" && toCall > 0) action = "call";

  let newBetInStreet = betBefore;
  let statusNext = p.status;
  let amountPut = 0;
  let currentBetUpdated = false;

  if (action === "fold") {
    statusNext = "folded";
  } else if (action === "check") {
    // allowed when toCall==0
  } else if (action === "call") {
    const need = toCall;
    if (need <= 0) {
      // treat as check
    } else if (p.stack >= need) {
      newBetInStreet = hand.currentBet;
      amountPut = need;
      p.stack -= need;
    } else {
      // all-in call less than currentBet (MVP simplified)
      amountPut = p.stack;
      newBetInStreet = betBefore + p.stack;
      p.stack = 0;
      statusNext = "allin";
    }
  } else if (action === "raise") {
    const raiseTo = Number(amountInput || 0);
    const raiseDefault = hand.currentBet === 0 ? hand.sb * 2 : hand.currentBet * 2;
    const target = raiseTo > hand.currentBet ? raiseTo : raiseDefault;
    const need = Math.max(0, target - betBefore);
    if (p.stack >= need) {
      newBetInStreet = target;
      amountPut = need;
      p.stack -= need;
    } else {
      // all-in raise
      amountPut = p.stack;
      newBetInStreet = betBefore + p.stack;
      p.stack = 0;
      statusNext = "allin";
    }
  } else if (action === "all-in") {
    amountPut = p.stack;
    newBetInStreet = betBefore + p.stack;
    p.stack = 0;
    statusNext = "allin";
  }

  // update pot/bet for non-fold actions
  if (action !== "fold") {
    const delta = Math.max(0, newBetInStreet - betBefore);
    amountPut = action === "call" && toCall <= 0 ? 0 : delta;
    p.betInStreet = newBetInStreet;
  }

  if (action !== "fold" && p.status !== "allin" && p.stack === 0) {
    p.status = "allin";
  }

  const prevBetAfter = p.betInStreet;
  if (statusNext !== p.status) p.status = statusNext;

  if (action !== "fold") {
    const increased = p.betInStreet > hand.currentBet;
    if (increased) {
      hand.currentBet = p.betInStreet;
      currentBetUpdated = true;
    }
  }

  // pot always follows delta bet (MVP simplified: side pots not modeled)
  if (action !== "fold") {
    const deltaPot = Math.max(0, p.betInStreet - betBefore);
    hand.pot += deltaPot;
  }

  // handle rebuy for stack == 0 between hands only (MVP)
  // action-level rebuy not applied.

  p.hasActed = true;

  if (currentBetUpdated) {
    // reset hasActed for other active players who haven't matched
    for (const other of hand.players) {
      if (other.seatIndex === seatIndex) continue;
      if (other.status === "active" && other.betInStreet < hand.currentBet) {
        other.hasActed = false;
      }
    }
  }

  hand.actionHistory.push({
    street: hand.street,
    seatIndex,
    actorId: p.id,
    position: p.positionLabel,
    action,
    betBefore,
    betAfter: prevBetAfter,
    currentBet: hand.currentBet,
    pot: hand.pot,
    ts: Date.now(),
  });

  return { ok: true, action, toCall, stackBefore, betBefore, currentBet: hand.currentBet };
}

function resetHandState() {
  const c = state.config;
  const n = c.n;
  const playerIds = c.playerIds.slice(0, n);
  const heroId = c.heroId.trim();

  // create players in seat order 0..n-1
  const players = [];
  for (let i = 0; i < n; i += 1) {
    const pid = playerIds[i] || `P${i + 1}`;
    players.push({
      seatIndex: i,
      id: pid,
      stack: Number(c.startingStack),
      status: "active",
      betInStreet: 0,
      hasActed: false,
      positionLabel: "", // filled after hand created
    });
  }

  const hand = {
    n,
    playerIds,
    heroId,
    dealerSeat: Number(c.dealerSeat),
    sb: Number(c.sb),
    bb: Number(c.bb),
    pot: 0,
    currentBet: 0,
    street: "preflop",
    board: [],
    heroCards: [],
    players,
    currentActorSeat: null,
    actionHistory: [],
  };

  for (const p of hand.players) {
    p.positionLabel = labelForSeat(p.seatIndex, hand);
  }

  // parse hero cards
  const heroCards = parseCards($("heroCardsInput").value);
  if (heroCards.length !== 2) {
    throw new Error("Hero 手牌格式不正确，需要两张，例如：As Kd");
  }
  hand.heroCards = heroCards;

  // post blinds
  const dealerSeat = hand.dealerSeat;
  const sbSeat = (dealerSeat + 1) % n;
  const bbSeat = (dealerSeat + 2) % n;
  hand.pot = 0;
  hand.currentBet = hand.bb;

  const post = (seatIndex, amount) => {
    const pl = hand.players[seatIndex];
    const pay = Math.min(pl.stack, amount);
    pl.stack -= pay;
    pl.betInStreet = pay;
    pl.hasActed = false;
    if (pl.stack === 0) pl.status = pay > 0 ? "allin" : "folded";
    hand.pot += pay;
  };

  post(sbSeat, hand.sb);
  post(bbSeat, hand.bb);

  // first actor for preflop
  hand.currentActorSeat = firstToActSeat(hand);
  // skip folded/allin
  if (hand.players[hand.currentActorSeat].status !== "active") {
    hand.currentActorSeat = nextSeat(hand, hand.currentActorSeat);
  }

  return hand;
}

function startStreet(hand, street) {
  hand.street = street;
  hand.board = hand.board || [];
  // reset per-street bets
  hand.currentBet = 0;
  hand.pot = Number(hand.pot || 0);
  hand.actionHistory = hand.actionHistory || [];

  for (const p of hand.players) {
    if (p.status === "folded") continue;
    // keep all-in or active; all-in carries betInStreet as fixed
    if (p.status === "active") {
      p.betInStreet = 0;
      p.hasActed = false;
    }
  }

  if (street === "preflop") {
    // preflop needs blinds and currentBet
    // rebuild to keep it simple
    state.hand = resetHandState();
    renderAll();
    return;
  }

  const first = firstToActSeat(hand);
  hand.currentActorSeat = first;
  if (hand.players[hand.currentActorSeat].status !== "active") {
    hand.currentActorSeat = nextSeat(hand, hand.currentActorSeat);
  }

  renderAll();
}

function renderBoard(hand) {
  const slots = $("boardSlots");
  slots.innerHTML = "";
  for (let i = 0; i < 5; i += 1) {
    const slot = document.createElement("div");
    slot.className = "boardSlot";
    if (hand.board[i]) {
      slot.classList.add("filled");
      const c = hand.board[i];
      slot.textContent = c.rank + c.suit;
    } else {
      slot.textContent = "";
    }
    slots.appendChild(slot);
  }
}

function renderSeats(hand) {
  const seatsEl = $("seats");
  seatsEl.innerHTML = "";
  const n = hand.n;
  const radius = 44; // in vw-ish via absolute percent in JS
  const wrap = hand;

  for (let i = 0; i < n; i += 1) {
    const p = hand.players[i];
    const seat = document.createElement("div");
    seat.className = "seat";
    if (p.id === hand.heroId) seat.classList.add("heroGlow");

    // position around circle
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const cx = 50;
    const cy = 52;
    const x = cx + (radius * Math.cos(angle));
    const y = cy + (radius * Math.sin(angle));
    seat.style.left = `${x}%`;
    seat.style.top = `${y}%`;

    const isDealer = i === hand.dealerSeat;
    const status = p.status === "folded" ? `<div class="statusFold">折牌</div>` : "";
    const allIn = p.status === "allin" ? `<div class="statusAllIn">ALL-IN</div>` : "";

    const cardRow = p.id === hand.heroId ? renderHeroCardChips(p.id, hand.heroCards) : renderUnknownCardChips();

    seat.innerHTML = `
      <div class="seatId">${escapeHtml(p.id)}${isDealer ? "<div class='marker'>D</div>" : ""}</div>
      <div class="seatPos">${escapeHtml(p.positionLabel)}</div>
      <div class="stack">${p.stack} chips</div>
      ${status}
      ${allIn}
      ${cardRow}
    `;

    seatsEl.appendChild(seat);
  }
}

function renderHeroCardChips(heroId, cards) {
  if (!cards || cards.length !== 2) return "";
  return `<div class="cardChipRow">
    <div class="cardChip">${cards[0].rank}${cards[0].suit}</div>
    <div class="cardChip">${cards[1].rank}${cards[1].suit}</div>
  </div>`;
}

function renderUnknownCardChips() {
  return `<div class="cardChipRow">
    <div class="cardChip unknown">?</div>
    <div class="cardChip unknown">?</div>
  </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

function renderActionPanel(hand) {
  const actorSeat = hand.currentActorSeat;
  const actor = actorSeat != null ? hand.players[actorSeat] : null;
  $("handStatusPill").textContent = `手牌中：${hand.street}`;

  if (!actor) {
    $("currentActorText").textContent = "该街结束";
    $("orderLabel").textContent = "-";
    setActionButtonsEnabled(false);
    return;
  }

  $("currentActorText").textContent = `${actor.id}（${actor.positionLabel}）`;
  $("orderLabel").textContent = `${actorSeat + 1}/${hand.n}`;
  const toCall = Math.max(0, hand.currentBet - actor.betInStreet);
  $("toCallLabel").textContent = toCall;

  $("streetLabel").textContent = hand.street;
  $("potLabel").textContent = Math.round(hand.pot);
  $("currentBetLabel").textContent = Math.round(hand.currentBet);

  const canFold = actor.status === "active";
  const canCheck = toCall === 0 && actor.status === "active";
  const canCall = toCall > 0 && actor.status === "active" && actor.stack > 0;
  const canRaise = actor.status === "active" && actor.stack > toCall && (actor.betInStreet < actor.stack + actor.betInStreet);
  const canAllIn = actor.status === "active" && actor.stack > 0;

  $("foldBtn").disabled = !canFold;
  $("checkBtn").disabled = !canCheck;
  $("callBtn").disabled = !canCall;
  $("raiseBtn").disabled = !canRaise;
  $("allInBtn").disabled = !canAllIn;

  // update raise input default
  const raiseDefault = hand.currentBet === 0 ? hand.sb * 2 : hand.currentBet * 2;
  $("raiseToInput").value = String(raiseDefault);

  // action hint
  if (actor.id === hand.heroId) $("actionHint").textContent = "轮到你：直接按动作按钮录入";
  else $("actionHint").textContent = `轮到 ${actor.id}：按同样动作按钮录入（按顺序）`;
}

function setActionButtonsEnabled(enabled) {
  $("foldBtn").disabled = !enabled;
  $("checkBtn").disabled = !enabled;
  $("callBtn").disabled = !enabled;
  $("raiseBtn").disabled = !enabled;
  $("allInBtn").disabled = !enabled;
}

function renderActionsLog(hand) {
  const lines = (hand.actionHistory || [])
    .slice(-200)
    .map((a, idx) => {
      const num = idx + 1;
      const amt = a.betAfter;
      return `${num}. [${a.street}] ${a.actorId} (${a.position}) ${a.action}${amt != null ? ` (bet=${amt})` : ""}`;
    });
  $("actionsView").textContent = lines.join("\n") || "暂无";
}

function renderAll() {
  const hand = state.hand;
  if (!hand) return;
  renderBoard(hand);
  renderSeats(hand);
  renderActionPanel(hand);
  renderActionsLog(hand);

  const c = state.config;
  // street buttons enablement
  $("startFlopBtn").disabled = !(hand.street === "preflop" && isStreetOver(hand));
  $("startTurnBtn").disabled = !(hand.street === "flop" && isStreetOver(hand));
  $("startRiverBtn").disabled = !(hand.street === "turn" && isStreetOver(hand));
}

function findToStreetBoardCount(street) {
  if (street === "flop") return 3;
  if (street === "turn") return 4;
  if (street === "river") return 5;
  return 0;
}

function setBoardForStreet(hand, street) {
  if (street === "flop") {
    const flopCards = parseCards($("flopInput").value);
    if (flopCards.length !== 3) throw new Error("flop 需要 3 张牌，例如：Ah 7c 2d");
    hand.board = flopCards;
  } else if (street === "turn") {
    const turnCards = parseCards($("turnInput").value);
    if (turnCards.length !== 1) throw new Error("turn 需要 1 张牌，例如：Kc");
    hand.board = [...hand.board, turnCards[0]];
  } else if (street === "river") {
    const riverCards = parseCards($("riverInput").value);
    if (riverCards.length !== 1) throw new Error("river 需要 1 张牌，例如：9s");
    hand.board = [...hand.board, riverCards[0]];
  }
}

function heroAdvice(hand, mode) {
  if (hand.heroId == null) return "Hero 尚未设置";
  if (!hand.heroCards || hand.heroCards.length !== 2) return "Hero 手牌缺失";
  if (hand.street !== "preflop") {
    const need = findToStreetBoardCount(hand.street);
    if (!hand.board || hand.board.length !== need) return `公牌未就绪：${hand.street} 需要 ${need} 张`;
  } else {
    if (hand.board && hand.board.length !== 0) {
      // allow but normalize
      hand.board = [];
    }
  }

  const alive = getAliveNonFoldedPlayers(hand);
  const hero = hand.players.find((p) => p.id === hand.heroId);
  if (!hero || hero.status === "folded") {
    return "你已折牌：建议输出暂停。";
  }
  const oppCount = Math.max(1, alive.length - 1);
  const samples = mode === "fast" ? 2500 : 15000;
  const winRate = computeWinRate(hand.heroCards, hand.board || [], oppCount, samples);
  const drawProb = estimateDrawProbability(hand.heroCards, hand.board || [], mode === "fast" ? 1000 : 4000);

  const toCall = 0; // advice uses generic toCall=0 for now; betting suggestion could use actor-specific later
  const position = hero.positionLabel;
  const rec = recommend({
    winRate,
    drawProb,
    pot: hand.pot,
    toCall,
    position,
    mode,
  });

  return [
    `模式：${mode === "fast" ? "主引擎（快）" : "备引擎（更准）"}`,
    `胜率估计：${(winRate * 100).toFixed(1)}%`,
    `成牌概率：${(drawProb * 100).toFixed(1)}%`,
    `（说明：当前 MVP 在“建议动作”里先做简化；真实 toCall 需要从当前轮到的玩家计算）`,
    `建议动作（概率）：${rec.action}`,
    `下注提示：${rec.sizeHint}`,
    "",
    "解释：",
    ...rec.reasons.map((r, i) => `${i + 1}. ${r}`),
  ].join("\n");
}

function submitCurrentAction(actionType, amount) {
  const hand = state.hand;
  if (!hand) return;
  if (isStreetOver(hand)) return;

  const actorSeat = hand.currentActorSeat;
  if (actorSeat == null) return;
  const res = applyAction(hand, actorSeat, actionType, amount);
  if (!res.ok) {
    $("resultView").textContent = `动作未能应用：${res.reason}`;
    return;
  }

  // rebuy between hands is handled later; for MVP if stack == 0 keep all-in
  // move to next actor
  if (!isStreetOver(hand)) {
    const next = nextSeat(hand, actorSeat);
    hand.currentActorSeat = next;
  } else {
    hand.currentActorSeat = null;
  }

  renderAll();
}

function updateStreetButtonsVisibility(hand) {
  // buttons enable/disable are handled in renderAll()
}

// ---- UI wiring ----

function initDealerSeatOptions() {
  const n = Number($("nInput").value || 6);
  const sel = $("dealerSeatInput");
  sel.innerHTML = "";
  for (let i = 0; i < n; i += 1) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `Seat ${i + 1}`;
    sel.appendChild(opt);
  }
}

function readSetupConfig() {
  const n = Number($("nInput").value || 6);
  const playerIds = ($("playerIdsInput").value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (playerIds.length < n) {
    throw new Error("玩家ID列表长度不足人数");
  }
  const heroId = ($("heroIdInput").value || "").trim();
  if (!heroId) throw new Error("Hero 玩家ID不能为空");
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

function resetAll() {
  state.hand = null;
  $("gamePanel").classList.add("hidden");
  $("setupPanel").classList.remove("hidden");
  $("handStatusPill").textContent = "未开始手牌";
  $("actionsView").textContent = "暂无";
  $("resultView").textContent = "";
  $("streetLabel").textContent = "preflop";
  $("potLabel").textContent = "0";
  $("currentBetLabel").textContent = "0";
  $("currentActorText").textContent = "-";
  $("toCallLabel").textContent = "0";
  $("actionHint").textContent = "开始后会自动轮到某位玩家";
  $("boardSlots").innerHTML = "";

  for (const id of ["flopInput", "turnInput", "riverInput"]) {
    const el = $(id);
    if (el) el.value = "";
  }

  initDealerSeatOptions();
}

// ---- buttons ----

$("nInput").addEventListener("change", () => {
  initDealerSeatOptions();
});

$("startHandBtn").addEventListener("click", () => {
  try {
    readSetupConfig();
    state.hand = resetHandState();
    $("setupPanel").classList.add("hidden");
    $("gamePanel").classList.remove("hidden");
    $("startFlopBtn").disabled = true;
    $("startTurnBtn").disabled = true;
    $("startRiverBtn").disabled = true;
    renderAll();
    $("resultView").textContent = "开始后轮到谁就点动作按钮录入。你可以在需要时按“主引擎/备引擎”查看建议。";
  } catch (e) {
    alert(e.message || String(e));
  }
});

$("resetBtn").addEventListener("click", () => resetAll());

$("foldBtn").addEventListener("click", () => submitCurrentAction("fold"));
$("checkBtn").addEventListener("click", () => submitCurrentAction("check"));
$("callBtn").addEventListener("click", () => submitCurrentAction("call"));
$("raiseBtn").addEventListener("click", () => submitCurrentAction("raise", $("raiseToInput").value));
$("allInBtn").addEventListener("click", () => submitCurrentAction("all-in"));

$("parseNlBtn").addEventListener("click", () => {
  const hand = state.hand;
  if (!hand || isStreetOver(hand)) return;
  const actorSeat = hand.currentActorSeat;
  if (actorSeat == null) return;
  const actor = hand.players[actorSeat];

  const events = parseNaturalLanguage($("nlInput").value);
  if (!events.length) {
    $("resultView").textContent = "自然语言解析失败：请输入 fold/check/call/raise/all-in（可带金额）。";
    return;
  }

  // pick first event that matches current actor if specified
  let ev = events[0];
  if (ev.actor && ev.actor !== actor.id) {
    const match = events.find((x) => !x.actor || x.actor === actor.id);
    ev = match || events[0];
  }

  const actionMap = {
    fold: "fold",
    check: "check",
    call: "call",
    raise: "raise",
    "all-in": "all-in",
  };

  const action = actionMap[ev.action] || null;
  if (!action) return;
  const amount = ev.amount != null ? ev.amount : $("raiseToInput").value;
  submitCurrentAction(action, action === "raise" ? amount : amount);
  $("nlInput").value = "";
});

$("calcFastBtn").addEventListener("click", () => {
  const hand = state.hand;
  if (!hand) return;
  $("resultView").textContent = heroAdvice(hand, "fast");
});
$("calcAccurateBtn").addEventListener("click", () => {
  const hand = state.hand;
  if (!hand) return;
  $("resultView").textContent = heroAdvice(hand, "accurate");
});

$("startFlopBtn").addEventListener("click", () => {
  const hand = state.hand;
  if (!hand || hand.street !== "preflop") return;
  try {
    setBoardForStreet(hand, "flop");
    hand.street = "flop";
    hand.currentBet = 0;
    for (const p of hand.players) {
      if (p.status === "active") {
        p.betInStreet = 0;
        p.hasActed = false;
      }
    }
    hand.currentActorSeat = firstToActSeat(hand);
    if (hand.players[hand.currentActorSeat].status !== "active") {
      hand.currentActorSeat = nextSeat(hand, hand.currentActorSeat);
    }
    renderAll();
  } catch (e) {
    alert(e.message || String(e));
  }
});

$("startTurnBtn").addEventListener("click", () => {
  const hand = state.hand;
  if (!hand || hand.street !== "flop") return;
  try {
    setBoardForStreet(hand, "turn");
    hand.street = "turn";
    hand.currentBet = 0;
    for (const p of hand.players) {
      if (p.status === "active") {
        p.betInStreet = 0;
        p.hasActed = false;
      }
    }
    hand.currentActorSeat = firstToActSeat(hand);
    if (hand.players[hand.currentActorSeat].status !== "active") {
      hand.currentActorSeat = nextSeat(hand, hand.currentActorSeat);
    }
    renderAll();
  } catch (e) {
    alert(e.message || String(e));
  }
});

$("startRiverBtn").addEventListener("click", () => {
  const hand = state.hand;
  if (!hand || hand.street !== "turn") return;
  try {
    setBoardForStreet(hand, "river");
    hand.street = "river";
    hand.currentBet = 0;
    for (const p of hand.players) {
      if (p.status === "active") {
        p.betInStreet = 0;
        p.hasActed = false;
      }
    }
    hand.currentActorSeat = firstToActSeat(hand);
    if (hand.players[hand.currentActorSeat].status !== "active") {
      hand.currentActorSeat = nextSeat(hand, hand.currentActorSeat);
    }
    renderAll();
  } catch (e) {
    alert(e.message || String(e));
  }
});

// ---- init ----

initDealerSeatOptions();
resetAll();

