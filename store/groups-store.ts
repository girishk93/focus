import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../utils/storage';

export interface GroupMember {
    userId: string;
    name: string;
    photoURL?: string;
    role: 'admin' | 'member';
    joinedAt: string;
}

export interface GoalCompletion {
    userId: string;
    userName: string;
    completedAt: string;
}

export interface GroupGoal {
    id: string;
    groupId: string;
    title: string;
    description?: string;
    icon?: string;
    deadline?: string;
    createdBy: string;
    createdAt: string;
    completions: GoalCompletion[];
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
    createdAt: string;
    members: GroupMember[];
    goals: GroupGoal[];
    inviteCode: string;
}

interface GroupsState {
    groups: Group[];

    // Group Actions
    createGroup: (group: Omit<Group, 'id' | 'createdAt' | 'goals' | 'inviteCode'>) => string; // Return groupId
    deleteGroup: (groupId: string) => void;
    joinGroup: (inviteCode: string, user: { uid: string; name: string; photoURL?: string }) => void;
    addMember: (groupId: string, member: Omit<GroupMember, 'joinedAt'>) => void;
    removeMember: (groupId: string, userId: string) => void;
    generateInviteCode: (groupId: string) => void;

    // Goal Actions
    addGoal: (groupId: string, goal: Omit<GroupGoal, 'id' | 'createdAt' | 'completions' | 'groupId'>) => void;
    deleteGoal: (groupId: string, goalId: string) => void;
    toggleGoalCompletion: (groupId: string, goalId: string, userId: string, userName: string) => void;

    // Getters
    getGroup: (groupId: string) => Group | undefined;
    getUserGroups: (userId: string) => Group[];
    getGroupGoals: (groupId: string) => GroupGoal[];
}

export const useGroupsStore = create<GroupsState>()(
    persist(
        (set, get) => ({
            groups: [],

            createGroup: (groupData) => {
                const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                // Generate a random 6-character invite code (uppercase alphanumeric)
                const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

                const newGroup: Group = {
                    ...groupData,
                    id: groupId,
                    createdAt: new Date().toISOString(),
                    goals: [],
                    inviteCode,
                };

                set((state) => ({
                    groups: [...state.groups, newGroup],
                }));

                return groupId;
            },

            joinGroup: (inviteCode, user) => {
                const groups = get().groups;
                const group = groups.find(g => g.inviteCode === inviteCode);

                if (!group) {
                    throw new Error('Invalid invite code');
                }

                if (group.members.some(m => m.userId === user.uid)) {
                    throw new Error('You are already a member of this group');
                }

                const newMember: GroupMember = {
                    userId: user.uid,
                    name: user.name,
                    photoURL: user.photoURL,
                    role: 'member',
                    joinedAt: new Date().toISOString(),
                };

                set((state) => ({
                    groups: state.groups.map((g) =>
                        g.id === group.id
                            ? { ...g, members: [...g.members, newMember] }
                            : g
                    ),
                }));
            },

            generateInviteCode: (groupId) => {
                const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                set((state) => ({
                    groups: state.groups.map((group) =>
                        group.id === groupId
                            ? { ...group, inviteCode: group.inviteCode || inviteCode }
                            : group
                    ),
                }));
            },

            deleteGroup: (groupId) => {
                set((state) => ({
                    groups: state.groups.filter((group) => group.id !== groupId),
                }));
            },

            addMember: (groupId, memberData) => {
                const newMember: GroupMember = {
                    ...memberData,
                    joinedAt: new Date().toISOString(),
                };

                set((state) => ({
                    groups: state.groups.map((group) =>
                        group.id === groupId
                            ? { ...group, members: [...group.members, newMember] }
                            : group
                    ),
                }));
            },

            removeMember: (groupId, userId) => {
                set((state) => ({
                    groups: state.groups.map((group) =>
                        group.id === groupId
                            ? {
                                ...group,
                                members: group.members.filter((member) => member.userId !== userId),
                                // Clean up completions for removed member
                                goals: group.goals.map((goal) => ({
                                    ...goal,
                                    completions: goal.completions.filter((c) => c.userId !== userId),
                                })),
                            }
                            : group
                    ),
                }));
            },

            addGoal: (groupId, goalData) => {
                const newGoal: GroupGoal = {
                    ...goalData,
                    groupId,
                    id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    createdAt: new Date().toISOString(),
                    completions: [],
                };

                set((state) => ({
                    groups: state.groups.map((group) =>
                        group.id === groupId
                            ? { ...group, goals: [...group.goals, newGoal] }
                            : group
                    ),
                }));
            },

            deleteGoal: (groupId, goalId) => {
                set((state) => ({
                    groups: state.groups.map((group) =>
                        group.id === groupId
                            ? { ...group, goals: group.goals.filter((goal) => goal.id !== goalId) }
                            : group
                    ),
                }));
            },

            toggleGoalCompletion: (groupId, goalId, userId, userName) => {
                set((state) => ({
                    groups: state.groups.map((group) =>
                        group.id === groupId
                            ? {
                                ...group,
                                goals: group.goals.map((goal) => {
                                    if (goal.id !== goalId) return goal;

                                    const { toLocalDateString } = require('../utils/date');
                                    const today = toLocalDateString();

                                    // Check if user has completed this goal *today*
                                    const todayCompletionIndex = goal.completions.findIndex((c) =>
                                        c.userId === userId && toLocalDateString(new Date(c.completedAt)) === today
                                    );

                                    if (todayCompletionIndex !== -1) {
                                        // Remove today's completion (toggle off)
                                        const newCompletions = [...goal.completions];
                                        newCompletions.splice(todayCompletionIndex, 1);
                                        return {
                                            ...goal,
                                            completions: newCompletions,
                                        };
                                    } else {
                                        // Add completion for today
                                        return {
                                            ...goal,
                                            completions: [
                                                ...goal.completions,
                                                {
                                                    userId,
                                                    userName,
                                                    completedAt: new Date().toISOString(),
                                                },
                                            ],
                                        };
                                    }
                                }),
                            }
                            : group
                    ),
                }));
            },

            getGroup: (groupId) => {
                return get().groups.find((group) => group.id === groupId);
            },

            getUserGroups: (userId) => {
                return get().groups.filter((group) =>
                    group.members.some((member) => member.userId === userId)
                );
            },

            getGroupGoals: (groupId) => {
                const group = get().getGroup(groupId);
                return group?.goals || [];
            },
        }),
        {
            name: 'groups-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
