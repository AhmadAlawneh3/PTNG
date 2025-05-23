
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AIChat from '@/components/ai-chat/AIChat';

const ManagerAIChat = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Get help with project management and team coordination from our AI assistant.
          </p>
        </div>
        <AIChat />
      </div>
    </DashboardLayout>
  );
};

export default ManagerAIChat;
