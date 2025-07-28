// No local data storage. All data is read/written directly from Google Sheets.
// Initialize with today's date
document.getElementById('date').valueAsDate = new Date();
document.getElementById('meas_date').valueAsDate = new Date();
// Daily form submission
document.getElementById('dailyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const entry = {
        date: document.getElementById('date').value,
        weight: document.getElementById('weight').value,
        sleep: document.getElementById('sleep').value,
        energy: document.getElementById('energy').value,
        calories: document.getElementById('calories').value,
        protein: document.getElementById('protein').value,
        carbs: document.getElementById('carbs').value,
        fat: document.getElementById('fat').value,
        steps: document.getElementById('steps').value,
        exercise: document.getElementById('exercise').value,
        exercise_duration: document.getElementById('exercise_duration').value,
        notes: document.getElementById('notes').value
    };
    let sheetExists = false;
    try {
        sheetExists = await window.checkEntryExistsInSheet(entry.date);
    } catch (err) {
        sheetExists = false;
    }
    if (sheetExists) {
        if (await customConfirm('An entry for this date already exists. Do you want to update it?', 'Update Entry?')) {
            try {
                await window.updateEntryInSheet(entry);
                await customAlert('Entry updated in Google Sheet!', 'Success');
            } catch (err) {
                await customAlert('Failed to update in Google Sheet: ' + (err.message || err), 'Error');
            }
        } else {
            await customAlert('Entry was not updated.', 'Cancelled');
        }
    } else {
        try {
            await window.appendToSheet(entry);
            await customAlert('Entry added and logged to Google Sheet!', 'Success');
        } catch (err) {
            await customAlert('Failed to log to Google Sheet: ' + (err.message || err), 'Error');
        }
    }
    this.reset();
    document.getElementById('date').valueAsDate = new Date();
});
// Measurement form submission
document.getElementById('measurementForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const measurement = {
        date: document.getElementById('meas_date').value,
        waist: document.getElementById('waist').value,
        chest: document.getElementById('chest').value,
        arms: document.getElementById('arms').value
    };
    // Only Google Sheets: check if measurement exists, update or append
    let sheetExists = false;
    try {
        sheetExists = await window.checkMeasurementExistsInSheet(measurement.date);
    } catch (err) {
        sheetExists = false;
    }
    if (sheetExists) {
        if (await customConfirm('A measurement for this date already exists. Do you want to update it?', 'Update Measurement?')) {
            try {
                await window.updateMeasurementInSheet(measurement);
                await customAlert('Measurement updated in Google Sheet!', 'Success');
            } catch (err) {
                await customAlert('Failed to update measurement in Google Sheet: ' + (err.message || err), 'Error');
            }
        } else {
            await customAlert('Measurement was not updated.', 'Cancelled');
        }
    } else {
        try {
            await window.appendMeasurementToSheet(measurement);
            await customAlert('Measurement added and logged to Google Sheet!', 'Success');
        } catch (err) {
            await customAlert('Failed to log measurement to Google Sheet: ' + (err.message || err), 'Error');
        }
    }
    this.reset();
    document.getElementById('meas_date').valueAsDate = new Date();
});
// All table rendering and stats are handled by Google Sheets functions in sheets.js


// --- Modal Utility ---

function showCustomModal({ title, message, buttons }) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        if (title) {
            const h2 = document.createElement('h2');
            h2.textContent = title;
            modal.appendChild(h2);
        }
        if (message) {
            const p = document.createElement('p');
            p.textContent = message;
            modal.appendChild(p);
        }
        const btnRow = document.createElement('div');
        btnRow.style.marginTop = '1.5em';
        btnRow.style.display = 'flex';
        btnRow.style.justifyContent = 'center';
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'custom-modal-btn';
            button.textContent = btn.label;
            button.onclick = () => {
                document.body.removeChild(overlay);
                resolve(btn.value);
            };
            btnRow.appendChild(button);
        });
        modal.appendChild(btnRow);
        overlay.appendChild(modal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // Optional: close modal on overlay click if only one button (alert style)
                if (buttons.length === 1) {
                    document.body.removeChild(overlay);
                    resolve(buttons[0].value);
                }
            }
        });
        document.body.appendChild(overlay);
    });
}

// Replace alert/confirm with custom modal
async function customAlert(message, title = 'Notice') {
    await showCustomModal({
        title,
        message,
        buttons: [{ label: 'OK', value: true }]
    });
}

async function customConfirm(message, title = 'Please Confirm') {
    return await showCustomModal({
        title,
        message,
        buttons: [
            { label: 'Cancel', value: false },
            { label: 'Yes', value: true }
        ]
    });
}

// --- Patch form logic to use custom modals ---
