import React, { useState, useEffect } from 'react';
import { AudioEffect, AudioPreset, AudioAnalysis, AudioComparison } from '../types';
import './AudioEffectsPanel.css';

interface AudioEffectsPanelProps {
  audioFilename: string;
  onEffectApplied: (enhancedUrl: string) => void;
}

const AudioEffectsPanel: React.FC<AudioEffectsPanelProps> = ({ audioFilename, onEffectApplied }) => {
  const [activeTab, setActiveTab] = useState<'effects' | 'analysis' | 'export'>('effects');
  const [presets, setPresets] = useState<Record<string, AudioEffect>>({});
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customEffects, setCustomEffects] = useState<AudioEffect>({});
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [comparison, setComparison] = useState<AudioComparison | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [originalFile, setOriginalFile] = useState<string>(audioFilename);
  const [processedFile, setProcessedFile] = useState<string>('');
  const [exportFormats, setExportFormats] = useState<string[]>(['mp3']);
  const [exportQuality, setExportQuality] = useState({ bitrate: '192k', sample_rate: 32000 });

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/audio/presets');
      const data = await response.json();
      if (data.status === 'success') {
        setPresets(data.presets);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const applyPreset = async (presetName: string) => {
    setIsProcessing(true);
    try {
      console.log('🎨 Applying preset:', presetName, 'to file:', originalFile);
      
      const response = await fetch('http://localhost:5000/api/audio/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioFilename: originalFile,
          preset: presetName
        })
      });

      const data = await response.json();
      console.log('🎨 Enhancement response:', data);
      
      if (data.status === 'success') {
        setProcessedFile(data.enhancedFile);
        console.log('✅ Enhanced audio URL:', data.audioUrl);
        onEffectApplied(data.audioUrl);
        setSelectedPreset(presetName);
      } else {
        console.error('❌ Enhancement failed:', data.error);
        alert(`Enhancement failed: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Failed to apply preset:', error);
      alert(`Failed to apply preset: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyCustomEffects = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/api/audio/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioFilename: originalFile,
          effects: customEffects
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setProcessedFile(data.enhancedFile);
        onEffectApplied(data.audioUrl);
      }
    } catch (error) {
      console.error('Failed to apply effects:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeAudio = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/api/audio/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioFilename })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Failed to analyze audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const compareAudio = async () => {
    if (!processedFile) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/api/audio/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalFilename: originalFile,
          processedFilename: processedFile
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        setComparison(data.comparison);
      }
    } catch (error) {
      console.error('Failed to compare audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const exportAudio = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/api/audio/batch-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioFilenames: [processedFile || originalFile],
          formats: exportFormats,
          qualitySettings: exportQuality
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = `http://localhost:5000${data.zipUrl}`;
        link.download = data.zipFilename || 'exported_audio.zip';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Export initiated:', data.zipFilename);
      } else {
        console.error('❌ Export failed:', data.error);
        alert(`Export failed: ${data.error}`);
      }
    } catch (error) {
      console.error('❌ Failed to export audio:', error);
      alert(`Failed to export audio: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateEQ = (band: 'low' | 'mid' | 'high', value: number) => {
    setCustomEffects(prev => ({
      ...prev,
      eq: { 
        low: prev.eq?.low || 0,
        mid: prev.eq?.mid || 0,
        high: prev.eq?.high || 0,
        [band]: value 
      }
    }));
  };

  const updateReverb = (param: 'room_size' | 'damping' | 'wet_level', value: number) => {
    setCustomEffects(prev => ({
      ...prev,
      reverb: { 
        room_size: prev.reverb?.room_size || 0.5,
        damping: prev.reverb?.damping || 0.5,
        wet_level: prev.reverb?.wet_level || 0.3,
        [param]: value 
      }
    }));
  };

  const updateCompression = (param: 'threshold' | 'ratio' | 'attack' | 'release', value: number) => {
    setCustomEffects(prev => ({
      ...prev,
      compression: {
        threshold: prev.compression?.threshold || -12,
        ratio: prev.compression?.ratio || 3.0,
        attack: prev.compression?.attack || 0.003,
        release: prev.compression?.release || 0.1,
        [param]: value
      }
    }));
  };

  const updateLimiter = (param: 'threshold' | 'release', value: number) => {
    setCustomEffects(prev => ({
      ...prev,
      limiter: {
        threshold: prev.limiter?.threshold || -1.0,
        release: prev.limiter?.release || 0.05,
        [param]: value
      }
    }));
  };

  return (
    <div className="audio-effects-panel">
      <div className="effects-tabs">
        <button 
          className={activeTab === 'effects' ? 'active' : ''}
          onClick={() => setActiveTab('effects')}
        >
          Effects
        </button>
        <button 
          className={activeTab === 'analysis' ? 'active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis
        </button>
        <button 
          className={activeTab === 'export' ? 'active' : ''}
          onClick={() => setActiveTab('export')}
        >
          Export
        </button>
      </div>

      {activeTab === 'effects' && (
        <div className="effects-content">
          <div className="presets-section">
            <h3>Presets</h3>
            <div className="preset-buttons">
              {Object.keys(presets).map(presetName => (
                <button
                  key={presetName}
                  className={`preset-btn ${selectedPreset === presetName ? 'active' : ''}`}
                  onClick={() => applyPreset(presetName)}
                  disabled={isProcessing}
                >
                  {presetName.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-effects-section">
            <h3>Custom Effects</h3>
            
            <div className="effect-group">
              <h4>Equalizer</h4>
              <div className="slider-group">
                <label>
                  Low: {customEffects.eq?.low || 0} dB
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={customEffects.eq?.low || 0}
                    onChange={(e) => updateEQ('low', parseFloat(e.target.value))}
                  />
                </label>
                <label>
                  Mid: {customEffects.eq?.mid || 0} dB
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={customEffects.eq?.mid || 0}
                    onChange={(e) => updateEQ('mid', parseFloat(e.target.value))}
                  />
                </label>
                <label>
                  High: {customEffects.eq?.high || 0} dB
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    value={customEffects.eq?.high || 0}
                    onChange={(e) => updateEQ('high', parseFloat(e.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className="effect-group">
              <h4>Reverb</h4>
              <div className="slider-group">
                <label>
                  Room Size: {((customEffects.reverb?.room_size || 0.5) * 100).toFixed(0)}%
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={customEffects.reverb?.room_size || 0.5}
                    onChange={(e) => updateReverb('room_size', parseFloat(e.target.value))}
                  />
                </label>
                <label>
                  Damping: {((customEffects.reverb?.damping || 0.5) * 100).toFixed(0)}%
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={customEffects.reverb?.damping || 0.5}
                    onChange={(e) => updateReverb('damping', parseFloat(e.target.value))}
                  />
                </label>
                <label>
                  Wet Level: {((customEffects.reverb?.wet_level || 0.3) * 100).toFixed(0)}%
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={customEffects.reverb?.wet_level || 0.3}
                    onChange={(e) => updateReverb('wet_level', parseFloat(e.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className="effect-group">
              <h4>Compression</h4>
              <div className="slider-group">
                <label>
                  Threshold: {customEffects.compression?.threshold || -12} dB
                  <input
                    type="range"
                    min="-24"
                    max="0"
                    step="1"
                    value={customEffects.compression?.threshold || -12}
                    onChange={(e) => updateCompression('threshold', parseFloat(e.target.value))}
                  />
                </label>
                <label>
                  Ratio: {(customEffects.compression?.ratio || 3.0).toFixed(1)}:1
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={customEffects.compression?.ratio || 3.0}
                    onChange={(e) => updateCompression('ratio', parseFloat(e.target.value))}
                  />
                </label>
                <label>
                  Attack: {((customEffects.compression?.attack || 0.003) * 1000).toFixed(1)} ms
                  <input
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    value={customEffects.compression?.attack || 0.003}
                    onChange={(e) => updateCompression('attack', parseFloat(e.target.value))}
                  />
                </label>
                <label>
                  Release: {((customEffects.compression?.release || 0.1) * 1000).toFixed(0)} ms
                  <input
                    type="range"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    value={customEffects.compression?.release || 0.1}
                    onChange={(e) => updateCompression('release', parseFloat(e.target.value))}
                  />
                </label>
              </div>
            </div>

            <div className="effect-group">
              <h4>Limiter</h4>
              <div className="slider-group">
                <label>
                  Threshold: {customEffects.limiter?.threshold || -1.0} dB
                  <input
                    type="range"
                    min="-6"
                    max="0"
                    step="0.1"
                    value={customEffects.limiter?.threshold || -1.0}
                    onChange={(e) => updateLimiter('threshold', parseFloat(e.target.value))}
                  />
                </label>
                <label>
                  Release: {((customEffects.limiter?.release || 0.05) * 1000).toFixed(0)} ms
                  <input
                    type="range"
                    min="0.01"
                    max="0.2"
                    step="0.01"
                    value={customEffects.limiter?.release || 0.05}
                    onChange={(e) => updateLimiter('release', parseFloat(e.target.value))}
                  />
                </label>
              </div>
            </div>

            <button 
              className="glass-button rounded-lg px-4 py-2 text-white/80 hover:text-white transition-all duration-300 w-full"
              onClick={applyCustomEffects}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Apply Effects'}
            </button>
          </div>

          {processedFile && (
            <div className="comparison-section">
              <button 
                className="glass-button rounded-lg px-4 py-2 text-white/80 hover:text-white transition-all duration-300"
                onClick={compareAudio} 
                disabled={isProcessing}
              >
                Compare Original vs Processed
              </button>
              {comparison && (
                <div className="comparison-results">
                  <h4>Comparison Results</h4>
                  <p>RMS Change: {comparison.rms_change_db.toFixed(2)} dB</p>
                  <p>Peak Change: {comparison.peak_change_db.toFixed(2)} dB</p>
                  <p>Dynamic Range (Original): {comparison.dynamic_range_original.toFixed(2)} dB</p>
                  <p>Dynamic Range (Processed): {comparison.dynamic_range_processed.toFixed(2)} dB</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="analysis-content">
          <button 
            className="glass-button rounded-lg px-4 py-2 text-white/80 hover:text-white transition-all duration-300 bg-white/10 hover:bg-white/20"
            onClick={analyzeAudio} 
            disabled={isProcessing}
          >
            {isProcessing ? 'Analyzing...' : 'Analyze Audio'}
          </button>

          {analysis && (
            <div className="analysis-results">
              <div className="analysis-card">
                <h4>Basic Info</h4>
                <p>Duration: {analysis.duration.toFixed(2)}s</p>
                <p>Sample Rate: {analysis.sample_rate} Hz</p>
                <p>Channels: {analysis.channels}</p>
              </div>

              <div className="analysis-card">
                <h4>Musical Properties</h4>
                <p>Tempo: {analysis.tempo.toFixed(1)} BPM</p>
                <p>Key: {analysis.key} (confidence: {(analysis.key_confidence * 100).toFixed(1)}%)</p>
                <p>Beats Detected: {analysis.beats.length}</p>
              </div>

              <div className="analysis-card">
                <h4>Audio Characteristics</h4>
                <p>RMS Energy: {analysis.rms_mean.toFixed(4)}</p>
                <p>Spectral Centroid: {analysis.spectral_centroid_mean.toFixed(0)} Hz</p>
                <p>Zero Crossing Rate: {analysis.zero_crossing_rate.toFixed(4)}</p>
              </div>

              <div className="analysis-card">
                <h4>Dominant Frequencies</h4>
                {analysis.dominant_frequencies.slice(0, 5).map((freq, idx) => (
                  <p key={idx}>{freq.frequency.toFixed(1)} Hz</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="export-content">
          <h3>Export Settings</h3>
          
          <div className="format-selection">
            <h4>Formats</h4>
            {['mp3', 'wav', 'flac', 'ogg'].map(format => (
              <label key={format}>
                <input
                  type="checkbox"
                  checked={exportFormats.includes(format)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportFormats([...exportFormats, format]);
                    } else {
                      setExportFormats(exportFormats.filter(f => f !== format));
                    }
                  }}
                />
                {format.toUpperCase()}
              </label>
            ))}
          </div>

          <div className="quality-settings">
            <h4>Quality</h4>
            <label>
              Bitrate:
              <select 
                value={exportQuality.bitrate}
                onChange={(e) => setExportQuality({...exportQuality, bitrate: e.target.value})}
              >
                <option value="128k">128 kbps</option>
                <option value="192k">192 kbps</option>
                <option value="256k">256 kbps</option>
                <option value="320k">320 kbps</option>
              </select>
            </label>
            <label>
              Sample Rate:
              <select 
                value={exportQuality.sample_rate}
                onChange={(e) => setExportQuality({...exportQuality, sample_rate: parseInt(e.target.value)})}
              >
                <option value="32000">32 kHz</option>
                <option value="44100">44.1 kHz</option>
                <option value="48000">48 kHz</option>
              </select>
            </label>
          </div>

          <button 
            className="glass-button rounded-lg px-4 py-2 text-white/80 hover:text-white transition-all duration-300 w-full"
            onClick={exportAudio}
            disabled={isProcessing || exportFormats.length === 0}
          >
            {isProcessing ? 'Exporting...' : 'Export Audio'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioEffectsPanel;
