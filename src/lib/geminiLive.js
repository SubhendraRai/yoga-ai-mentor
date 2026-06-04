// ─────────────────────────────────────────────────────────────
// geminiLive.js — Gemini Multimodal Live API WebSocket Manager
// Real-time pose correction via camera frame streaming.
// ─────────────────────────────────────────────────────────────

const LIVE_MODEL = 'models/gemini-2.0-flash-live-preview-04-09';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const DEFAULT_SYSTEM_INSTRUCTION = `You are a real-time yoga pose correction assistant. The user is performing yoga poses and streaming their camera feed to you. Analyze their posture and provide brief, actionable corrections. Focus on alignment, safety, and encouragement. Keep responses to 1-3 sentences. If the pose looks good, say so enthusiastically.`;

/**
 * GeminiLiveSession — manages a WebSocket connection to Gemini's
 * BidiGenerateContent endpoint for real-time multimodal interaction.
 */
export class GeminiLiveSession {
  /**
   * @param {string} apiKey
   * @param {object} options
   * @param {function(string):void}  options.onFeedback      - Called with text feedback from the model.
   * @param {function(Error):void}   options.onError          - Called on errors.
   * @param {function():void}        options.onConnected      - Called when session is ready.
   * @param {function():void}        options.onDisconnected   - Called when session ends.
   * @param {string}                 options.systemInstruction - Override default system instruction.
   */
  constructor(apiKey, options = {}) {
    this._apiKey = apiKey;
    this._onFeedback = options.onFeedback || (() => {});
    this._onError = options.onError || (() => {});
    this._onConnected = options.onConnected || (() => {});
    this._onDisconnected = options.onDisconnected || (() => {});
    this._systemInstruction = options.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;

    /** @type {WebSocket|null} */
    this._ws = null;
    this._connected = false;
    this._setupComplete = false;
    this._retryCount = 0;
    this._intentionalClose = false;
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Open the WebSocket and perform the setup handshake.
   * Resolves when the session is ready, rejects on failure.
   * @returns {Promise<void>}
   */
  async connect() {
    this._intentionalClose = false;
    this._retryCount = 0;
    return this._openConnection();
  }

  /**
   * Send a camera frame for real-time pose analysis.
   * @param {string} base64JpegData - Base64-encoded JPEG image data (no data-URI prefix).
   */
  sendFrame(base64JpegData) {
    if (!this._connected || !this._ws || !this._setupComplete) {
      console.warn('[GeminiLive] Cannot send frame — not connected.');
      return;
    }

    const message = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'image/jpeg',
            data: base64JpegData,
          },
        ],
      },
    };

    this._send(message);
  }

  /**
   * Send a text prompt to the live session.
   * @param {string} text
   */
  sendTextPrompt(text) {
    if (!this._connected || !this._ws || !this._setupComplete) {
      console.warn('[GeminiLive] Cannot send text — not connected.');
      return;
    }

    const message = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    };

    this._send(message);
  }

  /**
   * Cleanly close the WebSocket.
   */
  disconnect() {
    this._intentionalClose = true;
    this._cleanup();
  }

  /**
   * Whether the session is currently connected and ready.
   * @returns {boolean}
   */
  get isConnected() {
    return this._connected && this._setupComplete;
  }

  // ── Internal ────────────────────────────────────────────────

  /**
   * Open the WebSocket connection and set up event handlers.
   * @returns {Promise<void>}
   */
  _openConnection() {
    return new Promise((resolve, reject) => {
      const url =
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this._apiKey}`;

      try {
        this._ws = new WebSocket(url);
      } catch (err) {
        const error = new Error(`Failed to create WebSocket: ${err.message}`);
        this._onError(error);
        return reject(error);
      }

      // ── onopen: send setup message ──
      this._ws.onopen = () => {
        this._connected = true;
        this._retryCount = 0;
        this._sendSetupMessage();
      };

      // ── onmessage: parse server responses ──
      this._ws.onmessage = (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

          // Handle setup completion
          if (data.setupComplete) {
            this._setupComplete = true;
            this._onConnected();
            resolve();
            return;
          }

          // Extract text feedback from model responses
          const text = this._extractText(data);
          if (text) {
            this._onFeedback(text);
          }
        } catch (err) {
          console.error('[GeminiLive] Error parsing message:', err);
        }
      };

      // ── onerror ──
      this._ws.onerror = (event) => {
        const error = new Error(event.message || 'WebSocket error');
        console.error('[GeminiLive] WebSocket error:', error);
        this._onError(error);

        // If we haven't resolved yet (still connecting), reject
        if (!this._setupComplete) {
          reject(error);
        }
      };

      // ── onclose ──
      this._ws.onclose = (event) => {
        const wasConnected = this._connected;
        this._connected = false;
        this._setupComplete = false;

        if (this._intentionalClose) {
          this._onDisconnected();
          return;
        }

        // Attempt reconnection if not intentional
        if (wasConnected && this._retryCount < MAX_RETRIES) {
          this._retryCount++;
          console.log(
            `[GeminiLive] Connection lost. Retry ${this._retryCount}/${MAX_RETRIES} in ${RETRY_DELAY_MS}ms...`
          );
          setTimeout(() => {
            this._openConnection().catch(() => {
              // If all retries fail, notify disconnect
              if (this._retryCount >= MAX_RETRIES) {
                this._onError(new Error('Max reconnection attempts reached.'));
                this._onDisconnected();
              }
            });
          }, RETRY_DELAY_MS * this._retryCount); // Exponential-ish back-off
        } else if (this._retryCount >= MAX_RETRIES) {
          this._onError(new Error('Max reconnection attempts reached.'));
          this._onDisconnected();
        } else {
          this._onDisconnected();
        }
      };
    });
  }

  /**
   * Send the initial setup message to configure the session.
   */
  _sendSetupMessage() {
    const setup = {
      setup: {
        model: LIVE_MODEL,
        generationConfig: {
          responseModalities: ['TEXT'],
          temperature: 0.7,
          maxOutputTokens: 256,
        },
        systemInstruction: {
          parts: [{ text: this._systemInstruction }],
        },
      },
    };

    this._send(setup);
  }

  /**
   * Extract text from a server response message.
   * Handles the serverContent.modelTurn.parts structure.
   * @param {object} data
   * @returns {string|null}
   */
  _extractText(data) {
    try {
      // Standard path: serverContent → modelTurn → parts → text
      const parts = data?.serverContent?.modelTurn?.parts;
      if (Array.isArray(parts)) {
        const texts = parts.map((p) => p.text).filter(Boolean);
        if (texts.length > 0) return texts.join('');
      }

      // Alternative path for some response formats
      const candidates = data?.candidates;
      if (Array.isArray(candidates)) {
        const text = candidates[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('');
        if (text) return text;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Send a JSON message over the WebSocket.
   * @param {object} message
   */
  _send(message) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(message));
    } else {
      console.warn('[GeminiLive] WebSocket not open — message dropped.');
    }
  }

  /**
   * Clean up the WebSocket connection.
   */
  _cleanup() {
    if (this._ws) {
      // Remove handlers to prevent reconnection logic
      this._ws.onopen = null;
      this._ws.onmessage = null;
      this._ws.onerror = null;
      this._ws.onclose = null;

      if (
        this._ws.readyState === WebSocket.OPEN ||
        this._ws.readyState === WebSocket.CONNECTING
      ) {
        this._ws.close(1000, 'Client disconnect');
      }

      this._ws = null;
    }

    this._connected = false;
    this._setupComplete = false;
    this._onDisconnected();
  }
}
