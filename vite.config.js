// D:\web-project\gifts-web-chat-vite\vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 🛑 تأكد من عدم وجود أي كود يتعلق بـ 'css' أو 'postcss' هنا
})