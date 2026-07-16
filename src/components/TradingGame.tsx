"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordAttempt } from "@/lib/supabase/attempts";
import { shuffle } from "@/lib/shuffle";
import fermiData from "@/data/fermi_questions.json";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const TOTAL_ROUNDS = 4;
const HIDDEN_COUNT = 4;
const NOISE_TRADE_PROB = 0.2;
const DICE_SIDES = 6;

type Scenario = "cards" | "dice" | "fermi";

const SCENARIOS: { key: Scenario; label: string }[] = [
  { key: "cards", label: "Card Game" },
  { key: "dice", label: "Dice Game" },
  { key: "fermi", label: "Fermi Estimate" },
];

const HELP_TEXT: Record<Scenario, React.ReactNode> = {
  cards: (
    <>
      This is the classic &quot;make me a market&quot; card game used at firms like Jane Street and
      Optiver. Your hidden total is the sum of 6 cards dealt from a{" "}
      <span className="text-[var(--foreground)]">standard 52-card deck</span> (4 suits × 13 ranks,
      Ace=1 through King=13, so 4 copies of every rank) — you see 2 in your hand, and one more is
      revealed each round. Cards are drawn{" "}
      <span className="text-[var(--foreground)]">without replacement</span>, so counting matters:
      keep a running tally of which ranks have already appeared (in your hand or revealed), then
      estimate the hidden total as your known sum plus (remaining hidden cards × the average rank of
      what&apos;s left in the deck). A fresh deck averages 7 per card; every revealed high card pulls
      that average down for the rest of the round, and every revealed low card pulls it up. Quote too
      tight and you get picked off by the reveal; quote too wide and you capture no edge — walk away
      with positive P&amp;L once the last card flips.
    </>
  ),
  dice: (
    <>
      Same quoting mechanic as the card game, but a different hidden process: the total is the sum
      of 6 independent <span className="text-[var(--foreground)]">six-sided dice, each showing 1 through 6</span>{" "}
      — 2 shown, 4 hidden, one revealed per round. Unlike cards, dice rolls are drawn{" "}
      <span className="text-[var(--foreground)]">with replacement</span>{" "}
      — each hidden die is always uniform on 1-6 (mean 3.5, variance 35/12) no matter what&apos;s
      already been revealed, so there&apos;s no counting to do here: your uncertainty shrinks in
      equal, predictable steps every round instead of unevenly like the card game. A good gut check:
      each remaining hidden die contributes roughly ±1.7 to your total&apos;s standard deviation.
    </>
  ),
  fermi: (
    <>
      No cards or dice here — you&apos;re quoting a two-sided market on a real-world quantity (e.g.
      the length of the Great Wall in km), the way &quot;Fermi estimation&quot; rounds work in actual
      trading interviews. There&apos;s no starting hand; instead, each round reveals one more hint
      that narrows the plausible range, from a rough order of magnitude down to a near-exact clue.
      The skill being tested is different too: it&apos;s not counting cards or dice, it&apos;s
      translating genuine uncertainty about the world into a bid/ask spread — and only tightening
      that spread as fast as the hints actually justify.
    </>
  ),
};

type Card = { rank: number; suit: (typeof SUITS)[number] };

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) deck.push({ rank, suit });
  }
  return deck;
}

function cardLabel(c: Card) {
  const rankLabel = c.rank === 1 ? "A" : c.rank === 11 ? "J" : c.rank === 12 ? "Q" : c.rank === 13 ? "K" : String(c.rank);
  return `${rankLabel}${c.suit}`;
}

function cardEq(a: Card, b: Card) {
  return a.rank === b.rank && a.suit === b.suit;
}

function rollDie() {
  return 1 + Math.floor(Math.random() * DICE_SIDES);
}

type FermiQuestion = {
  id: string;
  prompt: string;
  unit: string;
  trueValue: number;
  tolerancePct: number;
  hints: string[];
};

const FERMI_QUESTIONS = fermiData.questions as FermiQuestion[];

type Fill = { round: number; side: "BUY" | "SELL"; price: number; informed: boolean };

type CardsData = { kind: "cards"; deck: Card[]; hand: Card[]; hiddenPool: Card[]; revealed: Card[] };
type DiceData = { kind: "dice"; hand: number[]; hiddenPool: number[]; revealed: number[] };
type FermiRoundData = { kind: "fermi"; question: FermiQuestion; revealedHints: string[] };
type ScenarioData = CardsData | DiceData | FermiRoundData;

type GameState = {
  data: ScenarioData;
  trueTotal: number;
  round: number;
  cash: number;
  inventory: number;
  fills: Fill[];
  quotes: { bid: number; ask: number }[];
  finished: boolean;
};

