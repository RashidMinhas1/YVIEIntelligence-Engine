import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// In production, this MUST be set in .env
// For backward compatibility on existing local setups without it, we provide a fallback 32-byte key.
const FALLBACK_SECRET = 'yvie-default-dev-secret-key-0000';
const ENCRYPTION_KEY = Buffer.from(
  (process.env.ENCRYPTION_SECRET || FALLBACK_SECRET).padEnd(32, '0').slice(0, 32)
);

/**
 * Encrypts a plain text string (e.g. an API key) using AES-256-GCM.
 * @returns A string containing the iv, authTag, and ciphertext delimited by colons.
 */
export function encrypt(text: string): string {
  if (!text) return text;
  // If it's already encrypted (starts with enc:), don't double encrypt
  if (text.startsWith('enc:')) return text;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `enc:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted string back to plain text.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  // If it's not encrypted, return as is (backward compatibility)
  if (!encryptedText.startsWith('enc:')) return encryptedText;

  try {
    const parts = encryptedText.substring(4).split(':');
    if (parts.length !== 3) return encryptedText;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt value. Returning masked fallback.', err);
    return '***decryption-failed***';
  }
}

/**
 * Masks an API key for safe UI display (e.g. sk-...abcd)
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  // If we try to mask an encrypted key directly by mistake, decrypt it first
  const plain = key.startsWith('enc:') ? decrypt(key) : key;
  
  if (plain === '***decryption-failed***') return plain;
  if (plain.length < 8) return '***';
  
  const prefix = plain.substring(0, 3);
  const suffix = plain.substring(plain.length - 4);
  return `${prefix}...${suffix}`;
}
