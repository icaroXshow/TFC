/* =========================================================
   KWL — Mapa Navegable (JS)
   - D3 v7
   - Worlds con órbitas (pad/gap), minimapa, índice, autohide UI
   ========================================================= */

/* ---------- Helpers imágenes (fallback embebido) ---------- */
function svgDataUri(svg){
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg.trim());
}
function iconCircle(label, bg1="#6affeb", bg2="#000000"){
  return svgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <defs>
      <radialGradient id="g" cx="35%" cy="30%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </radialGradient>
    </defs>
    <circle cx="128" cy="128" r="120" fill="url(#g)"/>
    <circle cx="128" cy="128" r="120" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="6"/>
    <text x="128" y="144" text-anchor="middle" font-family="Arial" font-size="44" font-weight="800" fill="rgba(255,255,255,0.92)">${label}</text>
  </svg>`);
}

/* ---------- Fondo "espacio" (canvas) ---------- */
function initSpaceBackground(){
  const canvas = document.getElementById("spaceBg");
  if(!(canvas instanceof HTMLCanvasElement)) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const ctx = canvas.getContext("2d", { alpha: true });
  if(!ctx) return;

  const rocketImg = new Image();
  rocketImg.decoding = "async";
  rocketImg.loading = "eager";
  rocketImg.src = "assets/fondo/cohete.png";

  let rafId = null;
  let stars = [];
  let w = 0, h = 0, dpr = 1;
  let rockets = [];
  let nextLaunchAtMs = performance.now() + 1500;

  function rand(min, max){ return min + Math.random() * (max - min); }
  function clamp01(v){ return Math.max(0, Math.min(1, v)); }

  function cubicBezier(p0, p1, p2, p3, t){
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: (uuu * p0.x) + (3 * uu * t * p1.x) + (3 * u * tt * p2.x) + (ttt * p3.x),
      y: (uuu * p0.y) + (3 * uu * t * p1.y) + (3 * u * tt * p2.y) + (ttt * p3.y),
    };
  }

  function cubicBezierTangent(p0, p1, p2, p3, t){
    const u = 1 - t;
    return {
      x: (3 * u * u * (p1.x - p0.x)) + (6 * u * t * (p2.x - p1.x)) + (3 * t * t * (p3.x - p2.x)),
      y: (3 * u * u * (p1.y - p0.y)) + (6 * u * t * (p2.y - p1.y)) + (3 * t * t * (p3.y - p2.y)),
    };
  }

  function randomEdgePoint(margin){
    const side = Math.floor(Math.random() * 4);
    if(side === 0) return { x: rand(-margin, w + margin), y: -margin };         // top
    if(side === 1) return { x: w + margin, y: rand(-margin, h + margin) };      // right
    if(side === 2) return { x: rand(-margin, w + margin), y: h + margin };      // bottom
    return { x: -margin, y: rand(-margin, h + margin) };                         // left
  }

  function spawnRocket(nowMs){
    const margin = Math.max(120, Math.min(260, Math.max(w, h) * 0.18));
    const p0 = randomEdgePoint(margin);
    let p3 = randomEdgePoint(margin);
    // evita trayectorias demasiado cortas
    for(let i=0;i<6;i++){
      const dx = p3.x - p0.x;
      const dy = p3.y - p0.y;
      if((dx*dx + dy*dy) > (Math.max(w, h) * 0.8) ** 2) break;
      p3 = randomEdgePoint(margin);
    }

    const c1 = { x: rand(w * 0.15, w * 0.85), y: rand(h * 0.10, h * 0.90) };
    const c2 = { x: rand(w * 0.15, w * 0.85), y: rand(h * 0.10, h * 0.90) };

    rockets.push({
      t0: nowMs,
      dur: rand(6500, 10500),
      p0,
      p1: c1,
      p2: c2,
      p3,
      size: rand(10, 14),
    });
  }

  function drawRocket(r, nowMs){
    const t = clamp01((nowMs - r.t0) / r.dur);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const pos = cubicBezier(r.p0, r.p1, r.p2, r.p3, eased);
    const tan = cubicBezierTangent(r.p0, r.p1, r.p2, r.p3, eased);
    const ang = Math.atan2(tan.y, tan.x);

    // estela
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(ang);
    ctx.globalCompositeOperation = "lighter";
    const trail = ctx.createLinearGradient(-r.size * 6, 0, r.size * 0.5, 0);
    trail.addColorStop(0, "rgba(120,180,255,0)");
    trail.addColorStop(0.35, "rgba(120,180,255,0.10)");
    trail.addColorStop(0.75, "rgba(0,255,190,0.12)");
    trail.addColorStop(1, "rgba(255,255,255,0.0)");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.ellipse(-r.size * 2.4, 0, r.size * 5.2, r.size * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // cohete (imagen si existe; fallback vector si no carga)
    ctx.globalCompositeOperation = "source-over";
    if(rocketImg.complete && rocketImg.naturalWidth > 0){
      const aspect = rocketImg.naturalWidth / rocketImg.naturalHeight;
      const imgH = r.size * 3.2;
      const imgW = imgH * aspect;
      ctx.drawImage(rocketImg, -imgW * 0.55, -imgH * 0.5, imgW, imgH);
    }else{
      ctx.fillStyle = "rgba(245,248,255,0.92)";
      ctx.strokeStyle = "rgba(0,0,0,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.size * 1.8, 0);
      ctx.lineTo(-r.size * 1.2, -r.size * 0.9);
      ctx.lineTo(-r.size * 0.9, 0);
      ctx.lineTo(-r.size * 1.2, r.size * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(90,180,255,0.75)";
      ctx.beginPath();
      ctx.arc(r.size * 0.25, 0, r.size * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    return t < 1;
  }

  function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.floor((w * h) / 9000);
    stars = Array.from({ length: Math.max(120, Math.min(520, count)) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: rand(0.4, 1.8),
      a: rand(0.18, 0.9),
      s: rand(0.05, 0.35), // speed
      t: rand(0, Math.PI * 2), // twinkle phase
    }));
  }

  function draw(tms){
    const t = tms * 0.001;
    ctx.clearRect(0, 0, w, h);

    // Nebulosas suaves (baratas): 2 gradientes radiales
    const g1 = ctx.createRadialGradient(w * 0.22, h * 0.18, 0, w * 0.22, h * 0.18, Math.max(w, h) * 0.6);
    g1.addColorStop(0, "rgba(78,98,255,0.10)");
    g1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);

    const g2 = ctx.createRadialGradient(w * 0.72, h * 0.70, 0, w * 0.72, h * 0.70, Math.max(w, h) * 0.55);
    g2.addColorStop(0, "rgba(0,255,180,0.06)");
    g2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    // Estrellas
    for(const s of stars){
      const tw = 0.55 + 0.45 * Math.sin(t * 1.8 + s.t);
      const alpha = s.a * tw;
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      if(!reduceMotion){
        s.y += s.s;
        s.x += Math.sin(t * 0.15 + s.t) * 0.03;
        if(s.y > h + 2){ s.y = -2; s.x = Math.random() * w; }
        if(s.x < -2) s.x = w + 2;
        if(s.x > w + 2) s.x = -2;
      }
    }

    // Cohete: un vuelo cada ~40s (si no hay reduce motion)
    if(!reduceMotion){
      if(tms >= nextLaunchAtMs){
        const burst = Math.floor(rand(2, 5)); // 2..4
        const maxOnScreen = 10;
        for(let i=0;i<burst && rockets.length < maxOnScreen;i++){
          spawnRocket(tms + i * rand(220, 900));
        }
        nextLaunchAtMs = tms + 40000;
      }
      if(rockets.length){
        rockets = rockets.filter(r => drawRocket(r, tms));
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  rafId = requestAnimationFrame(draw);

  // Pausa si la pestaña no está visible (ahorra CPU)
  document.addEventListener("visibilitychange", () => {
    if(document.hidden && rafId){
      cancelAnimationFrame(rafId);
      rafId = null;
      return;
    }
    if(!document.hidden && !rafId){
      rafId = requestAnimationFrame(draw);
    }
  });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const ICONS = {
  CORE: iconCircle("CORE", "#b9d4ff", "#2b57ff"),
  NET:  iconCircle("NET",  "#e6ae16", "#ff3030"),
  SRV:  iconCircle("SRV",  "#b6ffde", "#2aa184"),
  APP:  iconCircle("APP",  "#e6e0ff", "#6a5cff"),
  DB:   iconCircle("DB",   "#ffe6b8", "#ff8a1f"),
  SEC:  iconCircle("SEC",  "#ffd0d0", "#ff4a4a"),
  IOT:  iconCircle("IOT",  "#ffd7a8", "#ff7a2f"),
  DOC:  iconCircle("DOC",  "#d6f7ff", "#2d89ff"),

  // Alias/fallbacks para el mapa (usados por IMAGES)
  ISP:   iconCircle("ISP",   "#e6ae16", "#ff3030"),
  MTK:   iconCircle("MTK",   "#e6ae16", "#ff3030"),
  SW:    iconCircle("SW",    "#e6ae16", "#ff3030"),
  PVE:   iconCircle("PVE",   "#b6ffde", "#2aa184"),
  DEB:   iconCircle("DEB",   "#b6ffde", "#2aa184"),
  NGINX: iconCircle("NGINX", "#e6e0ff", "#6a5cff"),
  PHP:   iconCircle("PHP",   "#e6e0ff", "#6a5cff"),
  REDIS: iconCircle("REDIS", "#e6e0ff", "#6a5cff"),
  PMA:   iconCircle("PMA",   "#d6f7ff", "#2d89ff"),
  MER:   iconCircle("MER",   "#d6f7ff", "#2d89ff"),
  REL:   iconCircle("REL",   "#d6f7ff", "#2d89ff"),
  BAK:   iconCircle("BAK",   "#d6f7ff", "#2d89ff"),
  ESP:   iconCircle("ESP32", "#ffd7a8", "#ff7a2f"),
  DOOR:  iconCircle("DOOR",  "#ffd7a8", "#ff7a2f"),
  MOBO:  iconCircle("CCTV",  "#ffd0d0", "#ff4a4a"),
  CCTV:  iconCircle("CCTV",  "#ffd0d0", "#ff4a4a"),
};

const IMAGES = {
  // IMAGES: aquí defines UNA VEZ las rutas reales (si existen)
  // Si src falla o no está definido, se usa fallback.
  // Puedes cambiar "assets/map/..." por lo que uses en tu servidor.
  RED: { src: "assets/map/net.png", fallback: ICONS.NET },
  SERVER: { src: "assets/map/server.png", fallback: ICONS.SRV },
  IOT: { src: "assets/map/iot.png", fallback: ICONS.IOT },
  CCTV: { src: "assets/map/cctv.png", fallback: ICONS.CCTV },

  MOVISTAR: { src: "assets/map/movistar.png", fallback: ICONS.ISP },
  MIKROTIK: { src: "assets/map/mikrotik.png", fallback: ICONS.MTK },
  SWITCH: { src: "assets/map/switch.png", fallback: ICONS.SW },

  PROXMOX: { src: "assets/map/proxmox.png", fallback: ICONS.PVE },
  DEBIAN: { src: "assets/map/ubuntu.png", fallback: ICONS.DEB },

  NGINX: { src: "assets/map/nginx.png", fallback: ICONS.NGINX },
  PHP: { src: "assets/map/php.png", fallback: ICONS.PHP },
  MARIADB: { src: "assets/map/mariadb.png", fallback: ICONS.DB },
  REDIS: { src: "assets/map/redis.png", fallback: ICONS.REDIS },

  PHPMA: { src: "assets/map/phpmyadmin.png", fallback: ICONS.PMA },
  MER: { src: "assets/map/mer.png", fallback: ICONS.MER },
  REL: { src: "assets/map/relational.png", fallback: ICONS.REL },
  BACKUP: { src: "assets/map/backup.png", fallback: ICONS.BAK },

  ESP32: { src: "assets/map/esp32.png", fallback: ICONS.ESP },
  DOOR: { src: "assets/map/door.png", fallback: ICONS.DOOR },
  MOBOTIX: { src: "assets/map/mobotix.png", fallback: ICONS.MOBO },
};

function resolveImg(imgKey) {
  if (!imgKey) return { src: null, fallback: null };
  const entry = IMAGES[imgKey];
  if (!entry) return { src: null, fallback: ICONS.NET };
  return { src: entry.src || null, fallback: entry.fallback || null };
}

/* ---------- Config ---------- */
const OPEN_IN_NEW_TAB = true;
const SHOW_EDGE_LABELS_FROM_K = 1.25;
const SHOW_SUBLABELS_FROM_K   = 1.15;
const ROT_SPEED_DEFAULT = 0.055;

// tamaños
const SIZE_BY_KIND = {
  C: 170,
  L1: 80,
  L2: 50,
  L3: 40,
  L4: 35,
  "S-L1": 30,
  "S-L2": 20,
  "S-L3": 15,
  "S-L4": 10,
};

// distancia al padre (pad)
const ORBIT_PAD_BY_KIND = {
  // Para nodos tipo "C", el pad es grande porque suelen ser grandes y con muchos hijos
  C: 200,
  L1: 100,
  L2: 30,
  L3: 15,
  L4: 10,
  // Para los S-Lx, el pad es más grande para evitar solapamientos al ser más pequeños
  "S-L1": 70,
  "S-L2": 55,
  "S-L3": 40,
  "S-L4": 26,
};

// separación entre hermanos (gap)
const ORBIT_GAP_BY_KIND = {
  // Para nodos tipo "C", el gap es grande porque suelen ser grandes y con muchos hijos
  C: 400,
  L1: 100,
  L2: 1800,
  L3: 80,
  L4: 100,
  // Para los S-Lx, el gap es más grande para evitar solapamientos al ser más pequeños
  "S-L1": 40,
  "S-L2": 15,
  "S-L3": 10,
  "S-L4": 10,
};

function orbitPadForChildKind(kind) {
  return ORBIT_PAD_BY_KIND[kind] ?? 50;
}
function orbitGapForChildKind(kind) {
  return ORBIT_GAP_BY_KIND[kind] ?? 50;
}

/* ---------- WORLDS  ---------- */
const WORLDS = {
  main: {
    name: "Universo",
    nodes: [
      {
        id: "C_red",
        kind: "C",
        label: "[C] Red",
        desc: "VPN · VLAN · Firewall",
        x: -720,
        y: -230,
        imgKey: "RED",
        url: "http://192.168.1.51:8081/admin/programador",
      },
      {
        id: "C_srv",
        kind: "C",
        label: "[C] Server",
        desc: "LXC-MQTT · VM-CORE · VM-DATA",
        x: 920,
        y: -420,
        imgKey: "SERVER",
        url: "http://192.168.1.51:8081/admin/inicio",
      },
      {
        id: "C_iot",
        kind: "C",
        label: "[C] IoT",
        desc: "Simulador IoT · MQTT",
        x: -610,
        y: 660,
        imgKey: "IOT",
        url: "http://192.168.1.51:8090",
      },
      {
        id: "C_cctv",
        kind: "C",
        label: "[C] CCTV",
        desc: "Cámara tienda · panel admin",
        x: 610,
        y: 680,
        imgKey: "CCTV",
        url: "http://192.168.1.51:8081/admin/camara",
      },

      // Red
      {
        id: "L1_mov",
        parent: "C_red",
        kind: "L1",
        label: "[L1] Movistar",
        desc: "Salida WAN",
        imgKey: "MOVISTAR",
        url: "http://192.168.1.51:8081",
      },
      {
        id: "L1_mtik",
        parent: "C_red",
        kind: "L1",
        label: "[L1] MikroTik",
        desc: "VPN · VLAN · Reglas",
        imgKey: "MIKROTIK",
        url: "http://192.168.1.51:8080/health",
      },
      {
        id: "L1_sw",
        parent: "C_red",
        kind: "L1",
        label: "[L1] Switch",
        desc: "Troncales VLAN",
        imgKey: "SWITCH",
        url: "http://192.168.1.52:8081",
      },

      // Server
      {
        id: "L1_pve",
        parent: "C_srv",
        kind: "L1",
        label: "[L1] Proxmox",
        desc: "Nodo virtualización",
        imgKey: "PROXMOX",
        url: "http://192.168.1.51:8081/admin/inicio",
      },
      {
        id: "L2_vmdeb",
        parent: "L1_pve",
        kind: "L2",
        label: "[L2] VM-CORE",
        desc: "Backend · Frontend · Simulador",
        imgKey: "DEBIAN",
        showAt: [0.8, 99],
        url: "http://192.168.1.51:8080/health",
      },

      {
        id: "S2_nginx",
        parent: "L2_vmdeb",
        kind: "S-L2",
        label: "[S-L2] nginx",
        desc: "proxy frontend",
        imgKey: "NGINX",
        showAt: [1.0, 99],
        url: "http://192.168.1.51:8081",
      },
      {
        id: "S2_php",
        parent: "L2_vmdeb",
        kind: "S-L2",
        label: "[S-L2] Node API",
        desc: "backend",
        imgKey: "APP",
        showAt: [1.0, 99],
        url: "http://192.168.1.51:8080/health",
      },
      {
        id: "S2_db",
        parent: "L2_vmdeb",
        kind: "S-L2",
        label: "[S-L2][W] VM-DATA",
        desc: "MariaDB · Redis · Adminer",
        imgKey: "MARIADB",
        showAt: [1.0, 99],
        url: "http://192.168.1.52:8081",
        world: "w_mariadb",
      },
      {
        id: "S2_redis",
        parent: "L2_vmdeb",
        kind: "S-L2",
        label: "[S-L2] Redis",
        desc: "cache/colas",
        imgKey: "REDIS",
        showAt: [1.0, 99],
        url: "http://192.168.1.52:6379",
      },

      // IoT
      {
        id: "L1_iot_m",
        parent: "C_iot",
        kind: "L1",
        label: "[L1] Simulador técnico",
        desc: "L1,L2,L3,S1,S2",
        imgKey: "ESP32",
        url: "http://192.168.1.51:8090",
      },
      {
        id: "L1_iot_d",
        parent: "C_iot",
        kind: "L1",
        label: "[L1] LXC-MQTT",
        desc: "broker mosquitto",
        imgKey: "IOT",
        url: "http://192.168.1.53:1883",
      },

      // CCTV
      {
        id: "L1_mobo",
        parent: "C_cctv",
        kind: "L1",
        label: "[L1] MOBOTIX",
        desc: "inicio + vista cámara",
        imgKey: "MOBOTIX",
        url: "http://192.168.1.51:8081/admin/camara",
      },
    ],
    edges: [
      {
        s: "C_red",
        t: "L1_mov",
        label: "WAN",
        type: "net",
        showAt: [0.1, 99],
      },
      {
        s: "L1_mov",
        t: "L1_sw",
        label: "WAN",
        type: "net",
        showAt: [0.2, 99],
      },
      {
        s: "L1_mtik",
        t: "L1_sw",
        label: "LAN trunk",
        type: "net",
        showAt: [0.3, 99],
      },
      {
        s: "C_srv",
        t: "L1_mtik",
        label: "LAN trunk",
        type: "net",
        showAt: [0.5, 99],
      },
      {
        s: "C_srv",
        t: "L1_pve",
        label: "LAN",
        type: "net",
        showAt: [0.6, 99],
      },

      {
        s: "L1_pve",
        t: "L2_vmdeb",
        label: "VM",
        type: "soft",
        showAt: [0.15, 99],
      },

      {
        s: "L2_vmdeb",
        t: "S2_nginx",
        label: "svc",
        type: "soft",
        showAt: [1.35, 99],
      },
      {
        s: "L2_vmdeb",
        t: "S2_php",
        label: "svc",
        type: "soft",
        showAt: [1.35, 99],
      },
      {
        s: "L2_vmdeb",
        t: "S2_db",
        label: "svc",
        type: "soft",
        showAt: [1.35, 99],
      },
      {
        s: "L2_vmdeb",
        t: "S2_redis",
        label: "svc",
        type: "soft",
        showAt: [1.35, 99],
      },

      {
        s: "L1_mtik",
        t: "C_iot",
        label: "VLAN IoT",
        type: "net",
        showAt: [0.75, 99],
      },
    ],
  },

  w_mariadb: {
    name: "MariaDB",
    nodes: [
      {
        id: "L4_core",
        kind: "L4",
        label: "[L4] MariaDB",
        desc: "core",
        x: 0,
        y: 0,
        imgKey: "MARIADB",
        url: "http://192.168.1.52:8081",
      },

      {
        id: "S4_pma",
        parent: "L4_core",
        kind: "S-L4",
        label: "[S-L4] Adminer",
        desc: "gestor BD",
        imgKey: "DB",
        url: "http://192.168.1.52:8081",
      },
      {
        id: "S4_mer",
        parent: "L4_core",
        kind: "S-L4",
        label: "[S-L4] MER",
        desc: "E/R",
        imgKey: "MER",
        url: "http://192.168.1.52:8081",
      },
      {
        id: "S4_rel",
        parent: "L4_core",
        kind: "S-L4",
        label: "[S-L4] Modelo físico",
        desc: "tablas",
        imgKey: "REL",
        url: "http://192.168.1.52:8081",
      },
      {
        id: "S4_bak",
        parent: "L4_core",
        kind: "S-L4",
        label: "[S-L4] Backups",
        desc: "ops",
        imgKey: "BACKUP",
        url: "http://192.168.1.51:8080/health",
      },
    ],
    edges: [
      {
        s: "L4_core",
        t: "S4_pma",
        label: "tool",
        type: "soft",
        showAt: [0, 99],
      },
      {
        s: "L4_core",
        t: "S4_mer",
        label: "doc",
        type: "soft",
        showAt: [0, 99],
      },
      {
        s: "L4_core",
        t: "S4_rel",
        label: "doc",
        type: "soft",
        showAt: [0, 99],
      },
      {
        s: "L4_core",
        t: "S4_bak",
        label: "ops",
        type: "soft",
        showAt: [0, 99],
      },
    ],
  },
};

// Inicia fondo antes de construir el SVG del mapa
initSpaceBackground();

/* =========================================================
   NAV PANEL (Índice) — usa NODOS RUNTIME
   ========================================================= */
let navSelectedNodeId = null;
let currentWorldKey = "main";

function norm(s){ return (s ?? "").toString().toLowerCase().trim(); }
function escapeHtml(s){
  return (s ?? "").toString()
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#39;");
}
function escapeAttr(s){ return escapeHtml(s).replaceAll("`","&#96;"); }

function nodeIsVisibleAtK(n, k){
  if(!n.showAt) return true;
  const [min,max] = n.showAt;
  return k >= min && k <= max;
}

function buildNavPanel(){
  const searchEl = document.getElementById("navSearch");
  const listEl   = document.getElementById("navList");
  if(!searchEl || !listEl) return;

  function render(){
    const k = (window.__currentZoomK ?? 1);
    const q = norm(searchEl.value);

    const runtimeNodes = window.__worldNodes ?? WORLDS[currentWorldKey]?.nodes ?? [];

    const filtered = runtimeNodes
      .filter(n => nodeIsVisibleAtK(n, k))
      .filter(n => {
        if(!q) return true;
        const hay = norm(n.label) + " " + norm(n.id) + " " + norm(n.desc) + " " + norm(n.kind);
        return hay.includes(q);
      })
      .slice()
      .sort((a,b) => (a.kind||"").localeCompare(b.kind||"") || (a.label||a.id).localeCompare(b.label||b.id));

    const groups = new Map();
    for(const n of filtered){
      const key = n.kind || "OTROS";
      if(!groups.has(key)) groups.set(key, []);
      groups.get(key).push(n);
    }

    let html = "";
    for(const [kind, arr] of groups){
      html += `<div class="navGroup">
        <div class="navGroupTitle">${escapeHtml(kind)}</div>
        ${arr.map(n => {
          const title = (n.label || n.id);
          const sub = n.desc ? `<div class="navSub">${escapeHtml(n.desc)}</div>` : "";
          const active = (n.id === navSelectedNodeId) ? "active" : "";
          return `
            <div class="navItem ${active}" data-node-id="${escapeAttr(n.id)}">
              <span class="navBadge">${escapeHtml(n.kind || "")}</span>
              <div class="navText">
                <div>${escapeHtml(title)}</div>
                ${sub}
              </div>
            </div>`;
        }).join("")}
      </div>`;
    }

    listEl.innerHTML = html || "<div style='opacity:.7;padding:8px'>Sin nodos (filtro/zoom)</div>";

    listEl.querySelectorAll(".navItem").forEach(el => {
      el.addEventListener("click", () => {
        const nodeId = el.getAttribute("data-node-id");
        gotoNodeById(nodeId);
      });
    });
  }

  searchEl.addEventListener("input", render);
  window.refreshNavPanel = render;
  render();
}

function gotoNodeById(nodeId){
  // Runtime (mundo cargado)
  let n = window.__worldById?.get(nodeId);

  // Fallback: definición estática del world actual
  if(!n){
    const world = WORLDS[currentWorldKey];
    if(!world) return;
    n = world.nodes?.find(x => x.id === nodeId);
  }

  // Global: busca en todos los mundos
  if(!n){
    for(const [wk, w] of Object.entries(WORLDS)){
      const found = w.nodes?.find(x => x.id === nodeId);
      if(found){
        // Carga ese world y luego centra (si el engine existe)
        currentWorldKey = wk;
        if(typeof loadWorld === "function"){
          loadWorld(wk, { push:true });
        }
        n = found;
        break;
      }
    }
  }

  if(!n) return;

  navSelectedNodeId = n.id;
  if(window.refreshNavPanel) window.refreshNavPanel();

  // Portal world
  if(n.world && WORLDS[n.world] && typeof loadWorld === "function"){
    currentWorldKey = n.world;
    loadWorld(n.world, { push:true });

    requestAnimationFrame(() => {
      // intenta centrar al core si existe
      const nn = window.__worldById?.get("L4_core") || window.__worldById?.get(n.id);
      const tx = (nn?._x ?? nn?.x ?? 0);
      const ty = (nn?._y ?? nn?.y ?? 0);
      focusWorldPoint(tx, ty, 1.8);
      highlightNode(nn?.id ?? n.id);
    });
    return;
  }

  const tx = (n._x ?? n.x ?? 0);
  const ty = (n._y ?? n.y ?? 0);
  focusWorldPoint(tx, ty, 1.8);
  highlightNode(n.id);
}

/* =========================================================
   ENGINE D3
   ========================================================= */
const svg = d3.select("#space");
window.__d3Svg = svg;

const tooltip = document.getElementById("tooltip");
const miniWrap = document.getElementById("miniWrap");
const miniSvg = d3.select("#miniSvg");

const hudCrumb = document.getElementById("crumb");
const btnBack = document.getElementById("btnBack");
const btnHome = document.getElementById("btnHome");
const btnCenter = document.getElementById("btnCenter");
const btnFit = document.getElementById("btnFit");
const btnToggleLabels = document.getElementById("btnToggleLabels");
const btnToggleEdges = document.getElementById("btnToggleEdges");
const btnToggleMini = document.getElementById("btnToggleMini");

let W = window.innerWidth;
let H = window.innerHeight;

const bg = svg.append("g");
const rand = (a,b) => Math.random()*(b-a)+a;
function drawStars(){
  bg.selectAll("*").remove();
  for(let i=0;i<300;i++){
    bg.append("circle")
      .attr("cx", rand(0,W))
      .attr("cy", rand(0,H))
      .attr("r", rand(0.4,1.8))
      .attr("fill", `rgba(255,255,255,${rand(0.10,0.85)})`);
  }
}
drawStars();

const viewport = svg.append("g");
const edgesG = viewport.append("g");
const nodesG = viewport.append("g");

// estado
let currentWorldId = "main";
let history = ["main"];
let nodes = [];
let edges = [];
let byId = new Map();
let childrenByParent = new Map();
let currentTransform = d3.zoomIdentity;

let showLabels = true;
let showEdges = true;
let showMini = true;

function inRange(showAt, k){
  if(!showAt) return true;
  return k >= showAt[0] && k <= showAt[1];
}
function nodeVisible(n,k){ return inRange(n.showAt, k); }
function edgeVisible(e,k){ return inRange(e.showAt, k); }

function tipShow(text, x, y){
  tooltip.style.display = "block";
  tooltip.textContent = text;
  tooltip.style.left = (x+12) + "px";
  tooltip.style.top  = (y+12) + "px";
}
function tipHide(){ tooltip.style.display = "none"; }

function applyDefaultSizing(){
  for(const n of nodes){
    if(typeof n.r !== "number") n.r = SIZE_BY_KIND[n.kind] ?? 44;
  }
}
function buildChildrenIndex(){
  childrenByParent = new Map();
  for(const n of nodes){
    if(!n.parent) continue;
    if(!childrenByParent.has(n.parent)) childrenByParent.set(n.parent, []);
    childrenByParent.get(n.parent).push(n.id);
  }
}
function assignOrbitsAndPhases(){
  for(const [parentId, childIds] of childrenByParent.entries()){
    const p = byId.get(parentId);
    if(!p) continue;

    const nCount = childIds.length;

    let maxChildR = 0;
    let maxGap = 0;
    let maxPad = 0;

    for(const id of childIds){
      const c = byId.get(id);
      if(!c) continue;
      maxChildR = Math.max(maxChildR, c.r ?? 30);

      const gap = c.orbitGap ?? orbitGapForChildKind(c.kind);
      const pad = c.orbitPad ?? orbitPadForChildKind(c.kind);
      maxGap = Math.max(maxGap, gap);
      maxPad = Math.max(maxPad, pad);
    }

    // Arc length constraint + parent clearance
    const minRByArc = ((2*maxChildR + maxGap) * nCount) / (2*Math.PI);
    const minRByParent = (p.r ?? 60) + maxChildR + maxPad;

    const orbitR = Math.max(minRByArc, minRByParent);

    childIds.forEach((id, i) => {
      const c = byId.get(id);
      if(!c) return;
      c._orbitR = orbitR;
      c._phase0 = (Math.PI*2*i)/nCount;

      const base = ROT_SPEED_DEFAULT;
      const extra = c.kind?.startsWith("S-") ? 0.06 : (c.kind === "L3" ? 0.03 : 0.0);
      c._speed = c.orbitSpeed ?? base + extra;
    });
  }
}

function computePositions(t){
  // absolutos
  for(const n of nodes){
    if(typeof n.x === "number" && typeof n.y === "number"){
      n._x = n.x; n._y = n.y;
    }
  }

  // resolver jerarquía por pasadas
  for(let pass=0; pass<6; pass++){
    for(const n of nodes){
      if(!n.parent) continue;
      const p = byId.get(n.parent);
      if(!p) continue;
      if(typeof p._x !== "number" || typeof p._y !== "number") continue;

      const R = n._orbitR ?? (p.r ?? 60) + (n.r ?? 30) + (n.orbitPad ?? orbitPadForChildKind(n.kind));
      const a = (n._phase0 ?? 0) + t * (n._speed ?? ROT_SPEED_DEFAULT);

      n._x = p._x + Math.cos(a) * R;
      n._y = p._y + Math.sin(a) * R;
    }
  }
}

function getBounds(){
  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
  for(const n of nodes){
    const r = (n.r ?? 40) + 60;
    const x = n._x ?? n.x ?? 0;
    const y = n._y ?? n.y ?? 0;
    minX = Math.min(minX, x-r);
    minY = Math.min(minY, y-r);
    maxX = Math.max(maxX, x+r);
    maxY = Math.max(maxY, y+r);
  }
  if(!isFinite(minX)) return { minX:-300, minY:-300, maxX:300, maxY:300 };
  return { minX, minY, maxX, maxY };
}

function fitToWorld(duration=450){
  const b = getBounds();
  const bw = b.maxX - b.minX;
  const bh = b.maxY - b.minY;
  const pad = 140;

  const scale = Math.min((W-pad)/(bw||1), (H-pad)/(bh||1));
  const s = Math.max(0.35, Math.min(scale, 2.35));
  const cx = (b.minX + b.maxX)/2;
  const cy = (b.minY + b.maxY)/2;

  const t = d3.zoomIdentity
    .translate(W/2, H/2)
    .scale(s)
    .translate(-cx, -cy);

  svg.transition().duration(duration).call(zoom.transform, t);
}

function centerView(duration=350){
  const b = getBounds();
  const cx = (b.minX + b.maxX)/2;
  const cy = (b.minY + b.maxY)/2;
  const s = currentTransform.k;

  const t = d3.zoomIdentity
    .translate(W/2, H/2)
    .scale(s)
    .translate(-cx, -cy);

  svg.transition().duration(duration).call(zoom.transform, t);
}

/* ---------- Render ---------- */
function drawWorld(){
  edgesG.selectAll("*").remove();
  nodesG.selectAll("*").remove();

  const edgeWrap = edgesG.selectAll("g.edgeWrap")
    .data(edges, d => `${d.s}->${d.t}`)
    .enter().append("g")
    .attr("class","edgeWrap");

  edgeWrap.append("line")
    .attr("class", d => (d.type === "soft" ? "edge soft" : "edge"));

  edgeWrap.append("text")
    .attr("class","edgeLabel")
    .attr("text-anchor","middle");

  const nodeG = nodesG.selectAll("g.node")
    .data(nodes, d => d.id)
    .enter().append("g")
    .attr("class","node");

  // expón para highlight desde índice
  window.__nodesSelection = nodeG;

  nodeG.append("circle")
    .attr("class","ring")
    .attr("r", d => (d.kind === "C" ? (d.r ?? 150) + 60 : 0))
    .style("display", d => (d.kind === "C" ? null : "none"));

  nodeG.each(function(d){
    const g = d3.select(this);
    const r = d.r ?? 40;
    const { src, fallback } = resolveImg(d.imgKey);
    const initialHref = src || fallback || null;

    if(initialHref){
      const imgEl = g.append("image")
        .attr("href", initialHref)
        .attr("x", -r).attr("y", -r)
        .attr("width", r*2).attr("height", r*2);

      if(src && fallback){
        imgEl.on("error", function(){ d3.select(this).attr("href", fallback); });
      }

      g.append("circle").attr("class","planetStroke").attr("r", r);
    }else{
      g.append("circle")
        .attr("r", r)
        .attr("fill","rgba(120,160,255,0.70)")
        .attr("stroke","rgba(255,255,255,0.16)")
        .attr("stroke-width",2);
    }

    g.append("circle").attr("class","nodeHit").attr("r", r+16);
  });

  nodeG.append("text")
    .attr("class","label")
    .attr("text-anchor","middle")
    .attr("y", d => (d.r ?? 40) + 20)
    .text(d => d.label);

  nodeG.append("text")
    .attr("class","sub")
    .attr("text-anchor","middle")
    .attr("y", d => (d.r ?? 40) + 38)
    .text(d => d.desc ?? "");

  nodeG
    .on("mouseenter", (e,d) => tipShow(`${d.label}${d.desc ? " — "+d.desc : ""}`, e.clientX, e.clientY))
    .on("mousemove", (e,d) => tipShow(`${d.label}${d.desc ? " — "+d.desc : ""}`, e.clientX, e.clientY))
    .on("mouseleave", tipHide)
    .on("click", (e,d) => {
      const shift = e.shiftKey;
      if(d.world && !shift){
        enterWorld(d.world, d.id);
        return;
      }
      if(d.url){
        if(shift) window.open(d.url, "_blank");
        else OPEN_IN_NEW_TAB ? window.open(d.url, "_blank") : (window.location.href = d.url);
      }
    });
}

function update(){
  const k = currentTransform.k;

  nodesG.selectAll("g.node")
    .style("display", d => (nodeVisible(d,k) ? null : "none"))
    .attr("transform", d => `translate(${d._x ?? 0},${d._y ?? 0})`);

  nodesG.selectAll("text.label").style("display", showLabels ? null : "none");
  nodesG.selectAll("text.sub").style("display", (showLabels && k >= SHOW_SUBLABELS_FROM_K) ? null : "none");

  edgesG.style("display", showEdges ? null : "none");

  edgesG.selectAll("g.edgeWrap").each(function(e){
    const a = byId.get(e.s);
    const b = byId.get(e.t);
    if(!a || !b) return;

    const vis = showEdges && edgeVisible(e,k) && nodeVisible(a,k) && nodeVisible(b,k);
    d3.select(this).style("display", vis ? null : "none");

    const ax = a._x ?? 0, ay = a._y ?? 0;
    const bx = b._x ?? 0, by = b._y ?? 0;

    d3.select(this).select("line")
      .attr("x1", ax).attr("y1", ay)
      .attr("x2", bx).attr("y2", by);

    d3.select(this).select("text")
      .attr("x", (ax+bx)/2)
      .attr("y", (ay+by)/2 - 8)
      .text(showLabels && k >= SHOW_EDGE_LABELS_FROM_K ? (e.label ?? "") : "");
  });

  updateMiniMap();
}

/* ---------- Zoom ---------- */
const zoom = d3.zoom()
  .scaleExtent([0.35, 8])
  .on("zoom", (event) => {
    currentTransform = event.transform;

    window.__currentZoomK = event.transform.k;
    if(window.refreshNavPanel) window.refreshNavPanel();

    viewport.attr("transform", currentTransform);
    update();
  });

window.__d3Zoom = zoom;
svg.call(zoom);

/* ---------- Worlds nav ---------- */
function setBreadcrumb(){
  const parts = history.map(id => WORLDS[id]?.name ?? id);
  hudCrumb.textContent = "Ruta: " + parts.join("  ›  ");
  btnBack.toggleAttribute("disabled", history.length <= 1);
}

function loadWorld(worldId, { push=true } = {}){
  const w = WORLDS[worldId];
  if(!w) return;

  currentWorldId = worldId;
  currentWorldKey = worldId;

  if(push) history.push(worldId);
  setBreadcrumb();

  nodes = w.nodes.map(n => ({...n}));
  edges = (w.edges ?? []).map(e => ({...e}));
  byId  = new Map(nodes.map(n => [n.id, n]));

  // expón runtime para el panel
  window.__worldNodes = nodes;
  window.__worldById  = byId;
  if(window.refreshNavPanel) window.refreshNavPanel();

  applyDefaultSizing();
  buildChildrenIndex();
  assignOrbitsAndPhases();

  drawWorld();
  fitToWorld(450);
}

function enterWorld(worldId, fromNodeId){
  const n = byId.get(fromNodeId);
  if(!n){ loadWorld(worldId); return; }

  const targetScale = Math.min(5.0, Math.max(currentTransform.k, 2.7));
  const t = d3.zoomIdentity
    .translate(W/2, H/2)
    .scale(targetScale)
    .translate(-(n._x ?? 0), -(n._y ?? 0));

  svg.transition().duration(360).call(zoom.transform, t)
    .on("end", () => {
      history.push(worldId);
      loadWorld(worldId, { push:false });
    });
}

/* ---------- MiniMap ---------- */
const mini = { w: 280, h: 195, pad: 14, scale: 1, tx: 0, ty: 0 };
miniSvg.attr("viewBox", `0 0 ${mini.w} ${mini.h}`);

const miniG = miniSvg.append("g");
miniG.append("rect").attr("class","miniBg").attr("x",0).attr("y",0).attr("width", mini.w).attr("height", mini.h);
const miniEdgesG = miniG.append("g");
const miniNodesG = miniG.append("g");
const miniViewport = miniG.append("rect").attr("class","miniViewport").attr("x",30).attr("y",30).attr("width",60).attr("height",40);

function computeMiniTransform(){
  const b = getBounds();
  const bw = b.maxX - b.minX;
  const bh = b.maxY - b.minY;
  const aw = mini.w - mini.pad*2;
  const ah = mini.h - mini.pad*2;
  const s = Math.min(aw/(bw||1), ah/(bh||1));
  mini.scale = s;
  mini.tx = -b.minX*s + mini.pad;
  mini.ty = -b.minY*s + mini.pad;
}
function worldToMini(x,y){ return [x*mini.scale + mini.tx, y*mini.scale + mini.ty]; }
function miniToWorld(x,y){ return [(x-mini.tx)/mini.scale, (y-mini.ty)/mini.scale]; }

function updateMiniMap(){
  if(!showMini) return;
  computeMiniTransform();

  miniEdgesG.selectAll("*").remove();
  miniNodesG.selectAll("*").remove();

  for(const e of edges){
    const a = byId.get(e.s), b = byId.get(e.t);
    if(!a || !b) continue;
    const [ax,ay] = worldToMini(a._x ?? a.x ?? 0, a._y ?? a.y ?? 0);
    const [bx,by] = worldToMini(b._x ?? b.x ?? 0, b._y ?? b.y ?? 0);
    miniEdgesG.append("line").attr("class","miniEdge").attr("x1",ax).attr("y1",ay).attr("x2",bx).attr("y2",by);
  }

  for(const n of nodes){
    const [mx,my] = worldToMini(n._x ?? n.x ?? 0, n._y ?? n.y ?? 0);
    miniNodesG.append("circle").attr("class","miniNode").attr("cx",mx).attr("cy",my).attr("r", n.kind==="C" ? 3.6 : 2.7);
  }

  const k = currentTransform.k, tx = currentTransform.x, ty = currentTransform.y;
  const leftWorld = (0-tx)/k, topWorld = (0-ty)/k;
  const rightWorld = (W-tx)/k, bottomWorld = (H-ty)/k;

  const [lmx,lmy] = worldToMini(leftWorld, topWorld);
  const [rmx,rmy] = worldToMini(rightWorld, bottomWorld);

  miniViewport
    .attr("x", Math.min(lmx, rmx))
    .attr("y", Math.min(lmy, rmy))
    .attr("width", Math.abs(rmx - lmx))
    .attr("height", Math.abs(rmy - lmy));
}

function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }

