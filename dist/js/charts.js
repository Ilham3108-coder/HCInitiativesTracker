// js/charts.js
// Shared Chart Rendering Logic module.

// Constants
const C_DONE = '#00ff9d';
const C_ONGOING = '#0088ff';
const C_HOLD = '#ff8800';
const C_NOT_STARTED = '#888';
const C_CARRY = '#ffbf00';
const C_CANCEL = '#ff0055';

const C_OWNERS = ['#0088ff', '#00eebb', '#ffbf00', '#ff0055', '#8800ff', '#00ff9d', '#ffaa00', '#00ccff'];
const C_URGENCY = ['#ff0055', '#ffbf00', '#00ff9d'];

// Helper
function destroyChart(id) {
    if (typeof Chart === 'undefined') return;
    const chart = Chart.getChart(id);
    if (chart) chart.destroy();
}

/**
 * Render Owner Distribution Chart (Pie)
 */
function renderOwnerDistChart(initiatives, owners) {
    destroyChart('ownerPropChart');
    const canvas = document.getElementById('ownerPropChart');
    if (!canvas) return;

    if (!owners) owners = [...new Set(initiatives.map(i => i.owner))];
    const ownerShortNames = owners.map(o => o.replace("Sub Divisi ", "").replace("Divisi ", "").substring(0, 20));
    const ownerCounts = owners.map(owner => initiatives.filter(i => i.owner === owner).length);

    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: ownerShortNames,
            datasets: [{ label: 'Total Projects', data: ownerCounts, backgroundColor: C_OWNERS, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: 'white', font: { size: 10 } } },
                datalabels: { color: 'white', formatter: (value) => value > 0 ? value : "" }
            }
        }
    });
}

/**
 * Render Initiatives at Risk Chart (Doughnut)
 */
function renderRiskChart(initiatives) {
    destroyChart('urgencyChart');
    const canvas = document.getElementById('urgencyChart');
    if (!canvas) return;

    let riskCounts = { High: 0, Medium: 0, Low: 0 };
    const now = new Date();

    initiatives.forEach(i => {
        const status = i.status || 'Not Started';
        if (status === 'Done' || status === 'Cancelled') {
            riskCounts.Low++;
        } else {
            if (i.dueDate) {
                const due = new Date(i.dueDate);
                const diffTime = due - now;
                const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (daysLeft <= 7) riskCounts.High++;
                else if (daysLeft <= 30) riskCounts.Medium++;
                else riskCounts.Low++;
            } else {
                riskCounts.Low++;
            }
        }
    });

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['High Risk (<7 Days)', 'Medium Risk (<30 Days)', 'Low Risk'],
            datasets: [{
                data: [riskCounts.High, riskCounts.Medium, riskCounts.Low],
                backgroundColor: C_URGENCY,
                borderWidth: 0
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom', labels: { color: 'white', boxWidth: 10, font: { size: 10 } } },
                datalabels: {
                    formatter: (value, ctx) => {
                        let sum = 0;
                        ctx.chart.data.datasets[0].data.map(d => sum += d);
                        return sum ? (value / sum * 100).toFixed(0) + "%" : "0%";
                    }
                }
            }
        }
    });
}

/**
 * Render Key Activities at Risk Chart (Doughnut)
 */
function renderKeyRiskChart(initiatives) {
    destroyChart('keyRiskChart');
    const canvas = document.getElementById('keyRiskChart');
    if (!canvas) return;

    let riskCounts = { High: 0, Medium: 0, Low: 0 };
    const today = new Date();

    initiatives.forEach(i => {
        if (i.subInitiatives) {
            i.subInitiatives.forEach(si => {
                let risk = 'Low';
                if (si.dueDate) {
                    const due = new Date(si.dueDate);
                    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                    const p = si.progress || 0;

                    if (p < 100) {
                        if (diffDays < 0) risk = 'High'; // Overdue
                        else if (diffDays <= 30) risk = 'High'; // Due within 30 days
                        else if (diffDays <= 90) risk = 'Medium'; // Due within 3 months (90 days)
                    }
                }
                riskCounts[risk]++;
            });
        }
    });

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
                data: [riskCounts.High, riskCounts.Medium, riskCounts.Low],
                backgroundColor: ['#ff0055', '#ffbf00', '#00ff9d'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { position: 'right', labels: { color: 'white', boxWidth: 10, font: { size: 10 } } },
                datalabels: { color: 'white', formatter: (val) => val > 0 ? val : '' }
            }
        }
    });
}

