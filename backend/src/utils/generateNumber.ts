// Generates sequential, human-friendly document numbers like INV-0007, PO-0012, RT-0003
// based on the count of existing rows. Good enough for a single-instance shop app;
// for high-concurrency use a dedicated sequence table instead.
export function padNumber(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

export function nextDocNumber(prefix: string, existingCount: number): string {
  return `${prefix}-${padNumber(existingCount + 1)}`;
}
