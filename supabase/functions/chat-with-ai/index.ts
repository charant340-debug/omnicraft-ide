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
    console.log('=== GEMINI API TEST START ===');
    
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    console.log('API Key status:', geminiKey ? `Found (${geminiKey.length} chars)` : 'NOT FOUND');
    
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Test 1: Simple API availability check
    console.log('TEST 1: Checking Gemini API availability...');
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;
    
    try {
      const modelsResponse = await fetch(testUrl);
      console.log('Models API status:', modelsResponse.status);
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.text();
        console.log('Available models response (first 200 chars):', modelsData.substring(0, 200));
      } else {
        console.log('Models API failed:', await modelsResponse.text());
      }
    } catch (error) {
      console.log('Models API error:', error.message);
    }

    // Test 2: Simple content generation
    console.log('TEST 2: Testing content generation...');
    const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    
    const testRequest = {
      contents: [{
        parts: [{
          text: "Say hello and confirm you are working"
        }]
      }]
    };

    console.log('Making generation request to:', generateUrl.replace(geminiKey, 'API_KEY_HIDDEN'));
    console.log('Request body:', JSON.stringify(testRequest, null, 2));

    const generateResponse = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    console.log('Generate response status:', generateResponse.status);
    console.log('Generate response headers:', Object.fromEntries(generateResponse.headers.entries()));

    const responseBody = await generateResponse.text();
    console.log('Generate response body:', responseBody);

    let result = {
      test_results: {
        api_key_present: !!geminiKey,
        generation_status: generateResponse.status,
        generation_ok: generateResponse.ok
      }
    };

    if (generateResponse.ok) {
      try {
        const data = JSON.parse(responseBody);
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        result.generated_text = generatedText;
        result.success = true;
        console.log('SUCCESS: Generated text:', generatedText);
      } catch (parseError) {
        result.parse_error = parseError.message;
        result.raw_response = responseBody;
      }
    } else {
      result.error = responseBody;
      result.success = false;
    }

    console.log('=== GEMINI API TEST END ===');

    return new Response(
      JSON.stringify(result, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('TEST CRASHED:', error);
    return new Response(
      JSON.stringify({ 
        error: `Test failed: ${error.message}`,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});