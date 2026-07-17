function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function isPrime(n: number) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

function nextPrime(n: number) {
  let candidate = n + 1;
  while (!isPrime(candidate)) candidate++;
  return candidate;
}

// --- Single constant-rate rule ---

function generateArithmetic() {
  const start = randInt(1, 20);
  const step = randInt(2, 9);
  const terms = [0, 1, 2, 3].map((i) => start + i * step);
  return { terms, answer: start + 4 * step };
}

function generateGeometric() {
  const start = randInt(1, 5);
  const ratio = randInt(2, 3);
  const terms = [0, 1, 2, 3].map((i) => start * ratio ** i);
  return { terms, answer: start * ratio ** 4 };
}

// --- Polynomial growth ---

function generateSquares() {
  const start = randInt(1, 9);
  const terms = [0, 1, 2, 3].map((i) => (start + i) ** 2);
  return { terms, answer: (start + 4) ** 2 };
}

function generateCubes() {
  const start = randInt(1, 6);
  const terms = [0, 1, 2, 3].map((i) => (start + i) ** 3);
  return { terms, answer: (start + 4) ** 3 };
}

function generateTriangular() {
  const start = randInt(1, 10);
  const terms = [0, 1, 2, 3].map((i) => ((start + i) * (start + i + 1)) / 2);
  return { terms, answer: ((start + 4) * (start + 5)) / 2 };
}

// Differences form their own arithmetic progression (constant 2nd difference),
// a generalization of n(n+1)-style products.
function generateSecondDifference() {
  const start = randInt(1, 15);
  let step = randInt(1, 6);
  const accel = randInt(1, 5);
  const terms = [start];
  for (let i = 0; i < 4; i++) {
    terms.push(terms[terms.length - 1] + step);
    step += accel;
  }
  const answer = terms[terms.length - 1] + step;
  return { terms, answer };
}

function generateFibonacciLike() {
  const terms = [randInt(1, 6), randInt(1, 6)];
  for (let i = 2; i < 5; i++) terms.push(terms[i - 1] + terms[i - 2]);
  const answer = terms[terms.length - 1] + terms[terms.length - 2];
  return { terms, answer };
}

// --- Harder: rule changes per step, or two rules interleaved ---

// Alternates between two operations, e.g. x2, +5, x2, +5, ...
function generateAlternatingOperation() {
  const mult = randInt(2, 3);
  const add = randInt(2, 9);
  const terms = [randInt(1, 10)];
  for (let i = 0; i < 5; i++) {
    const prev = terms[terms.length - 1];
    terms.push(i % 2 === 0 ? prev * mult : prev + add);
  }
  const answer = terms.pop() as number;
  return { terms, answer };
}

// Two independent sub-sequences woven into odd/even positions.
function generateInterleaved() {
  function subGen(): (i: number) => number {
    if (Math.random() < 0.5) {
      const start = randInt(1, 20);
      const step = randInt(2, 9);
      return (i) => start + i * step;
    }
    const start = randInt(1, 4);
    const ratio = randInt(2, 3);
    return (i) => start * ratio ** i;
  }
  const genA = subGen();
  const genB = subGen();
  const terms = [0, 1, 2, 3, 4, 5].map((i) => (i % 2 === 0 ? genA(i / 2) : genB((i - 1) / 2)));
  const answer = genA(3);
  return { terms, answer };
}

function generatePrimes() {
  let n = randInt(2, 20);
  while (!isPrime(n)) n++;
  const terms = [n];
  for (let i = 0; i < 4; i++) terms.push(nextPrime(terms[terms.length - 1]));
  const answer = terms.pop() as number;
  return { terms, answer };
}

const GENERATORS = [
  generateArithmetic,
  generateGeometric,
  generateSquares,
  generateCubes,
  generateTriangular,
  generateSecondDifference,
  generateFibonacciLike,
  generateAlternatingOperation,
  generateInterleaved,
  generatePrimes,
];

export function generateSequence(): { text: string; answer: number } {
  const gen = GENERATORS[Math.floor(Math.random() * GENERATORS.length)];
  const { terms, answer } = gen();
  return { text: `${terms.join(", ")}, ?`, answer };
}
