import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
    id: string;
    groupId: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    timestamp: number;
    mentions: string[]; // params of userIds mentioned in this message
}

interface ChatState {
    messages: ChatMessage[];
    sendMessage: (groupId: string, senderId: string, senderName: string, content: string, mentions?: string[]) => void;
    getMessagesByGroup: (groupId: string) => ChatMessage[];
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            messages: [],

            sendMessage: (groupId, senderId, senderName, content, mentions = []) => {
                const newMessage: ChatMessage = {
                    id: Math.random().toString(36).substring(7),
                    groupId,
                    senderId,
                    senderName,
                    content,
                    timestamp: Date.now(),
                    mentions,
                };
                set((state) => ({
                    messages: [...state.messages, newMessage],
                }));
            },

            getMessagesByGroup: (groupId) => {
                return get().messages.filter((m) => m.groupId === groupId).sort((a, b) => a.timestamp - b.timestamp);
            },
        }),
        {
            name: 'chat-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
