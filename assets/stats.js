/* Econ Playground — statistics helpers for the statistics & econometrics topics.
   ST.rng(seed)        → a repeatable random number generator (same seed = same "sample")
   ST.normal(rng)      → one draw from the standard normal distribution
   ST.ols(xs, ys)      → simple regression y = a + b·x with standard errors, t, p and R²
   ST.ncdf / ST.ninv   → normal distribution function and its inverse
   ST.tcdf / ST.tinv   → Student's t distribution function and its inverse */
(function () {
  "use strict";
  // mulberry32: small, fast, good enough for teaching simulations
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function normal(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
  function sd(a) { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)); }

  // error function (Abramowitz–Stegun 7.1.26, error < 1.5e-7)
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  const ncdf = z => 0.5 * (1 + erf(z / Math.SQRT2));
  const npdf = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  function ninv(p) { let lo = -10, hi = 10; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (ncdf(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }

  // log-gamma (Lanczos) and the regularized incomplete beta function (continued fraction)
  function lgamma(x) { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const k of c) s += k / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
  function betacf(a, b, x) {
    const MAXIT = 200, EPS = 3e-12, FPMIN = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
    for (let m = 1; m <= MAXIT; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break; }
    return h;
  }
  function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
  function tcdf(t, df) { const x = df / (df + t * t); const p = 0.5 * ibeta(x, df / 2, 0.5); return t >= 0 ? 1 - p : p; }
  function tinv(p, df) { let lo = -60, hi = 60; for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2; if (tcdf(m, df) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
  function tpdf(t, df) { return Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) / Math.sqrt(df * Math.PI) * Math.pow(1 + t * t / df, -(df + 1) / 2); }

  function ols(xs, ys) {
    const n = xs.length, mx = mean(xs), my = mean(ys); let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; sxx += dx * dx; sxy += dx * dy; syy += dy * dy; }
    const b = sxy / sxx, a = my - b * mx; let sse = 0; for (let i = 0; i < n; i++) { const e = ys[i] - a - b * xs[i]; sse += e * e; }
    const df = n - 2, s2 = sse / df, seB = Math.sqrt(s2 / sxx), seA = Math.sqrt(s2 * (1 / n + mx * mx / sxx));
    const t = b / seB, p = 2 * (1 - tcdf(Math.abs(t), df)), r2 = 1 - sse / syy, r = sxy / Math.sqrt(sxx * syy);
    return { a, b, seA, seB, t, p, r2, r, n, df, sse, mx, my };
  }
  // y = a + b1·x1 + b2·x2 by least squares (2 regressors), returns coefficients only
  function ols2(x1, x2, y) {
    const n = y.length, m1 = mean(x1), m2 = mean(x2), my = mean(y); let s11 = 0, s22 = 0, s12 = 0, s1y = 0, s2y = 0;
    for (let i = 0; i < n; i++) { const a = x1[i] - m1, b = x2[i] - m2, c = y[i] - my; s11 += a * a; s22 += b * b; s12 += a * b; s1y += a * c; s2y += b * c; }
    const det = s11 * s22 - s12 * s12; const b1 = (s22 * s1y - s12 * s2y) / det, b2 = (s11 * s2y - s12 * s1y) / det;
    return { a: my - b1 * m1 - b2 * m2, b1, b2 };
  }
  const fmtP = p => p < 0.001 ? "< 0.001" : p.toFixed(3);
  window.ST = { rng, normal, mean, sd, erf, ncdf, npdf, ninv, tcdf, tinv, tpdf, ols, ols2, fmtP };
})();
