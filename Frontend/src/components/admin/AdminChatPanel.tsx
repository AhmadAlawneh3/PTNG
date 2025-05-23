
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import MessageList from '../chat/MessageList';
import MessageInput from '../chat/MessageInput';
import ProjectSelect from '../chat/ProjectSelect';
import { Message, ApiMessage } from '../chat/types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import api from '@/services/api';

const AdminChatPanel = () => {
  const { user, token } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Debug token availability
  useEffect(() => {
    
  }, [token]);

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.employee_id],
    queryFn: async () => {
      try {
        const response = await api.get(`/admin/project/get-all-projects`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        return response.data || [];
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects', {
          description: 'Unable to load project list. Please try again later.'
        });
        return [];
      }
    },
    enabled: !!user && !!token
  });

  // Fetch messages for selected project
  const { 
    data: messagesData, 
    refetch: refetchMessages,
    isLoading: isLoadingMessages
  } = useQuery({
    queryKey: ['messages', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return { messages: [] };
      
      try {
        const response = await api.get(`/chat/messages/${selectedProject}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        return response.data || { messages: [] };
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages', {
          description: 'Unable to load chat messages. Please try again later.'
        });
        return { messages: [] };
      }
    },
    enabled: !!selectedProject && !!token
  });

  // Process API messages and update state
  useEffect(() => {
    if (!messagesData || !selectedProject) return;
    
    // Handle both array format and object with messages property
    const messageArray = Array.isArray(messagesData) 
      ? messagesData 
      : messagesData.messages || [];
    
    if (!Array.isArray(messageArray)) {
      console.error('Expected messages to be an array but got:', messageArray);
      return;
    }
    
    const formattedMessages = messageArray.map((msg: ApiMessage) => {
      return {
        id: msg.id || msg.message_id || `${Date.now()}-${Math.random()}`,
        sender: msg.sender_name || 'Unknown',
        content: msg.content || '',
        timestamp: new Date(msg.timestamp || Date.now()),
        senderRole: user?.role || 'Admin',
        is_file: msg.is_file || false,
        file_path: msg.file_path || '',
        project_id: selectedProject // Add the project ID for downloads
      };
    });

    setMessages(formattedMessages);
  }, [messagesData, user?.role, selectedProject]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { projectId: string, content: string }) => {
      return api.post(`/chat/messages/${messageData.projectId}`, 
        { content: messageData.content },
        { headers: { Authorization: `Bearer ${token}` }}
      );
    },
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast.error('Failed to send message', {
        description: 'Your message could not be sent. Please try again.'
      });
    }
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post(`/chat/upload/${formData.get('projectId')}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
    },
    onSuccess: () => {
      refetchMessages();
      toast.success('File uploaded', {
        description: 'Your file has been shared in the chat.'
      });
    },
    onError: (error) => {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file', {
        description: 'Your file could not be uploaded. Please try again.'
      });
    }
  });

  // File download handler
  const handleFileDownload = (filePath: string, projectId: string | number) => {
    if (!filePath || !token) {
      console.error('Missing file path or authorization token');
      return;
    }
    
    // Extract filename from path
    const filename = filePath.split('/').pop();
    if (!filename) {
      console.error('Could not extract filename from path:', filePath);
      return;
    }

    // Create download URL with auth token
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const downloadUrl = `${apiUrl}/chat/download/${projectId}/${filename}`;
    
    
    
    // Create hidden link element to trigger download
    const link = document.createElement('a');
    
    // Use fetch with authorization header to get the file
    fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.blob();
    })
    .then(blob => {
      // Create object URL from blob
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success('File downloaded successfully');
    })
    .catch(error => {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file', {
        description: 'The file could not be downloaded. Please try again.'
      });
    });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedProject) {
      // Create a unique ID for this message
      const optimisticMessage: Message = {
        id: `local-${Date.now()}`,
        sender: user?.name || 'You',
        content: newMessage,
        timestamp: new Date(),
        senderRole: user?.role || 'Admin', 
        isLocal: true,
        status: 'sending',
        project_id: selectedProject
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Send via API
      sendMessageMutation.mutate({
        projectId: selectedProject,
        content: newMessage
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0 && selectedProject) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', selectedProject);
      
      uploadFileMutation.mutate(formData);
    }
  };
  
  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setMessages([]);
  };

  return (
    <Card className="h-full border-primary/10 bg-background/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-primary/80 flex items-center gap-2">
          <MessageCircle className="text-primary/60" size={20} />
          Project Chat
        </CardTitle>
        <div className="mt-2">
          <ProjectSelect
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={handleProjectSelect}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-6rem)]">
        {selectedProject ? (
          <>
            <ScrollArea className="flex-1 mb-2 pr-2" ref={scrollAreaRef}>
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full"></div>
                </div>
              ) : (
                <MessageList 
                  messages={messages} 
                  onFileDownload={handleFileDownload}
                />
              )}
            </ScrollArea>
            <MessageInput
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              handleFileUpload={handleFileUpload}
              isLoading={sendMessageMutation.isPending || uploadFileMutation.isPending}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a project to start chatting
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminChatPanel;
