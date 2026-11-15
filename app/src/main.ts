import { startFrontDoor } from './front';
import { readRoute } from './route';
import { startTour } from './tour/start';

// One page, two states: '?m=<id>' opens that property's tour, anything else shows the front door.
const route = readRoute(location.search);
if (route.state === 'tour') {
  document.getElementById('tour')!.hidden = false;
  startTour(route.modelId);
} else {
  const front = document.getElementById('front')!;
  front.hidden = false;
  startFrontDoor(front);
}
