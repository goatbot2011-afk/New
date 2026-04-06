const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const ownerInfo = {
  name: "『𓋜』 ⚉ 𝗦𝗛𝗔𝗗𝗘 ⃢🩷 ✱ꪔ̤̱",
  facebook: "https://www.facebook.com/Chris.shade.2026",
  telegram: "𝐒𝐡𝐚𝐝𝐞 𝐂𝐡𝐚𝐧",
  supportGroup: "💞 𝑺𝒉𝒂𝒅𝒆 𝑮𝒂𝒏𝒈 💞"
};

module.exports = {
  config: {
    name: "botjoin",
    version: "2.0",
    author: "Saimx69x",
    category: "events"
  },

  onStart: async function ({ event, api, message }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const botID = api.getCurrentUserID();
    const addedUsers = logMessageData.addedParticipants;

    const isBotAdded = addedUsers.some(u => u.userFbId === botID);
    if (!isBotAdded) return;

    const nickNameBot = global.GoatBot.config.nickNameBot || "Sakura Bot";
    const prefix = global.utils.getPrefix(threadID);
    const BOT_UID = botID; 

    try {
      
      await api.changeNickname(nickNameBot, threadID, botID);
    } catch (err) {
      console.warn("⚠️ Nickname change failed:", err.message);
    }

    try {
      
      const API_ENDPOINT = "https://xsaim8x-xxx-api.onrender.com/api/botjoin"; 
      
      const apiUrl = `${API_ENDPOINT}?botuid=${BOT_UID}&prefix=${encodeURIComponent(prefix)}`;
      
      const tmpDir = path.join(__dirname, "..", "cache");
      await fs.ensureDir(tmpDir);
      const imagePath = path.join(tmpDir, `botjoin_image_${threadID}.png`);

      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(imagePath, response.data);

      const textMsg = [
        "『𓋜』 ⚉ 𝐌𝐞𝐫𝐜𝐢 𝐝𝐞 𝐦’𝐚𝐯𝐨𝐢𝐫 𝐚𝐣𝐨𝐮𝐭𝐞́ ⃢🩷 ✱ꪔ̤̱",
        `🔹 𝐁𝐨𝐭 𝐩𝐫𝐞𝐟𝐢𝐱: ${prefix}`,
        `🔸 𝐓𝐲𝐩𝐞: ${prefix}help 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐥𝐥 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬`,
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `👑 𝐎𝐰𝐧𝐞𝐫: ${ownerInfo.name}`,
        `🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: ${ownerInfo.facebook}`,
        `✈️ 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: ${ownerInfo.telegram}`,
        `🤖 𝐉𝐨𝐢𝐧 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐆𝐂: ${ownerInfo.supportGroup}`
      ].join("\n");


      await api.sendMessage({
        body: textMsg,
        attachment: fs.createReadStream(imagePath)
      }, threadID);

      fs.unlinkSync(imagePath);

    } catch (err) {
      console.error("⚠️ Error sending botjoin message:", err);
      
      const fallbackMsg = [
        "❌ 𝐈𝐦𝐚𝐠𝐞 𝐠𝐞𝐧𝐞𝐫𝐚𝐭𝐢𝐨𝐧 𝐟𝐚𝐢𝐥𝐞𝐝. 𝐇𝐞𝐫𝐞 𝐢𝐬 𝐭𝐡𝐞 𝐢𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧:",
        "『𓋜』 ⚉ 𝐌𝐞𝐫𝐜𝐢 𝐝𝐞 𝐦’𝐚𝐯𝐨𝐢𝐫 𝐚𝐣𝐨𝐮𝐭𝐞́ ⃢🩷 ✱ꪔ̤̱",
        `🔹 𝐁𝐨𝐭 𝐩𝐫𝐞𝐟𝐢𝐱: ${prefix}`,
        `🔸 𝐓𝐲𝐩𝐞: ${prefix}help 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐥𝐥 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬`,
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `👑 𝐎𝐰𝐧𝐞𝐫: ${ownerInfo.name}`,
        `🌐 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: ${ownerInfo.facebook}`,
        `✈️ 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: ${ownerInfo.telegram}`,
        `🤖 𝐉𝐨𝐢𝐧 𝐒𝐮𝐩𝐩𝐨𝐫𝐭 𝐆𝐂: ${ownerInfo.supportGroup}`
      ].join("\n");
      api.sendMessage(fallbackMsg, threadID);
    }
  }
};
