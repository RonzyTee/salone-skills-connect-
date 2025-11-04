// /app/(dashboard)/chat/page.tsx
'use client';

// This new file makes the base /chat route valid.
//
// It works by re-exporting the *exact same component*
// from your [uid]/page.tsx file.
//
// Your component is already smart enough to show the
// "Select a chat" message when the 'params.uid' is not available,
// which is exactly what we want for the base /chat page.

import ChatPage from './[uid]/page';

export default ChatPage;