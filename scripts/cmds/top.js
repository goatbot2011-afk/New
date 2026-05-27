const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

const deltaNext = 5;

// ===================== LEVEL SYSTEM =====================
function expToLevel(exp) {
  return Math.floor((1 + Math.sqrt(1 + 8 * exp / deltaNext)) / 2);
}

// ===================== FORMAT MONEY =====================
function formatMoney(value) {
  if (value >= 1e15) return (value / 1e15).toFixed(2) + " Qt";
  if (value >= 1e12) return (value / 1e12).toFixed(2) + " T";
  if (value >= 1e9) return (value / 1e9).toFixed(2) + " B";
  if (value >= 1e6) return (value / 1e6).toFixed(2) + " M";
  if (value >= 1e3) return (value / 1e3).toFixed(2) + " k";
  return value.toString();
}

// ===================== WALLPAPER PERSISTENCE =====================
const WALL_FILE = path.join(__dirname, "cache", "wallpaper.json");

function saveWallpaper(filePath) {
  fs.writeFileSync(WALL_FILE, JSON.stringify({ path: filePath }));
}

function loadWallpaper() {
  if (!fs.existsSync(WALL_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(WALL_FILE)).path;
  } catch {
    return null;
  }
}

// ===================== AVATAR CACHE =====================
const avatarCache = new Map();

async function fetchAvatarSafe(userID, usersData) {
  if (avatarCache.has(userID)) return avatarCache.get(userID);

  try {
    let avatarURL = await usersData.getAvatarUrl(userID);

    if (!avatarURL) {
      avatarURL = `https://graph.facebook.com/${userID}/picture?type=large&width=500&height=500`;
    }

    avatarURL += avatarURL.includes("?") ? "&" : "?";
    avatarURL += `t=${Date.now()}`;

    const res = await axios.get(avatarURL, {
      responseType: "arraybuffer",
      timeout: 10000
    });

    const img = await loadImage(Buffer.from(res.data));
    avatarCache.set(userID, img);
    return img;

  } catch {
    const size = 100;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#2c2f4a";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "#fff";
    ctx.font = `bold ${size / 2}px Sans`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText((userID || "?").charAt(0).toUpperCase(), size / 2, size / 2);

    avatarCache.set(userID, canvas);
    return canvas;
  }
}

// ===================== ROUND RECT =====================
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  return ctx;
}

