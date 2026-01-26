// State Management
let allInitiatives; // Full data (all entities) - for saving
let initiatives; // Filtered data for display

// Robust data loading: Try to load from localStorage, fallback to MOCK only if empty or invalid
try {
    const storedData = localStorage.getItem('initiatives');
    if (storedData && storedData !== "undefined" && storedData !== "null") {
        allInitiatives = JSON.parse(storedData);
        // Basic validation to ensure it's an array
        if (!Array.isArray(allInitiatives) || allInitiatives.length === 0) {
            console.warn('⚠️ Stored data is invalid or empty, falling back to MOCK');
            allInitiatives = MOCK_INITIATIVES;
        }
        // AUTO-RESTORE LOGIC: Force update if:
        // 1. Data count is low (< 28) AND User is NOT Admin (Admins might delete items intentionally)
        // 2. Data is incorrect (e.g., ID 105 should be ptpn3)
        // Check for admin role securely
        const currentUserData = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUsernameVal = localStorage.getItem('currentUser');
        const currentUserObj = currentUserData.find(u => u.username === currentUsernameVal);
        const isAdminUser = currentUserObj && (currentUserObj.role === 'admin' || currentUserObj.role === 'administrator');

        if (!isAdminUser && allInitiatives.length < MOCK_INITIATIVES.length) {
            console.log('🔄 Detected low data count for NON-ADMIN, forcing restore...');
            allInitiatives = MOCK_INITIATIVES;
            localStorage.setItem('initiatives', JSON.stringify(allInitiatives));
        }
        else if (allInitiatives.some(i => i.id === 105 && i.entity !== 'ptpn3')) {
            console.log('🔄 Detected incorrect entity assignment, forcing partial restore...');
            // Only fix specific items instead of full wipe if possible, but for now full restore ensures consistency
            allInitiatives = MOCK_INITIATIVES;
            localStorage.setItem('initiatives', JSON.stringify(allInitiatives));
        }
    } else {
        console.log('ℹ️ No stored data found, using MOCK data');
        allInitiatives = MOCK_INITIATIVES;
    }
} catch (e) {
    console.error('❌ Error parsing stored data:', e);
    allInitiatives = MOCK_INITIATIVES;
}

// Ensure data integrity: save immediately if we fell back to MOCK
if (localStorage.getItem('initiatives') === null) {
    localStorage.setItem('initiatives', JSON.stringify(allInitiatives));
}

initiatives = allInitiatives; // Start with all data


// ============ ENTITY FILTERING FOR REGULAR USERS ============
// Get current user info
const currentUsername = localStorage.getItem('currentUser');
const users = JSON.parse(localStorage.getItem('users') || '[]');
const currentUser = users.find(u => u.username === currentUsername);

console.log('👤 Current User:', currentUser);

// Apply entity filtering for non-admin users
if (currentUser && currentUser.role === 'user' && currentUser.entity) {
    const originalCount = initiatives.length;

    // Filter initiatives to only show user's entity
    initiatives = initiatives.filter(init => {
        // Show initiatives from user's entity that are approved OR pending update
        const isFromUserEntity = init.entity === currentUser.entity;
        const isApproved = init.approvalStatus === 'approved' || init.approvalStatus === 'pending_update' || !init.approvalStatus;
        const isOwnInitiative = init.createdBy === currentUser.username;

        return (isFromUserEntity && isApproved) || isOwnInitiative;
    });

    console.log(`🔒 Entity Filter Applied for user "${currentUser.username}" (${currentUser.entity}):`, {
        original: originalCount,
        filtered: initiatives.length,
        entity: currentUser.entity
    });
} else if (currentUser && (currentUser.role === 'administrator' || currentUser.role === 'admin')) {
    console.log('👑 Administrator - showing all initiatives');
}
// ============ END ENTITY FILTERING ============


// DOM Elements
const container = document.getElementById('projectsContainer');
const modal = document.getElementById('projectModal');
const modalTitle = document.getElementById('modalTitle');
const projectForm = document.getElementById('projectForm');
const subInitContainer = document.getElementById('subInitiativesContainer');

// Filter state
let currentEntityFilter = 'all';
let currentStatusFilter = 'all';

// Utility: Save to LocalStorage
function saveState() {
    console.log('💾 saveState CALLED - Saving to localStorage...');
    console.log('📦 allInitiatives count:', allInitiatives.length);

    // Save ALL initiatives (not filtered) to prevent data loss
    localStorage.setItem('initiatives', JSON.stringify(allInitiatives));
    console.log('✅ Data saved to localStorage');

    // SYNC TO CLOUD (Auto-Backup)
    if (window.dataService && window.dataService.supabase && window.dataService.supabase.isConnected()) {
        console.log('☁️ Initiating Background Cloud Sync...');
        const payload = allInitiatives.map(p => ({
            id: p.id,
            name: p.name,
            owner: p.owner || 'Unknown',
            content: p,
            updated_at: new Date()
        }));

        // Fix: Access local client instance properly
        const client = window.dataService.supabase.client;
        if (client) {
            client.from('projects').upsert(payload)
                .then(({ error }) => {
                    if (error) console.error('Cloud Sync Error', error);
                    else console.log('✅ Cloud Sync Success');
                });
        }
    }

    // Reload from localStorage to ensure consistency
    allInitiatives = JSON.parse(localStorage.getItem('initiatives'));

    // Re-apply entity filtering for display
    const currentUsername = localStorage.getItem('currentUser');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(u => u.username === currentUsername);

    if (currentUser && currentUser.role === 'user' && currentUser.entity) {
        initiatives = allInitiatives.filter(init => {
            const isFromUserEntity = init.entity === currentUser.entity;
            const isApproved = init.approvalStatus === 'approved' || init.approvalStatus === 'pending_update' || !init.approvalStatus;
            const isOwnInitiative = init.createdBy === currentUser.username;
            return (isFromUserEntity && isApproved) || isOwnInitiative;
        });
        console.log('🔄 Re-filtered initiatives for user:', initiatives.length);
    } else {
        initiatives = allInitiatives;
    }

    window.dispatchEvent(new Event('initiatives-updated'));
    renderProjects();
    if (window.updateSidebarStats) window.updateSidebarStats();
}

// Utility: Format Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

// Handler: Update Project Status (Manual)
window.updateProjectStatus = function (id, newStatus) {
    const project = initiatives.find(i => i.id === id);
    if (project) {
        project.status = newStatus;
        saveState();
    }
}

// --- MODAL & DYNAMIC FORM LOGIC ---

