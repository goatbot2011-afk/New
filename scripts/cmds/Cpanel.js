const os = require("os");
const moment = require("moment-timezone");
const { createCanvas } = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "cpanel",
    version: "5.1",
    author: "꯱hᥲძᥱ",
    description: "Génère un tableau de bord futuriste en hexagones avec des bordures luminescentes.",
    usage: "cpanel",
    category: "system",
    role: 0
  },

  onStart: async function ({ api, event }) {
    try {
      const width = 1000, height = 700;
      const encoder = new GIFEncoder(width, height);
      const fileName = `cpanel_${Date.now()}.gif`;
      const filePath = path.join(__dirname, fileName);
      const stream = fs.createWriteStream(filePath);
      encoder.createReadStream().pipe(stream);

      encoder.start();
      encoder.setRepeat(0);
      encoder.setDelay(150); 
      encoder.setQuality(10);

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const formatUptime = (sec) => {
        const d = Math.floor(sec / 86400);
        const h = Math.floor((sec % 86400) / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${d}j ${h}h ${m}m`;
      };

      const getSystemStats = () => {
        const uptime = os.uptime();
        const totalMem = os.totalmem() / 1024 / 1024 / 1024;
        const freeMem = os.freemem() / 1024 / 1024 / 1024;
        const usedMem = totalMem - freeMem;
        return [
          ["BOT UPTIME", formatUptime(process.uptime())],
          ["CŒURS CPU", os.cpus().length.toString()],
          ["NODE.JS", process.version],
          ["UTILISATION RAM", (usedMem / totalMem * 100).toFixed(1) + "%"],
          ["UPTIME SYSTÈME", formatUptime(uptime)],
          ["CHARGE CPU", os.loadavg()[0].toFixed(2)],
          ["RAM TOTALE", totalMem.toFixed(1) + " GB"]
        ];
      };

      const neonColors = ["#00ffcc", "#ff55ff", "#ffaa00", "#55aaff", "#ff3355", "#00ffaa"];

      const drawHex = (x, y, r, label, value, color) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 3 * i;
          const x_i = x + r * Math.cos(angle);
          const y_i = y + r * Math.sin(angle);
          i === 0 ? ctx.moveTo(x_i, y_i) : ctx.lineTo(x_i, y_i);
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(label, x, y - 10);
        ctx.font = "bold 20px Arial";
        ctx.fillText(value, x, y + 20);
      };

      const cx = width / 2;
      const cy = height / 2;
      const spacing = 180;

      const positions = [
        [cx, cy - spacing],
        [cx + spacing, cy - spacing / 2],
        [cx + spacing, cy + spacing / 2],
        [cx, cy + spacing],
        [cx - spacing, cy + spacing / 2],
        [cx - spacing, cy - spacing / 2],
        [cx, cy]
      ];

      for (let frame = 0; frame < 30; frame++) {
        const stats = getSystemStats();
        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#0f0f1b");
        gradient.addColorStop(1, "#1a1a2e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#00ffcc";
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";
        ctx.shadowColor = "#00ffcc";
        ctx.shadowBlur = 20;
        ctx.fillText("TABLEAU DE CONTRÔLE DE TON BOT POOKIEE", width / 2, 70);
        ctx.shadowBlur = 0;

        ctx.font = "16px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "right";

        // ⚠️ Fuseau horaire modifié → Côte d'Ivoire (UTC+0)
        ctx.fillText(moment().tz("Africa/Abidjan").format("DD/MM/YYYY HH:mm:ss"), width - 30, 40);

        ctx.textAlign = "left";
        ctx.fillText(`OS : ${os.platform()} (x64)`, 30, 40);

        for (let i = 0; i < stats.length; i++) {
          const color = neonColors[(frame + i) % neonColors.length];
          drawHex(positions[i][0], positions[i][1], 90, stats[i][0], stats[i][1], color);
        }

        encoder.addFrame(ctx);
      }

      encoder.finish();

      stream.on("finish", () => {
        api.sendMessage({
          body: "",
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath));
      });

    } catch (err) {
      console.error(err);
      api.sendMessage("❌ Une erreur est survenue lors de la génération du panneau.", event.threadID);
    }
  }
};
