export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      yourGender, 
      theirGender, 
      platform, 
      personality, 
      target, 
      appearance, 
      messageType, 
      context 
    } = req.body;

    // Build more natural prompt
    let prompt = `Generate a short, casual dating message (max 25 words) for ${platform}.

You are: ${yourGender} with ${personality} personality
Messaging: ${target} person who is ${theirGender}
${appearance ? `They have: ${appearance}` : ''}
Message type: ${messageType}
${context ? `Context: ${context}` : ''}

Requirements:
- Max 25 words
- Sound like a normal person texting
- No fancy words like "wanderer" or "fellow"
- Be ${personality} but natural
- Reference THEIR appearance if mentioned, not yours
- Keep it conversational and modern`;

    // Add personality-specific instructions
    if (personality === 'funny') {
      prompt += '\n- Be playful and humorous but not cheesy';
    } else if (personality === 'smooth') {
      prompt += '\n- Be confident but not over the top';
    } else if (personality === 'genuine') {
      prompt += '\n- Be sincere and authentic';
    } else if (['chaotic', 'unhinged', 'crackhead'].includes(personality)) {
      prompt += '\n- Be weird and unexpected but still charming';
    } else if (personality === 'alien') {
      prompt += '\n- Sound like you might be from another planet but trying to fit in';
    } else if (personality === 'serial_killer') {
      prompt += '\n- Be slightly ominous but clearly joking';
    } else if (personality === 'time_traveler') {
      prompt += '\n- Reference the future or past casually';
    }

    // Add gay mode instructions
    if (yourGender === theirGender) {
      prompt += '\n- Use appropriate same-gender dating language and slang';
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You generate short, casual dating messages. Sound like a real person texting, not a poet. Max 25 words. Be natural and conversational. Avoid flowery language.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 60,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    let message = data.choices[0].message.content.trim();
    
    // Remove quotes if AI adds them
    message = message.replace(/^["']|["']$/g, '');
    
    res.status(200).json({ 
      success: true, 
      message: message
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate message',
      details: error.message 
    });
  }
}
