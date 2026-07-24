import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Derives a 32-byte key from the environment variable
function getEncryptionKey(): Buffer {
  let secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    // Deterministic fallback for local dev. In production, ENCRYPTION_KEY must be set.
    secret = crypto.createHash("sha256").update("yvie-local-secret-key-fallback-v1").digest("hex");
  }
  // If the secret is exactly 64 hex chars (from the hash or env), parse it, or hash whatever was passed.
  if (secret.length === 64 && /^[0-9a-fA-F]+$/.test(secret)) {
      return Buffer.from(secret, 'hex').subarray(0, 32);
  }
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a plaintext string.
 * Returns a base64 encoded string containing the salt, iv, tag, and ciphertext.
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  // Format: v1:salt:iv:tag:ciphertext
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const key = crypto.pbkdf2Sync(getEncryptionKey(), salt, 100000, KEY_LENGTH, "sha512");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  
  const tag = cipher.getAuthTag();
  
  return `v1:${salt.toString("base64")}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted string.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  if (!encryptedText.startsWith("v1:")) {
    // If it's not our encrypted format, assume it was unencrypted legacy data
    return encryptedText;
  }
  
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 5) throw new Error("Invalid encryption format");
    
    const [version, salt64, iv64, tag64, ciphertext64] = parts;
    const salt = Buffer.from(salt64, "base64");
    const iv = Buffer.from(iv64, "base64");
    const tag = Buffer.from(tag64, "base64");
    
    const key = crypto.pbkdf2Sync(getEncryptionKey(), salt, 100000, KEY_LENGTH, "sha512");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(ciphertext64, "base64", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("[EncryptionService] Failed to decrypt value:", error);
    return ""; // Return empty string or throw depending on how we want to handle corrupt keys
  }
}

/**
 * Helper to determine if a string looks like a masked API key from the frontend
 */
export function isMaskedKey(key: string | undefined | null): boolean {
  if (!key) return false;
  return key.includes("********");
}

/**
 * Masks an API key for safe transmission to the frontend
 * e.g., sk-1234abcd -> sk-1234********abcd
 */
export function maskApiKey(key: string | undefined): string {
  if (!key) return "";
  if (key.length <= 8) return "********";
  
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}********${end}`;
}
