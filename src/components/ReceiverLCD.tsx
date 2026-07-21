import React, { useState } from 'react';
import { VolumeX, Volume2, ShieldAlert, Sparkles, RefreshCw, Radio, BellRing, Trash2 } from 'lucide-react';
import { PageMessage } from '../types';
import { playPagerAlert, stopAlertAudio, unlockAudio } from '../utils/audioSynth';

interface ReceiverLCDProps {
  channel: string;
  lastMessage: PageMessage | null;
  isAlerting: boolean;
  audioArmed: boolean;
  onAudioArmedChange: (armed: boolean) => void;
  onClearScreen: () => void;
}

export const ReceiverLCD: React.FC<ReceiverLCDProps> = ({
  channel,
  lastMessage,
  isAlerting,
  audioArmed,
  onAudioArmedChange,
  onClearScreen,
}) => {
  const [volume, setVolume] = useState<number>(0.8);

  const handleTestSound = async () => {
    if (!audioArmed) {
      await unlockAudio();
      onAudioArmedChange(true);
    }
    playPagerAlert('classic', volume, 1);
  };

  const handleStopSound = () => {
    stopAlertAudio();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
      {/* Header Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-base font-bold text-white tracking-wide">
            RECEIVER LCD PAGER
          </h2>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full font-bold">
          LIVE MONITORING
        </span>
      </div>

      {/* Arm Audio Alert Banner if audio suspended */}
      {!audioArmed && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 animate-bounce" />
            <div className="text-xs">
              <p className="font-bold text-amber-300">Loud Audio Require Gesture</p>
              <p className="text-slate-400">Click button below to enable high-decibel alarm tones.</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const success = await unlockAudio();
              onAudioArmedChange(success);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shrink-0"
          >
            🔊 ARM AUDIO NOW
          </button>
        </div>
      )}

      {/* Outer Tactical Pager Device Housing */}
      <div className="bg-slate-950 border-4 border-slate-800 rounded-3xl p-5 sm:p-6 shadow-inner relative overflow-hidden">
        {/* Grip Ridges Deco */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-30">
          <div className="w-1 h-8 bg-slate-600 rounded-full" />
          <div className="w-1 h-8 bg-slate-600 rounded-full" />
          <div className="w-1 h-8 bg-slate-600 rounded-full" />
        </div>

        {/* Pager Header Details */}
        <div className="flex justify-between items-center mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
              TELE-PAGE 9000
            </span>
            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              V2.4
            </span>
          </div>

          {/* Strobe Light LED Alert */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase">ALARM LED:</span>
            <div
              className={`w-4 h-4 rounded-full border-2 border-slate-900 transition-all duration-150 ${
                isAlerting
                  ? 'bg-red-500 shadow-[0_0_20px_#ef4444] animate-ping'
                  : 'bg-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Retro Green LCD Screen */}
        <div
          className={`relative rounded-2xl p-5 border-4 border-slate-950 transition-all duration-200 min-h-[160px] flex flex-col justify-between shadow-2xl font-mono ${
            isAlerting
              ? 'bg-[#a3e635] text-slate-950 shadow-[0_0_30px_#a3e635] animate-pulse'
              : 'bg-[#7c9d82] text-[#0f2412]'
          }`}
        >
          {/* LCD Scanline effect overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10 rounded-xl"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 3px)',
            }}
          />

          {/* LCD Top Status Bar */}
          <div className="flex justify-between items-center text-xs font-bold border-b border-black/20 pb-2 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span>CH: {channel || 'DEFAULT'}</span>
            </div>
            <div className="flex items-center gap-2">
              {lastMessage ? (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${
                    lastMessage.urgency === 'emergency'
                      ? 'bg-red-700 text-white animate-bounce'
                      : lastMessage.urgency === 'urgent'
                      ? 'bg-amber-600 text-slate-950'
                      : 'bg-emerald-800 text-white'
                  }`}
                >
                  {lastMessage.urgency.toUpperCase()}
                </span>
              ) : (
                <span className="opacity-60 text-[11px]">STANDBY</span>
              )}
            </div>
          </div>

          {/* LCD Main Display Area */}
          <div className="my-4 text-center sm:text-left">
            {lastMessage ? (
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-black tracking-wider leading-snug break-words drop-shadow-sm">
                  {lastMessage.message}
                </p>
                {lastMessage.repeatCount > 1 && (
                  <p className="text-[11px] font-bold opacity-80">
                    REPEATS: {lastMessage.repeatCount} CYCLES
                  </p>
                )}
              </div>
            ) : (
              <div className="py-4 text-center opacity-60 flex flex-col items-center justify-center gap-1">
                <p className="text-lg font-bold tracking-widest animate-pulse">
                  READY FOR PAGE...
                </p>
                <p className="text-xs font-mono">Listening on channel [{channel || 'DEFAULT'}]</p>
              </div>
            )}
          </div>

          {/* LCD Bottom Footer Info */}
          <div className="flex justify-between items-center text-[11px] font-bold opacity-80 border-t border-black/20 pt-2">
            <span>SNDR: {lastMessage ? lastMessage.senderName : '---'}</span>
            <span>
              {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString() : '--:--:--'}
            </span>
          </div>
        </div>

        {/* Tactical Control Buttons below screen */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={handleStopSound}
            className="flex items-center justify-center gap-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/60 py-2.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md"
          >
            <VolumeX className="w-4 h-4 text-red-400" />
            <span>MUTE ALARM</span>
          </button>

          <button
            onClick={handleTestSound}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md"
          >
            <BellRing className="w-4 h-4 text-emerald-400" />
            <span>TEST SOUND</span>
          </button>

          <button
            onClick={onClearScreen}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 px-3 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
            <span>CLEAR LCD</span>
          </button>
        </div>
      </div>

      {/* Volume Control Slider */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span>MASTER VOLUME:</span>
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <span className="text-xs font-mono font-bold text-emerald-400 w-8 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
