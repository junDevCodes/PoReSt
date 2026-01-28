// Tailwind 설정 파일
// - 프로젝트의 “문서형 테마” 토큰을 Tailwind theme.extend로 승격
// - Astro/React/MDX 소스에서 유틸리티 클래스 스캔
import typography from '@tailwindcss/typography';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f9f9f8',
        ink: '#1f2937',
        muted: '#4b5563',
        heading: '#2c3e50',
        teal: '#34495e',
        link: '#0366d6',
        border: '#e5e5e5',
        code: '#f3f3f2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        reading: '70ch',
      },
    },
  },
  plugins: [typography],
};

