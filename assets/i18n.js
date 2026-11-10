/* Language switch (EN / LV). Latvian strings live in assets/lv.js, keyed by the exact English text. */
(function () {
  window.EP = window.EP || {};
  var lang = "en"; try { lang = localStorage.getItem("ep.lang") === "lv" ? "lv" : "en"; } catch (e) {}
  EP.lang = lang;
  var page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
  var LV = window.EP_LV || { common: {}, pages: {} }, D = Object.assign({}, LV.common, LV.pages[page] || {});
  EP.t = function (s) { return lang === "lv" && D[s] != null ? D[s] : s; };
  EP.hasLv = !!LV.pages[page];
  var nav = document.querySelector("header.site nav");
  if (nav) {
    var b = document.createElement("button"); b.type = "button"; b.className = "langbtn"; b.textContent = lang === "lv" ? "EN" : "LV";
    b.setAttribute("aria-label", lang === "lv" ? "Switch to English" : "Pārslēgt uz latviešu valodu");
    b.onclick = function () { try { localStorage.setItem("ep.lang", lang === "lv" ? "en" : "lv"); } catch (e) {} location.reload(); };
    nav.appendChild(b);
  }
  if (lang !== "lv") return;
  document.documentElement.lang = "lv";
  [].slice.call(document.querySelectorAll("h1,h2,h3,p,li,b,button,option,dt,span,a,div.crumb")).forEach(function (el) {
    if (!el.isConnected || el.closest("svg") || el.closest('body [lang="lv"]')) return;
    var k = el.innerHTML.trim(); if (D[k] != null) el.innerHTML = D[k];
  });
  [].slice.call(document.querySelectorAll(".key")).forEach(function (el) { var n = el.lastChild; if (n && n.nodeType === 3 && D[n.nodeValue.trim()] != null) n.nodeValue = D[n.nodeValue.trim()]; });
  [].slice.call(document.querySelectorAll("output[data-post],output[data-pre]")).forEach(function (el) { ["post", "pre"].forEach(function (k) { var v = el.dataset[k]; if (v && D[v] != null) el.dataset[k] = D[v]; }); });
  var h1 = document.querySelector("h1"); if (h1 && page !== "index") document.title = h1.textContent + " · Econ Playground";
  if (!EP.hasLv && page !== "index") { var lede = document.querySelector(".lede"); if (lede) { var n = document.createElement("p"); n.className = "lvnote"; n.textContent = "Šīs tēmas teksts pagaidām ir angļu valodā. Termini latviski ir sānu joslā."; lede.after(n); } }
  if (!EP.plot) return;
  var plot0 = EP.plot;
  EP.plot = function (id, o) {
    o = Object.assign({}, o); ["xLabel", "yLabel", "title"].forEach(function (k) { if (o[k]) o[k] = EP.t(o[k]); });
    var p = plot0(id, o);
    if (p && typeof p.text === "function") { var t0 = p.text; p.text = function () { var a = [].slice.call(arguments); if (typeof a[2] === "string") a[2] = EP.t(a[2]); return t0.apply(p, a); }; }
    return p;
  };
  var r0 = EP.readout;
  EP.readout = function (rows, note, id) { return r0(rows.map(function (r) { r = r.slice(); r[0] = EP.t(r[0]); if (typeof r[1] === "string") r[1] = r[1].replace(" / qtr", " / cet.").replace("(run of 7)", "(7 pēc kārtas)").replace(/^none$/, "nav").replace("samples 1–20", "1.–20. izlase").replace(" items", " vienības"); return r; }), note, id); };
})();
