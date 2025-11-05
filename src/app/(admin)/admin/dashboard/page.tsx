'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Search,
  MessageSquare,
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Quote,
  User,
  Building,
  UserCheck, // For admin messages
  XCircle, // To close chat
  CheckCircle, // To open chat
} from 'lucide-react';

// --- Firebase Imports ---
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Ensure this path is correct for your Firebase config
// import { useAuth } from "@/context/AuthContext"; // Uncomment if you need admin user details for messages

// --- Interfaces for Chat Data ---
interface Message {
  id: string;
  sender: 'user' | 'bot' | 'system' | 'admin';
  text?: string;
  imageUrl?: string;
  timestamp: Timestamp | null;
  name?: string; // For user/bot/admin messages
  avatarBg?: string; // For user messages in admin panel (or derive from user details)
  senderName?: string; // For admin messages
}

interface ChatMetadata {
  name: string;
  email: string | null;
  page?: string;
}

interface Chat {
  id: string;
  userId: string | null;
  status: 'open' | 'closed';
  createdAt: Timestamp | null;
  lastMessageTimestamp: Timestamp | null;
  lastMessageSnippet: string;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
  agentIsTyping: boolean;
  adminIsTyping: boolean; // For future feature
  metadata: ChatMetadata;
  // This will store actual messages temporarily for the ChatList, not the full chat history
  // Full history is fetched when a chat is selected
  messages?: Message[];
}

// Helper to format Firebase Timestamp
const formatFirestoreTimestamp = (timestamp: Timestamp | null, type: 'full' | 'date' | 'time' | 'ago' = 'full'): string => {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    if (type === 'date') return 'No Date';
    if (type === 'time') return 'No Time';
    return 'N/A';
  }
  const date = timestamp.toDate();

  switch (type) {
    case 'time':
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    case 'date': {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }
    case 'full':
    default:
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
  }
};


