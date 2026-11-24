import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
// In development the app calls /api/... and Vite forwards it to the MongoDB server (no CORS setup needed).
export default defineConfig({plugins:[react()],server:{proxy:{'/api':{target:process.env.API_TARGET||'http://localhost:4000',changeOrigin:true}}}})
