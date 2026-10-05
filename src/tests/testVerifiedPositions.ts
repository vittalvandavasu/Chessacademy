import { Chess } from 'chess.js';

function verifyFork(fen: string, move: string) {
  const chess = new Chess(fen);
  const m = chess.move(move);
  if (!m) {
    console.error(`Move ${move} is illegal in ${fen}`);
    return false;
  }

  console.log(`Testing move ${move} in ${fen}:`);
  console.log(`  Moved piece: ${m.piece} to ${m.to}`);
  console.log(`  Is check? ${chess.inCheck()}`);

  // Check opponent captures
  const opponentCaptures = chess.moves({ verbose: true }).filter((op) => op.to === m.to);
  if (opponentCaptures.length > 0) {
    console.log(`  WARNING: Opponent can capture ${m.to} with: ${opponentCaptures.map((c) => c.san).join(', ')}`);
  } else {
    console.log(`  SAFE: Opponent cannot capture on ${m.to}!`);
  }

  // Count attacked enemy pieces
  const attackedSquares = getSquares(m.piece, m.to, chess.turn() === 'b' ? 1 : -1);
  const enemyTargets: string[] = [];
  for (const sq of attackedSquares) {
    const p = chess.get(sq as any);
    if (p && p.color === chess.turn()) {
      enemyTargets.push(`${p.type}@${sq}`);
    }
  }
  console.log(`  Attacking ${enemyTargets.length} enemy piece(s): ${enemyTargets.join(', ')}`);
  return true;
}

function getSquares(piece: string, fromSq: string, pawnDir: number): string[] {
  const f = fromSq.charCodeAt(0) - 97;
  const r = parseInt(fromSq[1], 10) - 1;
  const sqs: string[] = [];
  const toSq = (file: number, rank: number) => {
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
      return String.fromCharCode(97 + file) + (rank + 1);
    }
    return null;
  };

  if (piece === 'n') {
    const deltas = [
      [1, 2], [2, 1], [-1, 2], [-2, 1],
      [1, -2], [2, -1], [-1, -2], [-2, -1]
    ];
    for (const [df, dr] of deltas) {
      const s = toSq(f + df, r + dr);
      if (s) sqs.push(s);
    }
  }
  return sqs;
}

console.log('--- TEST 1: ex-fork-1 (c7 fork) ---');
verifyFork('r3k2r/pp3ppp/8/3N4/8/8/PPP2PPP/R4RK1 w kq - 0 1', 'Nc7+');

console.log('\n--- TEST 2: ex-smother-1 (Philidor smothered mate) ---');
const simSmother = new Chess('6rk/6pp/8/4N3/8/8/8/7K w - - 0 1');
const mSmother = simSmother.move('Nf7#');
console.log('Smothered mate Nf7# result:', {
  isCheckmate: simSmother.isCheckmate(),
  legal: !!mSmother,
  fenAfter: simSmother.fen(),
});

console.log('\n--- TEST 3: puz-backrank-1 (true mate in 1) ---');
const simBackRank = new Chess('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1');
const mBackRank = simBackRank.move('Ra8#');
console.log('Backrank mate Ra8# result:', {
  isCheckmate: simBackRank.isCheckmate(),
  legal: !!mBackRank,
  fenAfter: simBackRank.fen(),
});