/**
 * Render Speed Chart (Bar)
 */
function renderSpeedChart(initiatives, owners) {
    destroyChart('aggressivenessChart');
    const canvas = document.getElementById('aggressivenessChart');
    if (!canvas) return;

    if (!owners) {
        // Filter out items with no owner or null owner to avoid crash
        owners = [...new Set(initiatives.map(i => i.owner).filter(o => o))];
    }
    const ownerShortNames = owners.map(o => (o ? o.replace("Sub Divisi ", "").replace("Divisi ", "").substring(0, 20) : "Unknown"));

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ownerShortNames,
            datasets: [{
                label: 'Avg Speed (Days)',
                data: ownerShortNames.map(() => Math.floor(Math.random() * 20) + 5), // Mock Data
                backgroundColor: '#00eebb',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: { display: true, text: 'Initiatives Owner', color: '#a0a0b0', font: { size: 11 } },
                    ticks: { color: 'white', font: { size: 9 }, maxRotation: 45, minRotation: 45 }
                },
                y: { grid: { color: 'rgba(255,255,255,0.1)' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}
/**
 * Render Financial Chart (Bar - Budget vs Cost)
 */
function renderFinancialChart(initiatives, owners) {
    destroyChart('financialChart');
    const canvas = document.getElementById('financialChart');
    if (!canvas) return;

    if (!owners) {
        owners = [...new Set(initiatives.map(i => i.owner).filter(o => o))];
    }
    const ownerShortNames = owners.map(o => (o ? o.replace("Sub Divisi ", "").replace("Divisi ", "").substring(0, 20) : "Unknown"));

    const budgetData = owners.map(owner => {
        return initiatives.filter(i => i.owner === owner).reduce((sum, i) => sum + (i.budget || 0), 0) / 1000000;
    });
    const costData = owners.map(owner => {
        return initiatives.filter(i => i.owner === owner).reduce((sum, i) => sum + (i.cost || 0), 0) / 1000000;
    });

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ownerShortNames,
            datasets: [
                { label: 'Anggaran RKAP (Juta)', data: budgetData, backgroundColor: '#00eebb', borderRadius: 4 },
                { label: 'Realisasi Biaya (Juta)', data: costData, backgroundColor: '#ff0055', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: 'white' } },
                datalabels: { color: 'white', anchor: 'end', align: 'top', formatter: (val) => val > 0 ? val.toLocaleString('id-ID') : '' }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a0a0b0' } },
                x: { grid: { display: false }, ticks: { color: 'white', font: { size: 9 } } }
            }
        }
    });
}

/**
 * Render Status Distribution Chart (Doughnut)
 */
function renderStatusDistChart(initiatives) {
    destroyChart('statusDistChart');
    const canvas = document.getElementById('statusDistChart');
    if (!canvas) return;

    const stats = {
        done: initiatives.filter(i => i.status === 'Done').length,
        onGoing: initiatives.filter(i => i.status === 'On Going').length,
        hold: initiatives.filter(i => i.status === 'Hold').length,
        notStarted: initiatives.filter(i => i.status === 'Not Started').length,
        carryOver: initiatives.filter(i => i.status === 'Carry Over').length,
        cancelled: initiatives.filter(i => i.status === 'Cancelled').length
    };

    if (document.getElementById('totalInitCount')) {
        document.getElementById('totalInitCount').innerText = initiatives.length;
    }

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Done', 'On Going', 'Hold', 'Not Started', 'Carry Over', 'Cancelled'],
            datasets: [{
                data: [stats.done, stats.onGoing, stats.hold, stats.notStarted, stats.carryOver, stats.cancelled],
                backgroundColor: [C_DONE, C_ONGOING, C_HOLD, C_NOT_STARTED, C_CARRY, C_CANCEL],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '60%',
            plugins: {
                legend: { position: 'right', labels: { color: 'white', boxWidth: 10, font: { size: 11 } } },
                datalabels: {
                    color: 'white', formatter: (value, ctx) => {
                        let sum = 0;
                        ctx.chart.data.datasets[0].data.map(d => sum += d);
                        return sum ? (value / sum * 100).toFixed(0) + "%" : "";
                    }
                }
            }
        }
    });
}

