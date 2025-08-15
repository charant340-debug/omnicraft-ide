import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Function invoked, parsing request...');
    const { message, context } = await req.json();
    console.log('Request parsed:', { message: message?.substring(0, 100), context: context?.substring(0, 100) });

    if (!message) {
      console.log('No message provided');
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API key check:', openaiApiKey ? 'Found' : 'Missing');
    
    if (!openaiApiKey) {
      console.log('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const systemMessage = `You are an AI assistant specialized in IoT development, embedded systems, and full-stack web development. You help developers with:
    - Frontend development (React, TypeScript, CSS)
    - Backend development (Node.js, APIs, databases)
    - Embedded systems programming (Arduino, ESP32, sensors)
    - IoT protocols and connectivity
    - Code debugging and optimization
    - Best practices and architecture advice

    When providing code, wrap it in markdown code blocks. Keep responses concise but helpful.`;

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: `Context: ${context || 'Working on an IoT project'}\n\nQuestion: ${message}` }
    ];

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI response received, extracting content...');
    
    const aiResponse = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    console.log('AI response length:', aiResponse.length);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});