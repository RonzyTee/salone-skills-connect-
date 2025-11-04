
'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  setDoc,
  writeBatch,
  increment,
  deleteDoc,
  runTransaction,
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter, useParams } from 'next/navigation';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
// --- UI Components ---
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// --- ICONS ---
import {
  FaSearch,
  FaPaperPlane,
  FaCircle,
  FaSpinner,
  FaEllipsisH,
  FaCheck,
  FaCheckDouble,
  FaPhone,
  FaInfoCircle,
  FaPaperclip,
  FaTrash,
  FaArrowLeft,
} from 'react-icons/fa';
import { toast } from 'sonner';

// --- Types ---
interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | null;
  seen: boolean;
  seenAt?: Timestamp | null;
  delivered: boolean;
  type?: 'text' | 'image';
  url?: string;
  reactions?: { [emoji: string]: string[] };
}

type MessageOrDate = ChatMessage | { type: 'date-separator'; date: string };

interface UserProfile {
  uid: string;
  fullName?: string;
  profilePictureUrl?: string;
}

interface ChatParticipant extends UserProfile {
    isOnline?: boolean;
    lastSeen?: Timestamp | null;
}

interface ChatListItemData {
  chatId: string;
  otherParticipant: ChatParticipant | null;
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Timestamp | null;
  } | null;
  unreadCount: { [key: string]: number } | null;
  updatedAt: Timestamp | null;
}

interface UserStatusData {
    isOnline: boolean;
    lastSeen: number | object | null;
}

// --- Helper Functions ---
const formatTimestamp = (timestamp: Timestamp | null): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  return format(date, 'p');
};
const formatDateHeader = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMMM d, yyyy');
};
const formatLastSeen = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'recently';
    try {
        const date = timestamp.toDate();
        const now = new Date();
        const diffSeconds = (now.getTime() - date.getTime()) / 1000;
        if (diffSeconds < 60) return 'just now';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
        return format(date, 'MMM d');
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'a while ago';
    }
};
const getChatId = (uid1: string, uid2: string): string => {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};

const playInCodeNotificationSound = () => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    try {
      const audioContext = new window.AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.error("Error playing in-code audio:", e);
    }
  }
};

const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};


