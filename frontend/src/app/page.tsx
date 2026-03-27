import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <h1 className="text-5xl font-bold mb-8">Podcast AI Studio</h1>
      <div className="flex gap-4">
        <Link href="/dashboard" className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700">Dashboard</Link>
        <Link href="/studio" className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700">Live Studio</Link>
        <Link href="/agents" className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700">Manage Agents</Link>
      </div>
    </main>
  );
}
