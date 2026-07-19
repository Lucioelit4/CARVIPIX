import fs from "fs/promises";
import path from "path";

export type LocalSupportTicket = {
  id: string;
  userId: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  message: string;
  adminReply: string | null;
  responsible: string | null;
  conversationSnapshot: Array<{ role: string; content: string }>;
  createdAt: string;
  updatedAt: string;
};

const STORE_PATH = path.join(process.cwd(), "data", "commercial-support-tickets.json");

async function readStore(): Promise<LocalSupportTicket[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as LocalSupportTicket[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeStore(tickets: LocalSupportTicket[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(tickets, null, 2), "utf8");
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listLocalSupportTickets(userId: string): Promise<LocalSupportTicket[]> {
  const tickets = await readStore();
  return tickets.filter((ticket) => ticket.userId === userId).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function listAllLocalSupportTickets(): Promise<LocalSupportTicket[]> {
  const tickets = await readStore();
  return tickets.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function createLocalSupportTicket(input: {
  userId: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  conversationSnapshot?: Array<{ role: string; content: string }>;
  responsible?: string | null;
}): Promise<LocalSupportTicket> {
  const tickets = await readStore();
  const ticket: LocalSupportTicket = {
    id: createId("ticket"),
    userId: input.userId,
    subject: input.subject,
    category: input.category,
    status: "open",
    priority: input.priority,
    message: input.message,
    adminReply: null,
    responsible: input.responsible ?? "support-admin-queue",
    conversationSnapshot: input.conversationSnapshot ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tickets.unshift(ticket);
  await writeStore(tickets.slice(0, 500));
  return ticket;
}

export async function updateLocalSupportTicket(input: {
  ticketId: string;
  status: string;
  adminReply: string;
}): Promise<LocalSupportTicket | null> {
  const tickets = await readStore();
  const index = tickets.findIndex((ticket) => ticket.id === input.ticketId);
  if (index < 0) {
    return null;
  }

  const current = tickets[index];
  const updated: LocalSupportTicket = {
    ...current,
    status: input.status,
    adminReply: input.adminReply || null,
    updatedAt: new Date().toISOString(),
  };

  tickets[index] = updated;
  await writeStore(tickets.slice(0, 500));
  return updated;
}
