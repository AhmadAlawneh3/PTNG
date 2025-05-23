
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ChatPanel from '@/components/chat/ChatPanel';

const ManagerChat = () => {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 gap-6">
        <div className="h-[calc(100vh-8rem)]">
          <ChatPanel />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerChat;
