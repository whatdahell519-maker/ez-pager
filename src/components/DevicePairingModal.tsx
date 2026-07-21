import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, QrCode, Copy, Check, Radio, Send, X, ExternalLink, RefreshCw, Zap, Volume2 } from 'lucide-react';
import { pagerSync } from '../utils/pagerSync';

interface DevicePairingModalProps {
  channel: string;
  onChannelChange: (newChannel: string) => void;
  isOpen: boolean;
  onClose: () => void;
  activeClientsCount?: number;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({
  channel,
  onChannelChange,
  isOpen,
  onClose,
  activeClientsCount = 1,
}) => {
  const [copied, setCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [customChannelInput, setCustomChannelInput] = useState('');

  if (!isOpen) return null;

  // Generate shareable URL with channel param
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?channel=${encodeURIComponent(channel)}`
    : `https://pager.app/?channel=${channel}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestPing = async () => {
    setTestSent(true);
    await pagerSync.sendPage({
      channel,
      message: '🔔 TEST PAGE BETWEEN DEVICES - ALL SYSTEMS WORKING!',
      urgency: 'urgent',
      tone: 'siren',
      senderName: 'Device Pair Test',
      repeatCount: 2,
    });
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSwitchChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customChannelInput.trim()) return;
    const norm = customChannelInput.toUpperCase().trim();
    onChannelChange(norm);
    setCustomChannelInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-blue-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20 shrink-0">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-wide">
              PAIR TWO DEVICES INSTANTLY
            </h3>
            <p className="text-xs text-slate-400">
              Grandma's Phone/Tablet & Your Phone share pages in real time
            </p>
          </div>
        </div>

        {/* Active Channel Badge */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Shared Channel Code:</span>
            <span className="text-cyan-400 font-mono font-black text-sm bg-cyan-950 px-3 py-1 rounded-full border border-cyan-800">
              [{channel}]
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-ping" />
              <span>Multi-Device Sync Status:</span>
            </span>
            <span className="font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
              🟢 ONLINE ({activeClientsCount} {activeClientsCount === 1 ? 'Device' : 'Devices'} Connected)
            </span>
          </div>
        </div>

        {/* QR Code & Direct Link */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="bg-white p-3 rounded-2xl shadow-lg shrink-0">
            <QRCodeSVG value={shareUrl} size={130} level="M" />
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <p className="text-sm font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Scan QR Code on 2nd Phone</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Open Camera on Grandma's phone or tablet to join channel <span className="text-cyan-300 font-mono font-bold">[{channel}]</span> immediately.
              </p>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>PAIR LINK COPIED TO CLIPBOARD!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>COPY PAIR LINK FOR GRANDMA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Ping Button */}
        <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-emerald-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Verify Real-Time Connection</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Click below to send a loud test page alert across both devices to ensure audio and alerts ring immediately.
          </p>
          <button
            onClick={handleTestPing}
            disabled={testSent}
            className={`w-full py-3 px-4 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
              testSent
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {testSent ? (
              <>
                <Check className="w-4 h-4" />
                <span>TEST PAGE SENT TO SECOND DEVICE!</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>PING TEST ALERT TO OTHER DEVICE</span>
              </>
            )}
          </button>
        </div>

        {/* Custom Channel Switcher */}
        <form onSubmit={handleSwitchChannel} className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Switch Private Channel Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customChannelInput}
              onChange={(e) => setCustomChannelInput(e.target.value)}
              placeholder="e.g. GRANDMA-HOME, CARE-911"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-cyan-400 outline-none focus:border-cyan-500 uppercase"
            />
            <button
              type="submit"
              disabled={!customChannelInput.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors"
            >
              Set Channel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
