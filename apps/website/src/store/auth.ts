import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  clearSharedAuth,
  getSharedAuthSnapshot,
  writeSharedAuth,
} from '../utils/authStorage';

interface User {
  id: number | string;
  username: string;
  email?: string;
  phone?: string;
  nickname: string;
  avatar?: string;
  role: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  location?: string;
  website?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

function normalizeUser(user: User | (User & { userId?: number | string })) {
  const raw = user as User & { userId?: number | string };
  if ('id' in raw && raw.id !== undefined && raw.id !== null) {
    return user as User;
  }

  return {
    ...raw,
    id: raw.userId ?? '',
  } as User;
}

const initialAuth = getSharedAuthSnapshot<User>();

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: initialAuth.user,
      token: initialAuth.token,
      refreshToken: initialAuth.refreshToken,
      isAuthenticated: Boolean(initialAuth.token && initialAuth.user),

      setAuth: (user, token, refreshToken) => {
        const normalizedUser = normalizeUser(user);
        writeSharedAuth({
          token,
          refreshToken,
          user: normalizedUser,
        });

        set({
          user: normalizedUser,
          token,
          refreshToken,
          isAuthenticated: true,
        });
      },

      updateUser: (userData) =>
        set((state) => {
          const nextUser = state.user ? normalizeUser({ ...state.user, ...userData }) : null;
          writeSharedAuth({
            token: state.token,
            refreshToken: state.refreshToken,
            user: nextUser,
          });

          return {
            user: nextUser,
          };
        }),

      logout: () => {
        clearSharedAuth();
        localStorage.removeItem('fhwh-auth');

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'fhwh-auth',
      merge: (persistedState, currentState) => {
        const sharedAuth = getSharedAuthSnapshot<User>();

        if (sharedAuth.token && sharedAuth.user) {
          return {
            ...currentState,
            user: sharedAuth.user,
            token: sharedAuth.token,
            refreshToken: sharedAuth.refreshToken ?? currentState.refreshToken,
            isAuthenticated: true,
          };
        }

        return {
          ...currentState,
          ...(persistedState as Partial<AuthState>),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state?.token || !state.user) {
          return;
        }

        writeSharedAuth({
          token: state.token,
          refreshToken: state.refreshToken,
          user: state.user,
        });
      },
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (!event.key) {
      return;
    }

    if (!['fhwh-auth', 'fhwh_token', 'fhwh_refresh_token', 'fhwh_user', 'token', 'refreshToken', 'user'].includes(event.key)) {
      return;
    }

    const sharedAuth = getSharedAuthSnapshot<User>();

    useAuthStore.setState({
      user: sharedAuth.user,
      token: sharedAuth.token,
      refreshToken: sharedAuth.refreshToken,
      isAuthenticated: Boolean(sharedAuth.token && sharedAuth.user),
    });
  });
}
