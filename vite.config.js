import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Market(8082)·Trade(8083)는 5173 CORS를 열어 두어서 브라우저가 직접 부른다.
// Chat(8080)은 아직 CORS 설정이 없어서, 개발 서버가 /chat-api 로 받아 대신 부른다.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/chat-api': {
          target: env.CHAT_SERVER_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/chat-api/, ''),
        },
      },
    },
  };
});
