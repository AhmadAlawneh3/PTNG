
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontalIcon } from "lucide-react";
import { toast } from '@/components/ui/sonner';
import { aiChatService } from '@/services/aiChatService';
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const LOCAL_STORAGE_KEY = 'ai_chat_history';

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Load messages from localStorage on component mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedMessages) {
        // Parse the saved messages and convert timestamp strings back to Date objects
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history from localStorage:', error);
      toast.error("Couldn't load chat history", {
        description: "There was a problem loading your previous conversations."
      });
    }
  }, []);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history to localStorage:', error);
    }
  }, [messages]);
  
  const handleSendQuestion = async () => {
    if (!question.trim()) return;
    
    // Generate a unique ID for the message
    const userMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add user message to chat
    const userMessage: Message = {
      id: userMessageId,
      content: question,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setQuestion('');
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Send question to API
      const response = await aiChatService.askQuestion(question);
      
      // Add AI response to chat
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        content: response.answer,
        isUser: false,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error asking AI:', error);
      toast.error("Couldn't get an answer", { 
        description: "There was a problem reaching the AI service."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion();
    }
  };

  const clearChatHistory = () => {
    setMessages([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    toast.success("Chat history cleared", {
      description: "All previous conversations have been removed."
    });
  };

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-lg text-foreground">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">Ask any question related to your work.</p>
        </div>
        {messages.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearChatHistory}
            className="text-xs"
          >
            Clear History
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground">Ask a question to get started</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground border border-border'
                }`}
              >
                {message.isUser ? (
                  <p>{message.content}</p>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:mb-2 prose-headings:mt-3 prose-pre:my-0 prose-pre:p-3 prose-pre:bg-background prose-pre:border prose-pre:border-border/20 prose-code:text-foreground prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
                <div className={`text-xs mt-1 ${message.isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="button"
            size="icon"
            className="rounded-full bg-primary hover:bg-primary/90"
            onClick={handleSendQuestion}
            disabled={!question.trim() || isLoading}
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <SendHorizontalIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
