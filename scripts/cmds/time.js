const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "time",
    version: "1.0",
    author: "꯱hᥲძᥱ",
    role: 0,
    countDown: 3,
    shortDescription: "Récupère une carte de temps stylée depuis l'API",
    category: "tools",
    guide: "/time - Obtenir la carte du temps néon actuelle"
  },

  onStart: async ({ message }) => {
    try {
      const wait = await message.reply("⚡ Récupération de la carte du temps...");

      const apiUrl = "https://xsaim8x-xxx-api.onrender.com/api/time";
      const response = await axios.get(apiUrl, { responseType: "stream" });

      const tmpDir = path.join(__dirname, "cache");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      const filePath = path.join(tmpDir, `time_card_${Date.now()}.png`);
      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      await message.unsend(wait.messageID);
      return message.reply({ attachment: fs.createReadStream(filePath) });

    } catch (err) {
      console.error("Erreur commande time:", err.message);
      return message.reply("❌ Échec de la récupération de la carte du temps.");
    }
  }
};