// Add Key Activity Field (Refactored)
window.addSubInitiativeField = function (name = '', weight = '', dueDate = '', progress = 0) {
    const id = Date.now() + Math.random();
    const div = document.createElement('div');
    div.className = 'sub-init-group';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.style.padding = '15px';
    div.style.borderRadius = '8px';
    div.style.border = '1px solid rgba(255,255,255,0.1)';
    div.style.marginBottom = '10px';
    div.dataset.id = id;

    // Layout: Name (Full Width) | Row: Weight, DueDate
    div.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <input type="text" class="sub-init-name" value="${name}" required placeholder="Key Activity Name" 
                style="flex: 1; bg: transparent; border: none; border-bottom: 1px solid #555; background: transparent; color: white; padding: 5px;">
            <button type="button" onclick="removeSubInit(this)" style="color: #ff0055; background: none; border: none; cursor: pointer; margin-left: 10px;">&times;</button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
                <label style="font-size: 11px; color: var(--text-muted);">Weight (%)</label>
                <input type="number" class="sub-init-weight" value="${weight}" min="0" max="100" placeholder="0-100" 
                    style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid #333; color: white; border-radius: 4px; padding: 5px;">
            </div>
            <div>
                <label style="font-size: 11px; color: var(--text-muted);">Due Date</label>
                <input type="date" class="sub-init-date" value="${dueDate}" 
                    style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid #333; color: white; border-radius: 4px; padding: 5px;">
            </div>
            <div>
                 <label style="font-size: 11px; color: var(--text-muted);">Progress (%)</label>
                 <input type="number" class="sub-init-progress" value="${progress}" min="0" max="100" placeholder="0-100"
                    style="width: 100%; background: rgba(0,0,0,0.2); border: 1px solid #333; color: white; border-radius: 4px; padding: 5px;">
            </div>
        </div>
    `;

    subInitContainer.appendChild(div);
};

window.removeSubInit = function (btn) {
    btn.closest('.sub-init-group').remove();
};

// --- NEW: Leading/Lagging Indicators Logic ---

window.addIndicatorField = function (type = 'Leading', metric = '', uom = '%', target = '', realization = '') {
    const div = document.createElement('div');
    div.className = 'indicator-group';
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '100px 2fr 100px 100px 100px 40px';
    div.style.gap = '10px';
    div.style.alignItems = 'center';
    div.style.background = 'rgba(255,255,255,0.02)';
    div.style.padding = '10px';
    div.style.borderRadius = '6px';
    div.style.border = '1px solid rgba(255,255,255,0.1)';

    div.innerHTML = `
        <select class="indicator-type" style="background: rgba(255,255,255,0.05); border: 1px solid #333; color: white; border-radius: 4px; padding: 5px; width: 100%;">
            <option value="Leading" ${type === 'Leading' ? 'selected' : ''} style="background: #1a1a2e; color: white;">Leading</option>
            <option value="Lagging" ${type === 'Lagging' ? 'selected' : ''} style="background: #1a1a2e; color: white;">Lagging</option>
        </select>
        <input type="text" class="indicator-metric" value="${metric}" placeholder="Metric Description" 
            style="background: rgba(0,0,0,0.2); border: 1px solid #333; color: white; border-radius: 4px; padding: 5px; width: 100%;">
        <select class="indicator-uom" style="background: rgba(255,255,255,0.05); border: 1px solid #333; color: white; border-radius: 4px; padding: 5px; width: 100%;">
            <option value="%" ${uom === '%' ? 'selected' : ''} style="background: #1a1a2e; color: white;">%</option>
            <option value="Jumlah" ${uom === 'Jumlah' ? 'selected' : ''} style="background: #1a1a2e; color: white;">Jumlah</option>
            <option value="Index/Score" ${uom === 'Index/Score' ? 'selected' : ''} style="background: #1a1a2e; color: white;">Index/Score</option>
        </select>
        <input type="text" class="indicator-target" value="${target}" placeholder="Target"
            style="background: rgba(0,0,0,0.2); border: 1px solid #333; color: white; border-radius: 4px; padding: 5px; width: 100%;">
        <input type="text" class="indicator-realization" value="${realization}" placeholder="Realization"
            style="background: rgba(0,0,0,0.2); border: 1px solid #333; color: white; border-radius: 4px; padding: 5px; width: 100%;">
        <button type="button" onclick="removeIndicatorField(this)" style="color: #ff0055; background: none; border: none; cursor: pointer;">&times;</button>
    `;

    const container = document.getElementById('indicatorsContainer');
    if (container) container.appendChild(div);
};

window.removeIndicatorField = function (btn) {
    btn.closest('.indicator-group').remove();
};

// --- Evidence Field Logic ---
window.toggleEvidenceType = function (type) {
    const linkBtn = document.getElementById('evidenceTypeLink');
    const fileBtn = document.getElementById('evidenceTypeFile');
    const linkContainer = document.getElementById('evidenceLinkContainer');
    const fileContainer = document.getElementById('evidenceFileContainer');

    if (type === 'link') {
        if (linkBtn) {
            linkBtn.style.background = 'var(--primary)';
            linkBtn.style.color = 'black';
        }
        if (fileBtn) {
            fileBtn.style.background = 'rgba(255,255,255,0.05)';
            fileBtn.style.color = 'var(--text-muted)';
        }

        if (linkContainer) linkContainer.style.display = 'block';
        if (fileContainer) fileContainer.style.display = 'none';

        // Clear file input if switching
        const fileInput = document.getElementById('pEvidenceFile');
        const fileBase64 = document.getElementById('pEvidenceFileBase64');
        const fileName = document.getElementById('pEvidenceFileName');

        if (fileInput) fileInput.value = '';
        if (fileBase64) fileBase64.value = '';
        if (fileName) fileName.value = '';
        const preview = document.getElementById('filePreview');
        if (preview) preview.style.display = 'none';

    } else {
        if (fileBtn) {
            fileBtn.style.background = 'var(--primary)';
            fileBtn.style.color = 'black';
        }
        if (linkBtn) {
            linkBtn.style.background = 'rgba(255,255,255,0.05)';
            linkBtn.style.color = 'var(--text-muted)';
        }

        if (fileContainer) fileContainer.style.display = 'block';
        if (linkContainer) linkContainer.style.display = 'none';

        // Clear link input if switching
        const linkInput = document.getElementById('pEvidenceLink');
        if (linkInput) linkInput.value = '';
    }
};

// Setup File Listener
document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('pEvidenceFile');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            const preview = document.getElementById('filePreview');

            if (!file) {
                if (preview) preview.style.display = 'none';
                return;
            }

            // Limit: 500KB
            if (file.size > 500 * 1024) {
                alert('⚠️ File too large! Maximum size is 500KB. Please use a Link for larger files.');
                this.value = ''; // Clear input
                if (preview) preview.style.display = 'none';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                document.getElementById('pEvidenceFileBase64').value = e.target.result;
                document.getElementById('pEvidenceFileName').value = file.name;

                // Show Preview
                if (preview) {
                    preview.style.display = 'flex';
                    preview.style.alignItems = 'center';
                    preview.style.gap = '8px';
                    preview.style.justifyContent = 'center';
                    preview.innerHTML = `
                        <i data-lucide="file-check" style="width: 16px; color: #00ff9d;"></i>
                        <span style="color: #00ff9d; font-weight: 600;">${file.name}</span>
                        <span style="color: var(--text-muted); font-size: 11px;">(${(file.size / 1024).toFixed(1)} KB)</span>
                    `;
                    lucide.createIcons();
                }
            };
            reader.readAsDataURL(file);
        });
    }
});



// Open Modal (Create or Edit)
window.openModal = function (initId = null) {
    try {
        console.log('openModal called with ID:', initId);
        const modal = document.getElementById('projectModal');

        if (!modal) {
            console.error('CRITICAL: #projectModal not found in DOM');
            alert('System Error: Modal template missing. Please reload.');
            return;
        }

        const form = document.getElementById('projectForm');
        const modalTitle = document.getElementById('modalTitle');
        const entitySelect = document.getElementById('projectEntity');
        // Check if entityText exists (it might be missing in some versions/views)
        const entityText = document.getElementById('projectEntityText') || null;

        // Entity name mapping
        const entityNames = {
            'ptpn1': 'PT Perkebunan Nusantara I',
            'ptpn3': 'PT Perkebunan Nusantara III (Persero)',
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

        // Populate dropdown if empty (Essential for owners.html)
        if (entitySelect && entitySelect.options.length === 0) {
            // Defined Order: PTPN3 First, then others
            const orderedKeys = [
                'ptpn3', // FIRST
                'ptpn1', 'ptpn4', 'sgn', // Subholdings
                'lpp', 'medika', 'rpn', 'kpbn', 'bio', 'kin', 'ikn' // Anak Perusahaan
            ];

            orderedKeys.forEach(key => {
                if (entityNames[key]) {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = entityNames[key];
                    // Styling for visibility (dark background for dark theme)
                    option.style.background = '#1a1a2e';
                    option.style.color = 'white';
                    entitySelect.appendChild(option);
                }
            });
        }

        // Reset form
        if (form) form.reset();

        // Helper to update Owner Options
        function updateOwnerOptions(entity, selectedOwner = null) {
            const ownerSelect = document.getElementById('projectOwnerSelect');
            if (!ownerSelect) return;

            ownerSelect.innerHTML = '<option value="" style="background: #1a1a2e; color: white;">Select Owner</option>';

            // 1. Get Dynamic Owners from Data (The "Sidebar" Source)
            let existingOwners = [];
            if (typeof allInitiatives !== 'undefined' && Array.isArray(allInitiatives)) {
                existingOwners = allInitiatives
                    .filter(i => i.entity === entity && i.owner)
                    .map(i => i.owner);
            }
            existingOwners = [...new Set(existingOwners)];

            // 2. Determine Source of Truth
            // If data exists, use Data ONLY (Strict Sync). 
            // If no data exists, use Defaults (OWNERS_BY_ENTITY) to allow initial entry.
            let owners = [];

            if (existingOwners.length > 0) {
                owners = existingOwners;
            } else {
                owners = [...(OWNERS_BY_ENTITY[entity] || [])];
            }

            // 3. Always include Custom Owners
            try {
                const stored = localStorage.getItem('custom_owners');
                if (stored) {
                    const allCustom = JSON.parse(stored);
                    const entityCustom = allCustom[entity] || [];
                    console.log(`[Owners] Entity: ${entity}, Custom:`, entityCustom);
                    owners = [...new Set([...owners, ...entityCustom])];
                }
            } catch (e) {
                console.error("Error loading custom owners", e);
            }

            console.log(`[Owners] Final List for ${entity}:`, owners);

            // Sort alphabetically
            owners.sort();

            if (owners.length > 0) {
                owners.forEach(owner => {
                    const opt = document.createElement('option');
                    opt.value = owner;
                    opt.textContent = owner;
                    opt.style.background = '#1a1a2e';
                    opt.style.color = 'white';
                    if (owner === selectedOwner) opt.selected = true;
                    ownerSelect.appendChild(opt);
                });
            }

            // ADD SPECIAL OPTION: + Add New Owner
            const addNewOpt = document.createElement('option');
            addNewOpt.value = '__NEW__';
            addNewOpt.textContent = '+ Add New Owner...';
            addNewOpt.style.fontWeight = 'bold';
            addNewOpt.style.color = '#00f2ea';
            addNewOpt.style.background = '#1a1a2e';
            ownerSelect.appendChild(addNewOpt);

            // Attach Listener (Remove old first to avoid duplicates)
            ownerSelect.onchange = function () {
                if (this.value === '__NEW__') {
                    // Prompt User
                    const newName = prompt("Enter new owner name:");
                    if (newName && newName.trim() !== "") {
                        // Save to Custom Owners
                        try {
                            const currentEntity = document.getElementById('projectEntity').value;
                            let allCustom = JSON.parse(localStorage.getItem('custom_owners') || '{}');
                            if (!allCustom[currentEntity]) allCustom[currentEntity] = [];

                            if (!allCustom[currentEntity].includes(newName)) {
                                allCustom[currentEntity].push(newName);
                                localStorage.setItem('custom_owners', JSON.stringify(allCustom));

                                // Refresh List
                                updateOwnerOptions(currentEntity, newName);
                            } else {
                                alert("Owner already exists!");
                                updateOwnerOptions(currentEntity, newName); // Select existing
                            }
                        } catch (e) {
                            console.error("Error saving new owner:", e);
                        }
                    } else {
                        // Reset to first option if cancelled
                        this.selectedIndex = 0;
                    }
                }
            };
        }

        // Attach change listener to Entity Select (for Admins)
        if (entitySelect) {
            // Remove old listeners to avoid duplicates (though openModal re-runs, direct assignment overrides)
            entitySelect.onchange = function () {
                updateOwnerOptions(this.value);
            };
        }
        const subInitContainer = document.getElementById('subInitiativesContainer');
        if (subInitContainer) subInitContainer.innerHTML = '';

        const indicatorsWrapper = document.getElementById('indicatorsContainer');
        if (indicatorsWrapper) indicatorsWrapper.innerHTML = '';

        // --- ROLE BASED UI ---
        // Get current user details securely
        const currentUsername = localStorage.getItem('currentUser');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = users.find(u => u.username === currentUsername);

        const isUserRole = currentUser && currentUser.role && currentUser.role.toLowerCase() === 'user';

        if (isUserRole && currentUser.entity) {
            // LOCK ENTITY FOR USER
            // Set select value (hidden but needed for form submission)
            if (entitySelect) {
                entitySelect.value = currentUser.entity;
                entitySelect.style.display = 'none'; // Hide dropdown
            }

            // Set text display
            if (entityText) {
                const displayEntity = entityNames[currentUser.entity] || currentUser.entity;
                entityText.value = displayEntity;
                entityText.style.display = 'block'; // Show readonly text
            }

            // Populate Owners for User's Entity
            updateOwnerOptions(currentUser.entity);

            // SHOW TEXT INPUT FOR OWNER (As requested "Blank Form")
            const ownerSelect = document.getElementById('projectOwnerSelect');
            const ownerInput = document.getElementById('projectOwnerInput');
            if (ownerSelect) {
                ownerSelect.style.display = 'none';
                ownerSelect.removeAttribute('required');
            }
            if (ownerInput) {
                ownerInput.style.display = 'block';
                ownerInput.setAttribute('required', 'true');
                ownerInput.value = ''; // Ensure blank for new
            }

        } else {
            // ADMIN OR NO USER: SHOW DROPDOWN
            if (entitySelect) entitySelect.style.display = 'block';
            if (entityText) entityText.style.display = 'none';

            // SHOW DROPDOWN FOR OWNER
            const ownerSelect = document.getElementById('projectOwnerSelect');
            const ownerInput = document.getElementById('projectOwnerInput');
            if (ownerSelect) {
                ownerSelect.style.display = 'block';
                ownerSelect.setAttribute('required', 'true');
            }
            if (ownerInput) {
                ownerInput.style.display = 'none';
                ownerInput.removeAttribute('required');
            }
        }
        // --- END ROLE BASED UI ---

        if (initId) {
            // Edit Mode - Use loose equality to matches string/number IDs
            const init = allInitiatives.find(i => i.id == initId);
            if (!init) {
                console.error('Initiative not found for ID:', initId);
                alert('Error: Initiative not found (ID: ' + initId + ')');
                return;
            }

            // CRITICAL: Set the hidden ID field so submit handler knows it's an update
            const pidField = document.getElementById('projectId');
            if (pidField) pidField.value = initId;

            if (modalTitle) modalTitle.innerText = "Edit Initiative";

            // Populate fields with null checks
            const pName = document.getElementById('pName');
            // const projectOwner = document.getElementById('projectOwner'); // OLD
            const pOutput = document.getElementById('pOutput');
            const pStatus = document.getElementById('pStatus');
            const pUrgency = document.getElementById('pUrgency');
            const pDate = document.getElementById('pDate'); // Corrected ID
            const pProgress = document.getElementById('pProgress');
            const pBudget = document.getElementById('pBudget');
            const pCost = document.getElementById('pCost');
            const pDescription = document.getElementById('pDescription');

            if (pName) pName.value = init.name;
            // UPDATE: Handle Owner Dropdown & Input
            // First populate options based on entity, then select the owner
            updateOwnerOptions(init.entity, init.owner);

            // Populate Input as well
            const ownerInput = document.getElementById('projectOwnerInput');
            if (ownerInput) ownerInput.value = init.owner;

            if (pOutput) pOutput.value = init.output || '';
            if (pStatus) pStatus.value = init.status;
            if (pUrgency) pUrgency.value = init.urgency;
            if (pDate) pDate.value = init.dueDate;
            if (pProgress) pProgress.value = init.progress || 0;
            if (pBudget) pBudget.value = init.budget || '';
            if (pCost) pCost.value = init.cost || '';
            if (pDescription) pDescription.value = init.description || '';

            // For edit mode:
            // IF User -> KEEP LOCKED (Don't showing dropdown)
            // IF Admin -> Show Dropdown
            if (isUserRole) {
                if (entitySelect) entitySelect.style.display = 'none';
                if (entityText) entityText.style.display = 'block';

                // Show Input for User
                const ownerSelect = document.getElementById('projectOwnerSelect');
                if (ownerSelect) {
                    ownerSelect.style.display = 'none';
                    ownerSelect.removeAttribute('required');
                }
                if (ownerInput) {
                    ownerInput.style.display = 'block';
                    ownerInput.setAttribute('required', 'true');
                }

            } else {
                if (entitySelect) {
                    entitySelect.value = init.entity;
                    entitySelect.style.display = 'block';
                    entitySelect.removeAttribute('disabled');
                }
                if (entityText) entityText.style.display = 'none';

                // Show Dropdown for Admin
                const ownerSelect = document.getElementById('projectOwnerSelect');
                if (ownerSelect) {
                    ownerSelect.style.display = 'block';
                    ownerSelect.setAttribute('required', 'true');
                }
                if (ownerInput) {
                    ownerInput.style.display = 'none';
                    ownerInput.removeAttribute('required');
                }
            }

            // Render sub-initiatives
            if (init.subInitiatives && init.subInitiatives.length > 0) {
                init.subInitiatives.forEach(sub => {
                    if (typeof addSubInitiativeField === 'function') {
                        addSubInitiativeField(sub.name, sub.weight, sub.dueDate, sub.progress);
                    }
                });
            }

            // Render Indicators
            if (init.indicators && init.indicators.length > 0) {
                init.indicators.forEach(ind => {
                    if (typeof addIndicatorField === 'function') {
                        addIndicatorField(ind.type, ind.metric, ind.uom, ind.target, ind.realization || '');
                    }
                });
            }

            // Show Current Evidence
            const evidenceDisplay = document.getElementById('currentEvidenceDisplay');
            const evidenceContent = document.getElementById('currentEvidenceContent');
            const linkInput = document.getElementById('pEvidenceLink');

            // Reset state
            if (evidenceDisplay) evidenceDisplay.style.display = 'none';

            if (init.evidence) {
                if (evidenceDisplay && evidenceContent) {
                    evidenceDisplay.style.display = 'block';
                    if (init.evidence.type === 'link') {
                        evidenceContent.innerHTML = `<a href="${init.evidence.url}" target="_blank" style="color: #0088ff; text-decoration: underline;">${init.evidence.url}</a> <i data-lucide="external-link" style="width: 12px; display: inline;"></i>`;
                        // Auto-fill input too for editing
                        if (linkInput) {
                            linkInput.value = init.evidence.url;
                            if (typeof toggleEvidenceType === 'function') toggleEvidenceType('link');
                        }
                    } else if (init.evidence.type === 'file') {
                        evidenceContent.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span style="color: white; font-weight: 600;">${init.evidence.name}</span>
                                <a href="${init.evidence.content}" download="${init.evidence.name}" 
                                   style="padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 4px; color: #00ff9d; font-size: 11px; text-decoration: none;">
                                   Download File
                                </a>
                            </div>
                        `;
                        if (typeof toggleEvidenceType === 'function') toggleEvidenceType('file');
                    }
                }
            } else {
                if (typeof toggleEvidenceType === 'function') toggleEvidenceType('link'); // Default to link
            }

        } else {
            // Create Mode
            if (modalTitle) modalTitle.innerText = "Insert Initiative";

            const currentUser = window.rbac?.currentUser;
            const entityContainer = document.getElementById('entityFieldContainer');

            if (currentUser && window.rbac?.isUser()) {
                // ... (user logic remains same)
            } else {
                // For admin: show dropdown and container
                if (entityContainer) entityContainer.style.display = 'block';

                if (entitySelect) {
                    entitySelect.style.display = 'block';
                    entitySelect.removeAttribute('disabled');
                    // Ensure text is visible
                    Array.from(entitySelect.options).forEach(opt => {
                        opt.style.background = '#1a1a2e';
                        opt.style.color = 'white';
                    });
                }
                if (entityText) entityText.style.display = 'none';

                // --- NEW: Toggle Owner Input vs Select for Admin ---
                const ownerSelect = document.getElementById('projectOwnerSelect');
                const ownerInput = document.getElementById('projectOwnerInput');

                if (ownerSelect) {
                    ownerSelect.style.display = 'block';
                    ownerSelect.setAttribute('required', 'true');
                }
                if (ownerInput) {
                    ownerInput.style.display = 'none';
                    ownerInput.removeAttribute('required');
                }

                // Trigger option update based on default entity
                if (entitySelect && typeof updateOwnerOptions === 'function') {
                    updateOwnerOptions(entitySelect.value);
                }
            }

            if (typeof addSubInitiativeField === 'function') addSubInitiativeField();
            // Add one empty indicator by default for new projects
            if (typeof window.addIndicatorField === 'function') addIndicatorField();

            // Reset Evidence UI
            const evidenceDisplay = document.getElementById('currentEvidenceDisplay');
            if (evidenceDisplay) evidenceDisplay.style.display = 'none';
            if (typeof toggleEvidenceType === 'function') toggleEvidenceType('link');
        }

        // --- NEW: Status Dropdown Styling (For Visibility) ---
        const pStatus = document.getElementById('pStatus');
        if (pStatus) {
            // Apply dark background to options to fix visibility
            Array.from(pStatus.options).forEach(opt => {
                opt.style.background = '#1a1a2e';
                opt.style.color = 'white';
            });
        }

        // --- NEW: Auto-Calculate Urgency based on Due Date ---
        const pDueDate = document.getElementById('pDate'); // Corrected ID
        const pUrgency = document.getElementById('pUrgency');

        if (pDueDate && pUrgency) {
            // Remove existing listeners to avoid duplicates if any
            const newDueDate = pDueDate.cloneNode(true);
            pDueDate.parentNode.replaceChild(newDueDate, pDueDate);

            // Verify we re-grab the element after replace
            const freshDueDate = document.getElementById('pDate');

            freshDueDate.addEventListener('change', function () {
                const urgencyVal = calculateUrgency(this.value);
                pUrgency.value = urgencyVal;
            });
        }

        modal.style.display = 'flex';
        console.log('✅ Modal opened successfully');

    } catch (err) {
        console.error('❌ Error in openModal:', err);
        alert('System Error opening modal: ' + err.message);
    }
};

