/**
 * Community Publisher V1 - Telegram Validation Service
 * 
 * Validar canal, permisos y configuración inicial del bot
 */

import TelegramClientService from './telegramClientService';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface TelegramValidationResult {
  success: boolean;
  status: 'ready' | 'misconfigured' | 'error';
  checks: {
    botConnected: boolean;
    channelTestValid: boolean;
    channelOfficialValid: boolean;
    botPermissions: boolean;
  };
  errors: string[];
  warnings: string[];
}

export class TelegramValidationService {
  private telegramClient: TelegramClientService;
  private configPath = path.join(process.cwd(), 'data/community-publisher/config.json');

  constructor(telegramClient: TelegramClientService) {
    this.telegramClient = telegramClient;
  }

  /**
   * Ejecutar validación completa
   */
  async validateAll(): Promise<TelegramValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const checks = {
      botConnected: false,
      channelTestValid: false,
      channelOfficialValid: false,
      botPermissions: false
    };

    try {
      // 1. Verificar conexión del bot
      console.log('[VALIDATION] Verificando conexión del bot...');
      const connected = await this.telegramClient.verifyConnection();
      checks.botConnected = connected;

      if (!connected) {
        errors.push('No se pudo conectar al bot de Telegram. Verificar TELEGRAM_BOT_TOKEN en .env.local');
        return {
          success: false,
          status: 'error',
          checks,
          errors,
          warnings
        };
      }

      // 2. Validar canal de prueba
      console.log('[VALIDATION] Validando canal de prueba...');
      const channelTest = process.env.TELEGRAM_CHANNEL_TEST;
      if (!channelTest) {
        errors.push('TELEGRAM_CHANNEL_TEST no está configurado en .env.local');
      } else {
        const validationTest = await this.telegramClient.validateChannel(channelTest);
        checks.channelTestValid = validationTest.valid;

        if (!validationTest.valid) {
          errors.push(`Canal de prueba inválido: ${validationTest.error}`);
        }
      }

      // 3. Validar canal oficial
      console.log('[VALIDATION] Validando canal oficial...');
      const channelOfficial = process.env.TELEGRAM_CHANNEL_OFFICIAL;
      if (!channelOfficial) {
        errors.push('TELEGRAM_CHANNEL_OFFICIAL no está configurado en .env.local');
      } else {
        const validationOfficial = await this.telegramClient.validateChannel(channelOfficial);
        checks.channelOfficialValid = validationOfficial.valid;

        if (!validationOfficial.valid) {
          errors.push(`Canal oficial inválido: ${validationOfficial.error}`);
        }
      }

      // 4. Verificar permisos en canal de prueba
      if (checks.channelTestValid && channelTest) {
        console.log('[VALIDATION] Verificando permisos del bot...');
        const permissions = await this.telegramClient.verifyBotPermissions(channelTest);
        checks.botPermissions = permissions.canSendMessages && 
                               permissions.canEditMessages && 
                               permissions.canDeleteMessages;

        if (permissions.errors.length > 0) {
          warnings.push(`Permisos insuficientes: ${permissions.errors.join(', ')}`);
        }
      }

      // 5. Guardar configuración validada
      await this.saveValidationConfig();

      const status: 'ready' | 'misconfigured' | 'error' = 
        errors.length > 0 ? 'error' :
        warnings.length > 0 ? 'misconfigured' : 'ready';

      return {
        success: errors.length === 0,
        status,
        checks,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Error durante validación: ${(error as Error).message}`);
      return {
        success: false,
        status: 'error',
        checks,
        errors,
        warnings
      };
    }
  }

  /**
   * Guardar configuración validada
   */
  private async saveValidationConfig() {
    try {
      // Crear directorio si no existe
      const dir = path.dirname(this.configPath);
      await fs.mkdir(dir, { recursive: true });

      // Leer config existente o crear vacía
      let config = {
        timezone: process.env.CARVIPIX_TIMEZONE || 'America/Mazatlan',
        channel_test: process.env.TELEGRAM_CHANNEL_TEST || '',
        channel_official: process.env.TELEGRAM_CHANNEL_OFFICIAL || '',
        limits: {
          free_alerts_per_day: 2,
          promo_hours_between: 48
        },
        blocked_keywords: [
          'prompt',
          'api_key',
          'secret',
          'password',
          'token',
          'firebase_key',
          'private_key',
          'api-key'
        ],
        paused: false,
        test_only: process.env.TEST_ONLY === 'true'
      };

      // Intentar cargar existente
      try {
        const existing = JSON.parse(await fs.readFile(this.configPath, 'utf-8'));
        config = { ...existing, ...config };
      } catch (e) {
        // Archivo no existe o es inválido, usar config nueva
      }

      // Guardar
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      console.log('[VALIDATION] Configuración guardada:', this.configPath);
    } catch (error) {
      console.error('[VALIDATION] Error guardando config:', (error as Error).message);
      throw error;
    }
  }

  /**
   * Verificar que todo esté listo para enviar mensajes
   */
  async isReadyToSend(): Promise<boolean> {
    const result = await this.validateAll();
    return result.success && result.status === 'ready';
  }

  /**
   * Obtener reporte de validación legible
   */
  async getValidationReport(): Promise<string> {
    const result = await this.validateAll();

    let report = '='.repeat(60) + '\n';
    report += 'VALIDACIÓN: TELEGRAM BOT API\n';
    report += '='.repeat(60) + '\n\n';

    report += `Status: ${result.status.toUpperCase()}\n`;
    report += `Success: ${result.success ? '✅ SÍ' : '❌ NO'}\n\n`;

    report += 'VERIFICACIONES:\n';
    report += `  Bot conectado: ${result.checks.botConnected ? '✅' : '❌'}\n`;
    report += `  Canal test válido: ${result.checks.channelTestValid ? '✅' : '❌'}\n`;
    report += `  Canal oficial válido: ${result.checks.channelOfficialValid ? '✅' : '❌'}\n`;
    report += `  Permisos del bot: ${result.checks.botPermissions ? '✅' : '❌'}\n\n`;

    if (result.errors.length > 0) {
      report += 'ERRORES:\n';
      result.errors.forEach(e => {
        report += `  ❌ ${e}\n`;
      });
      report += '\n';
    }

    if (result.warnings.length > 0) {
      report += 'ADVERTENCIAS:\n';
      result.warnings.forEach(w => {
        report += `  ⚠️  ${w}\n`;
      });
      report += '\n';
    }

    report += 'VARIABLES DE ENTORNO:\n';
    report += `  TELEGRAM_BOT_TOKEN: ${'*'.repeat(20)} (${process.env.TELEGRAM_BOT_TOKEN ? '✅' : '❌'})\n`;
    report += `  TELEGRAM_CHANNEL_TEST: ${process.env.TELEGRAM_CHANNEL_TEST || '(no configurado)'}\n`;
    report += `  TELEGRAM_CHANNEL_OFFICIAL: ${process.env.TELEGRAM_CHANNEL_OFFICIAL || '(no configurado)'}\n`;
    report += `  TEST_ONLY: ${process.env.TEST_ONLY || 'true'}\n`;
    report += `  CARVIPIX_TIMEZONE: ${process.env.CARVIPIX_TIMEZONE || 'America/Mazatlan'}\n\n`;

    report += 'PRÓXIMOS PASOS:\n';
    if (!result.success) {
      report += '  1. Revisar errores arriba\n';
      report += '  2. Configurar variables de entorno en .env.local\n';
      report += '  3. Verificar que el bot es admin del canal\n';
      report += '  4. Reintentar validación\n';
    } else {
      report += '  ✅ Sistema listo para enviar mensajes\n';
      report += `  ✅ Modo TEST_ONLY = ${process.env.TEST_ONLY === 'true' ? 'ACTIVADO (pruebas)' : 'DESACTIVADO (oficial)'}\n`;
    }

    report += '='.repeat(60) + '\n';

    return report;
  }
}

export default TelegramValidationService;
