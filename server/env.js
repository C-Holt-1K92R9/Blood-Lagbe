/* Loaded for its side effect, before any module that reads process.env.
   Node's built-in loader keeps this dependency-free. */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

try {
  process.loadEnvFile(path.join(root, '.env'))
} catch {
  // .env is optional when the environment is configured another way.
}

export const projectRoot = root
