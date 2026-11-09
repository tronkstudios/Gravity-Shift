/** Storage boundary: game rules never depend directly on browser persistence. */
export class BrowserSaveStore {
  constructor(key = "GRAVITY_SHIFT_SAVE_V2") {
    this.key = key;
    this.status = "unknown";
  }
  read() {
    try {
      const value = globalThis.localStorage.getItem(this.key);
      this.status = "ready";
      return value;
    } catch {
      this.status = "unavailable";
      return null;
    }
  }
  write(value) {
    try {
      globalThis.localStorage.setItem(this.key, value);
      this.status = "saved";
      return true;
    } catch {
      this.status = "error";
      return false;
    }
  }
  remove() {
    try {
      globalThis.localStorage.removeItem(this.key);
      this.status = "ready";
      return true;
    } catch {
      this.status = "error";
      return false;
    }
  }
}
