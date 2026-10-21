import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Market·Trade는 브라우저가 직접 호출한다. 각 서버에서 프론트의 실제 Origin을 CORS로 허용해야 한다.
// Chat(8080)은 아직 CORS 설정이 없어서, 개발 서버가 /chat-api 로 받아 대신 부른다.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: env.FRONTEND_HOST || 'localhost',
      port: 5173,
      strictPort: true,
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