// --- 1. MAIN PAGE COMPONENT (3-PANEL) ---
export default function SupportChatPage() {
  const [conversations, setConversations] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  // const { user: adminUser } = useAuth(); // Uncomment if you need admin user details

  const selectedChat = conversations.find((c) => c.id === selectedChatId);

  // Fetch conversations in real-time
  useEffect(() => {
    const chatsRef = collection(db, "supportChats");
    // Order by last message timestamp to show most recent chats first
    const q = query(chatsRef, orderBy("lastMessageTimestamp", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedChats: Chat[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedChats.push({
          id: doc.id,
          userId: data.userId || null,
          status: data.status || 'open',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
          lastMessageTimestamp: data.lastMessageTimestamp instanceof Timestamp ? data.lastMessageTimestamp : null,
          lastMessageSnippet: data.lastMessageSnippet || 'No messages yet.',
          unreadByAdmin: data.unreadByAdmin || false,
          unreadByUser: data.unreadByUser || false,
          agentIsTyping: data.agentIsTyping || false,
          adminIsTyping: data.adminIsTyping || false,
          metadata: {
            name: data.metadata?.name || 'Anonymous',
            email: data.metadata?.email || null,
            page: data.metadata?.page || '',
          },
        });
      });
      setConversations(fetchedChats);

      // If no chat is selected, or the selected chat was removed by filtering/closing,
      // select the first available chat in the filtered list.
      if (!selectedChatId && fetchedChats.length > 0) {
        setSelectedChatId(fetchedChats[0].id);
      } else if (selectedChatId && !fetchedChats.some(chat => chat.id === selectedChatId)) {
        // If the previously selected chat is no longer in the list (e.g. was closed and filter is 'open')
        setSelectedChatId(fetchedChats.length > 0 ? fetchedChats[0].id : null);
      }
    });

    return () => unsubscribe();
  }, [selectedChatId]); // Re-run if selectedChatId changes to handle re-selection logic


  const handleSelectChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    // Mark chat as read by admin when selected
    const chatRef = doc(db, "supportChats", chatId);
    await updateDoc(chatRef, {
      unreadByAdmin: false,
    });
  };

  const filteredConversations = conversations.filter(chat => chat.status === filter);

  return (
    <div className="flex h-full">
      {/* --- 1. Chat List Pane (Left) --- */}
      <div className="flex h-full w-80 flex-col border-r border-gray-700 bg-gray-800 lg:w-96">
        {/* Header (Fixed) */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-700 px-4">
          <h2 className="text-xl font-bold text-white">Conversations</h2>
          <button className="text-gray-400 hover:text-white">
            <Search className="h-5 w-5" />
          </button>
        </div>
        
        {/* Filters (Fixed) */}
        <div className="flex flex-shrink-0 gap-2 border-b border-gray-700 p-2">
          <button
            onClick={() => setFilter('open')}
            className={`rounded-md px-3 py-1 text-sm font-medium ${filter === 'open' ? 'bg-blue-600/30 text-blue-300' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`rounded-md px-3 py-1 text-sm font-medium ${filter === 'closed' ? 'bg-blue-600/30 text-blue-300' : 'text-gray-400 hover:bg-gray-700'}`}
          >
            Closed
          </button>
        </div>

        {/* Chat List (Scrollable) */}
        <div className="flex-1 overflow-y-auto">
          <nav className="flex flex-col p-2">
            {filteredConversations.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={chat.id === selectedChatId}
                onSelect={() => handleSelectChat(chat.id)}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* --- 2. Active Chat Pane (Center) --- */}
      <div className="flex flex-1 flex-col">
        {selectedChat ? (
          <ActiveChatWindow chat={selectedChat} />
        ) : (
          <ChatPlaceholder />
        )}
      </div>

      {/* --- 3. Contact Details Pane (Right) --- */}
      <div className="hidden h-full w-80 flex-col border-l border-gray-700 bg-gray-800 lg:flex lg:w-96">
        {selectedChat ? (
          <ContactDetailsPane chat={selectedChat} />
        ) : (
          <ContactPlaceholder />
        )}
      </div>
    </div>
  );
}


// --- 2. CHAT ITEM COMPONENT (Left Pane) ---
function ChatItem({ chat, isSelected, onSelect }: { chat: Chat, isSelected: boolean, onSelect: () => void }) {
  // Generate a consistent color for the avatar based on the name
  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500',
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const avatarBg = getAvatarBg(chat.metadata.name);

  return (
    <button
      onClick={onSelect}
      className={`
        flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors
        ${isSelected ? 'bg-blue-600/20' : 'hover:bg-gray-700'}
      `}
    >
      {chat.unreadByAdmin && <div className="mt-2.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"></div>}
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${avatarBg} ${!chat.unreadByAdmin ? 'ml-5' : ''}`}>
        {chat.metadata.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate font-semibold text-white">{chat.metadata.name}</span>
          <span className="text-xs text-gray-400">{formatFirestoreTimestamp(chat.lastMessageTimestamp, 'date')}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-gray-400">{chat.lastMessageSnippet}</p>
      </div>
    </button>
  );
}

// --- 3. ACTIVE CHAT WINDOW (Center Pane) ---
function ActiveChatWindow({ chat }: { chat: Chat }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const { user: adminUser } = useAuth(); // Uncomment if you need admin user details

  // Fetch messages for the selected chat
  useEffect(() => {
    if (!chat?.id) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, "supportChats", chat.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          sender: data.sender || 'user',
          text: data.text || '',
          imageUrl: data.imageUrl || null,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp : null,
          name: data.sender === 'user' ? (chat.metadata.name || 'User') : data.senderName, // Use senderName for bot/admin
          senderName: data.senderName || '', // For admin messages, the name of the admin
          avatarBg: chat.metadata.name ? getAvatarBg(chat.metadata.name) : 'bg-gray-500',
        });
      });
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [chat?.id, chat.metadata.name]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chat.agentIsTyping]); // Also scroll when agent typing status changes

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessageText.trim() === '') return;

    const messageData = {
      sender: 'admin',
      senderName: 'Admin Support', // Replace with adminUser.displayName if using Auth
      text: newMessageText,
      timestamp: serverTimestamp(),
      type: 'text', // Assuming admin always sends text for now
    };

    try {
      await addDoc(collection(db, "supportChats", chat.id, "messages"), messageData);
      await updateDoc(doc(db, "supportChats", chat.id), {
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSnippet: `Admin: ${newMessageText}`,
        unreadByUser: true, // Mark as unread for the user
        status: 'open', // Ensure chat is open if admin replies
        adminIsTyping: false, // Stop typing indicator after sending
      });
      setNewMessageText('');
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  const handleTypingChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessageText(e.target.value);
    // Optional: Implement admin typing indicator
    // const chatRef = doc(db, "supportChats", chat.id);
    // await updateDoc(chatRef, { adminIsTyping: e.target.value.length > 0 });
  };

  const handleToggleChatStatus = async () => {
    if (!chat.id) return;
    const newStatus = chat.status === 'open' ? 'closed' : 'open';
    try {
      await updateDoc(doc(db, "supportChats", chat.id), {
        status: newStatus,
        unreadByAdmin: false, // Mark as read when closing/opening
      });
    } catch (error) {
      console.error("Error updating chat status:", error);
      alert("Failed to update chat status.");
    }
  };

  // Generate a consistent color for the avatar based on the name
  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500',
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const userAvatarBg = getAvatarBg(chat.metadata.name);

  return (
    <div className="flex h-full flex-col bg-gray-900">
      
      {/* 1. Chat Header (Fixed) */}
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-700 px-6">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-white ${userAvatarBg}`}>
            {chat.metadata.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{chat.metadata.name}</h2>
            <span className="text-xs text-gray-400">joined {formatFirestoreTimestamp(chat.createdAt, 'date')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 text-gray-400 hover:bg-gray-700 hover:text-white" onClick={handleToggleChatStatus} title={chat.status === 'open' ? 'Close Chat' : 'Open Chat'}>
            {chat.status === 'open' ? <XCircle className="h-5 w-5 text-red-400" /> : <CheckCircle className="h-5 w-5 text-green-400" />}
          </button>
          <button className="rounded-full p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
            <Phone className="h-5 w-5" />
          </button>
          <button className="rounded-full p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
            <Video className="h-5 w-5" />
          </button>
          <button className="rounded-full p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. Message Area (Scrollable) */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {messages.map((msg: Message) => {
          if (msg.sender === 'system') {
            return <SystemMessage key={msg.id} text={msg.text || ''} timestamp={formatFirestoreTimestamp(msg.timestamp, 'date')} />;
          }
          if (msg.sender === 'bot') {
            return <BotMessage key={msg.id} name={msg.name || 'Bot'} text={msg.text} imageUrl={msg.imageUrl} timestamp={formatFirestoreTimestamp(msg.timestamp, 'time')} />;
          }
          if (msg.sender === 'user') {
            return <UserMessage key={msg.id} name={msg.name || chat.metadata.name} text={msg.text} imageUrl={msg.imageUrl} timestamp={formatFirestoreTimestamp(msg.timestamp, 'time')} avatarBg={userAvatarBg} />;
          }
          if (msg.sender === 'admin') {
            return <AdminMessage key={msg.id} name={msg.senderName || 'Admin'} text={msg.text} imageUrl={msg.imageUrl} timestamp={formatFirestoreTimestamp(msg.timestamp, 'time')} />;
          }
          return null;
        })}
        {chat.agentIsTyping && <UserTypingIndicator name={chat.metadata.name} avatarBg={userAvatarBg} />}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Chat Input Area (Fixed) */}
      <div className="flex-shrink-0 border-t border-gray-700 p-4">
        <div className="rounded-lg border border-gray-600 bg-gray-800 shadow-sm">
          <div className="border-b border-gray-600 px-4 py-2">
            <span className="text-sm font-medium text-white">Reply</span>
          </div>
          
          <textarea
            placeholder="Type your message..."
            className="w-full resize-none border-none bg-transparent p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-0"
            rows={4}
            value={newMessageText}
            onChange={handleTypingChange}
            onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                }
            }}
          ></textarea>
          
          {/* Toolbar & Send Button */}
          <div className="flex items-center justify-between border-t border-gray-600 p-2">
            <div className="flex items-center gap-1">
              <RichTextButton icon={Bold} />
              <RichTextButton icon={Italic} />
              <RichTextButton icon={Underline} />
              <RichTextButton icon={Strikethrough} />
              <RichTextButton icon={Link} />
              <RichTextButton icon={List} />
              <RichTextButton icon={ListOrdered} />
              <RichTextButton icon={Quote} />
              <RichTextButton icon={Smile} />
              <RichTextButton icon={Paperclip} />
            </div>
            <button
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
              onClick={handleSendMessage}
              disabled={newMessageText.trim() === ''}
            >
              Send
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 4. CONTACT DETAILS PANE (Right) ---
function ContactDetailsPane({ chat }: { chat: Chat }) {
  const [notes, setNotes] = useState<string>(''); // Initialize as empty string
  // Generate a consistent color for the avatar based on the name
  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-indigo-500',
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const avatarBg = getAvatarBg(chat.metadata.name);

  // Fetch or set notes from chat data
  useEffect(() => {
    // Assuming 'notes' is a field directly on the chat document
    // If not, you'd need a separate Firestore collection for contacts/notes
    const chatRef = doc(db, "supportChats", chat.id);
    const unsubscribe = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNotes(data.notes || '');
      }
    });
    return () => unsubscribe();
  }, [chat.id]);

  const handleNotesChange = useCallback(async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    // Debounce this update in a real app to prevent too many writes
    try {
      await updateDoc(doc(db, "supportChats", chat.id), { notes: newNotes });
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  }, [chat.id]);


  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="flex flex-col items-center">
        <div className={`flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white ${avatarBg}`}>
          {chat.metadata.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="mt-4 text-xl font-semibold text-white">{chat.metadata.name}</h2>
        {chat.userId && (
          <a href={`/admin/users/${chat.userId}`} className="text-sm text-blue-400 hover:underline">
            View User Profile
          </a>
        )}
      </div>

      <div className="mt-6 space-y-4">
        <InfoRow label="Name" value={chat.metadata.name || '---'} />
        <InfoRow label="Email" value={chat.metadata.email || '---'} />
        <InfoRow label="Phone number" value="---" /> {/* Assuming no phone number from widget currently */}
        <InfoRow label="Notes" value={notes} isTextarea={true} onChange={handleNotesChange} />
      </div>

      {/* Session Details */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase text-gray-500">Last Session</h3>
        <p className="mt-1 text-sm text-gray-300">{formatFirestoreTimestamp(chat.lastMessageTimestamp, 'full')}</p>
        
        <h3 className="mt-4 text-xs font-semibold uppercase text-gray-500">Page Visited (Referrer)</h3>
        <p className="mt-1 text-sm text-gray-300">{chat.metadata.page || '---'}</p>
        
        <h3 className="mt-4 text-xs font-semibold uppercase text-gray-500">Location</h3>
        <p className="mt-1 text-sm text-gray-300">---</p> {/* Location is not currently sent by widget */}
      </div>
    </div>
  );
}

