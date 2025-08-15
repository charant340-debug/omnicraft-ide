import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create system prompt
    const systemPrompt = `You are a code-focused AI assistant for IoT development, embedded systems, and full-stack web development. When users ask for code, prioritize providing working code with minimal explanation.

Context: ${context || 'IoT development project'}
Question: ${message}

INSTRUCTIONS:
- If asked for code, provide the code first and keep explanations brief
- Focus on practical, working solutions
- Use clear, well-commented code
- Only provide detailed explanations if specifically asked
- For code requests, format as: Code first, then 1-2 sentences of essential info only`;

    console.log('Calling Gemini with message:', message.substring(0, 50));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    );

    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Gemini error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Gemini response structure:', JSON.stringify(data, null, 2));

    // Try multiple ways to extract the text
    let aiResponse = null;

    // Method 1: Standard path
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      aiResponse = data.candidates[0].content.parts[0].text;
    }
    // Method 2: Alternative structure
    else if (data.candidates?.[0]?.output) {
      aiResponse = data.candidates[0].output;
    }
    // Method 3: Direct text field
    else if (data.text) {
      aiResponse = data.text;
    }
    // Method 4: Look for any text in the response
    else {
      const textMatch = JSON.stringify(data).match(/"text":\s*"([^"]+)"/);
      if (textMatch) {
        aiResponse = textMatch[1];
      }
    }

    if (!aiResponse) {
      console.log('No text found in response:', JSON.stringify(data, null, 2));
      aiResponse = 'I received your message but had trouble generating a response. Please try again.';
    }

    console.log('Final AI response:', aiResponse.substring(0, 100));

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: `Error: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});