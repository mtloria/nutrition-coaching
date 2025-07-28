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
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('charts-container');
  container.innerHTML = '<div style="text-align:center;padding:2em;">Loading charts...</div>';
  try {
    if (!window.gapi || !window.gapi.client) {
      await (window.initGoogleClient ? window.initGoogleClient() : Promise.resolve());
    }
    if (window.signInGoogle) {
      await window.signInGoogle();
    }
    // Fetch all data from the Weigh-In sheet
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Weigh-In!A1:Z', // Adjust range as needed
    });
    const rows = response.result.values;
    if (!rows || rows.length < 2) {
      container.innerHTML = '<div style="text-align:center;padding:2em;color:#888;">No data found in the sheet.</div>';
      return;
    }
    const headers = rows[0];
    const dataRows = rows.slice(1);
    // Transpose data for each field
    const columns = headers.map((_, i) => dataRows.map(row => row[i] || null));
    // Use first column as x-axis labels (e.g., dates)
    const xLabels = columns[0];
    // Render a chart for each field (except the first column)
    container.innerHTML = '';
    for (let i = 1; i < headers.length; i++) {
      const chartDiv = document.createElement('div');
      chartDiv.style.marginBottom = '40px';
      const h2 = document.createElement('h2');
      h2.innerText = headers[i];
      const canvas = document.createElement('canvas');
      chartDiv.appendChild(h2);
      chartDiv.appendChild(canvas);
      container.appendChild(chartDiv);
      createChart(canvas.getContext('2d'), headers[i], xLabels, columns[i]);
    }
  } catch (err) {
    console.error('Error loading charts:', err);
    container.innerHTML = '<div style="color:red;text-align:center;padding:2em;">Error loading charts. Check console for details.<br>' + (err && err.message ? err.message : '') + '</div>';
  }
});
