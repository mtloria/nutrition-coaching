
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Chart, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './styles.css';
import './virtual-table.css';
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

// Virtual scrolling table component
function VirtualTable({ data }) {
  const containerRef = useRef();
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  
  const BASE_ITEM_HEIGHT = 50; // Minimum height of each table row
  const VISIBLE_BUFFER = 3; // Extra items to render for smooth scrolling
  
  // Sort data to show most recent first
  const sortedData = useMemo(() => {
    return [...data].reverse();
  }, [data]);
  
  // Calculate dynamic heights for each row based on notes content
  const rowHeights = useMemo(() => {
    return sortedData.map(row => {
      const notes = row['Daily Notes'] || '';
      const notesLength = notes.length;
      
      if (notesLength === 0) return BASE_ITEM_HEIGHT;
      
      // Rough estimate: ~50 chars per line, with padding
      const estimatedLines = Math.max(1, Math.ceil(notesLength / 50));
      return Math.max(BASE_ITEM_HEIGHT, BASE_ITEM_HEIGHT + (estimatedLines - 1) * 20);
    });
  }, [sortedData]);
  
  // Calculate cumulative heights for positioning
  const cumulativeHeights = useMemo(() => {
    const heights = [0];
    for (let i = 0; i < rowHeights.length; i++) {
      heights.push(heights[i] + rowHeights[i]);
    }
    return heights;
  }, [rowHeights]);
  
  // Calculate which items to render based on cumulative heights
  const visibleRange = useMemo(() => {
    let startIndex = 0;
    let endIndex = sortedData.length;
    
    // Find start index
    for (let i = 0; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i + 1] > scrollTop) {
        startIndex = Math.max(0, i - VISIBLE_BUFFER);
        break;
      }
    }
    
    // Find end index
    const visibleBottom = scrollTop + containerHeight;
    for (let i = startIndex; i < cumulativeHeights.length - 1; i++) {
      if (cumulativeHeights[i] > visibleBottom) {
        endIndex = Math.min(sortedData.length, i + VISIBLE_BUFFER);
        break;
      }
    }
    
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, cumulativeHeights, sortedData.length]);
  
  const visibleItems = sortedData.slice(visibleRange.startIndex, visibleRange.endIndex);
  
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };
  
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  
  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1] || 0;
  const offsetY = visibleRange.startIndex < cumulativeHeights.length 
    ? cumulativeHeights[visibleRange.startIndex] 
    : 0;
  
  return (
    <div className="virtual-table-container" ref={containerRef} onScroll={handleScroll}>
      <table>
        <colgroup>
          <col style={{ width: '15%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '50%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Date</th>
            <th>Exercise</th>
            <th>Duration</th>
            <th>Notes</th>
          </tr>
        </thead>
      </table>
      <div className="virtual-table-body" style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          <table>
            <colgroup>
              <col style={{ width: '15%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '50%' }} />
            </colgroup>
            <tbody>
              {visibleItems.map((row, index) => {
                const actualIndex = visibleRange.startIndex + index;
                const height = rowHeights[actualIndex] || BASE_ITEM_HEIGHT;
                return (
                  <tr key={actualIndex} style={{ height: height }}>
                    <td>{row['Date']}</td>
                    <td>{row['Exercise']}</td>
                    <td>{row['Exercise Duration (minutes)']}</td>
                    <td className="notes-cell">{row['Daily Notes']}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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
  const situationByDate = {};
  data.forEach(row => {
    const val = row['Did any of these situations affect your eating yesterday?'];
    const date = row['Date'];
    if (val) {
      val.split(',').map(opt => opt.trim()).forEach(opt => {
        if (opt) {
          situationCounts[opt] = (situationCounts[opt] || 0) + 1;
          // Track by date for timeline
          if (!situationByDate[date]) situationByDate[date] = [];
          situationByDate[date].push(opt);
        }
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

  // Helper function to calculate optimal tick spacing
  const calculateTickSpacing = (dataLength, chartWidth = 300) => {
    const maxLabels = Math.floor(chartWidth / 60); // ~60px per label minimum
    return Math.max(1, Math.ceil(dataLength / maxLabels));
  };

  const tickSpacing = calculateTickSpacing(labels.length);

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
                maintainAspectRatio: false,
                layout: {
                  padding: {
                    bottom: 25 // Increased padding for mobile label space
                  }
                },
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      title: function(context) {
                        return labels[context[0].dataIndex];
                      }
                    }
                  }
                },
                scales: { 
                  x: { 
                    display: true,
                    ticks: {
                      maxRotation: 45, // Consistent rotation
                      minRotation: 30, // Minimum rotation to prevent overlap
                      autoSkip: true,
                      maxTicksLimit: 4, // Fewer labels for mobile
                      font: {
                        size: 9 // Smaller font for mobile
                      }
                    }
                  }, 
                  y: { 
                    display: true,
                    ticks: {
                      font: {
                        size: 9 // Smaller font for mobile
                      }
                    }
                  } 
                }
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
        <div className="chart-card" style={{ minWidth: 320, flex: 1, cursor: 'pointer' }} onClick={() => setModalChart({
          cfg: {
            label: 'Situations Timeline - When They Occur',
            type: 'timeline',
            situationByDate,
            allLabels: labels
          },
          labels
        })}>
          <h2>Situations Timeline</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(12px, 1fr))', 
            gap: '1px', 
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            height: '200px',
            overflowY: 'auto'
          }}>
            {labels.map((date) => {
              const dayData = situationByDate[date] || [];
              const intensity = dayData.length;
              return (
                <div
                  key={date}
                  title={`${date}: ${dayData.join(', ') || 'No situations'}`}
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: intensity === 0 ? '#e9ecef' : 
                      intensity === 1 ? '#a8dadc' :
                      intensity === 2 ? '#457b9d' :
                      intensity === 3 ? '#1d3557' : '#0d1b2a',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                />
              );
            })}
          </div>
          <p style={{ fontSize: '11px', color: '#666', marginTop: '8px', textAlign: 'center' }}>
            Each square = 1 day. Darker = more situations. Click for details.
          </p>
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
            ) : modalChart.cfg.type === 'timeline' ? (
              <div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(20px, 1fr))', 
                  gap: '3px', 
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  margin: '20px 0'
                }}>
                  {modalChart.cfg.allLabels.map((date) => {
                    const dayData = modalChart.cfg.situationByDate[date] || [];
                    const intensity = dayData.length;
                    return (
                      <div
                        key={date}
                        title={`${date}: ${dayData.join(', ') || 'No situations'}`}
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: intensity === 0 ? '#e9ecef' : 
                            intensity === 1 ? '#a8dadc' :
                            intensity === 2 ? '#457b9d' :
                            intensity === 3 ? '#1d3557' : '#0d1b2a',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          border: intensity > 0 ? '1px solid #666' : 'none'
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                  <p><strong>Timeline Legend:</strong></p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '15px', height: '15px', backgroundColor: '#e9ecef', borderRadius: '2px' }}></div>
                      <span>No situations</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '15px', height: '15px', backgroundColor: '#a8dadc', borderRadius: '2px' }}></div>
                      <span>1 situation</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '15px', height: '15px', backgroundColor: '#457b9d', borderRadius: '2px' }}></div>
                      <span>2 situations</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '15px', height: '15px', backgroundColor: '#1d3557', borderRadius: '2px' }}></div>
                      <span>3+ situations</span>
                    </div>
                  </div>
                  <p style={{ marginTop: '15px', fontSize: '12px' }}>
                    Hover over squares to see specific situations for each day
                  </p>
                </div>
              </div>
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
                  maintainAspectRatio: false,
                  layout: {
                    padding: {
                      bottom: 20 // Extra padding for rotated labels
                    }
                  },
                  plugins: { 
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        title: function(context) {
                          return modalChart.labels[context[0].dataIndex];
                        }
                      }
                    }
                  },
                  scales: { 
                    x: { 
                      display: true,
                      ticks: {
                        maxRotation: 45,
                        minRotation: 30,
                        autoSkip: true,
                        maxTicksLimit: window.innerWidth < 700 ? 8 : 12, // Responsive label limit
                        font: {
                          size: window.innerWidth < 700 ? 10 : 11 // Responsive font size
                        }
                      }
                    }, 
                    y: { 
                      display: true,
                      ticks: {
                        font: {
                          size: window.innerWidth < 700 ? 10 : 11 // Responsive font size
                        }
                      }
                    } 
                  }
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
        <VirtualTable data={data} />
      </div>

      {/* Situation summary chart moved above, now removed from here */}
    </div>
  );
}

export default Dashboard;
