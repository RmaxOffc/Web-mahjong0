/**
 * Utility untuk handle custom card display logic
 * Digunakan untuk menentukan apa yang ditampilkan di tile berdasarkan user settings
 */

export interface CardCustomization {
  type: string;
  isEmpty: boolean;
  timestamp?: string;
}

/**
 * Tentukan simbol/label yang ditampilkan berdasarkan custom card setting
 * @param label - label default dari game outcome
 * @param customization - custom card config dari user setting
 * @returns symbol yang akan ditampilkan (atau empty string jika isEmpty)
 */
export function getDisplaySymbol(label: string, customization?: CardCustomization | null): string {
  // Jika user tidak punya custom card, gunakan label default
  if (!customization) {
    return label;
  }

  // Jika custom card tipe empty, jangan tampilkan apapun
  if (customization.isEmpty || customization.type === 'empty') {
    return ''; // Empty symbol
  }

  // Default ke label
  return label;
}

/**
 * Check apakah user punya empty card customization
 */
export function isEmptyCard(customization?: CardCustomization | null): boolean {
  return customization?.isEmpty === true || customization?.type === 'empty';
}

/**
 * Get CSS class untuk custom card styling
 */
export function getCardCustomClass(customization?: CardCustomization | null): string {
  if (isEmptyCard(customization)) {
    return 'bg-white/95'; // Kartu kosong berwarna putih/cream
  }
  return ''; // Default styling
}
