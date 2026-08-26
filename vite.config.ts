import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // A production bundle bakes VITE_API_BASE_URL in at build time. If the
  // variable is missing the app falls back to the development origin, which
  // produces a build that only works on the machine that built it — the exact
  // failure this check exists to prevent. Fail the build instead of shipping it.
  //
  // An empty value is valid and means "same origin"; only an undefined value
  // is a misconfiguration.
  if (command === 'build' && env.VITE_API_BASE_URL === undefined) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Define it in .env.production, or export it ' +
        'in the build environment (empty string = same origin, which is what a ' +
        'deployment behind the reverse proxy wants). See .env.example.',
    )
  }

  return { plugins: [react()] }
})
