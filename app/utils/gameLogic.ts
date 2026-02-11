/**
 * Game logic for 3-digit combination lock game
 * Simple, direct implementation - no fancy abstractions
 */

export type FeedbackColor = 'green' | 'yellow' | 'gray';

export interface DigitFeedback {
  digit: string;
  color: FeedbackColor;
}

export interface GuessResult {
  feedback: DigitFeedback[];
  isCorrect: boolean;
}

/**
 * Generate a random 3-digit secret code (000-999)
 */
export function generateSecretCode(): string {
  return Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
}

/**
 * Validate user input is a 3-digit number
 */
export function isValidGuess(guess: string): boolean {
  return /^\d{3}$/.test(guess);
}

/**
 * Calculate feedback for a guess against the secret code
 * 
 * Rules:
 * - Green: digit is correct and in correct position
 * - Yellow: digit is correct but in wrong position
 * - Gray: digit is not in the code
 * 
 * This is the core logic - must be correct and clear.
 */
export function calculateFeedback(guess: string, secret: string): GuessResult {
  if (guess.length !== 3 || secret.length !== 3) {
    throw new Error('Guess and secret must be 3 digits');
  }

  const feedback: DigitFeedback[] = [];
  const secretDigits = secret.split('');
  const guessDigits = guess.split('');
  const secretUsed = [false, false, false];
  const guessUsed = [false, false, false];

  // First pass: mark exact matches (green)
  for (let i = 0; i < 3; i++) {
    if (guessDigits[i] === secretDigits[i]) {
      feedback[i] = { digit: guessDigits[i], color: 'green' };
      secretUsed[i] = true;
      guessUsed[i] = true;
    }
  }

  // Second pass: mark correct digits in wrong position (yellow)
  for (let i = 0; i < 3; i++) {
    if (guessUsed[i]) continue; // Already marked as green

    for (let j = 0; j < 3; j++) {
      if (secretUsed[j]) continue; // Already matched
      if (guessDigits[i] === secretDigits[j]) {
        feedback[i] = { digit: guessDigits[i], color: 'yellow' };
        secretUsed[j] = true;
        guessUsed[i] = true;
        break;
      }
    }

    // If not matched yet, mark as gray
    if (!guessUsed[i]) {
      feedback[i] = { digit: guessDigits[i], color: 'gray' };
    }
  }

  const isCorrect = feedback.every(f => f.color === 'green');

  return { feedback, isCorrect };
}
