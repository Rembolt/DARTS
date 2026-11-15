import { useEffect } from 'preact/hooks';
import { onKeyDown } from './keys';
import { Toaster } from 'sonner';
import { Chat } from './Chat';
import { Dock } from './Dock';
import { Hotspots } from './Hotspots';
import { Minimap } from './Minimap';
import { RoomCard } from './RoomCard';
import { Settings } from './Settings';
import { WallBadges } from './WallBadges';
import { SoundCompass } from './SoundCompass';
import { SurfaceStrip } from './SurfaceStrip';
import { StartScreen, startedBefore } from './StartScreen';
import { Tutorial } from './Tutorial';
import { commands, ui } from './store';

ui.started.value = startedBefore();

export function App() {
  useEffect(
    () =>
      onKeyDown(e => {
        if (e.key !== 'Escape' || ui.placing.value) return; // placement mode takes Esc first (main.ts)
        if (ui.thinking.value) commands.stop();
        else if (ui.selection.value) ui.selection.value = null;
        else if (ui.settingsOpen.value) ui.settingsOpen.value = false;
        else return;
        return true;
      }),
    [],
  );

  return (
    <>
      <WallBadges />
      <Hotspots />
      <Minimap />
      <RoomCard />
      <SoundCompass />
      <Dock />
      <SurfaceStrip />
      <Settings />
      <Chat />
      <StartScreen />
      <Tutorial />
      <Toaster
        position="top-center"
        offset={96}
        mobileOffset={{ top: 64 }}
        toastOptions={{ unstyled: true, classNames: { toast: 'toast card', title: 'toast-title', description: 'toast-desc' } }}
      />
    </>
  );
}
