// The not-possible screen (v3-design.md 4.4, 8): the message, "Back to search" and, when it can help, "Try again".
import type { NotPossible } from '../../../server/src/shared/contract';
import { FRONT_URL } from '../route';

/**
 * Replace everything in `root` with the reason. The tour's iframe and canvas go with it, so nothing keeps running
 * behind the message. Text only: the message comes from the server and is never parsed as markup.
 */
export function showFailure(root: HTMLElement, reason: NotPossible, actions: { retry?: () => void }): void {
  const doc = root.ownerDocument;
  const box = doc.createElement('div');
  box.className = 'failure';
  box.setAttribute('role', 'alert');

  const message = doc.createElement('p');
  message.textContent = reason.message;
  box.append(message);

  const buttons = doc.createElement('p');
  const back = doc.createElement('a');
  back.href = FRONT_URL;
  back.textContent = 'Back to search';
  buttons.append(back);
  if (reason.retry && actions.retry) {
    const again = doc.createElement('button');
    again.type = 'button';
    again.textContent = 'Try again';
    again.addEventListener('click', () => actions.retry!());
    buttons.append(again);
  }
  box.append(buttons);

  root.replaceChildren(box);
}
