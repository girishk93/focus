import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabase';

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
    createGroup: (group: Omit<Group, 'id' | 'createdAt' | 'goals' | 'inviteCode'>) => string;
    deleteGroup: (groupId: string) => void;
    joinGroup: (inviteCode: string, user: { uid: string; name: string; photoURL?: string }) => Promise<void>;
    addMember: (groupId: string, member: Omit<GroupMember, 'joinedAt'>) => void;
    removeMember: (groupId: string, userId: string) => void;
    generateInviteCode: (groupId: string) => void;

    // Goal Actions
    addGoal: (groupId: string, goal: Omit<GroupGoal, 'id' | 'createdAt' | 'completions' | 'groupId'>) => void;
    deleteGoal: (groupId: string, goalId: string) => void;
    toggleGoalCompletion: (groupId: string, goalId: string, userId: string, userName: string) => void;

    // Pull from remote
    fetchUserGroups: (userId: string) => Promise<void>;

    // Getters
    getGroup: (groupId: string) => Group | undefined;
    getUserGroups: (userId: string) => Group[];
    getGroupGoals: (groupId: string) => GroupGoal[];
}

export const useGroupsStore = create<GroupsState>()(
    persist(
        (set, get) => ({
            groups: [],

            fetchUserGroups: async (userId: string) => {
                if (!userId) return;
                try {
                    // Fetch groups the user belongs to
                    const { data: memberRows, error: memberErr } = await supabase
                        .from('group_members')
                        .select('group_id')
                        .eq('user_id', userId);

                    if (memberErr) throw memberErr;
                    if (!memberRows || memberRows.length === 0) return;

                    const groupIds = memberRows.map(r => r.group_id);

                    const { data: groupData, error: groupErr } = await supabase
                        .from('groups')
                        .select(`
                            id, name, description, creator_id, invite_code, created_at,
                            group_members (user_id, role, joined_at, profiles!group_members_user_id_fkey(display_name, avatar_url)),
                            group_goals (id, title, description, icon, deadline, creator_id, created_at,
                                group_goal_completions (user_id, completed_at, profiles!group_goal_completions_user_id_fkey(display_name))
                            )
                        `)
                        .in('id', groupIds);

                    if (groupErr) throw groupErr;

                    if (groupData) {
                        const parsedGroups: Group[] = groupData.map((g: any) => ({
                            id: g.id,
                            name: g.name,
                            description: g.description,
                            createdBy: g.creator_id,
                            createdAt: g.created_at,
                            inviteCode: g.invite_code,
                            members: g.group_members.map((m: any) => ({
                                userId: m.user_id,
                                name: m.profiles?.display_name || 'Unknown',
                                photoURL: m.profiles?.avatar_url,
                                role: m.role,
                                joinedAt: m.joined_at
                            })),
                            goals: g.group_goals.map((goal: any) => ({
                                id: goal.id,
                                groupId: g.id,
                                title: goal.title,
                                description: goal.description,
                                icon: goal.icon,
                                deadline: goal.deadline,
                                createdBy: goal.creator_id,
                                createdAt: goal.created_at,
                                completions: goal.group_goal_completions?.map((c: any) => ({
                                    userId: c.user_id,
                                    userName: c.profiles?.display_name || 'Unknown',
                                    completedAt: c.completed_at
                                })) || []
                            }))
                        }));

                        set({ groups: parsedGroups });
                    }

                } catch (error) {
                    console.error('Error fetching groups from DB:', error);
                }
            },

            createGroup: (groupData) => {
                const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

                const newGroup: Group = {
                    ...groupData,
                    id: groupId,
                    createdAt: new Date().toISOString(),
                    goals: [],
                    inviteCode,
                };

                set((state) => ({ groups: [...state.groups, newGroup] }));

                // Supabase Sync Background
                (async () => {
                    const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                    if (userId) {
                        await supabase.from('groups').insert({
                            id: groupId,
                            name: groupData.name,
                            description: groupData.description || null,
                            creator_id: userId,
                            invite_code: inviteCode
                        });
                        await supabase.from('group_members').insert({
                            group_id: groupId,
                            user_id: userId,
                            role: 'admin'
                        });
                    }
                })();

                return groupId;
            },

            joinGroup: async (inviteCode, user) => {
                // Fetch group from Supabase using invite code
                const { data: groupData, error: fetchErr } = await supabase
                    .from('groups')
                    .select('*')
                    .eq('invite_code', inviteCode)
                    .single();

                if (fetchErr || !groupData) {
                    throw new Error('Invalid invite code');
                }

                const groupId = groupData.id;

                // Sync to DB first
                const { error: insertErr } = await supabase.from('group_members').insert({
                    group_id: groupId,
                    user_id: user.uid,
                    role: 'member'
                });

                if (insertErr && insertErr.code !== '23505') { // Ignore unique constraint if already member
                    throw new Error('Could not join group remotely');
                }

                // Fetch full groups state to update local store properly
                await get().fetchUserGroups(user.uid);
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
                // Realistically, update invite_code on Supabase too
                supabase.from('groups').update({ invite_code: inviteCode }).eq('id', groupId).then();
            },

            deleteGroup: (groupId) => {
                set((state) => ({
                    groups: state.groups.filter((group) => group.id !== groupId),
                }));
                supabase.from('groups').delete().eq('id', groupId).then();
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
                supabase.from('group_members').insert({
                    group_id: groupId,
                    user_id: memberData.userId,
                    role: memberData.role
                }).then();
            },

            removeMember: (groupId, userId) => {
                set((state) => ({
                    groups: state.groups.map((group) =>
                        group.id === groupId
                            ? {
                                ...group,
                                members: group.members.filter((member) => member.userId !== userId),
                                goals: group.goals.map((goal) => ({
                                    ...goal,
                                    completions: goal.completions.filter((c) => c.userId !== userId),
                                })),
                            }
                            : group
                    ),
                }));
                supabase.from('group_members').delete().match({ group_id: groupId, user_id: userId }).then();
            },

            addGoal: (groupId, goalData) => {
                const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const newGoal: GroupGoal = {
                    ...goalData,
                    groupId,
                    id: goalId,
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

                const userId = require('./auth-store').useAuthStore.getState().session?.user?.id;
                supabase.from('group_goals').insert({
                    id: goalId,
                    group_id: groupId,
                    creator_id: userId || goalData.createdBy,
                    title: goalData.title,
                    description: goalData.description || null,
                    icon: goalData.icon || null,
                    deadline: goalData.deadline || null
                }).then();
            },

            deleteGoal: (groupId, goalId) => {
                set((state) => ({
                    groups: state.groups.map((group) =>
                        group.id === groupId
                            ? { ...group, goals: group.goals.filter((goal) => goal.id !== goalId) }
                            : group
                    ),
                }));
                supabase.from('group_goals').delete().eq('id', goalId).then();
            },

            toggleGoalCompletion: (groupId, goalId, userId, userName) => {
                const { toLocalDateString } = require('../utils/date');
                const today = toLocalDateString();
                let wasAdded = true;

                set((state) => ({
                    groups: state.groups.map((group) =>
                        group.id === groupId
                            ? {
                                ...group,
                                goals: group.goals.map((goal) => {
                                    if (goal.id !== goalId) return goal;

                                    const todayCompletionIndex = goal.completions.findIndex((c) =>
                                        c.userId === userId && toLocalDateString(new Date(c.completedAt)) === today
                                    );

                                    if (todayCompletionIndex !== -1) {
                                        wasAdded = false;
                                        const newCompletions = [...goal.completions];
                                        newCompletions.splice(todayCompletionIndex, 1);
                                        return { ...goal, completions: newCompletions };
                                    } else {
                                        return {
                                            ...goal,
                                            completions: [
                                                ...goal.completions,
                                                { userId, userName, completedAt: new Date().toISOString() },
                                            ],
                                        };
                                    }
                                }),
                            }
                            : group
                    ),
                }));

                // DB Sync
                if (wasAdded) {
                    supabase.from('group_goal_completions').insert({
                        goal_id: goalId,
                        user_id: userId,
                    }).then();
                } else {
                    // Try to delete today's completion
                    (async () => {
                        const { data } = await supabase.from('group_goal_completions')
                            .select('id')
                            .eq('goal_id', goalId)
                            .eq('user_id', userId)
                            .gte('completed_at', today + 'T00:00:00Z');
                        if (data && data.length > 0) {
                            await supabase.from('group_goal_completions').delete().eq('id', data[0].id);
                        }
                    })();
                }
            },

            getGroup: (groupId) => get().groups.find((group) => group.id === groupId),
            getUserGroups: (userId) => get().groups.filter((group) => group.members.some((member) => member.userId === userId)),
            getGroupGoals: (groupId) => get().getGroup(groupId)?.goals || [],
        }),
        {
            name: 'groups-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
