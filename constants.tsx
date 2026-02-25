import React from 'react';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

// SVG Icon components are removed as per request to use emojis.
// Kept other constants for reference if they were used elsewhere,
// but specific emoji replacements will be handled in each component.

export const DEFAULT_IMAGE_URL_BASE = 'https://picsum.photos/seed';
export const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

export const INCOME_CATEGORIES = {
  RENT: 'Rent Collected',
  LATE_FEE: 'Late Fee',
  OTHER_INCOME: 'Other Income',
} as const; 

export const EXPENSE_CATEGORIES = {
  MORTGAGE: 'Mortgage Payment',
  MANAGEMENT_FEE: 'Property Management Fee',
  INSURANCE: 'Insurance',
  HOA_FEE: 'HOA Fee',
  PROPERTY_TAX: 'Property Tax',
  CAPITAL_EXPENSE: 'Capital Expense',
  MAINTENANCE_REPAIR: 'Maintenance & Repair',
  UTILITIES: 'Utilities',
  OTHER_EXPENSE: 'Other Expense',
} as const;

export const formatDateForDisplay = (dateString?: string, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateString) return 'N/A';
  // Assuming dateString is "YYYY-MM-DD"
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString; // Fallback if not YYYY-MM-DD

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateString; // Fallback for invalid date parts

  // Create date as local midnight to avoid timezone shifts during formatting
  const localDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'short', day: 'numeric', 
  };
  
  return localDate.toLocaleDateString(undefined, { ...defaultOptions, ...options });
};