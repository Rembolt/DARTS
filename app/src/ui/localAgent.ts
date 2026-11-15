// A local stand-in for Jev that shows the whole flow the real agent will use: visible steps, then a suggestion the
// user applies or dismisses. Replace by pointing `commands.ask` at the relay (v2-design.md 6); the UI does not change.
import { interpret } from './assistant';
import { commands, setOpeningOpen, ui, type AgentSession } from './store';

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
    const est = session.step('Estimating the effect on sound');
    await wait(600);
    est.done('estimate, not measured');
    const verb = intent.open ? 'Open' : 'Close';
    session.say(`${intent.reply} Check the highlighted spots, then apply or dismiss.`);
    session.propose({
      title: `${verb} ${targets.length} ${targets.length > 1 ? 'openings' : 'opening'}`,
      detail: intent.open ? 'More of the outside should come in.' : 'The outside should drop away indoors.',
      changes: targets.map(o => o.label),
      previewIds: targets.map(o => o.id),
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