const dragViewport = d3.drag().on("drag", (event) => {
  const nx = clamp(parseFloat(miniViewport.attr("x")) + event.dx, 0, mini.w);
  const ny = clamp(parseFloat(miniViewport.attr("y")) + event.dy, 0, mini.h);
  miniViewport.attr("x", nx).attr("y", ny);
  const cxm = nx + parseFloat(miniViewport.attr("width"))/2;
  const cym = ny + parseFloat(miniViewport.attr("height"))/2;
  panToMiniPoint(cxm, cym, 0);
});
miniViewport.call(dragViewport);

miniSvg.on("click", (event) => {
  const [x,y] = d3.pointer(event);
  panToMiniPoint(x, y, 250);
});

function panToMiniPoint(mx,my,duration=250){
  const [wx,wy] = miniToWorld(mx,my);
  const s = currentTransform.k;
  const t = d3.zoomIdentity.translate(W/2, H/2).scale(s).translate(-wx, -wy);
  if(duration <= 0) svg.call(zoom.transform, t);
  else svg.transition().duration(duration).call(zoom.transform, t);
}

/* ---------- Focus / Highlight ---------- */
function focusWorldPoint(x,y,targetK=1.8){
  if(!window.__d3Svg || !window.__d3Zoom) return;
  const { width, height } = window.__d3Svg.node().getBoundingClientRect();
  const cx = width/2, cy = height/2;

  const t = d3.zoomIdentity
    .translate(cx, cy)
    .scale(targetK)
    .translate(-x, -y);

  window.__d3Svg.transition().duration(650).call(window.__d3Zoom.transform, t);
}

