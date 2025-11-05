// src/components/chat-widget.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaCommentDots,
  FaPaperPlane,
  FaTimes,
  FaHeadset,
  FaCircle,
  FaImage,
  FaSpinner,
} from 'react-icons/fa';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  updateDoc,
  getDocs,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext'; // Ensure this context reliably provides the user

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_KEY ?? '';

const getLocalChatId = () => localStorage.getItem('supportChatId');
const setLocalChatId = (id: string) => localStorage.setItem('supportChatId', id);
const removeLocalChatId = () => localStorage.removeItem('supportChatId');

const formatTimestamp = (ts: Timestamp | null) => {
  if (!ts?.toDate) return null;
  return ts.toDate().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const TypingIndicator = () => (
  <div className="flex items-end gap-2 justify-start">
    <FaHeadset className="w-6 h-6 text-gray-400 bg-gray-700 p-1 rounded-full flex-shrink-0" />
    <div className="bg-gray-800 rounded-xl rounded-bl-none px-4 py-3">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"></span>
      </div>
    </div>
  </div>
);

export function ChatWidget() {
  const { user } = useAuth(); // Assumed to be null if not logged in, or { uid, displayName, email } if logged in.
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [agentStatus, setAgentStatus] = useState({ isOnline: false });
  const [agentIsTyping, setAgentIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when new messages or typing indicator appears
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM updates before scrolling
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages, isOpen, agentIsTyping]);

  // Load or create chat for logged-in users
  useEffect(() => {
    const loadOrCreateChatForUser = async () => {
      if (!user) {
        // If user logs out or is not logged in, clear chat state
        setChatId(null);
        setMessages([]);
        removeLocalChatId();
        return;
      }

      let currentChatId = getLocalChatId();
      let newChatCreated = false;

      if (currentChatId) {
        // Check if locally stored chat ID still exists and belongs to the current user
        const chatDoc = await getDocs(query(
          collection(db, 'supportChats'),
          where('userId', '==', user.uid),
          where('__name__', '==', currentChatId), // __name__ refers to doc ID
          limit(1)
        ));
        if (chatDoc.empty) {
          // Local chat ID is invalid or doesn't belong to this user, clear it
          currentChatId = null;
          removeLocalChatId();
        }
      }

      if (!currentChatId) {
        // Try to find an existing open chat for this user
        const q = query(
          collection(db, 'supportChats'),
          where('userId', '==', user.uid),
          where('status', '==', 'open'),
          limit(1)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          currentChatId = snap.docs[0].id;
        } else {
          // No existing open chat, create a new one
          const payload = {
            userId: user.uid,
            status: 'open',
            createdAt: serverTimestamp(),
            lastMessageTimestamp: serverTimestamp(),
            lastMessageSnippet: '',
            unreadByAdmin: false,
            unreadByUser: false,
            adminIsTyping: false,
            agentIsTyping: false,
            metadata: {
              name: user.displayName ?? 'User',
              email: user.email ?? null,
              page: typeof window !== 'undefined' ? window.location.pathname : '/', // Handle SSR
            },
          };
          const ref = await addDoc(collection(db, 'supportChats'), payload);
          currentChatId = ref.id;
          newChatCreated = true;
        }
      }

      // Update state only if chatId is different
      if (currentChatId && chatId !== currentChatId) {
        setChatId(currentChatId);
        setLocalChatId(currentChatId);
      }

      // Add welcome message if chat was newly created
      if (newChatCreated) {
        await addDoc(collection(db, 'supportChats', currentChatId!, 'messages'), {
          sender: 'bot',
          text: "Welcome to Salone Skills Connect! We're here to help.",
          timestamp: serverTimestamp(),
        });
      }
    };

    loadOrCreateChatForUser();
  }, [user, chatId]); // Include chatId in dependencies to re-run if it changes outside this effect (e.g. initial null)

  // Agent status listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'support', 'status'), (snap) => {
      if (snap.exists()) setAgentStatus({ isOnline: !!snap.data()?.isOnline });
    });
    return unsub;
  }, []);

  // Messages listener and admin typing status
  useEffect(() => {
    if (!chatId) {
      // When there's no chat ID (e.g., user not logged in or during initial loading),
      // display a default welcome message if the user is not logged in.
      // This state should ideally be empty for logged-in users until a chatId is established.
      if (!user) {
        setMessages([
          {
            id: 'welcome-no-user',
            sender: 'bot',
            text: "Please log in to start a chat with support.",
            timestamp: null,
          },
        ]);
      } else {
        setMessages([]); // Clear messages while waiting for chat ID for logged-in user
      }
      return;
    }

    const msgsRef = collection(db, 'supportChats', chatId, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'), limit(50));
    const unsubMessages = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (error) => {
      console.error("Error fetching messages:", error);
      // Optionally handle error, e.g., display a message to the user
    });

    const chatUnsub = onSnapshot(doc(db, 'supportChats', chatId), (snap) => {
      if (snap.exists()) setAgentIsTyping(!!snap.data()?.adminIsTyping);
    }, (error) => {
      console.error("Error fetching chat metadata:", error);
    });

    return () => {
      unsubMessages();
      chatUnsub();
    };
  }, [chatId, user]); // Depend on user to re-run if user status changes

  // Mark chat as read by user when widget is open
  useEffect(() => {
    if (isOpen && chatId) {
      updateDoc(doc(db, 'supportChats', chatId), { unreadByUser: false }).catch(console.error);
    }
  }, [isOpen, chatId]);

  // Function to send message to Firestore
  const sendMessageToFirestore = async (text: string, type: 'text' | 'image' = 'text') => {
    if (!chatId) {
      console.error("Cannot send message: no chatId available.");
      return;
    }

    const messageData: any = {
      sender: 'user',
      timestamp: serverTimestamp(),
      type,
    };

    if (type === 'image') {
      messageData.imageUrl = text; // For image, 'text' is the URL
      messageData.text = '';
    } else {
      messageData.text = text;
      messageData.imageUrl = null;
    }

    try {
      await addDoc(collection(db, 'supportChats', chatId, 'messages'), messageData);
      await updateDoc(doc(db, 'supportChats', chatId), {
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSnippet: type === 'image' ? 'User sent an image' : `User: ${text}`,
        unreadByAdmin: true,
        unreadByUser: false,
        adminIsTyping: false,
      });
    } catch (error) {
      console.error("Error sending message to Firestore:", error);
      alert("Failed to send message. Please try again.");
      // The onSnapshot will eventually reconcile, but an immediate alert is useful
    }
  };


  // Handle text message submission
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isUploading || !user) return; // Ensure user is logged in

    const txt = newMessage.trim();
    setNewMessage('');

    // Optimistically add the message to the UI
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID for immediate display
      sender: 'user',
      text: txt,
      imageUrl: null,
      timestamp: Timestamp.now(), // Client-side timestamp for display
    };
    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

    // Send to Firestore
    await sendMessageToFirestore(txt, 'text');
  };

  // Handle file upload (image)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !IMGBB_API_KEY || !user) { // Ensure user is logged in
      alert('Image upload not configured or user not logged in.');
      return;
    }
    setIsUploading(true);

    // Optimistically add the image message to the UI with a local URL
    const localImageUrl = URL.createObjectURL(file);
    const optimisticImageMessage = {
      id: `temp-image-${Date.now()}`,
      sender: 'user',
      text: '', // No text for image message initially
      imageUrl: localImageUrl,
      timestamp: Timestamp.now(),
    };
    setMessages((prevMessages) => [...prevMessages, optimisticImageMessage]);

    const fd = new FormData();
    fd.append('image', file);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();

      if (json.success) {
        // Send the actual image URL to Firestore
        await sendMessageToFirestore(json.data.url, 'image');
        // The onSnapshot listener will eventually replace the optimistic message
        // with the one from Firestore that has the permanent URL and Firestore ID.
        // For immediate visual consistency, you could also update the temp message's imageUrl here.
        // However, relying on onSnapshot simplifies this.
      } else {
        throw new Error(json.error?.message || 'ImageBB upload failed');
      }
    } catch (err) {
      console.error("Image upload error:", err);
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
      // On failure, remove the optimistic message
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== optimisticImageMessage.id));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Revoke the object URL to free memory
      URL.revokeObjectURL(localImageUrl);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    if (chatId && val && user) { // Ensure user is logged in for typing indicator
      // Set agentIsTyping (user is typing)
      updateDoc(doc(db, 'supportChats', chatId), { agentIsTyping: true }).catch(console.error);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        updateDoc(doc(db, 'supportChats', chatId), { agentIsTyping: false }).catch(console.error);
      }, 1000); // Stop typing indicator after 1 second of no input
    }
  };

  if (!user) {
    // Render a simplified widget if the user is not logged in
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-green-500 text-white shadow-lg hover:scale-110 transition"
          >
            <FaCommentDots className="h-7 w-7 mx-auto" />
          </button>
        )}

        {isOpen && (
          <div className="absolute bottom-0 right-0 w-96 h-[300px] bg-gray-900/90 backdrop-blur rounded-2xl shadow-2xl flex flex-col overflow-hidden">
             <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FaHeadset className="w-10 h-10 text-blue-300 bg-white/10 p-2 rounded-full" />
                <div>
                  <h3 className="font-semibold text-white">Support</h3>
                  <p className="text-xs text-gray-400">Please log in to chat.</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 p-4 text-center flex flex-col items-center justify-center text-gray-400">
              <p>You must be logged in to use support chat.</p>
              {/* Optionally add a login button here */}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render the full chat widget for logged-in users
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-green-500 text-white shadow-lg hover:scale-110 transition"
        >
          <FaCommentDots className="h-7 w-7 mx-auto" />
        </button>
      )}

      {isOpen && (
        <div className="absolute bottom-0 right-0 w-96 h-[500px] bg-gray-900/90 backdrop-blur rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <FaHeadset className="w-10 h-10 text-blue-300 bg-white/10 p-2 rounded-full" />
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-gray-900 ${
                    agentStatus.isOnline ? 'bg-green-400' : 'bg-gray-500'
                  }`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-white">Support</h3>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <FaCircle
                    className={`w-2 h-2 ${agentStatus.isOnline ? 'text-green-400' : 'text-gray-500'}`}
                  />
                  {agentStatus.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id} // This key is crucial for React's reconciliation
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender !== 'user' && (
                  <FaHeadset className="w-6 h-6 text-gray-400 bg-gray-700 p-1 rounded-full self-start" />
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-none'
                      : 'bg-gray-800 text-gray-200 rounded-bl-none'
                  }`}
                >
                  {m.imageUrl ? (
                    <a href={m.imageUrl} target="_blank" rel="noopener noreferrer">
                      <img src={m.imageUrl} alt="" className="rounded max-w-full" />
                    </a>
                  ) : (
                    <p>{m.text}</p>
                  )}
                  {formatTimestamp(m.timestamp) && (
                    <p
                      className={`text-xs mt-1 text-right ${
                        m.sender === 'user' ? 'text-blue-200/80' : 'text-gray-400'
                      }`}
                    >
                      {formatTimestamp(m.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {agentIsTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFile}
              accept="image/*"
              className="hidden"
              disabled={isUploading} // Disable file input while uploading
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-white disabled:opacity-50"
            >
              {isUploading ? <FaSpinner className="h-5 w-5 animate-spin" /> : <FaImage className="h-5 w-5" />}
            </button>
            <input
              placeholder="Type a message..."
              value={newMessage}
              onChange={onInputChange}
              disabled={isUploading || !chatId} // Disable input if no chatId or uploading
              className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isUploading || !chatId} // Disable send button if no text, uploading, or no chatId
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg p-2"
            >
              <FaPaperPlane className="h-5 w-5 text-white" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}