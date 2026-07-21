import React, { useState } from 'react';
import { Send, Radio, AlertTriangle, Zap, Volume2, ShieldAlert, Sparkles, Hash, Layers, Heart, PhoneCall, Bell, Coffee, DoorClosed, Pill, Home, HelpCircle, Settings, CheckCircle2 } from 'lucide-react';
import { PagerTone, PagerUrgency } from '../types';

interface SenderKeypadProps {
  channel: string;
  onSendPage: (params: {
    message: string;
    urgency: PagerUrgency;
    tone: PagerTone;
    senderName: string;
    repeatCount: number;
  }) => Promise<boolean>;
}

export const SenderKeypad: React.FC<SenderKeypadProps> = ({ channel, onSendPage }) => {
  const [mode, setMode] = useState<'grandma' | 'advanced'>('grandma');
  const [senderName, setSenderName] = useState<string>('Grandma');
  const [customSender, setCustomSender] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('🚨 HELP NEEDED NOW!');
  const [urgency, setUrgency] = useState<PagerUrgency>('emergency');
  const [tone, setTone] = useState<PagerTone>('siren');
  const [repeatCount, setRepeatCount] = useState<number>(3);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [lastSentMessage, setLastSentMessage] = useState<string>('');

  const defaultSenders = ['Grandma', 'Mom', 'Dad', 'Caregiver', 'Home'];

  const grandmaPresets = [
    {
      id: 'help',
      icon: <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />,
      title: 'NEED HELP NOW!',
      subtitle: 'Triggers loud emergency siren on pager',
      msg: '🚨 NEED HELP NOW! Please check on me!',
      urgency: 'emergency' as PagerUrgency,
      tone: 'siren' as PagerTone,
      repeatCount: 5,
      bg: 'bg-red-950/80 hover:bg-red-900/90 border-red-600/80 text-red-100 shadow-red-950/50',
      activeBg: 'ring-4 ring-red-500 bg-red-900 border-red-400',
    },
    {
      id: 'call',
      icon: <PhoneCall className="w-8 h-8 text-cyan-400 shrink-0" />,
      title: 'PLEASE CALL ME',
      subtitle: 'Urgent callback request with alert tone',
      msg: '📞 Please call me as soon as possible!',
      urgency: 'urgent' as PagerUrgency,
      tone: 'two-tone' as PagerTone,
      repeatCount: 3,
      bg: 'bg-cyan-950/80 hover:bg-cyan-900/90 border-cyan-600/80 text-cyan-100 shadow-cyan-950/50',
      activeBg: 'ring-4 ring-cyan-500 bg-cyan-900 border-cyan-400',
    },
    {
      id: 'dinner',
      icon: <Bell className="w-8 h-8 text-emerald-400 shrink-0" />,
      title: 'DINNER IS READY',
      subtitle: 'Gentle notification tone',
      msg: '🍽️ Meal is ready! Come eat!',
      urgency: 'normal' as PagerUrgency,
      tone: 'classic' as PagerTone,
      repeatCount: 1,
      bg: 'bg-emerald-950/80 hover:bg-emerald-900/90 border-emerald-600/80 text-emerald-100 shadow-emerald-950/50',
      activeBg: 'ring-4 ring-emerald-500 bg-emerald-900 border-emerald-400',
    },
    {
      id: 'tea',
      icon: <Coffee className="w-8 h-8 text-amber-400 shrink-0" />,
      title: 'TEA / COFFEE TIME',
      subtitle: 'Friendly invite for drink break',
      msg: '☕ Tea / Coffee is ready!',
      urgency: 'normal' as PagerUrgency,
      tone: 'burst' as PagerTone,
      repeatCount: 1,
      bg: 'bg-amber-950/80 hover:bg-amber-900/90 border-amber-600/80 text-amber-100 shadow-amber-950/50',
      activeBg: 'ring-4 ring-amber-500 bg-amber-900 border-amber-400',
    },
    {
      id: 'meds',
      icon: <Pill className="w-8 h-8 text-purple-400 shrink-0" />,
      title: 'TAKE MEDICATION',
      subtitle: 'Reminder alert for daily pills',
      msg: '💊 Reminder: Time to take your medication!',
      urgency: 'urgent' as PagerUrgency,
      tone: 'high-frequency' as PagerTone,
      repeatCount: 2,
      bg: 'bg-purple-950/80 hover:bg-purple-900/90 border-purple-600/80 text-purple-100 shadow-purple-950/50',
      activeBg: 'ring-4 ring-purple-500 bg-purple-900 border-purple-400',
    },
    {
      id: 'door',
      icon: <DoorClosed className="w-8 h-8 text-sky-400 shrink-0" />,
      title: 'AT THE FRONT DOOR',
      subtitle: 'Visitor or delivery at entry',
      msg: '🚪 Someone is at the front door!',
      urgency: 'normal' as PagerUrgency,
      tone: 'classic' as PagerTone,
      repeatCount: 1,
      bg: 'bg-sky-950/80 hover:bg-sky-900/90 border-sky-600/80 text-sky-100 shadow-sky-950/50',
      activeBg: 'ring-4 ring-sky-500 bg-sky-900 border-sky-400',
    },
    {
      id: 'safe',
      icon: <Home className="w-8 h-8 text-teal-400 shrink-0" />,
      title: "I'M HOME SAFE",
      subtitle: 'Reassuring status check update',
      msg: "👋 I've arrived home safe and sound!",
      urgency: 'normal' as PagerUrgency,
      tone: 'classic' as PagerTone,
      repeatCount: 1,
      bg: 'bg-teal-950/80 hover:bg-teal-900/90 border-teal-600/80 text-teal-100 shadow-teal-950/50',
      activeBg: 'ring-4 ring-teal-500 bg-teal-900 border-teal-400',
    },
    {
      id: 'where',
      icon: <HelpCircle className="w-8 h-8 text-yellow-400 shrink-0" />,
      title: 'WHERE ARE YOU?',
      subtitle: 'Quick location inquiry',
      msg: '❓ Where are you right now?',
      urgency: 'normal' as PagerUrgency,
      tone: 'burst' as PagerTone,
      repeatCount: 1,
      bg: 'bg-yellow-950/80 hover:bg-yellow-900/90 border-yellow-600/80 text-yellow-100 shadow-yellow-950/50',
      activeBg: 'ring-4 ring-yellow-500 bg-yellow-900 border-yellow-400',
    },
  ];

  const handleKeypadClick = (key: string) => {
    setMessageText((prev) => prev + key);
  };

  const executeSend = async (
    msgToDeliver: string,
    urgencyLevel: PagerUrgency,
    toneType: PagerTone,
    repeats: number
  ) => {
    if (!msgToDeliver.trim()) return;

    setIsSending(true);
    setSendSuccess(false);

    const activeSender = senderName === 'Custom' ? (customSender.trim() || 'Grandma') : senderName;

    const success = await onSendPage({
      message: msgToDeliver.trim(),
      urgency: urgencyLevel,
      tone: toneType,
      senderName: activeSender,
      repeatCount: repeats,
    });

    setIsSending(false);
    if (success) {
      setSendSuccess(true);
      setLastSentMessage(msgToDeliver.trim());
      setTimeout(() => setSendSuccess(false), 4000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSend(messageText, urgency, tone, repeatCount);
  };

  const handleGrandmaPresetClick = (preset: typeof grandmaPresets[0]) => {
    setMessageText(preset.msg);
    setUrgency(preset.urgency);
    setTone(preset.tone);
    setRepeatCount(preset.repeatCount);
    // Instant transmit on single tap for effortless Grandma usability
    executeSend(preset.msg, preset.urgency, preset.tone, preset.repeatCount);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl space-y-6">
      {/* Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
              <span>SENDER TRANSMITTER</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {mode === 'grandma'
              ? '👵 Easy 1-Tap Grandma Mode (Giant Buttons)'
              : '⌨️ Tactical Numeric Keypad & Advanced Settings'}
          </p>
        </div>

        {/* Easy vs Advanced Mode Switch */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setMode('grandma')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              mode === 'grandma'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Easy Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('advanced')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              mode === 'advanced'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Keypad</span>
          </button>
        </div>
      </div>

      {/* Target Channel Badge */}
      <div className="flex items-center justify-between bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs">
        <span className="text-slate-400 font-bold uppercase tracking-wider">Active Channel:</span>
        <span className="font-mono font-black text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full text-xs">
          [{channel || 'DEFAULT'}]
        </span>
      </div>

      {/* SUCCESS CONFIRMATION BANNER */}
      {sendSuccess && (
        <div className="bg-emerald-500/20 border-2 border-emerald-500 text-emerald-300 p-4 rounded-2xl text-sm font-bold text-center animate-bounce flex items-center justify-center gap-3 shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <p className="text-base font-black text-white">PAGE ALERT SENT TO PAGER!</p>
            <p className="text-xs text-emerald-300 font-normal mt-0.5">"{lastSentMessage}"</p>
          </div>
        </div>
      )}

      {/* GRANDMA EASY MODE */}
      {mode === 'grandma' && (
        <div className="space-y-5">
          {/* Sender Identity Chips */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              Who is sending this page?
            </label>
            <div className="flex flex-wrap gap-2">
              {defaultSenders.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSenderName(name)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    senderName === name
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black scale-105'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSenderName('Custom')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  senderName === 'Custom'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black scale-105'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                ✏️ Custom
              </button>
            </div>
            {senderName === 'Custom' && (
              <input
                type="text"
                value={customSender}
                onChange={(e) => setCustomSender(e.target.value)}
                placeholder="Enter sender name..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-bold outline-none focus:border-cyan-500 mt-2"
              />
            )}
          </div>

          {/* Easy Big Buttons Grid */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider block flex items-center justify-between">
              <span>Tap Any Button To Alert Pager Immediately:</span>
              <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                1-TAP DIRECT TRANSMIT
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grandmaPresets.map((preset) => {
                const isSelected = messageText === preset.msg;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isSending}
                    onClick={() => handleGrandmaPresetClick(preset)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all shadow-lg flex items-center gap-3.5 active:scale-95 cursor-pointer ${
                      preset.bg
                    } ${isSelected ? preset.activeBg : ''}`}
                  >
                    {preset.icon}
                    <div className="overflow-hidden">
                      <div className="text-base font-black tracking-wide leading-tight text-white">
                        {preset.title}
                      </div>
                      <div className="text-[11px] opacity-80 font-medium truncate mt-0.5">
                        {preset.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Custom Text Input for Grandma */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              Or Type Custom Message Here:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type custom message..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-base font-bold text-cyan-400 focus:border-cyan-500 outline-none"
              />
              <button
                type="button"
                disabled={isSending || !messageText.trim()}
                onClick={() => executeSend(messageText, urgency, tone, repeatCount)}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black px-5 rounded-xl text-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>SEND</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADVANCED TACTILE KEYPAD MODE */}
      {mode === 'advanced' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sender Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Sender Name / Callsign
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Dispatch, Medic 1, HQ"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Main Alert Message Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Message / Numeric Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="e.g. 911, Call me ASAP, Code Red"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-base text-cyan-400 font-mono font-bold focus:border-cyan-500 outline-none transition-colors"
              />
              {messageText && (
                <button
                  type="button"
                  onClick={() => setMessageText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-300 bg-slate-800 px-2 py-1 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Tactical Numeric Keypad */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center justify-between">
              <span>Tactile Numeric Keypad</span>
              <span className="text-[10px] text-slate-500 font-mono">RETRO CODES</span>
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadClick(k)}
                  className="bg-slate-900 hover:bg-slate-800 active:bg-blue-600 active:text-white text-slate-200 border border-slate-800 font-mono text-lg font-bold py-2.5 rounded-xl transition-all shadow-sm active:scale-90"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Options Row: Urgency, Tone, Repeats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Urgency */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as PagerUrgency)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent ⚡</option>
                <option value="emergency">Emergency 🚨</option>
              </select>
            </div>

            {/* Alarm Tone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Alarm Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as PagerTone)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
              >
                <option value="classic">Classic Beeper</option>
                <option value="two-tone">EMS Two-Tone</option>
                <option value="siren">Siren Sweep</option>
                <option value="high-frequency">High Pitch Pulse</option>
                <option value="burst">Quad Burst</option>
              </select>
            </div>

            {/* Repeat cycles */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Repeat Cycles
              </label>
              <select
                value={repeatCount}
                onChange={(e) => setRepeatCount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500"
              >
                <option value={1}>1 Repeat Cycle</option>
                <option value={2}>2 Repeat Cycles</option>
                <option value={3}>3 Repeat Cycles</option>
                <option value={5}>5 Repeat Cycles (Urgent)</option>
              </select>
            </div>
          </div>

          {/* Big Transmit Button */}
          <button
            type="submit"
            disabled={isSending || !messageText.trim()}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 ${
              isSending
                ? 'bg-blue-800 text-blue-200 cursor-wait'
                : !messageText.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : urgency === 'emergency'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/50 animate-pulse'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-900/50 font-black hover:scale-[1.01]'
            }`}
          >
            {isSending ? (
              <>
                <Radio className="w-5 h-5 animate-spin" />
                <span>Transmitting Alert...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>TRANSMIT PAGE ALERT</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

