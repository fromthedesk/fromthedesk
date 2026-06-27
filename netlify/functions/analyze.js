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

Analyze the trade and give honest, direct feedback. No fluff. No cheerleading. Sound like a veteran trader talking to a junior — direct, specific, and plain. 2-3 sentences per field.

Return only valid JSON with exactly these fields: execution, risk, psychology, one_thing. No markdown, no extra text, no preamble.`,
        messages: [{ role: 'user', content: `Analyze this trade: ${trade}` }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. Try again.' })
    };
  }
};
