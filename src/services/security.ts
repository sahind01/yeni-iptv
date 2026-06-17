import { CryptoUtils } from '@/utils/crypto';

export class SecurityService {
  private static instance: SecurityService;
  private memoryStorage: Map<string, { data: string; timestamp: number }>;
  private readonly MEMORY_TTL = 30 * 60 * 1000; // 30 dakika

  private constructor() {
    this.memoryStorage = new Map();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Memory'de şifreli veri saklama
  setSecureData(key: string, data: string): void {
    const encrypted = CryptoUtils.encryptUrl(data);
    this.memoryStorage.set(key, {
      data: encrypted,
      timestamp: Date.now(),
    });
  }

  // Memory'den şifreli veri okuma
  getSecureData(key: string): string | null {
    const stored = this.memoryStorage.get(key);
    
    if (!stored) return null;
    
    // TTL kontrolü
    if (Date.now() - stored.timestamp > this.MEMORY_TTL) {
      this.memoryStorage.delete(key);
      return null;
    }
    
    return CryptoUtils.decryptUrl(stored.data);
  }

  // Memory'den veri silme
  removeSecureData(key: string): void {
    this.memoryStorage.delete(key);
  }

  // Tüm memory'yi temizleme
  clearAllSecureData(): void {
    this.memoryStorage.clear();
  }

  // Developer Tools koruması
  detectDevTools(): boolean {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    return widthThreshold || heightThreshold;
  }

  // Console temizleme
  clearConsole(): void {
    if (typeof window !== 'undefined') {
      console.clear();
    }
  }

  // Debug koruması
  disableDebugging(): void {
    if (typeof window !== 'undefined') {
      // Sağ tık engelleme
      document.addEventListener('contextmenu', (e) => {
        if (process.env.NODE_ENV === 'production') {
          e.preventDefault();
        }
      });

      // Klavye kısayolları engelleme
      document.addEventListener('keydown', (e) => {
        if (process.env.NODE_ENV === 'production') {
          // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
          if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'U')
          ) {
            e.preventDefault();
          }
        }
      });
    }
  }

  // URL obfuscation
  obfuscateUrl(url: string): string {
    // Base64 + karakter karıştırma
    const base64 = btoa(url);
    return base64.split('').reverse().join('');
  }

  // URL deobfuscation
  deobfuscateUrl(obfuscated: string): string {
    const reversed = obfuscated.split('').reverse().join('');
    return atob(reversed);
  }

  // XSS koruması
  sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
