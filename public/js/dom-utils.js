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

export function createKeyValuePair() {
  const pair = document.createElement('div');
  pair.className = 'pair form-row';
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
      <div class="validation-message"></div>
    </div>
  `;

  pair.querySelector('.delete-icon').addEventListener('click', function() {
    pair.remove();
    updateDeleteButtonsVisibility();
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
  if (messageElement) {
    if (typeof innerContent === 'string') {
      messageElement.innerHTML = innerContent;
    } else {
      messageElement.innerHTML = '';
      messageElement.appendChild(innerContent);
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
