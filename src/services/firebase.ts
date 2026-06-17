import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove, push, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import type { Channel, Favorite, RecentWatch, UserSettings } from '@/types';

const firebaseConfig = {
  apiKey: "AIzaSyB90dED2Kccuop75bEMKSRILimmmu5hk6Q",
  authDomain: "mutluapk-803a4.firebaseapp.com",
  databaseURL: "https://mutluapk-803a4-default-rtdb.firebaseio.com",
  projectId: "mutluapk-803a4",
  storageBucket: "mutluapk-803a4.firebasestorage.app",
  messagingSenderId: "759375266397",
  appId: "1:759375266397:web:e33a70e3a1ebdb108343b4",
  measurementId: "G-G7KRWJVCEE"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

export class FirebaseService {
  
  // ==================== KULLANICI GİRİŞ (Realtime Database) ====================
  
  static async loginUser(site: string, username: string, password: string) {
    try {
      // users/{userId} yolundan kullanıcıyı kontrol et
      const userId = `${site}_${username}`.toLowerCase().replace(/\s+/g, '_');
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        // Yeni kullanıcı oluştur
        await set(userRef, {
          username: username,
          site: site,
          password: password,
          createdAt: Date.now(),
          lastLogin: Date.now(),
          settings: {
            theme: 'dark',
            autoPlay: true,
            preferredQuality: 'auto',
            language: 'tr',
            bufferSize: 30,
          }
        });
      } else {
        // Şifre kontrolü
        const userData = snapshot.val();
        if (userData.password !== password) {
          throw new Error('Hatalı şifre');
        }
        // Son girişi güncelle
        await update(userRef, { lastLogin: Date.now() });
      }

      return userId;
    } catch (error: any) {
      if (error.message === 'Hatalı şifre') throw error;
      throw new Error('Giriş yapılamadı: ' + error.message);
    }
  }

  static async getUserData(userId: string) {
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
      return null;
    }
  }

  static async updateUserSettings(userId: string, settings: Partial<UserSettings>) {
    try {
      const settingsRef = ref(db, `users/${userId}/settings`);
      await update(settingsRef, settings);
    } catch (error) {
      console.error('Ayarlar güncellenemedi:', error);
      throw error;
    }
  }

  // ==================== FAVORİ İŞLEMLERİ ====================

  static async addToFavorites(userId: string, channel: Channel) {
    try {
      const favRef = ref(db, `favorites/${userId}/${channel.id}`);
      
      await set(favRef, {
        channelId: channel.id,
        channel: {
          id: channel.id,
          name: channel.name,
          logo: channel.logo,
          group: channel.group,
          quality: channel.quality,
          tvgId: channel.tvgId || '',
          tvgName: channel.tvgName || '',
        },
        addedAt: Date.now(),
      });
    } catch (error) {
      console.error('Favori eklenemedi:', error);
      throw error;
    }
  }

  static async removeFromFavorites(userId: string, channelId: string) {
    try {
      const favRef = ref(db, `favorites/${userId}/${channelId}`);
      await remove(favRef);
    } catch (error) {
      console.error('Favori silinemedi:', error);
      throw error;
    }
  }

  static async getFavorites(userId: string): Promise<Favorite[]> {
    try {
      const favRef = ref(db, `favorites/${userId}`);
      const snapshot = await get(favRef);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const favorites: Favorite[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        userId: userId,
        channelId: value.channelId,
        channel: value.channel,
        addedAt: value.addedAt,
      }));
      
      // Tarihe göre sırala (en yeni önce)
      favorites.sort((a, b) => b.addedAt - a.addedAt);
      
      return favorites;
    } catch (error) {
      console.error('Favoriler alınamadı:', error);
      return [];
    }
  }

  // ==================== SON İZLENENLER ====================

  static async addRecentWatch(userId: string, channel: Channel) {
    try {
      const recentRef = ref(db, `recentWatches/${userId}/${channel.id}`);
      
      await set(recentRef, {
        channelId: channel.id,
        channel: {
          id: channel.id,
          name: channel.name,
          logo: channel.logo,
          group: channel.group,
          quality: channel.quality,
        },
        watchedAt: Date.now(),
      });

      // Eski kayıtları temizle
      await this.cleanupRecentWatches(userId);
    } catch (error) {
      console.error('Son izlenen eklenemedi:', error);
    }
  }

  static async getRecentWatches(userId: string): Promise<RecentWatch[]> {
    try {
      const recentRef = ref(db, `recentWatches/${userId}`);
      const snapshot = await get(recentRef);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const recentWatches: RecentWatch[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        userId: userId,
        channel: value.channel,
        watchedAt: value.watchedAt,
      }));
      
      // Tarihe göre sırala (en yeni önce)
      recentWatches.sort((a, b) => b.watchedAt - a.watchedAt);
      
      // Sadece son 20
      return recentWatches.slice(0, 20);
    } catch (error) {
      console.error('Son izlenenler alınamadı:', error);
      return [];
    }
  }

  private static async cleanupRecentWatches(userId: string) {
    try {
      const recentRef = ref(db, `recentWatches/${userId}`);
      const snapshot = await get(recentRef);
      
      if (!snapshot.exists()) return;
      
      const data = snapshot.val();
      const entries = Object.entries(data) as [string, { watchedAt: number }][];
      
      // 20'den fazlaysa en eskileri sil
      if (entries.length > 20) {
        entries.sort((a, b) => b[1].watchedAt - a[1].watchedAt);
        const toDelete = entries.slice(20);
        
        for (const [key] of toDelete) {
          await remove(ref(db, `recentWatches/${userId}/${key}`));
        }
      }
    } catch (error) {
      console.error('Temizleme hatası:', error);
    }
  }

  // ==================== ADULT PIN İŞLEMLERİ ====================

  static async setAdultPin(userId: string, hashedPin: string) {
    try {
      await update(ref(db, `users/${userId}`), {
        adultPin: hashedPin,
      });
    } catch (error) {
      console.error('PIN ayarlanamadı:', error);
      throw error;
    }
  }

  static async getAdultPin(userId: string): Promise<string | null> {
    try {
      const userRef = ref(db, `users/${userId}/adultPin`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('PIN alınamadı:', error);
      return null;
    }
  }

  // ==================== KANAL LİSTESİ (M3U'DAN) ====================

  // NOT: Kanal URL'leri Firebase'de SAKLANMAZ!
  // Sadece M3U API'den alınır ve memory'de tutulur.
}

export { db };
