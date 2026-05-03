// Utility functions for the application

import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare password with hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Format currency (Bangladeshi Taka)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: "BDT",
  }).format(amount);
}

/**
 * Format date to Bangla format
 */
export function formatDateBangla(date: Date | string): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return d.toLocaleDateString("bn-BD", options);
}

/**
 * Get current year and month
 */
export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Bangladesh)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+88|88)?01[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/[\s\-]/g, ""));
}

/**
 * Validate NID number (Bangladesh)
 */
export function isValidNID(nid: string): boolean {
  const nidClean = nid.replace(/[\s\-]/g, "");
  return nidClean.length === 10 || nidClean.length === 13;
}

/**
 * Generate random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(session: unknown): boolean {
  return !!(session as { user?: unknown }).user;
}

/**
 * Check if user has role
 */
export function hasRole(session: unknown, role: string): boolean {
  return (session as { user?: { role?: unknown } }).user?.role === role;
}

/**
 * Calculate rent total
 */
export function calculateRentTotal(
  baseRent: number,
  extraCharges: number = 0,
  serviceCharges: number = 0
): number {
  return baseRent + extraCharges + serviceCharges;
}

/**
 * Get month name in Bangla
 */
export function getMonthNameBangla(month: number): string {
  const months = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];
  return months[month - 1] || "";
}

/**
 * Convert number to Bangla numerals
 */
export function numberToBangla(num: number): string {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).split("").map((d) => banglaDigits[parseInt(d)]).join("");
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