function newCardsGame(): GameState {
  const deck = shuffle(buildDeck());
  const dealt = deck.slice(0, 2 + HIDDEN_COUNT);
  const hand = dealt.slice(0, 2);
  const hiddenPool = dealt.slice(2);
  const trueTotal = dealt.reduce((s, c) => s + c.rank, 0);
  return {
    data: { kind: "cards", deck, hand, hiddenPool, revealed: [] },
    trueTotal,
    round: 1,
    cash: 0,
    inventory: 0,
    fills: [],
    quotes: [],
    finished: false,
  };
}

function newDiceGame(): GameState {
  const hand = [rollDie(), rollDie()];
  const hiddenPool = Array.from({ length: HIDDEN_COUNT }, rollDie);
  const trueTotal = [...hand, ...hiddenPool].reduce((s, v) => s + v, 0);
  return {
    data: { kind: "dice", hand, hiddenPool, revealed: [] },
    trueTotal,
    round: 1,
    cash: 0,
    inventory: 0,
    fills: [],
    quotes: [],
    finished: false,
  };
}

function newFermiGame(): GameState {
  const question = FERMI_QUESTIONS[Math.floor(Math.random() * FERMI_QUESTIONS.length)];
  return {
    data: { kind: "fermi", question, revealedHints: [] },
    trueTotal: question.trueValue,
    round: 1,
    cash: 0,
    inventory: 0,
    fills: [],
    quotes: [],
    finished: false,
  };
}

function newGame(scenario: Scenario): GameState {
  if (scenario === "cards") return newCardsGame();
  if (scenario === "dice") return newDiceGame();
  return newFermiGame();
}

function revealedCount(data: ScenarioData) {
  return data.kind === "fermi" ? data.revealedHints.length : data.revealed.length;
}

// Reveals one more hidden unit for the round just played, or everything remaining
// on the last round (relevant when a round is skipped/ends early — otherwise a no-op
// since HIDDEN_COUNT === TOTAL_ROUNDS for every scenario).
function revealNext(data: ScenarioData, isLastRound: boolean): ScenarioData {
  if (data.kind === "fermi") {
    const remaining = data.question.hints.slice(data.revealedHints.length);
    const revealedHints = isLastRound ? [...data.revealedHints, ...remaining] : [...data.revealedHints, remaining[0]];
    return { ...data, revealedHints };
  }
  if (data.kind === "cards") {
    const revealed = isLastRound
      ? [...data.revealed, ...data.hiddenPool.slice(data.revealed.length)]
      : [...data.revealed, data.hiddenPool[data.revealed.length]];
    return { ...data, revealed };
  }
  const revealed = isLastRound
    ? [...data.revealed, ...data.hiddenPool.slice(data.revealed.length)]
    : [...data.revealed, data.hiddenPool[data.revealed.length]];
  return { ...data, revealed };
}

function sliceDataAt(data: ScenarioData, n: number): ScenarioData {
  if (data.kind === "fermi") return { ...data, revealedHints: data.question.hints.slice(0, n) };
  if (data.kind === "cards") return { ...data, revealed: data.revealed.slice(0, n) };
  return { ...data, revealed: data.revealed.slice(0, n) };
}

// Bayesian "fair value" the player would need to estimate mentally each round —
// used only in the post-game feedback panel, never shown live (that's the drill).
function fairValueStats(game: GameState) {
  const { data, trueTotal } = game;
  if (data.kind === "cards") {
    const visible = [...data.hand, ...data.revealed];
    const undrawn = data.deck.filter((c) => !visible.some((v) => cardEq(v, c)));
    const avgRank = undrawn.reduce((s, c) => s + c.rank, 0) / undrawn.length;
    const variance = undrawn.reduce((s, c) => s + (c.rank - avgRank) ** 2, 0) / undrawn.length;
    const remainingHidden = HIDDEN_COUNT - data.revealed.length;
    const knownSum = visible.reduce((s, c) => s + c.rank, 0);
    return { fairValue: knownSum + remainingHidden * avgRank, stdev: Math.sqrt(remainingHidden * variance) };
  }
  if (data.kind === "dice") {
    const dieMean = (DICE_SIDES + 1) / 2;
    const dieVariance = (DICE_SIDES ** 2 - 1) / 12;
    const visible = [...data.hand, ...data.revealed];
    const remainingHidden = HIDDEN_COUNT - data.revealed.length;
    const knownSum = visible.reduce((s, v) => s + v, 0);
    return { fairValue: knownSum + remainingHidden * dieMean, stdev: Math.sqrt(remainingHidden * dieVariance) };
  }
  // Fermi: no hidden-unit sum to reconstruct — model uncertainty as shrinking
  // geometrically with each narrowing hint revealed.
  const stdev = trueTotal * data.question.tolerancePct * 0.5 ** data.revealedHints.length;
  return { fairValue: trueTotal, stdev };
}

