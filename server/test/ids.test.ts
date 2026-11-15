import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isModelId, loadAllowedIds } from '../src/ids.js';

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function writeCsv(text: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'ids-'));
  dirs.push(dir);
  const path = join(dir, 'list.csv');
  writeFileSync(path, text);
  return path;
}

describe('loadAllowedIds', () => {
  it('reads distinct valid ids', () => {
    const csv = writeCsv(
      'ListingId,ResidentialListingId,MatterportModelId,Address,City,State\n' +
        '1,2,Ki9YdfpNKum,9117 Richland Drive,Houston,TX\n' +
        '3,4,Ki9YdfpNKum,9117 Richland Drive,Houston,TX\n' +
        '5,6,short,1 A St,Houston,TX\n' +
        '7,8,,2 B St,Houston,TX\n' +
        '9,10,aaaaaaaaaaa,3 C St,Los Angeles,CA\n',
    );
    expect([...loadAllowedIds([csv])].sort()).toEqual(['Ki9YdfpNKum', 'aaaaaaaaaaa']);
  });

  it('finds the column by its header in either list', () => {
    const csv = writeCsv('PropertyId,MatterportModelId,Address,City,State\r\n23296,oNAvrNiXZS7,9700 Tanner Rd,Houston,TX\r\n');
    expect([...loadAllowedIds([csv])]).toEqual(['oNAvrNiXZS7']);
  });

  it('throws on a missing file', () => {
    expect(() => loadAllowedIds([join(tmpdir(), 'no-such-dir', 'x.csv')])).toThrow();
  });
});

describe('isModelId', () => {
  it('rejects ids that could reach a path', () => {
    for (const bad of ['../../etc/pw', 'Ki9YdfpNKum/', 'Ki9YdfpNKu', 'Ki9YdfpNKumm', 'Ki9Ydf NKum', 42, null]) {
      expect(isModelId(bad), String(bad)).toBe(false);
    }
  });

  it('accepts a real id', () => {
    expect(isModelId('Ki9YdfpNKum')).toBe(true);
  });
});