function highlightNode(nodeId){
  if(!window.__nodesSelection) return;
  window.__nodesSelection.classed("is-highlight", d => d.id === nodeId);
}

/* ---------- UI ---------- */
btnBack.addEventListener("click", () => {
  if(history.length <= 1) return;
  history.pop();
  const prev = history[history.length-1];
  loadWorld(prev, { push:false });
});
btnHome.addEventListener("click", () => {
  history = ["main"];
  loadWorld("main", { push:false });
});
btnCenter.addEventListener("click", () => centerView(350));
btnFit.addEventListener("click", () => fitToWorld(450));

btnToggleLabels.addEventListener("click", () => {
  showLabels = !showLabels;
  btnToggleLabels.textContent = showLabels ? "Aa Etiquetas" : "Aa Etiquetas (off)";
  update();
});
btnToggleEdges.addEventListener("click", () => {
  showEdges = !showEdges;
  btnToggleEdges.textContent = showEdges ? "— Conexiones" : "— Conexiones (off)";
  update();
});
btnToggleMini.addEventListener("click", () => {
  showMini = !showMini;
  miniWrap.style.display = showMini ? "block" : "none";
  btnToggleMini.textContent = showMini ? "▣ Minimapa" : "▣ Minimapa (off)";
  update();
});

/* ---------- Autohide UI: 30s sin interacción ---------- */
const UI_IDLE_MS = 30000;
let uiIdleTimer = null;

function uiShow(){
  document.body.classList.remove("uiHidden");
  scheduleUiHide();
}
function scheduleUiHide(){
  if(uiIdleTimer) clearTimeout(uiIdleTimer);
  uiIdleTimer = setTimeout(() => {
    document.body.classList.add("uiHidden");
  }, UI_IDLE_MS);
}
["mousemove","mousedown","wheel","touchstart","touchmove","keydown"].forEach(evt => {
  window.addEventListener(evt, uiShow, { passive:true });
});
scheduleUiHide();

/* ---------- Animate ---------- */
let t0 = performance.now();
function tick(now){
  const t = (now - t0)/1000;
  computePositions(t);
  update();
  requestAnimationFrame(tick);
}

/* ---------- Init ---------- */
buildNavPanel();
loadWorld("main", { push:false });
setBreadcrumb();
requestAnimationFrame(tick);

window.addEventListener("resize", () => {
  W = window.innerWidth;
  H = window.innerHeight;
  drawStars();
  viewport.attr("transform", currentTransform);
  update();
});