window.closeModal = function () {
    const modal = document.getElementById('projectModal');
    modal.style.display = 'none';
};

// Auto Calculate Urgency
function calculateUrgency(dateString) {
    if (!dateString) return "Low";
    const due = new Date(dateString);
    const now = new Date();
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) return "High";
    if (diffDays < 30) return "Medium";
    return "Low";
}

// Handle Form Submit (Create or Edit)
window.handleProjectSubmit = function (e) {
    e.preventDefault();

    // Re-enable entity select before getting value (in case it was disabled)
    // This is crucial for retrieving the value even if the user can't change it
    const entitySelect = document.getElementById('projectEntity');
    if (entitySelect) entitySelect.removeAttribute('disabled');

    // Get Values - using CORRECT IDs from projects.html
    // Get Values - using CORRECT IDs from projects.html
    const id = document.getElementById('projectId').value;
    const nameInput = document.getElementById('pName');
    // const ownerInput = document.getElementById('projectOwner'); // OLD
    const outputInput = document.getElementById('pOutput');
    const dateInput = document.getElementById('pDate'); // Correct ID is pDate
    const progressInput = document.getElementById('pProgress');
    const budgetInput = document.getElementById('pBudget');
    const costInput = document.getElementById('pCost');

    // Get Value Based on Visible Input
    const ownerSelect = document.getElementById('projectOwnerSelect');
    const ownerInput = document.getElementById('projectOwnerInput');
    let finalOwner = '';

    // Check if user is user role
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUserInfo = users.find(u => u.username === localStorage.getItem('currentUser'));
    const isUserRole = currentUserInfo && currentUserInfo.role && currentUserInfo.role.toLowerCase() === 'user';

    // Explicitly check visibility or role to grab the correct value
    if (isUserRole) {
        finalOwner = ownerInput ? ownerInput.value : '';
    } else {
        finalOwner = ownerSelect ? ownerSelect.value : '';
    }

    // Fallback if empty (should be required though)
    if (!finalOwner && ownerInput && ownerInput.value) finalOwner = ownerInput.value;


    // Safely get values with defaults
    const name = nameInput ? nameInput.value : 'New Initiative';
    const owner = finalOwner;
    const output = outputInput ? outputInput.value : '';
    const entity = entitySelect ? entitySelect.value : 'All';
    const dueDate = dateInput ? dateInput.value : '';

    // Auto-calculate properties
    const urgency = calculateUrgency(dueDate);
    const status = "Not Started"; // Default status for new items

    const progress = progressInput ? (parseInt(progressInput.value) || 0) : 0;
    const budget = budgetInput ? (parseInt(budgetInput.value) || 0) : 0;
    const cost = costInput ? (parseInt(costInput.value) || 0) : 0;

    // Get current user for both creation and updates/notifications
    const currentUsername = localStorage.getItem('currentUser') || 'guest';

    // Collect Sub-Initiatives (Key Activities)
    const keyActivities = [];
    let totalWeight = 0;

    document.querySelectorAll('.sub-init-group').forEach(group => {
        const subNameInput = group.querySelector('.sub-init-name');
        const subWeightInput = group.querySelector('.sub-init-weight');
        const subDateInput = group.querySelector('.sub-init-date');
        const subProgressInput = group.querySelector('.sub-init-progress');

        const subName = subNameInput ? subNameInput.value : '';
        const subWeight = subWeightInput ? (parseFloat(subWeightInput.value) || 0) : 0;
        const subDate = subDateInput ? subDateInput.value : '';
        const subProgress = subProgressInput ? (parseFloat(subProgressInput.value) || 0) : 0;

        if (subName) {
            totalWeight += subWeight;
            keyActivities.push({
                name: subName,
                weight: subWeight,
                dueDate: subDate,
                progress: subProgress,
                todos: [] // Initialize todos
            });
        }
    });

    // Collect Indicators

    // Collect Indicators
    const indicators = [];
    document.querySelectorAll('.indicator-group').forEach(group => {
        const type = group.querySelector('.indicator-type').value;
        const metric = group.querySelector('.indicator-metric').value;
        const uom = group.querySelector('.indicator-uom').value;
        const target = group.querySelector('.indicator-target').value;
        const realization = group.querySelector('.indicator-realization').value;

        if (metric) { // Only save if description is provided
            indicators.push({ type, metric, uom, target, realization });
        }
    });

    // --- MODIFIED: Prepare for Evidence Step (Do not save yet) ---

    // Store data temporarily
    window.tempProjectData = {
        id: id,
        name: name,
        owner: owner,
        output: output,
        entity: entity,
        dueDate: dueDate,
        urgency: urgency,
        budget: budget,
        cost: cost,
        status: status,
        progress: progress,
        subInitiatives: keyActivities,
        indicators: indicators,
        createdBy: currentUsername,
        isNew: !id
    };

    // Close Main Modal
    closeModal();

    // Open Evidence Modal
    const evidenceModal = document.getElementById('evidenceModal');
    if (evidenceModal) {
        evidenceModal.style.display = 'flex';
        // Reset Evidence Inputs with checks
        const eLink = document.getElementById('pEvidenceLink');
        const eFile = document.getElementById('pEvidenceFile');
        const eBase64 = document.getElementById('pEvidenceFileBase64');
        const eName = document.getElementById('pEvidenceFileName');

        if (eLink) eLink.value = '';
        if (eFile) eFile.value = '';
        if (eBase64) eBase64.value = '';
        if (eName) eName.value = '';

        if (typeof toggleEvidenceType === 'function') {
            toggleEvidenceType('link');
        }
    } else {
        // Fallback if modal missing
        console.error("Evidence Modal not found!");
        // If modal is missing, we must finalize save here or nothing happens
        submitEvidence();
    }
};

