export interface CsvContact {
  phone: string;
  name?: string;
}

/**
 * Parse a CSV string into an array of contacts.
 * Expects a header row with at least a "phone" column.
 * Optionally supports a "name" column.
 */
export function parseCSV(text: string): CsvContact[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Parse header
  const headers = lines[0]!
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));

  const phoneIdx = headers.indexOf("phone");
  if (phoneIdx === -1) {
    throw new Error('CSV must have a "phone" column in the header row');
  }
  const nameIdx = headers.indexOf("name");

  // Parse rows
  const contacts: CsvContact[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!
      .split(",")
      .map((c) => c.trim().replace(/^["']|["']$/g, ""));

    const phone = cells[phoneIdx] || "";
    if (!phone) continue;

    contacts.push({
      phone,
      name: nameIdx >= 0 && cells[nameIdx] ? cells[nameIdx] : undefined,
    });
  }

  return contacts;
}

/** Split an array into chunks of the given size. */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
