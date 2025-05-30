import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Papa from 'papaparse';

const AirQualityAnalysis = () => {
  const [data, setData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedPollutant, setSelectedPollutant] = useState('PM25');
  const [analysis, setAnalysis] = useState({});
  const [loading, setLoading] = useState(true);

  const pollutantConfig = {
    PM25: { name: 'PM 2.5', color: '#8884d8', unit: 'µg/m³' },
    NO2: { name: 'NO₂', color: '#82ca9d', unit: 'µg/m³' },
    NO: { name: 'NO', color: '#ffc658', unit: 'µg/m³' },
    NOX: { name: 'NOₓ', color: '#ff7300', unit: 'µg/m³' }
  };

  useEffect(() => {
    fetch('/data.csv')
      .then(res => res.text())
      .then(text => {
        Papa.parse(text, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data;
            const processedData = [];

            for (let i = 6; i < rows.length; i++) {
              const row = rows[i];
              if (row[0] && row[0].includes('2025')) {
                const timestamp = new Date(row[0]);
                const pm25 = parseFloat(row[2]) || null;
                const no2 = parseFloat(row[3]) || null;
                const no = parseFloat(row[4]) || null;
                const nox = parseFloat(row[5]) || null;

                processedData.push({
                  timestamp,
                  date: timestamp.toISOString().split('T')[0],
                  hour: timestamp.getHours(),
                  PM25: pm25,
                  NO2: no2,
                  NO: no,
                  NOX: nox
                });
              }
            }

            setData(processedData);
            analyzeData(processedData);
            generatePredictions(processedData);
            setLoading(false);
          }
        });
      });
  }, []);

  const analyzeData = (data) => {
    const pollutants = ['PM25', 'NO2', 'NO', 'NOX'];
    const analysisResult = {};

    pollutants.forEach(pollutant => {
      const values = data.filter(d => d[pollutant] !== null).map(d => d[pollutant]);

      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);

        const hourlyAvg = {};
        for (let h = 0; h < 24; h++) {
          const hourData = data.filter(d => d.hour === h && d[pollutant] !== null);
          if (hourData.length > 0) {
            hourlyAvg[h] = hourData.reduce((sum, d) => sum + d[pollutant], 0) / hourData.length;
          }
        }

        const xValues = values.map((_, i) => i);
        const n = values.length;
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const trend = slope > 0.01 ? 'Augmentation' : slope < -0.01 ? 'Diminution' : 'Stable';

        analysisResult[pollutant] = {
          mean: mean.toFixed(2),
          max: max.toFixed(2),
          min: min.toFixed(2),
          std: std.toFixed(2),
          trend,
          slope: slope.toFixed(4),
          hourlyAvg
        };
      }
    });

    setAnalysis(analysisResult);
  };

  const generatePredictions = (data) => {
    const lastWeek = data.slice(-168);
    if (lastWeek.length === 0) return;

    const predictions = [];
    const baseDate = new Date(data[data.length - 1].timestamp);

    for (let i = 1; i <= 72; i++) {
      const futureDate = new Date(baseDate.getTime() + i * 60 * 60 * 1000);
      const hour = futureDate.getHours();

      const prediction = {
        timestamp: futureDate,
        hour,
        date: futureDate.toISOString().split('T')[0]
      };

      ['PM25', 'NO2', 'NO', 'NOX'].forEach(pollutant => {
        const hourlyData = lastWeek.filter(d => d.hour === hour && d[pollutant] !== null);
        if (hourlyData.length > 0) {
          const avg = hourlyData.reduce((sum, d) => sum + d[pollutant], 0) / hourlyData.length;
          const std = analysis[pollutant]?.std || 5;
          const variation = (Math.random() - 0.5) * parseFloat(std) * 0.5;
          prediction[pollutant] = Math.max(0, avg + variation);
        }
      });

      predictions.push(prediction);
    }

    setPredictions(predictions);
  };

  const chartData = [...data.slice(-168), ...predictions].map(d => ({
    ...d,
    time: d.timestamp.toLocaleString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit' })
  }));

  const hourlyAverages = Array.from({ length: 24 }, (_, hour) => {
    const result = { hour };
    ['PM25', 'NO2', 'NO', 'NOX'].forEach(p => {
      if (analysis[p]?.hourlyAvg[hour]) {
        result[p] = analysis[p].hourlyAvg[hour];
      }
    });
    return result;
  });

  if (loading) return <div className="container">Chargement des données...</div>;

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Analyse Qualité de l'Air</h1>
        <p className="subtext">
          Données du {data[0]?.date} au {data[data.length - 1]?.date} — Prédictions sur 3 jours
        </p>
      </div>

      <div className="card">
        <div className="button-group">
          {Object.entries(pollutantConfig).map(([key, config]) => (
            <button
              key={key}
              className={`button ${selectedPollutant === key ? 'active' : ''}`}
              onClick={() => setSelectedPollutant(key)}
            >
              {config.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="title">Évolution - {pollutantConfig[selectedPollutant].name}</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedPollutant}
              stroke={pollutantConfig[selectedPollutant].color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="title">Profils Horaires Moyens</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyAverages}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey={selectedPollutant} fill={pollutantConfig[selectedPollutant].color} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AirQualityAnalysis;