window.cancelEvidence = function () {
    console.log('Evidence upload cancelled');
    document.getElementById('evidenceModal').style.display = 'none';
    document.getElementById('projectModal').style.display = 'flex';
};

// Helper to save projects
// Helper to save projects
window.saveProjectsToLocalStorage = function () {
    if (window.dataService) {
        window.dataService.saveLocalData(allInitiatives);
    } else {
        localStorage.setItem('initiatives', JSON.stringify(allInitiatives));
    }
    console.log('Projects saved to localStorage (via DataService if avail)');
};

// Helper: Sync to Cloud
window.saveDataToCloud = function (item) {
    // 1. Save Local
    window.saveProjectsToLocalStorage();
    // 2. Sync Cloud
    if (window.dataService && item) {
        window.dataService.saveInitiative(item);
    }
};

window.submitEvidence = function () {
    console.log('🚀 submitEvidence called');
    try {
        // Capture Evidence Safely
        const evidenceLinkEl = document.getElementById('pEvidenceLink');
        const evidenceFileBase64El = document.getElementById('pEvidenceFileBase64');
        const evidenceFileNameEl = document.getElementById('pEvidenceFileName');

        const evidenceLink = evidenceLinkEl ? evidenceLinkEl.value : '';
        const evidenceFileBase64 = evidenceFileBase64El ? evidenceFileBase64El.value : '';
        const evidenceFileName = evidenceFileNameEl ? evidenceFileNameEl.value : '';

        console.log('Evidence Input:', { link: !!evidenceLink, file: !!evidenceFileBase64 });

        let evidence = null;
        if (evidenceFileBase64) {
            evidence = {
                type: 'file',
                name: evidenceFileName,
                content: evidenceFileBase64,
                timestamp: new Date().toISOString()
            };
        } else if (evidenceLink) {
            evidence = {
                type: 'link',
                url: evidenceLink,
                timestamp: new Date().toISOString()
            };
        }

        // Retrieve Temp Data
        const data = window.tempProjectData;
        if (!data) {
            console.error('❌ tempProjectData is missing!');
            alert('System Error: Session data lost. Please try again.');
            return;
        }

        console.log('Temp Data found:', data);
        const currentUsername = data.createdBy || localStorage.getItem('currentUser') || 'guest';

        if (data.id && !data.isNew) {
            // --- UPDATE EXISTING ---
            // Loose matching for ID (String vs Int)
            const project = allInitiatives.find(i => i.id == data.id);
            if (!project) {
                console.error('❌ Project not found in allInitiatives ID:', data.id);
                alert('Error: Project not found. It might have been deleted.');
                return;
            }

            console.log('Found Project:', project.name);
            const isUser = window.rbac && window.rbac.isUser();

            if (isUser) {
                // USER: Create Pending Update
                console.log('Processing as USER (Pending Update)');
                project.pendingUpdate = {
                    name: data.name,
                    owner: data.owner,
                    output: data.output,
                    entity: data.entity,
                    dueDate: data.dueDate,
                    urgency: data.urgency,
                    budget: data.budget,
                    cost: data.cost,
                    subInitiatives: data.subInitiatives,
                    indicators: data.indicators,
                    evidence: evidence,
                    updatedBy: currentUsername,
                    updatedAt: new Date().toISOString()
                };

                // Recalc logic for pending...
                let proposedProgress = 0;
                if (data.subInitiatives && data.subInitiatives.length > 0) {
                    let weightedSum = 0;
                    let totalW = 0;
                    data.subInitiatives.forEach(s => {
                        weightedSum += (s.progress || 0) * (s.weight || 0);
                        totalW += (s.weight || 0);
                    });
                    proposedProgress = totalW > 0 ? Math.round(weightedSum / 100) :
                        Math.round(data.subInitiatives.reduce((a, b) => a + (b.progress || 0), 0) / data.subInitiatives.length);
                } else {
                    proposedProgress = data.progress;
                }
                project.pendingUpdate.progress = proposedProgress;

                let proposedStatus = "Not Started";
                if (proposedProgress === 100) proposedStatus = "Done";
                else if (proposedProgress > 0) proposedStatus = "On Going";
                project.pendingUpdate.status = proposedStatus;

                project.approvalStatus = 'pending_update';

                // Notifications
                if (window.addNotification) {
                    window.addNotification('info', `Update request sent for: "${data.name}"`, currentUsername);
                    window.addNotification('warning', `Update request from ${currentUsername}`, 'admin');
                }

                // Close & Success
                const evModal = document.getElementById('evidenceModal');
                if (evModal) evModal.style.display = 'none';

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: 'Initiative Submitted!',
                        text: 'Your update request has been sent for review.',
                        icon: 'success',
                        background: '#1a1a2e',
                        color: 'white',
                        confirmButtonColor: '#0088ff'
                    }).then(() => {
                        window.saveDataToCloud(project);
                        window.tempProjectData = null;
                        renderProjects();
                    });
                } else {
                    alert('Initiative Submitted! Update request sent.');
                    window.saveDataToCloud(project);
                    window.tempProjectData = null;
                    renderProjects();
                }

            } else {
                // ADMIN: Update Directly
                console.log('Processing as ADMIN (Direct Update)');
                project.name = data.name;
                project.owner = data.owner;
                project.output = data.output;
                project.entity = data.entity;
                project.dueDate = data.dueDate;
                project.urgency = data.urgency;
                project.budget = data.budget;
                project.cost = data.cost;
                project.subInitiatives = data.subInitiatives;
                project.indicators = data.indicators;
                // Update Evidence only if new evidence provided, otherwise keep old? 
                // Usually overwrite if specific action, but here we assume user wants to attach.
                if (evidence) project.evidence = evidence;

                if (data.subInitiatives && data.subInitiatives.length > 0) {
                    recalculateProgress(project.id);
                } else {
                    project.progress = data.progress;
                }

                if (window.addNotification) {
                    window.addNotification('info', `Updated initiative: "${data.name}"`, currentUsername);
                }

                const evModal = document.getElementById('evidenceModal');
                if (evModal) evModal.style.display = 'none';

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Initiative updated with evidence successfully.',
                        icon: 'success',
                        background: '#1a1a2e',
                        color: 'white',
                        confirmButtonColor: '#00ff9d'
                    }).then(() => {
                        window.saveDataToCloud(project);
                        window.tempProjectData = null;
                        renderProjects();
                    });
                } else {
                    alert('Success! Initiative updated.');
                    window.saveDataToCloud(project);
                    window.tempProjectData = null;
                    renderProjects();
                }
            }

        } else {
            // --- CREATE NEW ---
            console.log('Creating NEW Initiative');
            const isUser = window.rbac && window.rbac.isUser();
            const approvalStatus = isUser ? 'pending' : 'approved';

            const newProject = {
                id: Date.now(),
                name: data.name,
                owner: data.owner,
                output: data.output,
                entity: data.entity,
                dueDate: data.dueDate,
                urgency: data.urgency,
                budget: data.budget,
                cost: data.cost,
                status: data.status,
                progress: (data.subInitiatives && data.subInitiatives.length > 0) ? 0 : data.progress,
                subInitiatives: data.subInitiatives || [],
                indicators: data.indicators || [],
                evidence: evidence,
                createdBy: currentUsername,
                approvalStatus: approvalStatus
            };

            // Recalculate initial progress if needed
            if (newProject.subInitiatives.length > 0) {
                // Initial progress usually 0, but if user manually set progress in activities?
                // Standard logic: new items starts at 0 unless manually set.
            }

            allInitiatives.push(newProject);

            if (window.addNotification) {
                window.addNotification('success', `Created new initiative: "${data.name}"`, currentUsername);
                if (isUser) {
                    window.addNotification('warning', `New initiative approval form ${currentUsername}`, 'admin');
                }
            }

            const evModal = document.getElementById('evidenceModal');
            if (evModal) evModal.style.display = 'none';

            let msgTitle = 'Initiative Created!';
            let msgText = isUser ? 'Waiting for Administrator review.' : 'New initiative created successfully.';

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: msgTitle,
                    text: msgText,
                    icon: 'success',
                    background: '#1a1a2e',
                    color: 'white',
                    confirmButtonColor: '#0088ff'
                }).then(() => {
                    window.saveDataToCloud(newProject);
                    window.tempProjectData = null;
                    renderProjects();
                });
            } else {
                alert(msgTitle + '\n' + msgText);
                window.saveDataToCloud(newProject);
                window.tempProjectData = null;
                renderProjects();
            }
        }

        // Finalize
        saveProjectsToLocalStorage();
        renderProjects();
        if (typeof updateDashboard === 'function') updateDashboard();

        // Reset forms
        const form = document.getElementById('projectForm');
        if (form) form.reset();
        const subCont = document.getElementById('subInitiativesContainer');
        if (subCont) subCont.innerHTML = '';
        const indCont = document.getElementById('indicatorsContainer');
        if (indCont) indCont.innerHTML = '';
        const pid = document.getElementById('projectId');
        if (pid) pid.value = '';

        console.log('✅ submitEvidence process complete');

    } catch (err) {
        console.error('CRITICAL ERROR in submitEvidence:', err);
        alert('An error occurred while submitting: ' + err.message);
    }
};

