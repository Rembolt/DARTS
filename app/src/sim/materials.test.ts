import { it, expect } from 'vitest';
import { MATERIAL_IDS, tagMaterials } from './materials';

// Positions are already Y-up. Facing comes from the winding: (b − a) × (c − a).
const tri = (...p: number[]) => ({ positions: new Float32Array(p), indices: new Uint32Array([0, 1, 2]) });

it('numbers the materials in the order of SimConfig.materials', () => {
  expect(MATERIAL_IDS).toEqual({ wall: 0, floor: 1, ceiling: 2 });
});

it('tags a triangle facing up as floor', () => {
  expect(tagMaterials(tri(0, 0, 0, 0, 0, 1, 1, 0, 0))[0]).toBe(MATERIAL_IDS.floor);
});

it('tags a triangle facing down as ceiling', () => {
  expect(tagMaterials(tri(0, 0, 0, 1, 0, 0, 0, 0, 1))[0]).toBe(MATERIAL_IDS.ceiling);
});

it('tags a sideways triangle as wall', () => {
  expect(tagMaterials(tri(0, 0, 0, 1, 0, 0, 0, 1, 0))[0]).toBe(MATERIAL_IDS.wall);
});

it('splits at 45°: a slope of 37° from level is floor, 53° is wall', () => {
  expect(tagMaterials(tri(0, 0, 0, 0, 0, 1, 1, 0.75, 0))[0]).toBe(MATERIAL_IDS.floor);
  expect(tagMaterials(tri(0, 0, 0, 0, 0, 1, 1, 1.333, 0))[0]).toBe(MATERIAL_IDS.wall);
});

it('tags a zero-area triangle as wall', () => {
  expect(tagMaterials(tri(0, 0, 0, 1, 0, 0, 2, 0, 0))[0]).toBe(MATERIAL_IDS.wall);
});

it('gives the same tags with precomputed normals', async () => {
  const { faceNormals } = await import('./normals');
  const m = tri(0, 0, 0, 0, 0, 1, 1, 0, 0);
  expect(tagMaterials(m, faceNormals(m))).toEqual(tagMaterials(m));
});
