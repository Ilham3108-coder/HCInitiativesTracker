// js/charts.js
// Shared Chart Rendering Logic module.

// Neon Infographic Palette (Updated for vibrant tones)
const NEON_CYAN = '#00f2ff';
const NEON_BLUE = '#0066ff';
const NEON_PURPLE = '#bc00ff';
const NEON_PINK = '#ff00ff';
const NEON_AMBER = '#fbbf24';
const NEON_RED = '#ff3131';
const NEON_BLACK = '#000000';
const DEEP_BLUE = '#050c38';
const DEEP_PURPLE = '#31006a';

const C_DONE = NEON_CYAN;
const C_ONGOING = NEON_BLUE;
const C_HOLD = NEON_AMBER;
const C_NOT_STARTED = '#475569';
const C_CARRY = '#fbbf24';
const C_CANCEL = '#64748b';

// Owner gradient colors (brighter top to deeper bottom)
const C_OWNERS_GRADIENT = [
    [NEON_CYAN, DEEP_BLUE],
    [NEON_BLUE, DEEP_BLUE],
    [NEON_PURPLE, DEEP_PURPLE],
    [NEON_PINK, DEEP_PURPLE],
    ['#00ffaa', '#004d33'],
    [NEON_AMBER, DEEP_PURPLE],
    ['#ff8c00', DEEP_PURPLE],
    ['#475569', NEON_BLACK]
];

// Urgency gradient colors
const C_URGENCY_GRADIENT = [
    [NEON_PINK, DEEP_PURPLE],   // High
    [NEON_AMBER, DEEP_PURPLE],  // Medium
    [NEON_CYAN, DEEP_BLUE]      // Low
];

// Status gradient colors
const C_STATUS_GRADIENT = {
    done: [NEON_CYAN, '#003d6d'],
    ongoing: [NEON_BLUE, '#001a4d'],
    hold: [NEON_AMBER, '#7a4a00'],
    notStarted: ['#475569', '#1e293b'],
    carry: [NEON_AMBER, '#7a4a00'],
    cancel: ['#64748b', '#334155']
};

// Precise Gradient Helper using Chart Area
function createChartGradient(ctx, startColor, endColor, isHorizontal = false, chartArea = null) {
    if (!ctx) return startColor;
    const canvas = ctx.canvas;
    let gradient;

    // Scale to chart area if provided for "per-bar" feel
    if (chartArea) {
        if (isHorizontal) {
            gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
        } else {
            gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        }
    } else {
        if (isHorizontal) {
            gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        } else {
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        }
    }

    gradient.addColorStop(0, endColor);   // Bottom
    gradient.addColorStop(1, startColor); // Top
    return gradient;
}

// Circular/Radial Gradient Helper for Pie/Doughnut Charts
function createCircularGradient(ctx, startColor, endColor, chartArea) {
    if (!ctx || !chartArea) return startColor;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;
    const r = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;

    // Radial gradient from inner to outer to create depth
    const gradient = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
    gradient.addColorStop(0, endColor);   // Inner (Darker)
    gradient.addColorStop(1, startColor); // Outer (Vibrant Neon)
    return gradient;
}

// Helper function to get gradient array for chart datasets
function getGradientColors(ctx, colorPairs) {
    if (!ctx) return colorPairs.map(p => p[0]);
    return colorPairs.map(pair => createChartGradient(ctx, pair[0], pair[1]));
}

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
            datasets: [{
                label: 'Total Projects',
                data: ownerCounts,
                backgroundColor: (context) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return null;
                    const index = context.dataIndex;
                    const pair = C_OWNERS_GRADIENT[index % C_OWNERS_GRADIENT.length];
                    return createCircularGradient(ctx, pair[0], pair[1], chartArea);
                },
                borderWidth: 0
            }]
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
                backgroundColor: (context) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return null;
                    const index = context.dataIndex;
                    const pair = C_URGENCY_GRADIENT[index % C_URGENCY_GRADIENT.length];
                    return createCircularGradient(ctx, pair[0], pair[1], chartArea);
                },
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
                backgroundColor: (context) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return null;
                    const index = context.dataIndex;
                    const colors = [
                        [NEON_PINK, DEEP_PURPLE],
                        [NEON_AMBER, DEEP_PURPLE],
                        [NEON_CYAN, DEEP_BLUE]
                    ];
                    const pair = colors[index % colors.length];
                    return createCircularGradient(ctx, pair[0], pair[1], chartArea);
                },
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
 * Render Key Activity Duration Chart (Bar - Histogram)
 * Shows how many key activities were completed in X days.
 */
