// Original cast, drawn on a 2D canvas and shown as camera-facing cards in the 3D set.
// Style: mature sci-fi anime figures (about 7.5 heads tall, lean, angular faces, narrow eyes, long coats),
// inked in the same navy drafting line as the blueprint set. Card technique after claude-animated-shorts.
// Design space: 512 x 768 units, soles at y = 748. The object keeps the name "Chibi" for the callers.
(function () {
  const INK = "#1f2a44";
  const CX = 256, SOLE = 748;
  const mulc = (c, k) => {
    const n = parseInt(c.slice(1), 16);
    const ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k))).toString(16).padStart(2, "0");
    return "#" + ch(16) + ch(8) + ch(0);
  };
  const SKIN = "#fbf6ea", SKIN_SH = "#e2d7c0";
  const CAST = {
    kai: { name: "KAI", hair: "#34466b", hairHi: "#5b6f96", eye: "#4f7a4a", coat: "#7388ad", coatSh: "#5b6f96", shirt: "#e9dfc6", pants: "#5b6f96", boots: "#34466b", accent: "#93b08e", build: "m" },
    ops: { name: "OPS", hair: "#d9773c", hairHi: "#ec9a66", eye: "#a8501c", coat: "#e9dfc6", coatSh: "#d6c9aa", shirt: "#7388ad", pants: "#5b6f96", boots: "#34466b", accent: "#d9773c", build: "f" },
    scout: { name: "SCOUT", hair: "#5b6f96", hairHi: "#7388ad", eye: "#a8501c", coat: "#b4c6dc", coatSh: "#93a9c4", shirt: "#e9dfc6", pants: "#d6c9aa", boots: "#5b6f96", accent: "#d9773c", build: "s" },
  };

  function shape(g, fill, pts, lw, close) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    if (close !== false) g.closePath();
    g.lineJoin = "round"; g.lineCap = "round"; g.lineWidth = lw || 5; g.strokeStyle = INK; g.stroke();
    if (fill) { g.fillStyle = fill; g.fill(); }
  }
  function path(g, fill, fn, lw) { g.beginPath(); fn(g); g.lineJoin = "round"; g.lineCap = "round"; g.lineWidth = lw || 5; g.strokeStyle = INK; g.stroke(); if (fill) { g.fillStyle = fill; g.fill(); } }
  function limb(g, x0, y0, x1, y1, w, color) {
    g.lineCap = "round"; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1);
    g.strokeStyle = INK; g.lineWidth = w + 9; g.stroke(); g.strokeStyle = color; g.lineWidth = w; g.stroke();
  }
  const stroke = (g, pts, lw, color) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineWidth = lw; g.strokeStyle = color || INK; g.lineCap = "round"; g.lineJoin = "round"; g.stroke(); };

  const headPath = (hx, y0) => (g) => {
    g.moveTo(hx - 36, y0 + 40); g.bezierCurveTo(hx - 40, y0 - 6, hx + 40, y0 - 6, hx + 36, y0 + 40);
    g.lineTo(hx + 33, y0 + 64); g.lineTo(hx + 17, y0 + 87); g.quadraticCurveTo(hx, y0 + 97, hx - 17, y0 + 87); g.lineTo(hx - 33, y0 + 64); g.closePath();
  };

  function face(g, c, hx, y0, p) {
    const lk = p.look * 3;
    path(g, SKIN, headPath(hx, y0), 4.5);
    g.save(); g.beginPath(); headPath(hx, y0)(g); g.clip();
    g.fillStyle = SKIN_SH; g.fillRect(hx + 15 + lk, y0 - 10, 40, 120);                         // cel shadow on the far side
    g.beginPath(); g.moveTo(hx - 40, y0 + 34); g.lineTo(hx + 40, y0 + 30); g.lineTo(hx + 40, y0 - 10); g.lineTo(hx - 40, y0 - 10); g.fill();   // under the hair
    g.restore();
    const ey = y0 + 54;
    for (const s of [-1, 1]) {
      const x = hx + s * 16 + lk;
      if (p.blink > 0.5) { stroke(g, [[x - 9, ey + 1], [x + 9, ey + 1]], 3); continue; }
      g.save(); g.beginPath(); g.ellipse(x, ey + 1, 10, p.mouth === "o" ? 6.5 : 5, 0, 0, 7); g.fillStyle = "#ffffff"; g.fill(); g.clip();
      g.beginPath(); g.arc(x + p.look * 2.6, ey + 0.5, 5, 0, 7); g.fillStyle = c.eye; g.fill();
      g.beginPath(); g.arc(x + p.look * 2.6, ey + 0.5, 2.1, 0, 7); g.fillStyle = INK; g.fill();
      g.beginPath(); g.arc(x + p.look * 2.6 - 1.8, ey - 1.6, 1.4, 0, 7); g.fillStyle = "#ffffff"; g.fill();
      g.restore();
      stroke(g, [[x - s * 11, ey + 1], [x - s * 3, ey - 5.5], [x + s * 11, ey - 3.5]], 3.6);     // heavy upper lid, outer corner raised
      stroke(g, [[x - 6, ey + 6.5], [x + 6, ey + 6.5]], 1.3);
      const bi = p.brow > 0 ? 4 * p.brow : 0, bo = p.brow < 0 ? -5 * p.brow : 0;                   // keen: inner end down; worried: outer end down
      stroke(g, [[x - s * 12, ey - 15 + bi * 0.2 + bo * 0.2], [x - s * 2, ey - 13 + bi - bo * 0.6], [x + s * 12, ey - 16 + bo]], 3.4);
    }
    stroke(g, [[hx + lk + 1, y0 + 60], [hx + lk + 4, y0 + 71], [hx + lk - 1, y0 + 72]], 2);
    const my = y0 + 81, mx = hx + lk;
    if (p.mouth === "open") { g.beginPath(); g.ellipse(mx, my + 1, 6, 4, 0, 0, 7); g.fillStyle = "#34466b"; g.fill(); g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); }
    else if (p.mouth === "o") { g.beginPath(); g.ellipse(mx, my + 1, 3.6, 5, 0, 0, 7); g.fillStyle = "#34466b"; g.fill(); }
    else if (p.mouth === "flat") stroke(g, [[mx - 7, my + 1], [mx + 7, my + 1]], 2.4);
    else if (p.mouth === "grin") { path(g, "#ffffff", (g) => { g.moveTo(mx - 9, my - 1); g.quadraticCurveTo(mx, my + 8, mx + 9, my - 2); g.closePath(); }, 2); }
    else stroke(g, [[mx - 8, my], [mx, my + 2.5], [mx + 8, my - 1.5]], 2.4);
  }

  // pose: { bob, blink, mouth, brow (-1 worried .. 1 keen), armL, armR (deg: 0 down, 90 out, 170 up), look (-1..1),
  //         sq (squash, 1 = none), lean (deg), glow (0..1), hold: "scroll" | "tablet" | "report" | null }
  function draw(g, who, pose, t) {
    const c = CAST[who];
    const p = Object.assign({ bob: 0, blink: 0, mouth: "smile", brow: 0, armL: 8, armR: 8, look: 0, sq: 1, lean: 0, glow: 0 }, pose);
    const S = g.canvas.width / 512;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    g.setTransform(S, 0, 0, S, 0, 0);
    g.translate(CX, SOLE); g.rotate((p.lean * Math.PI) / 180); g.scale(1 / Math.sqrt(p.sq), p.sq);
    if (c.build === "s") g.scale(0.93, 0.93);
    g.translate(-CX, -SOLE);
    const b = p.bob * 0.45;                         // breathing lifts the upper body a little
    const f = c.build === "f", sw = f ? 52 : 62, wst = f ? 33 : 42, hip = f ? 44 : 45;
    const sy = 170 + b, hx = CX + p.look * 3, y0 = 48 + b;
    const sway = Math.sin(t * 1.7 + (who === "ops" ? 1.3 : who === "scout" ? 2.1 : 0)) * 5;

    // ---- coat tail / hair behind the body
    if (who === "kai") shape(g, c.coatSh, [[CX - 70, 300], [CX + 70, 300], [CX + 92 + sway, 636], [CX + 40 + sway * 0.6, 652], [CX, 640], [CX - 44 + sway * 0.6, 652], [CX - 90 + sway, 632]]);
    if (who === "scout") shape(g, c.coatSh, [[hx - 50, y0 + 74], [hx - 58, y0 + 8], [hx - 30, y0 - 22], [hx + 30, y0 - 22], [hx + 58, y0 + 8], [hx + 50, y0 + 74], [CX + 46, sy + 6], [CX - 46, sy + 6]]);
    if (who === "ops") shape(g, mulc(c.hair, 0.82), [[hx - 44, y0 + 30], [hx - 40, y0 - 4], [hx, y0 - 16], [hx + 40, y0 - 4], [hx + 44, y0 + 30], [hx + 46, y0 + 92], [hx + 30, y0 + 86], [hx - 28, y0 + 90], [hx - 50, y0 + 108], [hx - 46, y0 + 60]]);
    if (who === "kai") shape(g, mulc(c.hair, 0.85), [[hx - 41, y0 + 52], [hx - 44, y0 + 6], [hx - 20, y0 - 16], [hx + 8, y0 - 20], [hx + 30, y0 - 30], [hx + 30, y0 - 12], [hx + 50, y0 - 14], [hx + 42, y0 + 8], [hx + 54, y0 + 20], [hx + 42, y0 + 30], [hx + 48, y0 + 62], [hx + 36, y0 + 52]]);

    // ---- legs and boots
    for (const s of [-1, 1]) {
      const hxp = CX + s * 23, kx = CX + s * 27, ax = CX + s * 31, top = 340 + b * 0.3, bootTop = f ? 580 : 668;
      shape(g, c.pants, [[hxp - 21, top], [hxp + 21, top], [kx + 17, 560], [ax + 13, 716], [ax - 13, 716], [kx - 17, 560]]);
      shape(g, c.boots, [[ax - 15 - (f ? 2 : 0), bootTop], [ax + 15 + (f ? 2 : 0), bootTop], [ax + 14, 716], [ax + (s > 0 ? 30 : 16), SOLE], [ax - (s > 0 ? 16 : 30), SOLE], [ax - 14, 716]]);
      stroke(g, [[kx - 10, 556], [kx + 10, 562]], 2);
    }
    // ---- torso (shirt), belt
    shape(g, c.shirt, [[CX - sw, sy], [CX + sw, sy], [CX + wst, 300 + b * 0.5], [CX + hip, 352], [CX - hip, 352], [CX - wst, 300 + b * 0.5]]);
    g.fillStyle = mulc(c.shirt, 0.86); g.fillRect(CX + 12, sy + 6, wst - 14, 170);
    shape(g, INK, [[CX - hip + 2, 322], [CX + hip - 2, 322], [CX + hip - 1, 336], [CX - hip + 1, 336]], 2);
    g.fillStyle = c.accent; g.fillRect(CX - 8, 322, 16, 14);
    // ---- neck
    shape(g, SKIN, [[hx - 12, y0 + 84], [hx + 12, y0 + 84], [CX + 15, sy + 4], [CX - 15, sy + 4]], 4);
    g.fillStyle = SKIN_SH; g.fillRect(hx - 10, y0 + 90, 22, 13);

    // ---- outer layer
    if (who === "kai") {                         // long open coat with a high collar
      for (const s of [-1, 1]) {
        shape(g, s > 0 ? c.coatSh : c.coat, [[CX + s * (sw + 5), sy - 4], [CX + s * 16, sy - 8], [CX + s * 12, 300], [CX + s * 20, 470], [CX + s * 30 + sway * 0.4, 644],
          [CX + s * 84 + sway * 0.5, 630], [CX + s * 68, 430], [CX + s * (wst + 8), 300]]);
        stroke(g, [[CX + s * 16, sy - 6], [CX + s * 34, 250], [CX + s * 14, 312]], 2.4);                                    // lapel
        stroke(g, [[CX + s * 50, 380], [CX + s * 58, 600]], 1.8);                                                             // fold
        shape(g, c.coat, [[CX + s * 14, sy - 6], [CX + s * 40, sy - 26], [CX + s * 50, sy - 2], [CX + s * 30, sy + 22]], 4);    // collar
      }
      shape(g, c.accent, [[CX - 26, sy - 14], [CX + 26, sy - 14], [CX + 20, sy + 8], [CX - 20, sy + 8]], 4);               // scarf
      shape(g, mulc(c.accent, 0.84), [[CX - 20, sy + 4], [CX - 2, sy + 4], [CX + 6 + sway, sy + 96], [CX - 16 + sway, sy + 104]], 4);
    } else if (who === "ops") {                  // cropped flight jacket
      for (const s of [-1, 1]) {
        shape(g, s > 0 ? c.coatSh : c.coat, [[CX + s * (sw + 4), sy - 3], [CX + s * 12, sy - 6], [CX + s * 9, 296], [CX + s * (wst + 6), 304], [CX + s * (wst + 8), 236]]);
        stroke(g, [[CX + s * 13, sy], [CX + s * 10, 292]], 5, c.accent);
        shape(g, c.coat, [[CX + s * 12, sy - 6], [CX + s * 34, sy - 20], [CX + s * 42, sy + 2], [CX + s * 22, sy + 20]], 4);
      }
    } else {                                     // hooded short cloak with a ragged hem
      shape(g, c.coat, [[CX - sw - 10, sy - 6], [CX + sw + 10, sy - 6], [CX + 84, 318], [CX + 54, 372 + sway * 0.4], [CX + 22, 344], [CX - 14, 384 + sway * 0.4], [CX - 48, 350], [CX - 86, 330]]);
      g.fillStyle = c.coatSh; g.beginPath(); g.moveTo(CX + 20, sy); g.lineTo(CX + sw + 6, sy); g.lineTo(CX + 80, 314); g.lineTo(CX + 54, 366); g.lineTo(CX + 26, 340); g.fill();
      stroke(g, [[CX - 30, sy + 30], [CX - 20, 340]], 1.8); stroke(g, [[CX + 36, sy + 30], [CX + 44, 330]], 1.8);
      shape(g, c.accent, [[CX - 30, sy - 16], [CX + 30, sy - 16], [CX + 24, sy + 10], [CX - 24, sy + 10]], 4);
    }

    // ---- arms (two segments), hands, held items
    const sleeve = who === "scout" ? c.shirt : c.coat;
    const arm = (s, deg) => {
      const a = (deg * Math.PI) / 180, a2 = ((deg * 1.1 + 10) * Math.PI) / 180;
      const x0 = CX + s * (sw - 3), yS = sy + 12, L1 = 104, L2 = 96;
      const x1 = x0 + s * Math.sin(a) * L1, y1 = yS + Math.cos(a) * L1, x2 = x1 + s * Math.sin(a2) * L2, y2 = y1 + Math.cos(a2) * L2;
      limb(g, x0, yS, x1, y1, 25, s > 0 && who !== "scout" ? c.coatSh : sleeve); limb(g, x1, y1, x2, y2, 21, s > 0 && who !== "scout" ? c.coatSh : sleeve);
      const hxp = x2 + s * Math.sin(a2) * 13, hyp = y2 + Math.cos(a2) * 13;
      path(g, SKIN, (g) => g.ellipse(hxp, hyp, 10, 12, -s * a2, 0, 7), 4);
      return [hxp, hyp];
    };
    const hL = arm(-1, p.armL), hR = arm(1, p.armR);
    const item = (h, kind) => {
      if (kind === "scroll") { shape(g, "#fbf6ea", [[h[0] - 9, h[1] - 44], [h[0] + 9, h[1] - 44], [h[0] + 9, h[1] + 30], [h[0] - 9, h[1] + 30]], 4); g.fillStyle = "#93b08e"; g.fillRect(h[0] - 11, h[1] - 10, 22, 9); }
      else if (kind === "tablet") { shape(g, "#fbf6ea", [[h[0] - 30, h[1] - 44], [h[0] + 32, h[1] - 40], [h[0] + 30, h[1] + 6], [h[0] - 32, h[1] + 2]], 4); g.fillStyle = "#93b08e";
        for (let i = 0; i < 3; i++) g.fillRect(h[0] - 20, h[1] - 32 + i * 11, 26 + ((i * 17) % 18), 4.5); }
      else if (kind === "report") { shape(g, "#fbf6ea", [[h[0] - 20, h[1] - 52], [h[0] + 20, h[1] - 52], [h[0] + 20, h[1] + 4], [h[0] - 20, h[1] + 4]], 4); g.fillStyle = "#d9773c";
        for (let i = 0; i < 3; i++) g.fillRect(h[0] - 12, h[1] - 40 + i * 12, 24 - i * 6, 5); }
    };
    if (p.hold) item(p.holdL ? hL : hR, p.hold);

    // ---- head
    for (const s of [-1, 1]) if (who !== "scout") path(g, SKIN, (g) => g.ellipse(hx + s * 36, y0 + 52, 6, 10, 0, 0, 7), 4);
    face(g, c, hx, y0, p);
    if (who === "kai") {                         // short hair swept back, a few strands over the brow
      shape(g, c.hair, [[hx - 39, y0 + 46], [hx - 42, y0 + 8], [hx - 22, y0 - 14], [hx + 6, y0 - 18], [hx + 30, y0 - 8], [hx + 41, y0 + 12], [hx + 38, y0 + 46], [hx + 33, y0 + 24],
        [hx + 20, y0 + 28], [hx + 10, y0 + 14], [hx - 2, y0 + 27], [hx - 14, y0 + 12], [hx - 24, y0 + 25], [hx - 33, y0 + 14]], 4.5);
      stroke(g, [[hx - 26, y0 + 2], [hx - 2, y0 - 8], [hx + 22, y0 - 2]], 3, c.hairHi);
    } else if (who === "ops") {                  // sharp asymmetric bob, swept fringe
      shape(g, c.hair, [[hx - 40, y0 + 62], [hx - 44, y0 + 14], [hx - 26, y0 - 12], [hx + 8, y0 - 18], [hx + 34, y0 - 4], [hx + 43, y0 + 22], [hx + 42, y0 + 70], [hx + 32, y0 + 44],
        [hx + 26, y0 + 20], [hx + 6, y0 + 12], [hx - 12, y0 + 24], [hx - 28, y0 + 30], [hx - 32, y0 + 78]], 4.5);
      stroke(g, [[hx - 28, y0 + 4], [hx - 4, y0 - 6], [hx + 24, y0 + 4]], 3, c.hairHi);
      g.beginPath(); g.arc(hx, y0 + 26, 48, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = INK; g.lineWidth = 12; g.stroke(); g.strokeStyle = "#7388ad"; g.lineWidth = 6; g.stroke();
      shape(g, "#93b08e", [[hx - 50, y0 + 36], [hx - 38, y0 + 36], [hx - 38, y0 + 68], [hx - 50, y0 + 68]], 4);
      stroke(g, [[hx - 44, y0 + 66], [hx - 30, y0 + 84], [hx - 14, y0 + 86]], 3, INK);
    } else {                                     // hood rim, fringe, goggles pushed up
      shape(g, c.hair, [[hx - 30, y0 + 30], [hx - 32, y0 + 6], [hx + 32, y0 + 6], [hx + 30, y0 + 26], [hx + 20, y0 + 32], [hx + 8, y0 + 24], [hx - 6, y0 + 32], [hx - 18, y0 + 24]], 4);
      for (const s of [-1, 1]) shape(g, s > 0 ? c.coatSh : c.coat, [[hx + s * 52, y0 + 76], [hx + s * 58, y0 + 8], [hx + s * 30, y0 - 22], [hx + s * 34, y0 + 14], [hx + s * 31, y0 + 60], [hx + s * 40, y0 + 96]], 4.5);
      shape(g, c.coat, [[hx - 31, y0 - 22], [hx + 31, y0 - 22], [hx + 34, y0 + 10], [hx - 34, y0 + 10]], 4.5);
      limb(g, hx - 34, y0 + 14, hx + 34, y0 + 14, 8, "#5b6f96");
      for (const s of [-1, 1]) { path(g, c.accent, (g) => g.ellipse(hx + s * 15, y0 + 13, 12, 9, 0, 0, 7), 4); g.fillStyle = "rgba(255,255,255,.7)"; g.beginPath(); g.ellipse(hx + s * 15 - 4, y0 + 10, 3.5, 2.2, -0.5, 0, 7); g.fill(); }
    }

    if (p.glow > 0.01) {
      g.globalCompositeOperation = "source-atop"; g.fillStyle = `rgba(147,176,142,${0.8 * p.glow})`; g.fillRect(-300, -300, 1100, 1400);
      g.globalCompositeOperation = "source-over";
    }
  }

  // deterministic blink: closed for 0.13 s every few seconds, phase per character
  function blinkAt(t, seed) {
    const period = 2.9 + seed * 0.9, ph = (t + seed * 1.7) % period;
    return ph < 0.13 ? 1 : 0;
  }
  window.Chibi = { CAST, INK, draw, blinkAt, mulc };
})();