// --- END MODAL LOGIC ---

// Utility: Toggle Actions Menu
// Utility: Toggle Actions Menu
window.toggleActions = function (event, id) {
    // Prevent event from triggering other click listeners immediately
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Close any existing menus first
    document.querySelectorAll('.action-menu').forEach(el => el.remove());

    const trigger = event.target.closest('i, svg, button') || event.target;
    const rect = trigger.getBoundingClientRect();

    // Create Menu Container
    const menu = document.createElement('div');
    menu.className = 'action-menu';
    // Style directly to ensure visibility
    Object.assign(menu.style, {
        position: 'fixed', // Use fixed to avoid scroll issues
        top: `${rect.bottom + 5}px`,
        left: `${rect.right - 160}px`, // Align right edge
        minWidth: '160px',
        background: '#1a1a2e',
        border: '1px solid #333',
        borderRadius: '8px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.7)',
        zIndex: '2147483647', // Max Z-Index
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    });

    // Option: Update
    const editOption = document.createElement('div');
    Object.assign(editOption.style, {
        padding: '12px 20px',
        cursor: 'pointer',
        color: 'white',
        borderBottom: '1px solid #333',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    });
    editOption.innerHTML = '<span>✏️</span> <span>Update Initiative</span>';

    // Use direct onclick for reliability
    editOption.onclick = function (e) {
        console.log('Update clicked', id);
        // alert('Update Clicked: ' + id); // Debug removed
        if (typeof window.openModal === 'function') {
            window.openModal(id);
        } else {
            alert('Error: openModal function missing');
        }
        menu.remove();
    };

    // Option: Delete
    const deleteOption = document.createElement('div');
    Object.assign(deleteOption.style, {
        padding: '12px 20px',
        cursor: 'pointer',
        color: '#ff0055',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    });
    deleteOption.innerHTML = '<span>🗑️</span> <span>Delete</span>';

    deleteOption.onclick = function (e) {
        console.log('Delete clicked', id);
        if (typeof window.deleteProject === 'function') {
            window.deleteProject(id);
        }
        menu.remove();
    };

    // Hover Effects
    const addHover = (el, bg) => {
        el.onmouseenter = () => el.style.background = bg;
        el.onmouseleave = () => el.style.background = 'transparent';
    };
    addHover(editOption, 'rgba(255,255,255,0.05)');
    addHover(deleteOption, 'rgba(255,0,85,0.1)');

    menu.appendChild(editOption);
    menu.appendChild(deleteOption);
    document.body.appendChild(menu);

    // Close on outside click
    setTimeout(() => {
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
    }, 100); // Slight delay to prevent immediate firing
};

window.deleteProject = function (id) {
    console.log('deleteProject called with ID:', id);

    // 1. Check User Role
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUserInfo = users.find(u => u.username === localStorage.getItem('currentUser'));
    const isUserRole = currentUserInfo && currentUserInfo.role && currentUserInfo.role.toLowerCase() === 'user';
    const initId = id;

    // 2. Load latest data
    const initiative = allInitiatives.find(i => i.id == id);

    if (!initiative) {
        showAlert('Error', 'Initiative not found.');
        return;
    }

    // 3. Logic Branch
    if (isUserRole) {
        // --- USER: REQUEST DELETE ---
        showConfirmation('Request Deletion', 'Request deletion for this initiative? Admin approval required.', function () {
            initiative.approvalStatus = 'pending_delete';
            initiative.updatedAt = new Date().toISOString();

            saveState(); // Uses global saveState

            // Notification
            if (window.addNotification) {
                window.addNotification('info', `Deletion requested for "${initiative.name}"`, currentUserInfo.username);
            }

            // Replaced Alert with Toast/Notification if available, or just refresh
            if (window.showToast) window.showToast('Deletion request sent to Admin');

            renderProjects();
            closeModal();
        });

    } else {
        // --- ADMIN: DELETE IMMEDIATELY ---
        showConfirmation('Delete Initiative', 'Are you sure you want to delete this initiative? This cannot be undone.', function () {
            // Remove from global array
            const globalIndex = allInitiatives.findIndex(i => i.id == id);
            if (globalIndex !== -1) allInitiatives.splice(globalIndex, 1);

            saveState();

            // Notification
            if (window.addNotification) {
                window.addNotification('warning', `Initiative "${initiative.name}" was deleted`, 'Admin');
            }

            renderProjects();
            closeModal();

            if (window.showToast) window.showToast('Initiative deleted successfully');
        });
    }
};



