import { create, StateCreator } from 'zustand';
import { createJSONStorage, persist, PersistOptions } from 'zustand/middleware';

export type User = {
    googleId: string | null;
    email: string | null;
    name: string | null;
    credits: number;
    subscriptionStatus: 'free' | 'premium' | 'pro';
}

type UserStore = {
    user: User | null;
    isLoading: boolean;
    setUser: (newUser: User) => void;
    updateCredits: (credits: number) => void;
    updateSubscription: (status: 'free' | 'premium' | 'pro') => void;
    clearUser: () => void;
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    setLoading: (loading: boolean) => void;
}

type MyPersist = (
    config: StateCreator<UserStore>,
    options: PersistOptions<UserStore>
  ) => StateCreator<UserStore>
  
export const useUserStore = create<UserStore>(
    (persist as MyPersist) (
        (set) => ({
            user: null,
            isLoading: false,

            setUser: (user) => set({ user, isLoading: false }),

            updateCredits: (credits) => set((state) => ({
                user: state.user ? { ...state.user, credits } : null
            })),

            updateSubscription: (subscriptionStatus) => set((state) => ({
                user: state.user ? { ...state.user, subscriptionStatus } : null
            })),

            clearUser: () => set({ user: null, isLoading: false }),

            setLoading: (isLoading) => set({ isLoading }),
            
            hasHydrated: false, // track hydration
            setHasHydrated: (state) => set({ hasHydrated: state }),
            
        }),

        {
            name: 'user-storage', // Name of the item in storage
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true); // mark as hydrated
              },
        },
    ),
    
)