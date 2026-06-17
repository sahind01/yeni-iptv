import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'mutlu-player-secret-key-2024';

export class CryptoUtils {
  // PIN hashleme
  static hashPin(pin: string): string {
    return CryptoJS.SHA256(pin + SECRET_KEY).toString();
  }

  // PIN doğrulama
  static verifyPin(pin: string, hash: string): boolean {
    const inputHash = this.hashPin(pin);
    return inputHash === hash;
  }

  // URL şifreleme (memory'de tutarken)
  static encryptUrl(url: string): string {
    return CryptoJS.AES.encrypt(url, SECRET_KEY).toString();
  }

  // URL çözme
  static decryptUrl(encryptedUrl: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedUrl, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Session token oluşturma
  static generateSessionToken(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return CryptoJS.SHA256(`${userId}-${timestamp}-${random}-${SECRET_KEY}`).toString();
  }
}
