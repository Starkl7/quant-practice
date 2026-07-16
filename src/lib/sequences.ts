function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

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

function generateSquares() {
  const start = randInt(1, 6);
  const terms = [0, 1, 2, 3].map((i) => (start + i) ** 2);
  return { terms, answer: (start + 4) ** 2 };
}

// n(n+1) products, e.g. 2, 6, 12, 20, ...
function generateQuadratic() {
  const start = randInt(1, 6);
  const terms = [0, 1, 2, 3].map((i) => (start + i) * (start + i + 1));
  return { terms, answer: (start + 4) * (start + 5) };
}

function generateFibonacciLike() {
  const terms = [randInt(1, 5), randInt(1, 5)];
  for (let i = 2; i < 4; i++) terms.push(terms[i - 1] + terms[i - 2]);
  return { terms, answer: terms[3] + terms[2] };
}

const GENERATORS = [generateArithmetic, generateGeometric, generateSquares, generateQuadratic, generateFibonacciLike];

export function generateSequence(): { text: string; answer: number } {
  const gen = GENERATORS[Math.floor(Math.random() * GENERATORS.length)];
  const { terms, answer } = gen();
  return { text: `${terms.join(", ")}, ?`, answer };
}
