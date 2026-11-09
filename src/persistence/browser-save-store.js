/** Storage boundary: game rules never depend directly on browser persistence. */
export class BrowserSaveStore {
  constructor(key = "GRAVITY_SHIFT_SAVE_V2") {
    this.key = key;
  }
  read() {
    try {
      return globalThis.localStorage.getItem(this.key);
    } catch {
      return null;
    }
  }
  write(value) {
    try {
      globalThis.localStorage.setItem(this.key, value);
      return true;
    } catch {
      return false;
    }
  }
  remove() {
    try {
      globalThis.localStorage.removeItem(this.key);
      return true;
    } catch {
      return false;
    }
  }
}
