import { it, expect } from 'vitest';
import { parseObj } from './obj';

const bytes = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

it('converts Z-up to Y-up and reads triangles, polygons, v/vt/vn tokens, negative indices and CRLF', () => {
  const mesh = parseObj(
    bytes('v 0 0 0\nv 1 0 0\nv 1 2 3\r\nv 0 1 0\n# comment\ng chunk000\n' + 'f 1 2 3\nf 1/1/1 2/2/2 3/3/3 4/4/4\nf -4 -3 -2\n'),
  );
  expect(Array.from(mesh.positions.slice(6, 9))).toEqual([1, 3, -2]);
  expect(Array.from(mesh.indices)).toEqual([0, 1, 2, 0, 1, 2, 0, 2, 3, 0, 1, 2]);
});

it('ignores vt, vn and other lines', () => {
  const mesh = parseObj(bytes('mtllib a.mtl\nv 0 0 0\nvt 0 0\nvn 0 0 1\nv 1 0 0\nv 0 1 0\nusemtl x\ns off\nf 1 2 3\n'));
  expect(mesh.positions.length).toBe(9);
  expect(Array.from(mesh.indices)).toEqual([0, 1, 2]);
});

it('rejects a file without triangles', () => {
  expect(() => parseObj(bytes('v 0 0 0\n'))).toThrow('Mesh has no triangles');
});

it('rejects a face that points past the vertex list', () => {
  expect(() => parseObj(bytes('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 9\n'))).toThrow(
    'Face refers to vertex 9, which does not exist',
  );
});

it('rejects a vertex with a missing coordinate instead of reading it as 0', () => {
  expect(() => parseObj(bytes('v 1.0 2.0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n'))).toThrow('Vertex is not three numbers: "v 1.0 2.0"');
});

it('rejects a vertex that is not a number', () => {
  expect(() => parseObj(bytes('v 1 2 nan\n'))).toThrow('Vertex is not three numbers: "v 1 2 nan"');
  expect(() => parseObj(bytes('v 1 2 Infinity\n'))).toThrow('Vertex is not three numbers');
});
