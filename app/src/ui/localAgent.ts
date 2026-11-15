// Local stand-in agent disabled on main: `commands.ask` is wired to `app/src/jev/loop.ts` (`/api/jev`).
/*
import { interpret } from './assistant';
import { bandMean } from './compass';
import { heardDb, outdoorTrim } from './scenario';
import { commands, setOpeningOpen, ui, type AgentSession, type Opening } from './store';

function streetDb(openings: Opening[]): number | null {
  const outdoor = ui.sound.value?.sources.find(s => s.id === 'outdoor');
  if (!outdoor) return null;
  return Math.round(heardDb(bandMean(outdoor.direct), outdoorTrim(openings, ui.timeOfDay.value).db));
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function localAgent(text: string, session: AgentSession): Promise<void> {
  const read = session.step('Reading the scene');
  await wait(350);
  const openings = ui.openings.value;
  const intent = interpret(text, openings);
  read.done(`${openings.length} openings, ${ui.speakers.value.length} sources`);

  if (intent.kind === 'openings') {
    const targets = openings.filter(o => intent.ids.includes(o.id));
    const find = session.step(`Finding the ${intent.open ? 'closed' : 'open'} ones`);
    await wait(350);
    find.done(`${targets.length} match`);
    const est = session.step('Estimating street noise before and after');
    await wait(500);
    const ids = new Set(intent.ids);
    const before = streetDb(openings);
    const after = streetDb(openings.map(o => (ids.has(o.id) ? { ...o, open: intent.open } : o)));
    est.done(before !== null && after !== null ? `${before} → ${after} dB` : 'no trace yet');
    const verb = intent.open ? 'Open' : 'Close';
    const names = targets.map(o => o.label.toLowerCase());
    const delta = before !== null && after !== null ? after - before : null;
    session.say(
      delta === null
        ? `${verb} the ${names.join(' and ')}. Hold to hear it first.`
        : `${verb} the ${names.join(' and ')}: street noise goes from ${before} to ${after} dB here, ${delta < 0 ? 'mostly the treble' : 'mostly the treble coming back'}. Hold to hear it first.`,
    );
    session.propose({
      title: `${verb} ${targets.length > 1 ? `${targets.length} windows` : names[0]}`,
      detail: delta === null ? 'Estimate.' : `${delta > 0 ? '+' : ''}${delta} dB street noise at this spot (estimate).`,
      changes: targets.map(o => o.label),
      previewIds: targets.map(o => o.id),
      previewOpen: intent.open,
      apply: () => setOpeningOpen(intent.ids, intent.open),
    });
    return;
  }
  if (intent.kind === 'place') {
    ui.placing.value = true;
    session.say(intent.reply);
  } else if (intent.kind === 'blueprint') {
    commands.toggleBlueprint();
    session.say(intent.reply);
  } else if (intent.kind === 'audio') {
    commands.toggleAudio();
    session.say(intent.reply);
  } else session.say(intent.reply);
}
*/
