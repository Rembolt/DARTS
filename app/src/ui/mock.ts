// Stand-in doors and windows, placed around the tour's start. Replaced by Property Intelligence openings
// (`/api/openings/:id`, v2-design.md 7) once that exists; the overlay does not care where the list comes from.
import type { Vec3 } from '../sim/types';
import type { Opening } from './store';

const SPEC: { type: Opening['type']; room: string; angleDeg: number; radius: number; dy: number; open: boolean }[] = [
  { type: 'window', room: 'Living room', angleDeg: -35, radius: 4.2, dy: -0.1, open: false },
  { type: 'window', room: 'Living room', angleDeg: 20, radius: 4.6, dy: -0.1, open: true },
  { type: 'door', room: 'Hall', angleDeg: 75, radius: 3.4, dy: -0.5, open: false },
  { type: 'window', room: 'Kitchen', angleDeg: 140, radius: 4.0, dy: -0.2, open: false },
  { type: 'door', room: 'Kitchen', angleDeg: -110, radius: 3.6, dy: -0.5, open: true },
];

export function mockOpenings(origin: Vec3): Opening[] {
  return SPEC.map((s, i) => {
    const a = (s.angleDeg * Math.PI) / 180;
    return {
      id: `demo-${i + 1}`,
      type: s.type,
      room: s.room,
      label: `${s.room} ${s.type}`,
      position: [origin[0] + Math.sin(a) * s.radius, origin[1] + s.dy, origin[2] - Math.cos(a) * s.radius] as Vec3,
      open: s.open,
    };
  });
}
