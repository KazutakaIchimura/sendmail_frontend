export type FontSize = 'normal' | 'large' | 'xlarge';
export type BgColor = 'white' | 'black' | 'yellow' | 'blue';

export type AccessibilitySettings = {
  fontSize: FontSize;
  furigana: boolean;
  bgColor: BgColor;
};

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'normal',
  furigana: false,
  bgColor: 'white',
};
