import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from './theme.ts'
import App from './App.tsx'

const socialImageUrl = new URL('/og.png', window.location.origin).toString()
document.querySelectorAll<HTMLMetaElement>('meta[property="og:image"], meta[name="twitter:image"]')
  .forEach(meta => meta.setAttribute('content', socialImageUrl))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
