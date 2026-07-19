/**
 * Community Publisher V1 - Initialization Service
 * 
 * Ejecutar al startup de la aplicación
 * Validar Telegram y preparar el sistema
 */

import TelegramClientService from './telegramClientService';
import TelegramValidationService from './telegramValidationService';

export class CommunityPublisherInitService {
  private static instance: CommunityPublisherInitService;
  private telegramClient: TelegramClientService | null = null;
  private validationService: TelegramValidationService | null = null;
  private isInitialized = false;
  private initError: string | null = null;

  private constructor() {}

  /**
   * Singleton pattern
   */
  public static getInstance(): CommunityPublisherInitService {
    if (!CommunityPublisherInitService.instance) {
      CommunityPublisherInitService.instance = new CommunityPublisherInitService();
    }
    return CommunityPublisherInitService.instance;
  }

  /**
   * Inicializar el sistema
   * Llamar en el middleware de la aplicación
   */
  async initialize(): Promise<{
    success: boolean;
    error?: string;
    report?: string;
  }> {
    if (this.isInitialized) {
      return { success: true };
    }

    try {
      console.log('[COMMUNITY PUBLISHER] Inicializando...');

      // 1. Verificar que Community Publisher está habilitado
      if (process.env.COMMUNITY_PUBLISHER_ENABLED !== 'true') {
        console.log('[COMMUNITY PUBLISHER] Deshabilitado en .env');
        return {
          success: true // No es error, solo no funciona
        };
      }

      // 2. Inicializar cliente Telegram
      const config = {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        channelTest: process.env.TELEGRAM_CHANNEL_TEST || '',
        channelOfficial: process.env.TELEGRAM_CHANNEL_OFFICIAL || '',
        testOnly: process.env.TEST_ONLY === 'true'
      };

      this.telegramClient = new TelegramClientService(config);

      // 3. Inicializar servicio de validación
      this.validationService = new TelegramValidationService(this.telegramClient);

      // 4. Ejecutar validación completa
      const validation = await this.validationService.validateAll();

      if (!validation.success) {
        this.initError = validation.errors.join('; ');
        console.error('[COMMUNITY PUBLISHER] Validación fallida:', this.initError);
      } else {
        console.log('[COMMUNITY PUBLISHER] Inicialización exitosa');
      }

      this.isInitialized = true;

      // 5. Generar y loguear reporte
      const report = await this.validationService.getValidationReport();
      console.log('\n' + report + '\n');

      return {
        success: validation.success,
        error: validation.success ? undefined : this.initError || undefined,
        report
      };
    } catch (error) {
      const errorMsg = (error as Error).message;
      this.initError = errorMsg;
      console.error('[COMMUNITY PUBLISHER] Error durante inicialización:', errorMsg);

      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Obtener instancia del cliente Telegram
   */
  getTelegramClient(): TelegramClientService | null {
    return this.telegramClient;
  }

  /**
   * Obtener servicio de validación
   */
  getValidationService(): TelegramValidationService | null {
    return this.validationService;
  }

  /**
   * Verificar si está inicializado
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Obtener error de inicialización (si existe)
   */
  getInitError(): string | null {
    return this.initError;
  }

  /**
   * Limpiar recursos
   */
  async cleanup() {
    if (this.telegramClient) {
      await this.telegramClient.cleanup();
    }
  }
}

export default CommunityPublisherInitService;
