// Data storage
let dailyEntries = [];
let measurements = [];
// Initialize with today's date
document.getElementById('date').valueAsDate = new Date();
document.getElementById('meas_date').valueAsDate = new Date();
// Daily form submission
document.getElementById('dailyForm').addEventListener('submit', function(e) {
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
        exercise: document.getElementById('exercise').value,
        exercise_duration: document.getElementById('exercise_duration').value,
        notes: document.getElementById('notes').value
    };
    // Check if entry for this date already exists
    const existingIndex = dailyEntries.findIndex(e => e.date === entry.date);
    if (existingIndex !== -1) {
        if (confirm('An entry for this date already exists. Do you want to update it?')) {
            dailyEntries[existingIndex] = entry;
        }
    } else {
        dailyEntries.push(entry);
    }
    // Sort by date (newest first)
    dailyEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    updateTable();
    updateStats();
    this.reset();
    document.getElementById('date').valueAsDate = new Date();
    alert('Entry added successfully!');
});
// Measurement form submission
document.getElementById('measurementForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const measurement = {
        date: document.getElementById('meas_date').value,
        waist: document.getElementById('waist').value,
        chest: document.getElementById('chest').value,
        arms: document.getElementById('arms').value
    };
    // Check if measurement for this date already exists
    const existingIndex = measurements.findIndex(m => m.date === measurement.date);
    if (existingIndex !== -1) {
        if (confirm('A measurement for this date already exists. Do you want to update it?')) {
            measurements[existingIndex] = measurement;
        }
    } else {
        measurements.push(measurement);
    }
    // Sort by date (newest first)
    measurements.sort((a, b) => new Date(b.date) - new Date(a.date));
    updateMeasurementTable();
    this.reset();
    document.getElementById('meas_date').valueAsDate = new Date();
    alert('Measurement added successfully!');
});
function updateTable() {
    const tbody = document.getElementById('dataTableBody');
    if (dailyEntries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px; color: #7f8c8d;">No entries yet. Add your first daily entry above!</td></tr>';
        return;
    }
    tbody.innerHTML = dailyEntries.map((entry, index) => `
        <tr>
            <td>${entry.date}</td>
            <td>${entry.weight || '--'}</td>
            <td>${entry.calories || '--'}</td>
            <td>${entry.protein || '--'}</td>
            <td>${entry.carbs || '--'}</td>
            <td>${entry.fat || '--'}</td>
            <td>${entry.exercise || '--'}</td>
            <td>${entry.sleep || '--'}</td>
            <td>${entry.energy || '--'}</td>
            <td><button onclick="deleteEntry(${index})" class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;">Delete</button></td>
        </tr>
    `).join('');
}
function updateMeasurementTable() {
    const tbody = document.getElementById('measurementTableBody');
    if (measurements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #7f8c8d;">No measurements yet. Add your first measurement above!</td></tr>';
        return;
    }
    tbody.innerHTML = measurements.map((measurement, index) => `
        <tr>
            <td>${measurement.date}</td>
            <td>${measurement.waist || '--'}"</td>
            <td>${measurement.chest || '--'}"</td>
            <td>${measurement.arms || '--'}"</td>
            <td><button onclick="deleteMeasurement(${index})" class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;">Delete</button></td>
        </tr>
    `).join('');
}
function updateStats() {
    const last7Days = dailyEntries.slice(0, 7);
    // Average weight
    const weights = last7Days.filter(e => e.weight).map(e => parseFloat(e.weight));
    const avgWeight = weights.length > 0 ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : '--';
    document.getElementById('avgWeight').textContent = avgWeight !== '--' ? avgWeight + ' lbs' : '--';
    // Average calories
    const calories = last7Days.filter(e => e.calories).map(e => parseFloat(e.calories));
    const avgCalories = calories.length > 0 ? Math.round(calories.reduce((a, b) => a + b, 0) / calories.length) : '--';
    document.getElementById('avgCalories').textContent = avgCalories !== '--' ? avgCalories : '--';
    // Total workouts
    const workouts = last7Days.filter(e => e.exercise && e.exercise.trim() !== '').length;
    document.getElementById('totalWorkouts').textContent = workouts;
    // Average sleep
    const sleepHours = last7Days.filter(e => e.sleep).map(e => parseFloat(e.sleep));
    const avgSleep = sleepHours.length > 0 ? (sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length).toFixed(1) : '--';
    document.getElementById('avgSleep').textContent = avgSleep !== '--' ? avgSleep + 'h' : '--';
}
function deleteEntry(index) {
    if (confirm('Are you sure you want to delete this entry?')) {
        dailyEntries.splice(index, 1);
        updateTable();
        updateStats();
    }
}
function deleteMeasurement(index) {
    if (confirm('Are you sure you want to delete this measurement?')) {
        measurements.splice(index, 1);
        updateMeasurementTable();
    }
}
function exportData() {
    const data = {
        dailyEntries: dailyEntries,
        measurements: measurements,
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fitness-data-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Data exported successfully! You can share this file with your coach.');
}
function clearAllData() {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
        if (confirm('This will permanently delete all entries and measurements. Are you absolutely sure?')) {
            dailyEntries = [];
            measurements = [];
            updateTable();
            updateMeasurementTable();
            updateStats();
            alert('All data cleared.');
        }
    }
}
// Initialize
updateTable();
updateMeasurementTable();
updateStats();
