import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIDEStore } from '../stores/ideStore';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { 
  PaperPlaneTilt, 
  Robot, 
  User, 
  X, 
  Sparkle,
  Code,
  Check
} from '@phosphor-icons/react';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasCodeSuggestion?: boolean;
  codeSuggestion?: string;
  targetFile?: string;
}

export const AIAssistant: React.FC = () => {
  const { 
    isAIVisible, 
    toggleAI, 
    aiMessages, 
    addAIMessage,
    activeFileId,
    openFiles,
    updateFileContent
  } = useIDEStore();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeFile = openFiles.find(f => f.id === activeFileId);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    addAIMessage('user', userMessage);
    setIsLoading(true);

    try {
      // Get context from current file
      const context = activeFile ? 
        `Working on file: ${activeFile.name} (${activeFile.language})\n${activeFile.content.slice(0, 500)}...` : 
        'Working on an IoT development project';

      // Call the real AI edge function
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: {
          message: userMessage,
          context: context
        }
      });

      if (error) {
        console.error('AI function error:', error);
        addAIMessage('assistant', `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please check that the Gemini API key is properly configured.`);
        return;
      }

      const aiResponse = data?.response || 'Sorry, I could not generate a response.';
      
      console.log('AI Response:', aiResponse);
      
      // Improved code detection - handles various markdown formats
      const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)\s*```/g;
      const codeMatches = [...aiResponse.matchAll(codeBlockRegex)];
      
      console.log('Code matches found:', codeMatches.length);
      
      if (codeMatches.length > 0 && activeFile) {
        // Extract the first code block (most relevant one)
        const extractedCode = codeMatches[0][1].trim();
        console.log('Extracted code:', extractedCode);
        console.log('Code length:', extractedCode.length);
        
        if (extractedCode.length > 0) {
          // Clean the content from code blocks for documentation display
          const cleanContent = aiResponse.replace(/```[\s\S]*?```/g, '').trim();
          
          addAIMessage('assistant', aiResponse, {
            hasCodeSuggestion: true,
            codeSuggestion: extractedCode,
            targetFile: activeFile.name
          });
          console.log('Added AI message with code suggestion');
        } else {
          console.log('Empty code block detected, treating as regular message');
          addAIMessage('assistant', aiResponse);
        }
      } else {
        console.log('No code blocks found or no active file');
        addAIMessage('assistant', aiResponse);
      }
      
    } catch (error) {
      console.error('Error in AI response:', error);
      addAIMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = (suggestion: string) => {
    if (activeFileId) {
      updateFileContent(activeFileId, suggestion);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-panel-bg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Robot size={16} className="text-background" />
          </div>
          <h3 className="font-semibold text-foreground">AI Assistant</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 py-4">
          {aiMessages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkle size={20} className="text-background" />
              </div>
              <h4 className="font-medium text-foreground mb-2">AI Assistant Ready</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Ask me to help with your IoT project. I can:
              </p>
              <div className="text-left space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Code size={14} />
                  <span>Write and improve code</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Robot size={14} />
                  <span>Debug issues</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkle size={14} />
                  <span>Suggest best practices</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {aiMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'user' ? (
                    <div className="max-w-[85%] rounded-lg px-3 py-2 bg-primary text-primary-foreground">
                      <div className="flex items-start space-x-2">
                        <User size={16} className="mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          <div className="text-xs opacity-75 mt-1">
                            {formatTimestamp(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      {message.hasCodeSuggestion && message.codeSuggestion && message.codeSuggestion.trim() ? (
                        // Lovable-style code suggestion with confirmation
                        <div className="w-full mb-6">
                          {/* Documentation-style explanation */}
                          {message.content && message.content.trim() && !message.content.includes('```') && (
                            <div className="mb-4 p-4 bg-muted/20 border border-border rounded-lg">
                              <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Robot size={12} className="text-background" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-foreground mb-2">AI Suggestion</h4>
                                  <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
                                    {message.content.replace(/```[\s\S]*?```/g, '').trim()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Code suggestion card */}
                          <div className="bg-card border border-border rounded-lg overflow-hidden">
                            {/* Header */}
                            <div className="bg-muted/40 border-b border-border px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center">
                                    <Code size={16} className="text-background" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-foreground">Code Suggestion</div>
                                    {message.targetFile && (
                                      <div className="text-xs text-muted-foreground">{message.targetFile}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTimestamp(message.timestamp)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Code block */}
                            <div className="bg-editor">
                              <pre className="p-6 overflow-x-auto text-sm font-mono leading-relaxed text-foreground whitespace-pre-wrap">
                                <code>{message.codeSuggestion?.trim()}</code>
                              </pre>
                            </div>

                            {/* Action buttons */}
                            <div className="bg-muted/20 border-t border-border px-4 py-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                  Do you want to apply this code to {message.targetFile || 'your file'}?
                                </p>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-muted-foreground"
                                  >
                                    Dismiss
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-primary hover:bg-primary-glow text-primary-foreground"
                                    onClick={() => {
                                      console.log('Applying code:', message.codeSuggestion);
                                      handleAcceptSuggestion(message.codeSuggestion!);
                                    }}
                                  >
                                    <Check size={14} className="mr-1.5" />
                                    Accept & Apply
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Regular message display
                        <div className="max-w-[85%] rounded-lg px-3 py-2 bg-muted text-foreground border border-border">
                          <div className="flex items-start space-x-2">
                            <Robot size={16} className="mt-0.5 text-accent" />
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <div className="text-xs opacity-75 mt-1">
                                {formatTimestamp(message.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-foreground border border-border rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <Robot size={16} className="text-accent" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse delay-100"></div>
                        <div className="w-2 h-2 bg-accent rounded-full animate-pulse delay-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Ask AI about ${activeFile ? activeFile.name : 'your project'}...`}
            className="flex-1 resize-none bg-input border-border focus:ring-primary"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary-glow text-primary-foreground"
          >
            <PaperPlaneTilt size={16} />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};