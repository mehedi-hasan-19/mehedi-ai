/**
 * MEHEDI AI — Secure Electron Preload Script
 * Exposes a minimal, read-only bridge to the renderer with Context Isolation enabled.
 * Never exposes raw Node.js fs, child_process, or shell execution primitives.
 */

export interface MehediDesktopBridge {
  readonly isDesktopApp: boolean;
  readonly platform: string;
  readonly architecture: string;
  readonly securityMode: 'context-isolated-sandbox';
}

export const desktopBridgeDefinition: MehediDesktopBridge = {
  isDesktopApp: true,
  platform: 'win32',
  architecture: 'x64',
  securityMode: 'context-isolated-sandbox',
};