// --- Main Chat Page Component ---
export default function ChatPage() {
  const { user: currentUser, userProfile: currentUserProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialMessagesLoad = useRef(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [chatList, setChatList] = useState<ChatListItemData[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedUserBasicInfo, setSelectedUserBasicInfo] = useState<ChatParticipant | null>(null);
  const [selectedUserStatus, setSelectedUserStatus] = useState<ChatParticipant | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  useEffect(() => {
    const targetUid = params.uid as string;
    isInitialMessagesLoad.current = true; 
    setSelectedChatId(null);
    setSelectedUserBasicInfo(null);
    setSelectedUserStatus(null);
    setMessages([]);

    if (currentUser?.uid && targetUid && currentUser.uid !== targetUid) {
      const chatId = getChatId(currentUser.uid, targetUid);
      setSelectedChatId(chatId);
      getDoc(doc(db, 'users', targetUid)).then(docSnap => {
        if (docSnap.exists()) {
          setSelectedUserBasicInfo(docSnap.data() as ChatParticipant);
        } else {
           console.warn("Target user for chat not found in users collection.");
           toast.error("User not found.");
        }
      }).catch(err => {
          console.error("Error fetching target user basic info:", err);
          toast.error("Failed to load user details.");
      });
    } else if (currentUser?.uid && targetUid && currentUser.uid === targetUid) {
      toast.info("You cannot chat with yourself.");
    }
  }, [currentUser?.uid, params.uid]);
  
  useEffect(() => {
    if (!selectedChatId || !currentUser?.uid) return;
  
    const chatDocRef = doc(db, 'chats', selectedChatId);
  
    getDoc(chatDocRef)
      .then(chatSnap => {
        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          const currentUnreadCount = chatData.unreadCount?.[currentUser.uid] ?? 0;
          
          if (currentUnreadCount > 0) {
            updateDoc(chatDocRef, {
              [`unreadCount.${currentUser.uid}`]: increment(-currentUnreadCount)
            }).catch(err => {
              console.error("Firebase permission error while clearing unread count. This is likely due to Firestore security rules.", err);
            });
          }
        }
      })
      .catch(err => {
        console.error("Failed to get chat document to clear unread count:", err);
      });
  
  }, [selectedChatId, currentUser?.uid]);


  useEffect(() => {
    const targetUid = params.uid as string;
    let unsubscribeStatus: () => void = () => {};
    if (currentUser?.uid && targetUid && targetUid !== currentUser.uid) {
        const userStatusRef = doc(db, 'users', targetUid);
        const listenerCallback = onSnapshot(userStatusRef, (doc) => {
            if (doc.exists()) {
                const statusData = doc.data() as ChatParticipant;
                setSelectedUserStatus(statusData);
            } else {
                setSelectedUserStatus(null);
            }
        }, (error) => {
            console.error(`Error listening to user status for ${targetUid}:`, error);
            toast.error("Could not get user status updates.");
            setSelectedUserStatus(null);
        });
        unsubscribeStatus = () => listenerCallback();
    } else {
        setSelectedUserStatus(null);
    }
    return () => {
        unsubscribeStatus();
    };
  }, [params.uid, currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoadingChats(false);
      return;
    }
    setIsLoadingChats(true);
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatsDataPromises = snapshot.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();
        const chatId = chatDoc.id;
        const participants = chatData.participants as string[];
        const otherUserId = participants.find(uid => uid !== currentUser.uid);
        let otherParticipantData: ChatParticipant | null = null;
        if (otherUserId) {
          try {
            const userDocSnap = await getDoc(doc(db, 'users', otherUserId));
            if (userDocSnap.exists()) {
              otherParticipantData = { uid: userDocSnap.id, ...userDocSnap.data() } as ChatParticipant;
            }
          } catch (error) {
             console.error(`Error fetching user data for ${otherUserId}:`, error);
          }
        }
        return {
          chatId: chatId,
          otherParticipant: otherParticipantData,
          lastMessage: chatData.lastMessage || null,
          unreadCount: chatData.unreadCount || null,
          updatedAt: chatData.updatedAt instanceof Timestamp ? chatData.updatedAt : null,
        };
      });
      const resolvedChatsData = await Promise.all(chatsDataPromises);
      const validChats = resolvedChatsData.filter(chat => chat.otherParticipant !== null);
      setChatList(validChats);
      setIsLoadingChats(false);
    }, (error) => {
      console.error("Error fetching chat list:", error);
      toast.error("Could not load your chats.");
      setIsLoadingChats(false);
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    const messagesQuery = query(
      collection(db, 'chats', selectedChatId, 'messages'),
      orderBy('timestamp', 'asc'),
    );
    
    const markMessagesAsSeen = (messagesToMark: ChatMessage[]) => {
      if (!currentUser?.uid || !selectedChatId) return;
      
      const batch = writeBatch(db);
      messagesToMark.forEach(msg => {
        if (msg.senderId !== currentUser.uid && !msg.seen) {
            const msgRef = doc(db, 'chats', selectedChatId, 'messages', msg.id);
            batch.update(msgRef, { delivered: true, seen: true, seenAt: serverTimestamp() });
        }
      });
      batch.commit().catch(err => console.error("Error marking messages as seen:", err));
    };

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      if (!isInitialMessagesLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newMessage = change.doc.data() as ChatMessage;
            if (newMessage.senderId !== currentUser?.uid) {
              playInCodeNotificationSound();
            }
          }
        });
      }
      isInitialMessagesLoad.current = false;

      const fetchedMessages = snapshot.docs.map(msgDoc => ({
            id: msgDoc.id,
            ...msgDoc.data(),
      })) as ChatMessage[];
      
      setMessages(fetchedMessages);
      setIsLoadingMessages(false);
      
      markMessagesAsSeen(fetchedMessages);

    }, (error) => {
        console.error("Error fetching messages:", error);
        toast.error("Could not load messages for this chat.");
        setIsLoadingMessages(false);
    });
    return () => unsubscribe();
  }, [selectedChatId, currentUser?.uid]);
  
  useEffect(() => {
    if (!selectedChatId || !selectedUserBasicInfo?.uid) {
      setIsOtherUserTyping(false);
      return;
    }

    const typingRef = doc(db, 'chats', selectedChatId, 'typing', selectedUserBasicInfo.uid);
    const unsubscribe = onSnapshot(typingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fiveSecondsAgo = Timestamp.now().seconds - 5;
        if (data.isTyping && data.timestamp && data.timestamp.seconds > fiveSecondsAgo) {
          setIsOtherUserTyping(true);
        } else {
          setIsOtherUserTyping(false);
        }
      } else {
        setIsOtherUserTyping(false);
      }
    });

    return () => unsubscribe();
  }, [selectedChatId, selectedUserBasicInfo?.uid]);

  useEffect(() => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);
  
  const updateTypingStatus = (typing: boolean) => {
    if (!currentUser?.uid || !selectedChatId) return;
    const typingRef = doc(db, 'chats', selectedChatId, 'typing', currentUser.uid);
    setDoc(typingRef, {
      isTyping: typing,
      timestamp: serverTimestamp(),
    });
  };
  
  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      updateTypingStatus(true);
    }
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
      typingTimeoutRef.current = null;
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser?.uid || !selectedChatId || !selectedUserBasicInfo?.uid) {
        return;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    updateTypingStatus(false);
    setIsSending(true);

    const otherUserId = selectedUserBasicInfo.uid;
    const timestamp = serverTimestamp(); // Use one timestamp for consistency
    
    // 1. Define all our database references
    const chatDocRef = doc(db, 'chats', selectedChatId);
    const messagesColRef = collection(db, 'chats', selectedChatId, 'messages');
    const newMessageRef = doc(messagesColRef); // Auto-generate ID for the new message

    // 2. Define the payloads
    const messageData = {
      senderId: currentUser.uid,
      text: newMessage.trim(),
      type: 'text',
      timestamp: timestamp,
      delivered: true, // We set to true because the batch will deliver it
      seen: false,
      seenAt: null,
    };
    
    const chatData = {
      participants: [currentUser.uid, otherUserId],
      updatedAt: timestamp,
      lastMessage: {
        text: messageData.text,
        senderId: messageData.senderId,
        timestamp: timestamp
      },
      // Increment the unread count for the *other* user
      [`unreadCount.${otherUserId}`]: increment(1)
    };

    // 3. Run everything in a single atomic batch
    try {
      const batch = writeBatch(db);

      // Operation 1: Create the new message document
      batch.set(newMessageRef, messageData);

      // Operation 2: Create or update the main chat document
      // { merge: true } handles both cases (first message vs. subsequent messages)
      batch.set(chatDocRef, chatData, { merge: true });

      await batch.commit();
      
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      // This will now correctly log any permission errors from the batch
      toast.error("Failed to send message. Check permissions.");
    } finally {
      setIsSending(false);
    }
  };
  
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser?.uid || !selectedChatId) return;

    const messageRef = doc(db, 'chats', selectedChatId, 'messages', messageId);

    try {
        await runTransaction(db, async (transaction) => {
            const msgDoc = await transaction.get(messageRef);
            if (!msgDoc.exists()) throw "Document does not exist!";

            const data = msgDoc.data();
            const reactions = data.reactions || {};
            
            let userPreviousReaction: string | null = null;
            for (const key in reactions) {
                if (reactions[key].includes(currentUser.uid)) {
                    userPreviousReaction = key;
                    reactions[key] = reactions[key].filter((uid: string) => uid !== currentUser.uid);
                    if (reactions[key].length === 0) delete reactions[key];
                }
            }
            
            if (userPreviousReaction !== emoji) {
                if (!reactions[emoji]) reactions[emoji] = [];
                reactions[emoji].push(currentUser.uid);
            }

            transaction.update(messageRef, { reactions });
        });
    } catch (error) {
        console.error("Failed to update reaction:", error);
        toast.error("Could not add reaction.");
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.uid || !selectedChatId || !selectedUserBasicInfo?.uid) return;

    setIsSending(true);
    const otherUserId = selectedUserBasicInfo.uid;
    try {
      const storage = getStorage();
      const fileRef = storageRef(storage, `chats/${selectedChatId}/images/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      const messageData = {
        senderId: currentUser.uid,
        text: '',
        type: 'image',
        url,
        timestamp: serverTimestamp(),
        delivered: false,
        seen: false,
        seenAt: null,
      };
      const chatDocRef = doc(db, 'chats', selectedChatId);
      
      await setDoc(chatDocRef, {
        participants: [currentUser.uid, otherUserId],
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const msgRef = await addDoc(collection(db, 'chats', selectedChatId, 'messages'), messageData);
      await updateDoc(msgRef, { delivered: true });

      await updateDoc(chatDocRef, {
        lastMessage: {
          text: '[Image]',
          senderId: messageData.senderId,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: increment(1)
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image.");
    } finally {
      setIsSending(false);
      e.target.value = '';
    }
  };

  const handleDeleteChat = async () => {
    if (!confirm('Are you sure you want to delete this entire chat history? This action cannot be undone.')) {
      return;
    }
    if (!selectedChatId) return;
    try {
      await deleteDoc(doc(db, 'chats', selectedChatId));
      toast.success('Chat deleted successfully.');
      router.push('/chat');
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat.");
    }
  };
  
  const handleSelectChat = (chatId: string) => {
    const chatInfo = chatList.find(c => c.chatId === chatId);
    const targetUid = chatInfo?.otherParticipant?.uid;
    if (targetUid) {
        router.push(`/chat/${targetUid}`, { scroll: false });
    } else {
        toast.error("Could not open chat. User data missing.");
    }
  };

  const filteredChatList = useMemo(() => {
    if (!searchQuery) return chatList;
    const lowerQuery = searchQuery.toLowerCase();
    return chatList.filter(chat =>
      chat.otherParticipant?.fullName?.toLowerCase().includes(lowerQuery)
    );
  }, [chatList, searchQuery]);

  const messagesWithDateSeparators = useMemo(() => {
    const items: MessageOrDate[] = [];
    let lastDate: Date | null = null;
    messages.forEach(msg => {
        if (msg.timestamp) {
            const messageDate = msg.timestamp.toDate();
            if (!lastDate || !isSameDay(lastDate, messageDate)) {
                items.push({ type: 'date-separator', date: formatDateHeader(messageDate) });
            }
            items.push(msg);
            lastDate = messageDate;
        }
    });
    return items;
  }, [messages]);
  
  const getStatusIcon = (msg: ChatMessage) => {
    if (!msg.delivered) return <FaCheck className="h-3 w-3 opacity-50" />;
    if (!msg.seen) return <FaCheckDouble className="h-3 w-3 opacity-50" />;
    return <FaCheckDouble className="h-3 w-3 text-white" />;
  };

  const Linkify = ({ text }: { text: string }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return (
      <>
        {text.split(urlRegex).map((part, i) =>
          part.match(urlRegex) ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline break-all">
              {part}
            </a>
          ) : ( part )
        )}
      </>
    );
  };

  if (authLoading) {
     return <div className="flex h-screen items-center justify-center bg-[#1A1C1E]"><FaSpinner className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }
  if (!currentUser) {
     return <div className="flex h-screen items-center justify-center bg-[#1A1C1E] text-slate-400">Please log in to view your chats.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem))] overflow-hidden bg-[#1A1C1E] text-slate-100 font-sans">
      {/* Left Pane: Chat List */}
      <aside className="w-1/3 min-w-[300px] max-w-[400px] border-r border-white/10 bg-[#212121] flex flex-col h-full">
        <header className="p-4 border-b border-white/10 flex-shrink-0 space-y-4">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={currentUserProfile?.profilePictureUrl} alt={currentUserProfile?.fullName} />
                    <AvatarFallback>{currentUserProfile?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <h1 className="text-xl font-bold text-white">Chats</h1>
            </div>
            <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search messages or users..."
                    className="bg-[#2D2D2D] border-none rounded-lg pl-10 pr-4 py-2 w-full text-slate-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </header>
        <ScrollArea className="flex-1">
            {isLoadingChats ? (
              <div className="flex justify-center items-center h-full p-10"> <FaSpinner className="h-6 w-6 animate-spin text-blue-500" /> </div>
            ) : filteredChatList.length === 0 ? (
              <p className="text-center text-gray-400 p-10">
                {searchQuery ? 'No results found.' : 'No chats yet.'}
              </p>
            ) : (
              <div className="p-2 space-y-1">
              {filteredChatList.map((chat: ChatListItemData) => { 
                const unreadCount = (chat.unreadCount && chat.unreadCount[currentUser.uid]) 
                                    ? chat.unreadCount[currentUser.uid] 
                                    : 0;
                const isActive = selectedChatId === chat.chatId;
                return (
                    <div
                      key={chat.chatId}
                      className={`flex items-start p-3 cursor-pointer rounded-lg transition-colors relative ${isActive ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
                      onClick={() => handleSelectChat(chat.chatId)}
                    >
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3/4 w-1 bg-blue-500 rounded-r-full"></div>}
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={chat.otherParticipant?.profilePictureUrl} alt={chat.otherParticipant?.fullName} />
                        <AvatarFallback>
                          {chat.otherParticipant?.fullName ? chat.otherParticipant.fullName.charAt(0) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 overflow-hidden ml-3">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold truncate text-white">
                            {chat.otherParticipant?.fullName || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500 flex-shrink-0 ml-2">
                               {chat.lastMessage?.timestamp ? format(chat.lastMessage.timestamp.toDate(), 'p') : ''}
                            </p>
                        </div>

                        <div className="flex justify-between items-start mt-1">
                            <p className={`text-sm truncate pr-2 ${unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                                {chat.lastMessage?.senderId === currentUser?.uid && <span className="opacity-80">You: </span>}
                                {truncateText(chat.lastMessage?.text, 30) || '...'}
                            </p>
                            {unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                                    {unreadCount}
                                </span>
                            )}
                        </div>

                      </div>
                    </div>
                )
              })}
              </div>
            )}
        </ScrollArea>
      </aside>

      {/* Right Pane: Chat Window */}
      <main className="flex-1 flex flex-col bg-[#1A1C1E] h-full">
         {selectedChatId && selectedUserBasicInfo ? (
             <>
               <header className="flex items-center p-3.5 border-b border-white/10 bg-[#212121] shadow-sm flex-shrink-0 z-10">
                 <button onClick={() => router.push('/chat')} className="md:hidden mr-2 p-2 rounded-full hover:bg-white/10">
                    <FaArrowLeft />
                 </button>
                 <Avatar className="h-10 w-10 mr-4">
                     <AvatarImage src={selectedUserBasicInfo.profilePictureUrl} alt={selectedUserBasicInfo.fullName} />
                     <AvatarFallback>
                         {selectedUserBasicInfo.fullName ? selectedUserBasicInfo.fullName.charAt(0) : '?'}
                     </AvatarFallback>
                 </Avatar>
                 <div className="flex-1">
                     <p className="font-semibold text-white text-base leading-tight">{selectedUserBasicInfo.fullName}</p>
                     <p className="text-xs text-gray-400 flex items-center">
                        {isOtherUserTyping ? (
                             <span className="italic text-green-400">typing...</span>
                        ) : selectedUserStatus?.isOnline ? (
                             <>
                                 <FaCircle className="mr-1.5 h-2 w-2 text-green-400" />
                                 Online
                             </>
                         ) : (
                            <>
                                 <FaCircle className={`mr-1.5 h-2 w-2 text-gray-500`} />
                                 {`Last seen ${formatLastSeen(selectedUserStatus?.lastSeen ?? null)}`}
                             </>
                         )}
                     </p>
                 </div>
                 
                 <div className="ml-auto flex items-center">
                     <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-50" disabled title="Call (coming soon)">
                         <FaPhone className="h-5 w-5" />
                     </Button>
                     <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-50" disabled title="About (coming soon)">
                         <FaInfoCircle className="h-5 w-5" />
                     </Button>
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
                           <FaEllipsisH className="h-5 w-5" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent className="w-48 bg-[#2D2D2D] border-white/20 text-slate-200">
                         <DropdownMenuItem
                           className="text-red-400 focus:bg-[#3C3F44] focus:text-red-300"
                           onSelect={handleDeleteChat}
                         >
                           <FaTrash className="mr-2 h-4 w-4" />
                           Delete Chat
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                 </div>
               </header>
               
               <ScrollArea className="flex-1 p-6">
                 {isLoadingMessages ? (
                   <div className="flex justify-center items-center h-full"><FaSpinner className="h-8 w-8 animate-spin text-blue-400" /></div>
                 ) : messages.length === 0 ? (
                   <p className="text-center text-gray-400 pt-10">No messages here yet. Send one!</p>
                 ) : (
                   <div className="space-y-6 pb-4">
                       {messagesWithDateSeparators.map((item) => {
                           if ('type' in item && item.type === 'date-separator') {
                               return (
                                   <div key={item.date} className="relative py-4">
                                       <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                           <div className="w-full border-t border-white/10"></div>
                                       </div>
                                       <div className="relative flex justify-center">
                                           <span className="bg-[#1A1C1E] px-3 text-xs font-medium text-gray-400">
                                               {item.date}
                                           </span>
                                       </div>
                                   </div>
                               );
                           }
                           const msg = item;
                           const isSender = msg.senderId === currentUser?.uid;
                           const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
                           return (
                               <div key={msg.id} className={`group relative flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`absolute top-[-16px] z-10 hidden group-hover:flex bg-[#2D2D2D] border border-white/10 rounded-full shadow-lg ${isSender ? 'right-2' : 'left-2'}`}>
                                      {REACTION_EMOJIS.map(emoji => (
                                          <button 
                                              key={emoji}
                                              onClick={() => handleReaction(msg.id, emoji)}
                                              className="p-1.5 hover:bg-white/10 rounded-full transition-transform hover:scale-125 text-lg"
                                          >
                                              {emoji}
                                          </button>
                                      ))}
                                  </div>
                                   <div className={`relative max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${ isSender ? 'bg-blue-500 text-white rounded-br-lg' : 'bg-[#2A2D31] text-slate-200 rounded-bl-lg'}`}>
                                     {msg.type === 'image' ? (
                                       <img src={msg.url} alt="User upload" className="max-w-xs max-h-80 rounded-lg object-cover" />
                                     ) : (
                                       <p className="break-words leading-relaxed"><Linkify text={msg.text} /></p>
                                     )}
                                     {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                        <div className={`absolute -bottom-3 flex gap-1 ${isSender ? 'right-2' : 'left-2'}`}>
                                          {Object.entries(msg.reactions).map(([emoji, uids]) => (
                                              Array.isArray(uids) && uids.length > 0 && (
                                                  <div key={emoji} className="bg-[#2D2D2D] rounded-full px-2 py-0.5 text-xs flex items-center gap-1 border border-white/10 shadow-md">
                                                      <span>{emoji}</span>
                                                      <span className="text-slate-300 font-medium">{uids.length}</span>
                                                  </div>
                                              )
                                          ))}
                                        </div>
                                      )}
                                       <div className={`flex items-center gap-1.5 mt-1.5 text-[11px] ${isSender ? 'justify-end text-blue-100/70' : 'justify-start text-gray-400'}`}>
                                           <span>{formatTimestamp(msg.timestamp)}</span>
                                           {isSender && getStatusIcon(msg)}
                                       </div>
                                   </div>
                               </div>
                           );
                       })}
                       {messages.length > 0 && (() => {
                         const lastMessage = messages[messages.length - 1];
                         if (lastMessage.senderId === currentUser?.uid && lastMessage.seen && lastMessage.seenAt) {
                           return (
                             <div className="flex justify-end text-xs text-gray-400 mt-1 pr-1">
                               Seen at {formatTimestamp(lastMessage.seenAt)}
                             </div>
                           );
                         }
                         return null;
                       })()}
                   </div>
                 )}
                 <div ref={messagesEndRef} />
               </ScrollArea>
               
               <footer className="p-4 border-t border-white/10 bg-[#212121] flex-shrink-0">
                   <div className="relative flex items-center">
                       <div className="absolute left-3 z-10">
                            <Button
                                variant="ghost" size="icon"
                                className="text-gray-400 hover:text-white rounded-full"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSending || isLoadingMessages}
                            >
                                <FaPaperclip className="h-5 w-5" />
                            </Button>
                            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleUploadImage} />
                       </div>
                       <Input
                           type="text"
                           placeholder="Type a message..."
                           className="w-full bg-[#2A2D31] border-none rounded-full h-12 px-12 pr-14 text-white placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:ring-offset-[#212121]"
                           value={newMessage}
                           onChange={handleTypingChange}
                           onKeyPress={(e) => { if (e.key === 'Enter' && !isSending) { handleSendMessage(); } }}
                           disabled={isSending || isLoadingMessages}
                       />
                       <div className="absolute right-2 flex items-center justify-center">
                            <Button
                                onClick={handleSendMessage}
                                size="icon"
                                className={`rounded-full bg-blue-500 hover:bg-blue-600 text-white w-9 h-9 transition-all duration-200 ease-in-out disabled:bg-gray-600`}
                                style={{ transform: newMessage.trim() && !isSending ? 'scale(1)' : 'scale(0)', opacity: newMessage.trim() && !isSending ? 1 : 0, position: 'absolute' }}
                                disabled={!newMessage.trim() || isSending || isLoadingMessages}
                            >
                               <FaPaperPlane className="h-4 w-4" />
                            </Button>
                            {isSending && 
                                <div className="w-9 h-9 flex items-center justify-center">
                                    <FaSpinner className="h-5 w-5 animate-spin text-gray-400"/>
                                </div>
                            }
                       </div>
                   </div>
               </footer>
             </>
         ) : (
           <div className="flex flex-col items-center justify-center h-full text-gray-500">
               <svg className="w-28 h-28 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
               <p className="text-xl font-medium text-gray-400">Select a chat to start messaging</p>
               <p className="text-sm">Your conversations will appear here.</p>
           </div>
         )}
      </main>
    </div>
  );
}
