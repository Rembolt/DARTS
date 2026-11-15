import { DEMO_MODEL_ID } from '../../../server/src/shared/contract';
import { tourUrl } from '../route';

/** The front door (a stub until Lane E builds it): a heading and a way into the demo house. */
export function startFrontDoor(root: HTMLElement): void {
  const heading = document.createElement('h1');
  heading.textContent = 'Acoustic Experience';
  const link = document.createElement('a');
  link.href = tourUrl(DEMO_MODEL_ID);
  link.textContent = 'Skip to the demo house';
  root.replaceChildren(heading, link);
}
