
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChatPanel from '@/components/chat/ChatPanel';

const TesterChat = () => {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary">Project Communications</h1>
          <p className="text-muted-foreground mt-2">
            Connect with your team and discuss project updates in real-time.
          </p>
        </div>
        <ChatPanel />
      </div>
    </DashboardLayout>
  );
};

export default TesterChat;
