'use client';

import { useState, useEffect } from 'react';
import { getPodcasts, createPodcast, getAgents, assignAgentToPodcast } from '@/lib/api';

export default function Dashboard() {
  const [podcasts, setPodcasts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [title, setTitle] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedPodcast, setSelectedPodcast] = useState('');

  useEffect(() => {
    fetchPodcasts();
    fetchAgents();
  }, []);

  const fetchPodcasts = async () => {
    const data = await getPodcasts();
    setPodcasts(data);
  };

  const fetchAgents = async () => {
    const data = await getAgents();
    setAgents(data);
  };

  const handleCreatePodcast = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPodcast({ title, status: 'draft' });
    fetchPodcasts();
    setTitle('');
  };

  const handleAssignAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPodcast && selectedAgent) {
      await assignAgentToPodcast(Number(selectedPodcast), Number(selectedAgent));
      alert('Agent assigned to podcast!');
      fetchPodcasts();
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleCreatePodcast} className="mb-8 p-4 bg-gray-100 rounded">
            <h2 className="text-xl font-semibold mb-4 text-black">Create New Podcast</h2>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Podcast Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border p-2 rounded w-full text-black"
                required
              />
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Draft Podcast</button>
          </form>

          <form onSubmit={handleAssignAgent} className="p-4 bg-gray-100 rounded">
            <h2 className="text-xl font-semibold mb-4 text-black">Assign Agent to Podcast</h2>
            <div className="flex flex-col gap-4 mb-4">
              <select value={selectedPodcast} onChange={(e) => setSelectedPodcast(e.target.value)} className="border p-2 rounded text-black" required>
                <option value="">Select Podcast...</option>
                {podcasts.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} className="border p-2 rounded text-black" required>
                <option value="">Select Agent...</option>
                {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
              </select>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Assign Agent</button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Podcasts</h2>
          <ul>
            {podcasts.map((podcast: any) => (
              <li key={podcast.id} className="border-b py-4">
                <h3 className="font-bold">{podcast.title}</h3>
                <p className="text-sm text-gray-600">Status: {podcast.status}</p>
                <p className="text-sm text-gray-500">Agents assigned: {podcast.agents?.length || 0}</p>
                {podcast.agents?.map((a: any) => <span key={a.id} className="inline-block bg-gray-200 rounded px-2 py-1 text-xs text-black mr-2 mt-2">{a.name} ({a.role})</span>)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
