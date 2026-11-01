import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE PARA GITHUB PAGES: Mude './' para '/nome-do-seu-repositorio/' se não usar domínio customizado
  base: './', 
})
