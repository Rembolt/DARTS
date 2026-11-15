import { useEffect } from 'preact/hooks';
import { Toaster } from 'sonner';
import { Chat } from './Chat';
import { Dock } from './Dock';
import { Hotspots } from './Hotspots';
import { SoundCompass } from './SoundCompass';
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
      <SoundCompass />
      <Dock />
      <Chat />
      <Toaster
        position="top-center"
        offset={96}
        mobileOffset={{ top: 64 }}
        toastOptions={{ unstyled: true, classNames: { toast: 'toast card', title: 'toast-title', description: 'toast-desc' } }}
      />
    </>
  );
}
