/* Entity Definitions */
const ENTITIES = {
    'ptpn3': 'PT Perkebunan Nusantara III (Persero)',
    'ptpn1': 'PT Perkebunan Nusantara I',
    'ptpn4': 'PT Perkebunan Nusantara IV',
    'sgn': 'PT Sinergi Gula Nusantara',
    'lpp': 'PT LPP Agro Nusantara',
    'medika': 'PT Sri Pamela Medika Nusantara',
    'rpn': 'PT Riset Perkebunan Nusantara',
    'kpbn': 'PT Kharisma Pemasaran Bersama Nusantara',
    'bio': 'PT Bio Industri Nusantara',
    'kin': 'PT Kawasan Industri Nusantara',
    'ikn': 'PT Industri Karet Nusantara'
};

const OWNERS_BY_ENTITY = {
    'ptpn3': [
        "Sub Divisi Strategi & Kebijakan",
        "Sub Divisi Manajemen Talenta",
        "Sub Divisi Pengembangan SDM & Budaya",
        "Sub Divisi Pengembangan Organisasi",
        "Sub Divisi Remunerasi & HI",
        "Sub Divisi Manajemen Kinerja & HCIS"
    ],
    'ptpn1': ["Divisi SDM PTPN I", "Divisi Operasional PTPN I"],
    'ptpn4': ["Divisi SDM PTPN IV", "Divisi Teknik PTPN IV"],
    'sgn': ["Divisi SDM SGN", "Divisi Pabrik SGN"],
    'lpp': ["Divisi SDM LPP", "Divisi Akademik LPP"],
    'medika': ["Divisi SDM Medika", "Divisi Pelayanan Medis"],
    'rpn': ["Divisi SDM RPN", "Divisi Peneliti RPN"],
    'kpbn': ["Divisi SDM KPBN", "Divisi Pemasaran KPBN"],
    'bio': ["Divisi SDM Bio Industri", "Divisi R&D Bio"],
    'kin': ["Divisi SDM KIN", "Divisi Bisnis Kawasan"],
    'ikn': ["Divisi SDM IKN", "Divisi Produksi Karet"]
};

const PROJECT_OWNERS = OWNERS_BY_ENTITY['ptpn3'];

