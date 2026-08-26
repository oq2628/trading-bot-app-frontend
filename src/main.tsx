import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from './theme.ts'
import App from './App.tsx'

// Social crawlers need an absolute URL; index.html can only carry a relative
// one, so it is rewritten here at runtime.
const socialImageUrl = new URL('/og.jpg', window.location.origin).toString()
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
