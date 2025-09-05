function times(n, fn) {
  const N = Math.max(0, n | 0);
  for (let i = 0; i < N; i++) fn(i);
}

module.exports = { times };

