'use client';

import { useState, useCallback, useEffect } from 'react';
import { FirebaseService } from '@/services/firebase';
import { CryptoUtils } from '@/utils/crypto';
import { useStore } from '@/store/useStore';
import { MAX_PIN_ATTEMPTS, PIN_LOCK_DURATION } from '@/utils/constants';

export function useAdultPin() {
  const { userId, adultVerified, setAdultVerified, pinLockedUntil, setPinLockedUntil } = useStore();
  const [attempts, setAttempts] = useState(0);
  const [hasPin, setHasPin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      checkExistingPin();
    }
  }, [userId]);

  const checkExistingPin = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const existingPin = await FirebaseService.getAdultPin(userId);
      setHasPin(!!existingPin);
    } catch (err) {
      console.error('PIN kontrolü hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPin = useCallback(async (inputPin: string): Promise<boolean> => {
    if (!userId) return false;

    // Kilit kontrolü
    if (pinLockedUntil && Date.now() < pinLockedUntil) {
      return false;
    }

    const existingPin = await FirebaseService.getAdultPin(userId);
    if (!existingPin) return false;

    if (CryptoUtils.verifyPin(inputPin, existingPin)) {
      setAttempts(0);
      setAdultVerified(true);
      setPinLockedUntil(null);
      return true;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_PIN_ATTEMPTS) {
      const lockUntil = Date.now() + PIN_LOCK_DURATION;
      setPinLockedUntil(lockUntil);
    }

    return false;
  }, [userId, attempts, pinLockedUntil]);

  const createPin = useCallback(async (newPin: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const hashedPin = CryptoUtils.hashPin(newPin);
      await FirebaseService.setAdultPin(userId, hashedPin);
      setHasPin(true);
      setAdultVerified(true);
      return true;
    } catch (err) {
      console.error('PIN oluşturma hatası:', err);
      return false;
    }
  }, [userId]);

  const changePin = useCallback(async (oldPin: string, newPin: string): Promise<boolean> => {
    if (!userId) return false;

    const isOldPinValid = await verifyPin(oldPin);
    if (!isOldPinValid) return false;

    return createPin(newPin);
  }, [userId, verifyPin, createPin]);

  const resetAttempts = useCallback(() => {
    setAttempts(0);
    setPinLockedUntil(null);
  }, []);

  const getRemainingLockTime = useCallback((): number => {
    if (!pinLockedUntil) return 0;
    return Math.max(0, Math.ceil((pinLockedUntil - Date.now()) / 1000));
  }, [pinLockedUntil]);

  return {
    hasPin,
    adultVerified,
    attempts,
    isLoading,
    pinLockedUntil,
    verifyPin,
    createPin,
    changePin,
    resetAttempts,
    getRemainingLockTime,
    maxAttempts: MAX_PIN_ATTEMPTS,
  };
}
