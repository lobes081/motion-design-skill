// The cel-shaded 3D set: an airship deck with one station per part.
// Look borrowed from claude-animated-shorts: toon-shaded world with black ink lines, flat character cards that
// carry their own plum ink, contact-blob shadows, bright saturated sky. Geometry and props are our own.
(function () {
  const INK = 0x1f2a44;   // navy drafting ink
  const canvas = document.getElementById("gl");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);   // the grid paper behind the canvas shows through
  renderer.setSize(1920, 1080, false);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 600);

  const ramp = new THREE.DataTexture(new Uint8Array([196, 196, 196, 255, 228, 228, 228, 255, 255, 255, 255, 255]), 3, 1);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const amb = new THREE.AmbientLight(0xffffff, 1.25); scene.add(amb);
  const sun = new THREE.DirectionalLight(0xffffff, 1.9); sun.position.set(-5, 9, 7); scene.add(sun);

  // ---- blueprint palette (after the "AI Ship Anatomy" sheet): paper, slate blue, burnt orange, sage green
  const PAL = { paper: 0xf7f0dd, paper2: 0xe9dfc6, paper3: 0xd6c9aa, slate: 0x7388ad, blue: 0xb4c6dc, orange: 0xd9773c, sage: 0x93b08e };
  function bp(hex) {
    const c = new THREE.Color(hex), h = {}; c.getHSL(h, THREE.SRGBColorSpace); const H = h.h * 360;
    if (h.l > 0.82) return PAL.paper;
    if (h.s < 0.22) return h.l > 0.6 ? PAL.paper2 : h.l > 0.3 ? PAL.paper3 : PAL.slate;
    if (H >= 75 && H < 175) return PAL.sage;
    if (H >= 175 && H < 320) return h.l < 0.42 ? PAL.slate : PAL.blue;
    if (h.s > 0.6 && h.l > 0.5) return PAL.orange;
    return h.l > 0.6 ? PAL.paper : h.l > 0.42 ? PAL.paper2 : PAL.paper3;
  }
  const edgeMat = new THREE.LineBasicMaterial({ color: INK });
  // ---- helpers
  function ink(mesh, k) {
    k = k === undefined ? 0.045 : k;
    mesh.geometry.computeBoundingBox();
    const s = new THREE.Vector3(); mesh.geometry.boundingBox.getSize(s);
    const c = new THREE.Vector3(); mesh.geometry.boundingBox.getCenter(c);
    const o = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
    o.scale.set((s.x + 2 * k) / Math.max(s.x, 1e-3), (s.y + 2 * k) / Math.max(s.y, 1e-3), (s.z + 2 * k) / Math.max(s.z, 1e-3));
    o.position.set(c.x * (1 - o.scale.x), c.y * (1 - o.scale.y), c.z * (1 - o.scale.z));
    mesh.add(o); return mesh;
  }
  function toon(geo, color, k) {
    const m = ink(new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color: bp(color), gradientMap: ramp })), k);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), edgeMat));   // fine internal drafting lines
    return m;
  }
  const box = (w, h, d, c, k) => toon(new THREE.BoxGeometry(w, h, d), c, k);
  const cyl = (r1, r2, h, c, seg, k) => toon(new THREE.CylinderGeometry(r1, r2, h, seg || 18), c, k);
  const ball = (r, c, k) => toon(new THREE.SphereGeometry(r, 20, 14), c, k);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const grp = (...ms) => { const g = new THREE.Group(); ms.forEach((m) => g.add(m)); return g; };
  function ctex(w, h, draw) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  }
  function glow(color, size) {
    const t = ctex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,0.95)");
      r.addColorStop(0.45, "rgba(255,255,255,0.5)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: t, color: bp(color), transparent: true, depthWrite: false }));
    m.userData.face = true; return m;
  }
  function sign(text, bg, fg, w, h) {
    const t = ctex(512, Math.round(512 * h / w), (g, W, H) => { g.fillStyle = "#1f2a44"; g.fillRect(0, 0, W, H); g.fillStyle = "#f7f0dd"; g.fillRect(8, 8, W - 16, H - 16);
      g.fillStyle = "#1f2a44"; g.font = "bold " + Math.round(H * 0.42) + "px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, W / 2, H / 2 + 4); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); m.userData.face = true; return m;
  }

  // ---- ship
  const ship = new THREE.Group(); scene.add(ship);
  const plank = ctex(1024, 512, (g, W, H) => { g.fillStyle = "#f2ead6"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? "#ede4cd" : "#f5eeda"; g.fillRect(0, i * H / 12, W, H / 12); }
    g.strokeStyle = "#1f2a44"; g.lineWidth = 2.5;
    for (let i = 0; i <= 12; i++) { g.beginPath(); g.moveTo(0, i * H / 12); g.lineTo(W, i * H / 12); g.stroke(); }
    for (let i = 0; i < 40; i++) { const x = (i * 197) % W, y = Math.floor((i * 7) % 12) * H / 12; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + H / 12); g.stroke(); } });
  ship.add(at(box(27, 0.7, 9.6, 0x8a5a34, 0.08), 0, -0.36, 0));
  const top = new THREE.Mesh(new THREE.PlaneGeometry(26.6, 9.2), new THREE.MeshToonMaterial({ map: plank, gradientMap: ramp }));
  top.rotation.x = -Math.PI / 2; top.position.y = 0.005; ship.add(top);
  ship.add(at(box(24, 2.2, 7.4, 0x6f4526, 0.08), 0, -1.8, 0));
  ship.add(at(box(20, 1.4, 5, 0x5b381f, 0.08), 0, -3.5, 0));
  for (let x = -13; x <= 13; x += 2) ship.add(at(box(0.2, 1.15, 0.2, 0xe8d7b0, 0.03), x, 0.57, -4.5));
  ship.add(at(box(26.6, 0.16, 0.26, 0xb5372f, 0.03), 0, 1.2, -4.5));
  for (const sx of [-1, 1]) { for (let z = -4.5; z <= 4.5; z += 3) ship.add(at(box(0.2, 1.15, 0.2, 0xe8d7b0, 0.03), sx * 13.2, 0.57, z));
    if (sx < 0) ship.add(at(box(0.26, 0.16, 9.2, 0xb5372f, 0.03), sx * 13.2, 1.2, 0)); }
  const balloon = at(ball(1, 0xfff0d2, 0.03), 0, 12.6, -1); balloon.scale.set(11, 3.8, 5.2); ship.add(balloon);
  const band = at(ball(1, 0xe8504a, 0), 0, 12.6, -1); band.scale.set(11.12, 0.9, 5.3); ship.add(band);
  for (const [x, z] of [[-10, -4], [10, -4], [-10, 4], [10, 4]]) { const r = cyl(0.05, 0.05, 10.4, 0x5b3a22, 6, 0.02); r.position.set(x * 0.92, 5.4, z * 0.85); r.rotation.z = x > 0 ? 0.13 : -0.13; ship.add(r); }
  // ---- stations
  const P = {};
  // console (harness)
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.05), new THREE.MeshBasicMaterial({ map: ctex(256, 144, (g) => { g.fillStyle = "#f7f0dd"; g.fillRect(0, 0, 256, 144); g.fillStyle = "#93b08e";
    for (let i = 0; i < 6; i++) g.fillRect(16, 16 + i * 20, 60 + ((i * 53) % 150), 9); }) }));
  const scrBox = box(2.1, 1.25, 0.14, 0x2a2540); scr.position.z = 0.08; scrBox.add(scr); scrBox.position.set(0, 1.95, -0.1); scrBox.rotation.x = -0.25;
  P.console = grp(at(box(2.4, 1.3, 1.0, 0x4a4370), 0, 0.65, 0), scrBox, at(cyl(0.05, 0.05, 1.2, 0x2a2540, 6, 0.02), 1.0, 2.9, -0.2), at(ball(0.13, 0xd7f26b, 0.02), 1.0, 3.55, -0.2));
  P.console.position.set(-6.2, 0, -1.2); P.screen = scr; scene.add(P.console);

  // backpack (context)
  P.pack = grp(at(box(1.0, 1.15, 0.62, 0x35b8c4), 0, 0.6, 0), at(box(1.06, 0.4, 0.68, 0x2a8e98), 0, 1.06, 0), at(box(0.62, 0.42, 0.14, 0x8fe6ee), 0, 0.42, 0.36),
    at(box(0.12, 0.2, 0.08, 0xffd35c, 0.02), 0, 0.92, 0.37));
  scene.add(P.pack);

  // door (model)
  P.door = grp(at(box(0.25, 3.3, 0.3, 0x7a6a5a), -0.95, 1.65, 0), at(box(0.25, 3.3, 0.3, 0x7a6a5a), 0.95, 1.65, 0), at(box(2.15, 0.25, 0.3, 0x7a6a5a), 0, 3.4, 0),
    at(box(1.65, 3.2, 0.14, 0xb5653f), 0, 1.6, 0), at(box(0.34, 0.3, 0.12, 0xffd35c, 0.03), 0.5, 1.5, 0.12));
  scene.add(P.door);

  // tools and their targets
  const book = grp(box(0.62, 0.8, 0.16, 0x4f7dff), at(box(0.52, 0.7, 0.18, 0xfff6e0, 0.01), 0.04, 0, 0));
  const hammer = grp(at(cyl(0.05, 0.05, 0.8, 0x8a5a34, 8, 0.03), 0, -0.1, 0), at(box(0.5, 0.24, 0.24, 0xaab4c4), 0, 0.36, 0));
  const spy = grp(cyl(0.11, 0.15, 0.5, 0xffb24a, 12, 0.03), at(cyl(0.15, 0.19, 0.36, 0xd9891c, 12, 0.03), 0, -0.4, 0)); spy.rotation.z = 1.2;
  P.tools = [book, hammer, spy]; P.tools.forEach((m) => scene.add(m));
  const crate = grp(at(box(1.1, 0.9, 0.9, 0xd9a55c), 0, 0.45, 0), at(box(0.7, 0.55, 0.05, 0xfff6e0, 0.02), -0.05, 1.0, 0.1), at(box(0.7, 0.55, 0.05, 0xfff6e0, 0.02), 0.1, 0.95, -0.1));
  const term = grp(at(box(1.1, 0.9, 0.8, 0x2a2540), 0, 0.45, 0), at(new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.6), new THREE.MeshBasicMaterial({ map: ctex(128, 96, (g) => { g.fillStyle = "#f7f0dd"; g.fillRect(0, 0, 128, 96);
    g.fillStyle = "#1f2a44"; g.font = "bold 26px monospace"; g.fillText("> run_", 10, 40); }) })), 0, 0.5, 0.41));
  const globe = grp(at(cyl(0.3, 0.42, 0.2, 0x8a5a34, 12, 0.03), 0, 0.1, 0), at(cyl(0.05, 0.05, 0.5, 0x8a5a34, 6, 0.02), 0, 0.4, 0), at(ball(0.48, 0x49b6ff), 0, 1.05, 0), at(ball(0.2, 0x5fd06a, 0), 0.25, 1.2, 0.3), at(ball(0.16, 0x5fd06a, 0), -0.2, 0.9, 0.36));
  P.targets = [crate, term, globe]; P.targets.forEach((m) => scene.add(m));
  P.spark = glow(0xffffff, 1.6); scene.add(P.spark);

  // journal (memory)
  P.journal = grp(at(cyl(0.5, 0.62, 1.1, 0xcfc7dd, 10), 0, 0.55, 0), at(box(0.9, 0.16, 0.66, 0x8b5cff), 0, 1.22, 0), at(box(0.8, 0.1, 0.6, 0xfff6e0, 0.01), 0, 1.24, 0.02), at(box(0.1, 0.2, 0.7, 0xffd35c, 0.01), 0.25, 1.24, 0));
  P.journal.children[1].rotation.x = 0.0; P.journalGlow = at(glow(0xb497ff, 3.4), 0, 1.5, 0.2); P.journal.add(P.journalGlow); scene.add(P.journal);
  P.page = glow(0xb497ff, 1.3); scene.add(P.page);

  // scroll shelf (skill)
  const shelf = grp(at(box(3.4, 0.14, 0.9, 0x8a5a34), 0, 0.9, 0), at(box(3.4, 0.14, 0.9, 0x8a5a34), 0, 1.9, 0), at(box(0.16, 2.4, 0.9, 0x6f4526), -1.7, 1.2, 0), at(box(0.16, 2.4, 0.9, 0x6f4526), 1.7, 1.2, 0), at(box(3.5, 0.16, 1.0, 0x6f4526), 0, 2.45, 0));
  const scrollMesh = (c) => { const g = grp(cyl(0.17, 0.17, 0.9, 0xfff0cf, 14), at(cyl(0.2, 0.2, 0.1, c, 14, 0.02), 0, 0.5, 0), at(cyl(0.2, 0.2, 0.1, c, 14, 0.02), 0, -0.5, 0)); g.rotation.x = Math.PI / 2; return g; };
  const caps = [0xff7086, 0x62adff, 0xffb24a, 0x2fd97b, 0xb497ff];
  P.shelfScrolls = caps.map((c, i) => { const s = scrollMesh(c); s.position.set(-1.2 + (i % 3) * 1.2, i < 3 ? 2.14 : 1.14, 0.05); shelf.add(s); return s; });
  shelf.position.set(6.4, 0, -3.3); P.shelf = shelf; scene.add(shelf);
  P.scroll = grp(scrollMesh(0x2fd97b)); P.scroll.children[0].rotation.set(0, 0, Math.PI / 2); scene.add(P.scroll);
  const paperGeo = new THREE.PlaneGeometry(1.0, 1.5); paperGeo.translate(0, -0.75, 0);
  P.paper = new THREE.Mesh(paperGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: ctex(256, 384, (g) => { g.fillStyle = "#fbf6ea"; g.fillRect(0, 0, 256, 384); g.strokeStyle = "#1f2a44"; g.lineWidth = 6; g.strokeRect(3, 3, 250, 378); g.fillStyle = "#93b08e"; g.fillRect(24, 24, 150, 18);
    g.fillStyle = "#1f2a44"; for (let i = 0; i < 11; i++) g.fillRect(24, 64 + i * 28, 110 + ((i * 67) % 96), 10); }) }));
  P.scroll.add(P.paper);
  P.ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1.0, 40), new THREE.MeshBasicMaterial({ color: 0xd9773c, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  P.ring.userData.face = true; scene.add(P.ring);
  P.stars = []; for (let i = 0; i < 12; i++) { const s = glow(0xbfffe0, 0.5); scene.add(s); P.stars.push(s); }
  P.orb = grp(new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: 0xd9773c })), glow(0xd7f26b, 1.3)); scene.add(P.orb);

  // gate and outside islands (MCP)
  const swirl = ctex(256, 256, (g) => { g.fillStyle = "#dfe8f2"; g.fillRect(0, 0, 256, 256); g.translate(128, 128);
    for (let i = 0; i < 5; i++) { g.rotate(1.2566); g.strokeStyle = i % 2 ? "#1f2a44" : "#7388ad"; g.lineWidth = 7; g.beginPath();
      for (let a = 0; a < 5; a += 0.1) { const r = a * 24; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); } });
  P.portal = new THREE.Mesh(new THREE.CircleGeometry(1.35, 40), new THREE.MeshBasicMaterial({ map: swirl }));
  const arch = toon(new THREE.TorusGeometry(1.5, 0.24, 10, 28, Math.PI), 0x4a7bd8); arch.position.y = 1.6;
  P.gate = grp(at(box(0.5, 1.7, 0.6, 0x4a7bd8), -1.5, 0.85, 0), at(box(0.5, 1.7, 0.6, 0x4a7bd8), 1.5, 0.85, 0), arch, at(P.portal, 0, 1.75, 0), at(box(0.3, 0.3, 0.3, 0xffd35c, 0.03), 0, 3.3, 0));
  P.gate.position.set(11.2, 0, -0.3); P.gate.rotation.y = -0.5; scene.add(P.gate);
  const island = (label, color, build) => { const g = grp(at(cyl(1.9, 1.9, 0.4, 0x6fcf6a, 14), 0, 0, 0), at(cyl(1.8, 0.2, 2.4, 0x9a7b5c, 12), 0, -1.4, 0), build);
    const s = sign(label, color, "#16101c", 3.0, 0.8); s.position.set(0, 3.3, 0); g.add(s); scene.add(g); return g; };
  P.isles = [
    at(island("EMAIL", "#ffd98a", grp(at(box(1.5, 1.1, 1.0, 0xfff0cf), 0, 0.75, 0), at(box(1.7, 0.2, 1.2, 0xe8504a), 0, 1.4, 0))), 17.5, 4.2, -5),
    at(island("CALENDAR", "#9fe0a8", grp(at(box(1.6, 1.4, 0.3, 0xffffff), 0, 0.9, 0), at(box(1.6, 0.36, 0.34, 0xe8504a), 0, 1.5, 0))), 20.5, 1.2, -1),
    at(island("GITHUB", "#c9d3e0", grp(at(cyl(0.6, 0.7, 1.6, 0x4a4370, 10), 0, 1.0, 0), at(cyl(0.05, 0.75, 0.7, 0x2a2540, 10), 0, 2.1, 0))), 17.2, -1.4, 3.2),
  ];
  const up = new THREE.Vector3(0, 1, 0);
  P.beams = P.isles.map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 8), new THREE.MeshBasicMaterial({ color: 0x1f2a44 })); scene.add(m); return m; });
  P.packets = P.isles.map(() => { const m = grp(new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), new THREE.MeshBasicMaterial({ color: 0xd9773c })), glow(0xffb24a, 1.0)); scene.add(m); return m; });
  P.setBeam = (i, from, u) => { const to = P.isles[i].position.clone().add(new THREE.Vector3(-1.2, 0.5, 0)); const d = to.clone().sub(from); const len = d.length() * u; const m = P.beams[i];
    m.visible = u > 0.001; m.scale.set(1, Math.max(len, 0.001), 1); m.position.copy(from).addScaledVector(d.clone().normalize(), len / 2); m.quaternion.setFromUnitVectors(up, d.clone().normalize()); return to; };

  // file pile (agent), bell (hooks), chest (plugin)
  P.pile = grp(); for (let i = 0; i < 9; i++) { const b = box(1.0, 0.5, 0.8, i % 2 ? 0xfff0cf : 0xe6d2a4, 0.03); b.position.set((i % 3) * 1.05 - 1.05 + ((i * 7) % 3) * 0.06, 0.25 + Math.floor(i / 3) * 0.52, ((i * 5) % 3) * 0.1); P.pile.add(b); }
  const ps = sign("200 FILES", "#fff0cf", "#16101c", 2.6, 0.7); ps.position.set(0, 2.1, 0.6); P.pile.add(ps); scene.add(P.pile);
  P.bellSwing = grp(at(cyl(0.12, 0.42, 0.6, 0xffd35c, 14), 0, -0.45, 0), at(ball(0.11, 0x8a5a34, 0.02), 0, -0.82, 0));
  P.bell = grp(at(box(0.22, 3.0, 0.22, 0x6f4526), 0, 1.5, 0), at(box(1.3, 0.2, 0.22, 0x6f4526), 0.55, 2.9, 0), at(P.bellSwing, 1.0, 2.8, 0), at(box(0.5, 0.5, 0.1, 0xff7ad1, 0.03), 0, 2.2, 0.15));
  scene.add(P.bell);
  P.wire = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0), new THREE.Vector3(2, 0, 0)]), new THREE.LineBasicMaterial({ color: 0xd9773c })); scene.add(P.wire);
  P.lid = grp(at(box(2.0, 0.5, 1.3, 0xc2413a), 0, 0.25, 0.65), at(box(2.06, 0.14, 1.36, 0xffd35c, 0.02), 0, 0.5, 0.65));
  P.chest = grp(at(box(2.0, 1.0, 1.3, 0xb5372f), 0, 0.5, 0), at(box(2.06, 0.16, 1.36, 0xffd35c, 0.02), 0, 0.98, 0), at(box(0.3, 0.36, 0.1, 0xffd35c, 0.03), 0, 0.72, 0.68), at(P.lid, 0, 1.02, -0.65));
  P.chestGlow = at(glow(0xffe9a0, 4.2), 0, 1.4, 0); P.chest.add(P.chestGlow); scene.add(P.chest);
  const key = toon(new THREE.TorusGeometry(0.26, 0.08, 8, 20), 0x62adff, 0.03);
  const whistle = grp(cyl(0.12, 0.2, 0.5, 0xffb24a, 12, 0.03)); whistle.rotation.z = 1.3;
  const minibell = grp(cyl(0.08, 0.28, 0.4, 0xff7ad1, 12, 0.03));
  P.loot = [grp(scrollMesh(0x2fd97b)), grp(scrollMesh(0x2fd97b)), grp(key), whistle, minibell]; P.loot.forEach((m) => scene.add(m));

  // ---- character cards
  function card(who) {
    const cv = document.createElement("canvas"); cv.width = 768; cv.height = 1152;
    const g = cv.getContext("2d"); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const geo = new THREE.PlaneGeometry(2.6, 3.9); geo.translate(0, 1.95 - 0.1, 0);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.45 }));
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.5, 24), new THREE.MeshBasicMaterial({ color: 0x1f2a44, transparent: true, opacity: 0.16, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; scene.add(mesh); scene.add(sh);
    return { who, g, tex, mesh, sh, x: 0, y: 0, z: 0, flip: 1, s: 1, vis: false, pose: {} };
  }
  const cast = { kai: card("kai"), ops: card("ops"), scout: card("scout") };

  const faceCam = [];
  scene.traverse((o) => { if (o.userData && o.userData.face) faceCam.push(o); });

  function render(t, night) {
    amb.intensity = 1.25 - 0.4 * night; sun.intensity = 1.9 - 1.2 * night; 
    cam.updateMatrixWorld();
    const q = new THREE.Quaternion();
    for (const o of faceCam) { if (o.parent) { o.parent.getWorldQuaternion(q); o.quaternion.copy(q.invert()).multiply(cam.quaternion); } }
    for (const k in cast) {
      const c = cast[k]; c.mesh.visible = c.sh.visible = c.vis;
      if (!c.vis) continue;
      Chibi.draw(c.g, c.who, c.pose, t); c.tex.needsUpdate = true;
      c.mesh.position.set(c.x, c.y, c.z); c.mesh.quaternion.copy(cam.quaternion); c.mesh.scale.set(c.flip * c.s, c.s, 1);
      c.mesh.material.color.setScalar(1 - 0.3 * night);
      c.sh.position.set(c.x, 0.02, c.z); c.sh.scale.setScalar(c.s * (1 - Math.min(c.y, 2) * 0.25));
    }
    renderer.render(scene, cam);
  }
  window.World = { THREE, scene, cam, P, cast, render, glow, PAL };
})();
