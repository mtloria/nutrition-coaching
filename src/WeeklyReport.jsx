import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const SHEET_ID = '15KA7rfRHXcVO0TTGlmQnkKeF1p9pCIm1yTVFdsORGt8';
const SHEET_NAME = 'Form Responses';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

function WeeklyReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(CSV_URL)
      .then(r => r.text())
      .then(text => {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        setData(result.data);
      })
      .catch(e => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const parseDate = (dateStr) => {
    // Handle various date formats that might come from the spreadsheet
    if (!dateStr) return null;
    
    // Try parsing as-is first
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
    
    // Try MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
    
    return null;
  };

  const filterDataByDateRange = (data, start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    return data.filter(row => {
      const rowDate = parseDate(row['Date']);
      return rowDate && rowDate >= startDate && rowDate <= endDate;
    });
  };

  const calculateWeeklyAverages = (filteredData) => {
    if (filteredData.length === 0) return null;

    const totals = {
      weight: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sleep: 0,
      energy: 0,
      steps: 0,
      exerciseDuration: 0,
      validWeightDays: 0,
      validCalorieDays: 0,
      validProteinDays: 0,
      validCarbDays: 0,
      validFatDays: 0,
      validSleepDays: 0,
      validEnergyDays: 0,
      validStepDays: 0,
      validExerciseDays: 0
    };

    filteredData.forEach(row => {
      const weight = parseFloat(row['Morning Weight']);
      const calories = parseInt(row['Total Calories']);
      const protein = parseInt(row['Protein (grams)']);
      const carbs = parseInt(row['Carbohydrates (grams)']);
      const fat = parseInt(row['Fat (grams)']);
      const sleep = parseFloat(row['Sleep Hours']);
      const energy = parseFloat(row['Energy Level']);
      const steps = parseInt(row['Step Count']);
      const exerciseDuration = parseInt(row['Exercise Duration (minutes)']);

      if (!isNaN(weight) && weight > 0) {
        totals.weight += weight;
        totals.validWeightDays++;
      }
      if (!isNaN(calories) && calories > 0) {
        totals.calories += calories;
        totals.validCalorieDays++;
      }
      if (!isNaN(protein) && protein >= 0) {
        totals.protein += protein;
        totals.validProteinDays++;
      }
      if (!isNaN(carbs) && carbs >= 0) {
        totals.carbs += carbs;
        totals.validCarbDays++;
      }
      if (!isNaN(fat) && fat >= 0) {
        totals.fat += fat;
        totals.validFatDays++;
      }
      if (!isNaN(sleep) && sleep > 0) {
        totals.sleep += sleep;
        totals.validSleepDays++;
      }
      if (!isNaN(energy) && energy > 0) {
        totals.energy += energy;
        totals.validEnergyDays++;
      }
      if (!isNaN(steps) && steps > 0) {
        totals.steps += steps;
        totals.validStepDays++;
      }
      if (!isNaN(exerciseDuration) && exerciseDuration > 0) {
        totals.exerciseDuration += exerciseDuration;
        totals.validExerciseDays++;
      }
    });

    // Calculate averages
    const averages = {
      weight: totals.validWeightDays > 0 ? (totals.weight / totals.validWeightDays) : 0,
      calories: totals.validCalorieDays > 0 ? (totals.calories / totals.validCalorieDays) : 0,
      protein: totals.validProteinDays > 0 ? (totals.protein / totals.validProteinDays) : 0,
      carbs: totals.validCarbDays > 0 ? (totals.carbs / totals.validCarbDays) : 0,
      fat: totals.validFatDays > 0 ? (totals.fat / totals.validFatDays) : 0,
      sleep: totals.validSleepDays > 0 ? (totals.sleep / totals.validSleepDays) : 0,
      energy: totals.validEnergyDays > 0 ? (totals.energy / totals.validEnergyDays) : 0,
      steps: totals.validStepDays > 0 ? (totals.steps / totals.validStepDays) : 0,
      exerciseDuration: totals.validExerciseDays > 0 ? (totals.exerciseDuration / totals.validExerciseDays) : 0
    };

    // Calculate macro percentages (calories from each macro)
    const proteinCalories = averages.protein * 4; // 4 calories per gram
    const carbCalories = averages.carbs * 4; // 4 calories per gram
    const fatCalories = averages.fat * 9; // 9 calories per gram
    const totalMacroCalories = proteinCalories + carbCalories + fatCalories;

    const macroPercentages = {
      protein: totalMacroCalories > 0 ? ((proteinCalories / totalMacroCalories) * 100) : 0,
      carbs: totalMacroCalories > 0 ? ((carbCalories / totalMacroCalories) * 100) : 0,
      fat: totalMacroCalories > 0 ? ((fatCalories / totalMacroCalories) * 100) : 0
    };

    // Calculate insights and correlations
    const insights = generateInsights(filteredData);

    return {
      dateRange: { start: startDate, end: endDate },
      daysIncluded: filteredData.length,
      averages,
      macroPercentages,
      totalMacroCalories,
      insights,
      rawData: filteredData
    };
  };

  const generateInsights = (filteredData) => {
    const insights = [];
    
    // Sort data by date for sequential analysis
    const sortedData = filteredData
      .map(row => ({
        ...row,
        parsedDate: parseDate(row['Date'])
      }))
      .filter(row => row.parsedDate)
      .sort((a, b) => a.parsedDate - b.parsedDate);

    // Analyze day-to-day patterns
    for (let i = 0; i < sortedData.length - 1; i++) {
      const today = sortedData[i];
      const tomorrow = sortedData[i + 1];
      
      const todayCarbs = parseInt(today['Carbohydrates (grams)']) || 0;
      const todayProtein = parseInt(today['Protein (grams)']) || 0;
      const todayCalories = parseInt(today['Total Calories']) || 0;
      const todaySleep = parseFloat(today['Sleep Hours']) || 0;
      const todayEnergy = parseFloat(today['Energy Level']) || 0;
      
      const tomorrowEnergy = parseFloat(tomorrow['Energy Level']) || 0;
      const tomorrowSleep = parseFloat(tomorrow['Sleep Hours']) || 0;
      const tomorrowWeight = parseFloat(tomorrow['Morning Weight']) || 0;
      const todayWeight = parseFloat(today['Morning Weight']) || 0;

      // Low carb → Low energy next day
      if (todayCarbs < 100 && tomorrowEnergy < todayEnergy && tomorrowEnergy < 6) {
        insights.push({
          type: 'nutrition-energy',
          severity: 'medium',
          date: tomorrow['Date'],
          observation: `Low carb intake (${todayCarbs}g) on ${today['Date']} may have contributed to lower energy (${tomorrowEnergy}/10) on ${tomorrow['Date']}.`
        });
      }

      // Low protein → Poor recovery pattern
      if (todayProtein < 80 && today['Exercise Duration (minutes)'] > 30 && tomorrowEnergy < 6) {
        insights.push({
          type: 'protein-recovery',
          severity: 'medium',
          date: tomorrow['Date'],
          observation: `Low protein intake (${todayProtein}g) after ${today['Exercise Duration (minutes)']} minutes of exercise on ${today['Date']} may have affected recovery and energy (${tomorrowEnergy}/10) the next day.`
        });
      }

      // Poor sleep → Weight fluctuation
      if (todaySleep < 6.5 && Math.abs(tomorrowWeight - todayWeight) > 2) {
        const direction = tomorrowWeight > todayWeight ? 'increase' : 'decrease';
        insights.push({
          type: 'sleep-weight',
          severity: 'low',
          date: tomorrow['Date'],
          observation: `Poor sleep (${todaySleep} hours) on ${today['Date']} may be related to weight ${direction} (+${Math.abs(tomorrowWeight - todayWeight).toFixed(1)} lbs) on ${tomorrow['Date']}.`
        });
      }

      // Very low calories → Next day compensation
      if (todayCalories < 1200 && parseInt(tomorrow['Total Calories']) > todayCalories + 500) {
        insights.push({
          type: 'calorie-compensation',
          severity: 'medium',
          date: tomorrow['Date'],
          observation: `Very low calorie intake (${todayCalories} kcal) on ${today['Date']} followed by higher intake (${tomorrow['Total Calories']} kcal) suggests potential compensation eating.`
        });
      }

      // High energy after good sleep + adequate carbs
      if (todaySleep >= 7.5 && todayCarbs >= 150 && tomorrowEnergy >= 8) {
        insights.push({
          type: 'positive-pattern',
          severity: 'positive',
          date: tomorrow['Date'],
          observation: `Good sleep (${todaySleep} hours) and adequate carbs (${todayCarbs}g) on ${today['Date']} corresponded with high energy (${tomorrowEnergy}/10) on ${tomorrow['Date']}.`
        });
      }
    }

    // Analyze overall patterns across the week
    const avgCarbs = filteredData.reduce((sum, row) => sum + (parseInt(row['Carbohydrates (grams)']) || 0), 0) / filteredData.length;
    const avgProtein = filteredData.reduce((sum, row) => sum + (parseInt(row['Protein (grams)']) || 0), 0) / filteredData.length;
    const avgEnergy = filteredData.reduce((sum, row) => sum + (parseFloat(row['Energy Level']) || 0), 0) / filteredData.length;
    const avgSleep = filteredData.reduce((sum, row) => sum + (parseFloat(row['Sleep Hours']) || 0), 0) / filteredData.length;

    // Weekly pattern insights
    if (avgCarbs < 120 && avgEnergy < 6.5) {
      insights.push({
        type: 'weekly-pattern',
        severity: 'medium',
        observation: `Overall low carbohydrate intake (${avgCarbs.toFixed(0)}g average) this week may be contributing to consistently lower energy levels (${avgEnergy.toFixed(1)}/10 average).`
      });
    }

    if (avgProtein < 100 && avgEnergy < 6.5) {
      insights.push({
        type: 'weekly-pattern',
        severity: 'medium',
        observation: `Low protein intake (${avgProtein.toFixed(0)}g average) may be affecting energy and recovery throughout the week.`
      });
    }

    if (avgSleep < 7 && avgEnergy < 6.5) {
      insights.push({
        type: 'weekly-pattern',
        severity: 'high',
        observation: `Insufficient sleep (${avgSleep.toFixed(1)} hours average) appears to be significantly impacting energy levels (${avgEnergy.toFixed(1)}/10 average) throughout the week.`
      });
    }

    // Macro balance insights
    const proteinCalories = avgProtein * 4;
    const carbCalories = avgCarbs * 4;
    const fatCalories = (filteredData.reduce((sum, row) => sum + (parseInt(row['Fat (grams)']) || 0), 0) / filteredData.length) * 9;
    const proteinPercent = (proteinCalories / (proteinCalories + carbCalories + fatCalories)) * 100;

    if (proteinPercent < 15 && avgEnergy < 6.5) {
      insights.push({
        type: 'macro-balance',
        severity: 'medium',
        observation: `Protein intake is below 15% of total calories (${proteinPercent.toFixed(1)}%), which may be contributing to lower energy and satiety.`
      });
    }

    return insights;
  };

  const generateReport = () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const filteredData = filterDataByDateRange(data, startDate, endDate);
    const reportData = calculateWeeklyAverages(filteredData);
    
    if (!reportData) {
      alert('No data found for the selected date range');
      return;
    }

    setReport(reportData);
  };

  const printReport = () => {
    window.print();
  };

  if (loading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="report-container">
      <div className="report-header no-print">
        <h1>Weekly Report Generator</h1>
        
        <div className="date-inputs">
          <div className="input-group">
            <label htmlFor="start-date">Start Date:</label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="end-date">End Date:</label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button onClick={generateReport} className="generate-btn">
            Generate Report
          </button>
        </div>
      </div>

      {report && (
        <div className="report-content">
          <div className="report-actions no-print">
            <button onClick={printReport} className="print-btn">
              Print/Save as PDF
            </button>
          </div>

          <div className="report-document">
            <div className="report-title">
              <h2>Nutrition Coaching Weekly Report</h2>
              <p className="date-range">
                {new Date(report.dateRange.start).toLocaleDateString()} - {new Date(report.dateRange.end).toLocaleDateString()}
              </p>
              <p className="days-included">({report.daysIncluded} days of data)</p>
            </div>

            <div className="report-grid">
              <div className="report-section">
                <h3>Physical Metrics</h3>
                <div className="metrics">
                  <div className="metric">
                    <span className="metric-label">Average Weight:</span>
                    <span className="metric-value">{report.averages.weight.toFixed(1)} lbs</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Sleep:</span>
                    <span className="metric-value">{report.averages.sleep.toFixed(1)} hours</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Energy Level:</span>
                    <span className="metric-value">{report.averages.energy.toFixed(1)}/10</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Steps:</span>
                    <span className="metric-value">{Math.round(report.averages.steps).toLocaleString()}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Exercise Duration:</span>
                    <span className="metric-value">{Math.round(report.averages.exerciseDuration)} minutes</span>
                  </div>
                </div>
              </div>

              <div className="report-section">
                <h3>Nutrition Metrics</h3>
                <div className="metrics">
                  <div className="metric">
                    <span className="metric-label">Average Daily Calories:</span>
                    <span className="metric-value">{Math.round(report.averages.calories)} kcal</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Protein:</span>
                    <span className="metric-value">{Math.round(report.averages.protein)}g</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Carbohydrates:</span>
                    <span className="metric-value">{Math.round(report.averages.carbs)}g</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Fat:</span>
                    <span className="metric-value">{Math.round(report.averages.fat)}g</span>
                  </div>
                </div>
              </div>

              <div className="report-section macro-section">
                <h3>Macro Distribution</h3>
                <div className="macro-chart">
                  <div className="macro-bar">
                    <div 
                      className="macro-segment protein" 
                      style={{ width: `${report.macroPercentages.protein}%` }}
                    ></div>
                    <div 
                      className="macro-segment carbs" 
                      style={{ width: `${report.macroPercentages.carbs}%` }}
                    ></div>
                    <div 
                      className="macro-segment fat" 
                      style={{ width: `${report.macroPercentages.fat}%` }}
                    ></div>
                  </div>
                  <div className="macro-labels">
                    <div className="macro-label">
                      <span className="macro-color protein"></span>
                      Protein: {report.macroPercentages.protein.toFixed(1)}%
                    </div>
                    <div className="macro-label">
                      <span className="macro-color carbs"></span>
                      Carbs: {report.macroPercentages.carbs.toFixed(1)}%
                    </div>
                    <div className="macro-label">
                      <span className="macro-color fat"></span>
                      Fat: {report.macroPercentages.fat.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {report.insights && report.insights.length > 0 && (
              <div className="report-section insights-section">
                <h3>🔍 Data Insights & Patterns</h3>
                <div className="insights-list">
                  {report.insights.map((insight, index) => (
                    <div key={index} className={`insight-item ${insight.severity}`}>
                      <div className="insight-type">
                        {insight.type === 'nutrition-energy' && '⚡ Energy & Nutrition'}
                        {insight.type === 'protein-recovery' && '💪 Recovery & Protein'}
                        {insight.type === 'sleep-weight' && '😴 Sleep & Weight'}
                        {insight.type === 'calorie-compensation' && '🍽️ Eating Patterns'}
                        {insight.type === 'positive-pattern' && '✅ Positive Patterns'}
                        {insight.type === 'weekly-pattern' && '📊 Weekly Trends'}
                        {insight.type === 'macro-balance' && '⚖️ Macro Balance'}
                      </div>
                      <div className="insight-text">{insight.observation}</div>
                      {insight.date && <div className="insight-date">Date: {insight.date}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="notes-section">
              <h3>Coach Notes</h3>
              <textarea
                className="coach-notes no-print"
                placeholder="Add your notes here before printing/sending the report..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="6"
              />
              <div className="coach-notes-print print-only">
                {notes.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WeeklyReport;
