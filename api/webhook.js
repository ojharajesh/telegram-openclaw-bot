const fetch = require('node-fetch');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY;
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN;

async function sendToOpenClaw(message) {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY}/sessions/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`
      },
      body: JSON.stringify({
        sessionKey: 'agent:main:main',
        message: message,
        timeoutSeconds: 30
      })
    });

    if (!response.ok) {
      throw new Error(`OpenClaw error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || 'No response';
  } catch (error) {
    console.error('OpenClaw error:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

async function sendTelegramMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Telegram error:', error);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true });
  }

  try {
    const { message } = req.body;
    
    if (!message || !message.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const userMessage = message.text;

    await sendTelegramMessage(chatId, '🤔 Thinking...');

    const response = await sendToOpenClaw(userMessage);

    await sendTelegramMessage(chatId, response);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(200).json({ ok: true });
  }
};
