const container = document.getElementById('glass-container');
const canvas    = document.getElementById('glass-canvas');
const ctx       = canvas.getContext('2d');
const hint      = document.getElementById('hint');

let cracks = []; // Barcha sinishlarni saqlaydigan massiv
let W, H;        // Canvas kengligi va balandligi

/* ---- Canvas o'lchamini konteynerga moslashtirish ---- */
function resize() {
  W = canvas.width  = container.offsetWidth;
  H = canvas.height = container.offsetHeight;
  draw();
}

/* ---- Sichqoncha yoki touch pozitsiyasini olish ---- */
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

/* ---- Tasodifiy burchak qaytaradi (radianlar) ---- */
function randomAngle() {
  return Math.random() * Math.PI * 2;
}

/* ---- Bosish nuqtasida sinish ob'ektini yaratadi ---- */
function createCrack(cx, cy) {
  const numArms   = 7 + Math.floor(Math.random() * 7); // 7–13 ta qo'l
  const arms      = [];
  const baseAngle = randomAngle(); // Boshlang'ich burchak

  for (let i = 0; i < numArms; i++) {
    // Har bir qo'l uchun burchak hisoblash
    const angle = baseAngle + (i / numArms) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const len   = 110 + Math.random() * 220; // Qo'l uzunligi (katta ekran uchun)
    const segments = [];

    let x   = cx;
    let y   = cy;
    let dir = angle;
    const numSeg = 4 + Math.floor(Math.random() * 5); // Qo'ldagi bo'limlar soni

    for (let s = 0; s < numSeg; s++) {
      // Har bir bo'limda yo'nalish biroz buriladi
      dir += (Math.random() - 0.5) * 0.5;
      const segLen = (len / numSeg) * (0.6 + Math.random() * 0.8);
      const nx = x + Math.cos(dir) * segLen;
      const ny = y + Math.sin(dir) * segLen;

      segments.push({ x1: x, y1: y, x2: nx, y2: ny });

      // Tasodifiy tarmoq (shoxcha) qo'shish
      if (Math.random() < 0.45 && s > 0) {
        const bdir = dir + (Math.random() - 0.5) * 1.2;
        const blen = segLen * (0.4 + Math.random() * 0.5);
        segments.push({
          x1: nx, y1: ny,
          x2: nx + Math.cos(bdir) * blen,
          y2: ny + Math.sin(bdir) * blen,
          branch: true // Bu tarmoq ekanini belgilash
        });
      }

      x = nx;
      y = ny;
    }

    arms.push(segments);
  }

  // Markazdagi kichik uchburchak bo'laklar (shards)
  const shards = [];
  for (let i = 0; i < numArms; i++) {
    const a1 = baseAngle + (i / numArms) * Math.PI * 2;
    const a2 = baseAngle + ((i + 1) / numArms) * Math.PI * 2;
    const r  = 18 + Math.random() * 32;
    shards.push({ a1, a2, r });
  }

  return {
    cx, cy,
    arms,
    shards,
    opacity: 0,       // Animatsiya uchun boshlang'ich shaffoflik
    targetOpacity: 1  // Oxirgi shaffoflik
  };
}

/* ---- Barcha sinishlarni canvas'ga chizadi ---- */
function draw() {
  ctx.clearRect(0, 0, W, H);

  for (const crack of cracks) {
    if (crack.opacity < 0.01) continue;

    ctx.save();
    ctx.globalAlpha = crack.opacity;

    const { cx, cy, arms, shards } = crack;

    // Markazdagi shisha bo'laklarini chizish
    for (const sh of shards) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, sh.r, sh.a1, sh.a2);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth   = 0.7;
      ctx.stroke();
      ctx.fillStyle   = 'rgba(255,255,255,0.06)';
      ctx.fill();
    }

    // Sinish chiziqlarini chizish
    for (const arm of arms) {
      for (const seg of arm) {
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        // Asosiy chiziq va tarmoq uchun farqli rang
        ctx.strokeStyle = seg.branch
          ? 'rgba(255,255,255,0.45)'
          : 'rgba(255,255,255,0.85)';
        ctx.lineWidth   = seg.branch ? 0.6 : 1.1;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }
    }

    // Bosish nuqtasidagi oq nuqta
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();

    ctx.restore();
  }
}

/* ---- Har kadrda shaffoflikni oshirib animatsiya qiladi ---- */
function animate() {
  let needsUpdate = false;

  for (const crack of cracks) {
    if (crack.opacity < crack.targetOpacity) {
      crack.opacity  = Math.min(crack.opacity + 0.08, crack.targetOpacity);
      needsUpdate    = true;
    }
  }

  if (needsUpdate) draw();
  requestAnimationFrame(animate); // Keyingi kadrda qayta chaqiradi
}

/* ---- Bosish yoki siljitishda yangi sinish yaratadi ---- */
function addCrack(e) {
  e.preventDefault();
  const pos = getPos(e);
  cracks.push(createCrack(pos.x, pos.y));
  hint.style.display = 'none'; // Ko'rsatmani yashirish
}

// Hodisalarni tinglash
canvas.addEventListener('mousedown', addCrack);
canvas.addEventListener('mousemove', e => {
  if (e.buttons === 1) addCrack(e); // Faqat bosib siljitganda
});
canvas.addEventListener('touchstart', addCrack, { passive: false });
canvas.addEventListener('touchmove',  addCrack, { passive: false });

// "Clear Glass" tugmasini bosish — barcha sinishlarni o'chiradi
document.getElementById('clear-btn').addEventListener('click', () => {
  cracks             = [];
  hint.style.display = '';
  draw();
});

// Oyna o'lchami o'zgarganda canvas qayta sozlanadi
window.addEventListener('resize', resize);

// Ishga tushirish
resize();
animate();