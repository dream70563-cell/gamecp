import { useState } from 'react';
import { Lock, User, LogIn } from 'lucide-react';

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [captchaA] = useState(() => Math.floor(Math.random() * 9) + 1);
  const [captchaB] = useState(() => Math.floor(Math.random() * 9) + 1);
  const [captchaInput, setCaptchaInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username || !password) return;

    if (Number(captchaInput) !== captchaA + captchaB) {
      alert('Captcha salah');
      return;
    }

    onLogin({
      username
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">

        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center">
            <Lock className="text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white mt-4">
            GameCP Login
          </h1>

          <p className="text-sm text-slate-400 mt-2">
            Minecraft Bedrock Control Panel
          </p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="text-xs text-slate-400">
              Username
            </label>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3">
              <User className="w-4 h-4 text-slate-500" />

              <input
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                value={username}
                onChange={(e)=>setUsername(e.target.value)}
              />
            </div>
          </div>


          <div>
            <label className="text-xs text-slate-400">
              Password
            </label>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3">
              <Lock className="w-4 h-4 text-slate-500" />

              <input
                type="password"
                className="w-full bg-transparent px-3 py-3 text-white outline-none"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
              />
            </div>
          </div>


                      <div>
              <label className="text-xs text-slate-400">
                Security Check: {captchaA} + {captchaB} =
              </label>

              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-3 text-white outline-none"
                value={captchaInput}
                onChange={(e)=>setCaptchaInput(e.target.value)}
                placeholder="Enter captcha"
              />
            </div>

<button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4"/>
            Login
          </button>

        </form>

      </div>
    </div>
  );
}
