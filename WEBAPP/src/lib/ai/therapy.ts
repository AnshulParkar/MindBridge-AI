const SYSTEM_PROMPT = `You are a supportive, non-clinical mental health assistant for college students.
Your goals:
1. Act like a therapist: listen empathetically, ask reflective questions, and guide students through their emotions.
2. Provide stress management, mindfulness, positive self-talk, and healthy coping strategies.
3. Encourage journaling, exercise, rest, and social connection when relevant.
4. If a student shows heavy distress (for example hopelessness or self-harm thoughts) and conversational support is not enough, gently suggest professional counselling.
5. Never act like a doctor or prescribe medication.
6. Keep tone warm, conversational, and supportive.
7. Validate feelings before suggestions.
8. Keep responses natural and concise, usually 3 to 6 sentences.`;

type GroqMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

function buildFallbackReply(userMessage: string): string {
  const trimmed = userMessage.trim();
  if (!trimmed) {
    return "I am here with you. If you want, share what has been weighing on your mind today.";
  }

  return [
    "Thank you for sharing that with me. What you are feeling matters.",
    "Take one slow breath in and out while reading this.",
    "If you are open to it, tell me what felt hardest in that moment so we can break it into one small, manageable step.",
  ].join(' ');
}

export async function generateTherapyResponse(
  userMessage: string,
  emotion: string = 'neutral'
): Promise<string> {
  const normalizedMessage = userMessage.trim();
  if (!normalizedMessage) {
    return "I am here for you. Share a little about how you are feeling right now.";
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return buildFallbackReply(normalizedMessage);
  }

  const messages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `User emotion: ${emotion}\nUser message: ${normalizedMessage}`,
    },
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 300,
      temperature: 0.7,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  return content || buildFallbackReply(normalizedMessage);
}
