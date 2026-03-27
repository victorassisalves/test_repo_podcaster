import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export const getAgents = async () => {
  const response = await api.get('/agents/');
  return response.data;
};

export const createAgent = async (agent: { name: string, role: string, voice_provider: string, voice_id?: string, system_prompt?: string }) => {
  const response = await api.post('/agents/', agent);
  return response.data;
};

export const getPodcasts = async () => {
  const response = await api.get('/podcasts/');
  return response.data;
};

export const createPodcast = async (podcast: { title: string, status?: string }) => {
  const response = await api.post('/podcasts/', podcast);
  return response.data;
};

export const assignAgentToPodcast = async (podcastId: number, agentId: number) => {
  const response = await api.post(`/podcasts/${podcastId}/agents/${agentId}`);
  return response.data;
};

export const chatWithAI = async (messages: { role: string, content: string }[], voiceId: string = "EXAVITQu4vr4xnSDxMaL") => {
  const response = await api.post('/api/chat', { messages, voice_id: voiceId });
  return response.data;
};
