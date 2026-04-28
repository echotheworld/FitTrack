import CryptoJS from 'crypto-js';

// In a production app, this key should be stored in a .env file and never committed to source control
const SECRET_KEY = 'fittrack-secure-encryption-key-2026';

/**
 * Encrypts a string or object using AES encryption.
 * @param {any} data - The data to encrypt.
 * @returns {string} - The encrypted string.
 */
export const encryptData = (data) => {
  if (data === null || data === undefined) return data;
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringData, SECRET_KEY).toString();
};

/**
 * Decrypts an AES encrypted string.
 * @param {string} ciphertext - The encrypted data.
 * @param {boolean} isObject - Whether the original data was an object.
 * @returns {any} - The decrypted data.
 */
export const decryptData = (ciphertext, isObject = false) => {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;
  
  // Clean potential "Value " prefix if it exists (some UI tools show it this way)
  const cleanCiphertext = ciphertext.startsWith('Value ') ? ciphertext.substring(6).trim() : ciphertext.trim();
  
  try {
    const bytes = CryptoJS.AES.decrypt(cleanCiphertext, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      console.log("Decryption failed for ciphertext:", cleanCiphertext.substring(0, 10) + "...");
      return cleanCiphertext; // Return original if decryption fails
    }
    
    return isObject ? JSON.parse(decryptedString) : decryptedString;
  } catch (error) {
    console.error("Decryption error for:", cleanCiphertext.substring(0, 10) + "...", error);
    return cleanCiphertext;
  }
};
