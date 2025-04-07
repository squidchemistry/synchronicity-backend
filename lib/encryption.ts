import crypto from "crypto"

// In a production environment, use a proper key management system
// and store this securely in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-secure-encryption-key-min-32-chars"
const IV_LENGTH = 16 // For AES, this is always 16

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  return `${iv.toString("hex")}:${encrypted}`
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)

  let decrypted = decipher.update(encryptedHex, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

