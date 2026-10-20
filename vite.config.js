import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Market(8082)·Trade(8083) 모두 5173 CORS를 열어 두어서, 브라우저가 직접 부른다.
// HATEOAS 링크가 절대 주소라서 프록시 없이 받은 주소를 그대로 따라가는 편이 맞다.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
