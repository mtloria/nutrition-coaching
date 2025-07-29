
import React, { useEffect, useState } from 'react';
import { Chart, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './styles.css';
import Papa from 'papaparse';

const SHEET_ID = '15KA7rfRHXcVO0TTGlmQnkKeF1p9pCIm1yTVFdsORGt8';
const SHEET_NAME = 'Form Responses';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

const HEADERS = [
  'Timestamp', 'Date', 'Morning Weight', 'Sleep Hours', 'Energy Level', 'Step Count',
  'Total Calories', 'Protein (grams)', 'Carbohydrates (grams)', 'Fat (grams)',
  'Exercise', 'Exercise Duration (minutes)',
  'Did any of these situations affect your eating yesterday?', 'Daily Notes'
];


function parseCSV(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (result.errors.length) {
    // eslint-disable-next-line no-console
    console.error('PapaParse errors:', result.errors);
  }
  if (result.data.length > 0) {
    // eslint-disable-next-line no-console
    console.log('CSV headers:', Object.keys(result.data[0]));
    console.log('Sample row:', result.data[0]);
  }
  return result.data;
}


function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalChart, setModalChart] = useState(null); // {cfg, labels} or null

  useEffect(() => {
    fetch(CSV_URL)
      .then(r => r.text())
      .then(text => setData(parseCSV(text)))
      .catch(e => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!data.length) return <div className="error">No data found.</div>;

  // Prepare chart data
  const labels = data.map(row => row['Date']);
  const chartConfigs = [
    {
      label: 'Morning Weight',
      data: data.map(row => parseFloat(row['Morning Weight']) || null),
      color: 'rgba(75,192,192,1)'
    },
    {
      label: 'Sleep Hours',
      data: data.map(row => parseFloat(row['Sleep Hours']) || null),
      color: 'rgba(153,102,255,1)'
    },
    {
      label: 'Energy Level',
      data: data.map(row => parseFloat(row['Energy Level']) || null),
      color: 'rgba(255,159,64,1)'
    },
    {
      label: 'Step Count',
      data: data.map(row => parseInt(row['Step Count']) || null),
      color: 'rgba(255,205,86,1)'
    },
    {
      label: 'Total Calories',
      data: data.map(row => parseInt(row['Total Calories']) || null),
      color: 'rgba(255,99,132,1)'
    },
    {
      label: 'Protein (grams)',
      data: data.map(row => parseInt(row['Protein (grams)']) || null),
      color: 'rgba(54,162,235,1)'
    },
    {
      label: 'Carbohydrates (grams)',
      data: data.map(row => parseInt(row['Carbohydrates (grams)']) || null),
      color: 'rgba(255,206,86,1)'
    },
    {
      label: 'Fat (grams)',
      data: data.map(row => parseInt(row['Fat (grams)']) || null),
      color: 'rgba(75,192,192,0.7)'
    }
  ];

  // Count occurrences for "Did any of these situations affect your eating yesterday?"
  const situationCounts = {};
  data.forEach(row => {
    const val = row['Did any of these situations affect your eating yesterday?'];
    if (val) {
      val.split(',').map(opt => opt.trim()).forEach(opt => {
        if (opt) situationCounts[opt] = (situationCounts[opt] || 0) + 1;
      });
    }
  });

  const handleChartClick = (cfg) => {
    setModalChart({ cfg, labels });
  };
  const closeModal = (e) => {
    if (e.target.classList.contains('custom-modal-overlay') || e.target.classList.contains('custom-modal-btn')) {
      setModalChart(null);
    }
  };

  return (
    <div className="dashboard">
      <h1>Nutrition Dashboard</h1>
      <div className="charts">
        {chartConfigs.map(cfg => (
          <div className="chart-card" key={cfg.label} onClick={() => handleChartClick(cfg)} style={{ cursor: 'pointer' }}>
            <h2>{cfg.label}</h2>
            <Line
              data={{
                labels,
                datasets: [{
                  label: cfg.label,
                  data: cfg.data,
                  borderColor: cfg.color,
                  backgroundColor: cfg.color.replace('1)', '0.2)'),
                  fill: true,
                  tension: 0.2
                }]
              }}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { display: true }, y: { display: true } }
              }}
            />
          </div>
        ))}
        <div className="chart-card" style={{ minWidth: 320, flex: 1, cursor: 'pointer' }} onClick={() => setModalChart({
          cfg: {
            label: 'Situations Affecting Eating (Count)',
            type: 'bar',
            data: Object.values(situationCounts),
            labels: Object.keys(situationCounts),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)'
          },
          labels: Object.keys(situationCounts)
        })}>
          <h2>Situations Affecting Eating (Count)</h2>
          <Chart
            type="bar"
            data={{
              labels: Object.keys(situationCounts),
              datasets: [{
                label: 'Count',
                data: Object.values(situationCounts),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
              }]
            }}
            options={{
              indexAxis: 'x',
              plugins: { legend: { display: false } },
              scales: {
                x: { title: { display: true, text: 'Situation' }, ticks: { autoSkip: false, maxRotation: 60, minRotation: 30 } },
                y: {
                  beginAtZero: true,
                  title: { display: true, text: 'Count' },
                  ticks: {
                    stepSize: 1,
                    precision: 0,
                    callback: function(value) {
                      return Number.isInteger(value) ? value : null;
                    }
                  }
                }
              }
            }}
            height={Math.max(220, Object.keys(situationCounts).length * 24)}
          />
        </div>
      </div>

      {modalChart && (
        <div className="custom-modal-overlay" onClick={closeModal}>
          <div className="custom-modal" style={{ maxWidth: 900, width: '95vw' }}>
            <h2>{modalChart.cfg.label}</h2>
            {modalChart.cfg.type === 'bar' ? (
              <Chart
                type="bar"
                data={{
                  labels: modalChart.cfg.labels,
                  datasets: [{
                    label: 'Count',
                    data: modalChart.cfg.data,
                    backgroundColor: modalChart.cfg.backgroundColor,
                    borderColor: modalChart.cfg.borderColor,
                    borderWidth: 1,
                  }]
                }}
                options={{
                  indexAxis: 'x',
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { title: { display: true, text: 'Situation' }, ticks: { autoSkip: false, maxRotation: 60, minRotation: 30 } },
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Count' },
                      ticks: {
                        stepSize: 1,
                        precision: 0,
                        callback: function(value) {
                          return Number.isInteger(value) ? value : null;
                        }
                      }
                    }
                  }
                }}
                height={Math.max(420, (modalChart.cfg.labels?.length || 0) * 32)}
              />
            ) : (
              <Line
                data={{
                  labels: modalChart.labels,
                  datasets: [{
                    label: modalChart.cfg.label,
                    data: modalChart.cfg.data,
                    borderColor: modalChart.cfg.color,
                    backgroundColor: modalChart.cfg.color.replace('1)', '0.18)'),
                    fill: true,
                    tension: 0.2
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { x: { display: true }, y: { display: true } }
                }}
                height={420}
              />
            )}
            <button className="custom-modal-btn" onClick={closeModal} style={{ marginTop: 24 }}>Close</button>
          </div>
        </div>
      )}

      <div className="notes-table">
        <h2>Daily Notes</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Exercise</th>
              <th>Duration (min)</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td>{row['Date']}</td>
                <td>{row['Exercise']}</td>
                <td>{row['Exercise Duration (minutes)']}</td>
                <td>{row['Daily Notes']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Situation summary chart moved above, now removed from here */}
    </div>
  );
}

export default Dashboard;
