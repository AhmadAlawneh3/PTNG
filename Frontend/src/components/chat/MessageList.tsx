
import React from 'react';
import { Message } from './types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Download, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  onFileDownload?: (filePath: string, projectId: string | number) => void;
}

const MessageList = ({ messages, onFileDownload }: MessageListProps) => {
  // Format timestamp for display
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get avatar color by role
  const getAvatarColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-destructive';
      case 'manager':
        return 'bg-primary';
      case 'employee':
      case 'tester':
        return 'bg-green-600';
      default:
        return 'bg-primary';
    }
  };
  
  // Sort messages chronologically (oldest first)
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return (
    <div className="flex flex-col space-y-4 p-3">
      {sortedMessages.length === 0 ? (
        <div className="text-center text-muted-foreground py-6">
          No messages yet. Start the conversation!
        </div>
      ) : (
        sortedMessages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 group",
              message.isStatusMessage && "justify-center"
            )}
          >
            {!message.isStatusMessage && (
              <Avatar className={cn("h-8 w-8", getAvatarColor(message.senderRole))}>
                {message.sender && (
                  <AvatarFallback className="text-xs font-bold text-white">
                    {getInitials(message.sender)}
                  </AvatarFallback>
                )}
              </Avatar>
            )}
            
            <div className="flex flex-col flex-1">
              {!message.isStatusMessage && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{message.sender}</span>
                  <Badge variant="outline" className="text-xs h-4 px-1 py-0">
                    {message.senderRole}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              )}
              
              <div className={cn(
                "mt-1 rounded-md py-2 px-3",
                message.isLocal ? "bg-muted" : "bg-card/50",
                message.isStatusMessage && "text-muted-foreground text-xs italic text-center py-1"
              )}>
                {message.is_file ? (
                  <div className="flex items-center justify-between gap-2 border border-border rounded-md p-2 bg-muted">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-primary" />
                      <span className="text-sm">{message.content || message.file_path?.split('/').pop()}</span>
                    </div>
                    {onFileDownload && message.file_path && message.project_id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onFileDownload(message.file_path || '', message.project_id || '')}
                        className="h-7 w-7 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                )}
                
                {message.isLocal && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {message.status === 'sending' ? 'Sending...' : message.status === 'error' ? 'Error sending message' : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MessageList;
