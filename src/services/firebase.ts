import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
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
  Timestamp,
} from 'firebase/firestore';
import type { Channel, Favorite, RecentWatch, UserSettings } from '@/types';

// Firebase yapılandırması
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

// Firebase'i başlat
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export class FirebaseService {
  // ==================== AUTH İŞLEMLERİ ====================

  static async registerUser(email: string, password: string, userData: {
    username: string;
    site: string;
  }) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Kullanıcı bilgilerini Firestore'a kaydet
      await setDoc(doc(db, 'users', user.uid), {
        username: userData.username,
        site: userData.site,
        email: email,
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

      return user;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async loginUser(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Son giriş zamanını güncelle
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLogin: serverTimestamp(),
      });

      return userCredential.user;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  static async logoutUser() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  }

  static onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // ==================== KULLANICI İŞLEMLERİ ====================

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
      // Kanal URL'sini kaydetmiyoruz, sadece referans bilgileri
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
          // URL kaydedilmiyor!
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

  static async isFavorite(userId: string, channelId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        where('channelId', '==', channelId)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Favori kontrolü başarısız:', error);
      return false;
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
      // Önce aynı kanalın eski kaydını sil
      const q = query(
        collection(db, 'recentWatches'),
        where('userId', '==', userId),
        where('channelId', '==', channel.id)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, 'recentWatches', document.id));
      });

      // Yeni kaydı ekle (URL hariç)
      await addDoc(collection(db, 'recentWatches'), {
        userId,
        channelId: channel.id,
        channel: {
          id: channel.id,
          name: channel.name,
          logo: channel.logo,
          group: channel.group,
          quality: channel.quality,
          // URL kaydedilmiyor!
        },
        watchedAt: serverTimestamp(),
      });

      // Eski kayıtları temizle (20'den fazlaysa)
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
      const q = query(
        collection(db, 'recentWatches'),
        where('userId', '==', userId),
        orderBy('watchedAt', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const keepIds = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        keepIds.add(doc.id);
      });

      // 20'den fazla kaydı sil
      const allDocs = await getDocs(
        query(collection(db, 'recentWatches'), where('userId', '==', userId))
      );
      
      allDocs.forEach(async (document) => {
        if (!keepIds.has(document.id)) {
          await deleteDoc(doc(db, 'recentWatches', document.id));
        }
      });
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

  // ==================== YARDIMCI FONKSİYONLAR ====================

  private static getErrorMessage(code: string): string {
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'Bu email adresi zaten kullanımda.',
      'auth/invalid-email': 'Geçersiz email adresi.',
      'auth/operation-not-allowed': 'Bu işleme izin verilmiyor.',
      'auth/weak-password': 'Şifre çok zayıf.',
      'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
      'auth/user-not-found': 'Kullanıcı bulunamadı.',
      'auth/wrong-password': 'Hatalı şifre.',
      'auth/invalid-credential': 'Geçersiz giriş bilgileri.',
      'auth/too-many-requests': 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.',
    };

    return errorMessages[code] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }
}

export { auth, db };
