import { useAccessibility } from '@/contexts/AccessibilityContext';

const FURIGANA_MAP: Record<string, string> = {
  '利用者':   'りようしゃ',
  '事業所':   'じぎょうしょ',
  '送付':     'そうふ',
  '計画':     'けいかく',
  '作成':     'さくせい',
  '報告書':   'ほうこくしょ',
  '管理':     'かんり',
  '登録':     'とうろく',
  '一覧':     'いちらん',
  '履歴':     'りれき',
  '送付済み': 'そうふずみ',
  '送付待ち': 'そうふまち',
  '完了':     'かんりょう',
  '確認':     'かくにん',
  '承認':     'しょうにん',
  '氏名':     'しめい',
  '住所':     'じゅうしょ',
  '郵便番号': 'ゆうびんばんごう',
  '電話番号': 'でんわばんごう',
  '権限':     'けんげん',
  '設定':     'せってい',
};

type FuriganaToken =
  | { type: 'ruby'; kanji: string; reading: string }
  | { type: 'char'; char: string };

/**
 * テキストを漢字トークンとそれ以外の文字トークンに分解する
 */
const tokenize = (text: string): FuriganaToken[] => {
  if (text.length === 0) return [];
  const match = Object.entries(FURIGANA_MAP).find(([kanji]) => text.startsWith(kanji));
  if (match) {
    const [kanji, reading] = match;
    return [{ type: 'ruby', kanji, reading }, ...tokenize(text.slice(kanji.length))];
  }
  return [{ type: 'char', char: text[0] }, ...tokenize(text.slice(1))];
};

type Props = {
  text: string;
  className?: string;
};

export const Furigana = ({ text, className }: Props) => {
  const { settings } = useAccessibility();

  if (!settings.furigana) {
    return <span className={className}>{text}</span>;
  }

  const tokens = tokenize(text);

  return (
    <span className={className}>
      {tokens.map((token, i) =>
        token.type === 'ruby' ? (
          <ruby key={i}>{token.kanji}<rt>{token.reading}</rt></ruby>
        ) : (
          <span key={i}>{token.char}</span>
        )
      )}
    </span>
  );
};
