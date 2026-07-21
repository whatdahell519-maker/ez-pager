import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ReceiverLCD } from './components/ReceiverLCD';
import { SenderKeypad } from './components/SenderKeypad';
import { HistoryLog } from './components/HistoryLog';
import { DevicePairingModal } from './components/DevicePairingModal';
import { PageMessage, PagerTone, PagerUrgency, PagerViewMode } from './types';
import { pagerSync } from './utils/pagerSync';
import { playPagerAlert, stopAlertAudio, isAudioUnlocked, unlockAudio } from './utils/audioSynth';
import { Radio, ShieldCheck, ExternalLink, QrCode, Smartphone, Volume2, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [channel, setChannel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlChannel = params.get('channel');
      if (urlChannel && urlChannel.trim()) {
        return urlChannel.toUpperCase().trim();
      }
    }
    return 'DEFAULT';
  });

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeClientsCount, setActiveClientsCount] = useState<number>(1);
  const [viewMode, setViewMode] = useState<PagerViewMode>('split');
  const [audioArmed, setAudioArmed] = useState<boolean>(false);
  const [history, setHistory] = useState<PageMessage[]>([]);
  const [lastMessage, setLastMessage] = useState<PageMessage | null>(null);
  const [isAlerting, setIsAlerting] = useState<boolean>(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState<boolean>(false);

  // Initialize Channel Connection & Real-time Listeners
  useEffect(() => {
    pagerSync.connect(channel);

    const unsubscribeConn = pagerSync.onConnectionChange((status, count) => {
      setIsConnected(status);
      if (typeof count === 'number') {
        setActiveClientsCount(count);
      }
    });

    const unsubscribeMsg = pagerSync.onMessage((msg) => {
      setLastMessage(msg);
      setHistory((prev) => {
        if (prev.some((p) => p.id === msg.id)) return prev;
        return [msg, ...prev];
      });

      // Trigger Audio Alert
      setIsAlerting(true);
      playPagerAlert(msg.tone, 0.85, msg.repeatCount || 1);

      // Stop visual alert light after audio completes
      const alertDuration = ((msg.repeatCount || 1) * 1.2 + 0.5) * 1000;
      setTimeout(() => {
        setIsAlerting(false);
      }, alertDuration);
    });

    // Fetch channel history on startup or channel change
    pagerSync.fetchHistory(channel).then((msgs) => {
      if (msgs.length > 0) {
        setHistory(msgs);
        setLastMessage(msgs[0]);
      }
    });

    return () => {
      unsubscribeConn();
      unsubscribeMsg();
    };
  }, [channel]);

  // Attempt initial audio unlock on first user gesture anywhere
  useEffect(() => {
    const handleInitialClick = async () => {
      if (!isAudioUnlocked()) {
        const unlocked = await unlockAudio();
        setAudioArmed(unlocked);
      } else {
        setAudioArmed(true);
      }
    };

    window.addEventListener('click', handleInitialClick, { once: true });
    return () => {
      window.removeEventListener('click', handleInitialClick);
    };
  }, []);

  // Send a page
  const handleSendPage = async (params: {
    message: string;
    urgency: PagerUrgency;
    tone: PagerTone;
    senderName: string;
    repeatCount: number;
  }): Promise<boolean> => {
    const res = await pagerSync.sendPage({
      channel,
      ...params,
    });
    return res.success;
  };

  const handleClearLCD = () => {
    setLastMessage(null);
    setIsAlerting(false);
    stopAlertAudio();
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleSelectHistoryMessage = (msg: PageMessage) => {
    setLastMessage(msg);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        channel={channel}
        onChannelChange={setChannel}
        isConnected={isConnected}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        audioArmed={audioArmed}
        onAudioArmedChange={setAudioArmed}
        onOpenPairModal={() => setIsPairModalOpen(true)}
        activeClientsCount={activeClientsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Instant Multi-Device Connection Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-300 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-black text-white text-sm flex items-center gap-2">
                <span>Multi-Device Real-Time Synchronization Active</span>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  CH: [{channel}]
                </span>
              </p>
              <p className="text-slate-400 mt-0.5">
                Pages sent from this device will immediately ring on any phone, tablet, or PC connected on channel <span className="text-cyan-400 font-mono font-bold">[{channel}]</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setIsPairModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl transition-all shadow-md active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>📱 Pair 2nd Device / Phone</span>
            </button>

            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Tab</span>
            </button>
          </div>
        </div>

        {/* View Layout Switcher */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
              <ReceiverLCD
                channel={channel}
                lastMessage={lastMessage}
                isAlerting={isAlerting}
                audioArmed={audioArmed}
                onAudioArmedChange={setAudioArmed}
                onClearScreen={handleClearLCD}
              />
              <HistoryLog
                history={history}
                onClearHistory={handleClearHistory}
                onSelectMessage={handleSelectHistoryMessage}
              />
            </div>

            <div>
              <SenderKeypad channel={channel} onSendPage={handleSendPage} />
            </div>
          </div>
        )}

        {viewMode === 'receiver' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <ReceiverLCD
              channel={channel}
              lastMessage={lastMessage}
              isAlerting={isAlerting}
              audioArmed={audioArmed}
              onAudioArmedChange={setAudioArmed}
              onClearScreen={handleClearLCD}
            />
            <HistoryLog
              history={history}
              onClearHistory={handleClearHistory}
              onSelectMessage={handleSelectHistoryMessage}
            />
          </div>
        )}

        {viewMode === 'sender' && (
          <div className="max-w-xl mx-auto">
            <SenderKeypad channel={channel} onSendPage={handleSendPage} />
          </div>
        )}
      </main>

      {/* Device Pairing Modal */}
      <DevicePairingModal
        channel={channel}
        onChannelChange={setChannel}
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        activeClientsCount={activeClientsCount}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Standalone High-Frequency Pager Engine</span>
        </div>
        <p>Zero compilation required • Download standalone <code>.html</code> file anytime</p>
      </footer>
    </div>
  );
}
