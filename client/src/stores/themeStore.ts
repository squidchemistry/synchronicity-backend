import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state - default to dark theme
      theme: 'dark',

      // Actions
      setTheme: (theme: Theme) => {
        set({ theme });
        
        // Update document class
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
      },

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme to document on rehydration
        if (state?.theme) {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(state.theme);
        }
      },
    }
  )
);

// Initialize theme on module load
const initialTheme = useThemeStore.getState().theme;
const root = document.documentElement;
root.classList.remove('light', 'dark');
root.classList.add(initialTheme);