export default function TradingGame() {
  const [scenario, setScenario] = useState<Scenario>("cards");
  const [game, setGame] = useState<GameState>(() => newGame("cards"));
  const [bidInput, setBidInput] = useState("");
  const [askInput, setAskInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [recorded, setRecorded] = useState(false);

  function changeScenario(s: Scenario) {
    setScenario(s);
    setGame(newGame(s));
    setBidInput("");
    setAskInput("");
    setError(null);
    setRecorded(false);
  }

  function submitMarket() {
    const bid = parseFloat(bidInput);
    const ask = parseFloat(askInput);
    if (isNaN(bid) || isNaN(ask)) {
      setError("Enter both a bid and an ask.");
      return;
    }
    if (bid >= ask) {
      setError("Bid must be less than ask.");
      return;
    }
    setError(null);

    const { trueTotal } = game;
    let cash = game.cash;
    let inventory = game.inventory;
    const roundFills: Fill[] = [];

    if (ask < trueTotal) {
      cash += ask;
      inventory -= 1;
      roundFills.push({ round: game.round, side: "BUY", price: ask, informed: true });
    } else if (bid > trueTotal) {
      cash -= bid;
      inventory += 1;
      roundFills.push({ round: game.round, side: "SELL", price: bid, informed: true });
    } else if (Math.random() < NOISE_TRADE_PROB) {
      if (Math.random() < 0.5) {
        cash += ask;
        inventory -= 1;
        roundFills.push({ round: game.round, side: "BUY", price: ask, informed: false });
      } else {
        cash -= bid;
        inventory += 1;
        roundFills.push({ round: game.round, side: "SELL", price: bid, informed: false });
      }
    }

    const isLastRound = game.round >= TOTAL_ROUNDS;

    const next: GameState = {
      ...game,
      cash,
      inventory,
      fills: [...game.fills, ...roundFills],
      quotes: [...game.quotes, { bid, ask }],
      data: revealNext(game.data, isLastRound),
      round: game.round + 1,
      finished: isLastRound,
    };

    setGame(next);
    setBidInput("");
    setAskInput("");

    if (isLastRound && !recorded) {
      const finalPnl = cash + inventory * trueTotal;
      const avgSpread = next.quotes.reduce((s, q) => s + (q.ask - q.bid), 0) / next.quotes.length;
      recordAttempt(createClient(), "market_making", finalPnl, {
        scenario,
        fills: next.fills.length,
        avgSpread,
      });
      setRecorded(true);
    }
  }

  function restart() {
    setGame(newGame(scenario));
    setBidInput("");
    setAskInput("");
    setError(null);
    setRecorded(false);
  }

  const finalPnl = game.finished ? game.cash + game.inventory * game.trueTotal : null;
  const avgSpread = game.quotes.length
    ? game.quotes.reduce((s, q) => s + (q.ask - q.bid), 0) / game.quotes.length
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.key}
                onClick={() => changeScenario(s.key)}
                className={`rounded-full border px-3 py-1.5 font-mono text-xs tracking-wide transition ${
                  scenario === s.key
                    ? "border-[var(--accent-blue)] bg-blue-500/10 text-[var(--accent-blue)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowHelp((s) => !s)}
            className="font-mono text-[0.65rem] text-[var(--accent-blue)] underline underline-offset-2"
          >
            {showHelp ? "Hide" : "How this works"}
          </button>
        </div>

        {showHelp && (
          <div className="mb-5 rounded-md border border-blue-500/20 bg-blue-500/5 p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
            {HELP_TEXT[scenario]}
          </div>
        )}

        {game.data.kind === "fermi" ? (
          <div className="mb-5">
            <div className="mb-2 font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">
              Estimate ({game.data.question.unit})
            </div>
            <div className="rounded-md border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--foreground)]">
              {game.data.question.prompt}
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <div className="mb-2 font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">
              Your Hand
            </div>
            <div className="flex gap-2">
              {game.data.kind === "cards"
                ? game.data.hand.map((c, i) => <UnitTile key={i} label={cardLabel(c)} />)
                : game.data.hand.map((v, i) => <UnitTile key={i} label={String(v)} />)}
            </div>
          </div>
        )}

        <div className="mb-5">
          <div className="mb-2 font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">
            {game.data.kind === "fermi" ? "Hints" : "Revealed"} ({revealedCount(game.data)}/{HIDDEN_COUNT})
          </div>
          {game.data.kind === "fermi" ? (
            <div className="flex flex-col gap-2">
              {game.data.revealedHints.map((h, i) => (
                <div
                  key={i}
                  className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs text-[var(--foreground)]"
                >
                  {h}
                </div>
              ))}
              {Array.from({ length: HIDDEN_COUNT - game.data.revealedHints.length }).map((_, i) => (
                <div
                  key={`hidden-${i}`}
                  className="rounded-md border border-dashed border-[var(--border)] px-3 py-2 font-mono text-xs text-[var(--text-muted)]"
                >
                  ???
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              {game.data.kind === "cards"
                ? game.data.revealed.map((c, i) => <UnitTile key={i} label={cardLabel(c)} />)
                : game.data.revealed.map((v, i) => <UnitTile key={i} label={String(v)} />)}
              {Array.from({ length: HIDDEN_COUNT - revealedCount(game.data) }).map((_, i) => (
                <UnitTile key={`hidden-${i}`} hidden />
              ))}
            </div>
          )}
        </div>

        {!game.finished ? (
          <div>
            <div className="mb-3 font-mono text-xs tracking-widest text-[var(--accent-blue)] uppercase">
              Round {game.round} / {TOTAL_ROUNDS}
            </div>
            <div className="mb-4 flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">Bid</label>
                <input
                  type="number"
                  value={bidInput}
                  onChange={(e) => setBidInput(e.target.value)}
                  className="w-28 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm text-[var(--foreground)]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">Ask</label>
                <input
                  type="number"
                  value={askInput}
                  onChange={(e) => setAskInput(e.target.value)}
                  className="w-28 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm text-[var(--foreground)]"
                />
              </div>
              <button
                onClick={submitMarket}
                className="rounded-md bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
              >
                Submit Market
              </button>
            </div>
            {error && <div className="font-mono text-xs text-[var(--accent-red)]">{error}</div>}
          </div>
        ) : (
          <button
            onClick={restart}
            className="rounded-md bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
          >
            New Game
          </button>
        )}
      </div>

      <div className="rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
        <div className="mb-5 grid grid-cols-4 gap-4">
          <Stat
            label="P&L"
            value={finalPnl !== null ? fmtSigned(finalPnl) : "—"}
            tone={finalPnl !== null ? (finalPnl >= 0 ? "pos" : "neg") : undefined}
          />
          <Stat label="Inventory" value={game.inventory} />
          <Stat label="Fills" value={game.fills.length} />
          <Stat label="Avg Spread" value={avgSpread !== null ? avgSpread.toFixed(2) : "—"} />
        </div>

        {game.finished && (
          <div className="mb-5 rounded-md border border-[var(--border)] bg-[var(--background)] p-4 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
            True {game.data.kind === "fermi" ? "value" : "total"} was{" "}
            <span className="text-[var(--foreground)]">
              {game.trueTotal}
              {game.data.kind === "fermi" ? ` ${game.data.question.unit}` : ""}
            </span>
            .{" "}
            {(() => {
              const stdevs = game.quotes.map((_, i) => {
                const gAtRound: GameState = { ...game, data: sliceDataAt(game.data, i) };
                return fairValueStats(gAtRound).stdev;
              });
              const avgFairSpread = (stdevs.reduce((s, x) => s + x, 0) / stdevs.length) * 2;
              return (
                <>
                  Your average spread was {avgSpread!.toFixed(2)} vs an uncertainty-implied fair
                  spread of ~{avgFairSpread.toFixed(2)} (2×stdev of the remaining uncertainty at each
                  round). {avgSpread! > avgFairSpread * 1.3
                    ? "You quoted wide relative to the uncertainty — safe, but you left edge on the table."
                    : avgSpread! < avgFairSpread * 0.7
                    ? "You quoted tight relative to the uncertainty — that's how you got picked off."
                    : "That's well calibrated to the actual uncertainty."}
                </>
              );
            })()}
          </div>
        )}

        <div className="mb-2 font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">Fill Log</div>
        <div className="max-h-36 overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--background)] p-3 font-mono text-xs leading-relaxed">
          {game.fills.length ? (
            [...game.fills].reverse().map((f, i) => (
              <div key={i} className={f.side === "BUY" ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}>
                r{f.round}  {f.side.padEnd(4)} 1 @ {f.price.toFixed(2)} {f.informed ? "(picked off)" : "(flow)"}
              </div>
            ))
          ) : (
            <span className="text-[var(--text-secondary)]">No fills yet.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtSigned(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(2);
}

function UnitTile({ label, hidden }: { label?: string; hidden?: boolean }) {
  return (
    <div
      className={`flex h-14 w-10 items-center justify-center rounded-md border font-mono text-sm ${
        hidden
          ? "border-dashed border-[var(--border)] text-[var(--text-muted)]"
          : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
      }`}
    >
      {hidden ? "?" : label}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-3.5">
      <div className="mb-1.5 font-mono text-[0.6rem] tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
      <div
        className={`font-mono text-lg font-medium ${
          tone === "pos" ? "text-[var(--accent-green)]" : tone === "neg" ? "text-[var(--accent-red)]" : "text-[var(--foreground)]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
