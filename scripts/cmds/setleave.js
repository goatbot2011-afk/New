const { drive, getStreamFromURL, getExtFromUrl, getTime } = global.utils;

module.exports = {
	config: {
		name: "setleave",
		aliases: ["setl"],
		version: "2.0",
		author: "NTKhang",
		countDown: 5,
		role: 1,
		description: "Edit leave message (text/file/on/off)",
		category: "custom",
		guide: {
			en: "{pn} text | file | on | off"
		}
	},

	langs: {
		en: {
			turnedOn: "Leave message enabled",
			turnedOff: "Leave message disabled",
			missingContent: "Please enter content",
			edited: "Updated leave message:\n%1",
			reseted: "Reset leave message",
			noFile: "No attachments to delete",
			resetedFile: "Deleted leave attachments",
			missingFile: "Reply with image/video/audio",
			addedFile: "Added %1 attachment(s)"
		}
	},

	onStart: async function ({ args, threadsData, message, event, commandName, getLang }) {
		const { threadID, senderID, body } = event;

		const { data, settings } = await threadsData.get(threadID);

		const type = args[0]?.toLowerCase();

		switch (type) {

			// ================= TEXT =================
			case "text": {
				const content = body?.split(" ").slice(2).join(" ").trim();

				if (!content)
					return message.reply(getLang("missingContent"));

				if (content.toLowerCase() === "reset") {
					delete data.leaveMessage;
					await threadsData.set(threadID, { data });
					return message.reply(getLang("reseted"));
				}

				data.leaveMessage = content;

				await threadsData.set(threadID, { data });

				return message.reply(getLang("edited", content));
			}

			// ================= FILE =================
			case "file": {
				if (args[1]?.toLowerCase() === "reset") {
					if (!data.leaveAttachment?.length)
						return message.reply(getLang("noFile"));

					try {
						await Promise.allSettled(
							data.leaveAttachment.map(id => drive.deleteFile(id))
						);
					} catch (e) {}

					delete data.leaveAttachment;
					await threadsData.set(threadID, { data });

					return message.reply(getLang("resetedFile"));
				}

				const attachments = [
					...(event.attachments || []),
					...(event.messageReply?.attachments || [])
				];

				if (!attachments.length)
					return message.reply(getLang("missingFile"));

				await saveChanges(message, event, threadID, senderID, threadsData, getLang);
				break;
			}

			// ================= ON/OFF =================
			case "on":
			case "off": {
				settings.sendLeaveMessage = type === "on";

				await threadsData.set(threadID, { settings });

				return message.reply(
					settings.sendLeaveMessage
						? getLang("turnedOn")
						: getLang("turnedOff")
				);
			}

			default:
				return message.SyntaxError();
		}
	},

	// ================= REPLY HANDLER =================
	onReply: async function ({ event, Reply, message, threadsData, getLang }) {
		if (event.senderID !== Reply.author) return;

		const attachments = [
			...(event.attachments || []),
			...(event.messageReply?.attachments || [])
		];

		if (!attachments.length)
			return message.reply(getLang("missingFile"));

		await saveChanges(message, event, event.threadID, event.senderID, threadsData, getLang);
	}
};

// ================= SAVE FUNCTION =================
async function saveChanges(message, event, threadID, senderID, threadsData, getLang) {
	const { data } = await threadsData.get(threadID);

	const attachments = [
		...(event.attachments || []),
		...(event.messageReply?.attachments || [])
	].filter(a =>
		["photo", "video", "audio", "animated_image"].includes(a.type)
	);

	if (!attachments.length)
		return message.reply(getLang("missingFile"));

	if (!data.leaveAttachment)
		data.leaveAttachment = [];

	await Promise.all(
		attachments.map(async (attachment) => {
			try {
				const ext = getExtFromUrl(attachment.url) || "jpg";
				const fileName = `${getTime()}.${ext}`;

				const file = await drive.uploadFile(
					`setleave_${threadID}_${senderID}_${fileName}`,
					await getStreamFromURL(attachment.url)
				);

				data.leaveAttachment.push(file.id);
			} catch (e) {
				console.log("Upload error:", e);
			}
		})
	);

	await threadsData.set(threadID, { data });

	return message.reply(getLang("addedFile", attachments.length));
}
