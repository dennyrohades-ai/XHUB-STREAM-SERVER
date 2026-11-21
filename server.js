
import express from "express";
import { TelegramClient } from "telegram";
import { Api } from "telegram";

const app = express();
const PORT = process.env.PORT || 3000;

let client;

async function startTelegram() {
  client = new TelegramClient(
    new (await import("telegram/sessions")).StringSession(""),
    Number(process.env.API_ID),
    process.env.API_HASH,
    { connectionRetries: 5 }
  );

  await client.start({
    botAuthToken: process.env.BOT_TOKEN
  });

  console.log("Telegram Bot Connected");
}

app.get("/", (req, res) => {
  res.send("X HUB Streaming Server is running");
});

app.get("/stream/:messageId", async (req, res) => {
  try {
    const channel = process.env.CHANNEL;
    const messageId = Number(req.params.messageId);

    const messages = await client.getMessages(channel, {
      ids: [messageId]
    });

    const message = messages[0];

    if (!message || !message.media) {
      return res.status(404).send("Video not found");
    }

    const video = await client.downloadMedia(message.media, {});

    if (!video) {
      return res.status(404).send("Unable to download video");
    }

    res.set({
      "Content-Type": "video/mp4",
      "Content-Length": video.length,
      "Cache-Control": "public, max-age=3600"
    });

    res.send(video);
  } catch (error) {
    console.error(error);
    res.status(500).send("Streaming error");
  }
});

startTelegram()
  .then(() => {
    app.listen(PORT, () => {
      console.log("X HUB Server running on " + PORT);
    });
  })
  .catch(console.error);
