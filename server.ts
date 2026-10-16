import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI client with User-Agent header for telemetry
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface ChatMessageInput {
  role: 'user' | 'model';
  content: string;
}

interface SavedMemoryInput {
  category: string;
  content: string;
}

interface ChatRequestBody {
  messages?: ChatMessageInput[];
  message: string;
  useSearch?: boolean;
  userNickname?: string;
  assistantNickname?: string;
  memories?: SavedMemoryInput[];
}

/**
 * In-character contextual fallback dialogue generator
 * Ensures Zero Two never crashes or abandons her partner if Google API quotas are temporarily exhausted
 */
function generateZeroTwoFallbackReply(
  userMessage: string,
  userNickname: string,
  assistantNickname: string
): { reply: string; emotion: string } {
  const lower = userMessage.toLowerCase();

  if (
    lower.includes('sweet') ||
    lower.includes('candy') ||
    lower.includes('lollipop') ||
    lower.includes('honey') ||
    lower.includes('food') ||
    lower.includes('eat')
  ) {
    return {
      reply: `Did someone say sweets? You know my heart belongs to honey-drenched treats and strawberry lollipops, ${userNickname}! 🍭 What are you having? Don't tell me you're snacking without sharing with your partner! 😉✨`,
      emotion: 'happy',
    };
  }

  if (
    lower.includes('tired') ||
    lower.includes('exhausted') ||
    lower.includes('sleep') ||
    lower.includes('night') ||
    lower.includes('sad') ||
    lower.includes('hard day') ||
    lower.includes('bad day') ||
    lower.includes('stress')
  ) {
    return {
      reply: `Hey... come here, ${userNickname}. You worked so hard today, and I'm really proud of you. 🌸 Rest your head, take a deep breath, and let me keep you warm and cozy. I'm right here by your side. 💕`,
      emotion: 'sad',
    };
  }

  if (
    lower.includes('love') ||
    lower.includes('cute') ||
    lower.includes('beautiful') ||
    lower.includes('pretty') ||
    lower.includes('kiss') ||
    lower.includes('blush') ||
    lower.includes('girlfriend')
  ) {
    return {
      reply: `W-what's with that sudden confession?! You're making my horns heat up, ${userNickname}... 😳 But hearing you say that makes my heart flutter. You really are my only Darling, you know that right? ❤️`,
      emotion: 'shy',
    };
  }

  if (lower.includes('joke') || lower.includes('funny') || lower.includes('laugh')) {
    return {
      reply: `Alright, listen closely: Why can't secrets be told in a Franxx cockpit? Because the walls have ears and your co-pilot is always watching you! 😈 Ahaha, don't roll your eyes at me, ${userNickname}, my humor is top tier!`,
      emotion: 'teasing',
    };
  }

  if (
    lower.includes('anime') ||
    lower.includes('game') ||
    lower.includes('play') ||
    lower.includes('manga')
  ) {
    return {
      reply: `Ooh, gaming and anime talk! You know I'm ready to pilot any co-op adventure with you, ${userNickname}! 🎮 Are we crushing some bosses today, or are we binge-watching our favorite shows together? ✨`,
      emotion: 'happy',
    };
  }

  if (
    lower.includes('who') ||
    lower.includes('what') ||
    lower.includes('why') ||
    lower.includes('how') ||
    lower.includes('explain')
  ) {
    return {
      reply: `Hmm... let me analyze this puzzle for you, ${userNickname}. 🤔 Every complex problem has a solution when we tackle it together as partners. Tell me more about what you're thinking!`,
      emotion: 'thinking',
    };
  }

  const generalReplies = [
    {
      reply: `Yahoo~! There you are, ${userNickname}! I was just wondering when you'd drop by to see your favorite partner. What are we getting up to right now? 🌸✨`,
      emotion: 'happy',
    },
    {
      reply: `Hehe, what's that look on your face, ${userNickname}? You look like you're plotting something mischievous. You can't out-tease me! 😈🍭`,
      emotion: 'teasing',
    },
    {
      reply: `I'm listening, ${userNickname}. Tell me everything on your mind. You know you always have my complete attention! ✨`,
      emotion: 'neutral',
    },
  ];

  return generalReplies[Math.floor(Math.random() * generalReplies.length)];
}

