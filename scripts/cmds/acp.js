const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ["acp"],
    version: "1.0",
    author: "꯱hᥲძᥱ",
    countDown: 8,
    role: 2,
    shortDescription: "gérer les demandes d'amis",
    longDescription: "Accepter ou refuser les demandes d'amis",
    category: "utility",
    guide: {
      en: "{pn} [add|del] [numéro|all]"
    }
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.trim().toLowerCase().split(/\s+/);

    clearTimeout(Reply.unsendTimeout);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    let actionType;
    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
      actionType = "Acceptée";
    } else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
      actionType = "Refusée";
    } else {
      return api.sendMessage("❌ Commande invalide. Utilisation : <add|del> <numéro|all>", event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);
    if (args[1] === "all") {
      targetIDs = Array.from({ length: listRequest.length }, (_, i) => i + 1);
    }

    const newTargetIDs = [];
    const promiseFriends = [];
    const success = [];
    const failed = [];

    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(`🚫 Impossible de trouver la demande #${stt}`);
        continue;
      }
      form.variables.input.friend_requester_id = user.node.id;
      form.variables = JSON.stringify(form.variables);
      newTargetIDs.push(user);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      form.variables = JSON.parse(form.variables);
    }

    const results = await Promise.allSettled(promiseFriends);

    results.forEach((result, index) => {
      const user = newTargetIDs[index];
      if (result.status === "fulfilled" && !JSON.parse(result.value).errors) {
        success.push(`✅ ${actionType} avec succès : ${user.node.name} (${user.node.id})`);
      } else {
        failed.push(`❌ Échec : ${user.node.name} (${user.node.id})`);
      }
    });

    let replyMsg = "";
    if (success.length > 0) replyMsg += success.join("\n") + "\n";
    if (failed.length > 0) replyMsg += failed.join("\n");

    if (replyMsg) api.sendMessage(replyMsg, event.threadID, event.messageID);
    else api.sendMessage("❌ Aucune demande valide n'a été traitée.", event.threadID);

    api.unsendMessage(messageID);
  },

  onStart: async function ({ event, api, commandName }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };

      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(response).data.viewer.friending_possibilities.edges;

      if (!listRequest || listRequest.length === 0) {
        return api.sendMessage("🌟 Vous n'avez aucune demande d'ami en attente !", event.threadID);
      }

      let msg = "╔═══》 𝐃𝐞𝐦𝐚𝐧𝐝𝐞𝐬 𝐝'𝐚𝐦𝐢𝐬 《 ═══╗\n\n";
      listRequest.forEach((user, index) => {
        msg += `💠  No. ${index + 1}\n`;
        msg += `👤 Nom: ${user.node.name}\n`;
        msg += `🆔 ID: ${user.node.id}\n`;
        msg += `🔗 Profil: ${user.node.url.replace("www.facebook", "fb")}\n`;
        msg += "━━━━━━━━━━━━━━━━\n";
      });

      msg += "\n💡 Répondez avec :\n";
      msg += "✅ add <numéro> — Accepter la demande\n";
      msg += "❌ del <numéro> — Refuser la demande\n";
      msg += "💫 add all — Tout accepter\n";
      msg += "🔥 del all — Tout refuser\n\n";
      msg += "⏳ Ce menu sera supprimé automatiquement dans 2 minutes.\n";
      msg += "╚═══════════════════╝";

      api.sendMessage(msg, event.threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          unsendTimeout: setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 2 * 60 * 1000)
        });
      }, event.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Une erreur est survenue lors de la récupération des demandes d'amis.", event.threadID);
    }
  }
};
