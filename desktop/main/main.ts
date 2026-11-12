/**
 * MEHEDI AI — Secure Electron Main Process (Windows Desktop Packaging)
 * Reuses the MEHEDI AI web interface and backend while enforcing strict desktop security:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - sandbox: true
 * - Strict IPC channel validation
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ElectronWindowConfig {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  title: string;
  targetUrl: string;
  preloadPath: string;
}

export function getSecureElectronConfig(): ElectronWindowConfig {
  const targetUrl = process.env.APP_URL || 'http://localhost:3000';
  return {
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    title: 'MEHEDI AI — Your Personal AI Operating System',
    targetUrl,
    preloadPath: path.join(__dirname, '../preload/preload.js'),
  };
}

// Validated IPC Channel Allowlist
export const ALLOWED_IPC_CHANNELS = new Set([
  'mehedi-os:get-version',
  'mehedi-os:platform-info',
]);

export function validateIpcMessage(channel: string, payload: unknown): boolean {
  if (!ALLOWED_IPC_CHANNELS.has(channel)) {
    console.warn(`[Security Gate] Blocked unauthorized IPC channel: ${channel}`);
    return false;
  }
  if (payload !== undefined && typeof payload !== 'object') {
    return false;
  }
  return true;
}
