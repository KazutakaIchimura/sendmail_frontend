import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { AccessibilitySettings, FontSize, BgColor } from '@/types/accessibility';
import { DEFAULT_SETTINGS } from '@/types/accessibility';
import { saveAccessibilitySettings } from '@/api/auth';

const STORAGE_KEY = 'accessibility_settings';

type AccessibilityContextType = {
  settings: AccessibilitySettings;
  setFontSize: (size: FontSize) => void;
  setFurigana: (enabled: boolean) => void;
  setBgColor: (color: BgColor) => void;
  resetSettings: () => void;
  applyServerSettings: (json: string | null) => void;
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

  // ログイン後にサーバー保存が有効になる
  const serverSyncEnabled = useRef(false);

  // settings 変更時に localStorage と body クラスを同期する副作用
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    const body = document.body;
    body.classList.remove('font-normal', 'font-large', 'font-xlarge');
    body.classList.add(`font-${settings.fontSize}`);
  }, [settings]);

  // settings 変更時にサーバーへデバウンス保存（500ms）
  useEffect(() => {
    if (!serverSyncEnabled.current) return;
    const timer = setTimeout(() => {
      saveAccessibilitySettings(settings).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [settings]);

  const setFontSize = (fontSize: FontSize) =>
    setSettings(prev => ({ ...prev, fontSize }));

  const setFurigana = (furigana: boolean) =>
    setSettings(prev => ({ ...prev, furigana }));

  const setBgColor = (bgColor: BgColor) =>
    setSettings(prev => ({ ...prev, bgColor }));

  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  // AuthContext がログイン後に呼び出す。サーバー設定が存在する場合のみ適用する
  const applyServerSettings = (json: string | null) => {
    serverSyncEnabled.current = true;
    if (json) {
      try {
        const parsed = JSON.parse(json) as Partial<AccessibilitySettings>;
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch {
        // パース失敗時は現在の設定を維持
      }
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{ settings, setFontSize, setFurigana, setBgColor, resetSettings, applyServerSettings }}
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
    applyServerSettings: (_: string | null) => {},
  };
  return ctx;
};
