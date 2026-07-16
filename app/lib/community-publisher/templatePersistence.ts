/**
 * Template Persistence Layer
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Template, TemplateSendTestResult } from './template-types';
import { writeJsonFile, readJsonFile, DATA_DIR } from './persistence';

export const TEMPLATE_PATH = path.join(DATA_DIR, 'templates.json');
export const TEMPLATE_TEST_LOG = path.join(DATA_DIR, 'template-test-log.json');

// ─── Plantillas ──────────────────────────────────────────────────────────────

export async function loadTemplates(): Promise<Record<string, Template>> {
  return readJsonFile(TEMPLATE_PATH, {} as Record<string, Template>);
}

export async function saveTemplates(templates: Record<string, Template>): Promise<void> {
  return writeJsonFile(TEMPLATE_PATH, templates);
}

export async function getTemplate(templateId: string): Promise<Template | null> {
  const all = await loadTemplates();
  return all[templateId] ?? null;
}

export async function updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template | null> {
  const all = await loadTemplates();
  if (!all[templateId]) return null;

  all[templateId] = { ...all[templateId], ...updates, template_id: templateId };
  await saveTemplates(all);
  return all[templateId];
}

export async function approveTemplate(templateId: string, approvedBy: string): Promise<Template | null> {
  const updated = await updateTemplate(templateId, {
    status: 'APPROVED',
    approved_at: new Date().toISOString(),
    approved_by: approvedBy,
  });
  return updated;
}

export async function freezeTemplate(templateId: string): Promise<Template | null> {
  const updated = await updateTemplate(templateId, {
    status: 'FROZEN',
    frozen_at: new Date().toISOString(),
  });
  return updated;
}

// ─── Test Log ────────────────────────────────────────────────────────────────

export async function appendTemplateTestLog(result: TemplateSendTestResult & { template_id: string; processed_at: string }): Promise<void> {
  const log = await readJsonFile<typeof result[]>(TEMPLATE_TEST_LOG, []);
  log.push(result);
  const trimmed = log.slice(-200); // últimas 200
  await writeJsonFile(TEMPLATE_TEST_LOG, trimmed);
}

export async function getTemplateTestLog(): Promise<Array<TemplateSendTestResult & { template_id: string; processed_at: string }>> {
  return readJsonFile(TEMPLATE_TEST_LOG, []);
}
