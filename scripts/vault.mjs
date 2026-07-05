// Chiffrement du bundle de données du dashboard (AES-256-GCM, clé dérivée
// par PBKDF2-SHA256). Le format de data est ciphertext||authTag en base64,
// directement compatible avec WebCrypto (crypto.subtle.decrypt) côté navigateur.
import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from "node:crypto";

export const PBKDF2_ITERATIONS = 210000;

export function encryptVault(password, payload) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf-8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  return JSON.stringify({
    v: 1,
    kdf: "PBKDF2-SHA256",
    iter: PBKDF2_ITERATIONS,
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    data: ciphertext.toString("base64"),
  });
}

export function decryptVault(password, fileContent) {
  const vault = JSON.parse(fileContent);
  const salt = Buffer.from(vault.salt, "base64");
  const iv = Buffer.from(vault.iv, "base64");
  const blob = Buffer.from(vault.data, "base64");
  const ciphertext = blob.subarray(0, blob.length - 16);
  const authTag = blob.subarray(blob.length - 16);
  const key = pbkdf2Sync(password, salt, vault.iter, 32, "sha256");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString("utf-8"));
}
