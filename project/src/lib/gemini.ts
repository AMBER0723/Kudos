import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY!)

export const enhanceComplimentWithAI = async (text: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
You are a strict AI moderator.
- Enhance the following message to make it more fluent, expressive, and natural sounding, while keeping its original tone and meaning. 
- Do not add unrelated content. Just make it smoother and more thoughtful.
- Only enhance messages that are clear, respectful .
- Do NOT rewrite or reword greetings (like "hi", "hello", or "hey"), short messages, or unclear text.
- Do not change informal or friendly compliments unless they are clearly inappropriate.
- Do NOT explain, justify, or provide polite alternatives.
- Do not respond with "INAPPROPRIATE_CONTENT" unless the message is abusive, hateful, or offensive.

${text}
Output:
`;

  const result = await model.generateContent(prompt);
  const output = result.response.text().trim();

  return output;
};

export const checkComplimentWithAI = async (text: string) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
You are a strict AI moderator.
- Do NOT rewrite or reword greetings (like "hi", "hello", or "hey"), short messages, or unclear text.
- Do not change informal or friendly compliments unless they are clearly inappropriate.
- Do NOT explain, justify, or provide polite alternatives.
- Do not respond with "INAPPROPRIATE_CONTENT" unless the message is abusive, hateful, or offensive.

${text}
Output:
`;

  const result = await model.generateContent(prompt);
  const output = result.response.text().trim();

  return output;
};