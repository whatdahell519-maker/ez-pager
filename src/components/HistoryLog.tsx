import React, { useState } from 'react';
import { PageMessage } from '../types';
import { Bell, Search, Trash2, Clock, ShieldAlert, Play, Filter } from 'lucide-react';
import { playPagerAlert } from '../utils/audioSynth';

interface HistoryLogProps {
  history: PageMessage[];
  onClearHistory: () => void;
  onSelectMessage: (msg: PageMessage) => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history, onClearHistory, onSelectMessage }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');

  const filteredHistory = history.filter((msg) => {
    const matchesSearch =
      msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgency = filterUrgency === 'all' || msg.urgency === filterUrgency;
    return matchesSearch && matchesUrgency;
  });

  const handleReplayTone = (e: React.MouseEvent, msg: PageMessage) => {
    e.stopPropagation();
    playPagerAlert(msg.tone, 0.8, 1);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            PAGE TRANSMISSION LOGS
          </h2>
          <span className="bg-slate-800 text-slate-300 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pages or sender..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-300 outline-none"
          >
            <option value="all">All Levels</option>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredHistory.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs space-y-1">
            <Bell className="w-8 h-8 text-slate-700 mx-auto mb-2 opacity-50" />
            <p className="font-semibold">No transmitted pages found</p>
            <p className="text-[11px] text-slate-600">Pages sent on this channel will appear here in real-time.</p>
          </div>
        ) : (
          filteredHistory.map((msg) => (
            <div
              key={msg.id}
              onClick={() => onSelectMessage(msg)}
              className="bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 p-3.5 rounded-2xl transition-all cursor-pointer group flex items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      msg.urgency === 'emergency'
                        ? 'bg-red-950 text-red-400 border border-red-800/60'
                        : msg.urgency === 'urgent'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                        : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                    }`}
                  >
                    {msg.urgency}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    SNDR: <strong className="text-white">{msg.senderName}</strong>
                  </span>
                </div>

                <p className="text-sm font-mono font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors truncate">
                  {msg.message}
                </p>

                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Action Re-play Audio Button */}
              <button
                onClick={(e) => handleReplayTone(e, msg)}
                title="Re-play alert sound"
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-400 hover:text-white border border-slate-800 transition-all shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
