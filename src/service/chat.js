const axios = require('axios');
const { err } = require('../entities/err');
async function sGetChatInfo (ctx, { messages }) {
  try {
    const params = {
      prompt: 'How are you?',
      model: 'gpt-3.5-turbo',
      max_tokens: 10,
      temperature: 0,
    };
    let chatResult = await axios
      .post('https://api.openai.com/v1/chat/completions', {
        ...params,
        headers: {
          Authorization: 'Bearer 1111111',
          'Content-Type': 'application/json',
        },
      })
      .catch(console.error);
  } catch (error) {
    return err({ message: 'chat error' });
  }
}
module.exports = {
  sGetChatInfo,
};
