import React, { useState } from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
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

      // For now, provide intelligent simulated responses based on the message content
      await simulateIntelligentResponse(userMessage, context);
      
    } catch (error) {
      console.error('Error in AI response:', error);
      addAIMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateIntelligentResponse = async (message: string, context: string) => {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    const lowerMessage = message.toLowerCase();
    let response = '';

    // Greeting responses
    if (lowerMessage.match(/\b(hai|hello|hi|hey|good morning|good afternoon)\b/)) {
      const greetings = [
        "Hello! I'm your AI assistant for IoT development. I can help you with frontend React code, backend APIs, embedded programming, and debugging. What would you like to work on?",
        "Hi there! Ready to dive into some IoT development? I can assist with React components, embedded systems, API integration, or debugging. What's on your mind?",
        "Hey! Great to see you here. I'm specialized in helping with full-stack IoT projects. Tell me what you're working on!"
      ];
      response = greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Error/debugging responses
    else if (lowerMessage.match(/\b(error|bug|debug|fix|issue|problem|broken|not working)\b/)) {
      const debugResponses = [
        "I'd be happy to help debug your code! Could you share the specific error message or describe what's not working as expected?",
        "Let's troubleshoot this together! What error are you seeing, and in which file? I can help identify the issue.",
        "Debugging time! Please share the error details or describe the unexpected behavior you're experiencing."
      ];
      response = debugResponses[Math.floor(Math.random() * debugResponses.length)];
    }
    
    // Code-specific responses
    else if (lowerMessage.match(/\b(react|component|jsx|tsx|hook|state)\b/)) {
      response = `For React development, I can help with:
• Component structure and hooks (useState, useEffect, custom hooks)
• State management with Zustand
• TypeScript interfaces and props
• Tailwind CSS styling and responsive design
• Performance optimization and best practices

What specific React challenge are you facing?`;
    }
    
    // Embedded programming
    else if (lowerMessage.match(/\b(embedded|arduino|esp32|sensor|iot|microcontroller|gpio)\b/)) {
      response = `For embedded programming, I can assist with:
• Arduino/ESP32 code and libraries
• Sensor integration (temperature, humidity, motion, etc.)
• IoT protocols (WiFi, Bluetooth, MQTT, HTTP)
• Hardware interfacing and GPIO control
• Power management and optimization

What's your embedded project about?`;
    }
    
    // Backend/API responses
    else if (lowerMessage.match(/\b(api|backend|server|database|supabase|auth)\b/)) {
      response = `For backend development, I can help with:
• REST API design and implementation
• Supabase integration (database, auth, storage)
• Database schema design and queries
• Authentication and authorization
• Error handling and validation

What backend functionality do you need?`;
    }
    
    // Code review requests
    else if (lowerMessage.match(/\b(review|check|improve|optimize|refactor)\b/) && activeFile) {
      response = `I see you're working on ${activeFile.name}. I can help review your ${activeFile.language} code for:
• Best practices and conventions
• Performance optimizations
• Security considerations
• Code structure improvements
• Bug prevention

Would you like me to analyze a specific part of your code?`;
    }
    
    // Specific questions about current file
    else if (activeFile && lowerMessage.match(/\b(this file|current file|this code)\b/)) {
      response = `Looking at your ${activeFile.name} file (${activeFile.language}), I can help you with:
• Understanding the current implementation
• Adding new features or functions
• Fixing any issues or bugs
• Optimizing performance
• Following best practices

What would you like to do with this file?`;
    }
    
    // How-to questions
    else if (lowerMessage.match(/\b(how to|how do i|how can i)\b/)) {
      const howToResponses = [
        "I'd love to help you learn! Could you be more specific about what you want to accomplish? I can provide step-by-step guidance.",
        "Great question! I can walk you through the process. What specifically are you trying to achieve?",
        "I can definitely guide you through that! Could you give me more details about your goal?"
      ];
      response = howToResponses[Math.floor(Math.random() * howToResponses.length)];
    }
    
    // Help requests
    else if (lowerMessage.match(/\b(help|assist|support)\b/)) {
      response = `I'm here to help! I specialize in:

🔧 **Frontend Development**
   • React components, hooks, TypeScript
   • Tailwind CSS styling and responsive design

🔌 **Backend Development**  
   • Supabase integration, APIs, databases
   • Authentication and data management

⚡ **Embedded Systems**
   • Arduino/ESP32 programming
   • Sensor integration and IoT protocols

🐛 **Debugging & Optimization**
   • Error fixing and code review
   • Performance improvements

What area would you like help with?`;
    }
    
    // Default contextual response
    else {
      const generalResponses = [
        `Interesting question! Could you provide more details about what you're trying to achieve? ${activeFile ? `I see you're working on ${activeFile.name} - is this related?` : 'I can help with React, embedded systems, or backend development.'}`,
        `I'd be happy to help! Could you elaborate on your question? ${activeFile ? `Looking at your ${activeFile.language} file, ` : ''}I can assist with coding, debugging, or implementation guidance.`,
        `Thanks for reaching out! I need a bit more context to give you the best help. ${activeFile ? `I notice you have ${activeFile.name} open - ` : ''}What specific challenge are you facing?`
      ];
      response = generalResponses[Math.floor(Math.random() * generalResponses.length)];
    }

    addAIMessage('assistant', response);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAcceptSuggestion = (suggestion: string) => {
    if (activeFileId) {
      updateFileContent(activeFileId, suggestion);
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
                  <div
                    className={`
                      max-w-[85%] rounded-lg px-3 py-2 
                      ${message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-foreground border border-border'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <Robot size={16} className="mt-0.5 text-accent" />
                      )}
                      {message.role === 'user' && (
                        <User size={16} className="mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        <div className="text-xs opacity-75 mt-1">
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Code suggestion example */}
                    {message.role === 'assistant' && Math.random() > 0.7 && (
                      <div className="mt-3 border-t border-border pt-3">
                        <div className="bg-editor rounded p-2 font-code text-xs">
                          <div className="text-muted-foreground mb-1">Suggested improvement:</div>
                          <code>
                            {`function connectWiFi() {\n  wlan.connect("SSID", "password");\n  console.log("Connected!");\n}`}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          className="mt-2 bg-success hover:bg-success/80 text-white"
                          onClick={() => handleAcceptSuggestion('// AI suggested code here')}
                        >
                          <Check size={12} className="mr-1" />
                          Accept
                        </Button>
                      </div>
                    )}
                  </div>
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