const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "premium",
    version: "2.2",
    author: "꯱hᥲძᥱ",
    countDown: 5,
    role: 2,
    description: {
      en: "Ajouter, retirer, vérifier ou lister les utilisateurs premium",
      bn: "কোনো ইউজারকে premium এ add/remove/check বা list করো"
    },
    category: "owner",
    guide: {
      en: "{pn} add <userID | @mention | reply>\n{pn} remove <userID | @mention | reply>\n{pn} check <userID | @mention | reply>\n{pn} list [page]",
      bn: "{pn} add <userID | @mention | reply>\n{pn} remove <userID | @mention | reply}\n{pn} check <userID | @mention | reply>\n{pn} list [page]"
    }
  },

  onStart: async function({ message, args, event, usersData }) {
    if (!args[0]) return message.SyntaxError();

    let type = args[0].toLowerCase(); 
    let targetID;

    // === Liste Premium avec canvas stylisé ===
    if (type === "list") {
      const page = parseInt(args[1]) || 1;
      const perPage = 10;

      const allUsers = await usersData.getAll();
      const premiumUsers = allUsers.filter(u => u?.data?.premium === true);

      if (premiumUsers.length === 0)
        return message.reply("⚠️ Aucun utilisateur premium trouvé.");

      const totalPages = Math.ceil(premiumUsers.length / perPage);
      if (page > totalPages) return message.reply(`⚠️ La page ${page} n’existe pas. Pages totales : ${totalPages}`);

      const start = (page - 1) * perPage;
      const usersPage = premiumUsers.slice(start, start + perPage);

      const width = 1000;
      const height = 180 + usersPage.length * 70;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // === Fond dégradé ===
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "#1e1e3f");
      bgGradient.addColorStop(1, "#5c00ff");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // === Titre ===
      ctx.font = "bold 48px Poppins";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFD700";
      ctx.shadowColor = "#FF00FF";
      ctx.shadowBlur = 20;
      ctx.fillText(`⭐ Utilisateurs Premium (Page ${page}/${totalPages}) ⭐`, width / 2, 80);

      // === Cartes des utilisateurs ===
      const startY = 140;
      usersPage.forEach((u, i) => {
        const y = startY + i * 70;

        const cardWidth = width - 100;
        const cardHeight = 60;
        const cardX = 50;
        const cardY = y;
        const radius = 15;

        const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
        cardGradient.addColorStop(0, "#ff7f50");
        cardGradient.addColorStop(1, "#ff1493");

        ctx.fillStyle = cardGradient;
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 10;

        roundRect(ctx, cardX, cardY, cardWidth, cardHeight, radius).fill();

        const paddingLeft = 30;
        const paddingRight = 30;

        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 5;

        const index = start + i + 1;
        const nameText = `${index}. ${u.name || "Inconnu"} ⭐`;
        ctx.textAlign = "left";
        ctx.fillText(nameText, cardX + paddingLeft, cardY + 40);

        ctx.font = "20px Arial";
        ctx.fillStyle = "#eee";
        ctx.textAlign = "right";
        ctx.fillText(`(${u.userID})`, cardX + cardWidth - paddingRight, cardY + 40);
      });

      const filePath = path.join(__dirname, `premium_list_page${page}.png`);
      fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

      return message.reply({
        body: `🌈 Liste des utilisateurs premium (Page ${page}/${totalPages}) 🌈`,
        attachment: fs.createReadStream(filePath)
      });
    }

    // === Ajouter / Retirer / Vérifier ===
    if (Object.keys(event.mentions).length > 0) targetID = Object.keys(event.mentions)[0];
    else if (event.messageReply) targetID = event.messageReply.senderID;
    else targetID = args[1];

    if (!targetID)
      return message.reply("⚠️ Veuillez fournir un userID, mentionner quelqu’un ou répondre à son message.");

    let userData = await usersData.get(targetID) || {};
    userData.name = userData.name || targetID;
    userData.data = userData.data || {};

    if (type === "add") {
      userData.data.premium = true;
      await usersData.set(targetID, userData);
      return message.reply(`✅ ${userData.name} est maintenant un utilisateur premium !`);
    }

    if (type === "remove") {
      userData.data.premium = false;
      await usersData.set(targetID, userData);
      return message.reply(`❌ ${userData.name} n’est plus un utilisateur premium.`);
    }

    if (type === "check") {
      if (userData.data.premium) return message.reply(`⭐ ${userData.name} est un utilisateur premium.`);
      else return message.reply(`⚠️ ${userData.name} n’est pas premium.`);
    }

    return message.SyntaxError();
  }
};

// Fonction helper pour rectangle arrondi
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
