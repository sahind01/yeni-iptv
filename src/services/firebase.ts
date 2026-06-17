import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
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
const db = getFirestore(app);

export class FirebaseService {
  // ==================== BASİT AUTH (Firebase Auth Yok) ====================

  static async loginUser(site: string, username: string, password: string) {
    try {
      // Kullanıcıyı Firestore'dan bul
      const userId = `${site}_${username}`.toLowerCase().replace(/\s+/g, '_');
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        // Yeni kullanıcı oluştur
        await setDoc(doc(db, 'users', userId), {
          username: username,
          site: site,
          password: password, // Gerçek projede hash'le
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          settings: {
            theme: 'dark',
            autoPlay: true,
            preferredQuality: 'auto',
            language: 'tr',
            bufferSize: 30,
          },
        });
      } else {
        // Şifre kontrolü
        const userData = userDoc.data();
        if (userData.password !== password) {
          throw new Error('Hatalı şifre');
        }
        // Son girişi güncelle
        await updateDoc(doc(db, 'users', userId), {
          lastLogin: serverTimestamp(),
        });
      }

      return userId;
    } catch (error: any) {
      if (error.message === 'Hatalı şifre') throw error;
      throw new Error('Giriş yapılamadı');
    }
  }

  static async getUserData(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
      return null;
    }
  }

  static async updateUserSettings(userId: string, settings: Partial<UserSettings>) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        settings: settings,
      });
    } catch (error) {
      console.error('Ayarlar güncellenemedi:', error);
      throw error;
    }
  }

  // ==================== FAVORİ İŞLEMLERİ ====================

  static async addToFavorites(userId: string, channel: Channel) {
    try {
      const favoriteData = {
        userId,
        channelId: channel.id,
        channel: {
          id: channel.id,
          name: channel.name,
          logo: channel.logo,
          group: channel.group,
          quality: channel.quality,
          tvgId: channel.tvgId,
          tvgName: channel.tvgName,
        },
        addedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'favorites'), favoriteData);
    } catch (error) {
      console.error('Favori eklenemedi:', error);
      throw error;
    }
  }

  static async removeFromFavorites(userId: string, channelId: string) {
    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        where('channelId', '==', channelId)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'favorites', document.id));
      });
    } catch (error) {
      console.error('Favori silinemedi:', error);
      throw error;
    }
  }

  static async getFavorites(userId: string): Promise<Favorite[]> {
    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        orderBy('addedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const favorites: Favorite[] = [];
      
      querySnapshot.forEach((doc) => {
        favorites.push({ id: doc.id, ...doc.data() } as Favorite);
      });
      
      return favorites;
    } catch (error) {
      console.error('Favoriler alınamadı:', error);
      return [];
    }
  }

  // ==================== SON İZLENENLER ====================

  static async addRecentWatch(userId: string, channel: Channel) {
    try {
      const q = query(
        collection(db, 'recentWatches'),
        where('userId', '==', userId),
        where('channelId', '==', channel.id)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'recentWatches', document.id));
      });

      await addDoc(collection(db, 'recentWatches'), {
        userId,
        channelId: channel.id,
        channel: {
          id: channel.id,
          name: channel.name,
          logo: channel.logo,
          group: channel.group,
          quality: channel.quality,
        },
        watchedAt: serverTimestamp(),
      });

      await this.cleanupRecentWatches(userId);
    } catch (error) {
      console.error('Son izlenen eklenemedi:', error);
    }
  }

  static async getRecentWatches(userId: string): Promise<RecentWatch[]> {
    try {
      const q = query(
        collection(db, 'recentWatches'),
        where('userId', '==', userId),
        orderBy('watchedAt', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const recentWatches: RecentWatch[] = [];
      
      querySnapshot.forEach((doc) => {
        recentWatches.push({ id: doc.id, ...doc.data() } as RecentWatch);
      });
      
      return recentWatches;
    } catch (error) {
      console.error('Son izlenenler alınamadı:', error);
      return [];
    }
  }

  private static async cleanupRecentWatches(userId: string) {
    try {
      const allDocs = await getDocs(
        query(
          collection(db, 'recentWatches'),
          where('userId', '==', userId),
          orderBy('watchedAt', 'desc')
        )
      );
      
      let count = 0;
      const toDelete: string[] = [];
      
      allDocs.forEach((doc) => {
        count++;
        if (count > 20) {
          toDelete.push(doc.id);
        }
      });
      
      for (const id of toDelete) {
        await deleteDoc(doc(db, 'recentWatches', id));
      }
    } catch (error) {
      console.error('Temizleme hatası:', error);
    }
  }

  // ==================== ADULT PIN İŞLEMLERİ ====================

  static async setAdultPin(userId: string, hashedPin: string) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        adultPin: hashedPin,
      });
    } catch (error) {
      console.error('PIN ayarlanamadı:', error);
      throw error;
    }
  }

  static async getAdultPin(userId: string): Promise<string | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data().adultPin || null;
      }
      return null;
    } catch (error) {
      console.error('PIN alınamadı:', error);
      return null;
    }
  }
}

export { db };
