'use client';

import { useState, useEffect } from 'react';
import { getAgents, createAgent } from '@/lib/api';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Host');
  const [voiceProvider, setVoiceProvider] = useState('google');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    const data = await getAgents();
    setAgents(data);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAgent({ name, role, voice_provider: voiceProvider });
    fetchAgents();
    setName('');
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Manage Agents</h1>

      <form onSubmit={handleCreateAgent} className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-4 text-black">Create New Agent</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Agent Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded text-black"
            required
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="border p-2 rounded text-black">
            <option value="Host">Host</option>
            <option value="Co-host">Co-host</option>
            <option value="Moderator">Moderator</option>
            <option value="Fact-checker">Fact-checker</option>
            <option value="Dummy">Dummy</option>
          </select>
          <select value={voiceProvider} onChange={(e) => setVoiceProvider(e.target.value)} className="border p-2 rounded text-black">
            <option value="google">Google Live</option>
            <option value="elevenlabs">ElevenLabs</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Agent</button>
      </form>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Existing Agents</h2>
        <ul>
          {agents.map((agent: any) => (
            <li key={agent.id} className="border-b py-2">
              <strong>{agent.name}</strong> - {agent.role} ({agent.voice_provider})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
