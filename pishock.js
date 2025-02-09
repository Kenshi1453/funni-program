const SHOCK_OPERATIONS = {
    SHOCK: 0,
    VIBRATE: 1,
    BEEP: 2
}

class PiShockAPI {
  constructor(API_KEY, USERNAME, SHARE_CODE, API_URL) {
    this.API_KEY = API_KEY;
    this.USERNAME = USERNAME;
    this.SHARE_CODE = SHARE_CODE;
    this.API_URL = API_URL;
  }

/**
   * 
   * @param {string} name 
   * @param {number} duration 
   * @param {number} intensity 
   * @param {SHOCK_OPERATIONS[keyof SHOCK_OPERATIONS]} op 
   * @returns 
   */
  async _send(name, duration, intensity, op){
    if (duration < 1 || duration > 15) throw new Error();
    if (intensity < 1 || intensity > 100) throw new Error();
    name = name
    .replaceAll(" ", "_")
    .replaceAll(/[^a-zA-Z0-9_]/g, "")
    .substring(0, 64);
    
    const body = {
        Username: this.USERNAME,
        ApiKey: this.API_KEY,
        Code: this.SHARE_CODE,
        Name: name,
        Op: op.toString(),
        Duration: duration.toString(),
        Intensity: intensity.toString(),
      };
    return await fetch(this.API_URL, {
      body: JSON.stringify(body),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
  }

  /**
   *
   * @param {string} name
   * @param {number} duration int between 1-15
   * @param {number} intensity int between 1-100
   */
  async sendShock(name, duration, intensity) {
    return await this._send(name, duration, intensity, SHOCK_OPERATIONS.SHOCK)
  }

  /**
   *
   * @param {string} name
   * @param {number} duration int between 1-15
   * @param {number} intensity int between 1-100
   */
  async sendVibrate(name, duration, intensity) {
    return await this._send(name, duration, intensity, SHOCK_OPERATIONS.VIBRATE)
  }

  /**
   *
   * @param {string} name
   * @param {number} duration int between 1-15
   * @param {number} intensity int between 1-100
   */
  async sendBeep(name, duration, intensity) {
    return await this._send(name, duration, intensity, SHOCK_OPERATIONS.BEEP)
  }
}

export { PiShockAPI };