// Seed Data for Demo
const MOCK_INITIATIVES = [
    {
        id: 1,
        name: "Transformasi Budaya SDM & Budaya",
        owner: "Pengembangan SDM & Budaya",
        entity: "ptpn3",
        output: "Peningkatan kompetensi dan budaya kerja",
        status: "On Going",
        urgency: "Medium",
        dueDate: "2025-12-31",
        progress: 68,
        budget: 500000000,
        cost: 1000000000,
        description: "Program transformasi budaya dan pengembangan SDM",
        approvalStatus: "approved",
        createdBy: "admin",
        subInitiatives: []
    },
    {
        id: 2,
        name: "Restrukturisasi Organisasi",
        owner: "Pengembangan Organisasi",
        entity: "ptpn3",
        output: "Struktur organisasi yang lebih efisien",
        status: "Done",
        urgency: "High",
        dueDate: "2025-06-30",
        progress: 100,
        budget: 750000000,
        cost: 745000000,
        description: "Restrukturisasi organisasi untuk efisiensi",
        approvalStatus: "approved",
        createdBy: "admin",
        subInitiatives: []
    },
    {
        id: 3,
        name: "Review Key Performance Indicators",
        owner: "Sub Divisi Manajemen Kinerja & HCIS",
        entity: "ptpn3",
        status: "Carry Over",
        urgency: "High",
        dueDate: "2025-03-31",
        progress: 30,
        budget: 200000000,
        cost: 50000000,
        subInitiatives: [
            { name: "Review KPI 2024", dueDate: "2025-01-15", weight: 30, progress: 100 },
            { name: "Drafting KPI 2025", dueDate: "2025-02-28", weight: 40, progress: 0 },
            { name: "Cascading", dueDate: "2025-03-31", weight: 30, progress: 0 }
        ]
    },

    // --- PTPN I ---
    {
        id: 11,
        name: "Optimasi Lahan Perkebunan",
        owner: "Divisi Operasional PTPN I",
        entity: "ptpn1",
        output: "Peningkatan produktivitas lahan 15%",
        status: "On Going",
        urgency: "High",
        dueDate: "2025-10-15",
        progress: 40,
        budget: 1500000000,
        cost: 600000000,
        description: "Program optimasi lahan perkebunan untuk meningkatkan produktivitas",
        approvalStatus: "approved",
        createdBy: "ptpn1",
        subInitiatives: [
            { name: "Survey Pemetaan Drone", dueDate: "2025-03-15", weight: 30, progress: 100 },
            { name: "Peremajaan Tanaman", dueDate: "2025-07-30", weight: 40, progress: 20 },
            { name: "Implementasi IoT Sensor", dueDate: "2025-10-15", weight: 30, progress: 0 }
        ]
    },
    {
        id: 12,
        name: "Rekrutmen Tenaga Pemanen",
        owner: "Divisi SDM PTPN I",
        entity: "ptpn1",
        output: "100 tenaga pemanen terrekrut",
        status: "Done",
        urgency: "Medium",
        dueDate: "2025-02-20",
        progress: 100,
        budget: 200000000,
        cost: 180000000,
        description: "Rekrutmen tenaga pemanen untuk mendukung operasional perkebunan",
        approvalStatus: "approved",
        createdBy: "ptpn1",
        cost: 180000000,
        subInitiatives: [
            { name: "Publikasi Lowongan", dueDate: "2025-01-10", weight: 20, progress: 100 },
            { name: "Seleksi Administrasi", dueDate: "2025-01-25", weight: 30, progress: 100 },
            { name: "Onboarding", dueDate: "2025-02-20", weight: 50, progress: 100 }
        ]
    },

    // --- PTPN IV ---
    {
        id: 21,
        name: "Efisiensi Pabrik Kelapa Sawit",
        owner: "Divisi Teknik PTPN IV",
        entity: "ptpn4",
        status: "On Going",
        urgency: "High",
        dueDate: "2025-08-30",
        progress: 55,
        budget: 3000000000,
        cost: 1650000000,
        subInitiatives: [
            { name: "Audit Mesin", dueDate: "2025-02-15", weight: 20, progress: 100 },
            { name: "Penggantian Boiler", dueDate: "2025-06-15", weight: 50, progress: 70 },
            { name: "Uji Coba Kapasitas", dueDate: "2025-08-30", weight: 30, progress: 0 }
        ]
    },

    // --- SGN (Sinergi Gula Nusantara) ---
    {
        id: 31,
        name: "Revitalisasi Pabrik Gula Gempolkrep",
        owner: "Divisi Pabrik SGN",
        entity: "sgn",
        status: "Not Started",
        urgency: "Medium",
        dueDate: "2026-05-20",
        progress: 0,
        budget: 5000000000,
        cost: 0,
        subInitiatives: [
            { name: "Studi Kelayakan", dueDate: "2025-04-30", weight: 20, progress: 0 },
            { name: "Tender Kontraktor", dueDate: "2025-07-31", weight: 30, progress: 0 },
            { name: "Konstruksi Awal", dueDate: "2025-12-31", weight: 50, progress: 0 }
        ]
    },

    // --- LPP Agro Nusantara ---
    {
        id: 41,
        name: "Digital Learning Platform 2.0",
        owner: "Divisi Akademik LPP",
        entity: "lpp",
        status: "On Going",
        urgency: "Low",
        dueDate: "2025-06-30",
        progress: 75,
        budget: 450000000,
        cost: 300000000,
        subInitiatives: [
            { name: "Analisis Kebutuhan User", dueDate: "2025-01-30", weight: 20, progress: 100 },
            { name: "Pengembangan Modul Mobile", dueDate: "2025-04-15", weight: 50, progress: 90 },
            { name: "Integrasi LMS", dueDate: "2025-06-30", weight: 30, progress: 30 }
        ]
    },

    // --- Medika (Sri Pamela) ---
    {
        id: 51,
        name: "Akreditasi RS Paripurna",
        owner: "Divisi Pelayanan Medis",
        entity: "medika",
        status: "Carry Over",
        urgency: "High",
        dueDate: "2025-11-30",
        progress: 20,
        budget: 800000000,
        cost: 150000000,
        subInitiatives: [
            { name: "Self Assessment", dueDate: "2025-03-31", weight: 20, progress: 100 },
            { name: "Perbaikan Infrastruktur", dueDate: "2025-08-31", weight: 50, progress: 0 },
            { name: "Survey Simulasi", dueDate: "2025-10-31", weight: 30, progress: 0 }
        ]
    },

    // --- RPN (Riset) ---
    {
        id: 61,
        name: "Riset Varietas Tebu Tahan Kering",
        owner: "Divisi Peneliti RPN",
        entity: "rpn",
        status: "On Going",
        urgency: "Low",
        dueDate: "2027-12-31",
        progress: 15,
        budget: 1200000000,
        cost: 200000000,
        subInitiatives: [
            { name: "Pengumpulan Plasma Nutfah", dueDate: "2025-06-30", weight: 20, progress: 75 },
            { name: "Persilangan Tahap 1", dueDate: "2025-12-31", weight: 30, progress: 0 }
        ]
    },

    // --- KPBN ---
    {
        id: 71,
        name: "Ekspansi Pasar Ekspor Eropa",
        owner: "Divisi Pemasaran KPBN",
        entity: "kpbn",
        status: "On Going",
        urgency: "Medium",
        dueDate: "2025-09-30",
        progress: 60,
        budget: 700000000,
        cost: 400000000,
        subInitiatives: [
            { name: "Sertifikasi Sustainability", dueDate: "2025-03-31", weight: 40, progress: 100 },
            { name: "Pameran Dagang Berlin", dueDate: "2025-05-20", weight: 30, progress: 50 },
            { name: "Kontrak Perdana", dueDate: "2025-09-30", weight: 30, progress: 0 }
        ]
    },

    // --- Bio Industri ---
    {
        id: 81,
        name: "Pilot Project Biogas Plant",
        owner: "Divisi R&D Bio",
        entity: "bio",
        status: "Not Started",
        urgency: "Low",
        dueDate: "2026-03-31",
        progress: 0,
        budget: 2500000000,
        cost: 0,
        subInitiatives: [
            { name: "Basic Engineering Design", dueDate: "2025-06-30", weight: 30, progress: 0 },
            { name: "Procurement EPC", dueDate: "2025-09-30", weight: 30, progress: 0 },
            { name: "Construction", dueDate: "2026-02-28", weight: 40, progress: 0 }
        ]
    },

    // --- KIN (Kawasan Industri) ---
    {
        id: 91,
        name: "Zoning Area Industri Sei Mangkei",
        owner: "Divisi Bisnis Kawasan",
        entity: "kin",
        status: "Done",
        urgency: "High",
        dueDate: "2025-01-30",
        progress: 100,
        budget: 300000000,
        cost: 290000000,
        subInitiatives: [
            { name: "Masterplan Review", dueDate: "2024-12-15", weight: 50, progress: 100 },
            { name: "Perizinan Lingkungan", dueDate: "2025-01-30", weight: 50, progress: 100 }
        ]
    },

    // --- IKN (Industri Karet) ---
    {
        id: 101,
        name: "Modernisasi Line Sheet Rubber",
        owner: "Divisi Produksi Karet",
        entity: "ikn",
        status: "On Going",
        urgency: "Medium",
        dueDate: "2025-07-31",
        progress: 35,
        budget: 1800000000,
        cost: 600000000,
        subInitiatives: [
            { name: "Dismantling Mesin Lama", dueDate: "2025-02-28", weight: 20, progress: 100 },
            { name: "Instalasi Mesin Baru", dueDate: "2025-05-31", weight: 50, progress: 10 },
            { name: "Commissioning", dueDate: "2025-07-31", weight: 30, progress: 0 }
        ]
    },

    // --- RESTORED / ADDITIONAL DATA (Total 28) ---
    // PTPN III (Additional)
    {
        id: 102,
        name: "Implementasi Sistem ERP Baru",
        owner: "Sub Divisi Strategi & Kebijakan",
        entity: "ptpn3",
        status: "On Going", // 30-60 Days (Blue)
        urgency: "High",
        dueDate: "2025-08-15",
        progress: 45,
        budget: 4000000000,
        cost: 1500000000,
        description: "Integrasi sistem keuangan dan operasional",
        subInitiatives: []
    },
    {
        id: 103,
        name: "Program Kesejahteraan Karyawan",
        owner: "Sub Divisi Remunerasi & HI",
        entity: "ptpn3",
        status: "Done", // < 30 Days (Green)
        urgency: "Medium",
        dueDate: "2025-01-10",
        progress: 100,
        budget: 500000000,
        cost: 480000000,
        subInitiatives: []
    },
    {
        id: 104,
        name: "Assessment Center Leadership",
        owner: "Sub Divisi Manajemen Talenta",
        entity: "ptpn3",
        status: "Carry Over", // > 90 Days (Red)
        urgency: "High",
        dueDate: "2024-12-15",
        progress: 80,
        budget: 300000000,
        cost: 250000000,
        subInitiatives: []
    },

    // PTPN I (Restored as PTPN III)
    {
        id: 105,
        name: "Perbaikan Infrastruktur Jalan Kebun",
        owner: "Sub Divisi Strategi & Kebijakan",
        entity: "ptpn3",
        status: "On Going", // 60-90 Days (Yellow)
        urgency: "High",
        dueDate: "2025-06-20",
        progress: 60,
        budget: 2000000000,
        cost: 1200000000,
        subInitiatives: []
    },
    {
        id: 106,
        name: "Pelatihan K3 Mandor",
        owner: "Sub Divisi Pengembangan SDM & Budaya",
        entity: "ptpn3",
        status: "Done",
        urgency: "Medium",
        dueDate: "2025-02-05",
        progress: 100,
        budget: 150000000,
        cost: 140000000,
        subInitiatives: []
    },

    // PTPN IV (Restored as PTPN III)
    {
        id: 107,
        name: "Maintenance Kebun Kelapa Sawit",
        owner: "Sub Divisi Manajemen Kinerja & HCIS",
        entity: "ptpn3",
        status: "On Going",
        urgency: "Medium",
        dueDate: "2025-09-10",
        progress: 30,
        budget: 1200000000,
        cost: 400000000,
        subInitiatives: []
    },

    // SGN (Restored as PTPN III)
    {
        id: 108,
        name: "Audit Lingkungan Pabrik",
        owner: "Sub Divisi Strategi & Kebijakan",
        entity: "ptpn3",
        status: "Not Started",
        urgency: "Low",
        dueDate: "2025-11-20",
        progress: 0,
        budget: 200000000,
        cost: 0,
        subInitiatives: []
    },

    // LPP (Restored as PTPN III)
    {
        id: 109,
        name: "Workshop Digital Marketing",
        owner: "Sub Divisi Pengembangan SDM & Budaya",
        entity: "ptpn3",
        status: "Done",
        urgency: "Medium",
        dueDate: "2025-01-25",
        progress: 100,
        budget: 100000000,
        cost: 90000000,
        subInitiatives: []
    },
    {
        id: 110,
        name: "Pengembangan Kurikulum Leadership",
        owner: "Sub Divisi Manajemen Talenta",
        entity: "ptpn3",
        status: "Carry Over",
        urgency: "High",
        dueDate: "2024-11-30",
        progress: 50,
        budget: 150000000,
        cost: 75000000,
        subInitiatives: []
    },

    // Medika (Restored as PTPN III)
    {
        id: 111,
        name: "Pengadaan Alat Medis Canggih",
        owner: "Sub Divisi Strategi & Kebijakan",
        entity: "ptpn3",
        status: "On Going",
        urgency: "High",
        dueDate: "2025-07-15",
        progress: 25,
        budget: 5000000000,
        cost: 1000000000,
        subInitiatives: []
    },

    // RPN (Restored as PTPN III)
    {
        id: 112,
        name: "Riset Pemupukan Efisien",
        owner: "Sub Divisi Manajemen Kinerja & HCIS",
        entity: "ptpn3",
        status: "Cancelled",
        urgency: "Low",
        dueDate: "2025-05-01",
        progress: 10,
        budget: 300000000,
        cost: 20000000,
        subInitiatives: []
    },

    // KPBN (Restored as PTPN III)
    {
        id: 113,
        name: "Rebranding Produk Ritel",
        owner: "Sub Divisi Remunerasi & HI",
        entity: "ptpn3",
        status: "On Going",
        urgency: "High",
        dueDate: "2025-06-01",
        progress: 70,
        budget: 600000000,
        cost: 450000000,
        subInitiatives: []
    },

    // Bio (Restored as PTPN III)
    {
        id: 114,
        name: "Uji Coba Pupuk Hayati",
        owner: "Sub Divisi Pengembangan Organisasi",
        entity: "ptpn3",
        status: "Done",
        urgency: "Medium",
        dueDate: "2025-02-01",
        progress: 100,
        budget: 250000000,
        cost: 240000000,
        subInitiatives: []
    },

    // KIN (Restored as PTPN III)
    {
        id: 115,
        name: "Marketing Gallery Renovasi",
        owner: "Sub Divisi Manajemen Talenta",
        entity: "ptpn3",
        status: "Not Started",
        urgency: "Medium",
        dueDate: "2025-09-01",
        progress: 0,
        budget: 800000000,
        cost: 0,
        subInitiatives: []
    }
];

// Utility to get status counts
function getProjectStats() {
    const stats = {
        total: MOCK_INITIATIVES.length,
        done: 0,
        onGoing: 0,
        cancelled: 0,
        carryOver: 0,
        notStarted: 0
    };

    MOCK_INITIATIVES.forEach(p => {
        if (p.status === 'Done') stats.done++;
        else if (p.status === 'On Going') stats.onGoing++;
        else if (p.status === 'Cancelled') stats.cancelled++;
        else if (p.status === 'Carry Over') stats.carryOver++;
        else if (p.status === 'Not Started') stats.notStarted++;
    });

    return stats;
}
