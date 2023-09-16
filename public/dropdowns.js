import * as Api from './api.js';

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
