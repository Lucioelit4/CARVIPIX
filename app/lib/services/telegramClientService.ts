/**
 * Community Publisher V1 - Telegram Client Service
 * 
 * Cliente seguro para Telegram Bot API usando fetch directo
 * - Sin dependencias externas (node-telegram-bot-api removido)
 * - Timeouts y retry logic con exponential backoff
 * - Error handling sin exponer tokens
 * - Logging seguro
 */

interface TelegramConfig {
  botToken: string;
  channelTest: string;
  channelOfficial: string;
  testOnly: boolean;
}

interface SendMessageOptions {
  channelId: string;
  text: string;
  markdown?: boolean;
  buttons?: Array<Array<{ text: string; url: string }>>;
}

interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const REQUEST_TIMEOUT = 30000; // 30s
const MAX_RETRIES = 3;

export class TelegramClientService {
  private config: TelegramConfig;
  private isConnected: boolean = false;
  private lastError: string | null = null;

  constructor(config: TelegramConfig) {
    this.config = config;
    
    // Validar que token existe y no está vacío
    if (!config.botToken || config.botToken.trim().length === 0) {
      throw new Error('TELEGRAM_BOT_TOKEN no está configurado en .env.local');
    }
  }

  /**
   * Hacer request a Telegram API con timeout
   */
  private async apiCall<T = unknown>(
    method: string,
    data?: Record<string, unknown>
  ): Promise<TelegramApiResponse<T>> {
    const url = `${TELEGRAM_API_BASE}${this.config.botToken}/${method}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
        signal: controller.signal,
      });

      const result = await response.json() as TelegramApiResponse<T>;
      
      if (!result.ok) {
        this.lastError = result.description || `API error ${result.error_code}`;
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          this.lastError = `Request timeout (${REQUEST_TIMEOUT}ms)`;
        } else {
          this.lastError = error.message;
        }
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Obtener información completa del bot (getMe)
   * Devuelve datos ricos para el panel de status.
   */
  async getBotInfo(): Promise<{
    ok: boolean;
    id?: number;
    first_name?: string;
    username?: string;
    is_bot?: boolean;
    error?: string;
  }> {
    try {
      const result = await this.apiCall<{
        id: number;
        first_name?: string;
        username?: string;
        is_bot?: boolean;
      }>('getMe');

      if (!result.ok || !result.result) {
        this.isConnected = false;
        return { ok: false, error: result.description || 'Bot no encontrado' };
      }

      const me = result.result;
      this.isConnected = true;

      console.log('[TELEGRAM] Bot verificado:', {
        username: me.username,
        first_name: me.first_name,
        is_bot: me.is_bot,
      });

      return {
        ok: true,
        id: me.id,
        first_name: me.first_name,
        username: me.username,
        is_bot: me.is_bot,
      };
    } catch (error) {
      this.lastError = (error as Error).message;
      this.isConnected = false;
      console.error('[TELEGRAM] Verificación fallida:', {
        message: this.lastError,
        timestamp: new Date().toISOString(),
      });
      return { ok: false, error: this.lastError };
    }
  }

  /**
   * Verificar conexión al iniciar (alias de getBotInfo para compatibilidad)
   */
  async verifyConnection(): Promise<boolean> {
    const info = await this.getBotInfo();
    return info.ok;
  }

  /**
   * Validar canal (verificar que el bot puede acceder)
   */
  async validateChannel(channelId: string): Promise<{
    valid: boolean;
    error?: string;
    info?: {
      id: number;
      title: string;
      type: string;
    };
  }> {
    try {
      const result = await this.apiCall<{
        id: number;
        title?: string;
        type?: string;
      }>('getChat', { chat_id: channelId });
      
      if (!result.ok || !result.result) {
        return {
          valid: false,
          error: result.description || 'Canal no accesible'
        };
      }

      const chat = result.result;
      console.log('[TELEGRAM] Canal validado:', {
        id: chat.id,
        title: chat.title,
        type: chat.type
      });

      return {
        valid: true,
        info: {
          id: chat.id,
          title: chat.title || '',
          type: chat.type || ''
        }
      };
    } catch (error) {
      const errorMsg = (error as Error).message;
      this.lastError = errorMsg;
      
      console.error('[TELEGRAM] Validación de canal fallida:', {
        channelId,
        error: errorMsg
      });

      return {
        valid: false,
        error: errorMsg
      };
    }
  }

  /**
   * Verificar permisos del bot en el canal
   */
  async verifyBotPermissions(channelId: string): Promise<{
    canSendMessages: boolean;
    canEditMessages: boolean;
    canDeleteMessages: boolean;
    errors: string[];
  }> {
    try {
      // Intentar enviar un mensaje de prueba para verificar permisos
      const sendResult = await this.apiCall<{ message_id?: number }>('sendMessage', {
        chat_id: channelId,
        text: '🔍 Verificando permisos del bot...',
        parse_mode: 'Markdown'
      });

      if (!sendResult.ok) {
        return {
          canSendMessages: false,
          canEditMessages: false,
          canDeleteMessages: false,
          errors: [sendResult.description || 'No puede enviar mensajes']
        };
      }

      const messageId = sendResult.result?.message_id;
      if (!messageId) {
        return {
          canSendMessages: false,
          canEditMessages: false,
          canDeleteMessages: false,
          errors: ['Mensaje enviado pero sin ID']
        };
      }

      // Intentar editar para verificar ese permiso
      let canEdit = false;
      try {
        const editResult = await this.apiCall<unknown>('editMessageText', {
          chat_id: channelId,
          message_id: messageId,
          text: '🔍 Verificando permisos del bot... ✓',
          parse_mode: 'Markdown'
        });
        canEdit = editResult.ok;
      } catch (editError) {
        console.warn('[TELEGRAM] No puede editar mensajes:', (editError as Error).message);
      }

      // Intentar eliminar para verificar ese permiso
      let canDelete = false;
      try {
        const deleteResult = await this.apiCall<unknown>('deleteMessage', {
          chat_id: channelId,
          message_id: messageId
        });
        canDelete = deleteResult.ok;
      } catch (deleteError) {
        console.warn('[TELEGRAM] No puede eliminar mensajes:', (deleteError as Error).message);
      }

      const errors: string[] = [];
      if (!canEdit) errors.push('can_edit_messages');
      if (!canDelete) errors.push('can_delete_messages');

      console.log('[TELEGRAM] Permisos verificados:', {
        canSendMessages: true,
        canEditMessages: canEdit,
        canDeleteMessages: canDelete
      });

      return {
        canSendMessages: true,
        canEditMessages: canEdit,
        canDeleteMessages: canDelete,
        errors
      };
    } catch (error) {
      const errorMsg = (error as Error).message;
      this.lastError = errorMsg;

      console.error('[TELEGRAM] Verificación de permisos fallida:', {
        error: errorMsg
      });

      return {
        canSendMessages: false,
        canEditMessages: false,
        canDeleteMessages: false,
        errors: [errorMsg]
      };
    }
  }

  /**
   * Enviar mensaje a Telegram
   * Con retry logic y manejo de rate limits
   */
  async sendMessage(
    options: SendMessageOptions,
    retryCount: number = 0
  ): Promise<{ success: boolean; messageId?: number; error?: string }> {
    // Aplicar TEST_ONLY: si está activo, SIEMPRE usar canal de prueba sin excepción
    if (this.config.testOnly) {
      if (!this.config.channelTest) {
        console.warn('[TELEGRAM] BLOCKED_TEST_ONLY: canal de prueba no configurado');
        return {
          success: false,
          error: 'BLOCKED_TEST_ONLY: TELEGRAM_CHANNEL_TEST no configurado',
        };
      }
      // Bloquear silenciosamente si alguien intenta usar el canal oficial
      if (options.channelId !== this.config.channelTest && options.channelId === this.config.channelOfficial) {
        console.warn('[TELEGRAM] BLOCKED_TEST_ONLY: intento de usar canal oficial bloqueado');
        return {
          success: false,
          error: 'BLOCKED_TEST_ONLY: publicación en canal oficial bloqueada mientras TEST_ONLY=true',
        };
      }
    }

    const targetChannel = this.config.testOnly ? this.config.channelTest : options.channelId;

    try {
      const result = await this.apiCall<{
        message_id?: number;
        chat?: { id?: string | number };
      }>('sendMessage', {
        chat_id: targetChannel,
        text: options.text,
        parse_mode: options.markdown ? 'Markdown' : 'HTML',
        reply_markup: options.buttons ? {
          inline_keyboard: options.buttons
        } : undefined,
        disable_web_page_preview: false
      });

      if (!result.ok) {
        // Rate limit error (429)
        if (result.error_code === 429 && retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 1000; // exponential backoff
          console.warn('[TELEGRAM] Rate limit 429, reintentando en', delayMs, 'ms');
          
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return this.sendMessage(options, retryCount + 1);
        }

        return {
          success: false,
          error: result.description || `Error ${result.error_code}`
        };
      }

      console.log('[TELEGRAM] Mensaje enviado:', {
        messageId: result.result?.message_id,
        chatId: result.result?.chat?.id,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result.result?.message_id
      };
    } catch (error) {
      const errorMsg = (error as Error).message;
      this.lastError = errorMsg;

      console.error('[TELEGRAM] Error al enviar mensaje:', {
        error: errorMsg,
        retryCount,
        channelId: targetChannel
      });

      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Editar mensaje existente
   */
  async editMessage(
    channelId: string,
    messageId: number,
    newText: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.apiCall<unknown>('editMessageText', {
        chat_id: channelId,
        message_id: messageId,
        text: newText,
        parse_mode: 'Markdown'
      });

      if (!result.ok) {
        return { success: false, error: result.description || 'Error editando mensaje' };
      }

      console.log('[TELEGRAM] Mensaje editado:', {
        messageId,
        chatId: channelId
      });

      return { success: true };
    } catch (error) {
      const errorMsg = (error as Error).message;
      this.lastError = errorMsg;

      console.error('[TELEGRAM] Error al editar mensaje:', {
        error: errorMsg,
        messageId,
        channelId
      });

      return { success: false, error: errorMsg };
    }
  }

  /**
   * Obtener información del estado
   */
  getStatus() {
    return {
      connected: this.isConnected,
      lastError: this.lastError,
      testOnly: this.config.testOnly,
      channelTest: this.config.channelTest,
      channelOfficial: this.config.channelOfficial
    };
  }

  /**
   * Limpiar recursos
   */
  async cleanup() {
    // Con fetch directo, no hay polling que detener
    console.log('[TELEGRAM] Cliente limpio');
  }
}

export default TelegramClientService;