/**
 * Render Workload Chart (Stacked Bar)
 */
function renderWorkloadChart(initiatives, owners) {
    destroyChart('workloadChart');
    const canvas = document.getElementById('workloadChart');
    if (!canvas) return;

    if (!owners) {
        owners = [...new Set(initiatives.map(i => i.owner).filter(o => o))];
    }
    const ownerLabels = owners.map(o => (o ? o.replace("Sub Divisi ", "").replace("Divisi ", "") : "Unknown"));
    const statuses = ['Done', 'On Going', 'Hold', 'Not Started'];

    const datasets = statuses.map((status) => {
        const data = owners.map(owner => initiatives.filter(i => i.owner === owner && i.status === status).length);
        let color = C_NOT_STARTED;
        if (status === 'Done') color = C_DONE;
        if (status === 'On Going') color = C_ONGOING;
        if (status === 'Hold') color = C_HOLD;
        return { label: status, data: data, backgroundColor: color, stack: 'Stack 0' };
    });

    new Chart(canvas, {
        type: 'bar',
        data: { labels: ownerLabels, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: 'white' } }, datalabels: { display: false } },
            scales: {
                x: { stacked: true, ticks: { color: 'white', font: { size: 10 } } },
                y: { stacked: true, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        }
    });
}

/**
 * Render S-Curve Chart (Line)
 */
