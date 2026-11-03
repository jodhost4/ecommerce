import { createContext, useContext } from 'react';

export const ThemeContext = createContext({
  pageLayouts: {},
  colors: {},
  fonts: {},
  footer: {},
  storeSlug: null,
  store: null,
  paymentMethods: ['cod'], // default: COD only
});

export function useTheme() {
  return useContext(ThemeContext);
}
