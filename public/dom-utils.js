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

export async function loadBase() {
  const queryParams = new URLSearchParams();
  document.querySelectorAll('.form-select').forEach(selectElement => {
    queryParams.append(selectElement.id, selectElement.value);
  });

  const loadResponse = await fetch(`/loadConfigFile?${queryParams.toString()}`);
  const data = await loadResponse.json();
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
export { debouncedValidateKey };

export async function populateDropdowns() {
  const response = await fetch('/fileParameters');
  const data = await response.json();
  const dropdownContainer = document.querySelector('.row.g-3');

  dropdownContainer.innerHTML = '';

  Object.keys(data).forEach(key => {
    createDropdown(key, data[key], dropdownContainer);
  });
}

export function addKeyValuePair() {
  const keyValuePairs = document.getElementById('keyValuePairs');
  keyValuePairs.appendChild(createKeyValuePair());
  updateDeleteButtonsVisibility();
}

export function createKeyValuePair() {
  const pair = document.createElement('div');
  pair.className = 'pair form-row';
  const uniqueId = `collapseJsonTreePreview_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  pair.innerHTML = `
    <div class="col mb-2">
      <div class="input-group">
        <input type="text" class="key form-control" placeholder="Key">
        <span class="input-group-text validation-icon">
          <i class="fa-solid fa-ellipsis"></i>
        </span>
      </div>
      <div class="input-group">
        <input type="text" class="value form-control" placeholder="Value">
        <span class="input-group-text bg-danger text-light delete-icon" style="cursor: pointer;">
          <i class="fa-solid fa-trash"></i>
        </span>
      </div>
      
      <p>
        <a class="node-link expandable" data-bs-toggle="collapse" href="#${uniqueId}" role="button" aria-expanded="false" aria-controls="${uniqueId}">
          
        </a>
      </p>
      <div class="collapse collapseJsonTreePreview" id="${uniqueId}">
        <div class="validation-message"></div>
      </div>
    </div>
  `;

  pair.querySelector('.delete-icon').addEventListener('click', function() {
    pair.remove();
    updateDeleteButtonsVisibility();
  });

  const nodeLinkElement = pair.querySelector('.node-link');
  nodeLinkElement.addEventListener('click', function() {
    const isExpanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', !isExpanded);
    this.textContent = (isExpanded ? "▲ " : "▼ ") + this.textContent.split(' ').slice(1).join(' ');
  });

  return pair;
}

export function updateDeleteButtonsVisibility() {
  const keyValuePairs = document.getElementById('keyValuePairs');
  const pairs = keyValuePairs.querySelectorAll('.pair');
  if (pairs.length <= 1) {
    pairs.forEach(pair => {
      pair.querySelector('.delete-icon').style.display = 'none';
    });
  } else {
    pairs.forEach(pair => {
      pair.querySelector('.delete-icon').style.display = 'inline';
    });
  }
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

export function setKeyValidationMessage(inputElement, innerContent) {
  const messageElement = inputElement.closest('.col').querySelector('.validation-message');
  const nodeLinkElement = inputElement.closest('.col').querySelector('.node-link');
  
  if (messageElement) {
    if (typeof innerContent === 'string') {
      messageElement.innerHTML = innerContent;
    } else {
      messageElement.innerHTML = '';
      messageElement.appendChild(innerContent);
    }

    if (nodeLinkElement) {
      const isExpanded = nodeLinkElement.getAttribute('aria-expanded') === 'true';
      const arrow = isExpanded ? "▲ " : "▼ ";
      nodeLinkElement.textContent = arrow + (innerContent === "This key will create a new object" ? "This will create a new node" : "This will modify an existing node");
    }
  } else {
    const newMessageElement = document.createElement('div');
    newMessageElement.className = 'validation-message';
    if (typeof innerContent === 'string') {
      newMessageElement.innerHTML = innerContent;
    } else {
      newMessageElement.appendChild(innerContent);
    }
    inputElement.closest('.col').appendChild(newMessageElement);
  }
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
