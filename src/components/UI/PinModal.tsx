'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiX, FiDelete } from 'react-icons/fi';
import { CryptoUtils } from '@/utils/crypto';
import { FirebaseService } from '@/services/firebase';
import { useStore } from '@/store/useStore';
import { MAX_PIN_ATTEMPTS, PIN_LOCK_DURATION } from '@/utils/constants';

interface PinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PinModal({ isOpen, onSuccess, onClose }: PinModalProps) {
  const { userId, pinLockedUntil, setPinLockedUntil, setAdultVerified } = useStore();
  const [pin, setPin] = useState('');
  const [isNewPin, setIsNewPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [step, setStep] = useState<'enter' | 'create' | 'confirm'>('enter');
  const inputRef = useRef<HTMLInputElement>(null);

  // Pin durumunu kontrol et
  useEffect(() => {
    if (isOpen && userId) {
      checkPinStatus();
    }
  }, [isOpen, userId]);

  // Input focus
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  const checkPinStatus = async () => {
    if (!userId) return;
    
    const existingPin = await FirebaseService.getAdultPin(userId);
    if (!existingPin) {
      setIsNewPin(true);
      setStep('create');
    } else {
      setIsNewPin(false);
      setStep('enter');
    }
  };

  const handleNumberClick = useCallback((num: string) => {
    if (step === 'enter' && pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    } else if (step === 'create' && pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setTimeout(() => {
          setStep('confirm');
          setConfirmPin('');
        }, 300);
      }
    } else if (step === 'confirm' && confirmPin.length < 4) {
      const newConfirmPin = confirmPin + num;
      setConfirmPin(newConfirmPin);
      
      if (newConfirmPin.length === 4) {
        saveNewPin(newConfirmPin);
      }
    }
  }, [pin, confirmPin, step]);

  const handleDelete = () => {
    if (step === 'enter') {
      setPin(prev => prev.slice(0, -1));
    } else if (step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin(prev => prev.slice(0, -1));
    }
    setError('');
  };

  const verifyPin = async (inputPin: string) => {
    if (!userId) return;

    // Kilit kontrolü
    if (pinLockedUntil && Date.now() < pinLockedUntil) {
      const remainingSeconds = Math.ceil((pinLockedUntil - Date.now()) / 1000);
      setError(`${remainingSeconds} saniye bekleyin`);
      return;
    }

    const existingPin = await FirebaseService.getAdultPin(userId);
    if (!existingPin) {
      setIsNewPin(true);
      setStep('create');
      setPin('');
      return;
    }

    if (CryptoUtils.verifyPin(inputPin, existingPin)) {
      setAttempts(0);
      setAdultVerified(true);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      
      if (newAttempts >= MAX_PIN_ATTEMPTS) {
        const lockUntil = Date.now() + PIN_LOCK_DURATION;
        setPinLockedUntil(lockUntil);
        setError('Çok fazla hatalı deneme. 30 saniye bekleyin.');
      } else {
        setError(`Hatalı PIN. ${MAX_PIN_ATTEMPTS - newAttempts} hakkınız kaldı`);
      }
    }
  };

  const saveNewPin = async (newPin: string) => {
    if (!userId) return;

    if (newPin !== pin) {
      setError('PIN\'ler eşleşmiyor');
      setConfirmPin('');
      return;
    }

    const hashedPin = CryptoUtils.hashPin(newPin);
    await FirebaseService.setAdultPin(userId, hashedPin);
    setIsNewPin(false);
    setAdultVerified(true);
    onSuccess();
    resetState();
  };

  const resetState = () => {
    setPin('');
    setConfirmPin('');
    setError('');
    setAttempts(0);
    setStep('enter');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1a1a1a] border border-gray-700 rounded-3xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 
                rounded-full flex items-center justify-center mx-auto mb-3">
                <FiLock className="w-8 h-8 text-red-400" />
              </div>
              
              <h3 className="text-lg font-semibold">
                {step === 'create' 
                  ? 'PIN Oluşturun' 
                  : step === 'confirm' 
                    ? 'PIN\'i Onaylayın' 
                    : 'Adult İçerik'}
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {step === 'create'
                  ? '4 haneli bir PIN belirleyin'
                  : step === 'confirm'
                    ? 'PIN\'i tekrar girin'
                    : 'Devam etmek için PIN girin'}
              </p>
            </div>

            {/* Pin Göstergesi */}
            <div className="flex justify-center space-x-4 mb-6">
              {[0, 1, 2, 3].map((i) => {
                const displayPin = step === 'confirm' ? confirmPin : pin;
                const isActive = i < displayPin.length;
                
                return (
                  <motion.div
                    key={i}
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center
                      ${isActive 
                        ? 'border-blue-500 bg-blue-500/20' 
                        : 'border-gray-600'
                      }`}
                  >
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 bg-blue-400 rounded-full"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Hata Mesajı */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-red-400 text-sm mb-4"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* NumPad */}
            <div className="space-y-3">
              {numbers.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center space-x-3">
                  {row.map((num, colIndex) => {
                    if (num === '') {
                      return <div key={`empty-${colIndex}`} className="w-16 h-16" />;
                    }
                    
                    if (num === 'delete') {
                      return (
                        <button
                          key="delete"
                          onClick={handleDelete}
                          className="w-16 h-16 flex items-center justify-center
                            hover:bg-white/5 rounded-2xl transition-colors"
                        >
                          <FiDelete className="w-6 h-6 text-gray-400" />
                        </button>
                      );
                    }

                    return (
                      <motion.button
                        key={num}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleNumberClick(num)}
                        className="w-16 h-16 flex items-center justify-center
                          bg-white/5 hover:bg-white/10 rounded-2xl
                          text-xl font-semibold transition-colors"
                      >
                        {num}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Kapat Butonu */}
            <button
              onClick={handleClose}
              className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              İptal
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
