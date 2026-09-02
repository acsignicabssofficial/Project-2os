export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const csvContent = rows
    .map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTemplate(headers: string[], filename: string) {
  exportToCSV(filename, [headers]);
}

export function formatTin(tin: string): string {
  const digits = (tin || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})?(\d{3})?/, (_, p1, p2, p3) => {
      let res = p1;
      if (p2) res += '-' + p2;
      if (p3) res += '-' + p3;
      return res;
    });
  }
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{3,5})/, '$1-$2-$3-$4');
}

export function pickField(row: Record<string, any>, possibleKeys: string[]): string {
  for (const key of possibleKeys) {
    const k = key.toLowerCase();
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase() === k) {
        return String(row[rowKey] ?? '').trim();
      }
    }
  }
  return '';
}

export function parseImportFile(file: File): Promise<Array<Record<string, any>>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        resolve([]);
        return;
      }
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length === 0) {
        resolve([]);
        return;
      }

      // Parse CSV headers
      const parseLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headers = parseLine(lines[0]);
      const dataRows = lines.slice(1).map(line => parseLine(line));

      const records = dataRows.map(row => {
        const record: Record<string, any> = {};
        headers.forEach((h, idx) => {
          record[h] = row[idx] || '';
        });
        return record;
      });

      resolve(records);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
