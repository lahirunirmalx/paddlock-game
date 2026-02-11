/**
 * Simple cookie utilities for tracking daily wins
 * No fancy libraries - just direct cookie manipulation
 */

const COOKIE_NAME = 'paddlock_daily_win';
const COOKIE_EXPIRY_DAYS = 1;

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Set a cookie with expiration
 */
function setCookie(name: string, value: string, days: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Check if user has won today
 */
export function hasWonToday(): boolean {
  const cookieValue = getCookie(COOKIE_NAME);
  if (!cookieValue) return false;
  
  const today = getTodayDateString();
  return cookieValue === today;
}

/**
 * Mark that user has won today
 */
export function setDailyWin(): void {
  const today = getTodayDateString();
  setCookie(COOKIE_NAME, today, COOKIE_EXPIRY_DAYS);
}

/**
 * Clear the daily win cookie (for testing or reset)
 */
export function clearDailyWin(): void {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}
