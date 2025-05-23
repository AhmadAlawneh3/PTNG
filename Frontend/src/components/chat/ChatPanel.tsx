import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ProjectSelect from './ProjectSelect';
import { Message, ApiMessage, TypingIndicator, StatusMessage } from './types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@/components/ui/sonner';
import api from '@/services/api';
import { UserRole } from '@/types/user';
import socketService from '@/services/socketService';
import TypingIndicatorComponent from './TypingIndicator';

const ChatPanel = () => {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const messageListRef = useRef<Message[]>([]);
  const typingTimeoutRef = useRef<{[key: string]: NodeJS.Timeout}>({});
  const localMessageIds = useRef<Set<string>>(new Set()); // Track local message IDs

  // Update ref when messages change
  useEffect(() => {
    messageListRef.current = messages;
  }, [messages]);

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.employee_id],
    queryFn: async () => {
      try {
        const response = await api.get(`/project/get-projects`);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects', {
          description: 'Unable to load project list. Please try again later.'
        });
        return [];
      }
    }
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
        const response = await api.get(`/chat/messages/${selectedProject}`);
        return response.data || { messages: [] };
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages', {
          description: 'Unable to load chat messages. Please try again later.'
        });
        return { messages: [] };
      }
    },
    enabled: !!selectedProject
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
      // Map API sender_role to a valid UserRole type
      let senderRoleTyped: UserRole = 'Tester'; // Default to Tester
      
      if (msg.sender_role === 'Manager' || msg.sender_role === 'Admin') {
        senderRoleTyped = msg.sender_role as UserRole;
      }
      
      return {
        id: msg.id || msg.message_id || `${Date.now()}-${Math.random()}`,
        sender: msg.sender_name || 'Unknown',
        content: msg.content || '',
        timestamp: new Date(msg.timestamp || Date.now()),
        senderRole: senderRoleTyped,
        is_file: msg.is_file || false,
        file_path: msg.file_path || '',
        project_id: selectedProject // Add project_id for file downloads
      };
    });

    setMessages(formattedMessages);
  }, [messagesData, selectedProject]);

  // Connect to WebSocket when project is selected
  useEffect(() => {
    if (!selectedProject || !user) return;
    
    const token = localStorage.getItem('ptng_token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    setIsConnecting(true);
    
    // Connect to WebSocket
    socketService.connect(token, {
      onConnect: () => {
        
        setIsSocketConnected(true);
        setIsConnecting(false);
        socketService.joinRoom(selectedProject);
      },
      onDisconnect: () => {
        
        setIsSocketConnected(false);
      },
      onMessage: (data) => {
        
        
        // Check if it's one of our own local messages by its ID
        const localMsgPrefix = `local-`;
        if (data.sender_id === user.employee_id && data.id && localMessageIds.current.has(`${localMsgPrefix}${data.id}`)) {
          // Replace the local optimistic message with the confirmed message
          localMessageIds.current.delete(`${localMsgPrefix}${data.id}`);
          
          // Remove the optimistic message to avoid duplication
          setMessages(prevMessages => prevMessages.filter(msg => 
            msg.id !== `${localMsgPrefix}${data.id}`
          ));
        }
        
        // Check if we already have this message ID (avoid duplicates)
        const isDuplicate = messageListRef.current.some(msg => 
          (msg.id === data.id || msg.id === data.message_id)
        );
        
        if (!isDuplicate) {
          // Map API sender_role to a valid UserRole type
          let senderRoleTyped: UserRole = 'Tester'; // Default to Tester
          
          if (data.sender_role === 'Manager' || data.sender_role === 'Admin') {
            senderRoleTyped = data.sender_role as UserRole;
          }
          
          const newMsg: Message = {
            id: data.id || data.message_id || `${Date.now()}-${Math.random()}`,
            sender: data.sender_name || 'Unknown',
            content: data.content || '',
            timestamp: new Date(data.timestamp || Date.now()),
            senderRole: senderRoleTyped,
            is_file: data.is_file || false,
            file_path: data.file_path || ''
          };
          
          setMessages(prevMessages => [...prevMessages, newMsg]);
        }
      },
      onStatus: (data: StatusMessage) => {
        // Backend sends status messages for join/leave with complete message
        console.log('Processing status message:', data);
        const statusMsg: Message = {
          id: `status-${Date.now()}-${Math.random()}`,
          sender: 'System',
          content: data.message, // This already contains "John has joined the chat"
          timestamp: new Date(data.timestamp || Date.now()),
          senderRole: 'Tester', // Use a neutral role for status messages
          isStatusMessage: true
        };
        
        setMessages(prevMessages => [...prevMessages, statusMsg]);
      },
      onTyping: (data) => {
        // Add user to typing indicators or reset their timeout
        setTypingUsers(prev => {
          const exists = prev.some(u => u.user === data.user);
          
          // Clear existing timeout if there is one
          if (typingTimeoutRef.current[data.user]) {
            clearTimeout(typingTimeoutRef.current[data.user]);
          }
          
          // Set a new timeout to remove this user after 3 seconds
          typingTimeoutRef.current[data.user] = setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.user !== data.user));
          }, 3000);
          
          if (exists) {
            return prev.map(u => u.user === data.user ? {...u, timestamp: Date.now()} : u);
          } else {
            return [...prev, { user: data.user, timestamp: Date.now() }];
          }
        });
      },
      onStopTyping: (data) => {
        // Remove user from typing indicators
        setTypingUsers(prev => prev.filter(u => u.user !== data.user));
        
        // Clear timeout if it exists
        if (typingTimeoutRef.current[data.user]) {
          clearTimeout(typingTimeoutRef.current[data.user]);
          delete typingTimeoutRef.current[data.user];
        }
      },
      onError: (error) => {
        console.error('Socket error:', error);
        toast.error('Chat Error', {
          description: error.message || 'An error occurred with the chat connection'
        });
      }
    });
    
    // Cleanup function - disconnect from socket when component unmounts
    return () => {
      
      socketService.leaveRoom(selectedProject);
      
      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
      typingTimeoutRef.current = {};
      setTypingUsers([]);
      localMessageIds.current.clear();
    };
  }, [selectedProject, user]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { projectId: string, content: string }) => {
      return api.post(`/chat/messages/${messageData.projectId}`, {
        content: messageData.content
      });
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
          'Content-Type': 'multipart/form-data'
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
    if (!filePath) {
      console.error('Missing file path for download');
      return;
    }
    
    // Extract filename from path
    const filename = filePath.split('/').pop();
    if (!filename) {
      console.error('Could not extract filename from path:', filePath);
      return;
    }

    // Create download URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const downloadUrl = `${apiUrl}/chat/download/${projectId}/${filename}`;
    
    
    
    // Create hidden link element to trigger download
    const link = document.createElement('a');
    
    // Use fetch with authorization header to get the file
    const token = localStorage.getItem('ptng_token');
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
      // Create a unique ID for this message that we can track
      const messageId = Date.now().toString();
      const localMsgId = `local-${messageId}`;
      
      // Add local message ID to our tracking set
      localMessageIds.current.add(localMsgId);
      
      // Try to send through WebSocket first
      const socketSent = socketService.isConnected() && 
                        socketService.sendMessage(selectedProject, newMessage);
      
      if (!socketSent) {
        // Only show optimistic message if using REST API
        const optimisticMessage: Message = {
          id: localMsgId,
          sender: user?.name || 'You',
          content: newMessage,
          timestamp: new Date(),
          senderRole: user?.role as UserRole || 'Tester', 
          isLocal: true,
          status: 'sending',
          project_id: selectedProject
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
        
        // Fall back to REST API
        sendMessageMutation.mutate({
          projectId: selectedProject,
          content: newMessage
        });
      } else {
        setNewMessage(''); // Clear input right away if sent via socket
      }
      
      // Stop typing indicator
      handleTypingStop();
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
    setTypingUsers([]);
    localMessageIds.current.clear();
  };
  
  const handleTypingStart = () => {
    if (selectedProject && socketService.isConnected()) {
      socketService.sendTypingStart(selectedProject);
    }
  };
  
  const handleTypingStop = () => {
    if (selectedProject && socketService.isConnected()) {
      socketService.sendTypingStop(selectedProject);
    }
  };

  // Get typing users array for display
  const typingUserNames = typingUsers.map(t => t.user);

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
            {typingUsers.length > 0 && (
              <TypingIndicatorComponent typingUsers={typingUserNames} />
            )}
            <MessageInput
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              handleFileUpload={handleFileUpload}
              isLoading={sendMessageMutation.isPending || uploadFileMutation.isPending}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
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

export default ChatPanel;