// Handler: Update Activity Progress
window.updateActivityProgress = function (initId, actIndex, newProgress) {
    console.log('🎯 updateActivityProgress CALLED:', { initId, actIndex, newProgress });
    console.log('📦 allInitiatives:', allInitiatives?.length, 'items');

    // Find in ALL initiatives (not filtered) to ensure we update the right data
    const project = allInitiatives.find(i => i.id === initId);
    if (!project || !project.subInitiatives[actIndex]) {
        console.error('❌ Project or activity not found!', { initId, actIndex, found: !!project });
        return;
    }

    console.log(`📊 Updating progress for "${project.name}" activity ${actIndex} to ${newProgress}%`);

    const currentUsername = localStorage.getItem('currentUser');

    // Check if regular user - create pending update
    if (window.rbac && window.rbac.isUser()) {
        // Initialize pendingUpdate with current state if it doesn't exist
        if (!project.pendingUpdate) {
            project.pendingUpdate = JSON.parse(JSON.stringify(project));
            delete project.pendingUpdate.id; // Don't duplicate ID in metadata
            delete project.pendingUpdate.approvalStatus;
            project.pendingUpdate.updatedBy = currentUsername;
            project.pendingUpdate.updatedAt = new Date().toISOString();
        }

        // Update the specific activity in pendingUpdate
        if (project.pendingUpdate.subInitiatives && project.pendingUpdate.subInitiatives[actIndex]) {
            project.pendingUpdate.subInitiatives[actIndex].progress = parseFloat(newProgress);

            // Recalculate progress for pendingUpdate
            const keyActivities = project.pendingUpdate.subInitiatives;
            let weightedProgressSum = 0;
            let totalWeight = 0;
            keyActivities.forEach(sub => {
                const weight = sub.weight || 0;
                const progress = sub.progress || 0;
                weightedProgressSum += (progress * weight);
                totalWeight += weight;
            });

            let newTotalProgress = 0;
            if (totalWeight > 0) {
                newTotalProgress = Math.round(weightedProgressSum / 100);
            } else {
                const totalP = keyActivities.reduce((sum, s) => sum + (s.progress || 0), 0);
                newTotalProgress = Math.round(totalP / keyActivities.length);
            }

            project.pendingUpdate.progress = newTotalProgress;

            if (newTotalProgress === 100) project.pendingUpdate.status = "Done";
            else if (newTotalProgress > 0) project.pendingUpdate.status = "On Going";
        }

        project.approvalStatus = 'pending_update';
        saveState();

        if (window.addNotification) {
            window.addNotification('info', `Progress update request sent for "${project.name}"`, currentUsername);
            // Notify Admin
            window.addNotification('warning', `Progress update request from ${currentUsername} for "${project.name}"`, 'admin');
        }
        // No broadcast for request

    } else {
        // Admin - direct update
        project.subInitiatives[actIndex].progress = parseFloat(newProgress);
        recalculateProgress(initId);
    }

    // Notification
    if (window.addNotification) {
        window.addNotification('info', `Progress updated for "${project.name}" - ${project.subInitiatives[actIndex].name}: ${newProgress}%`, 'System');
    }

    // Broadcast to all users if admin updated someone else's initiative
    if (window.rbac?.isAdmin() && project.createdBy !== currentUsername && window.notificationManager) {
        window.notificationManager.broadcastToAllUsers(
            'info',
            `Administrator updated progress for "${project.name}": ${newProgress}%`,
            currentUsername
        );
    }
};

// Utility: Recalculate Parent Progress (Weighted)
function recalculateProgress(initiativeId) {
    // Find in ALL initiatives (not filtered)
    const initiative = allInitiatives.find(i => i.id === initiativeId);
    if (!initiative) return;

    // Handle empty activities
    if (!initiative.subInitiatives || initiative.subInitiatives.length === 0) {
        return;
    }

    let weightedProgressSum = 0;
    let totalWeight = 0;

    initiative.subInitiatives.forEach(sub => {
        const weight = sub.weight || 0;
        const progress = sub.progress || 0;
        weightedProgressSum += (progress * weight);
        totalWeight += weight;
    });

    // If total weight is > 0, calculate percentage based on 100 base
    if (totalWeight > 0) {
        initiative.progress = Math.round(weightedProgressSum / 100);
    } else {
        // Fallback: Average if weights are missing
        const totalP = initiative.subInitiatives.reduce((sum, s) => sum + (s.progress || 0), 0);
        initiative.progress = Math.round(totalP / initiative.subInitiatives.length);
    }

    // Update Status
    if (initiative.progress === 100) initiative.status = "Done";
    else if (initiative.progress > 0) initiative.status = "On Going";
    else initiative.status = "Not Started";

    saveState();
}

// Filter State
let activeEntityFilter = 'all';
let activeStatusFilter = 'all';

window.selectEntityFilter = function (entityId, btn) {
    activeEntityFilter = entityId;

    // UI Update (Only Entity Buttons)
    document.querySelectorAll('.entity-btn:not(.status-btn)').forEach(b => b.classList.remove('active'));
    if (btn) {
        btn.classList.add('active');
    } else {
        // Try to find button if triggered programmatically
        const targetBtn = document.querySelector(`.entity-btn[data-entity="${entityId}"]`);
        if (targetBtn) targetBtn.classList.add('active');
    }

    // Update Title
    const titleEl = document.getElementById('viewTitle');
    if (titleEl) {
        if (entityId === 'all') titleEl.innerText = "All Initiatives";
        else titleEl.innerText = (typeof ENTITIES !== 'undefined' ? ENTITIES[entityId] : entityId);
    }

    renderProjects();
}

window.selectStatusFilter = function (status) {
    activeStatusFilter = status;

    // Update Dropdown Color
    const select = document.getElementById('statusFilterSelect');
    if (select) {
        let color = 'white';
        switch (status) {
            case 'Done': color = '#00ff9d'; break;
            case 'On Going': color = '#00d9ff'; break;
            case 'Not Started': color = '#aaaaaa'; break;
            case 'Hold': color = '#ff9f43'; break;
            case 'Carry Over': color = '#ffbf00'; break;
            case 'Cancelled': color = '#ff0055'; break;
        }
        select.style.color = color;
        select.style.borderColor = (status === 'all') ? 'rgba(255,255,255,0.2)' : color;
    }

    currentStatusFilter = status;
    renderProjects();
}

// Entity Filter Selection
window.selectEntityFilter = function (entity) {
    currentEntityFilter = entity;

    // Update button states
    document.querySelectorAll('.entity-btn').forEach(btn => {
        if (btn.getAttribute('data-entity') === entity) {
            btn.style.background = 'linear-gradient(135deg, #0088ff, #00f2ea)';
            btn.style.color = 'white';
        } else if (btn.getAttribute('data-entity') === 'all') {
            btn.style.background = entity === 'all' ? 'linear-gradient(135deg, #0088ff, #00f2ea)' : 'rgba(255,255,255,0.05)';
            btn.style.color = entity === 'all' ? 'white' : 'white';
        } else {
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.color = 'white';
        }
    });

    renderProjects();
};

// Render Function
// Persist Expanded State
const expandedProjectIds = new Set();

