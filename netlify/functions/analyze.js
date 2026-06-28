exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const trade = body.trade;

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

Analyze the trade and provide honest, educational feedback. Present options traders commonly use without prescribing a specific action. Use "some traders would...", "one approach is...", "traders often consider..." rather than "you should..." Never make a definitive directional price call. Be direct, specific, and educational. 2-3 sentences per field.

You MUST respond with ONLY a raw JSON object. No markdown. No backticks. No explanation. Just the JSON.
Example format:
{"execution":"text here","risk":"text here","psychology":"text here","one_thing":"text here"}`,
        messages: [{ role: 'user', content: `Analyze this trade: ${trade}` }]
      })
    });

    const data = await response.json();
    
    if (!data.content || !data.content[0]) {
      throw new Error('No content in response');
    }
    
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        execution: parsed.execution || '',
        risk: parsed.risk || '',
        psychology: parsed.psychology || '',
        one_thing: parsed.one_thing || ''
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        execution: '',
        risk: '',
        psychology: '',
        one_thing: '',
        error: error.message 
      })
    };
  }
};
