import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Client, SavedInvoice } from "./types";

interface InvoicelyDB extends DBSchema {
  clients: {
    key: string;
    value: Client;
    indexes: { createdAt: number };
  };
  invoices: {
    key: string;
    value: SavedInvoice;
    indexes: { createdAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<InvoicelyDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<InvoicelyDB>("invoicely", 1, {
      upgrade(db) {
        const clients = db.createObjectStore("clients", { keyPath: "id" });
        clients.createIndex("createdAt", "createdAt");

        const invoices = db.createObjectStore("invoices", { keyPath: "id" });
        invoices.createIndex("createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

function newId() {
  return crypto.randomUUID();
}

export async function listClients(): Promise<Client[]> {
  const db = await getDb();
  const clients = await db.getAllFromIndex("clients", "createdAt");
  return clients.reverse();
}

export async function saveClient(
  client: Omit<Client, "id" | "createdAt"> & { id?: string }
): Promise<Client> {
  const db = await getDb();
  const record: Client = {
    id: client.id ?? newId(),
    name: client.name,
    email: client.email,
    address: client.address,
    phone: client.phone,
    notes: client.notes,
    createdAt: Date.now(),
  };
  await db.put("clients", record);
  return record;
}

export async function deleteClient(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("clients", id);
}

export async function listInvoices(): Promise<SavedInvoice[]> {
  const db = await getDb();
  const invoices = await db.getAllFromIndex("invoices", "createdAt");
  return invoices.reverse();
}

export async function saveInvoice(
  invoice: Omit<SavedInvoice, "id" | "createdAt">
): Promise<SavedInvoice> {
  const db = await getDb();
  const record: SavedInvoice = {
    ...invoice,
    id: newId(),
    createdAt: Date.now(),
  };
  await db.put("invoices", record);
  return record;
}

export async function deleteInvoice(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("invoices", id);
}
