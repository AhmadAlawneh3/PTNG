
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdminChatPanel from '@/components/admin/AdminChatPanel';

const AdminChats = () => {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-7rem)]">
        <AdminChatPanel />
      </div>
    </DashboardLayout>
  );
};

export default AdminChats;
