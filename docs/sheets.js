// Fetch and render recent entries from Weigh-In sheet
window.renderRecentEntries = async function() {
  await initGoogleClient();
  if (!accessToken) {
    await signInGoogle();
  }
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Weigh-In!A2:L',
  });
  const rows = response.result.values || [];
  const tbody = document.getElementById('dataTableBody');
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 40px; color: #7f8c8d;">No entries yet. Add your first daily entry above!</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(row => {
    // [date, weight, sleep, energy, calories, protein, carbs, fat, steps, exercise, exercise_duration, notes]
    return `<tr>
      <td>${row[0] || ''}</td>
      <td>${row[1] || ''}</td>
      <td>${row[4] || ''}</td>
      <td>${row[5] || ''}</td>
      <td>${row[6] || ''}</td>
      <td>${row[7] || ''}</td>
      <td>${row[8] || ''}</td>
      <td>${row[9] || ''}</td>
      <td>${row[2] || ''}</td>
      <td>${row[3] || ''}</td>
    </tr>`;
  }).join('');
}

// Fetch and render recent measurements from Measurements sheet
window.renderRecentMeasurements = async function() {
  await initGoogleClient();
  if (!accessToken) {
    await signInGoogle();
  }
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Measurements!A2:D',
  });
  const rows = response.result.values || [];
  const tbody = document.getElementById('measurementTableBody');
  if (!tbody) return;
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #7f8c8d;">No measurements yet. Add your first measurement above!</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(row => {
    // [date, waist, chest, arms]
    return `<tr>
      <td>${row[0] || ''}</td>
      <td>${row[1] || ''}</td>
      <td>${row[2] || ''}</td>
      <td>${row[3] || ''}</td>
    </tr>`;
  }).join('');
}
// Client-side Google Sheets integration for Nutrition Coaching App
// This file provides functions to append daily log entries to a public Google Sheet using OAuth2 (GIS)

// Load Google API client library and GIS
function loadGoogleApiAndGIS() {
  return new Promise((resolve) => {
    let loaded = 0;
    function checkLoaded() { if (++loaded === 2) resolve(); }
    // Load gapi client
    if (window.gapi) checkLoaded();
    else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = checkLoaded;
      document.body.appendChild(script);
    }
    // Load GIS
    if (window.google && window.google.accounts && window.google.accounts.oauth2) checkLoaded();
    else {
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = checkLoaded;
      document.body.appendChild(gisScript);
    }
  });
}

const SHEET_ID = '15KA7rfRHXcVO0TTGlmQnkKeF1p9pCIm1yTVFdsORGt8';
const SHEET_RANGE = 'Weigh-In!A2'; // Change if your sheet/tab name is different
const MEASUREMENTS_SHEET_RANGE = 'Measurements!A2'; // For measurements sheet
// Append measurement to Measurements sheet
window.appendMeasurementToSheet = async function(measurement) {
  await initGoogleClient();
  if (!accessToken) {
    await signInGoogle();
  }
  return window.gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: MEASUREMENTS_SHEET_RANGE,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [[
        measurement.date,
        measurement.waist,
        measurement.chest,
        measurement.arms
      ]]
    }
  });
}
const CLIENT_ID = '94397713029-d2tckr66pvh65vjdhohlv1l5ei730l4d.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDKOPA9Lend06jeTojYcM2vKNDPKNzBmt8';
const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4'
];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let accessToken = null;

async function initGoogleClient() {
  await loadGoogleApiAndGIS();
  if (!window.gapi.client) {
    await new Promise((resolve) => {
      window.gapi.load('client', resolve);
    });
    // Defensive: if still not loaded, wait a tick and check again
    if (!window.gapi.client) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!window.gapi.client) {
      throw new Error('Google API client failed to load');
    }
  }
  await window.gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });
}

function signInGoogle() {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          accessToken = tokenResponse.access_token;
          window.gapi.client.setToken({ access_token: accessToken });
          resolve(tokenResponse);
        } else {
          reject('No access token received');
        }
      }
    });
    tokenClient.requestAccessToken();
  });
}

