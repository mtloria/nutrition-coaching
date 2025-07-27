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
const SHEET_RANGE = 'Sheet1!A1'; // Change if your sheet/tab name is different
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
        entry.exercise,
        entry.exercise_duration,
        entry.notes
      ]]
    }
  });
}

// Usage example (call this after form submission):
// appendToSheet(entry).then(() => alert('Logged to Google Sheet!')).catch(err => alert('Failed: ' + err.message));
