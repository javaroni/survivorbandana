// Storage interface for Survivor 50 AR Selfie Studio
// This app is fully client-side, no server-side storage needed
// Storage interface kept for future features (analytics, user saves, etc.)

export interface IStorage {
  // Placeholder for future features
}

export class MemStorage implements IStorage {
  constructor() {
    // No storage needed for AR selfie app
  }
}

export const storage = new MemStorage();