window.appendToSheet = async function(entry) {
  await initGoogleClient();
  if (!accessToken) {
    await signInGoogle();
  }
  return window.gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: SHEET_RANGE,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [[
        entry.date,
        entry.weight,
        entry.sleep,
        entry.energy,
        entry.calories,
        entry.protein,
        entry.carbs,
        entry.fat,
        entry.steps,
        entry.exercise,
        entry.exercise_duration,
        entry.notes
      ]]
    }
  });
}

// Usage example (call this after form submission):
// appendToSheet(entry).then(() => alert('Logged to Google Sheet!')).catch(err => alert('Failed: ' + err.message));

// Fetch Weigh-In sheet data and update stats overview
window.renderWeightTrendChart = async function() {
  await initGoogleClient();
  if (!accessToken) {
    await signInGoogle();
  }
  // Fetch all weigh-in data
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Weigh-In!A2:B', // A: date, B: weight
  });
  const rows = response.result.values || [];
  console.log('Fetched weigh-in rows:', rows);
  // Filter last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29); // includes today
  const chartRows = rows.filter(row => {
    const dateStr = row[0];
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= thirtyDaysAgo && d <= today;
  });
  console.log('Filtered chartRows:', chartRows);
  // Prepare data
  const labels = chartRows.map(r => r[0]);
  const weights = chartRows.map(r => parseFloat(r[1])).map(w => isNaN(w) ? null : w);
  // Render chart (simple line chart)
  const chartDiv = document.getElementById('weightChart');
  if (!chartDiv) {
    console.error('weightChart div not found');
    return;
  }
  if (!labels.length) {
    chartDiv.textContent = 'No weight data for last 30 days.';
    return;
  }
  // Use Chart.js if available, else fallback to table
  if (window.Chart && typeof window.Chart === 'function') {
    chartDiv.innerHTML = '<canvas id="weightChartCanvas"></canvas>';
    const ctx = document.getElementById('weightChartCanvas').getContext('2d');
    new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Weight (lbs)',
          data: weights,
          borderColor: '#2980b9',
          backgroundColor: 'rgba(41,128,185,0.1)',
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { display: false }, y: { beginAtZero: false } }
      }
    });
  } else {
    // Fallback: simple HTML table
    let html = '<table class="chart-table"><tr><th>Date</th><th>Weight</th></tr>';
    for (let i = 0; i < labels.length; i++) {
      html += '<tr><td>' + labels[i] + '</td><td>' + (weights[i] !== null ? weights[i] : '--') + '</td></tr>';
    }
    html += '</table>';
    chartDiv.innerHTML = html;
  }
  // If nothing rendered, show debug info
  if (!chartDiv.innerHTML || chartDiv.innerHTML.trim() === '') {
    chartDiv.textContent = 'Debug: No chart/table rendered. Check console for details.';
  }
}
window.updateStatsOverview = async function() {
  await initGoogleClient();
  if (!accessToken) {
    await signInGoogle();
  }
  // Fetch all weigh-in data
  const response = await window.gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Weigh-In!A2:K', // A:K covers all columns
  });
  const rows = response.result.values || [];
  // Parse and filter last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6); // includes today
  const weekRows = rows.filter(row => {
    const dateStr = row[0];
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= sevenDaysAgo && d <= today;
  });
  // Calculate stats
  function avg(arr) {
    if (!arr.length) return '--';
    return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  }
  // Weight: col 1, Calories: col 4, Sleep: col 2, Protein: col 5
  const weights = weekRows.map(r => parseFloat(r[1])).filter(x => !isNaN(x));
  const calories = weekRows.map(r => parseFloat(r[4])).filter(x => !isNaN(x));
  const sleeps = weekRows.map(r => parseFloat(r[2])).filter(x => !isNaN(x));
  const proteins = weekRows.map(r => parseFloat(r[5])).filter(x => !isNaN(x));
  // Update DOM
  document.getElementById('avgWeight').textContent = avg(weights);
  document.getElementById('avgCalories').textContent = avg(calories);
  document.getElementById('avgSleep').textContent = avg(sleeps);
  document.getElementById('totalWorkouts').textContent = avg(proteins);
}

// Automatically update stats overview on app load
window.addEventListener('load', function() {
  // Wait for Google API and GIS to be loaded, then update stats and chart
  loadGoogleApiAndGIS().then(async () => {
    await window.updateStatsOverview();
    await window.renderWeightTrendChart();
    await window.renderRecentEntries();
    await window.renderRecentMeasurements();
  });
});
