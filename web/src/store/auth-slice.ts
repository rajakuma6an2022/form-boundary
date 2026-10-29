import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../api/schemas';

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'anonymous' | 'error';

export interface AuthState {
  user: User | null;
  accessToken: string | null; // memory only: never written to localStorage or sessionStorage
  status: AuthStatus;
}

export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  status: 'bootstrapping',
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    bootstrapStarted(state) {
      state.status = 'bootstrapping';
    },
    sessionStarted(state, action: PayloadAction<{ user: User; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = 'authenticated';
    },
    sessionCleared(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'anonymous';
    },
    bootstrapFailed(state) {
      state.status = 'error';
    },
  },
});

export const { bootstrapStarted, sessionStarted, sessionCleared, bootstrapFailed } = authSlice.actions;
export const authReducer = authSlice.reducer;