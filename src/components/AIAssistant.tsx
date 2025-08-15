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
      
      // Check if the response contains code that can be applied to the current file
      const codeMatch = aiResponse.match(/```[\w]*\n([\s\S]*?)\n```/);
      if (codeMatch && activeFile) {
        const extractedCode = codeMatch[1];
        addAIMessage('assistant', aiResponse, {
          hasCodeSuggestion: true,
          codeSuggestion: extractedCode,
          targetFile: activeFile.name
        });
      } else {
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
                      {message.hasCodeSuggestion && message.codeSuggestion ? (
                        // Code-focused display
                        <div className="bg-editor border border-border rounded-lg overflow-hidden">
                          <div className="bg-panel-header px-4 py-2 border-b border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Code size={16} className="text-accent" />
                                <span className="text-sm font-medium text-foreground">Code Solution</span>
                                {message.targetFile && (
                                  <span className="text-xs text-muted-foreground">for {message.targetFile}</span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                className="bg-success hover:bg-success/80 text-white"
                                onClick={() => handleAcceptSuggestion(message.codeSuggestion!)}
                              >
                                <Check size={12} className="mr-1" />
                                Apply to File
                              </Button>
                            </div>
                          </div>
                          <div className="relative">
                            <pre className="bg-editor p-4 overflow-x-auto text-sm font-code text-foreground">
                              <code>{message.codeSuggestion}</code>
                            </pre>
                          </div>
                          {message.content && message.content.trim() && !message.content.includes('```') && (
                            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/50">
                              {message.content.replace(/```[\s\S]*?```/g, '').trim()}
                            </div>
                          )}
                          <div className="px-4 py-1 text-xs text-muted-foreground bg-muted/30">
                            {formatTimestamp(message.timestamp)}
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