import * as Pairs from './pairs.js';
import * as Api from './api.js';
import * as Dropdowns from './dropdowns.js';

export async function loadBase() {
  const queryParams = new URLSearchParams();
  document.querySelectorAll('.form-select').forEach(selectElement => {
    queryParams.append(selectElement.id, selectElement.value);
  });

  const { data, status } = await Api.fetchLoadBase(queryParams);

  showToast(
    status === 400 ? 'Failed to Load JSON' : 'Loaded JSON successfully',
    status === 400 ? `Error: ${data.message}` : `JSON Loaded from <a href="${data.url}">${data.url}</a>`,
    status === 400 ? 'danger' : 'success'
  );

  document.getElementById('status').innerHTML = `You are modifying <a href="${data.url}">${data.url}</a>`;
  
  updateJson();
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

  const status = await Api.updateJson(keyValuePairs);

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


// todo import Bs5Utils here instead of index.html
export function showToast(title, content, type) {
  const bs5Utils = new Bs5Utils();
  const icon = type == "success" ? "fa-check-circle" : "fa-times-circle"
  bs5Utils.Toast.show({
    type: type,
    icon: `<i class="far ${icon} fa-lg me-2"></i>`,
    title: title,
    subtitle: '',
    content: content,
    buttons: [],
    delay: 3000,
    dismissible: true,
  });
}

export async function populateDropdowns() {
  const data = await Api.fetchFileParameters();
  const dropdownContainer = document.querySelector('.row.g-3');

  dropdownContainer.innerHTML = '';

  Object.keys(data).forEach(key => {
    createDropdown(key, data[key], dropdownContainer);
  });
}

export function createDropdown(key, values, container) {
  const colDiv = document.createElement('div');
  colDiv.className = 'col';

  const selectElement = document.createElement('select');
  selectElement.id = key;
  selectElement.className = 'form-select';

  values.forEach(v => {
    const optionElement = document.createElement('option');
    optionElement.value = v;
    optionElement.textContent = v;
    selectElement.appendChild(optionElement);
  });

  colDiv.appendChild(selectElement);
  container.appendChild(colDiv);
}

export function updateJsonTree(json) {
  const jsonViewer = document.createElement('json-viewer');
  jsonViewer.data = json;
  document.getElementById('modifiedContent').innerHTML = '';
  document.getElementById('modifiedContent').appendChild(jsonViewer);
}

export function updateMakeChanges(changes) {
  if (changes && Array.isArray(changes)) {
    document.getElementById('makeChangesContent').textContent = changes.join('\n');
  } else {
    document.getElementById('makeChangesContent').textContent = '';
  }
}

export function updateDiff(json) {
  if (json && Array.isArray(json.diff)) {
    const diffContent = json.diff.map(diff => 
      `<tr>
        <td>${diff.path}</td>
        <td>${JSON.stringify(diff.lhs)}</td>
        <td>${JSON.stringify(diff.rhs)}</td>
      </tr>`
    ).join('\n');
    document.getElementById('diffContent').innerHTML = diffContent;
  } else {
    document.getElementById('diffContent').innerHTML = '';
  }
}
