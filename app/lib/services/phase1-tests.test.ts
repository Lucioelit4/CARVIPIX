/**
 * Community Publisher V1 - Phase 1 Integration Tests
 * 
 * Pruebas exhaustivas de Fase 1: Integración Telegram Segura
 * 
 * Ejecutar: npm run test -- phase1-tests.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TelegramClientService from '@/app/lib/services/telegramClientService';
import TelegramValidationService from '@/app/lib/services/telegramValidationService';
import CommunityPublisherInitService from '@/app/lib/services/cpInitService';

// Mock fetch
global.fetch = vi.fn();

describe('Community Publisher V1 - Phase 1 Tests', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = { ...process.env };
    fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchMock.mockClear();
  });

  describe('1. Token Validation', () => {
    it('debería bloquearse si TELEGRAM_BOT_TOKEN está vacío', () => {
      expect(() => {
        new TelegramClientService({
          botToken: '',
          channelTest: '@carvipix_test',
          channelOfficial: '@carvipix_official',
          testOnly: true
        });
      }).toThrow('TELEGRAM_BOT_TOKEN no está configurado');
    });

    it('debería bloquearse si TELEGRAM_BOT_TOKEN es null', () => {
      expect(() => {
        new TelegramClientService({
          botToken: null as unknown as string,
          channelTest: '@carvipix_test',
          channelOfficial: '@carvipix_official',
          testOnly: true
        });
      }).toThrow('TELEGRAM_BOT_TOKEN no está configurado');
    });

    it('debería aceptar token válido', () => {
      expect(() => {
        new TelegramClientService({
          botToken: '7123456789:ABCdefGHIJKlmnopqrstuvwxyz',
          channelTest: '@carvipix_test',
          channelOfficial: '@carvipix_official',
          testOnly: true
        });
      }).not.toThrow();
    });
  });

  describe('2. Test-Only Mode Enforcement', () => {
    it('debería bloquear envío a canal oficial si TEST_ONLY=true', async () => {
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: 'test-channel-id',
        channelOfficial: 'official-channel-id',
        testOnly: true
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, result: { message_id: 123 } })
      });

      const result = await client.sendMessage({
        channelId: 'official-channel-id',
        text: 'Test message'
      });

      // Debería haberse enviado a canal de prueba, no al oficial
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[0]).toContain('test-channel-id');
      expect(callArgs[0]).not.toContain('official-channel-id');
    });

    it('debería bloquear envío si TEST_ONLY=true y canal de prueba falta', async () => {
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: '',
        channelOfficial: 'official-channel-id',
        testOnly: true
      });

      const result = await client.sendMessage({
        channelId: 'official-channel-id',
        text: 'Test message'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('TEST_ONLY');
    });

    it('debería permitir envío a canal oficial si TEST_ONLY=false', async () => {
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: 'test-channel-id',
        channelOfficial: 'official-channel-id',
        testOnly: false
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, result: { message_id: 123 } })
      });

      const result = await client.sendMessage({
        channelId: 'official-channel-id',
        text: 'Test message'
      });

      // Debería haberse enviado al canal especificado (oficial)
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[0]).toContain('official-channel-id');
      expect(result.success).toBe(true);
    });
  });

  describe('3. Token Security (No Exposure)', () => {
    it('debería NO exponer token en logs de error', async () => {
      const client = new TelegramClientService({
        botToken: 'super-secret-token-7123456789:XYZABC',
        channelTest: 'test-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      // Mock un error
      fetchMock.mockRejectedValueOnce(new Error('Connection failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await client.sendMessage({
        channelId: 'test-channel',
        text: 'Test'
      });

      const errorLogs = consoleSpy.mock.calls.map(c => c[0]).join('');
      expect(errorLogs).not.toContain('super-secret-token');
      expect(errorLogs).not.toContain('7123456789');
      expect(errorLogs).not.toContain('XYZABC');

      consoleSpy.mockRestore();
    });

    it('debería NO exponer token en status response', () => {
      const client = new TelegramClientService({
        botToken: 'super-secret-token-7123456789:XYZABC',
        channelTest: 'test-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      const status = client.getStatus();
      
      expect(status).not.toHaveProperty('botToken');
      expect(JSON.stringify(status)).not.toContain('super-secret-token');
      expect(JSON.stringify(status)).not.toContain('7123456789');
    });
  });

  describe('4. Channel Validation', () => {
    it('debería validar canal de prueba', async () => {
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: 'test-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: { id: -1001234567890, title: 'Test Channel', type: 'supergroup' }
        })
      });

      const result = await client.validateChannel('test-channel');

      expect(result.valid).toBe(true);
      expect(result.info?.title).toBe('Test Channel');
    });

    it('debería rechazar canal inválido', async () => {
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: 'invalid-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          ok: false,
          error_code: 400,
          description: 'Bad Request: chat not found'
        })
      });

      const result = await client.validateChannel('invalid-channel');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('5. Permission Verification', () => {
    it('debería verificar permisos de envío', async () => {
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: 'test-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: { message_id: 123 }
        })
      });

      const result = await client.verifyBotPermissions('test-channel');

      expect(result.canSendMessages).toBe(true);
    });

    it('debería bloquear si no puede enviar mensajes', async () => {
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: 'test-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          ok: false,
          error_code: 403,
          description: 'Forbidden: bot is not a member'
        })
      });

      const result = await client.verifyBotPermissions('test-channel');

      expect(result.canSendMessages).toBe(false);
      expect(result.errors).toContain('bot is not a member');
    });
  });

  describe('6. Rate Limit Handling (429)', () => {
    it('debería reintentar con exponential backoff en rate limit', async () => {
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: 'test-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      // Primer intento: 429 rate limit
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          ok: false,
          error_code: 429,
          description: 'Too Many Requests: retry after 5'
        })
      });

      // Segundo intento: éxito
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: { message_id: 123 }
        })
      });

      const result = await client.sendMessage({
        channelId: 'test-channel',
        text: 'Test message'
      });

      expect(result.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('debería fallar después de MAX_RETRIES', async () => {
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: 'test-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      // Mock siempre falla con 429
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({
          ok: false,
          error_code: 429,
          description: 'Too Many Requests'
        })
      });

      const result = await client.sendMessage({
        channelId: 'test-channel',
        text: 'Test message'
      });

      expect(result.success).toBe(false);
      expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(4); // 1 initial + 3 retries
    });
  });

  describe('7. Init Service Idempotency', () => {
    it('debería inicializarse solo una vez', async () => {
      process.env.COMMUNITY_PUBLISHER_ENABLED = 'false'; // Disabled para test

      const service1 = CommunityPublisherInitService.getInstance();
      const service2 = CommunityPublisherInitService.getInstance();

      expect(service1).toBe(service2); // Mismo singleton
    });

    it('debería retornar mismo resultado en llamadas múltiples', async () => {
      process.env.COMMUNITY_PUBLISHER_ENABLED = 'false';

      const service = CommunityPublisherInitService.getInstance();
      const result1 = await service.initialize();
      const result2 = await service.initialize();

      expect(result1.success).toBe(result2.success);
    });
  });

  describe('8. No Messages Sent Yet', () => {
    it('debería NO tener mensajes persistidos en inicio', async () => {
      // Este test verifica que en Fase 1 NO hay persistencia de mensajes
      // Solo validación del cliente
      
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: 'test-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      // Verificar que el servicio existe pero no ha enviado nada
      const status = client.getStatus();
      expect(status.connected).toBe(false); // No verificado aún
      expect(status.testOnly).toBe(true);
    });
  });

  describe('9. No Environment Variables Needed Yet', () => {
    it('debería notificar si falta TELEGRAM_BOT_TOKEN', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHANNEL_TEST;
      delete process.env.TELEGRAM_CHANNEL_OFFICIAL;

      expect(() => {
        new TelegramClientService({
          botToken: process.env.TELEGRAM_BOT_TOKEN || '',
          channelTest: process.env.TELEGRAM_CHANNEL_TEST || '',
          channelOfficial: process.env.TELEGRAM_CHANNEL_OFFICIAL || '',
          testOnly: true
        });
      }).toThrow();
    });
  });

  describe('10. Connection Verification', () => {
    it('debería verificar conexión con getMe()', async () => {
      const client = new TelegramClientService({
        botToken: 'test-token',
        channelTest: 'test-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            id: 123456789,
            is_bot: true,
            first_name: 'CarvipixBot',
            username: 'carvipix_test'
          }
        })
      });

      const connected = await client.verifyConnection();

      expect(connected).toBe(true);
      const callUrl = fetchMock.mock.calls[0][0];
      expect(callUrl).toContain('getMe');
    });

    it('debería fallar si token inválido en getMe()', async () => {
      const client = new TelegramClientService({
        botToken: 'invalid-token',
        channelTest: 'test-channel',
        channelOfficial: 'official-channel',
        testOnly: true
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          ok: false,
          error_code: 401,
          description: 'Unauthorized'
        })
      });

      const connected = await client.verifyConnection();

      expect(connected).toBe(false);
    });
  });
});
