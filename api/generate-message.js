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

    // Build the AI prompt
    let prompt = `Generate a ${personality} dating message for ${platform}.

Context:
- Your gender: ${yourGender}
- Their gender: ${theirGender}  
- Their type: ${target}
- Their appearance: ${appearance || 'not specified'}
- Message type: ${messageType}
- Additional context: ${context || 'none'}

Generate a ${personality} style message that's appropriate for ${platform}. 
Keep it under 100 words, no emojis, and make it sound natural and engaging.`;

    // Add special instructions for unhinged modes
    if (['chaotic', 'unhinged', 'crackhead', 'alien', 'serial_killer', 'time_traveler'].includes(personality)) {
      prompt += '\nMake it boldly unconventional but still charming and funny.';
    }

    // Add gay mode instructions
    if (yourGender === theirGender) {
      prompt += '\nAdjust tone for same-gender interaction with appropriate slang.';
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
            content: 'You are a dating message expert. Generate creative, engaging messages based on personality and context. Keep messages under 100 words and emoji-free. Be bold and creative, especially for unhinged modes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    const message = data.choices[0].message.content.trim();
    
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
