# Econ Playground

Interactive economics explainers. Every topic is built around a graph you can change — move a slider and the curves shift, the numbers update, and a sentence explains what just happened. Under each graph there's a short summary, things to try, common mistakes, the key formulas, the terms in Latvian, and links for further reading.

**Live site:** https://argent0rum.github.io/econ-playground/

## Topics

**Microeconomics**
1. Supply and demand — shifts, price ceilings and floors, consumer and producer surplus
2. Price elasticity of demand — why elasticity changes along a straight demand curve
3. Taxes, who pays, and deadweight loss — tax incidence
4. Production possibilities and opportunity cost
5. Costs and perfect competition — profit, loss, shutdown and break-even
6. Monopoly vs competition — MR = MC, markup, deadweight loss
7. Comparative advantage and trade
8. Inequality — the Lorenz curve and Gini coefficient

**Macroeconomics**

9. The Keynesian cross and the multiplier
10. Aggregate demand and aggregate supply
11. IS–LM: fiscal and monetary policy
12. Compound interest, inflation and real value

## How it's built

Plain HTML, CSS and JavaScript — no frameworks, no build step. Open any `.html` file in a browser and it works.

```
index.html              home page with all topics
supply-demand.html      one file per topic
...
assets/style.css        shared look (colours, layout, light and dark mode)
assets/plot.js          small helper for drawing graphs as SVG
```

Each topic page has three parts:

1. **The controls** — `<input type="range">` sliders inside the "Change the inputs" box.
2. **The script** at the bottom of the page. It reads the sliders, works out the economics (e.g. the equilibrium price), and draws the graph with `plot.js`:

   ```js
   const p = EP.plot("fig", { x: [0, 100], y: [0, 120], xLabel: "Quantity", yLabel: "Price" });
   EP.controls(["dShift", "sShift"], v => {           // runs every time a slider moves
     p.begin().axes();                                // start a fresh drawing
     p.fn(q => 80 + v.dShift - 0.8 * q, "c1");        // demand curve (blue)
     p.fn(q => 10 + v.sShift + 0.6 * q, "c2");        // supply curve (orange)
     p.end();                                         // put it on screen
   });
   ```
3. **The reading part** — normal HTML text.

## Adding a new topic

1. Copy an existing topic page that looks similar (e.g. `monopoly.html`) and rename it.
2. Change the title, the sliders and the text.
3. Change the script: the formulas and what gets drawn.
4. Add a card for it on `index.html`.

## Running it on GitHub Pages

Repository **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, folder `/ (root)`** → Save. The site appears at `https://argent0rum.github.io/econ-playground/` after a minute or two.

## Sources and further reading

- [OpenStax — Principles of Economics 3e](https://openstax.org/books/principles-economics-3e/pages/preface) (free textbook)
- [Khan Academy — Microeconomics](https://www.khanacademy.org/economics-finance-domain/microeconomics) and [Macroeconomics](https://www.khanacademy.org/economics-finance-domain/macroeconomics)
- [CORE Econ — The Economy](https://www.core-econ.org/)

The curves on each page use simple made-up numbers chosen to make the ideas visible; they are teaching models, not real data.
