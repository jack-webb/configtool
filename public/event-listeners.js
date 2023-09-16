import * as DomUtils from './dom-utils.js';
import * as Api from './api.js';

export function initialize() {
  // Initialize key-value pairs and populate dropdowns
  DomUtils.addKeyValuePair();
  DomUtils.populateDropdowns();
  
  // Event listeners for buttons
  document.getElementById("loadBaseBtn").addEventListener("click", DomUtils.loadBase);
  document.getElementById("addKeyValuePairBtn").addEventListener("click", DomUtils.addKeyValuePair);
  document.getElementById("updateJsonBtn").addEventListener("click", DomUtils.updateJson);
  document.getElementById("copyModifiedJsonUrlBtn").addEventListener("click", DomUtils.copyModifiedJsonUrl);
  document.getElementById("exportModifiedJsonBtn").addEventListener("click", DomUtils.exportModifiedJson);
  document.getElementById("openModifiedJsonBtn").addEventListener("click", DomUtils.openModifiedJson);

  // Event listener for key-value pair input changes
  document.getElementById('keyValuePairs').addEventListener('input', function(event) {
    if (event.target.classList.contains('key')) {
      DomUtils.debouncedValidateKey(event.target);
    }
  });
}