// Render Function
function renderProjects() {
    if (!container) return;

    container.innerHTML = '';

    const urlParams = new URLSearchParams(window.location.search);
    const filterOwner = urlParams.get('owner');

    // Initiatives array is already filtered by entity at initialization
    // No need for additional RBAC filtering here
    let displayInitiatives = initiatives;

    // Apply entity filter from sidebar
    if (currentEntityFilter && currentEntityFilter !== 'all') {
        displayInitiatives = displayInitiatives.filter(p => p.entity === currentEntityFilter);
    }

    // RBAC: For Regular Users, HIDE Pending Initiatives from Main List
    // They should only see them in "My Initiatives" modal
    if (window.rbac && window.rbac.isUser()) {
        displayInitiatives = displayInitiatives.filter(p => {
            // Show if approved
            if (p.approvalStatus === 'approved' || p.approvalStatus === 'pending_update' || !p.approvalStatus) return true;
            // Hide if pending (even if own, as per request)
            return false;
        });
    }

    // Apply status filter
    if (currentStatusFilter && currentStatusFilter !== 'all') {
        displayInitiatives = displayInitiatives.filter(p => p.status === currentStatusFilter);
    }

    // Apply owner filter from URL (Loose Matching)
    if (filterOwner) {
        const target = decodeURIComponent(filterOwner).toLowerCase().trim();
        displayInitiatives = displayInitiatives.filter(i => {
            const owner = (i.owner || '').toLowerCase().trim();
            return owner.includes(target) || target.includes(owner);
        });
        // Filter UI ...
        const filterHeader = document.createElement('div');
        filterHeader.style.marginBottom = '20px';
        filterHeader.style.padding = '10px';
        filterHeader.style.background = 'rgba(0, 242, 234, 0.1)';
        filterHeader.style.borderRadius = '8px';
        filterHeader.style.border = '1px solid var(--primary)';
        filterHeader.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <span style="color: var(--text-muted);">Filtering by Owner:</span> 
                    <strong style="color: white;">${filterOwner.replace('Sub Divisi ', '')}</strong>
                </div>
                <button class="btn" style="padding: 5px 10px; font-size: 12px; background: rgba(255,255,255,0.1);" 
                    onclick="window.location.href='projects.html'">
                    Clear Filter
                </button>
            </div>
        `;
        container.appendChild(filterHeader);
    }

    if (displayInitiatives.length === 0) {
        container.innerHTML += `<div style="text-align: center; color: var(--text-muted); padding: 40px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">No initiatives found.</div>`;
    }

    displayInitiatives.forEach(init => {
        const card = document.createElement('div');
        card.className = 'initiative-card';

        // Check State
        const isExpanded = expandedProjectIds.has(init.id);

        // Header
        const header = document.createElement('div');
        header.className = `initiative-header ${isExpanded ? 'expanded' : ''}`;
        header.style.position = 'relative';
        header.style.display = 'grid';
        header.style.gridTemplateColumns = '30px 2fr 1.5fr 1fr 1fr 0.8fr 0.6fr 1.2fr 1fr 30px';
        header.style.alignItems = 'center';
        header.style.gap = '10px';

        header.onclick = (e) => {
            // Don't expand if clicking on interactive elements or icons
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' ||
                e.target.tagName === 'SELECT' || e.target.tagName === 'I' ||
                e.target.tagName === 'svg' || e.target.tagName === 'path' ||
                e.target.closest('.action-menu')) return;

            const content = card.querySelector('.nested-content');
            const icon = header.querySelector('.chevron-icon');

            if (expandedProjectIds.has(init.id)) {
                expandedProjectIds.delete(init.id);
                content.classList.remove('show');
                header.classList.remove('expanded');
                icon.setAttribute("data-lucide", "chevron-right");
            } else {
                expandedProjectIds.add(init.id);
                content.classList.add('show');
                header.classList.add('expanded');
                icon.setAttribute("data-lucide", "chevron-down");
            }
            lucide.createIcons();
        };

        const statusColors = {
            'Done': '#00ff9d',
            'On Going': '#00d9ff',
            'Not Started': '#aaaaaa',
            'Hold': '#ff9f43',
            'Carry Over': '#ffbf00',
            'Cancelled': '#ff0055'
        };

        const statusOptions = ['Not Started', 'On Going', 'Done', 'Hold', 'Carry Over', 'Cancelled'];

        // Determine current style
        const currentColor = statusColors[init.status] || 'white';
        const currentBorder = (init.status && init.status !== 'Not Started') ? currentColor : '#333';

        let statusSelect;

        // RBAC: Only Admin can change status via dropdown
        // Regular users see a static badge
        if (window.rbac && window.rbac.isUser()) {
            statusSelect = `
                <div style="background: rgba(255,255,255,0.05); color: ${currentColor}; border: 1px solid ${currentBorder}; border-radius: 4px; padding: 4px 8px; font-size: 11px; width: 100%; font-weight: 600; text-align: center;">
                    ${init.status || 'Not Started'}
                </div>
             `;
        } else {
            statusSelect = `
                <select onclick="event.stopPropagation()" onchange="updateProjectStatus(${init.id}, this.value)" 
                    style="background: #1a1a2e; color: ${currentColor}; border: 1px solid ${currentBorder}; border-radius: 4px; padding: 4px; font-size: 11px; width: 100%; font-weight: 600; cursor: pointer;">
                    ${statusOptions.map(opt => `
                        <option value="${opt}" style="color: ${statusColors[opt]}; background: #1a1a2e;" ${init.status === opt ? 'selected' : ''}>
                            ${opt}
                        </option>`).join('')}
                </select>
            `;
        }

        // Helper to resolve long name
        const resolveOwnerDisplay = (name, entity) => {
            if (!name) return '';
            // If already has Sub Divisi, assume correct
            if (name.includes('Sub Divisi')) return name;

            // Try to find match in official list
            if (typeof OWNERS_BY_ENTITY !== 'undefined' && OWNERS_BY_ENTITY[entity]) {
                const match = OWNERS_BY_ENTITY[entity].find(o => o.replace('Sub Divisi ', '').trim() === name);
                if (match) return match;
            }
            return name;
        };

        header.innerHTML = `
            <i data-lucide="${isExpanded ? 'chevron-down' : 'chevron-right'}" class="chevron-icon"></i>
            <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${init.name}">${init.name}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${resolveOwnerDisplay(init.owner, init.entity)}</div>
            
            <div style="font-size: 11px; color: #fff;">${formatRupiah(init.budget || 0)}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${formatRupiah(init.cost || 0)}</div>

            <div style="font-size: 11px; color: var(--text-muted);">${init.dueDate || '-'}</div>

            <span class="badge ${init.urgency.toLowerCase()}">${init.urgency}</span>
            <div>${statusSelect}</div>

            <div class="progress-wrapper">
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${init.progress || 0}%"></div>
                </div>
                <div class="progress-text">${init.progress || 0}%</div>
            </div>
            <i data-lucide="more-vertical" 
               style="color: #888; cursor: pointer; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;" 
               onclick="event.stopPropagation(); toggleActions(event, ${init.id});"></i>
        `;


        // Nested Content: Key Activities Table
        const content = document.createElement('div');
        content.className = `nested-content ${isExpanded ? 'show' : ''}`;

        // Output Section (if exists)
        let contentHTML = '';
        if (init.output) {
            contentHTML += `
                <div style="margin-bottom: 20px; padding: 15px; background: rgba(0, 136, 255, 0.05); border-left: 3px solid #0088ff; border-radius: 6px;">
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px; font-weight: 600;">
                        <i data-lucide="target" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 5px;"></i>
                        Output
                    </div>
                    <div style="font-size: 13px; color: white; line-height: 1.6;">${init.output}</div>
                </div>
            `;
        }

        if (init.subInitiatives && init.subInitiatives.length > 0) {
            let activitiesHtml = `
                <table style="width: 100%; text-align: left; font-size: 12px; color: var(--text-muted); border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <th style="padding: 10px; width: 40%">Key Activity</th>
                            <th style="padding: 10px; width: 15%">Due Date</th>
                            <th style="padding: 10px; width: 10%">Weight</th>
                            <th style="padding: 10px; width: 35%">Progress</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            init.subInitiatives.forEach((act, idx) => {
                activitiesHtml += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 10px; color: white;">${act.name}</td>
                        <td style="padding: 10px;">${act.dueDate || '-'}</td>
                        <td style="padding: 10px;">${act.weight || 0}%</td>
                        <td style="padding: 10px;">
                            <div class="flex items-center gap-2">
                                <input type="range" min="0" max="100" value="${act.progress || 0}" 
                                    class="progress-slider"
                                    data-init-id="${init.id}"
                                    data-act-index="${idx}"
                                    style="flex: 1; accent-color: var(--primary);"
                                    oninput="this.nextElementSibling.innerText = this.value + '%'">
                                <span style="width: 35px; text-align: right; font-weight: bold; color: white;">${act.progress || 0}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            });

            activitiesHtml += `</tbody></table>`;
            content.innerHTML = contentHTML + activitiesHtml;
        } else {
            content.innerHTML = contentHTML + `<div style="color: var(--text-muted); padding: 15px; font-style: italic;">No Key Activities defined.</div>`;
        }

        // Render Leading/Lagging Indicators Table
        if (init.indicators && init.indicators.length > 0) {
            let indicatorsHtml = `
                <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <h4 style="font-size: 13px; color: var(--primary); margin-bottom: 10px;">Leading & Lagging Indicators</h4>
                    <table style="width: 100%; text-align: left; font-size: 12px; color: var(--text-muted); border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <th style="padding: 10px; width: 15%">Type</th>
                                <th style="padding: 10px; width: 25%">Metric</th>
                                <th style="padding: 10px; width: 10%">Target</th>
                                <th style="padding: 10px; width: 10%">Realization</th>
                                <th style="padding: 10px; width: 40%">Progress</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            init.indicators.forEach(ind => {
                const targetVal = parseFloat(ind.target) || 0;
                const realVal = parseFloat(ind.realization) || 0;
                // Calculate percentage based on target. Be careful with 0 target.
                // Assuming "the higher the better" for default percentage. 
                // If uom is Index/Score, same logic applies.
                // If uom is %, values might be 0-100 or 0-1. Assuming user input matches.

                let percent = 0;
                if (targetVal > 0) {
                    percent = Math.min(Math.round((realVal / targetVal) * 100), 100);
                }

                indicatorsHtml += `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 10px;">
                            <span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 10px;">${ind.type}</span>
                        </td>
                        <td style="padding: 10px; color: white;">${ind.metric} <span style="font-size: 10px; color: #888;">(${ind.uom})</span></td>
                        <td style="padding: 10px; color: white;">${ind.target}</td>
                        <td style="padding: 10px; color: #0088ff; font-weight: bold;">${ind.realization || '-'}</td>
                        <td style="padding: 10px;">
                             <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                                    <div style="height: 100%; width: ${percent}%; background: linear-gradient(90deg, #0088ff, #00f2ea);"></div>
                                </div>
                                <span style="font-size: 11px; color: white; width: 30px; text-align: right;">${percent}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            });

            indicatorsHtml += `</tbody></table></div>`;
            content.innerHTML += indicatorsHtml;
        }

        card.appendChild(header);
        card.appendChild(content);
        container.appendChild(card);
    });

    // Attach event listeners to all progress sliders using event delegation
    document.querySelectorAll('.progress-slider').forEach(slider => {
        slider.addEventListener('change', function () {
            const initId = parseInt(this.dataset.initId);
            const actIndex = parseInt(this.dataset.actIndex);
            const newProgress = this.value;

            console.log('🎯 Slider changed via event listener:', { initId, actIndex, newProgress });
            window.updateActivityProgress(initId, actIndex, newProgress);
        });
    });

    lucide.createIcons();
}

// FORCE RESET REMOVED - Data versioning handled at top of file
// Only rely on CURRENT_DATA_VERSION for resets

