import { h, render, type ComponentType } from 'preact';
import { ArrowUp, Check, Headphones, Loader2, MapPin, Mic, MicOff, Square } from 'lucide-preact';

/** A lucide icon for the plain-DOM front door: the same icon set and the same Preact runtime the tour's overlay uses. */
export function icon(Icon: ComponentType<{ size?: number; strokeWidth?: number }>, size = 15): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'fd-icon';
  span.setAttribute('aria-hidden', 'true');
  render(h(Icon, { size, strokeWidth: 2.2 }), span);
  return span;
}

export { ArrowUp, Check, Headphones, Loader2, MapPin, Mic, MicOff, Square };
