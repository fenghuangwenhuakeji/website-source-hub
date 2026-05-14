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
  points?: number;
  totalRecharge?: number;
  referralCode?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  bindingStatus?: {
    phoneBound?: boolean;
    phoneVerified?: boolean;
    wechatBound?: boolean;
    wechatBoundAt?: string | null;
  };
  duration?: {
    isActive?: boolean;
    isPermanent?: boolean;
    expiresAt?: string | null;
    canEnter?: boolean;
    remainingSeconds?: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: Record<string, any>, token: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

function normalizeUser(user: Record<string, any>): User {
  const raw = user as User & { userId?: number | string };
  return {
    ...raw,
    id: raw.id ?? raw.userId ?? '',
    email: raw.email ?? undefined,
    phone: raw.phone ?? undefined,
    avatar: raw.avatar ?? undefined,
    role: raw.role || 'user',
  };
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
