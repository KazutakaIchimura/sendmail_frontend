import dadsThemePlugin from '@digital-go-jp/tailwind-theme-plugin';

// 本アプリのブランドカラーは緑系のため、DADSの既定キーカラー（青系）を緑スケールで上書きする
const greenScale = dadsThemePlugin.config.theme.extend.colors.green;

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { mono: ['Noto Sans Mono'] },
      colors: { key: greenScale },
    },
  },
  plugins: [dadsThemePlugin],
};
