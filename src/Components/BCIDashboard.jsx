import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Play, Pause, Settings, Brain, Activity, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

const BCIDashboard = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [neuralData, setNeuralData] = useState([]);
  const [brainwaves, setBrainwaves] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
    theta: 0,
    delta: 0
  });
  const [metrics, setMetrics] = useState({
    signalStrength: 85,
    noiseLevel: 12,
    accuracy: 94.2,
    latency: 23
  });

  const eegRef = useRef();
  const brainwaveRef = useRef();
  const topographyRef = useRef();
  //const timeSeriesRef = useRef();

  // Simulation des données WebSocket
  useEffect(() => {
    let interval;
    if (isRecording) {
      setConnectionStatus('connected');
      interval = setInterval(() => {
        // Génération de données EEG simulées
        const timestamp = Date.now();
        const channels = ['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2', 'F7', 'F8', 'T3', 'T4', 'T5', 'T6'];
        
        const newData = channels.map(channel => ({
          channel,
          timestamp,
          value: Math.sin(timestamp / 1000 + Math.random()) * 50 + Math.random() * 20 - 10,
          frequency: Math.random() * 40 + 1
        }));

        setNeuralData(prevData => {
          const updated = [...prevData, ...newData];
          return updated.slice(-1000); // Garder seulement les 1000 derniers points
        });

        // Mise à jour des ondes cérébrales
        setBrainwaves({
          alpha: Math.random() * 30 + 20,
          beta: Math.random() * 25 + 15,
          gamma: Math.random() * 20 + 10,
          theta: Math.random() * 35 + 25,
          delta: Math.random() * 40 + 30
        });

        // Mise à jour des métriques
        setMetrics({
          signalStrength: Math.random() * 20 + 75,
          noiseLevel: Math.random() * 15 + 5,
          accuracy: Math.random() * 10 + 85,
          latency: Math.random() * 20 + 15
        });
      }, 100);
    } else {
      setConnectionStatus('disconnected');
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  // Graphique EEG en temps réel
  useEffect(() => {
    if (!neuralData.length || !eegRef.current) return;

    const svg = d3.select(eegRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.bottom - margin.top;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Données des 8 derniers canaux pour l'affichage
    const recentData = neuralData.slice(-800);
    const channels = ['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4'];
    
    const xScale = d3.scaleLinear()
      .domain(d3.extent(recentData, d => d.timestamp))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([-100, 100])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Ligne pour chaque canal
    const line = d3.line()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
      .curve(d3.curveCardinal);

    channels.forEach((channel, i) => {
      const channelData = recentData.filter(d => d.channel === channel);
      if (channelData.length > 1) {
        g.append("path")
          .datum(channelData)
          .attr("fill", "none")
          .attr("stroke", colorScale(i))
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.8)
          .attr("d", line);
      }
    });

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d => new Date(d).toLocaleTimeString()));

    g.append("g")
      .call(d3.axisLeft(yScale));

  }, [neuralData]);

  // Graphique des ondes cérébrales
  useEffect(() => {
    if (!brainwaveRef.current) return;

    const svg = d3.select(brainwaveRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const width = 400 - margin.left - margin.right;
    const height = 250 - margin.bottom - margin.top;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const data = Object.entries(brainwaves).map(([key, value]) => ({ wave: key, power: value }));

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.wave))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.power)])
      .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
      .domain(['alpha', 'beta', 'gamma', 'theta', 'delta'])
      .range(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']);

    // Barres
    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.wave))
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d.power))
      .attr("height", d => height - yScale(d.power))
      .attr("fill", d => colorScale(d.wave))
      .attr("opacity", 0.8);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    g.append("g")
      .call(d3.axisLeft(yScale));

  }, [brainwaves]);

  // Topographie cérébrale
  useEffect(() => {
    if (!topographyRef.current) return;

    const svg = d3.select(topographyRef.current);
    svg.selectAll("*").remove();

    const width = 300;
    const height = 300;
    const radius = 120;

    const g = svg.append("g")
      .attr("transform", `translate(${width/2},${height/2})`);

    // Positions des électrodes (système 10-20)
    const electrodes = [
      { name: 'Fp1', x: -40, y: -100, value: Math.random() * 100 - 50 },
      { name: 'Fp2', x: 40, y: -100, value: Math.random() * 100 - 50 },
      { name: 'F3', x: -60, y: -60, value: Math.random() * 100 - 50 },
      { name: 'F4', x: 60, y: -60, value: Math.random() * 100 - 50 },
      { name: 'C3', x: -80, y: 0, value: Math.random() * 100 - 50 },
      { name: 'C4', x: 80, y: 0, value: Math.random() * 100 - 50 },
      { name: 'P3', x: -60, y: 60, value: Math.random() * 100 - 50 },
      { name: 'P4', x: 60, y: 60, value: Math.random() * 100 - 50 },
      { name: 'O1', x: -30, y: 100, value: Math.random() * 100 - 50 },
      { name: 'O2', x: 30, y: 100, value: Math.random() * 100 - 50 }
    ];

    // Cercle de tête
    g.append("circle")
      .attr("r", radius)
      .attr("fill", "none")
      .attr("stroke", "#666")
      .attr("stroke-width", 2);

    // Électrodes
    const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
      .domain([-50, 50]);

    g.selectAll(".electrode")
      .data(electrodes)
      .enter().append("circle")
      .attr("class", "electrode")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 12)
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "#333")
      .attr("stroke-width", 1);

    // Labels des électrodes
    g.selectAll(".electrode-label")
      .data(electrodes)
      .enter().append("text")
      .attr("class", "electrode-label")
      .attr("x", d => d.x)
      .attr("y", d => d.y + 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .text(d => d.name);

  }, [isRecording]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Brain className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Brain-Computer Interface Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              connectionStatus === 'connected' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              {connectionStatus === 'connected' ? 'Connecté' : 'Déconnecté'}
            </div>
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRecording ? 'Arrêter' : 'Démarrer'}
            </button>
          </div>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Force du Signal</p>
                <p className="text-xl font-bold text-green-400">{metrics.signalStrength.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Niveau de Bruit</p>
                <p className="text-xl font-bold text-yellow-400">{metrics.noiseLevel.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Précision</p>
                <p className="text-xl font-bold text-blue-400">{metrics.accuracy.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              <div>
                <p className="text-sm text-gray-400">Latence</p>
                <p className="text-xl font-bold text-orange-400">{metrics.latency.toFixed(0)}ms</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Signal EEG en temps réel */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-400">Signal EEG en Temps Réel</h3>
          <svg ref={eegRef} width="600" height="300" className="w-full"></svg>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Fp1', 'Fp2', 'F3', 'F4', 'C3', 'C4', 'P3', 'P4'].map((channel, i) => (
              <div key={channel} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: d3.schemeCategory10[i] }}
                ></div>
                <span className="text-sm text-gray-300">{channel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ondes cérébrales */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-purple-400">Analyse des Ondes Cérébrales</h3>
          <svg ref={brainwaveRef} width="400" height="250" className="w-full"></svg>
          <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
            {Object.entries(brainwaves).map(([wave, power]) => (
              <div key={wave} className="text-center">
                <div className="font-semibold capitalize text-gray-300">{wave}</div>
                <div className="text-gray-400">{power.toFixed(1)} µV²</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visualisation topographique et données temps réel */}
      <div className="grid grid-cols-3 gap-6">
        {/* Topographie cérébrale */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-400">Topographie Cérébrale</h3>
          <svg ref={topographyRef} width="300" height="300" className="w-full"></svg>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Carte d'activité en temps réel (µV)
          </p>
        </div>

        {/* Données en temps réel */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-cyan-400">Données en Temps Réel</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {neuralData.slice(-8).reverse().map((data, i) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
                <span className="text-cyan-300 font-mono">{data.channel}</span>
                <span className="text-gray-300">{data.value.toFixed(2)} µV</span>
                <span className="text-gray-500 text-xs">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contrôles et paramètres */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-orange-400">Contrôles</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Fréquence d'échantillonnage</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white">
                <option>250 Hz</option>
                <option>500 Hz</option>
                <option>1000 Hz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Filtre passe-bas</label>
              <input 
                type="range" 
                min="30" 
                max="100" 
                defaultValue="70"
                className="w-full"
              />
              <span className="text-xs text-gray-500">70 Hz</span>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Filtre passe-haut</label>
              <input 
                type="range" 
                min="0.1" 
                max="5" 
                step="0.1"
                defaultValue="1"
                className="w-full"
              />
              <span className="text-xs text-gray-500">1.0 Hz</span>
            </div>
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Settings className="w-4 h-4" />
              Paramètres Avancés
            </button>
          </div>
        </div>
      </div>

      {/* Statut du système */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Système:</span>
            <span className="text-green-400 font-mono text-sm">BCI-Dashboard v2.1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Échantillons reçus:</span>
            <span className="text-blue-400 font-mono text-sm">{neuralData.length.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Uptime:</span>
            <span className="text-purple-400 font-mono text-sm">
              {isRecording ? '00:00:45' : '00:00:00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BCIDashboard;