// --- 5. HELPER COMPONENTS ---

function InfoRow({ label, value, isTextarea = false, onChange }: { label: string, value: string, isTextarea?: boolean, onChange?: (e: any) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400">{label}</label>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={onChange}
          className="mt-1 w-full rounded-md border-gray-600 bg-gray-700 p-2 text-sm text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value}
          readOnly={!onChange} // Make read-only if no onChange handler
          onChange={onChange}
          className="mt-1 w-full rounded-md border-gray-600 bg-gray-700 p-2 text-sm text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      )}
    </div>
  );
}

function RichTextButton({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <button className="rounded p-2 text-gray-400 hover:bg-gray-700 hover:text-white">
      <Icon className="h-4 w-4" />
    </button>
  );
}

function ChatPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-gray-500">
      <MessageSquare className="h-16 w-16" />
      <h2 className="mt-4 text-xl font-semibold">Select a Conversation</h2>
      <p className="mt-1 text-gray-400">Choose a conversation from the list to start chatting.</p>
    </div>
  );
}

function ContactPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center text-gray-500">
      <User className="h-16 w-16" />
      <h2 className="mt-4 text-xl font-semibold">Contact Details</h2>
      <p className="mt-1 text-gray-400">Select a conversation to see the contact's details here.</p>
    </div>
  );
}