function renderKeyActivityDurationChart(initiatives) {
    destroyChart('keyActivityEffectivenessChart');
    const canvas = document.getElementById('keyActivityEffectivenessChart');
    if (!canvas) return;

    // Buckets
    const buckets = {
        '< 7 Days': 0,
        '7 - 14 Days': 0,
        '15 - 30 Days': 0,
        '> 30 Days': 0
    };

    let count = 0;

    initiatives.forEach(i => {
        if (i.subInitiatives && Array.isArray(i.subInitiatives)) {
            i.subInitiatives.forEach(sub => {
                if (sub.progress === 100) {
                    // MOCK DURATION LOGIC
                    // Since we don't have startDate/completedDate, we simulate duration
                    // deterministically based on the name length to ensure consistency.
                    const pseudoDuration = (sub.name.length * 7) % 45 + 2;

                    if (pseudoDuration < 7) buckets['< 7 Days']++;
                    else if (pseudoDuration <= 14) buckets['7 - 14 Days']++;
                    else if (pseudoDuration <= 30) buckets['15 - 30 Days']++;
                    else buckets['> 30 Days']++;

                    count++;
                }
            });
        }
    });

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: Object.keys(buckets),
            datasets: [{
                label: 'Activities Completed',
                data: Object.values(buckets),
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    const index = context.dataIndex;
                    const colors = [
                        [NEON_CYAN, DEEP_BLUE],
                        ['#22d3ee', DEEP_BLUE],
                        [NEON_BLUE, DEEP_BLUE],
                        [NEON_PINK, DEEP_PURPLE]
                    ];
                    const pair = colors[index % colors.length];
                    return createChartGradient(ctx, pair[0], pair[1], false, chartArea);
                },
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: 'white',
                    anchor: 'end',
                    align: 'top',
                    formatter: (val) => val > 0 ? val : ""
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#a0a0b0', stepSize: 1 }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'white', font: { size: 10 } }
                }
            }
        }
    });

    // Hide percentage element if it exists because this is now a histogram
    const percentageEl = document.getElementById('keyActivityEffectivenessPercent');
    if (percentageEl) {
        percentageEl.style.display = 'none';
    }
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
                backgroundColor: (context) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return null;
                    return createChartGradient(ctx, NEON_CYAN, DEEP_BLUE, false, chartArea);
                },
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
                {
                    label: 'Anggaran RKAP (Juta)',
                    data: budgetData,
                    backgroundColor: (ctx) => createChartGradient(ctx.chart.ctx, NEON_CYAN, DEEP_BLUE, false, ctx.chart.chartArea),
                    borderRadius: 4
                },
                {
                    label: 'Realisasi Biaya (Juta)',
                    data: costData,
                    backgroundColor: (ctx) => {
                        if (ctx.type !== 'data' || !ctx.chart.chartArea) return NEON_AMBER;
                        return createChartGradient(ctx.chart.ctx, NEON_AMBER, '#7a4a00', false, ctx.chart.chartArea);
                    },
                    borderRadius: 4
                }
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
                backgroundColor: (context) => {
                    const { ctx, chartArea } = context.chart;
                    const index = context.dataIndex;
                    const statuses = ['done', 'ongoing', 'hold', 'notStarted', 'carry', 'cancel'];
                    const status = statuses[index];
                    const pair = C_STATUS_GRADIENT[status] || [NEON_CYAN, '#003d6d'];
                    if (!chartArea) return pair[0];
                    return createCircularGradient(ctx, pair[0], pair[1], chartArea);
                },
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
        const pair = C_STATUS_GRADIENT[status.toLowerCase().replace(' ', '')] || [NEON_CYAN, DEEP_BLUE];
        return {
            label: status,
            data: data,
            backgroundColor: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return null;
                return createChartGradient(ctx, pair[0], pair[1], false, chartArea);
            },
            stack: 'Stack 0'
        };
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
                { label: 'Cumulative Budget (Juta)', data: budgetData, borderColor: NEON_CYAN, backgroundColor: 'rgba(0, 242, 255, 0.1)', fill: true, tension: 0.4 },
                { label: 'Cumulative Cost (Juta)', data: costData, borderColor: NEON_PINK, backgroundColor: 'rgba(255, 0, 255, 0.1)', fill: true, tension: 0.4 }
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
            datasets: [{
                label: 'Number of Tasks',
                data: Object.values(agingData),
                backgroundColor: (context) => {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return null;
                    const index = context.dataIndex;
                    const pairs = [
                        ['#00ff9d', '#004d33'],     // < 30 Days (Green)
                        [NEON_BLUE, '#001a4d'],     // 30 - 60 Days (Blue)
                        [NEON_AMBER, '#7a4a00'],    // 60 - 90 Days (Yellow)
                        [NEON_RED, '#5e0707']       // > 90 Days (Red)
                    ];
                    const p = pairs[index % pairs.length];
                    return createChartGradient(ctx, p[0], p[1], false, chartArea);
                },
                borderRadius: 4
            }]
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
                {
                    label: 'Planned',
                    data: counts,
                    backgroundColor: (ctx) => {
                        if (ctx.type !== 'data' || !ctx.chart.chartArea) return NEON_AMBER;
                        return createChartGradient(ctx.chart.ctx, NEON_AMBER, '#7a4a00', false, ctx.chart.chartArea);
                    },
                    borderRadius: 4
                },
                {
                    label: 'Completed',
                    data: doneCounts,
                    backgroundColor: (ctx) => createChartGradient(ctx.chart.ctx, NEON_CYAN, DEEP_BLUE, false, ctx.chart.chartArea),
                    borderRadius: 4
                }
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
                borderColor: NEON_CYAN,
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: NEON_CYAN
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
                <div style="height: 100%; width: ${percent}%; background: ${NEON_CYAN}; box-shadow: 0 0 10px ${NEON_CYAN}; transition: width 0.5s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: white;">
                <span style="font-weight: bold;">${percent}%</span>
                <span style="color: #a0a0b0;">${done} / ${total}</span>
            </div>
        </div>
    `;
}


/**
 * Render Key Activity Timeline Effectiveness Chart (Doughnut)
 * For Admins: Measures effectiveness of completion based on timeline (Done vs Overdue vs On Schedule).
 */
function renderKeyActivityTimelineChart(initiatives) {
    destroyChart('keyActivityEffectivenessChart');
    const canvas = document.getElementById('keyActivityEffectivenessChart');
    if (!canvas) return;

    let counts = {
        completed: 0,
        onSchedule: 0,
        overdue: 0
    };

    const today = new Date();
    // Reset time to midnight for fair comparison
    today.setHours(0, 0, 0, 0);

    initiatives.forEach(i => {
        if (i.subInitiatives && Array.isArray(i.subInitiatives)) {
            i.subInitiatives.forEach(sub => {
                const isDone = sub.progress === 100 || sub.status === 'Done';

                if (isDone) {
                    counts.completed++;
                } else {
                    if (sub.dueDate) {
                        const due = new Date(sub.dueDate);
                        due.setHours(0, 0, 0, 0); // Normalize

                        if (due < today) {
                            counts.overdue++;
                        } else {
                            counts.onSchedule++;
                        }
                    } else {
                        // No due date, assume On Schedule
                        counts.onSchedule++;
                    }
                }
            });
        }
    });

    const total = counts.completed + counts.onSchedule + counts.overdue;
    // Effectiveness Score: (Completed + On Schedule) / Total
    const effectiveCount = counts.completed + counts.onSchedule;
    const effectivePercent = total > 0 ? Math.round((effectiveCount / total) * 100) : 0;

    const ctx = canvas.getContext('2d');
    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'On Schedule', 'Overdue'],
            datasets: [{
                data: [counts.completed, counts.onSchedule, counts.overdue],
                backgroundColor: (context) => {
                    const { ctx, chartArea } = context.chart;
                    const index = context.dataIndex;
                    const pairs = [
                        [NEON_CYAN, '#003d6d'],
                        [NEON_AMBER, '#7a4a00'],
                        [NEON_RED, '#5e0707']
                    ];
                    const pair = pairs[index % pairs.length];
                    if (!chartArea) return pair[0];
                    return createCircularGradient(ctx, pair[0], pair[1], chartArea);
                },
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'white', pointStyle: 'circle', usePointStyle: true, font: { size: 10 } }
                },
                datalabels: {
                    color: 'white',
                    formatter: (value, ctx) => {
                        if (value === 0) return '';
                        return value; // Show Count (since segments are small)
                    }
                }
            }
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function (chart) {
                const width = chart.width, height = chart.height, ctx = chart.ctx;
                ctx.restore();

                // Text 1: Percent
                const fontSize1 = (height / 120).toFixed(2);
                ctx.font = "bold " + fontSize1 + "em sans-serif";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "white";

                const text1 = effectivePercent + "%",
                    text1X = Math.round((width - ctx.measureText(text1).width) / 2),
                    text1Y = height / 2 - 10;

                ctx.fillText(text1, text1X, text1Y);

                // Text 2: Label
                const fontSize2 = (height / 250).toFixed(2);
                ctx.font = fontSize2 + "em sans-serif";
                ctx.fillStyle = "#a0a0b0";

                const text2 = "Effective",
                    text2X = Math.round((width - ctx.measureText(text2).width) / 2),
                    text2Y = height / 2 + 15;

                ctx.fillText(text2, text2X, text2Y);

                ctx.save();
            }
        }]
    });

    // Handle the separate percentage element in HTML if it exists (hide it, as we draw inside canvas)
    const percentageEl = document.getElementById('keyActivityEffectivenessPercent');
    if (percentageEl) {
        percentageEl.style.display = 'none';
    }
}

/**
 * Render Key Activity Timeline Effectiveness by Owner (Stacked Bar)
 */
function renderKeyActivityTimelineByOwnerChart(initiatives, owners) {
    destroyChart('keyActivityOwnerChart');
    const canvas = document.getElementById('keyActivityOwnerChart');
    if (!canvas) return;

    if (!owners) {
        owners = [...new Set(initiatives.map(i => i.owner).filter(o => o))];
    }

    // Sort owners logic potentially? 
    // Standardize Names
    const ownerShortNames = owners.map(o => (o ? o.replace("Sub Divisi ", "").replace("Divisi ", "").substring(0, 20) : "Unknown"));

    // Prepare Datasets
    const dataCompleted = [];
    const dataOnSchedule = [];
    const dataOverdue = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    owners.forEach(owner => {
        let countComp = 0;
        let countSched = 0;
        let countOver = 0;

        const ownerProjects = initiatives.filter(i => i.owner === owner);
        ownerProjects.forEach(p => {
            if (p.subInitiatives && Array.isArray(p.subInitiatives)) {
                p.subInitiatives.forEach(sub => {
                    const isDone = sub.progress === 100 || sub.status === 'Done';
                    if (isDone) {
                        countComp++;
                    } else {
                        if (sub.dueDate) {
                            const due = new Date(sub.dueDate);
                            due.setHours(0, 0, 0, 0);
                            if (due < today) countOver++;
                            else countSched++;
                        } else {
                            countSched++;
                        }
                    }
                });
            }
        });

        dataCompleted.push(countComp);
        dataOnSchedule.push(countSched);
        dataOverdue.push(countOver);
    });

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ownerShortNames,
            datasets: [
                {
                    label: 'Completed',
                    data: dataCompleted,
                    backgroundColor: (ctx) => {
                        if (ctx.type !== 'data' || !ctx.chart.chartArea) return NEON_CYAN;
                        return createChartGradient(ctx.chart.ctx, NEON_CYAN, '#003d6d', false, ctx.chart.chartArea);
                    },
                    borderRadius: 4, stack: 'Stack 0'
                },
                {
                    label: 'On Schedule',
                    data: dataOnSchedule,
                    backgroundColor: (ctx) => {
                        if (ctx.type !== 'data' || !ctx.chart.chartArea) return NEON_AMBER;
                        return createChartGradient(ctx.chart.ctx, NEON_AMBER, '#7a4a00', false, ctx.chart.chartArea);
                    },
                    borderRadius: 4, stack: 'Stack 0'
                },
                {
                    label: 'Overdue',
                    data: dataOverdue,
                    backgroundColor: (ctx) => {
                        if (ctx.type !== 'data' || !ctx.chart.chartArea) return NEON_RED;
                        return createChartGradient(ctx.chart.ctx, NEON_RED, '#5e0707', false, ctx.chart.chartArea);
                    },
                    borderRadius: 4, stack: 'Stack 0'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: 'white', font: { size: 10 } } },
                datalabels: {
                    color: 'white',
                    display: 'auto',
                    font: { weight: 'bold', size: 9 },
                    formatter: (value) => value > 0 ? value : ''
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: 'white', font: { size: 10 }, maxRotation: 45, minRotation: 45 },
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#a0a0b0', stepSize: 1 }
                }
            }
        }
    });
}
