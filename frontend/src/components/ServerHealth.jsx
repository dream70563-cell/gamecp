import { useEffect, useState } from "react";

export default function ServerHealth() {
  const [server, setServer] = useState(null);

  async function load() {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setServer(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    let isSubscribed = true;
    fetch("/api/status")
      .then(res => res.json())
      .then(data => {
        if (isSubscribed) setServer(data);
      })
      .catch(console.error);

    const timer = setInterval(load, 5000);

    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, []);

  if (!server) {
    return <div className="p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">
        🎮 Minecraft Server Monitor
      </h1>

      <div className="bg-gray-900 rounded-xl p-5 mb-5">
        <h2 className="text-2xl font-bold">
          {server.world}
        </h2>

        <div className="mt-3">
          Status:
          <span className="ml-2 text-green-400">
            🟢 {server.running ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card
          title="CPU"
          value={`${server.system?.cpu || 0}%`}
        />

        <Card
          title="Minecraft RAM"
          value={`${server.system?.ramMB || 0} MB`}
        />

        <Card
          title="Uptime"
          value={`${server.uptime || 0}s`}
        />

        <Card
          title="Players"
          value={`${server.players?.online || 0}/${server.players?.max || 10}`}
        />

        <Card
          title="Tunnel"
          value={server.tunnel?.running ? 'ACTIVE' : 'INACTIVE'}
        />
      </div>
    </div>
  );
}

function Card({title,value}) {
  return (
    <div className="bg-gray-900 rounded-xl p-5">
      <div className="text-gray-400">
        {title}
      </div>

      <div className="text-2xl font-bold mt-2">
        {value}
      </div>
    </div>
  );
}