// --- Message Bubble Components (Center Pane) ---

function SystemMessage({ text, timestamp }: { text: string, timestamp: string }) {
  return (
    <div className="text-center text-xs text-gray-400">
      <span className="font-medium text-gray-300">{text}</span> on {timestamp}
    </div>
  );
}

function BotMessage({ name, text, imageUrl, timestamp }: { name: string, text?: string | null, imageUrl?: string | null, timestamp: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-600">
        <Building className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-white">{name}</span>
          <span className="text-xs text-gray-400">{timestamp}</span>
        </div>
        <div className="mt-1 rounded-lg rounded-bl-none bg-gray-700 p-3 text-white">
          {imageUrl ? (
            <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                <img src={imageUrl} alt="Bot content" className="rounded-lg max-w-full h-auto cursor-pointer" />
            </a>
          ) : (
            <p>{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ name, text, imageUrl, timestamp, avatarBg }: { name: string, text?: string | null, imageUrl?: string | null, timestamp: string, avatarBg: string }) {
  return (
    <div className="flex items-start gap-3 justify-end"> {/* justify-end for user messages */}
      <div className="flex-1 text-right"> {/* Text aligned right */}
        <div className="flex items-baseline gap-2 justify-end"> {/* Timestamp and name aligned right */}
          <span className="text-xs text-gray-400">{timestamp}</span>
          <span className="font-semibold text-white">{name}</span>
        </div>
        <div className="mt-1 rounded-lg rounded-br-none bg-blue-600 p-3 text-white inline-block max-w-[80%]"> {/* background for user, inline-block to shrink */}
          {imageUrl ? (
            <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                <img src={imageUrl} alt="User content" className="rounded-lg max-w-full h-auto cursor-pointer" />
            </a>
          ) : (
            <p>{text}</p>
          )}
        </div>
      </div>
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${avatarBg}`}>
        {name.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}

function AdminMessage({ name, text, imageUrl, timestamp }: { name: string, text?: string | null, imageUrl?: string | null, timestamp: string }) {
    return (
      <div className="flex items-start gap-3 justify-end"> {/* Admin messages aligned right */}
        <div className="flex-1 text-right">
          <div className="flex items-baseline gap-2 justify-end">
            <span className="text-xs text-gray-400">{timestamp}</span>
            <span className="font-semibold text-white">{name}</span>
          </div>
          <div className="mt-1 rounded-lg rounded-br-none bg-indigo-600 p-3 text-white inline-block max-w-[80%]"> {/* Admin color */}
            {imageUrl ? (
              <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                  <img src={imageUrl} alt="Admin content" className="rounded-lg max-w-full h-auto cursor-pointer" />
              </a>
            ) : (
              <p>{text}</p>
            )}
          </div>
        </div>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500"> {/* Admin avatar */}
          <UserCheck className="h-4 w-4 text-white" />
        </div>
      </div>
    );
}

function UserTypingIndicator({ name, avatarBg }: { name: string, avatarBg: string }) {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="flex-1 text-right">
        <div className="mt-1 rounded-lg rounded-br-none bg-blue-600 p-3 text-white inline-block">
          <div className="flex items-center justify-center gap-1 h-4">
            <span className="h-2 w-2 animate-bounce rounded-full bg-white/70 [animation-delay:-0.3s]"></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-white/70 [animation-delay:-0.15s]"></span>
            <span className="h-2 w-2 animate-bounce rounded-full bg-white/70"></span>
          </div>
        </div>
      </div>
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${avatarBg}`}>
        {name.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}
