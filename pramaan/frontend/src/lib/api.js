import axios from 'axios';

const api = axios.create({
  baseURL: '',
  timeout: 30000,
});

export async function uploadMedia(file, onProgress) {
  const formData = new FormData();
  formData.append('media', file);

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });

  return response.data;
}

export async function fetchReport(reportId) {
  const response = await api.get(`/report/${reportId}`);
  return response.data;
}

export async function approveReport(reportId) {
  const response = await api.post(`/report/${reportId}/approve`);
  return response.data;
}

export function createAnalysisStream(jobId) {
  return new EventSource(`/analyze/${jobId}`);
}
