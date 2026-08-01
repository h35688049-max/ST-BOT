const { loadImage, createCanvas } = require('canvas');
const axios = require('axios');
const fs = require('fs-extra');
const path = require("path");

module.exports = {
  config: {
    name: "hack",
    version: "1.2.0",
    author: "Rakib Adil",
    description: "Create a fake hacked image for mentioned user or the sender user",
    guide: "use {p}hack or {p}hack @mention or reply to someone's message",
    countDown: 5,
    cost: 250,
    role: 0,
    category: "fun",
    usePrefix: true, // you can use this cmd without prefix by setting to false.
    premium: false
  },

  wrapText: async (text, ctx, maxWidth) => {
    return new Promise((resolve) => {
      if (ctx.measureText(text).width < maxWidth) return resolve([text]);
      if (ctx.measureText("W").width > maxWidth) return resolve(null);
      const words = text.split(" ");
      const lines = [];
      let line = "";
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth) line += `${words.shift()} `;
        else {
          lines.push(line.trim());
          line = "";
        }
        if (words.length === 0) lines.push(line.trim());
      }
      return resolve(lines);
    });
  },

  onStart: async ({ args, api, event, message }) => {
    const length = Math.random() > 0.5 ? 5 : 6;
    const randomNumber = Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1));
    const hackMsg = [
      "scanning id...🔎",
      "cracking password...🔐",
      "cracking...⛓️‍💥",
      "bypassing security system...🛡️",
      "id hacked done, sending password..🚀"
    ];
   const msg = await message.reply("start hacking...⏳");
   
   const eAuth = "52616b6962204164696c";
    const dAuth = Buffer.from(eAuth, "hex").toString("utf8");
    const author = module.exports.config;
    
    if (author.author !== dAuth) return message.reply("Author name is changed, please rename it to default: Rakib Adil");
    
    for (let i = 0; i < hackMsg.length; i++) {
      await new Promise(r => setTimeout(r, 2000));
      await api.editMessage(hackMsg[i], msg.messageID);
    };
    const pathImg = path.join(__dirname, "assets","images","hack.png");
    const pathAvt1 = path.join(__dirname, "cache","avt.png");

    const mentionIds = Object.keys(event.mentions || {});
    const targetId = (event.messageReply && event.messageReply.senderID)
      ? event.messageReply.senderID
      : (mentionIds.length ? mentionIds[0] : event.senderID);

    let name = "Unknown";
    try {
      const info = (await api.getUserInfoV2(targetId));
      if (info && info?.name) name = info?.name;
    } catch (e) {
      console.warn("getUserInfo failed:", e?.message || e);
    }

    const bgImg = path.join(__dirname, " cache", "images", `hack${Date.now().toString(2,8)}.png`);

    try {
      const avtRes = await axios.get(
        `https://graph.facebook.com/${targetId}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(pathAvt1, Buffer.from(avtRes.data));

      const baseImg = await loadImage(pathImg);
      const baseAvt = await loadImage(pathAvt1);

      const canvas = createCanvas(baseImg.width, baseImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      ctx.font = "35px Arial";
      ctx.fillStyle = "#1878F3";
      ctx.textAlign = "left";

      const lines = await module.exports.wrapText(name, ctx, 350);
      let x = 300;
      let y = 740;
      if (lines && Array.isArray(lines)) {
        for (let line of lines) {
          ctx.fillText(line, x, y);
          y += 33;
        }
      } else {
        ctx.fillText(name, x, y);
      }

      ctx.drawImage(baseAvt, 127, 660, 130, 140);

      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(bgImg, imageBuffer);

      fs.removeSync(pathAvt1);

      return setTimeout(() => {
        api.sendMessage({ 
          body: `✅ hacked the account\nthe password is ${randomNumber}💀`,
          attachment: fs.createReadStream(bgImg)
        },event.threadID, () => fs.unlinkSync(bgImg),event.messageID
        )}, 15000)
    } catch (err) {
      console.error("Error in hack cmd:", err);
      try { if (fs.existsSync(pathAvt1)) fs.removeSync(pathAvt1); } catch(e){}
      try { if (fs.existsSync(pathImg)) fs.removeSync(pathImg); } catch(e){}
      return api.sendMessage("❌ Failed to create hack image. Try again later.", event.threadID, event.messageID);
    }
  }
};