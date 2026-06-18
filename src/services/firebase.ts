import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set, update, remove } from 'firebase/database';
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

function sanitizePath(str: string): string {
  return str
    .replace(/[.#$\[\]]/g, '_')
    .replace(/\/+/g, '_')
    .replace(/^https?_/, '')
    .replace(/:/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export class FirebaseService {

  static async loginUser(site: string, username: string, password: string) {
    try {
      const cleanSite = sanitizePath(site);
      const cleanUsername = sanitizePath(username);
      const userId = `${cleanSite}_${cleanUsername}`;
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, {
          username, site, password,
          createdAt: Date.now(),
          lastLogin: Date.now(),
          settings: { theme: 'dark', autoPlay: true, preferredQuality: 'auto', language: 'tr', bufferSize: 30 }
        });
      } else {
        const userData = snapshot.val();
        if (userData.password !== password) throw new Error('Hatalı şifre');
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
      const snapshot = await get(ref(db, `users/${userId}`));
      if (snapshot.exists()) return snapshot.val();
      return null;
    } catch (error) { return null; }
  }

  static async updateLastLogin(userId: string) {
    try { await update(ref(db, `users/${userId}`), { lastLogin: Date.now() }); } catch (error) {}
  }

  static async updateUserSettings(userId: string, settings: Partial<UserSettings>) {
    try { await update(ref(db, `users/${userId}/settings`), settings); } catch (error) { throw error; }
  }

  static async setUserExpiry(userId: string, startDate: number, expiryDate: number) {
    try { await update(ref(db, `users/${userId}`), { startDate, expiryDate }); } catch (error) {}
  }

  static async getUserExpiry(userId: string): Promise<{ startDate: number; expiryDate: number } | null> {
    try {
      const snapshot = await get(ref(db, `users/${userId}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.startDate && data.expiryDate) return { startDate: data.startDate, expiryDate: data.expiryDate };
      }
      return null;
    } catch (error) { return null; }
  }

  static async addToFavorites(userId: string, channel: Channel) {
    try {
      await set(ref(db, `favorites/${userId}/${sanitizePath(channel.id)}`), {
        channelId: channel.id,
        channel: { id: channel.id, name: channel.name, logo: channel.logo, group: channel.group, quality: channel.quality },
        addedAt: Date.now(),
      });
    } catch (error) { throw error; }
  }

  static async removeFromFavorites(userId: string, channelId: string) {
    try { await remove(ref(db, `favorites/${userId}/${sanitizePath(channelId)}`)); } catch (error) { throw error; }
  }

  static async getFavorites(userId: string): Promise<Favorite[]> {
    try {
      const snapshot = await get(ref(db, `favorites/${userId}`));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      const favorites: Favorite[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key, userId, channelId: value.channelId, channel: value.channel, addedAt: value.addedAt,
      }));
      favorites.sort((a, b) => b.addedAt - a.addedAt);
      return favorites;
    } catch (error) { return []; }
  }

  static async addRecentWatch(userId: string, channel: Channel) {
    try {
      await set(ref(db, `recentWatches/${userId}/${sanitizePath(channel.id)}`), {
        channelId: channel.id,
        channel: { id: channel.id, name: channel.name, logo: channel.logo, group: channel.group, quality: channel.quality },
        watchedAt: Date.now(),
      });
      await this.cleanupRecentWatches(userId);
    } catch (error) {}
  }

  static async getRecentWatches(userId: string): Promise<RecentWatch[]> {
    try {
      const snapshot = await get(ref(db, `recentWatches/${userId}`));
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      const recentWatches: RecentWatch[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key, userId, channel: value.channel, watchedAt: value.watchedAt,
      }));
      recentWatches.sort((a, b) => b.watchedAt - a.watchedAt);
      return recentWatches.slice(0, 20);
    } catch (error) { return []; }
  }

  private static async cleanupRecentWatches(userId: string) {
    try {
      const snapshot = await get(ref(db, `recentWatches/${userId}`));
      if (!snapshot.exists()) return;
      const data = snapshot.val();
      const entries = Object.entries(data) as [string, { watchedAt: number }][];
      if (entries.length > 20) {
        entries.sort((a, b) => b[1].watchedAt - a[1].watchedAt);
        for (const [key] of entries.slice(20)) await remove(ref(db, `recentWatches/${userId}/${key}`));
      }
    } catch (error) {}
  }

  static async setAdultPin(userId: string, hashedPin: string) {
    try { await update(ref(db, `users/${userId}`), { adultPin: hashedPin }); } catch (error) { throw error; }
  }

  static async getAdultPin(userId: string): Promise<string | null> {
    try {
      const snapshot = await get(ref(db, `users/${userId}/adultPin`));
      if (snapshot.exists()) return snapshot.val();
      return null;
    } catch (error) { return null; }
  }
}

export { db };
