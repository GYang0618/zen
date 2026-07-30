import { randomBytes } from 'node:crypto'

import { argon2id, argon2Verify } from 'hash-wasm'

/**
 * Hashes a password using Argon2id via WASM (hash-wasm).
 * Returns standard PHC encoded string ($argon2id$v=19$...).
 */
export async function hash(password: string): Promise<string> {
  const salt = randomBytes(16)
  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 3,
    memorySize: 65536,
    hashLength: 32,
    outputType: 'encoded'
  })
}

/**
 * Verifies a password against an Argon2 PHC hash.
 */
export async function verify(hash: string, password: string): Promise<boolean> {
  if (!hash || !password) {
    return false
  }
  try {
    return await argon2Verify({
      password,
      hash
    })
  } catch {
    return false
  }
}

const argon2 = {
  hash,
  verify
}

export default argon2
