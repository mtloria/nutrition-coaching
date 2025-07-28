// charts.js - Render charts for all data fields from the Google Sheet

// Utility to create a chart for a given field

// Use the same SHEET_ID as in sheets.js
const SHEET_ID = '15KA7rfRHXcVO0TTGlmQnkKeF1p9pCIm1yTVFdsORGt8';
function createChart(ctx, label, labels, data) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: false }
      },
      scales: {
        x: { display: true },
        y: { display: true }
      }
    }
  });
}

// Fetch all data and render charts for each field

document.addEventListener('DOMContentLoaded', () => {
  // Tab elements
  const tabWeighIn = document.getElementById('tab-weighin');
  const tabMeasurements = document.getElementById('tab-measurements');
  const weighInContainer = document.getElementById('charts-container');
  const measurementsContainer = document.getElementById('measurements-container');
  const exerciseTableContainer = document.getElementById('exercise-table-container');

  // Tab switching logic
  tabWeighIn.addEventListener('click', () => {
    tabWeighIn.classList.add('active');
    tabMeasurements.classList.remove('active');
    weighInContainer.style.display = '';
    measurementsContainer.style.display = 'none';
    if (exerciseTableContainer) exerciseTableContainer.style.display = '';
    // Only render if not already rendered
    if (!weighInContainer.dataset.rendered) {
      renderWeighInCharts();
    }
  });
  tabMeasurements.addEventListener('click', () => {
    tabMeasurements.classList.add('active');
    tabWeighIn.classList.remove('active');
    weighInContainer.style.display = 'none';
    measurementsContainer.style.display = '';
    if (exerciseTableContainer) exerciseTableContainer.style.display = 'none';
    if (!measurementsContainer.dataset.rendered) {
      renderMeasurementsCharts();
    }
  });

  // Render default tab
  renderWeighInCharts();
  weighInContainer.style.display = '';
  measurementsContainer.style.display = 'none';
  if (exerciseTableContainer) exerciseTableContainer.style.display = '';
});

async function renderWeighInCharts() {
  const container = document.getElementById('charts-container');
  container.innerHTML = '<div style="text-align:center;padding:2em;">Loading charts...</div>';
  try {
    const API_KEY = 'AIzaSyDKOPA9Lend06jeTojYcM2vKNDPKNzBmt8';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Weigh-In!A1:Z?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const rows = data.values;
    if (!rows || rows.length < 2) {
      container.innerHTML = '<div style="text-align:center;padding:2em;color:#888;">No data found in the sheet.</div>';
      return;
    }
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const columns = headers.map((_, i) => dataRows.map(row => row[i] || null));
    const xLabels = columns[0];
    const chartFields = [
      'Weight', 'Sleep', 'Energy Level', 'Calories', 'Protein', 'Carbs', 'Fat', 'Steps'
    ];
    const headerIndex = {};
    headers.forEach((h, i) => { headerIndex[h.trim()] = i; });
    container.innerHTML = '';
    chartFields.forEach(field => {
      if (headerIndex[field] !== undefined) {
        const i = headerIndex[field];
        const chartDiv = document.createElement('div');
        chartDiv.style.marginBottom = '40px';
        const h2 = document.createElement('h2');
        h2.innerText = field;
        const canvas = document.createElement('canvas');
        chartDiv.appendChild(h2);
        chartDiv.appendChild(canvas);
        container.appendChild(chartDiv);
        createChart(canvas.getContext('2d'), field, xLabels, columns[i]);
      }
    });
    // Exercise table logic (same as before)
    if (headerIndex['Exercise'] !== undefined && headerIndex['Duration'] !== undefined) {
      const exerciseIdx = headerIndex['Exercise'];
      const durationIdx = headerIndex['Duration'];
      let dateIdx = 0;
      for (const [h, i] of Object.entries(headerIndex)) {
        if (h.trim().toLowerCase() === 'date') { dateIdx = i; break; }
      }
      const tbody = document.querySelector('#exercise-table tbody');
      tbody.innerHTML = '';
      let hasRows = false;
      dataRows.forEach(row => {
        const date = row[dateIdx] || '';
        const exercise = row[exerciseIdx] || '';
        const duration = row[durationIdx] || '';
        if (exercise || duration) {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${date}</td><td>${exercise}</td><td>${duration}</td>`;
          tbody.appendChild(tr);
          hasRows = true;
        }
      });
      if (!hasRows) {
        tbody.innerHTML = `<tr><td colspan=\"3\" style=\"text-align:center;color:#888;padding:12px;\">No exercise entries found.</td></tr>`;
      }
    } else {
      const tbody = document.querySelector('#exercise-table tbody');
      if (tbody) tbody.innerHTML = '';
    }
    container.dataset.rendered = '1';
  } catch (err) {
    console.error('Error loading charts:', err);
    container.innerHTML = '<div style="color:red;text-align:center;padding:2em;">Error loading charts. Check console for details.<br>' + (err && err.message ? err.message : '') + '</div>';
  }
}

async function renderMeasurementsCharts() {
  const container = document.getElementById('measurements-container');
  container.innerHTML = '<div style="text-align:center;padding:2em;">Loading measurements charts...</div>';
  try {
    const API_KEY = 'AIzaSyDKOPA9Lend06jeTojYcM2vKNDPKNzBmt8';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Measurements!A1:Z?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    const rows = data.values;
    if (!rows || rows.length < 2) {
      container.innerHTML = '<div style="text-align:center;padding:2em;color:#888;">No measurements data found in the sheet.</div>';
      return;
    }
    const headers = rows[0];
    const dataRows = rows.slice(1);
    const columns = headers.map((_, i) => dataRows.map(row => row[i] || null));
    const xLabels = columns[0];
    const chartFields = ['Waist', 'Chest', 'Arms'];
    const headerIndex = {};
    headers.forEach((h, i) => { headerIndex[h.trim()] = i; });
    container.innerHTML = '';
    chartFields.forEach(field => {
      if (headerIndex[field] !== undefined) {
        const i = headerIndex[field];
        const chartDiv = document.createElement('div');
        chartDiv.style.marginBottom = '40px';
        const h2 = document.createElement('h2');
        h2.innerText = field;
        const canvas = document.createElement('canvas');
        chartDiv.appendChild(h2);
        chartDiv.appendChild(canvas);
        container.appendChild(chartDiv);
        createChart(canvas.getContext('2d'), field, xLabels, columns[i]);
      }
    });
    container.dataset.rendered = '1';
  } catch (err) {
    console.error('Error loading measurements charts:', err);
    container.innerHTML = '<div style="color:red;text-align:center;padding:2em;">Error loading measurements charts. Check console for details.<br>' + (err && err.message ? err.message : '') + '</div>';
  }
}
