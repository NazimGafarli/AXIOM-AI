import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faApple, 
  faWindows 
} from '@fortawesome/free-brands-svg-icons';
import { 
  faDownload, 
  faXmark, 
  faChevronDown, 
  faMicrochip, 
  faDesktop,
  faCloudArrowDown 
} from '@fortawesome/free-solid-svg-icons';

interface DownloadBarProps {
  appName?: string;
  appVersion?: string;
}

const DownloadBar: React.FC<DownloadBarProps> = ({ 
  appName = "Axiom AI",
  appVersion = "1.0.0"
}) => {
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'unknown'>('unknown');
  const [isMacSilicon, setIsMacSilicon] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('mac')) {
      setPlatform('mac');
      const isSilicon = userAgent.includes('arm') || userAgent.includes('Apple');
      setIsMacSilicon(isSilicon);
    } else if (userAgent.includes('win')) {
      setPlatform('windows');
    }

    const hasInstalled = localStorage.getItem('axiom_installed');
    if (hasInstalled === 'true') {
      setIsVisible(false);
    }
  }, []);

  const getDownloadUrl = (type: string) => {
    const baseUrl = '/downloads';
    switch(type) {
      case 'mac-intel':
        return `${baseUrl}/Axiom-AI-${appVersion}-mac-intel.dmg`;
      case 'mac-silicon':
        return `${baseUrl}/Axiom-AI-${appVersion}-mac-silicon.dmg`;
      case 'windows':
        return `${baseUrl}/Axiom-AI-Setup-${appVersion}.exe`;
      default:
        return '#';
    }
  };

  const handleDownload = (type: string) => {
    const url = getDownloadUrl(type);
    window.open(url, '_blank');
    
    // Safe analytics tracking with TypeScript fix
    try {
      const win = window as any;
      if (typeof win !== 'undefined' && win.gtag) {
        win.gtag('event', 'download', {
          'event_category': 'desktop_app',
          'event_label': type
        });
      }
    } catch (error) {
      // Silently fail if analytics is not available
      console.log('Analytics not available');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('axiom_installed', 'true');
  };

  if (!isVisible) return null;

  if (platform === 'mac') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#0f0f1a] to-[#1a1a2e] border-t border-blue-900/30 shadow-2xl z-50 animate-slide-up backdrop-blur-xl bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left side - App Info */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img 
                  src="/Logo.png" 
                  alt={appName} 
                  className="relative w-14 h-14 rounded-xl shadow-lg ring-2 ring-blue-500/30 group-hover:ring-blue-500/60 transition-all duration-300"
                />
                <span className="absolute -top-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-[#0f0f1a] animate-pulse shadow-lg shadow-emerald-500/50"></span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-xl leading-tight flex items-center gap-2">
                  {appName}
                  <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full font-medium shadow-lg shadow-blue-600/30">
                    Desktop
                  </span>
                </h3>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faApple} className="w-4 h-4" />
                    macOS
                  </span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span>Version {appVersion}</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span className="text-emerald-400 text-xs font-medium">✓ Optimized</span>
                </p>
              </div>
            </div>

            {/* Center - Installation instruction */}
            <div className="hidden md:flex items-center text-gray-300 text-sm bg-white/5 px-5 py-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <FontAwesomeIcon icon={faCloudArrowDown} className="w-4 h-4 text-blue-400 mr-2" />
              <span>Download and drag to Applications folder</span>
            </div>

            {/* Right side - Download Buttons */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-600/40 border border-blue-500/30"
                >
                  <FontAwesomeIcon icon={faDownload} className="w-5 h-5" />
                  <span>Download for Mac</span>
                  <FontAwesomeIcon icon={faChevronDown} className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown for Mac versions */}
                {showDropdown && (
                  <div className="absolute bottom-full mb-2 left-0 w-72 bg-[#1a1a2e] rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-fade-in backdrop-blur-xl">
                    <div className="p-2">
                      <div className="px-3 py-2 mb-1">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Choose your architecture</p>
                      </div>
                      <button
                        onClick={() => {
                          handleDownload('mac-silicon');
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FontAwesomeIcon icon={faMicrochip} className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <span className="text-white font-medium block">Apple Silicon</span>
                            <span className="text-xs text-gray-400">M1, M2, M3 chips</span>
                          </div>
                        </div>
                        <span className="text-xs bg-blue-600/30 text-blue-400 px-3 py-1 rounded-full font-medium border border-blue-500/20">.dmg</span>
                      </button>
                      <button
                        onClick={() => {
                          handleDownload('mac-intel');
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-3 hover:bg-white/5 rounded-lg transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-500/20 to-gray-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <FontAwesomeIcon icon={faDesktop} className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <span className="text-white font-medium block">Intel</span>
                            <span className="text-xs text-gray-400">Older Mac systems</span>
                          </div>
                        </div>
                        <span className="text-xs bg-gray-600/30 text-gray-400 px-3 py-1 rounded-full font-medium border border-gray-500/20">.dmg</span>
                      </button>
                    </div>
                    <div className="border-t border-white/5 px-4 py-2.5 bg-white/5">
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {isMacSilicon ? 'Recommended: Apple Silicon version' : 'Recommended: Intel version'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-300 transition-colors p-2 hover:bg-white/5 rounded-lg"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (platform === 'windows') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#0f0f1a] to-[#1a1a2e] border-t border-blue-900/30 shadow-2xl z-50 animate-slide-up backdrop-blur-xl bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img 
                  src="/Logo.png" 
                  alt={appName} 
                  className="relative w-14 h-14 rounded-xl shadow-lg ring-2 ring-blue-500/30 group-hover:ring-blue-500/60 transition-all duration-300"
                />
                <span className="absolute -top-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-[#0f0f1a] animate-pulse shadow-lg shadow-emerald-500/50"></span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-xl leading-tight flex items-center gap-2">
                  {appName}
                  <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full font-medium shadow-lg shadow-blue-600/30">
                    Desktop
                  </span>
                </h3>
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faWindows} className="w-4 h-4" />
                    Windows
                  </span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span>Version {appVersion}</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span className="text-emerald-400 text-xs font-medium">✓ Ready</span>
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center text-gray-300 text-sm bg-white/5 px-5 py-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <FontAwesomeIcon icon={faCloudArrowDown} className="w-4 h-4 text-blue-400 mr-2" />
              <span>Download and run the installer</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownload('windows')}
                className="flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-600/40 border border-blue-500/30"
              >
                <FontAwesomeIcon icon={faDownload} className="w-5 h-5" />
                <span>Download for Windows</span>
                <span className="text-xs bg-white/20 px-3 py-0.5 rounded-full font-medium">.exe</span>
              </button>

              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-300 transition-colors p-2 hover:bg-white/5 rounded-lg"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unknown platform - show both options
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#0f0f1a] to-[#1a1a2e] border-t border-blue-900/30 shadow-2xl z-50 animate-slide-up backdrop-blur-xl bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img 
                src="/Logo.png" 
                alt={appName} 
                className="relative w-14 h-14 rounded-xl shadow-lg ring-2 ring-blue-500/30 group-hover:ring-blue-500/60 transition-all duration-300"
              />
            </div>
            <div>
              <h3 className="text-white font-semibold text-xl flex items-center gap-2">
                {appName}
                <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full font-medium">
                  Desktop App
                </span>
              </h3>
              <p className="text-gray-400 text-sm">Choose your platform to get started</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={getDownloadUrl('mac-silicon')}
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 px-5 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 backdrop-blur-sm"
            >
              <FontAwesomeIcon icon={faApple} className="w-5 h-5" />
              <span>macOS</span>
            </a>
            <a
              href={getDownloadUrl('windows')}
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 px-5 rounded-xl transition-all duration-200 border border-white/10 hover:border-white/20 backdrop-blur-sm"
            >
              <FontAwesomeIcon icon={faWindows} className="w-5 h-5" />
              <span>Windows</span>
            </a>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-300 transition-colors p-2 hover:bg-white/5 rounded-lg"
            >
              <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadBar;