/* Econ Playground — a tiny helper for drawing economics graphs as SVG.
   Every topic page uses it the same way:
     const p = EP.plot("fig", { x: [0, 100], y: [0, 120], xLabel: "Quantity", yLabel: "Price" });
     EP.controls(["slider1", "slider2"], v => { p.begin().axes(); p.fn(q => 80 - q, "c1"); p.end(); });
   p.begin() starts a fresh drawing, p.end() puts it on screen.
   Coordinates you pass in are in "economics units" (e.g. Q = 40, P = 60); the helper converts them to pixels. */
(function () {
  "use strict";
  let clipN = 0;

  function fmt(n, d) {
    if (d === undefined) d = 1;
    if (!isFinite(n)) return "—";
    return Number(n).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function money(n, d) { return (n < 0 ? "−€" : "€") + fmt(Math.abs(n), d === undefined ? 2 : d); }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // pick "nice" tick spacing (1, 2, 2.5, 5 × a power of ten)
  function niceStep(span, target) {
    const raw = span / (target || 6); const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  function plot(id, o) {
    const svg = typeof id === "string" ? document.getElementById(id) : id;
    const W = o.w || 640, H = o.h || 440;
    const m = Object.assign({ l: 58, r: 24, t: 16, b: 48 }, o.m || {});
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("role", "img");
    if (o.title) svg.setAttribute("aria-label", o.title);
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const clip = "clip" + (++clipN);
    let X = o.x.slice(), Y = o.y.slice(), buf = [];
    const sx = x => m.l + (x - X[0]) / (X[1] - X[0]) * iw;
    const sy = y => m.t + ih - (y - Y[0]) / (Y[1] - Y[0]) * ih;
    const P = (x, y) => sx(x).toFixed(1) + "," + sy(y).toFixed(1);

    const api = {
      sx, sy, W, H, m, iw, ih,
      get X() { return X; }, get Y() { return Y; },
      setDomain(x, y) { if (x) X = x.slice(); if (y) Y = y.slice(); return api; },
      begin() { buf = []; return api; },
      end() { svg.innerHTML = `<defs><clipPath id="${clip}"><rect x="${m.l}" y="${m.t - 2}" width="${iw + 2}" height="${ih + 2}"/></clipPath></defs>` + buf.join(""); return api; },
      raw(s) { buf.push(s); return api; },
      // gridlines, tick numbers and axis titles
      axes(opt) {
        opt = opt || {};
        const fx = opt.fx || (v => fmt(v, Number.isInteger(v) ? 0 : 1)), fy = opt.fy || (v => fmt(v, Number.isInteger(v) ? 0 : 1));
        const stx = opt.stepX || niceStep(X[1] - X[0], iw / 80), sty = opt.stepY || niceStep(Y[1] - Y[0], ih / 60);
        for (let v = Math.ceil(X[0] / stx) * stx; v <= X[1] + 1e-9; v += stx) {
          const x = sx(v).toFixed(1); if (v > X[0] + 1e-9) buf.push(`<line class="gl" x1="${x}" x2="${x}" y1="${m.t}" y2="${m.t + ih}"/>`);
          buf.push(`<text class="tk" x="${x}" y="${m.t + ih + 17}" text-anchor="middle">${esc(fx(+v.toFixed(6)))}</text>`);
        }
        for (let v = Math.ceil(Y[0] / sty) * sty; v <= Y[1] + 1e-9; v += sty) {
          const y = sy(v).toFixed(1); if (v > Y[0] + 1e-9) buf.push(`<line class="gl" x1="${m.l}" x2="${m.l + iw}" y1="${y}" y2="${y}"/>`);
          buf.push(`<text class="tk" x="${m.l - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end">${esc(fy(+v.toFixed(6)))}</text>`);
        }
        buf.push(`<line class="ax" x1="${m.l}" x2="${m.l + iw}" y1="${m.t + ih}" y2="${m.t + ih}"/><line class="ax" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${m.t + ih}"/>`);
        if (o.xLabel) buf.push(`<text class="al" x="${m.l + iw}" y="${H - 8}" text-anchor="end">${esc(o.xLabel)}</text>`);
        if (o.yLabel) buf.push(`<text class="al" x="${m.l - 44}" y="${m.t + 4}" transform="rotate(-90 ${m.l - 44} ${m.t + 4})" text-anchor="end">${esc(o.yLabel)}</text>`);
        return api;
      },
      // a line through points [[x,y],...]
      line(pts, cls) { if (pts.length > 1) buf.push(`<polyline clip-path="url(#${clip})" class="${cls || "c1"}" points="${pts.map(p => P(p[0], p[1])).join(" ")}"/>`); return api; },
      seg(x1, y1, x2, y2, cls) { return api.line([[x1, y1], [x2, y2]], cls); },
      // draw y = f(x) between two x values
      fn(f, cls, from, to, n) {
        from = from === undefined ? X[0] : from; to = to === undefined ? X[1] : to; n = n || 160;
        const pts = []; for (let i = 0; i <= n; i++) { const x = from + (to - from) * i / n; const y = f(x); if (isFinite(y)) pts.push([x, y]); }
        return api.line(pts, cls);
      },
      // a filled shape (surplus areas, revenue rectangles…)
      area(pts, cls) { if (pts.length > 2) buf.push(`<polygon clip-path="url(#${clip})" class="${cls || "a1"}" points="${pts.map(p => P(p[0], p[1])).join(" ")}"/>`); return api; },
      rect(x1, y1, x2, y2, cls) { return api.area([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], cls); },
      dot(x, y, cls, r) { buf.push(`<circle class="pt ${cls || ""}" cx="${sx(x).toFixed(1)}" cy="${sy(y).toFixed(1)}" r="${r || 5.5}"/>`); return api; },
      text(x, y, s, cls, anchor, dx, dy) { buf.push(`<text class="lb ${cls || ""}" x="${(sx(x) + (dx || 0)).toFixed(1)}" y="${(sy(y) + (dy || 0)).toFixed(1)}" text-anchor="${anchor || "start"}">${esc(s)}</text>`); return api; },
      // dashed lines from a point down to the x-axis and across to the y-axis, with the values written on the axes
      guide(x, y, lx, ly) {
        buf.push(`<polyline class="guide" points="${P(X[0], y)} ${P(x, y)} ${P(x, Y[0])}"/>`);
        if (ly !== null && ly !== false) buf.push(`<text class="gt" x="${m.l + 4}" y="${(sy(y) - 5).toFixed(1)}">${esc(ly === undefined ? fmt(y) : ly)}</text>`);
        if (lx !== null && lx !== false) buf.push(`<text class="gt" x="${(sx(x) + 4).toFixed(1)}" y="${m.t + ih - 6}">${esc(lx === undefined ? fmt(x) : lx)}</text>`);
        return api;
      }
    };
    return api;
  }

  // Connects sliders/selects/checkboxes to a draw function.
  // ids: the element ids to read. cb(values) runs on every change.
  // Buttons with data-set='{"id": value}' set several controls at once (used for scenarios).
  function controls(ids, cb) {
    const els = ids.map(id => document.getElementById(id));
    const read = () => { const v = {}; els.forEach(el => { v[el.id] = el.type === "checkbox" ? el.checked : el.tagName === "SELECT" ? el.value : parseFloat(el.value); }); return v; };
    const paint = () => {
      els.forEach(el => {
        const out = document.querySelector(`output[for="${el.id}"]`); if (!out) return;
        const f = out.dataset.fmt || ""; const val = parseFloat(el.value);
        out.textContent = (out.dataset.pre || "") + (f === "int" ? fmt(val, 0) : f === "pct" ? fmt(val, Number.isInteger(val) ? 0 : 1) + "%" : f === "dec2" ? fmt(val, 2) : fmt(val, Number.isInteger(val) ? 0 : 1)) + (out.dataset.post || "");
      });
    };
    const update = () => { paint(); cb(read()); };
    els.forEach(el => el.addEventListener("input", update));
    els.forEach(el => el.addEventListener("change", update));
    document.querySelectorAll("[data-set]").forEach(b => b.addEventListener("click", () => {
      const s = JSON.parse(b.dataset.set);
      for (const k in s) { const el = document.getElementById(k); if (!el) continue; if (el.type === "checkbox") el.checked = !!s[k]; else el.value = s[k]; }
      update();
    }));
    let raf = 0;
    window.addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); });
    update();
    return { update, read };
  }

  // Writes the numbers panel: rows = [[label, value, "good"|"bad"|""], ...], note = a sentence explaining what you see.
  function readout(rows, note, id) {
    const el = document.getElementById(id || "readout"); if (!el) return;
    el.innerHTML = `<dl>${rows.map(r => `<dt>${esc(r[0])}</dt><dd class="${r[2] || ""}">${esc(r[1])}</dd>`).join("")}</dl>${note ? `<p>${note}</p>` : ""}`;
  }

  // area of a polygon (shoelace formula) — used for surplus / deadweight loss numbers
  function polyArea(pts) { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  window.EP = { plot, controls, readout, fmt, money, polyArea, clamp, niceStep };
})();