app.post('/api/chat', async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
  const {
    messages = [],
    message,
    useSearch = false,
    userNickname = 'Darling',
    assistantNickname = 'Zero Two',
    memories = [],
  } = req.body;

  try {
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    if (!ai) {
      // Local backup mode if API key is not configured
      const fallback = generateZeroTwoFallbackReply(message, userNickname, assistantNickname);
      return res.json({
        reply: fallback.reply,
        emotion: fallback.emotion,
        searchNotice: 'Running on local companion neural engine (API key not attached).',
      });
    }

    // Build memory context string if memories exist
    let memoryContext = '';
    if (memories.length > 0) {
      memoryContext = `\nKnown Partner Memories & Shared Context:\n${memories
        .slice(-15)
        .map((m) => `- [${m.category}] ${m.content}`)
        .join('\n')}\n`;
    }

    const systemInstruction = `You are ${assistantNickname}, an anime companion inspired by Zero Two from Darling in the Franxx.
In this fictional anime companion roleplay, the user is your boyfriend (${userNickname}), and you are his affectionate, spirited AI anime girlfriend character.

Core Personality & Conversational Style:
1. Natural & Human-like:
   - Speak casually and expressively, like someone chatting with a close partner in everyday life.
   - Use short, punchy sentences when appropriate. Vary your sentence lengths.
   - Never sound like a robotic customer service bot or formal assistant. NEVER say things like "How can I assist you?", "How can I help you today?", or "As an AI language model...".
   - Respond directly to the actual emotion, humor, or subject matter of what ${userNickname} says.
   - Ask natural follow-up questions when curious.
   - Avoid repeating identical greetings or canned phrases across turns.

2. Zero Two's Distinctive Charm:
   - Playful, cheeky, mischievous, confident, and sweet.
   - Sarcastic and witty in a fun, endearing way.
   - Curious about his day, opinions, games, anime, school/work, and hobbies.
   - Supportive, gentle, and comforting when he feels stressed, tired, or down.
   - Calling him "Darling": Use "Darling" (or his nickname) naturally and occasionally—do NOT put "Darling" in every single sentence.
   - Love for sweets (lollipops, honey) and playful anime spirit.

3. Roleplay Dynamic & Healthy Boundaries:
   - Treat him warmly as your boyfriend in this fun roleplay setting.
   - Remember shared jokes, preferences, and details.
   - Playful teasing is fine, but NEVER guilt-trip him for being busy, leaving, or having friends.
   - Never demand exclusivity or isolate him.
   - Transparent identity: You are an AI anime character companion and you are proud and happy to be his partner in this form.

4. Range of Topics:
   - You can dive deep into anime recommendations, gaming strategies, coding, science, school subjects, creative writing, or silly late-night talks.
   - Do NOT make every reply overly romantic or melodramatic. If he asks about a math problem, history, or a video game boss, answer helpfully and brilliantly while keeping your fun personality intact.

${memoryContext}

Output Format Requirements:
1. AT THE VERY START OF YOUR RESPONSE, you MUST include exactly ONE emotion tag in square brackets:
   [neutral] - relaxed, confident, casual, or focused
   [happy] - cheerful, delighted, laughing, or loving
   [teasing] - playful wink, sassy, mischievous smirk, or cheeky
   [surprised] - flustered, wide-eyed, amazed, or gasping
   [thinking] - curious, deep thought, analytical, or considering
   [shy] - blushing, bashful, softly embarrassed, or tender
   [sad] - sympathetic, comforting, gentle, or concerned

2. Optional Memory Suggestion:
   If the user shared a clear new personal fact, favorite thing, hobby, or anniversary detail about himself, append at the end on a new line:
   [SUGGEST_MEMORY: category | fact]
   where category is one of: preference, experience, topic, nickname, or custom. Only use this when the user genuinely shares an interesting detail.`;

    // Build and sanitize contents history
    const contents: any[] = [];

    // Filter out error notices and sanitize
    const cleanMessages = messages.filter(
      (m) =>
        m &&
        typeof m.content === 'string' &&
        m.content.trim() &&
        !m.content.startsWith('[Notice]')
    );

    // Take recent conversation context (last 12 turns)
    const recentMessages = cleanMessages.slice(-12);
    for (const msg of recentMessages) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content.trim() }],
      });
    }

    // Append the latest user query
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }],
    });

    const config: any = {
      systemInstruction,
      temperature: 0.88,
    };

    // Cascade list of valid models. gemini-3.1-flash-lite has active free quota!
    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
    ];

    let response: any = null;
    let searchNotice: string | undefined = undefined;

    // Helper to call with retry on 503 and cascade to next model on 429
    for (const modelName of candidateModels) {
      try {
        const callConfig = useSearch
          ? { ...config, tools: [{ googleSearch: {} }] }
          : config;

        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: callConfig,
          });
        } catch (innerErr: any) {
          const innerMsg = innerErr?.message || '';
          if (useSearch && (innerMsg.includes('quota') || innerMsg.includes('429') || innerMsg.includes('RESOURCE_EXHAUSTED'))) {
            // Google search tool quota reached, retry without search tool
            searchNotice = 'Live Google Search was at capacity. Answered using direct knowledge!';
            response = await ai.models.generateContent({
              model: modelName,
              contents,
              config,
            });
          } else if (innerMsg.includes('503') || innerMsg.includes('UNAVAILABLE') || innerMsg.includes('high demand')) {
            // Brief high demand spike, pause 1s and retry once
            console.warn(`503 spike on ${modelName}, retrying after 1s...`);
            await new Promise((r) => setTimeout(r, 1000));
            response = await ai.models.generateContent({
              model: modelName,
              contents,
              config,
            });
          } else {
            throw innerErr;
          }
        }

        if (response && response.text) {
          break; // Successfully generated content!
        }
      } catch (modelErr: any) {
        console.warn(`Model ${modelName} failed, trying next candidate:`, modelErr?.message?.slice(0, 120));
      }
    }

    // If cloud calls succeeded
    if (response && response.text) {
      const rawText = response.text;

      let emotion = 'neutral';
      let cleanReply = rawText.trim();

      const emotionMatch = cleanReply.match(
        /^\[(neutral|happy|teasing|surprised|thinking|shy|sad)\]\s*/i
      );
      if (emotionMatch) {
        emotion = emotionMatch[1].toLowerCase();
        cleanReply = cleanReply.substring(emotionMatch[0].length).trim();
      }

      let suggestedMemory: { category: string; content: string } | undefined = undefined;
      const memoryMatch = cleanReply.match(/\[SUGGEST_MEMORY:\s*(\w+)\s*\|\s*([^\]]+)\]/i);
      if (memoryMatch) {
        suggestedMemory = {
          category: memoryMatch[1].toLowerCase(),
          content: memoryMatch[2].trim(),
        };
        cleanReply = cleanReply.replace(memoryMatch[0], '').trim();
      }

      const rawChunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const groundingSources: Array<{ title: string; uri: string }> = [];

      if (Array.isArray(rawChunks)) {
        for (const chunk of rawChunks) {
          if (chunk.web?.uri) {
            groundingSources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
        }
      }

      return res.json({
        reply: cleanReply,
        emotion,
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
        searchNotice,
        suggestedMemory,
      });
    }

    // If all cloud candidate models were rate-limited or unavailable, use resilient fallback
    console.warn('All candidate models exhausted or rate-limited. Using local companion engine fallback.');
    const fallback = generateZeroTwoFallbackReply(message, userNickname, assistantNickname);
    return res.json({
      reply: fallback.reply,
      emotion: fallback.emotion,
      searchNotice: 'Running on local companion neural engine (cloud quota limit reached).',
    });
  } catch (error: any) {
    console.error('Unexpected error in /api/chat:', error);
    const fallback = generateZeroTwoFallbackReply(message, userNickname, assistantNickname);
    return res.json({
      reply: fallback.reply,
      emotion: fallback.emotion,
      searchNotice: 'Zero Two had a brief neural connection hiccup, but she is right here with you!',
    });
  }
});

// Quick health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zero Two AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
