/**
 * Community Publisher Templates Panel
 * Gestionar: visualizar, editar, probar, aprobar, congelar
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Send, CheckCircle, Lock, Edit2, Eye } from 'lucide-react';
import type { Template, TemplateVariant } from '@/app/lib/community-publisher/template-types';

export function CommunityPublisherTemplatesPanel() {
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [testingResult, setTestingResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Cargar plantillas
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Primero inicializar
        const initResp = await fetch('/api/internal/community-publisher/templates/initialize', {
          method: 'POST',
          headers: { 'Origin': 'http://localhost:3000', 'Referer': 'http://localhost:3000/' },
        });

        // Luego cargar
        const resp = await fetch('/api/internal/community-publisher/templates', {
          headers: { 'Origin': 'http://localhost:3000', 'Referer': 'http://localhost:3000/' },
        });

        if (resp.ok) {
          const data = (await resp.json()) as { templates: Template[] };
          const record: Record<string, Template> = {};
          data.templates.forEach(t => {
            record[t.template_id] = t;
          });
          setTemplates(record);
          setSelectedTemplate(Object.keys(record)[0] || null);
        }
      } catch (err) {
        console.error('Error loading templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Aprobar plantilla
  const handleApprove = async (templateId: string) => {
    try {
      setTestingId(templateId);
      const resp = await fetch(
        `/api/internal/community-publisher/templates/${templateId}/approve`,
        {
          method: 'POST',
          headers: { 'Origin': 'http://localhost:3000', 'Referer': 'http://localhost:3000/' },
          body: JSON.stringify({ approved_by: 'admin' }),
        }
      );

      if (resp.ok) {
        const data = (await resp.json()) as { template: Template };
        setTemplates(prev => ({ ...prev, [templateId]: data.template }));
        setTestingResult({ ok: true, message: 'Template approved ✓' });
      } else {
        setTestingResult({ ok: false, message: 'Error approving template' });
      }
    } catch (err) {
      setTestingResult({ ok: false, message: String(err) });
    } finally {
      setTestingId(null);
    }
  };

  // Congelar plantilla
  const handleFreeze = async (templateId: string) => {
    try {
      setTestingId(templateId);
      const resp = await fetch(
        `/api/internal/community-publisher/templates/${templateId}/freeze`,
        {
          method: 'POST',
          headers: { 'Origin': 'http://localhost:3000', 'Referer': 'http://localhost:3000/' },
        }
      );

      if (resp.ok) {
        const data = (await resp.json()) as { template: Template };
        setTemplates(prev => ({ ...prev, [templateId]: data.template }));
        setTestingResult({ ok: true, message: 'Template frozen ✓' });
      } else {
        setTestingResult({ ok: false, message: 'Error freezing template' });
      }
    } catch (err) {
      setTestingResult({ ok: false, message: String(err) });
    } finally {
      setTestingId(null);
    }
  };

  // Enviar test
  const handleSendTest = async (templateId: string, variantId?: string) => {
    try {
      setTestingId(templateId);
      const resp = await fetch(
        `/api/internal/community-publisher/templates/${templateId}/send-test`,
        {
          method: 'POST',
          headers: { 'Origin': 'http://localhost:3000', 'Referer': 'http://localhost:3000/' },
          body: JSON.stringify({
            variant_id: variantId,
            test_data: {
              instrument: 'XAUUSD',
              decision: 'BUY',
              entry: '2320.00',
              stop_loss: '2310.00',
              take_profit: '2340.00',
              risk_reward: '2.0',
              confidence_level: 'HIGH',
              origin: 'PAPER',
            },
          }),
        }
      );

      if (resp.ok) {
        const data = (await resp.json()) as { message_id: number; variant_used: string };
        setTestingResult({
          ok: true,
          message: `Test sent! Message ID: ${data.message_id}, Variant: ${data.variant_used}`,
        });
      } else {
        const error = (await resp.json()) as { error?: string };
        setTestingResult({ ok: false, message: error.error || 'Error sending test' });
      }
    } catch (err) {
      setTestingResult({ ok: false, message: String(err) });
    } finally {
      setTestingId(null);
    }
  };

  const statusColor: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    FROZEN: 'bg-green-100 text-green-800',
  };

  const template = selectedTemplate ? templates[selectedTemplate] : null;

  if (loading) {
    return <div className="p-4">Loading templates...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-bold">📋 PLANTILLAS OFICIALES</h2>

      {/* Template Selection */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(templates).map(([id, tpl]) => (
          <button
            key={id}
            onClick={() => setSelectedTemplate(id)}
            className={`p-2 rounded text-sm font-medium transition ${
              selectedTemplate === id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {tpl.type}
            <br />
            <span className="text-xs">{tpl.status}</span>
          </button>
        ))}
      </div>

      {/* Template Details */}
      {template && (
        <div className="border rounded-lg p-4 space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold">{template.type}</h3>
              <p className="text-sm text-gray-600">{template.description}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[template.status]}`}>
              {template.status}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {template.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => handleApprove(template.template_id)}
                  disabled={testingId === template.template_id}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleSendTest(template.template_id)}
                  disabled={testingId === template.template_id}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50"
                >
                  📤 Send Test
                </button>
              </>
            )}

            {template.status === 'APPROVED' && (
              <>
                <button
                  onClick={() => handleSendTest(template.template_id)}
                  disabled={testingId === template.template_id}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50"
                >
                  📤 Send Test
                </button>
                <button
                  onClick={() => handleFreeze(template.template_id)}
                  disabled={testingId === template.template_id}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  🔒 Freeze
                </button>
              </>
            )}

            {template.status === 'FROZEN' && (
              <button
                onClick={() => handleSendTest(template.template_id)}
                disabled={testingId === template.template_id}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
              >
                ✓ Frozen — Can test
              </button>
            )}
          </div>

          {/* Test Result */}
          {testingResult && testingId === template.template_id && (
            <div
              className={`p-2 rounded text-sm ${
                testingResult.ok
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {testingResult.message}
            </div>
          )}

          {/* Variants */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold">Variantes ({template.variants.length})</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {template.variants.map(variant => (
                <div
                  key={variant.variant_id}
                  className="bg-gray-50 p-2 rounded text-xs space-y-1 cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedVariant(selectedVariant === variant.variant_id ? null : variant.variant_id)}
                >
                  <div className="font-mono text-xs font-bold">{variant.variant_id}</div>
                  <div className="text-gray-700">{variant.preview}</div>
                  {selectedVariant === variant.variant_id && (
                    <div className="mt-2 pt-2 border-t text-gray-600">
                      <div className="whitespace-pre-wrap text-xs">{variant.body.substring(0, 200)}...</div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSendTest(template.template_id, variant.variant_id);
                        }}
                        className="mt-2 px-2 py-1 bg-purple-400 text-white rounded text-xs hover:bg-purple-500"
                      >
                        Test this variant
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-500 pt-2 border-t space-y-1">
            <div>Created: {new Date(template.created_at).toLocaleString()}</div>
            {template.approved_at && <div>Approved: {new Date(template.approved_at).toLocaleString()}</div>}
            {template.frozen_at && <div>Frozen: {new Date(template.frozen_at).toLocaleString()}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
