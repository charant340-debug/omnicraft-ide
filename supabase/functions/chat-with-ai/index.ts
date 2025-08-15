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
    console.log('🚀 Function started');
    
    const body = await req.text();
    console.log('📥 Raw request body:', body);
    
    const { message, context } = JSON.parse(body);
    console.log('✅ Parsed request - Message length:', message?.length, 'Context length:', context?.length);

    if (!message) {
      console.log('❌ No message provided');
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    console.log('🔑 API Key check:', geminiApiKey ? `Found (${geminiApiKey.substring(0, 10)}...)` : 'NOT FOUND');
    
    if (!geminiApiKey) {
      console.log('❌ Gemini API key missing');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const prompt = `You are an AI assistant for IoT development. Help with React, embedded systems, and debugging.

Context: ${context || 'IoT project'}
Question: ${message}

Please provide a helpful, concise response. Include code in markdown blocks if needed.`;

    console.log('📤 Calling Gemini API...');
    
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    console.log('🌐 API URL:', geminiUrl.replace(geminiApiKey, 'KEY_HIDDEN'));

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    };
    
    console.log('📋 Request body prepared');

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📨 Gemini response status:', response.status);
    console.log('📨 Gemini response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📄 Raw Gemini response:', responseText.substring(0, 200) + '...');

    if (!response.ok) {
      console.error('❌ Gemini API error:', response.status, responseText);
      return new Response(
        JSON.stringify({ 
          error: `Gemini API error: ${response.status}`,
          details: responseText.substring(0, 200)
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = JSON.parse(responseText);
    console.log('📊 Parsed response structure:', Object.keys(data));
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    console.log('✅ AI response extracted, length:', aiResponse.length);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Critical error:', error.name, error.message);
    console.error('📍 Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: `Function error: ${error.message}`,
        type: error.name
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});