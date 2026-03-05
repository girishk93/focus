import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore, ChatMessage } from '../../store/chat-store';
import { useAuthStore } from '../../store/auth-store';
import { Colors } from '../../constants/Colors';
import { GroupMember } from '../../store/groups-store';

interface ChatTabProps {
    groupId: string;
    members: GroupMember[];
}

export const ChatTab: React.FC<ChatTabProps> = ({ groupId, members }) => {
    const { user } = useAuthStore();
    const { getMessagesByGroup, sendMessage } = useChatStore();
    const messages = getMessagesByGroup(groupId);

    const [inputText, setInputText] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');

    // Track valid mentions for the current message
    // We'll parse the final text to confirm they are still there before sending, 
    // but for now we just track who was selected from the popup.
    const [selectedMentions, setSelectedMentions] = useState<string[]>([]);

    const flatListRef = useRef<FlatList>(null);

    const handleSend = () => {
        if (!inputText.trim() || !user) return;

        // Simple check to ensure we only include mentions that are actually in the text
        const finalMentions = members
            .filter(m => inputText.includes(`@${m.name}`))
            .map(m => m.userId);

        sendMessage(groupId, user.uid, user.name || 'User', inputText.trim(), finalMentions);
        setInputText('');
        setSelectedMentions([]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const handleTextChange = (text: string) => {
        setInputText(text);

        // Check for trigger character '@'
        const lastChar = text.slice(-1);
        if (lastChar === '@') {
            setShowMentions(true);
            setMentionQuery('');
        } else if (showMentions) {
            // If the user deletes the @ or types a space, close the popup
            if (!text.includes('@') || lastChar === ' ') {
                setShowMentions(false);
            } else {
                // Improve query extraction: get text after the last '@'
                const lastAtIndex = text.lastIndexOf('@');
                const query = text.substring(lastAtIndex + 1);
                setMentionQuery(query);
            }
        }
    };

    const handleMentionSelect = (member: GroupMember) => {
        // Replace the generic query with the specific name
        const lastAtIndex = inputText.lastIndexOf('@');
        const newText = inputText.substring(0, lastAtIndex) + `@${member.name} `;

        setInputText(newText);
        setSelectedMentions([...selectedMentions, member.userId]);
        setShowMentions(false);
    };

    const filteredMembers = members.filter(m =>
        m.userId !== user?.uid &&
        m.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMe = item.senderId === user?.uid;
        // Check if I was mentioned
        const isMentioned = !isMe && item.mentions.includes(user?.uid || '');

        return (
            <View className={`my-1.5 flex-row w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                    <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2 self-start mt-1 overflow-hidden">
                        {item.senderAvatar ? (
                            <Image source={{ uri: item.senderAvatar }} className="w-full h-full" />
                        ) : (
                            <Text className="text-xs font-bold text-gray-500">{item.senderName[0]}</Text>
                        )}
                    </View>
                )}
                <View
                    className={`max-w-[75%] px-3 py-2 rounded-lg shadow-sm ${isMe
                        ? 'bg-primary-600 rounded-tr-none'
                        : isMentioned
                            ? 'bg-yellow-50 border border-yellow-200 rounded-tl-none'
                            : 'bg-white border border-gray-100 rounded-tl-none'
                        }`}
                >
                    {!isMe && (
                        <Text className="text-sm font-bold text-teal-600 mb-0.5">
                            ~ {item.senderName}
                        </Text>
                    )}
                    <Text className={`text-[15px] leading-5 ${isMe ? 'text-white' : 'text-gray-900'}`}>
                        {item.content}
                    </Text>
                    <Text className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            className="flex-1 bg-white"
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                // Start from bottom? No, standard chat usually starts top but scrolls to bottom.
                // We'll auto-scroll on load.
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Mention Popup */}
            {showMentions && (
                <View className="absolute bottom-20 left-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 p-2 max-h-40">
                    <Text className="text-xs font-bold text-gray-500 mb-2 px-2">Mention a member:</Text>
                    {filteredMembers.length > 0 ? (
                        <FlatList
                            data={filteredMembers}
                            keyExtractor={(item) => item.userId}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="p-3 border-b border-gray-100 flex-row items-center"
                                    onPress={() => handleMentionSelect(item)}
                                >
                                    <View className="w-6 h-6 rounded-full bg-primary-100 items-center justify-center mr-2">
                                        <Text className="text-xs font-bold text-primary-600">{item.name[0]}</Text>
                                    </View>
                                    <Text className="font-medium">{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        <Text className="p-2 text-gray-400 italic">No matching members</Text>
                    )}
                </View>
            )}

            <View className="p-4 border-t border-gray-100 bg-white flex-row items-center">
                <TextInput
                    className="flex-1 bg-gray-50 p-3 rounded-full border border-gray-200 mr-2"
                    placeholder="Message..."
                    value={inputText}
                    onChangeText={handleTextChange}
                />
                <TouchableOpacity
                    onPress={handleSend}
                    className={`w-10 h-10 rounded-full items-center justify-center ${inputText.trim() ? 'bg-primary-600' : 'bg-gray-300'}`}
                    disabled={!inputText.trim()}
                >
                    <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};
