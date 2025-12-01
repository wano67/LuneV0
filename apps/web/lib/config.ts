// apps/web/lib/config.ts

const apiBaseUrlEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

export const API_BASE_URL =
  apiBaseUrlEnv ??
  (() => {
    if (process.env.NODE_ENV !== 'production') {
      // En dev, on veut que ce soit explicitement défini
      throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
    }
    // En prod, on loggue un warning et on retourne une string vide
    console.warn(
      'NEXT_PUBLIC_API_BASE_URL is not set; falling back to empty base URL. ' +
        'Configure it in your Railway / environment variables.'
    );
    return '';
  })();

export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';