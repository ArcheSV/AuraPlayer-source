import React from 'react';
import { Login } from '../components/Login';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white">AuraPlayer</h1>
        <p className="text-zinc-400 mt-2">Tu música, a tu manera.</p>
      </div>
      <Login />
    </div>
  );
}