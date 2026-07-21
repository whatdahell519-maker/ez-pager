import React, { useState } from 'react';
import { Volume2, VolumeX, Download, Radio, Eye, Send, Monitor, ShieldAlert } from 'lucide-react';
import { PagerViewMode } from '../types';
import { unlockAudio, isAudioUnlocked } from '../utils/audioSynth';
import { generateStandaloneHtml } from '../utils/exportStandaloneHtml';

interface NavbarProps {
  channel: string;
  onChannelChange: (newChannel: string) => void;
  isConnected: boolean;
  viewMode: PagerViewMode;
  onViewModeChange: (mode: PagerViewMode) => void;
  audioArmed: boolean;
  onAudioArmedChange: (armed: boolean) => void;
  onOpenPairModal: () => void;
  activeClientsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  channel,
  onChannelChange,
  isConnected,
  viewMode,
  onViewModeChange,
  audioArmed,
  onAudioArmedChange,
  onOpenPairModal,
  activeClientsCount = 1,
}) => {
  const [showExportModal, setShowExportModal] = useState(false);

  const handleArmAudio = async () => {
    const success = await unlockAudio();
    onAudioArmedChange(success || isAudioUnlocked());
  };

  const handleDownloadHtml = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pager_${channel.toLowerCase() || 'default'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2 rounded-lg font-black tracking-widest text-xs shadow-md shadow-red-900/40 flex items-center gap-1.5">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>PAGER</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                Digital Receiver & Sender
              </h1>
              <p className="text-xs text-slate-400">Zero-latency instant alert system</p>
            </div>
          </div>

          {/* Channel Picker & Audio Arming */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Channel Box */}
            <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5">
              <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider">
                CH:
              </span>
              <input
                type="text"
                value={channel}
                onChange={(e) => onChannelChange(e.target.value.toUpperCase())}
                className="bg-transparent text-emerald-400 font-mono font-bold text-sm w-24 outline-none uppercase tracking-wider"
                maxLength={12}
                placeholder="DEFAULT"
              />
            </div>

            {/* Connection Status & Pair Button */}
            <button
              onClick={onOpenPairModal}
              className="flex items-center gap-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-300 transition-all shadow-sm active:scale-95"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                }`}
              />
              <span>📱 Pair 2nd Device</span>
              {activeClientsCount > 1 && (
                <span className="bg-emerald-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {activeClientsCount}
                </span>
              )}
            </button>

            {/* Arm Audio Button */}
            <button
              id="armAudioNavbarBtn"
              onClick={handleArmAudio}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                audioArmed
                  ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/50 animate-bounce'
              }`}
            >
              {audioArmed ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audio Active</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Enable Loud Sound</span>
                </>
              )}
            </button>

            {/* Standalone Single HTML Download Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-900/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download HTML</span>
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onViewModeChange('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'split'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
            <button
              onClick={() => onViewModeChange('receiver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'receiver'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Receiver</span>
            </button>
            <button
              onClick={() => onViewModeChange('sender')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'sender'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>Sender</span>
            </button>
          </div>
        </div>
      </header>

      {/* Standalone Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Download Standalone HTML</h3>
                <p className="text-xs text-slate-400">Run locally on your PC without any compilation or server</p>
              </div>
            </div>

            <div className="text-sm text-slate-300 space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans leading-relaxed">
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Includes <strong>Synthesized Audio Engine</strong> for loud multi-tone alerts.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Instant Multi-Tab Sync</strong> via BroadcastChannel & LocalStorage.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Zero installation or compilation required — simply open <code>.html</code> in any browser.</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDownloadHtml();
                  setShowExportModal(false);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Save Standalone File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
