import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_LANG } from '@/localization';

interface SettingsState {
  /**
   * Catalog content language. The app is English-only (language selection was
   * removed), so this is fixed to English and never changes — it stays in state
   * only because the catalog filter reads it (see useVisibleCatalog).
   */
  language: string;
}

const initialState: SettingsState = {
  language: DEFAULT_LANG,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
});

export default settingsSlice.reducer;
