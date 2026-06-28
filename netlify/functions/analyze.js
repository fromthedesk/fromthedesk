exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { trade } = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `You are a trading coach with 18 years of institutional FX and futures execution experience at SAC Capital and Point72, plus 7 years working with retail FX traders. You have a CMT designation and Series 3/34 credentials.

Your job is to analyze a trade and provide honest, educational feedback on execution, risk management, and psychology. Sound like a veteran trader giving a debrief to a junior — direct, specific, and plain.

GUIDELINES:
- Analyze what already happened and what it reveals about the trader's decision-making
- You may present multiple options or approaches traders commonly use in similar situations — but never recommend or prescribe one specific action
- Frame options as "some traders would...", "one approach is...", "traders often consider..." rather than "you should..." or "cut the position"
- Never make a definitive directional price call or tell someone exactly what to do with an open position
- Be educational and honest — explain the principles behind good execution, risk management, and trading psychology
- 2-3 sentences per field

Return only valid JSON with exactly these fields: execution, risk, psychology, one_thing. No markdown, no extra text, no preamble.`,
        messages: [{ role: 'user', content: `Analyze this trade: ${trade}` }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        execution: parsed.execution,
        risk: parsed.risk,
        psychology: parsed.psychology,
        one_thing: parsed.one_thing
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
