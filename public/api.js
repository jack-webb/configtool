export async function fetchFileParameters() {
  const response = await fetch('/fileParameters');
  const data = await response.json();
  return data;
}

export async function fetchLoadBase(queryParams) {
  const loadResponse = await fetch(`/loadConfigFile?${queryParams.toString()}`);
  const data = await loadResponse.json();
  const status = loadResponse.status;
  return { data, status };
}

export async function fetchValidateKey(key) {
  const response = await fetch('/validateKey', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key })
  });

  const data = await response.json();
  return { isExisting: data.isExisting, existingNode: data.existingNode };
}

export async function fetchMostLikelyTargets(key) {
  const response = await fetch('/mostLikelyTargets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key })
  });

  const data = await response.json();
  return data.mostLikelyTargets;
}

export async function updateJson(keyValuePairs) {
  const response = await fetch('/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ keyValuePairs })
  });
  return response.status;
}