import type { Client } from "./types";

const FIELDS = ["name", "email", "address", "phone", "notes"] as const;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function clientsToCsv(clients: Client[]): string {
  const header = FIELDS.join(",");
  const rows = clients.map((client) =>
    FIELDS.map((field) => csvEscape(client[field] ?? "")).join(",")
  );
  return [header, ...rows].join("\n");
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

export interface CsvImportResult {
  clients: Array<Omit<Client, "id" | "createdAt">>;
  errors: string[];
}

export function csvToClients(text: string): CsvImportResult {
  const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { clients: [], errors: ["CSV file is empty."] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const nameIndex = header.indexOf("name");
  if (nameIndex === -1) {
    return { clients: [], errors: ['CSV must include a "name" column.'] };
  }

  const errors: string[] = [];
  const clients: Array<Omit<Client, "id" | "createdAt">> = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    header.forEach((field, idx) => {
      row[field] = cells[idx] ?? "";
    });

    if (!row.name?.trim()) {
      errors.push(`Row ${i + 1}: missing name, skipped.`);
      continue;
    }

    clients.push({
      name: row.name.trim(),
      email: row.email?.trim() ?? "",
      address: row.address?.trim() ?? "",
      phone: row.phone?.trim() ?? "",
      notes: row.notes?.trim() ?? "",
    });
  }

  return { clients, errors };
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
