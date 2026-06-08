'use client';

import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/dashboard/AppLayout';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore, ChatRoom, ChatMessage } from '@/stores/chat.store';
import { socket } from '@/lib/socket';
import { api } from '@/lib/axios';

import {
  MessageSquare,
  Hash,
  Send,
  Plus,
  User,
  MoreVertical,
  Paperclip,
  Code,
  Smile,
  Users,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function ChatPage() {
  const { user } = useAuthStore();
  const {
    rooms,
    activeRoom,
    activeMessages,
    typingUsers,
    isLoading,
    fetchRooms,
    createRoom,
    setActiveRoom,
    addMessage,
    setTyping,
  } = useChatStore();

  const [messageText, setMessageText] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'direct' | 'group'>('group');
  const [newRoomUsernames, setNewRoomUsernames] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<any>(null);

  // User search/select states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  const handleUserSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/auth/users/search?q=${encodeURIComponent(val)}`);
      setSearchResults(res.data.data.users || []);
    } catch {
      setSearchResults([]);
    }
  };

  const handleSelectUser = (u: any) => {
    if (selectedUsers.some((sel) => sel._id === u._id)) return;
    if (newRoomType === 'direct') {
      setSelectedUsers([u]);
    } else {
      setSelectedUsers([...selectedUsers, u]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (id: string) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== id));
  };


  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch rooms on load
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // 2. Select default room if none active
  useEffect(() => {
    if (rooms.length > 0 && !activeRoom) {
      setActiveRoom(rooms[0]);
    }
  }, [rooms, activeRoom, setActiveRoom]);

  // 3. Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // 4. Socket Listeners for Real-time chat sync
  useEffect(() => {
    if (!activeRoom) return;

    if (!socket.connected) socket.connect();

    const chatRoomId = activeRoom._id;
    const channelType = activeRoom.type;

    // Join chat room channel
    socket.emit('chat:join', { roomId: chatRoomId, type: channelType });

    const handleIncomingMessage = (msg: ChatMessage) => {
      addMessage(msg);
    };

    const handleIncomingTypingStart = (data: { userId: string; channel: any }) => {
      if (data.userId !== user?._id) {
        // Resolve displayName from active room participants
        const writer = activeRoom.participants.find((p) => p._id === data.userId);
        if (writer) setTyping(writer.displayName, true);
      }
    };

    const handleIncomingTypingStop = (data: { userId: string; channel: any }) => {
      const writer = activeRoom.participants.find((p) => p._id === data.userId);
      if (writer) setTyping(writer.displayName, false);
    };

    socket.on('chat:message:new', handleIncomingMessage);
    socket.on('chat:typing:start', handleIncomingTypingStart);
    socket.on('chat:typing:stop', handleIncomingTypingStop);

    return () => {
      socket.emit('chat:leave', { roomId: chatRoomId, type: channelType });
      socket.off('chat:message:new', handleIncomingMessage);
      socket.off('chat:typing:start', handleIncomingTypingStart);
      socket.off('chat:typing:stop', handleIncomingTypingStop);
    };
  }, [activeRoom, addMessage, setTyping, user]);

  // 5. Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeRoom) return;

    const payload: any = {
      content: messageText.trim(),
      type: 'text',
      channelType: activeRoom.type,
    };

    if (activeRoom.type === 'direct') {
      payload.directChatId = activeRoom._id;
    } else {
      payload.groupChatId = activeRoom._id;
    }

    socket.emit('chat:message:send', payload);
    setMessageText('');
    
    // Stop typing
    if (typingTimeout) clearTimeout(typingTimeout);
    socket.emit('chat:typing:stop', { channelType: activeRoom.type, channelId: activeRoom._id });
  };

  // Typing status triggers
  const handleKeyDown = () => {
    if (!activeRoom) return;

    socket.emit('chat:typing:start', { channelType: activeRoom.type, channelId: activeRoom._id });

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      socket.emit('chat:typing:stop', { channelType: activeRoom.type, channelId: activeRoom._id });
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newRoomType === 'group' && !newRoomName.trim()) {
      toast.error('Group channel name is required');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('At least one user must be selected');
      return;
    }

    const participantIds = selectedUsers.map((u) => u._id);
    if (user?._id) {
      participantIds.push(user._id);
    }

    try {
      await createRoom({
        type: newRoomType,
        participantIds,
        name: newRoomType === 'group' ? newRoomName.trim() : undefined,
      });

      toast.success('Chat room created');
      setShowCreateRoom(false);
      setNewRoomName('');
      setSelectedUsers([]);
      setSearchQuery('');
      setSearchResults([]);
    } catch {
      toast.error('Failed to create chat room');
    }
  };


  return (
    <AppLayout>
      <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row rounded-[28px] overflow-hidden border border-border-default bg-bg-surface/50 backdrop-blur-sm">
        {/* Sidebar (stacked on mobile, fixed width on md+) */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border-subtle bg-bg-surface/90 flex flex-col justify-between">
          <div>
            <div className="h-14 px-4 flex items-center justify-between border-b border-border-subtle">
              <span className="text-sm font-bold font-display">Workspace Channels</span>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="p-1.5 rounded-lg bg-bg-elevated text-text-secondary hover:text-white transition"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-16rem)]">
              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-2 block mb-1">
                  Text Channels
                </span>
                <div className="space-y-0.5">
                  {rooms
                    .filter((r) => r.type === 'group')
                    .map((room) => (
                      <button
                        key={room._id}
                        onClick={() => setActiveRoom(room)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          activeRoom?._id === room._id
                            ? 'bg-accent-primary/10 text-accent-cyan border border-accent-primary/20'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40'
                        }`}
                      >
                        <Hash size={14} />
                        <span className="truncate">{room.name}</span>
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-2 block mb-1">
                  Direct Messages
                </span>
                <div className="space-y-0.5">
                  {rooms
                    .filter((r) => r.type === 'direct')
                    .map((room) => (
                      <button
                        key={room._id}
                        onClick={() => setActiveRoom(room)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          activeRoom?._id === room._id
                            ? 'bg-accent-primary/10 text-accent-cyan border border-accent-primary/20'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40'
                        }`}
                      >
                        <User size={14} />
                        <span className="truncate">
                          {room.participants.find((p) => p._id !== user?._id)?.displayName || 'Direct Chat'}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side: Message Feed */}
        <div className="flex-1 flex flex-col justify-between bg-bg-base/20 min-w-0">
          {activeRoom ? (
            <>
              {/* Active Header bar */}
              <div className="h-14 border-b border-border-subtle flex items-center justify-between px-6 bg-bg-surface/30">
                <div className="flex items-center gap-2">
                  {activeRoom.type === 'group' ? <Hash size={18} className="text-text-secondary" /> : <User size={18} className="text-text-secondary" />}
                  <span className="text-sm font-bold text-text-primary">
                    {activeRoom.type === 'group'
                      ? activeRoom.name
                      : activeRoom.participants.find((p) => p._id !== user?._id)?.displayName || 'Direct Chat'}
                  </span>
                </div>
                <button className="text-text-secondary hover:text-white p-1 rounded-lg">
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Message Scroll Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeMessages.length === 0 ? (
                  <div className="py-24 text-center text-sm text-text-secondary">
                    <MessageSquare className="mx-auto text-text-muted mb-3" size={32} />
                    Welcome to the beginning of the channel. Send a message!
                  </div>
                ) : (
                  activeMessages.map((msg) => (
                    <div key={msg._id} className="flex gap-3 items-start">
                      <div className="h-9 w-9 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-sm border border-accent-primary/20">
                        {msg.sender?.displayName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 leading-relaxed">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-text-primary">{msg.sender?.displayName}</span>
                          <span className="text-[9px] text-text-muted">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1 bg-bg-surface/30 border border-border-subtle/50 px-3.5 py-2 rounded-2xl inline-block max-w-lg">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Text Input area */}
              <div className="p-4 border-t border-border-subtle bg-bg-surface/30">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <div className="flex-1 flex items-center rounded-2xl border border-border-default bg-bg-base px-3">
                    <button type="button" className="text-text-secondary hover:text-white p-1.5 rounded-lg mr-2">
                      <Paperclip size={16} />
                    </button>
                    <input
                      type="text"
                      placeholder="Message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-transparent py-3 text-xs text-text-primary outline-none"
                    />
                    <button type="button" className="text-text-secondary hover:text-white p-1.5 rounded-lg">
                      <Code size={16} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="rounded-2xl bg-accent-primary hover:bg-accent-hover p-3 text-white shadow-glow-sm transition"
                  >
                    <Send size={16} />
                  </button>
                </form>
                
                {/* Typing users feedback */}
                {typingUsers.length > 0 && (
                  <div className="text-[10px] text-text-secondary mt-1.5 flex items-center gap-1">
                    <span className="font-semibold">{typingUsers.join(', ')}</span>
                    <span>{typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <MessageSquare className="text-text-muted mb-4" size={48} />
              <h2 className="text-lg font-bold font-display">No active chat conversation</h2>
              <p className="text-xs text-text-secondary mt-1">
                Select a channel or direct message from the sidebar to begin messaging.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal Popup */}
      {showCreateRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-border-default bg-bg-surface p-6 shadow-elevated">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <h3 className="text-base font-bold font-display">Create new chat room</h3>
              <button onClick={() => setShowCreateRoom(false)} className="text-text-secondary hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateRoom} className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</span>
                <select
                  value={newRoomType}
                  onChange={(e) => {
                    setNewRoomType(e.target.value as any);
                    setSelectedUsers([]);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-full rounded-xl border border-border-default bg-bg-base px-3.5 py-2.5 text-xs text-text-primary outline-none transition focus:border-accent-primary"
                >
                  <option value="group">Group Channel</option>
                  <option value="direct">Direct Message</option>
                </select>
              </label>


              {newRoomType === 'group' && (
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Channel Name</span>
                  <input
                    type="text"
                    placeholder="e.g. dev-team"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full rounded-xl border border-border-default bg-bg-base px-3.5 py-2.5 text-xs text-text-primary outline-none transition focus:border-accent-primary"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Invite Users
                </span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by username, display name..."
                    value={searchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    className="w-full rounded-xl border border-border-default bg-bg-base px-3.5 py-2.5 text-xs text-text-primary outline-none transition focus:border-accent-primary"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border border-border-default bg-bg-surface shadow-elevated p-1">
                      {searchResults.map((u: any) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-bg-elevated rounded-lg text-left"
                        >
                          <div className="h-6 w-6 rounded-full bg-accent-primary/10 flex items-center justify-center font-bold text-[10px] text-accent-primary">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.displayName} className="h-full w-full rounded-full object-cover" />
                            ) : (
                              u.displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-text-primary">{u.displayName}</span>
                            <span className="text-[10px] text-text-muted ml-2">@{u.username}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </label>

              {/* Selected Users list */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedUsers.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center gap-1 bg-accent-primary/10 border border-accent-primary/20 text-accent-cyan px-2.5 py-1 rounded-full text-[10px] font-semibold"
                    >
                      <span>{u.displayName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(u._id)}
                        className="text-text-muted hover:text-white ml-1"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-accent-primary hover:bg-accent-hover py-3 text-xs font-semibold text-white transition shadow-glow-sm"
              >
                Create Chat
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
