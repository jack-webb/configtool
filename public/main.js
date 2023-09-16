import * as Pairs from './pairs.js';
import * as Dropdowns from './dropdowns.js';
import * as EventListeners from './event-listeners.js';

document.addEventListener('DOMContentLoaded', () => {
  Pairs.addKeyValuePair();
  Dropdowns.populateDropdowns();

  EventListeners.initialize();
});