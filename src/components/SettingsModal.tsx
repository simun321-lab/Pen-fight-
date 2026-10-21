/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GameSettings, DeskTheme } from '../types/game';
import { getTranslation, Language } from '../services/localization';
import { sound } from '../services/sound';
import { StorageService } from '../services/storage';
import { DESK_THEMES } from '../data/pens';

interface SettingsModalProps {
  settings: GameSettings;
  selectedDeskTheme: DeskTheme;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (updated: GameSettings) => void;
  onUpdateDeskTheme: (theme: DeskTheme) => void;
  onDataReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  selectedDeskTheme,
  isOpen,
  onClose,
  onUpdateSettings,
  onUpdateDeskTheme,
  onDataReset,
}) => {
  const t = getTranslation(settings.language);
  const [activeTab, setActiveTab] = useState<'theme' | 'gameplay' | 'audio' | 'data' | 'about'>('theme');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSettingChange = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    sound.playClick();
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);

    if (key === 'masterVolume') sound.setMasterVolume(value as number);
    if (key === 'sfxVolume') sound.setSfxVolume(value as number);
    if (key === 'soundEnabled') sound.setMute(!(value as boolean));
  };

  const handleExport = () => {
    sound.playClick();
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `penfight_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded successfully!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const success = StorageService.importAllData(content);
      if (success) {
        showToast('Data restored! Refreshing settings...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        showToast('Error: Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Modal Title */}
        <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight mb-4">
          {t.settingsTitle}
        </h2>

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-5 overflow-x-auto">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('theme');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'theme' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.appearanceTab}
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('gameplay');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'gameplay' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.gameplayTab}
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('audio');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'audio' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.audioTab}
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('data');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'data' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.progressTab}
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('about');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'about' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.aboutTab}
          </button>
        </div>

        {/* Tab 1: Theme & Language */}
        {activeTab === 'theme' && (
          <div className="space-y-4">
            {/* Language Selection */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                {t.language}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSettingChange('language', 'en' as Language)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.language === 'en'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-sm text-white block">English</span>
                  <span className="text-[10px] text-slate-400">Default Classroom</span>
                </button>
                <button
                  onClick={() => handleSettingChange('language', 'bn' as Language)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    settings.language === 'bn'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-sm text-white block">বাংলা (Bangla)</span>
                  <span className="text-[10px] text-slate-400">বাংলাদেশ / পশ্চিমবঙ্গ</span>
                </button>
              </div>
            </div>

            {/* Desk Surface Wood Theme */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
                {t.theme}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DESK_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      sound.playClick();
                      onUpdateDeskTheme(theme.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      selectedDeskTheme === theme.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg border border-white/20 shadow-sm shrink-0"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <div>
                      <span className="font-bold text-xs text-white block truncate">
                        {settings.language === 'bn' ? theme.nameBn : theme.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Gameplay */}
        {activeTab === 'gameplay' && (
          <div className="space-y-3">
            {/* Series Length */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                {t.seriesLength}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 5].map(len => (
                  <button
                    key={len}
                    onClick={() => handleSettingChange('seriesLength', len)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      settings.seriesLength === len
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-xs block font-bold">
                      {len === 1 ? t.bestOf1 : len === 3 ? t.bestOf3 : t.bestOf5}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aim Guide Toggle */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{t.aimGuide}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{t.aimGuideHelp}</span>
              </div>
              <input
                type="checkbox"
                checked={settings.aimGuide}
                onChange={e => handleSettingChange('aimGuide', e.target.checked)}
                className="w-5 h-5 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Reduced Motion Toggle */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{t.reducedMotion}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{t.reducedMotionHelp}</span>
              </div>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={e => handleSettingChange('reducedMotion', e.target.checked)}
                className="w-5 h-5 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Vibration Toggle */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{t.vibration}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{t.vibrationHelp}</span>
              </div>
              <input
                type="checkbox"
                checked={settings.vibration}
                onChange={e => handleSettingChange('vibration', e.target.checked)}
                className="w-5 h-5 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Auto Next Round Toggle */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{t.autoNext}</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoNextMatch}
                onChange={e => handleSettingChange('autoNextMatch', e.target.checked)}
                className="w-5 h-5 accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Audio */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            {/* Master Audio Toggle */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {settings.soundEnabled
                  ? (settings.language === 'bn' ? 'শব্দ চালু' : 'Audio Enabled')
                  : t.muteAll}
              </span>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={e => handleSettingChange('soundEnabled', e.target.checked)}
                className="w-5 h-5 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Master Volume Slider */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                <span>{t.masterVolume}</span>
                <span className="text-amber-400 font-mono">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={e => handleSettingChange('masterVolume', parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* SFX Volume Slider */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                <span>{t.sfxVolume}</span>
                <span className="text-amber-400 font-mono">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={e => handleSettingChange('sfxVolume', parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Data & Backup */}
        {activeTab === 'data' && (
          <div className="space-y-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Local Save Data
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                All game progress is saved locally in your browser. You can export a backup file or restore previously saved data.
              </p>

              <div className="space-y-2">
                {/* Export */}
                <button
                  onClick={handleExport}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <span>💾</span>
                  <span>{t.backupData}</span>
                </button>

                {/* Import */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <span>📂</span>
                  <span>{t.restoreData}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept=".json"
                  className="hidden"
                />
              </div>
            </div>

            {/* Reset Progress */}
            <div className="bg-rose-950/30 border border-rose-900/40 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-1">
                Danger Zone
              </h4>
              <p className="text-[11px] text-slate-400 mb-3">
                Resetting will clear your unlocked pens, avatars, and match statistics.
              </p>
              <button
                onClick={() => {
                  sound.playClick();
                  setShowResetConfirm(true);
                }}
                className="w-full py-2 px-4 rounded-xl bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 font-bold text-xs border border-rose-700/40 transition-colors"
              >
                {t.resetData}
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: About & Credits */}
        {activeTab === 'about' && (
          <div className="space-y-3 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl mx-auto mb-2 text-amber-300">
              ✒️
            </div>
            <h3 className="text-base font-black text-white font-heading">
              Pen Fight: The School Desk Series
            </h3>
            <p className="text-xs text-slate-400">
              {t.version}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed mt-2 text-left">
              Crafted with nostalgic love for school desks worldwide. Features accurate 2D rigid-body collision physics, AI opponents, pass-and-play local multiplayer, and original procedural Web Audio.
            </p>
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500">
              Zero external dependencies · 100% Offline playable
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mt-3 p-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold text-center">
            {toastMessage}
          </div>
        )}

        {/* Reset Confirmation Sub-Dialog */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
            <div className="bg-slate-900 border border-rose-600 rounded-3xl p-6 max-w-sm text-center shadow-2xl">
              <div className="text-3xl mb-2">⚠️</div>
              <h3 className="text-base font-bold text-white mb-1">{t.resetConfirmTitle}</h3>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">{t.resetConfirmDesc}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    StorageService.resetAllData();
                    onDataReset();
                    setShowResetConfirm(false);
                    showToast('All progress reset.');
                    setTimeout(() => window.location.reload(), 1000);
                  }}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  {t.confirmReset}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
