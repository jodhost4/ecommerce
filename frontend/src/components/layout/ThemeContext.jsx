import { createContext, useContext } from 'react';

export const ThemeContext = createContext({
  pageLayouts: {},
  store: null,
});

export function useTheme() {
  return useContext(ThemeContext);
}
