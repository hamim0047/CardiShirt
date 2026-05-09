import { Mic, Send } from "lucide-react";

export default function AIChatPanel({
  chatMessages = [],
  chatInput = "",
  setChatInput,
  sendChatMessage,
  chatLoading = false,
  quickQuestions = [],
  summaryText = "Viewing today's data, live ECG, current vitals",
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-white">CardiShirt AI</p>
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>

        <p className="mt-2 text-sm text-slate-500">
          Has access to your full cardiac history
        </p>

        <div className="mt-3 inline-block rounded-full bg-[#070b1d] px-3 py-2 text-xs text-slate-400">
          {summaryText}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-4">
          {chatMessages.map((item, index) => (
            <div
              key={`${item.time || "msg"}-${index}`}
              className={`rounded-3xl p-5 ${
                item.role === "user" ? "bg-[#22295a]" : "bg-[#1a204a]"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  item.role === "user" ? "text-cyan-300" : "text-amber-300"
                }`}
              >
                {item.title || (item.role === "user" ? "You" : "CardiShirt AI")}
              </p>

              <p className="mt-3 text-lg leading-8 text-white">{item.body}</p>

              {item.question ? (
                <p className="mt-3 text-sm text-rose-300">{item.question}</p>
              ) : null}

              {item.time ? (
                <p className="mt-3 text-sm text-slate-500">{item.time}</p>
              ) : null}
            </div>
          ))}

          {chatLoading ? (
            <div className="rounded-3xl bg-[#1a204a] p-5">
              <p className="text-sm font-medium text-amber-300">
                CardiShirt AI
              </p>
              <p className="mt-3 text-lg leading-8 text-white">Thinking...</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-800 p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => sendChatMessage(q)}
              className="rounded-full bg-[#070b1d] px-4 py-2 text-sm text-slate-300 transition hover:text-white"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-[#1a204a] p-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendChatMessage();
              }
            }}
            placeholder="Ask about your heart today..."
            className="flex-1 bg-transparent px-3 py-2 text-white outline-none placeholder:text-slate-500"
          />

          <button className="rounded-xl bg-[#12183a] px-4 py-3 text-slate-400">
            <Mic className="h-4 w-4" />
          </button>

          <button
            onClick={() => sendChatMessage()}
            className="rounded-2xl bg-rose-500 px-4 py-3 text-white"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          CardiShirt AI is a monitoring companion, not a doctor. Always consult
          your physician for medical decisions.
        </p>
      </div>
    </div>
  );
}
