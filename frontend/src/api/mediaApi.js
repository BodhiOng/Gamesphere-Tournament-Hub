const API_BASE = import.meta.env.VITE_API_BASE ?? '';

function buildUrl(path) {
  return `${API_BASE}${path}`;
}

export async function uploadImage(file, folder = '') {
  if (!(file instanceof File)) {
    throw new Error('Choose an image file first.');
  }

  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }

  const response = await fetch(buildUrl('/api/media/upload'), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new Error((await response.text()) || response.statusText);
  }

  return response.status === 204 ? null : response.json();
}
