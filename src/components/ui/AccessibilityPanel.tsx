import clsx from 'clsx';
import { createPortal } from 'react-dom';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import type { FontSize, BgColor } from '@/types/accessibility';
import { X, RotateCcw } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type FontSizeOption = { value: FontSize; label: string; sample: string };
type BgColorOption = { value: BgColor; label: string; bg: string; text: string };

const FONT_SIZE_OPTIONS: FontSizeOption[] = [
  { value: 'normal', label: 'ふつう',       sample: 'あいう' },
  { value: 'large',  label: '大きい',       sample: 'あいう' },
  { value: 'xlarge', label: 'とても大きい', sample: 'あいう' },
];

const BG_COLOR_OPTIONS: BgColorOption[] = [
  { value: 'white',  label: 'しろ',   bg: '#ffffff', text: '#000000' },
  { value: 'black',  label: 'くろ',   bg: '#000000', text: '#ffffff' },
  { value: 'yellow', label: 'きいろ', bg: '#ffff00', text: '#000000' },
  { value: 'blue',   label: 'あお',   bg: '#003087', text: '#ffffff' },
];

const FURIGANA_OPTIONS = [
  { value: true,  label: 'ひょうじする',   sample: <>田中<span className="text-xs">（たなか）</span></> },
  { value: false, label: 'ひょうじしない', sample: <>田中</> },
];

/** フォントサイズ値から inline style の fontSize を返す */
const getFontSizeStyle = (value: FontSize): string => {
  if (value === 'normal') return '16px';
  if (value === 'large') return '22px';
  return '28px';
};

export const AccessibilityPanel = ({ isOpen, onClose }: Props) => {
  const { settings, setFontSize, setFurigana, setBgColor, resetSettings } =
    useAccessibility();

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="つかいやすさの設定"
        className="fixed top-0 right-0 z-50 h-full w-full max-w-sm overflow-y-auto bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between bg-gray-100 p-4">
          <h2 className="text-xl font-bold">⚙️ つかいやすさの設定</h2>
          <button
            onClick={onClose}
            aria-label="とじる"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-8">

          {/* ① もじの大きさ */}
          <section>
            <h3 className="mb-3 text-lg font-bold">もじの大きさ</h3>
            <div className="flex gap-3">
              {FONT_SIZE_OPTIONS.map(({ value, label, sample }) => (
                <button
                  key={value}
                  onClick={() => setFontSize(value)}
                  aria-pressed={settings.fontSize === value}
                  className={clsx(
                    'flex flex-1 flex-col items-center justify-center rounded-xl border-4 py-4 transition-all',
                    settings.fontSize === value
                      ? 'border-blue-600 bg-blue-50 font-bold'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  )}
                >
                  <span style={{ fontSize: getFontSizeStyle(value), lineHeight: 1.2 }}>
                    {sample}
                  </span>
                  <span className="mt-2 text-sm">{label}</span>
                  {settings.fontSize === value && (
                    <span className="mt-1 text-xs text-blue-600">✓ 選択中</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ② ふりがな */}
          <section>
            <h3 className="mb-3 text-lg font-bold">よみがな（ふりがな）</h3>
            <div className="flex gap-3">
              {FURIGANA_OPTIONS.map(({ value, label, sample }) => (
                <button
                  key={String(value)}
                  onClick={() => setFurigana(value)}
                  aria-pressed={settings.furigana === value}
                  className={clsx(
                    'flex flex-1 flex-col items-center justify-center rounded-xl border-4 py-5 transition-all',
                    settings.furigana === value
                      ? 'border-blue-600 bg-blue-50 font-bold'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  )}
                >
                  <span className="text-base">{sample}</span>
                  <span className="mt-2 text-sm">{label}</span>
                  {settings.furigana === value && (
                    <span className="mt-1 text-xs text-blue-600">✓ 選択中</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ③ はいけいの色 */}
          <section>
            <h3 className="mb-3 text-lg font-bold">はいけいの色</h3>
            <div className="grid grid-cols-2 gap-3">
              {BG_COLOR_OPTIONS.map(({ value, label, bg, text }) => (
                <button
                  key={value}
                  onClick={() => setBgColor(value)}
                  aria-pressed={settings.bgColor === value}
                  style={{ backgroundColor: bg, color: text }}
                  className={clsx(
                    'flex h-20 flex-col items-center justify-center rounded-xl border-4 transition-all',
                    settings.bgColor === value
                      ? 'border-blue-500 ring-2 ring-blue-500'
                      : 'border-gray-300 hover:border-gray-500'
                  )}
                >
                  <span className="text-lg font-bold">{label}</span>
                  {settings.bgColor === value && (
                    <span className="text-xs">✓ 選択中</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* もとにもどすボタン */}
          <button
            onClick={resetSettings}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-400 py-4 text-gray-700 hover:bg-gray-100"
          >
            <RotateCcw size={18} />
            <span className="font-bold">もとにもどす</span>
          </button>

        </div>
      </div>
    </>,
    document.body
  );
};
