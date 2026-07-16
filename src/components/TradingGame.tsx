"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordAttempt } from "@/lib/supabase/attempts";

const SUITS = ["♠", "♥", "♦", "♣"] as const;
const TOTAL_ROUNDS = 4;
const HIDDEN_COUNT = 4;
const NOISE_TRADE_PROB = 0.2;

type Card = { rank: number; suit: (typeof SUITS)[number] };

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) deck.push({ rank, suit });
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardLabel(c: Card) {
  const rankLabel = c.rank === 1 ? "A" : c.rank === 11 ? "J" : c.rank === 12 ? "Q" : c.rank === 13 ? "K" : String(c.rank);
  return `${rankLabel}${c.suit}`;
}

function cardEq(a: Card, b: Card) {
  return a.rank === b.rank && a.suit === b.suit;
}

type Fill = { round: number; side: "BUY" | "SELL"; price: number; informed: boolean };

type GameState = {
  deck: Card[];
  hand: Card[];
  hiddenPool: Card[];
  revealed: Card[];
  trueTotal: number;
  round: number;
  cash: number;
  inventory: number;
  fills: Fill[];
  quotes: { bid: number; ask: number }[];
  finished: boolean;
};

function newGame(): GameState {
  const deck = shuffle(buildDeck());
  const dealt = deck.slice(0, 2 + HIDDEN_COUNT);
  const hand = dealt.slice(0, 2);
  const hiddenPool = dealt.slice(2);
  const trueTotal = dealt.reduce((s, c) => s + c.rank, 0);
  return {
    deck,
    hand,
    hiddenPool,
    revealed: [],
    trueTotal,
    round: 1,
    cash: 0,
    inventory: 0,
    fills: [],
    quotes: [],
    finished: false,
  };
}

// Bayesian "fair value" the player would need to estimate mentally each round —
// used only in the post-game feedback panel, never shown live (that's the drill).
function fairValueStats(g: GameState) {
  const visible = [...g.hand, ...g.revealed];
  const undrawn = g.deck.filter((c) => !visible.some((v) => cardEq(v, c)));
  const avgRank = undrawn.reduce((s, c) => s + c.rank, 0) / undrawn.length;
  const variance = undrawn.reduce((s, c) => s + (c.rank - avgRank) ** 2, 0) / undrawn.length;
  const remainingHidden = HIDDEN_COUNT - g.revealed.length;
  const knownSum = visible.reduce((s, c) => s + c.rank, 0);
  const fairValue = knownSum + remainingHidden * avgRank;
  const stdev = Math.sqrt(remainingHidden * variance);
  return { fairValue, stdev };
}

export default function TradingGame() {
  const [game, setGame] = useState<GameState>(() => newGame());
  const [bidInput, setBidInput] = useState("");
  const [askInput, setAskInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [recorded, setRecorded] = useState(false);

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
    const revealed = isLastRound
      ? [...game.revealed, ...game.hiddenPool.slice(game.revealed.length)]
      : [...game.revealed, game.hiddenPool[game.revealed.length]];

    const next: GameState = {
      ...game,
      cash,
      inventory,
      fills: [...game.fills, ...roundFills],
      quotes: [...game.quotes, { bid, ask }],
      revealed,
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
        mode: "trading_game",
        fills: next.fills.length,
        avgSpread,
      });
      setRecorded(true);
    }
  }

  function restart() {
    setGame(newGame());
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
        <div className="mb-4 flex items-center justify-between">
          <div className="font-mono text-xs tracking-widest text-[var(--text-secondary)] uppercase">
            Trading Game — Make Me A Market
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
            This is the format actually used in trading interviews at firms like Jane Street and
            Optiver: a hidden total value is built from cards, you see a partial hand, and across
            several rounds you must quote a two-sided market (bid/ask) on the sum. A counterparty
            trades against you whenever it&apos;s profitable for them — so quoting too tight gets you
            picked off, quoting too wide means you rarely trade and capture no edge. Each round
            reveals one more hidden card; the goal is to tighten your market as your uncertainty
            shrinks, and to walk away with positive realized P&amp;L once everything is revealed.
          </div>
        )}

        <div className="mb-5">
          <div className="mb-2 font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">
            Your Hand
          </div>
          <div className="flex gap-2">
            {game.hand.map((c, i) => (
              <CardTile key={i} card={c} />
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-2 font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)] uppercase">
            Revealed Cards ({game.revealed.length}/{HIDDEN_COUNT})
          </div>
          <div className="flex gap-2">
            {game.revealed.map((c, i) => (
              <CardTile key={i} card={c} />
            ))}
            {Array.from({ length: HIDDEN_COUNT - game.revealed.length }).map((_, i) => (
              <CardTile key={`hidden-${i}`} hidden />
            ))}
          </div>
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
            True total was <span className="text-[var(--foreground)]">{game.trueTotal}</span>.{" "}
            {(() => {
              const stdevs = game.quotes.map((_, i) => {
                const gAtRound: GameState = { ...game, revealed: game.revealed.slice(0, i) };
                return fairValueStats(gAtRound).stdev;
              });
              const avgFairSpread = (stdevs.reduce((s, x) => s + x, 0) / stdevs.length) * 2;
              return (
                <>
                  Your average spread was {avgSpread!.toFixed(2)} vs an uncertainty-implied fair
                  spread of ~{avgFairSpread.toFixed(2)} (2×stdev of the hidden cards remaining at each
                  round). {avgSpread! > avgFairSpread * 1.3
                    ? "You quoted wide relative to the uncertainty — safe, but you left edge on the table."
                    : avgSpread! < avgFairSpread * 0.7
                    ? "You quoted tight relative to the uncertainty — that's how you got picked off."
                    : "That's well calibrated to the actual uncertainty in the hidden cards."}
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

function CardTile({ card, hidden }: { card?: Card; hidden?: boolean }) {
  return (
    <div
      className={`flex h-14 w-10 items-center justify-center rounded-md border font-mono text-sm ${
        hidden
          ? "border-dashed border-[var(--border)] text-[var(--text-muted)]"
          : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
      }`}
    >
      {hidden ? "?" : cardLabel(card!)}
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
