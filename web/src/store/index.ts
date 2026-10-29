import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { authReducer } from './auth-slice';

const rootReducer = combineReducers({ auth: authReducer });

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];

export const store = makeStore();