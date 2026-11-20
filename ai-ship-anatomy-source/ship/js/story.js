// Direction: what the 3D set, the cast and the drafting callouts do at time t.
// Everything here is a pure function of t (HyperFrames seeks frames in any order).
// Camera rules follow claude-animated-shorts: cuts on big jumps, smootherstep glides, every hold creeps,
// impact kicks that flip sign each frame and decay over 7 frames.
(function () {
  const { THREE, cam, P, cast, render } = World;
  const TM = window.TIMING, C = TM.cues, SC = {};
  TM.scenes.forEach((s) => (SC[s.id] = s));
  const A = document.getElementById("anno").getContext("2d");
  const nightEl = document.getElementById("night");
  const INK = "#1f2a44", PAPER = "#f7f0dd", ORANGE = "#a8501c", SAGE = "#4f7a4a";

  const clamp = (x, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, x));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (u) => u * u * u * (u * (u * 6 - 15) + 10);
  const eo = (u) => 1 - Math.pow(1 - u, 3);
  const ei = (u) => u * u * u;
  const back = (u) => 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2);
  const lerp = (a, b, u) => a + (b - a) * u;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const kick = (t, t0, amp) => { const n = Math.floor((t - t0) * 30); return n < 0 || n > 6 ? 0 : amp * (n % 2 ? -1 : 1) * (1 - n / 7); };
  const wob = (t, t0, f, d) => (t < t0 ? 0 : Math.exp(-(t - t0) * d) * Math.sin((t - t0) * f));   // damped wobble after t0
  // pseudo-isometric camera: target, distance, azimuth, elevation, field of view
  const iso = (tx, ty, tz, dist, az, el, fov) => [tx, ty, tz, dist, az, el, fov];
  const mix = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
  function camSet(c, ky) {
    const az = (c[4] * Math.PI) / 180, el = (c[5] * Math.PI) / 180;
    cam.position.set(c[0] + c[3] * Math.sin(az) * Math.cos(el), c[1] + c[3] * Math.sin(el) + (ky || 0), c[2] + c[3] * Math.cos(az) * Math.cos(el));
    cam.fov = c[6]; cam.updateProjectionMatrix(); cam.lookAt(c[0], c[1] + (ky || 0), c[2]); cam.updateMatrixWorld(true);
  }
  const line = (id, i) => SC[id].lines[i];
  const talking = (who, t) => TM.scenes.some((s) => s.lines.some((l) => l.who === who && t >= l.t0 && t < l.t1));
  const mouthOf = (who, t, rest) => (talking(who, t) ? (Math.floor(t * 9) % 2 ? "open" : "smile") : rest || "smile");

  // ---------------- drafting annotations (2D overlay)
  function proj(v) { const p = v.clone().project(cam); return [(p.x + 1) * 960, (1 - p.y) * 540]; }
  function label(text, x, y, align, u, color) {
    const n = Math.max(1, Math.round(text.length * clamp(u)));
    const s = text.slice(0, n);
    A.font = '700 25px "JetBrains Mono", "IBM Plex Mono", monospace'; A.textBaseline = "middle"; A.textAlign = align;
    const w = A.measureText(s).width, x0 = align === "left" ? x : align === "right" ? x - w : x - w / 2;
    A.fillStyle = "rgba(247,240,221,0.9)"; A.fillRect(x0 - 7, y - 18, w + 14, 36);
    A.fillStyle = color || INK; A.fillText(s, x, y);
  }
  function callout(text, w, dx, dy, u, color) {
    if (u <= 0.001) return;
    const [x, y] = proj(w), p = clamp(u * 2), ex = x + dx * p, ey = y + dy * p, dir = dx >= 0 ? 1 : -1;
    A.globalAlpha = clamp(u * 4); A.strokeStyle = color || INK; A.fillStyle = color || INK; A.lineWidth = 2;
    A.beginPath(); A.arc(x, y, 5, 0, 7); A.fill();
    A.setLineDash([9, 6]); A.beginPath(); A.moveTo(x, y); A.lineTo(ex, ey); if (p >= 1) A.lineTo(ex + dir * 34, ey); A.stroke(); A.setLineDash([]);
    if (u > 0.5) label(text, ex + dir * 44, ey, dir > 0 ? "left" : "right", (u - 0.5) * 2, color);
    A.globalAlpha = 1;
  }
  function dim(a, b, text, off, u) {
    if (u <= 0.001) return;
    const p = proj(a), q = proj(b), mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, k = eo(clamp(u));
    A.globalAlpha = clamp(u * 3); A.strokeStyle = INK; A.fillStyle = INK; A.lineWidth = 1.6;
    const P0 = [mx + nx * off - (dx / 2) * k, my + ny * off - (dy / 2) * k], P1 = [mx + nx * off + (dx / 2) * k, my + ny * off + (dy / 2) * k];
    A.beginPath(); A.moveTo(P0[0], P0[1]); A.lineTo(P1[0], P1[1]); A.stroke();
    for (const [e, s] of [[P0, p], [P1, q]]) { A.beginPath(); A.moveTo(e[0] - nx * 12, e[1] - ny * 12); A.lineTo(e[0] + nx * 12, e[1] + ny * 12); A.stroke();
      A.setLineDash([4, 5]); A.beginPath(); A.moveTo(s[0], s[1]); A.lineTo(e[0], e[1]); A.stroke(); A.setLineDash([]); }
    if (u > 0.6) label(text, mx + nx * off, my + ny * off, "center", (u - 0.6) * 2.5);
    A.globalAlpha = 1;
  }
  function flow(x0, y0, x1, y1, text, u, color) {
    if (u <= 0.001) return;
    const k = eo(clamp(u * 1.5)), ex = lerp(x0, x1, k), ey = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0);
    A.globalAlpha = clamp(u * 4); A.strokeStyle = color || INK; A.fillStyle = color || INK; A.lineWidth = 3; A.setLineDash([12, 7]);
    A.beginPath(); A.moveTo(x0, y0); A.lineTo(ex, ey); A.stroke(); A.setLineDash([]);
    A.beginPath(); A.moveTo(ex + Math.cos(a) * 16, ey + Math.sin(a) * 16); A.lineTo(ex + Math.cos(a + 2.5) * 14, ey + Math.sin(a + 2.5) * 14); A.lineTo(ex + Math.cos(a - 2.5) * 14, ey + Math.sin(a - 2.5) * 14); A.fill();
    if (u > 0.3) label(text, (x0 + x1) / 2, (y0 + y1) / 2 - 26, "center", (u - 0.3) * 2.5, color);
    A.globalAlpha = 1;
  }
  const cu = (t, a, b) => Math.min(seg(t, a, a + 0.7), 1 - seg(t, b - 0.25, b));   // callout life: draw in, hold, fade

  // ---------------- shared bits
  function who(k, x, z, pose, o) { const c = cast[k]; c.vis = true; c.x = x; c.y = (o && o.y) || 0; c.z = z; c.flip = (o && o.flip) || 1; c.s = (o && o.s) === undefined ? 1 : o.s; c.pose = pose; }
  const idle = (k, t, extra) => Object.assign({ bob: Math.sin(t * 2.3 + (k === "ops" ? 1 : k === "scout" ? 2 : 0)) * 4, blink: Chibi.blinkAt(t, k === "kai" ? 0.2 : k === "ops" ? 0.6 : 0.9), mouth: mouthOf(k, t) }, extra || {});
  function burst(t, t0, pos) {         // "acquired" ring + sparks
    const u = seg(t, t0, t0 + 0.8);
    P.ring.visible = u > 0 && u < 1; P.ring.position.copy(pos); P.ring.scale.setScalar(0.6 + eo(u) * 3.2); P.ring.material.opacity = 1 - u;
    P.stars.forEach((s, i) => { const a = (i / 12) * 6.283 + 0.4, d = eo(u) * (1.6 + (i % 3) * 0.5);
      s.visible = u > 0 && u < 1; s.position.set(pos.x + Math.cos(a) * d, pos.y + Math.sin(a) * d, pos.z + 0.2); s.scale.setScalar((1 - u) * 1.2); });
  }
  const squash = (t, t0) => 1 - 0.16 * wob(t, t0, 18, 6) - (t >= t0 && t < t0 + 0.08 ? 0.1 : 0);
  function place(o, x, y, z) { o.visible = true; o.position.set(x, y, z); }
  const ALL = () => [P.pack, P.door, ...P.tools, ...P.targets, P.spark, P.page, P.scroll, P.ring, ...P.stars, P.orb, P.pile, P.bell, P.wire, P.chest, ...P.loot, ...P.beams, ...P.packets];
  const HOME = { console: [-6.2, 0, -1.2], shelf: [6.4, 0, -3.3], journal: [-3.4, 0, 1.6] };

  // ---------------- scenes
  const S = {};

  S.intro = (t) => {
    const hit = C.scrollHit, l = SC.intro.lines;
    const wide = iso(0, 3.2, 0, 62, 30, 30, 30), two = iso(-2.0, 1.5, 0.2, 31, 20, 14, 17), close = iso(0.6, 2.7, 0.8, 19, 10, 7, 15), out = iso(0, 2.4, 0, 54, 26, 24, 26);
    let c = mix(wide, two, sm(seg(t, 0.2, 3.4)));
    c = mix(c, close, sm(seg(t, hit + 0.15, hit + 0.9)));
    c = mix(c, out, sm(seg(t, l[3].t0 - 0.3, l[3].t0 + 2.6)));
    c[3] *= 1 - 0.03 * seg(t, 0, SC.intro.t1);
    camSet(c, kick(t, hit, 0.18));
    const charge = seg(t, C.scrollThrow, C.scrollThrow + 0.5), fly = seg(t, hit - 0.42, hit);
    if (t > C.scrollThrow && t < hit) {
      const from = V(-5.4, 4.3 + Math.sin(t * 5) * 0.12, -0.6), to = V(0.6, 2.5, 0.9);
      const p = from.clone().lerp(to, ei(fly)); place(P.scroll, p.x, p.y + Math.sin(fly * 3.14) * 0.5, p.z);
      P.scroll.scale.setScalar(back(charge) * (1 - 0.5 * fly)); P.scroll.rotation.set(0, 0.35, t * 4); P.paper.visible = false;
    }
    burst(t, hit, V(0.6, 2.5, 0.9));
    const after = t >= hit, kl = l[2];
    who("kai", 0.6, 0.8, idle("kai", t, { look: after ? 0 : -0.8, glow: after ? 1 - seg(t, hit, hit + 1.0) : 0, sq: squash(t, hit),
      mouth: after && t < kl.t0 ? "o" : mouthOf("kai", t), brow: after ? 1 : 0,
      armR: t >= kl.t0 - 0.2 && t < kl.t1 + 1.2 ? lerp(12, 165, back(seg(t, kl.t0 - 0.2, kl.t0 + 0.15))) : 12,
      armL: t >= kl.t0 - 0.2 && t < kl.t1 + 1.2 ? lerp(12, 70, back(seg(t, kl.t0 - 0.1, kl.t0 + 0.25))) : 12 }));
    who("ops", -4.5, 0.3, idle("ops", t, { look: 0.8, hold: "tablet", armR: 62, armL: t > C.scrollThrow - 0.2 && t < hit ? lerp(12, 150, back(seg(t, C.scrollThrow - 0.2, C.scrollThrow + 0.2))) : 12 }));
    callout("OPERATOR: LOADS_PROGRAMS", V(-4.5, 3.7, 0.3), -70, -90, cu(t, 4.2, l[1].t0 - 0.1));
    callout("HERO: RECEIVES_UPLOAD", V(0.6, 3.7, 0.8), 150, -80, cu(t, 4.8, l[1].t0 - 0.1));
    callout("COMBAT.PROG", V(-5.4, 4.3, -0.6), -110, -50, cu(t, C.scrollThrow + 0.4, hit - 0.45), ORANGE);
  };

  S.title = (t) => {
    const s = SC.title, u = seg(t, s.t0, s.t1);
    camSet(iso(0, 6.4, 0, 76, lerp(-24, -18, u), 24, 30));
    who("kai", 0.6, 0.8, idle("kai", t)); who("ops", -4.5, 0.3, idle("ops", t, { hold: "tablet", armR: 62 }));
    dim(V(-13.3, -0.7, 4.8), V(13.3, -0.7, 4.8), "HULL_LENGTH: 26.6 M", 46, seg(t, s.t0 + 0.3, s.t0 + 1.2));
    callout("LIFT_ENVELOPE", V(8, 14.5, -1), 170, -10, seg(t, s.t0 + 0.5, s.t0 + 1.3));
    callout("OPERATOR_CONSOLE", V(-6.2, 2.4, -1.2), -190, 60, seg(t, s.t0 + 0.8, s.t0 + 1.6));
  };

  S.model = (t) => {
    const s = SC.model, l = s.lines, u = seg(t, s.t0, s.t1);
    camSet(iso(1.0, 1.6, 0.6, lerp(27, 25, u), lerp(12, 17, u), 11, 16), kick(t, C.bonk, 0.14));
    const doorIn = seg(t, l[2].t0 - 0.4, l[2].t0);
    if (doorIn > 0) { place(P.door, 4.2, 0, 0.1); P.door.scale.setScalar(1.28 * back(doorIn)); P.door.rotation.z = wob(t, C.bonk, 30, 7) * 0.05; }
    const go = sm(seg(t, l[2].t0 + 0.5, C.bonk)), ret = sm(seg(t, C.bonk + 0.5, C.bonk + 1.5));
    const x = lerp(lerp(0, 2.5, go), 0.6, ret);
    who("kai", x, 0.8, idle("kai", t, { look: t > l[2].t0 && t < l[3].t0 ? 1 : 0, sq: squash(t, C.bonk), lean: -wob(t, C.bonk, 16, 5) * 9,
      mouth: t >= C.bonk && t < l[3].t0 ? "flat" : mouthOf("kai", t), brow: t >= C.bonk ? -1 : 0, glow: 0.5 * Math.max(0, 1 - Math.abs(t - (C.textIn + 0.75)) * 2.2) }));
    const [kx, ky] = proj(V(x, 2.6, 0.8));
    const io = 1 - seg(t, l[2].t0 - 0.5, l[2].t0 - 0.1);
    flow(kx - 520, ky, kx - 170, ky, "TEXT_IN", Math.min(seg(t, C.textIn, C.textIn + 0.7), io));
    flow(kx + 170, ky, kx + 520, ky, "TEXT_OUT", Math.min(seg(t, C.textOut, C.textOut + 0.7), io), SAGE);
    callout("NEURAL_CORE: TRAINED_ONCE", V(x, 3.6, 0.8), 170, -90, cu(t, l[0].t0 + 1.4, l[2].t0 - 0.4));
    callout("DOOR: NO_ACCESS", V(4.2, 4.3, 0.1), 120, -50, cu(t, C.bonk + 0.1, s.t1 - 0.3), ORANGE);
  };

  S.harness = (t) => {
    const s = SC.harness, l = s.lines, u = seg(t, s.t0, s.t1);
    camSet(iso(-2.0, 1.5, 0.2, lerp(50, 36, sm(seg(t, s.t0, l[1].t0))) - 2 * u, lerp(28, 22, u), lerp(24, 17, sm(seg(t, s.t0, l[1].t0))), 22));
    const kp = V(0.6, 2.5, 0.9), op = V(-4.5, 2.5, 0.4);
    const legs = [[C.call, C.run - 0.25, kp, op], [C.run + 0.35, C.report, op, kp], [C.call2, C.run2 - 0.2, kp, op], [C.run2 + 0.3, C.run2 + 1.3, op, kp]];
    for (const [a, b, from, to] of legs) if (t >= a && t <= b) { const k = sm(seg(t, a, b)); const p = from.clone().lerp(to, k); place(P.orb, p.x, p.y + Math.sin(k * 3.14) * 1.3, p.z); }
    const press = Math.max(wob(t, C.run, 26, 9), wob(t, C.run2, 26, 9));
    P.console.scale.y = 1 - press * 0.06;
    who("kai", 0.6, 0.8, idle("kai", t, { look: -0.8, armL: Math.abs(t - C.call - 0.15) < 0.3 || Math.abs(t - C.call2 - 0.15) < 0.3 ? 80 : 12 }));
    who("ops", -4.5, 0.3, idle("ops", t, { look: 0.8, hold: "tablet", armR: 62, armL: 12 + 70 * Math.max(0, press) }));
    dim(V(-13.3, -0.7, 4.8), V(13.3, -0.7, 4.8), "HARNESS_FRAME: THE_SHIP", 40, cu(t, l[0].t0 + 1.2, s.t1 - 0.3));
    callout("OPERATOR: RUNS_THE_LOOP", V(-4.5, 3.7, 0.3), -90, -90, cu(t, l[0].t0 + 3.2, s.t1 - 0.3));
    callout("HERO: SAYS_WHAT_TO_DO", V(0.6, 3.7, 0.8), 140, -80, cu(t, l[1].t0, l[1].t0 + 4.5));
  };

  const packPulse = (t, times) => 1 + 0.12 * times.reduce((m, x) => m + wob(t, x, 28, 9), 0);
  S.context = (t) => {
    const s = SC.context, l = s.lines, u = seg(t, s.t0, s.t1);
    camSet(iso(1.9, 1.55, 0.8, lerp(27, 25, u), lerp(14, 19, u), 12, 16), kick(t, C.packFull, 0.1));
    const drops = [0, 1, 2, 3].map((i) => l[0].t0 + 2.0 + i * 0.55).concat([0, 1, 2, 3].map((i) => l[1].t0 + 0.2 + i * 0.6));
    place(P.pack, 0.9, 0, 1.0); P.pack.scale.set(1.25, 1.25 * packPulse(t, drops.concat([C.squeeze + 0.5])), 1.25);
    who("kai", -0.9, 0.8, idle("kai", t, { look: t > l[3].t0 ? 0.9 : 0.5, brow: t > C.packFull && t < C.squeeze ? -1 : 0, mouth: t > C.packFull && t < C.squeeze ? "o" : mouthOf("kai", t) }));
    callout("CONTEXT_WINDOW: 8_SLOTS", V(0.9, 1.9, 1.0), 90, 150, cu(t, l[0].t0 + 1.2, l[2].t0 - 0.2));
    callout("NOT_IN_PACK = NOT_KNOWN", V(0.9, 1.9, 1.0), 90, 150, cu(t, l[3].t0, s.t1 - 0.3), ORANGE);
  };

  S.tools = (t) => {
    const s = SC.tools, l = s.lines, u = seg(t, s.t0, s.t1);
    camSet(iso(1.4, 1.7, 0.4, lerp(35, 32, u), lerp(11, 16, u), 13, 16));
    const tx = [1.4, 3.5, 5.6], cues = [C.tool1, C.tool2, C.tool3], names = ["READ_FILE", "RUN_COMMAND", "SEARCH_WEB"];
    const rest = [[-1.9, 4.5, 0.9], [-1.0, 4.0, 0.9], [-0.4, 3.3, 0.9]];
    let hitNow = -1;
    P.targets.forEach((m, i) => { place(m, tx[i], 0, 0.3); m.scale.set(1.2, 1.2 * (1 - 0.14 * wob(t, cues[i], 26, 8)), 1.2); });
    P.tools.forEach((m, i) => {
      const inn = back(seg(t, l[0].t0 + 0.6 + i * 0.09, l[0].t0 + 0.95 + i * 0.09));
      const go = eo(seg(t, cues[i] - 0.32, cues[i])), ret = sm(seg(t, cues[i] + 0.25, cues[i] + 0.8)), k = go * (1 - ret);
      const r = rest[i], x = lerp(r[0], tx[i], k), y = lerp(r[1] + Math.sin(t * 2.2 + i) * 0.1, 1.9, k) + Math.sin(k * 3.14) * 0.7;
      place(m, x, y, lerp(r[2], 0.5, k)); m.scale.setScalar(1.05 * inn); m.rotation.y = 0.4 + Math.sin(t * 1.3 + i) * 0.3; if (i !== 2) m.rotation.z = -0.3 - k * 1.2;
      if (t >= cues[i] && t < cues[i] + 0.3) hitNow = i;
      callout(names[i], V(tx[i], 2.0, 0.3), 30 + i * 12, -150 - (i % 2) * 46, cu(t, cues[i] + 0.05, s.t1 - 0.3), i === 1 ? ORANGE : INK);
    });
    if (hitNow >= 0) { const k = seg(t, cues[hitNow], cues[hitNow] + 0.3); place(P.spark, tx[hitNow], 1.7, 0.9); P.spark.scale.setScalar(0.5 + eo(k) * 1.4); P.spark.material.opacity = 1 - k; }
    const act = cues.findIndex((c) => t > c - 0.4 && t < c + 0.3);
    who("kai", -3.0, 0.8, idle("kai", t, { look: 0.8, armR: act >= 0 ? 150 : 118, armL: 12, brow: 1 }));
    callout("TOOLS: ONE_ACTION_EACH", V(-1.0, 4.2, 0.9), 110, -70, cu(t, l[0].t0 + 1.4, l[1].t0 - 0.1));
  };

  S.memory = (t) => {
    const s = SC.memory, l = s.lines, u = seg(t, s.t0, s.t1);
    const a = iso(-0.6, 1.6, 0.8, 35, 12, 13, 16), b = iso(-2.6, 1.6, 1.3, 26, 16, 12, 16);
    const c = mix(a, b, sm(seg(t, l[2].t0 - 0.4, l[2].t0 + 1.2))); c[4] += 4 * u; camSet(c);
    P.journal.visible = true;
    place(P.pack, 2.2, 0, 1.0); P.pack.scale.set(1.25, 1.25 * packPulse(t, [C.journalLoad]), 1.25);
    P.journalGlow.visible = t > C.journal; P.journalGlow.scale.setScalar(0.8 + 0.25 * Math.sin(t * 5)); P.journalGlow.material.opacity = 0.55 * seg(t, C.journal, C.journal + 0.4);
    const fly = seg(t, C.journalLoad - 0.8, C.journalLoad);
    if (fly > 0 && fly < 1) { const k = sm(fly); place(P.page, lerp(-3.4, 2.2, k), 1.5 + Math.sin(k * 3.14) * 1.6, lerp(1.6, 1.0, k)); P.page.material.opacity = 0.95; }
    const asleep = t > C.night + 0.4 && t < C.journalLoad - 0.1;
    who("kai", 0.4, 0.8, idle("kai", t, { blink: asleep ? 1 : Chibi.blinkAt(t, 0.2), mouth: asleep ? "flat" : mouthOf("kai", t), lean: asleep ? -5 : 0, bob: asleep ? Math.sin(t * 1.2) * 3 : Math.sin(t * 2.3) * 4,
      sq: squash(t, C.journalLoad), look: t > l[2].t0 ? -0.9 : 0 }));
    who("ops", -5.3, 0.2, idle("ops", t, { look: 0.8, hold: "tablet", armR: 62, armL: t > C.journal && t < C.journalLoad ? 130 : 12 }));
    callout("SESSION_END: PACK_EMPTIED", V(2.2, 1.9, 1.0), 110, -120, cu(t, C.night + 0.5, C.journal + 0.2), ORANGE);
    callout("JOURNAL: STAYS_ON_SHIP", V(-3.4, 1.5, 1.6), -40, -190, cu(t, C.journal + 0.2, l[2].t0 - 0.2), SAGE);
    callout("FILE: CLAUDE.md", V(-3.4, 1.5, 1.6), 150, -150, cu(t, l[2].t0 + 1.0, s.t1 - 0.3), SAGE);
  };
  const nightAt = (t) => (t > SC.memory.t0 && t < SC.memory.t1 ? sm(seg(t, C.night, C.night + 1.0)) * (1 - sm(seg(t, C.journalLoad - 0.2, C.journalLoad + 0.7))) : 0);

  S.skill = (t) => {
    const s = SC.skill, l = s.lines, u = seg(t, s.t0, s.t1), hit = C.skillHit, kl = l[2];
    const a = iso(5.0, 1.7, -1.0, 29, 8, 13, 16), b = iso(3.0, 2.6, 0.6, 21, 10, 8, 15);
    const c = mix(a, b, sm(seg(t, C.scrollOpen - 0.2, C.scrollOpen + 1.2)) * (1 - sm(seg(t, l[3].t0 - 0.2, l[3].t0 + 1.6)))); c[4] += 5 * u; camSet(c, kick(t, hit, 0.16));
    const picked = t >= C.scrollPick;
    P.shelfScrolls[3].visible = !picked;
    const kx = 3.3, kpos = V(kx, 2.5, 0.9);
    if (picked && t < hit) {
      const k = sm(seg(t, C.scrollPick, C.scrollPick + 1.0)), into = ei(seg(t, hit - 0.3, hit));
      const from = V(5.2, 1.14, -3.25), hov = V(4.95, 3.75 + Math.sin(t * 2.6) * 0.06, 1.1);
      const p = from.clone().lerp(hov, k).lerp(kpos, into); place(P.scroll, p.x, p.y + Math.sin(k * 3.14) * 0.6 * (1 - into), p.z);
      P.scroll.scale.setScalar(lerp(1, 1.5, k) * (1 - 0.7 * into)); P.scroll.rotation.set(0, 0.17, 0);
      P.paper.visible = t >= C.scrollOpen; P.paper.scale.y = eo(seg(t, C.scrollOpen, C.scrollOpen + 0.5)) || 0.001;
    }
    burst(t, hit, kpos);
    const after = t >= hit;
    who("kai", kx, 0.8, idle("kai", t, { look: after ? 0 : 0.8, glow: after ? 1 - seg(t, hit, hit + 1.0) : 0, sq: squash(t, hit), brow: after ? 1 : 0,
      mouth: after && t < kl.t0 ? "o" : mouthOf("kai", t), armR: t >= kl.t0 - 0.2 && t < kl.t1 + 1 ? lerp(12, 165, back(seg(t, kl.t0 - 0.2, kl.t0 + 0.15))) : picked && !after ? 100 : 12,
      armL: t >= kl.t0 - 0.2 && t < kl.t1 + 1 ? lerp(12, 165, back(seg(t, kl.t0 - 0.1, kl.t0 + 0.25))) : 12 }));
    callout("SKILL_SHELF: TITLES_ONLY", V(6.4, 2.6, -3.3), 60, -110, cu(t, l[0].t0 + 2.2, C.scrollPick + 0.3));
    callout("FULL_INSTRUCTIONS", V(5.6, 3.2, 1.1), 110, -60, cu(t, C.scrollOpen + 0.5, hit - 0.3), SAGE);
    callout("NEURAL_CORE: UNCHANGED", V(kx, 3.6, 0.8), -130, -60, cu(t, l[3].t0 + 2.0, s.t1 - 0.3));
    callout("CONTEXT: +PAGES_TO_READ", V(kx, 2.2, 0.8), 190, 30, cu(t, l[3].t0 + 3.4, s.t1 - 0.3), SAGE);
  };

  S.mcp = (t) => {
    const s = SC.mcp, l = s.lines, u = seg(t, s.t0, s.t1);
    camSet(iso(14.2, 2.0, -0.6, lerp(50, 46, u), lerp(2, 7, u), 15, 20));
    const open = back(seg(t, C.gateOpen, C.gateOpen + 0.6));
    P.portal.scale.setScalar(Math.max(open, 0.001)); P.portal.rotation.z = t * 1.4;
    const from = V(11.2, 1.75, -0.3);
    [C.beam1, C.beam2, C.beam3].forEach((bc, i) => {
      const k = eo(seg(t, bc - 0.5, bc)); const to = P.setBeam(i, from, k);
      if (t > bc + 0.2) { const w = ((t - bc) / 2.4 + i * 0.33) % 1, tri = w < 0.5 ? w * 2 : 2 - w * 2, p = from.clone().lerp(to, sm(tri)); place(P.packets[i], p.x, p.y, p.z); }
      P.isles[i].position.y += 0; P.isles[i].rotation.y = Math.sin(t * 0.6 + i) * 0.05;
    });
    who("kai", 8.2, 1.0, idle("kai", t, { look: 0.9, armR: t > C.gateOpen - 0.3 ? 105 : 12, brow: 1 }));
    callout("MCP_GATE: STANDARD_PLUG", V(11.2, 3.5, -0.3), -120, -90, cu(t, C.gateOpen + 0.5, s.t1 - 0.3));
    callout("OUTSIDE_SYSTEMS", V(20.5, 1.2, -1), 70, 150, cu(t, C.beam3 + 0.3, s.t1 - 0.3), ORANGE);
  };

  S.agent = (t) => {
    const s = SC.agent, l = s.lines, u = seg(t, s.t0, s.t1);
    camSet(iso(0.1, 1.7, 0.5, lerp(37, 34, u), lerp(9, 14, u), 13, 16));
    place(P.pack, -0.9, 0, 1.1); P.pack.scale.setScalar(1.25); P.pack.scale.y = 1.25 * packPulse(t, [C.reportIn]);
    place(P.pile, 5.6, 0, 0.2);
    const pop = back(seg(t, C.scoutPop, C.scoutPop + 0.35));
    const go = sm(seg(t, C.scoutGo, C.scoutGo + 1.1)), ret = sm(seg(t, C.scoutBack - 1.0, C.scoutBack));
    const sx = lerp(lerp(1.0, 4.0, go), 1.0, ret), moving = (go > 0 && go < 1) || (ret > 0 && ret < 1);
    const hasReport = t > C.scoutBack - 1.0;
    if (pop > 0) who("scout", sx, 1.0, idle("scout", t, { look: moving ? (ret > 0 ? -1 : 1) : hasReport ? -0.6 : 0.8, mouth: hasReport && !moving ? (talking("scout", t) ? mouthOf("scout", t) : "grin") : mouthOf("scout", t),
      hold: hasReport ? "report" : null, armR: hasReport ? 150 : go > 0 && ret <= 0 && !moving ? 100 : 12, brow: 1, lean: moving ? (ret > 0 ? -7 : 7) : 0 }), { s: pop, y: moving ? Math.abs(Math.sin(t * 14)) * 0.22 : 0 });
    who("kai", -2.5, 0.8, idle("kai", t, { look: 0.8, brow: t < l[1].t0 ? -1 : 0, mouth: t < l[1].t0 - 0.2 && t > l[0].t0 + 2.2 ? "o" : mouthOf("kai", t), armR: t > C.scoutPop && t < C.scoutGo + 0.6 ? 95 : 12 }));
    callout("JOB: READ_200_FILES", V(5.6, 0.6, 1.0), -40, 150, cu(t, l[0].t0 + 1.6, C.scoutBack - 0.2), ORANGE);
    callout("SUBAGENT: OWN_BACKPACK", V(sx, 3.5, 1.0), 60, -80, cu(t, C.scoutPop + 0.4, C.scoutGo - 0.1));
    callout("RETURNS: ONE_REPORT", V(sx, 3.5, 1.0), 110, -80, cu(t, C.scoutBack + 0.1, s.t1 - 0.3), SAGE);
  };

  S.hooks = (t) => {
    const s = SC.hooks, l = s.lines, u = seg(t, s.t0, s.t1);
    const hits = [C.edit1, C.edit2], bells = [C.bell1, C.bell2];
    camSet(iso(1.5, 1.7, 0.4, lerp(29, 27, u), lerp(11, 16, u), 12, 16), kick(t, C.edit1, 0.08) + kick(t, C.edit2, 0.08));
    place(P.targets[0], 1.3, 0, 0.9); P.targets[0].scale.set(1.2, 1.2 * (1 - 0.16 * (wob(t, hits[0], 26, 8) + wob(t, hits[1], 26, 8))), 1.2);
    place(P.bell, 3.9, 0, -0.4); P.bellSwing.rotation.z = 0.7 * (wob(t, bells[0], 13, 2.0) + wob(t, bells[1], 13, 2.0));
    P.wire.visible = true; P.wire.geometry.setFromPoints([V(1.3, 1.15, 0.9), V(2.6, 1.9, 0.2), V(3.9, 2.2, -0.2)]);
    const sw = Math.max(...hits.map((h) => (t > h - 0.5 && t < h + 0.5 ? (t < h ? ei(seg(t, h - 0.16, h)) : 1 - sm(seg(t, h + 0.1, h + 0.5))) : 0)));
    const up = Math.max(...hits.map((h) => (t > h - 0.6 && t < h ? sm(seg(t, h - 0.6, h - 0.2)) * (1 - ei(seg(t, h - 0.16, h))) : 0)));
    const hm = P.tools[1]; place(hm, lerp(-0.4, 0.75, sw), lerp(2.4, 1.75, sw) + up * 0.9, 1.1); hm.scale.setScalar(1.15); hm.rotation.set(0, 0, 0.5 + up * 0.8 - sw * 1.9);
    hits.forEach((h, i) => { if (t >= h && t < h + 0.3) { const k = seg(t, h, h + 0.3); place(P.spark, 1.3, 1.35, 1.4); P.spark.scale.setScalar(0.5 + eo(k) * 1.4); P.spark.material.opacity = 1 - k; }
      const w = seg(t, h + 0.05, bells[i]); if (w > 0 && w < 1) { const p = V(1.3, 1.15, 0.9).lerp(V(3.9, 2.2, -0.2), sm(w)); place(P.orb, p.x, p.y + Math.sin(w * 3.14) * 0.3, p.z); } });
    who("kai", -1.4, 0.8, idle("kai", t, { look: 0.8, armR: 70 + up * 80 - sw * 30, brow: sw > 0.5 ? 1 : 0 }));
    callout("HOOK: ON_EDIT -> RUN_TESTS", V(3.9, 3.1, -0.4), 60, -90, cu(t, l[0].t0 + 1.6, s.t1 - 0.3), ORANGE);
    callout("EVENT: FILE_EDIT", V(1.3, 1.2, 0.9), -30, 120, cu(t, C.edit1 + 0.1, C.edit2 - 0.4));
  };

  S.plugin = (t) => {
    const s = SC.plugin, l = s.lines, u = seg(t, s.t0, s.t1);
    camSet(iso(1.8, 2.0, 0.8, lerp(32, 30, u), lerp(9, 14, u), 13, 16), kick(t, C.chestOpen + 0.45, 0.1));
    place(P.chest, 1.6, 0, 1.0); P.chest.scale.setScalar(1.25);
    const open = back(seg(t, C.chestOpen, C.chestOpen + 0.55)); P.lid.rotation.x = -1.95 * open;
    P.chestGlow.visible = open > 0.1; P.chestGlow.material.opacity = 0.6 * clamp(open); P.chestGlow.scale.setScalar(0.9 + 0.12 * Math.sin(t * 6));
    const names = ["SKILL", "SKILL", "MCP_LINK", "AGENT", "HOOK"];
    P.loot.forEach((m, i) => {
      const k = seg(t, C.loot + i * 0.09, C.loot + 0.75 + i * 0.09);
      if (k <= 0) return;
      const e = eo(k), tx = 2.7 + (i - 2) * 1.45, ty = 3.6 + (i % 2) * 0.5 + Math.sin(t * 2 + i) * 0.08;
      place(m, lerp(1.6, tx, e), lerp(1.2, ty, e) + Math.sin(e * 3.14) * 0.5, 1.0); m.scale.setScalar(1.3 * Math.min(1, k * 3)); m.rotation.y = t * 0.9 + i;
      callout(names[i], V(tx, ty + 0.5, 1.0), (i - 2) * 26, -70 - (i % 2 ? 0 : 34), cu(t, C.loot + 0.8 + i * 0.12, s.t1 - 0.3), i < 2 ? SAGE : i === 4 ? ORANGE : INK);
    });
    who("kai", -2.3, 0.8, idle("kai", t, { look: 0.8, mouth: open > 0 && !talking("kai", t) ? "o" : "smile", armR: open > 0 ? 120 : 12, armL: open > 0 ? 100 : 12, brow: 1 }));
    callout("PLUGIN: ONE_INSTALL", V(1.6, 1.4, 1.0), 170, -150, cu(t, l[0].t0 + 1.0, C.chestOpen - 0.1));
  };

  const trio = (t, extra) => { who("kai", 0.2, 0.9, idle("kai", t, extra)); who("ops", -2.4, 0.5, idle("ops", t, { hold: "tablet", armR: 62 })); who("scout", 2.5, 0.8, idle("scout", t, { mouth: "grin" })); };
  S.party = (t) => { const s = SC.party, u = seg(t, s.t0, s.t1); camSet(iso(0, 3.4, 0, 62, lerp(18, 30, u), 26, 30)); trio(t); };
  S.outro = (t) => {
    const s = SC.outro, l = s.lines, u = seg(t, s.t0, s.t1), k = l[1];
    camSet(iso(0, 2.0, 0.7, lerp(31, 25, sm(u)), lerp(10, 16, u), 10, 17));
    trio(t, { brow: 1, armR: t >= k.t0 - 0.2 ? lerp(12, 165, back(seg(t, k.t0 - 0.2, k.t0 + 0.15))) : 12, sq: squash(t, k.t0) });
    burst(t, k.t0, V(0.2, 2.6, 1.0));
    dim(V(-2.4, 0, 2.2), V(2.5, 0, 2.2), "CREW: MODEL + HARNESS + AGENT", 70, cu(t, l[0].t0 + 1.0, k.t0 - 0.2));
  };

  function renderAt(t) {
    t = clamp(t, 0, TM.dur - 0.001);
    A.clearRect(0, 0, 1920, 1080);
    for (const o of ALL()) o.visible = false;
    for (const k in cast) cast[k].vis = false;
    P.journal.position.set(-3.4, 0, 1.6); P.journal.visible = false;
    P.shelfScrolls[3].visible = true; P.console.scale.y = 1; P.journalGlow.visible = false; P.portal.scale.setScalar(0.001);
    P.beams.forEach((b) => (b.visible = false)); P.chestGlow.visible = false; P.lid.rotation.x = 0;
    const sc = TM.scenes.find((s) => t >= s.t0 && t < s.t1) || TM.scenes[TM.scenes.length - 1];
    S[sc.id](t);
    const n = nightAt(t);
    nightEl.style.opacity = (0.8 * n).toFixed(3);
    render(t, n);
  }
  window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
  window.Story = { renderAt, SC, C };
})();
