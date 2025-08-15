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
    const body = await req.text();
    console.log('Raw request body:', body);
    
    const { message, context } = JSON.parse(body);
    console.log('Parsed - message:', message?.substring(0, 50), 'context:', context?.substring(0, 50));

    if (!message) {
      console.log('ERROR: No message provided');
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for environment variables
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    console.log('Environment check - GEMINI_API_KEY:', geminiKey ? 'EXISTS' : 'MISSING');
    
    if (!geminiKey) {
      console.log('ERROR: Gemini API key not found');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple direct prompt
    const prompt = `You are an IoT development assistant. 

Context: ${context || 'IoT project'}
Question: ${message}

Provide a helpful response. If code is needed, use markdown code blocks.`;

    console.log('Making Gemini API request...');
    console.log('Prompt length:', prompt.length);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    
    const requestData = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    console.log('Request data prepared');

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    console.log('Gemini API response status:', geminiResponse.status);
    console.log('Gemini API response headers:', [...geminiResponse.headers.entries()]);

    const responseText = await geminiResponse.text();
    console.log('Raw Gemini response (first 200 chars):', responseText.substring(0, 200));

    if (!geminiResponse.ok) {
      console.log('ERROR: Gemini API failed');
      console.log('Status:', geminiResponse.status);
      console.log('Response:', responseText);
      
      return new Response(
        JSON.stringify({ 
          error: `Gemini API failed with status ${geminiResponse.status}`,
          details: responseText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = JSON.parse(responseText);
    console.log('Gemini response structure:', Object.keys(geminiData));
    
    if (geminiData.candidates && geminiData.candidates[0]) {
      console.log('Candidate structure:', Object.keys(geminiData.candidates[0]));
    }

    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    console.log('Extracted AI response length:', aiResponse.length);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CRITICAL ERROR:', error.name, '-', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: `Function crashed: ${error.message}`,
        type: error.name,
        stack: error.stack?.substring(0, 500)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});