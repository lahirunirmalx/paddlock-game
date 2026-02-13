'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { generateSecretCode, isValidGuess, calculateFeedback, type GuessResult } from '../utils/gameLogic';
import { hasWonToday, setDailyWin } from '../utils/cookies';

const MAX_ATTEMPTS = 4;

interface Attempt {
  guess: string;
  result: GuessResult;
}

type GameStatus = 'playing' | 'won' | 'lost' | 'already_won';

export default function CombinationLockGame() {
  const [secretCode, setSecretCode] = useState<string>('');
  const [digits, setDigits] = useState<string[]>(['', '', '']);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if user has already won today on mount (client-side only)
  useEffect(() => {
    // Only check cookies on client side
    if (typeof window !== 'undefined') {
      if (hasWonToday()) {
        setGameStatus('already_won');
      } else {
        startNewGame();
      }
    } else {
      startNewGame();
    }
  }, []);

  // Focus first input when game starts or resets
  useEffect(() => {
    if (gameStatus === 'playing' && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [gameStatus]);

  function startNewGame() {
    // Don't start if already won today
    if (hasWonToday()) {
      setGameStatus('already_won');
      return;
    }
    
    setSecretCode(generateSecretCode());
    setDigits(['', '', '']);
    setAttempts([]);
    setGameStatus('playing');
    inputRefs.current = [null, null, null];
  }

  const handleSubmit = useCallback(() => {
    // Safety check: don't allow submission if already won today
    if (typeof window !== 'undefined' && hasWonToday()) {
      setGameStatus('already_won');
      return;
    }
    
    const currentGuess = digits.join('');
    
    if (!isValidGuess(currentGuess)) {
      return;
    }

    const result = calculateFeedback(currentGuess, secretCode);
    const newAttempt: Attempt = { guess: currentGuess, result };

    setAttempts(prev => {
      const newAttempts = [...prev, newAttempt];
      
      if (result.isCorrect) {
        setGameStatus('won');
        setDailyWin(); // Mark that user won today
      } else if (newAttempts.length >= MAX_ATTEMPTS) {
        setGameStatus('lost');
      } else {
        // Focus first input for next attempt
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
      
      return newAttempts;
    });
    setDigits(['', '', '']);
  }, [digits, secretCode]);

  // Auto-submit when all 3 digits are filled (more reliable for mobile)
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    if (typeof window === 'undefined' || hasWonToday()) return;
    
    const allFilled = digits.every(d => d !== '');
    if (allFilled && digits.length === 3) {
      const guess = digits.join('');
      if (isValidGuess(guess)) {
        // Small delay to ensure state is settled, especially on mobile
        const timer = setTimeout(() => {
          handleSubmit();
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [digits, gameStatus, handleSubmit]);

  function handleDigitChange(index: number, value: string) {
    // Only allow single digit
    const digit = value.replace(/\D/g, '').slice(0, 1);
    
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-focus next input if digit entered (with delay for mobile)
    if (digit && index < 2) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 50);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle Enter to submit if all digits filled
    if (e.key === 'Enter') {
      const currentGuess = digits.join('');
      if (isValidGuess(currentGuess)) {
        handleSubmit();
      }
    }
  }

  const remainingAttempts = MAX_ATTEMPTS - attempts.length;

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🔒 Combination Lock
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Guess the 3-digit code in {MAX_ATTEMPTS} attempts
          </p>
        </div>

        {/* Game Status */}
        {gameStatus === 'won' && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-center">
            <p className="text-green-800 dark:text-green-200 font-semibold text-lg">
              🎉 You cracked it! The code was {secretCode}
            </p>
          </div>
        )}

        {gameStatus === 'lost' && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-center">
            <p className="text-red-800 dark:text-red-200 font-semibold text-lg">
              😔 Game Over! The code was {secretCode}
            </p>
          </div>
        )}

        {gameStatus === 'already_won' && (
          <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg text-center">
            <p className="text-blue-800 dark:text-blue-200 font-semibold text-lg mb-2">
              🏆 You already won today!
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Come back tomorrow for a new challenge!
            </p>
          </div>
        )}

        {/* Attempts Display */}
        {gameStatus !== 'already_won' && (
          <div className="mb-6 space-y-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Attempts: {attempts.length}/{MAX_ATTEMPTS} • Remaining: {remainingAttempts}
            </div>
            
            {attempts.map((attempt, index) => (
              <AttemptRow key={index} attempt={attempt} />
            ))}
          </div>
        )}

        {/* Input Blocks */}
        {gameStatus === 'playing' && !hasWonToday() && (
          <div className="space-y-4">
            <div className="flex gap-2 sm:gap-3 justify-center">
              {[0, 1, 2].map((index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={digits[index]}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onInput={(e) => handleDigitChange(index, (e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`
                    w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg 
                    text-2xl sm:text-3xl md:text-4xl font-bold text-center
                    border-2 border-gray-300 dark:border-gray-600 
                    focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300
                    dark:bg-zinc-800 dark:text-white
                    transition-all duration-200
                  `}
                  maxLength={1}
                />
              ))}
            </div>
          </div>
        )}

        {/* New Game Button */}
        {gameStatus === 'lost' && (
          <button
            onClick={startNewGame}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors mt-4"
          >
            Try Again
          </button>
        )}

        {gameStatus === 'won' && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              You've completed today's challenge!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Come back tomorrow for a new code to crack
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: Attempt }) {
  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {attempt.result.feedback.map((digitFeedback, index) => (
        <div
          key={index}
          className={`
            w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center 
            text-xl sm:text-2xl md:text-3xl font-bold shadow-md
            ${digitFeedback.color === 'green' 
              ? 'bg-green-500 text-white shadow-green-600/50' 
              : digitFeedback.color === 'yellow'
              ? 'bg-yellow-500 text-white shadow-yellow-600/50'
              : 'bg-gray-400 text-white shadow-gray-500/50'
            }
            transition-all duration-300 transform hover:scale-105
          `}
        >
          {digitFeedback.digit}
        </div>
      ))}
    </div>
  );
}
