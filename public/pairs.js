import * as Api from './api.js';

export function addKeyValuePair() {
  const keyValuePairs = document.getElementById('keyValuePairs');
  keyValuePairs.appendChild(createKeyValuePair());
  updateDeleteButtonsVisibility();
}

async function validateKey(inputElement) {
  const key = inputElement.value;
  
  const { isExisting, existingNode } = await Api.fetchValidateKey(key);

  const message = isExisting 
    ? createJsonViewer(existingNode)
    : 'This key will create a new object';
  setKeyValidationMessage(inputElement, message);
};

const debouncedValidateKey = _.debounce(validateKey, 100);
export { debouncedValidateKey };

function createJsonViewer(data) {
  const jsonViewer = document.createElement('json-viewer');
  jsonViewer.data = data;
  return jsonViewer;
};

function updateDeleteButtonsVisibility() {
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

function createKeyValuePair() {
  const pair = createBasePairElement();
  const uniqueId = generateUniqueId();

  populatePairElement(pair, uniqueId);
  addDeleteButtonListener(pair);
  addNodeLinkListener(pair);

  const keyInput = pair.querySelector('.key');
  const dropdown = pair.querySelector('.autocomplete-dropdown');
  setupDropdown(dropdown);
  setupKeyInputEventHandlers(keyInput, dropdown);

  return pair;
}

function createBasePairElement() {
  const pair = document.createElement('div');
  pair.className = 'pair form-row';
  return pair;
}

function generateUniqueId() {
  return `collapseJsonTreePreview_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function populatePairElement(pair, uniqueId) {
  pair.innerHTML = `
    <div class="col mb-2">
      <div class="input-group">
        <input type="text" class="key form-control" placeholder="Key">
        <div class="autocomplete-dropdown" style="position: absolute; z-index: 1;"></div>
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
  // Replace uniqueId placeholders with the actual uniqueId
  const nodeLink = pair.querySelector('.node-link');
  nodeLink.href = `#${uniqueId}`;
  nodeLink.setAttribute('aria-controls', uniqueId);
}

function addDeleteButtonListener(pair) {
  pair.querySelector('.delete-icon').addEventListener('click', function() {
    pair.remove();
    updateDeleteButtonsVisibility();
  });
}

function addNodeLinkListener(pair) {
  const nodeLink = pair.querySelector('.node-link');
  nodeLink.addEventListener('click', function() {
    toggleNodeLink(this);
  });
}

function toggleNodeLink(element) {
  const isExpanded = element.getAttribute('aria-expanded') === 'true';
  element.setAttribute('aria-expanded', !isExpanded);
  element.textContent = (isExpanded ? "▲ " : "▼ ") + element.textContent.split(' ').slice(1).join(' ');
}

function setupDropdown(dropdown) {
  dropdown.style.display = 'none';  
  dropdown.style.border = '1px solid #ccc';
  dropdown.style.backgroundColor = '#fff';
  dropdown.style.padding = '10px';
  dropdown.style.borderRadius = '4px';
  dropdown.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
  dropdown.style.maxHeight = '200px';
  dropdown.style.overflowY = 'auto';
  dropdown.style.width = '100%';
}

function setupKeyInputEventHandlers(keyInput, dropdown) {
  let isDropdownClicked = false;
  
  keyInput.addEventListener('input', async function() {
    await handleKeyInput(this, dropdown);
  });

  dropdown.addEventListener('mousedown', function() {
    isDropdownClicked = true;
  });

  dropdown.addEventListener('click', function(e) {
    handleDropdownClick(e, keyInput, dropdown);
    isDropdownClicked = false;
  });

  keyInput.addEventListener('focusout', function() {
    handleFocusOut(dropdown, isDropdownClicked);
    isDropdownClicked = false;
  });

  keyInput.addEventListener('keydown', function(e) {
    handleEscapePress(e, dropdown);
  });
}

async function handleKeyInput(element, dropdown) {
  const mostLikelyTargets = await Api.fetchMostLikelyTargets(element.value);
  updateDropdown(mostLikelyTargets, dropdown);
}

function handleDropdownClick(event, keyInput, dropdown) {
  if (event.target.tagName === 'DIV') {
    keyInput.value = event.target.textContent;
    clearDropdown(dropdown);
    validateKey(keyInput);
  }
}

function handleFocusOut(dropdown, isDropdownClicked) {
  if (!isDropdownClicked) {
    clearDropdown(dropdown);
  }
}

function handleEscapePress(event, dropdown) {
  if (event.key === 'Escape') {
    clearDropdown(dropdown);
  }
}

function updateDropdown(targets, dropdown) {
  if (targets.length > 0) {
    dropdown.style.display = 'block';
    dropdown.innerHTML = targets.map(target => `<div>${target}</div>`).join('');
  } else {
    clearDropdown(dropdown);
  }
}

function clearDropdown(dropdown) {
  dropdown.innerHTML = '';
  dropdown.style.display = 'none';
}

function setKeyValidationMessage(inputElement, innerContent) {
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