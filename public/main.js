import { 
  createDropdown, 
  createKeyValuePair, 
  showToast, 
  updateJsonTree, 
  updateMakeChanges, 
  updateDiff, 
  updateDeleteButtonsVisibility, 
  setKeyValidationMessage 
} from './js/dom-utils.js';

// todo
// - reduce exported functions
// - 

export async function loadBase() {
  const queryParams = new URLSearchParams();
  document.querySelectorAll('.form-select').forEach(selectElement => {
    queryParams.append(selectElement.id, selectElement.value);
  });

  const loadResponse = await fetch(`/loadConfigFile?${queryParams.toString()}`);
  const data = await loadResponse.json();
  if (loadResponse.status === 400) {
    showToast(
      'Failed to Load JSON',
      `Error: ${data.message}`,
      'danger'
    )
  } else {
    showToast(
      'Loaded JSON succesfully',
      `JSON Loaded from <a href="${data.url}">${data.url}</a>`,
      'success'
    )
  }

  document.getElementById('status').innerHTML = `You are modifying <a href="${data.url}">${data.url}</a>`;
  
  updateTabs();
}

export function openModifiedJson() {
  window.open('/modified.json', '_blank');
}

export async function copyModifiedJsonUrl() {
  const url = window.location.origin + '/modified.json';
  await navigator.clipboard.writeText(url);
}

export async function updateJson() {
  const keyValuePairs = Array.from(document.querySelectorAll('.pair')).map(pair => {
    const key = pair.querySelector('.key').value;
    let value = pair.querySelector('.value').value;

    try {
      value = JSON.parse(value);
    } catch (e) {
      // Keep as string if JSON.parse fails
    }

    return { key, value };
  });

  await fetch('/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ keyValuePairs })
  });

  updateTabs();
}

async function updateTabs() {
  const modifiedResponse = await fetch('/modified.json');
  const modifiedJson = await modifiedResponse.json();
  updateJsonTree(modifiedJson)

  const changesResponse = await fetch('/makeChanges');
  const changesJson = await changesResponse.json();
  updateMakeChanges(changesJson.makeChanges)

  const diffResponse = await fetch('/diff');
  const diffJson = await diffResponse.json();
  updateDiff(diffJson);
}

export async function exportModifiedJson() {
  const response = await fetch('/modified.json');
  const data = await response.json();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modified.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function addKeyValuePair() {
  const keyValuePairs = document.getElementById('keyValuePairs');
  keyValuePairs.appendChild(createKeyValuePair());
  updateDeleteButtonsVisibility();
}

export async function validateKey(inputElement) {
  const key = inputElement.value;
  const response = await fetch('/validateKey', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key })
  });

  const data = await response.json();

  if (data.isExisting) {
    const jsonViewer = document.createElement('json-viewer');
    jsonViewer.data = data.existingNode;
    setKeyValidationMessage(inputElement, jsonViewer)
  } else {
    setKeyValidationMessage(inputElement, "This key will create a new object")
  }
}

const debouncedValidateKey = _.debounce(validateKey, 100);

document.getElementById('keyValuePairs').addEventListener('input', function(event) {
  if (event.target.classList.contains('key')) {
    debouncedValidateKey(event.target);
  }
});

export async function populateDropdowns() {
  const response = await fetch('/fileParameters');
  const data = await response.json();
  const dropdownContainer = document.querySelector('.row.g-3');

  dropdownContainer.innerHTML = '';

  Object.keys(data).forEach(key => {
    createDropdown(key, data[key], dropdownContainer);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  addKeyValuePair();
  populateDropdowns();

  document.getElementById("loadBaseBtn").addEventListener("click", loadBase);
  document.getElementById("addKeyValuePairBtn").addEventListener("click", addKeyValuePair);
  document.getElementById("updateJsonBtn").addEventListener("click", updateJson);
  document.getElementById("copyModifiedJsonUrlBtn").addEventListener("click", copyModifiedJsonUrl);
  document.getElementById("exportModifiedJsonBtn").addEventListener("click", exportModifiedJson);
  document.getElementById("openModifiedJsonBtn").addEventListener("click", openModifiedJson);
});