// Update Sidebar Stats
window.updateSidebarStats = function () {
    // For admin, use ALL initiatives; for users, use filtered initiatives
    let visibleInitiatives;
    const isAdmin = window.rbac?.isAdmin();

    if (isAdmin) {
        // Admin sees all initiatives
        visibleInitiatives = allInitiatives;
    } else {
        // Users see filtered initiatives
        visibleInitiatives = initiatives;
        if (window.rbac) {
            visibleInitiatives = window.rbac.filterInitiatives(initiatives);
        }
    }

    const entityCounts = {};
    const entityProgress = {};

    visibleInitiatives.forEach(init => {
        const entity = init.entity || 'ptpn3';
        if (!entityCounts[entity]) {
            entityCounts[entity] = 0;
            entityProgress[entity] = [];
        }
        entityCounts[entity]++;
        entityProgress[entity].push(init.progress || 0);
    });

    // Calculate total for "All Entities"
    const totalCount = visibleInitiatives.length;
    const totalProgress = visibleInitiatives.length > 0
        ? Math.round(visibleInitiatives.reduce((sum, init) => sum + (init.progress || 0), 0) / visibleInitiatives.length)
        : 0;

    // Update "All Entities" button
    const allEntitiesBtn = document.querySelector('.entity-btn[data-entity="all"]');
    if (allEntitiesBtn) {
        const badge = allEntitiesBtn.querySelector('.entity-badge');
        const percentage = allEntitiesBtn.querySelector('.entity-percentage');
        if (badge) badge.textContent = totalCount;
        if (percentage) {
            percentage.textContent = `${totalProgress}%`;

            // Color code for admin only
            if (isAdmin) {
                let color;
                if (totalProgress >= 0 && totalProgress <= 30) {
                    color = '#ff0055'; // Red
                } else if (totalProgress > 30 && totalProgress <= 60) {
                    color = '#ffbf00'; // Yellow/Orange
                } else if (totalProgress > 60 && totalProgress < 100) {
                    color = '#00d9ff'; // Blue
                } else if (totalProgress === 100) {
                    color = '#00ff9d'; // Green
                } else {
                    color = 'rgba(255, 255, 255, 0.7)'; // Default white
                }
                percentage.style.color = color;
            }
        }
    }

    // Get current user's entity for filtering
    const currentUser = window.rbac?.currentUser;
    const userEntity = currentUser?.entity;

    // Hide/show entity group labels based on role
    document.querySelectorAll('.entity-group-label').forEach(label => {
        if (isAdmin) {
            label.style.display = 'block'; // Show for admin
        } else {
            label.style.display = 'none'; // Hide for users
        }
    });

    // Update individual entity buttons
    document.querySelectorAll('.entity-btn[data-entity]').forEach(btn => {
        const entity = btn.getAttribute('data-entity');

        // For "All Entities" button - hide for non-admin users
        if (entity === 'all') {
            if (!isAdmin) {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'flex';
            }
            return;
        }

        // Hide entities that don't match user's entity (for non-admin users)
        if (!isAdmin && userEntity && entity !== userEntity) {
            btn.style.display = 'none';
            return;
        }
        // If it's an admin, or a user viewing their own entity, ensure it's visible
        else {
            btn.style.display = 'flex';
        }

        const count = entityCounts[entity] || 0;
        const avgProgress = entityProgress[entity]?.length > 0
            ? Math.round(entityProgress[entity].reduce((a, b) => a + b, 0) / entityProgress[entity].length)
            : 0;

        const badge = btn.querySelector('.entity-badge');
        const percentage = btn.querySelector('.entity-percentage');

        if (badge) {
            badge.textContent = count;

            // Color code badge for admin only
            if (isAdmin) {
                let badgeColor;
                if (count === 0) {
                    badgeColor = 'rgba(255, 255, 255, 0.2)'; // Very light gray for 0
                } else if (count >= 1 && count <= 3) {
                    badgeColor = '#ff0055'; // Red for low count
                } else if (count >= 4 && count <= 6) {
                    badgeColor = '#ffbf00'; // Yellow for medium count
                } else if (count >= 7 && count <= 10) {
                    badgeColor = '#00d9ff'; // Blue for high count
                } else {
                    badgeColor = '#00ff9d'; // Green for very high count
                }
                badge.style.backgroundColor = badgeColor;
                badge.style.color = (count === 0) ? 'rgba(255, 255, 255, 0.5)' : 'black';
            }
        }

        if (percentage) {
            percentage.textContent = `${avgProgress}%`;

            // Color code for admin only
            if (isAdmin) {
                let color;
                if (avgProgress >= 0 && avgProgress <= 30) {
                    color = '#ff0055'; // Red
                } else if (avgProgress > 30 && avgProgress <= 60) {
                    color = '#ffbf00'; // Yellow/Orange
                } else if (avgProgress > 60 && avgProgress < 100) {
                    color = '#00d9ff'; // Blue
                } else if (avgProgress === 100) {
                    color = '#00ff9d'; // Green
                } else {
                    color = 'rgba(255, 255, 255, 0.7)'; // Default white
                }
                percentage.style.color = color;
            }
        }
    });
};

// Initialization Logic
(function () {
    // Check for URL params
    const urlParams = new URLSearchParams(window.location.search);
    const entityParam = urlParams.get('entity');
    const ownerParam = urlParams.get('owner');

    // Filter by Entity if passed
    if (entityParam) {
        selectEntityFilter(entityParam);
    }

    // Filter by Owner if passed (from owners.html click)
    // NOTE: Filtering is handled non-destructively in renderProjects()
    // We just update the title here for immediate feedback if needed, although renderProjects does it too.
    if (ownerParam) {
        console.log(`🔍 Filtering by owner: ${ownerParam}`);
        const decodedOwner = decodeURIComponent(ownerParam);
        console.log(`📋 Applying filter for owner "${decodedOwner}"`);

        // Update page title to show filter
        const mainTitle = document.querySelector('h1');
        if (mainTitle) {
            mainTitle.innerHTML = `Initiatives: <span style="color: #00f2ea;">${decodedOwner}</span>`;
        }
    }

    // Render projects (with any applied filters)
    renderProjects();

    // Open Modal if requested
    if (urlParams.get('openModal') === 'true') {
        // Do NOT pass entityParam to avoid syncing with sidebar/context
        openModal();

        // Clean URL (remove query params)
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Initial Stats Load
    setTimeout(updateSidebarStats, 100);

    // === CLOUD SYNC ON STARTUP ===
    // Fetch from Supabase and update local state if cloud is connected
    if (window.dataService && window.dataService.supabase && window.dataService.supabase.isConnected()) {
        console.log('☁️ [Startup] Cloud detected, fetching latest data...');
        window.dataService.getAllInitiatives().then(cloudData => {
            if (cloudData && cloudData.length > 0) {
                console.log(`☁️ [Startup] Synced ${cloudData.length} items from Cloud.`);
                // Update Global State
                allInitiatives = cloudData;
                localStorage.setItem('initiatives', JSON.stringify(allInitiatives));

                // Re-apply Entity Filtering
                const currentUsername = localStorage.getItem('currentUser');
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const currentUser = users.find(u => u.username === currentUsername);

                if (currentUser && currentUser.role === 'user' && currentUser.entity) {
                    initiatives = allInitiatives.filter(init => {
                        const isFromUserEntity = init.entity === currentUser.entity;
                        const isApproved = init.approvalStatus === 'approved' || init.approvalStatus === 'pending_update' || !init.approvalStatus;
                        const isOwnInitiative = init.createdBy === currentUser.username;
                        return (isFromUserEntity && isApproved) || isOwnInitiative;
                    });
                } else {
                    initiatives = allInitiatives;
                }

                // Refresh UI
                renderProjects();
                if (window.updateSidebarStats) window.updateSidebarStats();

                // SIGNAL: Notify other pages (owners.html) that data is ready
                window.dispatchEvent(new Event('initiatives-updated'));

                console.log('✅ [Startup] UI refreshed with cloud data.');
            }
        }).catch(err => {
            console.error('☁️ [Startup] Cloud sync error:', err);
        });
    }

    // AUTO-FIX: Sanitize Custom Owners (Remove PTPN3 owners from PTPN4 if present from testing)
    try {
        const storedCO = localStorage.getItem('custom_owners');
        if (storedCO) {
            let coData = JSON.parse(storedCO);
            if (coData['ptpn4'] && Array.isArray(coData['ptpn4'])) {
                const invalid = "Divisi Pengembangan SDM & Budaya";
                if (coData['ptpn4'].includes(invalid)) {
                    console.log('🧹 Cleaning up invalid custom owner for PTPN4...');
                    coData['ptpn4'] = coData['ptpn4'].filter(o => o !== invalid);
                    localStorage.setItem('custom_owners', JSON.stringify(coData));
                }
            }
        }
    } catch (e) {
        console.error('Error sanitizing custom owners', e);
    }
})();

// --- IMPORT / EXPORT DATA LOGIC (EXCEL) ---
window.exportData = function () {
    const dataStr = localStorage.getItem('initiatives');
    if (!dataStr) {
        alert("No data to export!");
        return;
    }

    try {
        const data = JSON.parse(dataStr);

        // Flatten nested objects (subInitiatives) for Excel compatibility
        // We will store subInitiatives as a JSON string in a single cell
        const flatData = data.map(item => {
            return {
                ...item,
                subInitiatives: JSON.stringify(item.subInitiatives || [])
            };
        });

        // Create Worksheet
        const ws = XLSX.utils.json_to_sheet(flatData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Initiatives");

        // Download
        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `project_tracker_data_${date}.xlsx`);

    } catch (e) {
        alert("Export failed: " + e.message);
        console.error(e);
    }
};

window.handleImport = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Assume first sheet
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            // Convert to JSON
            const rawJson = XLSX.utils.sheet_to_json(sheet);

            // Rehydrate nested objects
            const initiatives = rawJson.map(row => {
                let subInits = [];
                try {
                    // Start logic for robust parsing, as Excel might mess up quotes sometimes
                    if (row.subInitiatives) {
                        subInits = JSON.parse(row.subInitiatives);
                    }
                } catch (parseErr) {
                    console.warn("Could not parse subInitiatives for row:", row, parseErr);
                    subInits = [];
                }

                return {
                    ...row,
                    subInitiatives: subInits
                };
            });

            // Validation
            if (!Array.isArray(initiatives)) {
                throw new Error("Invalid Excel Format.");
            }
            if (initiatives.length > 0 && !initiatives[0].id) {
                // Try to be lenient, maybe generate IDs? Better to warn.
                // throw new Error("Missing ID column in Excel."); 
                // Let's assume if it has data we accept it
            }

            // Confirm
            if (confirm(`Found ${initiatives.length} initiatives in Excel. This will OVERWRITE your current data. Continue?`)) {
                localStorage.setItem('initiatives', JSON.stringify(initiatives));
                localStorage.setItem('dataVersion', CURRENT_DATA_VERSION);
                alert("Data imported successfully from Excel!");
                window.location.reload();
            }

        } catch (err) {
            alert("Error processing Excel file: " + err.message);
            console.error(err);
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
};
