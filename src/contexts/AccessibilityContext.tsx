import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AccessibilitySettings, FontSize, BgColor } from '@/types/accessibility';
import { DEFAULT_SETTINGS } from '@/types/accessibility';

const STORAGE_KEY = 'accessibility_settings';

type AccessibilityContextType = {
  settings: AccessibilitySettings;
  setFontSize: (size: FontSize) => void;
  setFurigana: (enabled: boolean) => void;
  setBgColor: (color: BgColor) => void;
  resetSettings: () => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // NOTE: settings 変更時に localStorage と body クラスを同期する副作用
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    const body = document.body;
    body.classList.remove('font-normal', 'font-large', 'font-xlarge');
    body.classList.add(`font-${settings.fontSize}`);
  }, [settings]);

  const setFontSize = (fontSize: FontSize) =>
    setSettings(prev => ({ ...prev, fontSize }));

  const setFurigana = (furigana: boolean) =>
    setSettings(prev => ({ ...prev, furigana }));

  const setBgColor = (bgColor: BgColor) =>
    setSettings(prev => ({ ...prev, bgColor }));

  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  return (
    <AccessibilityContext.Provider
      value={{ settings, setFontSize, setFurigana, setBgColor, resetSettings }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) return {
    settings: DEFAULT_SETTINGS,
    setFontSize: (_: FontSize) => {},
    setFurigana: (_: boolean) => {},
    setBgColor: (_: BgColor) => {},
    resetSettings: () => {},
  };
  return ctx;
};