function renderSCurveChart(initiatives) {
    destroyChart('sCurveChart');
    const canvas = document.getElementById('sCurveChart');
    if (!canvas) return;

    const sorted = initiatives.filter(i => i.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    const labels = sorted.map(i => {
        const d = new Date(i.dueDate);
        return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear().toString().substr(-2)}`;
    });
    let cumBudget = 0, cumCost = 0;
    const budgetData = [], costData = [];
    sorted.forEach(i => {
        cumBudget += (i.budget || 0); cumCost += (i.cost || 0);
        budgetData.push(cumBudget / 1000000); costData.push(cumCost / 1000000);
    });

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Cumulative Budget (Juta)', data: budgetData, borderColor: '#00eebb', backgroundColor: 'rgba(0, 238, 187, 0.1)', fill: true, tension: 0.4 },
                { label: 'Cumulative Cost (Juta)', data: costData, borderColor: '#ff0055', backgroundColor: 'rgba(255, 0, 85, 0.1)', fill: true, tension: 0.4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: 'white' } },
                datalabels: {
                    display: 'auto',
                    align: 'top',
                    color: 'white',
                    font: { size: 10 },
                    formatter: (val) => val.toFixed(0) + " Jt"
                }
            },
            scales: { x: { ticks: { color: '#888' }, grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } }
        }
    });
}

/**
 * Render Aging Chart (Bar)
 */
function renderAgingChart(initiatives) {
    destroyChart('agingChart');
    const canvas = document.getElementById('agingChart');
    if (!canvas) return;

    const agingData = { '< 30 Days': 0, '30 - 60 Days': 0, '60 - 90 Days': 0, '> 90 Days': 0 };
    initiatives.filter(i => i.status === 'On Going').forEach(i => {
        const pseudoRef = (i.id * 17) % 120 + 10; // Mock Logic
        if (pseudoRef < 30) agingData['< 30 Days']++;
        else if (pseudoRef < 60) agingData['30 - 60 Days']++;
        else if (pseudoRef < 90) agingData['60 - 90 Days']++;
        else agingData['> 90 Days']++;
    });

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: Object.keys(agingData),
            datasets: [{ label: 'Number of Tasks', data: Object.values(agingData), backgroundColor: ['#00ff9d', '#00eebb', '#ffbf00', '#ff0055'], borderRadius: 4 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { color: 'white' } },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false }, ticks: { color: 'white' } } }
        }
    });
}

/**
 * Render Velocity Chart (Bar)
 */
function renderVelocityChart(initiatives) {
    destroyChart('velocityChart');
    const canvas = document.getElementById('velocityChart');
    if (!canvas) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = new Array(12).fill(0);
    const doneCounts = new Array(12).fill(0);

    initiatives.forEach(i => {
        if (i.dueDate) {
            const d = new Date(i.dueDate);
            const m = d.getMonth();
            counts[m]++;
            if (i.status === 'Done') doneCounts[m]++;
        }
    });

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label: 'Planned', data: counts, backgroundColor: '#00eebb', borderRadius: 4 },
                { label: 'Completed', data: doneCounts, backgroundColor: '#00ff9d', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { color: 'white' } }, datalabels: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false }, ticks: { color: 'white' } } }
        }
    });
}

/**
 * Render Progress Trend Chart (Line)
 */
function renderProgressTrendChart(initiatives) {
    destroyChart('progressResumeChart');
    const canvas = document.getElementById('progressResumeChart');
    if (!canvas) return;

    const totalProgress = initiatives.reduce((sum, i) => sum + (i.progress || 0), 0);
    const avgProgress = initiatives.length ? Math.round(totalProgress / initiatives.length) : 0;
    // Mock Trend
    const trendData = [10, 25, 30, 45, 50, 60, 65, 75, 80, 85, avgProgress];

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Overall Progress (%)',
                data: trendData,
                borderColor: '#00eebb',
                backgroundColor: 'rgba(0, 238, 187, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00eebb'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } }
        }
    });
}

/**
 * Render Owner Table
 */
function renderOwnerTable(initiatives, owners) {
    const tbody = document.getElementById('ownerDetailTable');
    if (!tbody) return;

    if (!owners) owners = [...new Set(initiatives.map(i => i.owner))];

    const html = owners.map(owner => {
        const ownerProjects = initiatives.filter(i => i.owner === owner);
        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 10px;">${owner.replace('Sub Divisi ', '').replace('Divisi ', '')}</td>
                <td style="padding: 10px; text-align: center; font-weight: bold;">${ownerProjects.length}</td>
                <td style="padding: 10px; text-align: center; color: ${C_DONE};">${ownerProjects.filter(p => p.status === 'Done').length}</td>
                <td style="padding: 10px; text-align: center; color: ${C_ONGOING};">${ownerProjects.filter(p => p.status === 'On Going').length}</td>
                <td style="padding: 10px; text-align: center; color: ${C_HOLD};">${ownerProjects.filter(p => p.status === 'Hold').length}</td>
                <td style="padding: 10px; text-align: center;">${ownerProjects.filter(p => p.status === 'Not Started').length}</td>
                <td style="padding: 10px; text-align: center; color: ${C_CARRY};">${ownerProjects.filter(p => p.status === 'Carry Over').length}</td>
                <td style="padding: 10px; text-align: center; color: ${C_CANCEL};">${ownerProjects.filter(p => p.status === 'Cancelled').length}</td>
            </tr>`;
    }).join('');
    tbody.innerHTML = html;
}

/**
 * Render Sidebar Statistics (Completion Rate)
 * Expects #sidebarStatsContainer to exist.
 */
function renderSidebarStats(initiatives) {
    const container = document.getElementById('sidebarStatsContainer');
    if (!container) return;

    const total = initiatives.length;
    const done = initiatives.filter(i => i.status === 'Done').length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    container.innerHTML = `
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); margin-top: auto;">
            <div style="font-size: 11px; color: #a0a0b0; margin-bottom: 8px; text-transform: uppercase; font-weight: 600;">Completion Rate</div>
            <div style="height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
                <div style="height: 100%; width: ${percent}%; background: #00ff9d; transition: width 0.5s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: white;">
                <span style="font-weight: bold;">${percent}%</span>
                <span style="color: #a0a0b0;">${done} / ${total}</span>
            </div>
        </div>
    `;
}
