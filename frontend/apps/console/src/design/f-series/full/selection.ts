export interface SelectionRecord { id: string; name: string; eligible: boolean }
export interface SelectionRow {
  key: string; input: string; id: string; state: string; matches: SelectionRecord[];
}
export function analyzeSelection(inputs: string[], records: SelectionRecord[], resolved: Record<string, string>): SelectionRow[] {
  const seen = new Set<string>();
  return inputs.map((raw, index) => {
    const input = raw.trim();
    const key = String(index);
    const matches = records.filter(r => r.id.toLowerCase() === input.toLowerCase() || r.name === input);
    const chosen = matches.length === 1 ? matches[0] : matches.find(r => r.id === resolved[key]);
    let state = !matches.length ? 'unavailable' : !chosen ? 'ambiguous' : !chosen.eligible ? 'outside' : 'ready';
    if (chosen && seen.has(chosen.id)) state = 'duplicate';
    if (chosen) seen.add(chosen.id);
    return { key, input, matches, id: chosen?.id || '', state };
  });
}
export function parseWorkbookRows(rows: (string | number)[][], column: string): string[] {
  const headers = Array.from(rows[0] || [], x => String(x ?? '').trim());
  if (!headers.includes(column) || new Set(headers).size !== headers.length || headers.some(x => ![column, '名称', 'Name'].includes(x)))
    throw new Error('请使用标准模板列，保留唯一的编号或邮箱列。');
  if (rows.length > 1001) throw new Error('单次最多1000行，请分批处理。');
  const position = headers.indexOf(column);
  return rows.slice(1).filter(row => row.some(x => String(x).trim())).map((row, index) => {
    const value = row[position];
    if (typeof value !== 'string' || !value.trim() || /^[=+@]/.test(value.trim()) || row.length > headers.length)
      throw new Error(`第${index + 2}行：编号或邮箱须为非空文本，不支持公式或数值编号。`);
    return value.trim();
  });
}

function xml(body: Uint8Array): Document {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(body);
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('文件包含不支持的内容，请使用标准Excel模板。');
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('Excel内容无法读取，请重新保存标准xlsx文件。');
  return doc;
}
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
/** Bounded, read-only XLSX input. No macros, formulas, remote fetches or data writes. */
export async function readXlsx(bytes: Uint8Array, column = '编号'): Promise<string[]> {
  if (bytes.length > 2 * 1024 * 1024 || bytes.length < 22) throw new Error('请上传2MiB以内的标准xlsx文件。');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  for (; end >= Math.max(0, bytes.length - 65557); end--)
    if (view.getUint32(end, true) === 0x06054b50) break;
  if (end < 0 || view.getUint32(end, true) !== 0x06054b50 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true))
    throw new Error('请使用未加密的标准xlsx文件。');
  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const centralEnd = cursor + view.getUint32(end + 12, true);
  if (count > 64 || centralEnd > end) throw new Error('Excel文件结构或大小超出本次限制。');
  const parts = new Map<string, Uint8Array>();
  let total = 0;
  for (let entry = 0; entry < count; entry++) {
    if (cursor + 46 > centralEnd || view.getUint32(cursor, true) !== 0x02014b50) throw new Error('Excel文件结构不完整。');
    const flags = view.getUint16(cursor + 8, true), method = view.getUint16(cursor + 10, true);
    const crc = view.getUint32(cursor + 16, true), compressed = view.getUint32(cursor + 20, true), size = view.getUint32(cursor + 24, true);
    const nameLength = view.getUint16(cursor + 28, true), extra = view.getUint16(cursor + 30, true), comment = view.getUint16(cursor + 32, true);
    if (cursor + 46 + nameLength + extra + comment > centralEnd) throw new Error('Excel文件结构不完整。');
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    if (flags & 1 || ![0, 8].includes(method) || name.includes('..') || name.startsWith('/') || name.includes('\\') || parts.has(name))
      throw new Error('文件包含重复或不支持的部件，请重新保存xlsx。');
    total += size;
    if (total > 8 * 1024 * 1024 || size > 4 * 1024 * 1024) throw new Error('Excel展开内容过大，请分批导入。');
    const local = view.getUint32(cursor + 42, true);
    if (local + 30 > bytes.length || view.getUint32(local, true) !== 0x04034b50) throw new Error('Excel文件部件不完整。');
    const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
    if (start + compressed > cursor) throw new Error('Excel文件部件越界。');
    const packed = bytes.slice(start, start + compressed);
    let body = packed;
    if (method === 8) {
      const reader = new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      const chunks: Uint8Array[] = []; let length = 0;
      try {
        for (;;) {
          const chunk = await reader.read(); if (chunk.done) break;
          length += chunk.value.length;
          if (length > size || length > 4 * 1024 * 1024) throw new Error('Excel展开内容超过声明大小。');
          chunks.push(chunk.value);
        }
      } finally { await reader.cancel(); }
      body = new Uint8Array(length); let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    }
    if (body.length !== size || crc32(body) !== crc) throw new Error('Excel内容校验失败，请重新保存文件。');
    parts.set(name, body);
    cursor += 46 + nameLength + extra + comment;
  }
  const workbook = parts.get('xl/workbook.xml'), relationships = parts.get('xl/_rels/workbook.xml.rels');
  if (!workbook || !relationships) throw new Error('缺少标准Excel工作簿，请下载模板后重试。');
  const sheet = xml(workbook).getElementsByTagName('sheet')[0];
  const sheetId = sheet?.getAttribute('r:id');
  const relation = Array.from(xml(relationships).getElementsByTagName('Relationship')).find(r => r.getAttribute('Id') === sheetId);
  const target = relation?.getAttribute('Target') || '';
  if (!target || target.includes('..') || relation?.getAttribute('TargetMode') === 'External') throw new Error('工作表引用不可用。');
  const path = target.startsWith('/') ? target.slice(1) : 'xl/' + target;
  const sheetBytes = parts.get(path);
  if (!sheetBytes) throw new Error('无法读取第一张工作表。');
  const sharedBytes = parts.get('xl/sharedStrings.xml');
  const shared = sharedBytes ? Array.from(xml(sharedBytes).getElementsByTagName('si')).map(r => Array.from(r.getElementsByTagName('t')).map(t => t.textContent || '').join('')) : [];
  const sheetDoc = xml(sheetBytes);
  if (sheetDoc.getElementsByTagName('f').length) throw new Error('文件含公式，请粘贴为文本值后重新导入。');
  const rows = Array.from(sheetDoc.getElementsByTagName('row'));
  if (rows.length > 1001) throw new Error('单次最多1000行。');
  return parseWorkbookRows(rows.map(row => {
    const result: (string | number)[] = [];
    for (const cell of Array.from(row.getElementsByTagName('c'))) {
      const coordinate = cell.getAttribute('r') || '';
      const letters = coordinate.match(/^[A-Z]+/)?.[0] || '';
      let position = 0; for (const ch of letters) position = position * 26 + ch.charCodeAt(0) - 64;
      if (!position || position > 2) throw new Error('只支持模板中的编号/邮箱及名称两列。');
      const type = cell.getAttribute('t'), raw = cell.getElementsByTagName('v')[0]?.textContent || '';
      result[position - 1] = type === 's' ? shared[Number(raw)] ?? '' : type === 'inlineStr'
        ? Array.from(cell.getElementsByTagName('t')).map(t => t.textContent || '').join('')
        : type === 'str' ? raw : raw ? Number(raw) : '';
    }
    return result;
  }), column);
}