// ===================== DRAW BOARD =====================
async function drawTopBoard(users, type, usersData) {
  const W = 1200, H = 1000;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const wallpaper = loadWallpaper();

  // BACKGROUND
  if (wallpaper && fs.existsSync(wallpaper)) {
    const bg = await loadImage(wallpaper);
    ctx.drawImage(bg, 0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#1e1e3f");
    grad.addColorStop(1, "#5c00ff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // TITLE
  ctx.font = "bold 56px Sans";
  ctx.fillStyle = "#00ffee";
  ctx.textAlign = "center";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 25;

  ctx.fillText(
    type === "rank" ? "🏆 Top 10 Classement" : "💰 Top 10 Argent",
    W / 2,
    80
  );

  ctx.shadowBlur = 0;

  // TOP 3
  const positions = [
    { i: 0, x: W / 2 - 85, y: 140, size: 180, rank: "🥇" },
    { i: 1, x: W / 2 - 280, y: 220, size: 140, rank: "🥈" },
    { i: 2, x: W / 2 + 150, y: 220, size: 140, rank: "🥉" },
  ];

  for (const pos of positions) {
    const u = users[pos.i];
    if (!u) continue;

    const avatar = await fetchAvatarSafe(u.userID, usersData);

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      pos.x + pos.size / 2,
      pos.y + pos.size / 2,
      pos.size / 2 + 15,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 6;
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      pos.x + pos.size / 2,
      pos.y + pos.size / 2,
      pos.size / 2,
      0,
      Math.PI * 2
    );
    ctx.clip();
    ctx.drawImage(avatar, pos.x, pos.y, pos.size, pos.size);
    ctx.restore();

    ctx.font = "28px Sans";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(u.name || "Inconnu", pos.x + pos.size / 2, pos.y + pos.size + 40);

    const value =
      type === "rank"
        ? `Nv ${expToLevel(Number(u.totalExp || 0))}`
        : `${formatMoney(Number(u.money || 0))} 💵`;

    ctx.fillStyle = "#ff99ff";
    ctx.fillText(value, pos.x + pos.size / 2, pos.y + pos.size + 100);

    ctx.fillStyle = "#FFD700";
    ctx.fillText(pos.rank, pos.x + pos.size / 2, pos.y + pos.size + 70);
  }

  // LIST 4-10
  ctx.font = "26px Sans";

  const startY = 500;
  const rowH = 60;

  for (let i = 3; i < users.length; i++) {
    const u = users[i];
    const y = startY + (i - 3) * rowH;

    ctx.fillStyle = "rgba(0,0,0,0.3)";
    roundRect(ctx, 50, y - 30, W - 100, rowH - 10, 12).fill();

    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText(`#${i + 1}`, 60, y + 10);

    const avatar = await fetchAvatarSafe(u.userID, usersData);

    ctx.save();
    ctx.beginPath();
    ctx.arc(130 + 25, y - 15 + 25, 25, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 130, y - 15, 50, 50);
    ctx.restore();

    ctx.fillStyle = "#00ffee";
    ctx.fillText(u.name || "Inconnu", 200, y + 10);

    ctx.fillStyle = "#ff99ff";
    ctx.textAlign = "right";

    const value =
      type === "rank"
        ? `Nv ${expToLevel(Number(u.totalExp || 0))} (${u.totalExp || 0})`
        : `${formatMoney(Number(u.money || 0))} 💵`;

    ctx.fillText(value, W - 80, y + 10);
  }

  // FOOTER
  ctx.font = "20px Sans";
  ctx.fillStyle = "#ccc";
  ctx.textAlign = "center";

  ctx.fillText(
    `🕓 Mis à jour: ${moment().tz("Africa/Abidjan").format("YYYY-MM-DD HH:mm")}`,
    W / 2,
    H - 30
  );

  const fileName = `top_${type}_${Date.now()}.png`;
  const filePath = path.join(__dirname, "cache", fileName);

  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
  return filePath;
}

// ===================== MODULE EXPORT =====================
module.exports = {
  config: {
    name: "top",
    version: "4.0",
    author: "B.michel",
    countDown: 10,
    role: 0,
    shortDescription: "Top 10 rank/money with wallpaper",
    category: "rank",
    guide: "{pn} rank | money | setwall"
  },

  onStart: async function ({ api, event, args, usersData, message }) {
    try {
      // SET WALLPAPER
      if (args[0]?.toLowerCase() === "setwall") {
        const reply = event.messageReply;

        if (!reply?.attachments?.length) {
          return message.reply("❌ Réponds à une image.");
        }

        const url = reply.attachments[0].url;

        const cacheDir = path.join(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

        const file = path.join(cacheDir, `wallpaper_${event.senderID}.jpg`);

        const res = await axios.get(url, { responseType: "arraybuffer" });

        fs.writeFileSync(file, res.data);
        saveWallpaper(file);

        return message.reply("✅ Wallpaper défini !");
      }

      const type = args[0]?.toLowerCase();

      if (!["rank", "money"].includes(type)) {
        return message.reply("⚠️ Utilisation: /top rank ou /top money");
      }

      const allUsers = await usersData.getAll();

      let sorted;

      if (type === "rank") {
        sorted = allUsers
          .map(u => ({
            ...u,
            totalExp: Number(u.exp ?? u.totalExp ?? 0)
          }))
          .sort((a, b) => b.totalExp - a.totalExp)
          .slice(0, 10);
      } else {
        sorted = allUsers
          .map(u => ({
            ...u,
            money: Number(u.money ?? 0)
          }))
          .sort((a, b) => b.money - a.money)
          .slice(0, 10);
      }

      const filePath = await drawTopBoard(sorted, type, usersData);

      let body = `📊 Top 10 ${type === "rank" ? "Classement" : "Argent"}\n\n`;

      sorted.forEach((u, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
        const value =
          type === "rank"
            ? `Nv ${expToLevel(Number(u.totalExp || 0))} (${u.totalExp || 0})`
            : `${formatMoney(Number(u.money || 0))} 💵`;

        body += `${medal} ${u.name || "Inconnu"} — ${value}\n`;
      });

      message.reply({
        body,
        attachment: fs.createReadStream(filePath)
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Erreur lors de la génération du top.");
    }
  }
};
