import React, { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];
const CITIES = [
  { name: "Delhi", lat: 28.6139, lon: 77.2090 },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
];

export default function App() {
  const [city, setCity] = useState(CITIES[0]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchWeather(city); }, [city]);

  async function fetchWeather(c) {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=temperature_2m,relative_humidity_2m,windspeed_10m&forecast_days=1&timezone=auto`;
      const res = await fetch(url);
      const json = await res.json();
      const H = json.hourly;
      const rows = H.time.map((t, i) => ({
        time: new Date(t).getHours() + ":00",
        temp: H.temperature_2m[i],
        humidity: H.relative_humidity_2m[i],
        wind: H.windspeed_10m[i],
      }));
      setWeather({ data: rows });
    } catch (e) {
      console.error(e);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }

  const KPIs = (() => {
    if (!weather?.data?.length) return {};
    const temps = weather.data.map(d => d.temp);
    const avgHum = weather.data.reduce((a,b)=>a+b.humidity,0)/weather.data.length;
    return {
      current: temps[0].toFixed(1),
      min: Math.min(...temps).toFixed(1),
      max: Math.max(...temps).toFixed(1),
      avgHumidity: avgHum.toFixed(1),
    };
  })();

  const pieData = [
    { name: "Cold (<20°C)", value: weather?.data.filter(d=>d.temp<20).length || 0 },
    { name: "Moderate (20–30°C)", value: weather?.data.filter(d=>d.temp>=20 && d.temp<=30).length || 0 },
    { name: "Hot (>30°C)", value: weather?.data.filter(d=>d.temp>30).length || 0 },
  ];

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">Weather Dashboard</h1>
        <div className="controls">
          <select
            value={city.name}
            onChange={(e)=>setCity(CITIES.find(c=>c.name===e.target.value))}
          >
            {CITIES.map(c => <option key={c.name}>{c.name}</option>)}
          </select>
          <button onClick={()=>fetchWeather(city)} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {!weather ? (
        <div className="empty">Pick a city to load data.</div>
      ) : (
        <main className="grid">
          {/* KPI cards */}
          <section className="kpis">
            <KpiCard label="Current (°C)" value={KPIs.current} color="#3b82f6" />
            <KpiCard label="Min (°C)"     value={KPIs.min}     color="#22c55e" />
            <KpiCard label="Max (°C)"     value={KPIs.max}     color="#f59e0b" />
            <KpiCard label="Avg Humidity (%)" value={KPIs.avgHumidity} color="#14b8a6" />
          </section>

          {/* Line chart */}
          <section className="card card-span2">
            <div className="card-title">Temperature Variation</div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weather.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" interval={2}/>
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="temp" stroke="#3b82f6" strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Bar chart */}
          <section className="card">
            <div className="card-title">Wind Speed (km/h)</div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weather.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" interval={2}/>
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="wind" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Pie chart */}
          <section className="card">
            <div className="card-title">Temperature Distribution</div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={75} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </main>
      )}

      <footer className="footer">
        Yum India
      </footer>
    </div>
  );
}

function KpiCard({ label, value, color }) {
  return (
    <div className="kpi" style={{ background: color }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value ?? "-"}</div>
    </div>
  );
}
