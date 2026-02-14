import { create } from 'zustand';

export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say';

export interface OnboardingState {
    name: string;
    dateOfBirth: Date | null;
    gender: Gender | null;
    selectedGoals: string[];

    setName: (name: string) => void;
    setDateOfBirth: (date: Date) => void;
    setGender: (gender: Gender) => void;
    toggleGoal: (goalId: string) => void;
    reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    name: '',
    dateOfBirth: null,
    gender: null,
    selectedGoals: [],

    setName: (name) => set({ name }),
    setDateOfBirth: (date) => set({ dateOfBirth: date }),
    setGender: (gender) => set({ gender }),
    toggleGoal: (goalId) => set((state) => {
        const goals = state.selectedGoals.includes(goalId)
            ? state.selectedGoals.filter(id => id !== goalId)
            : [...state.selectedGoals, goalId];
        return { selectedGoals: goals };
    }),
    reset: () => set({
        name: '',
        dateOfBirth: null,
        gender: null,
        selectedGoals: []
    })
}));
