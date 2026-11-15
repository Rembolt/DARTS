import { useEffect } from 'preact/hooks';
import { Chat } from './Chat';
import { Dock } from './Dock';
import { Hotspots } from './Hotspots';
import { Inspector } from './Inspector';
import { ui } from './store';

export function App() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (ui.placing.value) ui.placing.value = false;
        else ui.selection.value = null;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Hotspots />
      <Inspector />
      <Dock />
      <Chat />
    </>
  );
}
