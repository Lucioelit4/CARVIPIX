"use client";

import BackToDashboard from "../components/BackToDashboard";
import { useState, useEffect, useRef } from "react";

const initialMessages = [
  { id: 1, user: "Admin", text: "Bienvenid@ a la comunidad CARVIPIX — ambiente moderado." },
  { id: 2, user: "Trader1", text: "Buen día! Alguna idea para EURUSD?" },
  { id: 3, user: "Trader2", text: "Veo posible ruptura en 1.0800" },
];

export default function ComunidadPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [warning, setWarning] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    // Simulate anti-offense filter
    if (/spam|ofensa|insulto/i.test(input)) {
      setWarning("Tu mensaje debe cumplir las reglas de convivencia");
      return;
    }
    setWarning("");
    setMessages((m) => [...m, { id: Date.now(), user: "Tú", text: input }]);
    setInput("");
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comunidad</h1>
          <p className="text-sm text-zinc-400">Chat moderado — Vista demo</p>
        </div>
        <div className="text-sm text-zinc-400">Comunidad moderada</div>
      </div>

      <div className="flex h-[60vh] flex-col gap-3">
        <div className="flex-1 overflow-auto rounded-xl bg-[#0B1220] p-4">
          {messages.map((m) => (
            <div key={m.id} className="mb-3">
              <div className="text-sm text-zinc-400">{m.user}</div>
              <div className="mt-1 rounded-md bg-white/3 p-3 text-sm text-white">{m.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="mt-2">
          {warning && <div className="mb-2 text-sm text-rose-400">{warning}</div>}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 rounded-xl bg-[#10141D] p-3 text-sm text-white outline-none"
            />
            <button onClick={send} className="rounded-xl bg-[#D4AF37] px-4 py-2 font-bold text-black">
              Enviar
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-zinc-400">Aviso: esta comunidad es una demo y está moderada. Usa lenguaje respetuoso.</div>
    </div>
  );
}