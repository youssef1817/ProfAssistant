let db = { students: {}, subjects: [] };
let mainChart = null;
let studentChart = null;
let queuedFiles = [];
let activeSection = 'dashboard';
let searchFocusIndex = -1;
let activeSubjects = ['الرياضيات', 'اللغة الفرنسية', 'اللغة العربية'];

async function init() {
    await fetchData();
    populateFilters();
    applyFilters();

    const hash = window.location.hash.replace('#', '');
    const savedSection = localStorage.getItem('activeSection');
    const savedStudent = localStorage.getItem('selectedStudent');

    if (['dashboard', 'upload', 'students'].includes(hash)) {
        activeSection = hash;
    } else if (savedSection) {
        activeSection = savedSection;
    }

    showSection(activeSection, false);

    if (savedStudent && activeSection === 'dashboard') {
        showStudentDetail(savedStudent);
    }

    renderMainDashboard();
    setupDropZone();
    
    // Auto-detect new files in the repository
    checkNewFiles();
    setInterval(checkNewFiles, 15000);

    document.getElementById('globalSearch')?.addEventListener('keydown', handleSearchNav);

    document.addEventListener('mousedown', (e) => {
        const results = document.getElementById('liveSearchResults');
        if (results && !e.target.closest('.search-bar')) {
            results.style.display = 'none';
        }
    });

    window.onpopstate = () => {
        const h = window.location.hash.replace('#', '');
        if (h) showSection(h, false);
    };
}

function handleSearchNav(e) {
    const resultsDiv = document.getElementById('liveSearchResults');
    if (!resultsDiv || resultsDiv.style.display === 'none') return;
    
    const items = resultsDiv.querySelectorAll('.live-search-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchFocusIndex = (searchFocusIndex + 1) % items.length;
        updateSearchHighlight(items);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchFocusIndex = (searchFocusIndex - 1 + items.length) % items.length;
        updateSearchHighlight(items);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchFocusIndex >= 0 && searchFocusIndex < items.length) {
            items[searchFocusIndex].click();
        }
    } else if (e.key === 'Escape') {
        resultsDiv.style.display = 'none';
    }
}

function updateSearchHighlight(items) {
    items.forEach((item, idx) => {
        if (idx === searchFocusIndex) {
            item.classList.add('highlighted');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('highlighted');
        }
    });
}

async function fetchData() {
    try {
        const response = await fetch('/data');
        db = await response.json();
        
        // Dynamically update school metadata in sidebar
        const elName = document.getElementById('sidebarSchoolName');
        if (elName) elName.textContent = db.schoolName || "المؤسسة التعليمية";
        
        const elYear = document.getElementById('sidebarSchoolYear');
        if (elYear) elYear.textContent = db.schoolYear || "الموسم الدراسي";

        // Render dynamic list of teachers by subject in the sidebar
        const elTeachers = document.getElementById('sidebarTeachers');
        if (elTeachers) {
            elTeachers.innerHTML = "";
            if (db.teachers && Object.keys(db.teachers).length > 0) {
                Object.entries(db.teachers).forEach(([subject, name]) => {
                    if (name) {
                        const item = document.createElement('div');
                        item.className = 'sidebar-teacher-item';
                        item.innerHTML = `<i class="fas fa-chalkboard-teacher"></i> <span><strong>${subject}:</strong> ${name}</span>`;
                        elTeachers.appendChild(item);
                    }
                });
            }
        }


    } catch (e) {
        console.error("Error fetching data:", e);
        showToast("خطأ في جلب البيانات", "error");
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function getGradeBadge(val) {
    if (val === undefined || val === null || val === "" || val === "-") return "-";
    const n = parseFloat(val);
    let cls = "grade-green";
    if (n < 5) cls = "grade-red";
    else if (n < 7.5) cls = "grade-orange";
    return `<span class="grade-badge ${cls}">${n}</span>`;
}

// ── Multi-level chip filter state ──
let selectedLevels = new Set();  // empty = all
let selectedClasses = new Set(); // empty = all

function populateFilters() {
    const students = Object.values(db.students);
    const levels = [...new Set(students.map(s => s.level))].filter(Boolean).sort();

    // 1. Build level buttons
    const levelChips = document.getElementById('levelChips');
    if (levelChips) {
        levelChips.innerHTML = '';
        
        // "All Levels" button
        const allBtn = document.createElement('button');
        allBtn.className = 'subject-toggle-btn' + (selectedLevels.size === 0 ? ' active' : '');
        allBtn.innerHTML = '<i class="fas fa-border-all"></i> <span>كل المستويات</span>';
        allBtn.onclick = () => {
            selectedLevels.clear();
            updateChipsUI('levelChips', selectedLevels);
            renderClassChips(); // Dynamically update classes
            applyFilters();
        };
        levelChips.appendChild(allBtn);

        // Individual Level buttons
        levels.forEach(l => {
            const btn = document.createElement('button');
            btn.className = 'subject-toggle-btn' + (selectedLevels.has(l) ? ' active' : '');
            btn.dataset.level = l;
            btn.innerHTML = `<i class="fas fa-graduation-cap"></i> <span>${l}</span>`;
            btn.onclick = () => {
                if (selectedLevels.has(l)) {
                    selectedLevels.delete(l);
                } else {
                    selectedLevels.add(l);
                }
                updateChipsUI('levelChips', selectedLevels);
                renderClassChips(); // Dynamically update classes
                applyFilters();
            };
            levelChips.appendChild(btn);
        });
    }

    // 2. Build class buttons
    renderClassChips();
}

function renderClassChips() {
    const classChips = document.getElementById('classChips');
    if (!classChips) return;

    const students = Object.values(db.students);
    
    // Determine which classes are available for the selected levels
    let availableClasses;
    if (selectedLevels.size === 0) {
        availableClasses = [...new Set(students.map(s => s.class))].filter(Boolean).sort();
    } else {
        availableClasses = [...new Set(students.filter(s => s.level && selectedLevels.has(s.level.trim())).map(s => s.class))].filter(Boolean).sort();
    }

    // Auto-clear selected classes that are no longer available
    selectedClasses.forEach(c => {
        if (!availableClasses.includes(c)) {
            selectedClasses.delete(c);
        }
    });

    classChips.innerHTML = '';

    // "All Classes" button
    const allBtn = document.createElement('button');
    allBtn.className = 'subject-toggle-btn' + (selectedClasses.size === 0 ? ' active' : '');
    allBtn.innerHTML = '<i class="fas fa-border-all"></i> <span>كل الأقسام</span>';
    allBtn.onclick = () => {
        selectedClasses.clear();
        updateChipsUI('classChips', selectedClasses);
        applyFilters();
    };
    classChips.appendChild(allBtn);

    // Individual Class buttons
    availableClasses.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'subject-toggle-btn' + (selectedClasses.has(c) ? ' active' : '');
        btn.dataset.class = c;
        btn.innerHTML = `<i class="fas fa-user-friends"></i> <span>${c}</span>`;
        btn.onclick = () => {
            if (selectedClasses.has(c)) {
                selectedClasses.delete(c);
            } else {
                selectedClasses.add(c);
            }
            updateChipsUI('classChips', selectedClasses);
            applyFilters();
        };
        classChips.appendChild(btn);
    });
}

function updateChipsUI(containerId, activeSet) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buttons = container.querySelectorAll('.subject-toggle-btn');
    buttons.forEach(btn => {
        const itemVal = btn.dataset.level || btn.dataset.class;
        if (!itemVal) {
            // "All" button
            btn.classList.toggle('active', activeSet.size === 0);
        } else {
            btn.classList.toggle('active', activeSet.has(itemVal));
        }
    });
}

function applyFilters() {
    const queryInput = document.getElementById('globalSearch');
    if (!queryInput) return;
    const query = queryInput.value.toLowerCase();

    const students = Object.values(db.students);
    const filtered = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(query) || s.massarId.toLowerCase().includes(query);
        const matchesLevel = selectedLevels.size === 0 || (s.level && selectedLevels.has(s.level.trim()));
        const matchesClass = selectedClasses.size === 0 || (s.class && selectedClasses.has(s.class.trim()));
        const matchesSubject = activeSubjects.length === 0 || activeSubjects.some(subj => s.grades[subj] && Object.keys(s.grades[subj]).length > 0);
        return matchesSearch && matchesLevel && matchesClass && matchesSubject;
    });

    renderStudentsList(filtered);
    updateSummaryStats(filtered);
    renderFilterStats(filtered);

    const liveResults = document.getElementById('liveSearchResults');
    searchFocusIndex = -1;
    if (query.length >= 2) {
        const matches = filtered.slice(0, 10);
        if (matches.length > 0) {
            liveResults.innerHTML = matches.map(s => `
                <div class="live-search-item" onclick="selectStudent('${s.massarId}')">
                    <strong>${s.name}</strong>
                    <span class="massar">${s.massarId} - ${s.class}</span>
                </div>
            `).join('');
            liveResults.style.display = 'block';
        } else {
            liveResults.style.display = 'none';
        }
    } else {
        liveResults.style.display = 'none';
    }
}

function renderFilterStats(filtered) {
    const bar = document.getElementById('filterStatsBar');
    if (!bar) return;

    const total = filtered.length;
    if (total === 0) { bar.style.display = 'none'; return; }

    // Count by class
    const byClass = {};
    filtered.forEach(s => { byClass[s.class] = (byClass[s.class] || 0) + 1; });

    // Count by level
    const byLevel = {};
    filtered.forEach(s => { if (s.level) byLevel[s.level] = (byLevel[s.level] || 0) + 1; });

    // Average per active subject
    const subjStats = {};
    const subjects = activeSubjects.length > 0 ? activeSubjects : db.subjects || [];
    subjects.forEach(subj => {
        let sum = 0, count = 0;
        filtered.forEach(s => {
            const g = s.grades[subj];
            if (!g) return;
            Object.entries(g).forEach(([k, v]) => {
                if (!k.endsWith('_detail') && v !== undefined && v !== null && v !== '') {
                    sum += parseFloat(v); count++;
                }
            });
        });
        if (count > 0) subjStats[subj] = (sum / count).toFixed(2);
    });

    // Build the bar
    const classChips = Object.entries(byClass)
        .sort((a, b) => b[1] - a[1])
        .map(([cls, n]) => `<span class="fstat-chip">${cls} <strong>${n}</strong></span>`)
        .join('');

    const levelChips = Object.entries(byLevel)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([lvl, n]) => `<span class="fstat-chip level">${lvl} <strong>${n}</strong></span>`)
        .join('');

    const subjCards = Object.entries(subjStats)
        .map(([subj, avg]) => `<div class="fstat-subj"><span>${subj}</span><strong>${avg}</strong></div>`)
        .join('');

    bar.style.display = 'flex';
    bar.innerHTML = `
        <div class="fstat-group">
            <i class="fas fa-users"></i>
            <span class="fstat-total">${total} تلميذ</span>
            ${levelChips}
            ${classChips}
        </div>
        ${subjCards ? `<div class="fstat-group fstat-subjects">${subjCards}</div>` : ''}
    `;
}

function handleSearchNav(e) {
    const liveResults = document.getElementById('liveSearchResults');
    if (!liveResults || liveResults.style.display === 'none') return;

    const items = liveResults.querySelectorAll('.live-search-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchFocusIndex = (searchFocusIndex + 1) % items.length;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchFocusIndex = (searchFocusIndex - 1 + items.length) % items.length;
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchFocusIndex >= 0 && items[searchFocusIndex]) {
            items[searchFocusIndex].click();
        }
        return;
    } else if (e.key === 'Escape') {
        liveResults.style.display = 'none';
        searchFocusIndex = -1;
        return;
    } else {
        return;
    }

    // Highlight active item
    items.forEach((item, i) => {
        item.classList.toggle('live-search-active', i === searchFocusIndex);
    });

    // Scroll into view smoothly
    if (items[searchFocusIndex]) {
        items[searchFocusIndex].scrollIntoView({ block: 'nearest' });
    }
}

function selectStudent(massarId) {

    console.log("Selecting student:", massarId);
    const student = db.students[massarId];
    if (student) {
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) searchInput.value = student.name;
        
        const results = document.getElementById('liveSearchResults');
        if (results) results.style.display = 'none';
        
        showStudentDetail(massarId);
        showSection('dashboard');
    } else {
        console.error("Student not found in DB:", massarId);
    }
}

function updateSummaryStats(filteredStudents) {
    const totalS = document.getElementById('totalStudents');
    const classA = document.getElementById('classAvg');
    if (!totalS) return;

    totalS.innerText = filteredStudents.length;
    
    let totalSum = 0;
    let count = 0;
    filteredStudents.forEach(s => {
        if (activeSubjects.length > 0) {
            activeSubjects.forEach(subj => {
                const subjGrades = s.grades[subj] || {};
                Object.entries(subjGrades).forEach(([key, val]) => {
                    if (!key.endsWith('_detail') && val !== undefined && val !== null && val !== "") {
                        totalSum += parseFloat(val);
                        count++;
                    }
                });
            });
        } else {
            Object.values(s.grades).forEach(subj => {
                Object.entries(subj).forEach(([key, val]) => {
                    if (!key.endsWith('_detail') && val !== undefined && val !== null && val !== "") {
                        totalSum += parseFloat(val);
                        count++;
                    }
                });
            });
        }
    });
    
    const avg = count > 0 ? (totalSum / count).toFixed(2) : "0.00";
    classA.innerText = avg;
}

function showSection(id, updateHash = true) {
    activeSection = id;
    localStorage.setItem('activeSection', id);
    if (updateHash) window.location.hash = id;

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.sidebar nav a').forEach(a => {
        if (a.getAttribute('onclick')?.includes(`'${id}'`)) a.classList.add('active');
    });

    if (id === 'students') applyFilters();
    if (id === 'classProgress' && mainChart) {
        setTimeout(() => mainChart.resize(), 50); // slight delay to allow display to apply
    }
    
    // Toggle premium filter dashboard visibility based on section
    const filterDashboard = document.querySelector('.filter-dashboard');
    if (filterDashboard) {
        filterDashboard.style.display = id === 'students' ? 'flex' : 'none';
    }
    
    // Toggle contextual stats bar visibility
    const filterStats = document.getElementById('filterStatsBar');
    if (filterStats) {
        if (id !== 'students') {
            filterStats.style.display = 'none';
        } else {
            // Re-apply filters to let it calculate and show if there is data
            applyFilters();
        }
    }
}

function toggleSubject(subj) {
    const idx = activeSubjects.indexOf(subj);
    if (idx > -1) {
        // Toggle off: remove it only if it's not the last remaining subject (or let it go empty if they want none)
        activeSubjects.splice(idx, 1);
    } else {
        activeSubjects.push(subj);
    }

    const btn = document.querySelector(`.subject-toggle-btn[data-subject="${subj}"]`);
    if (btn) {
        btn.classList.toggle('active');
    }

    onSubjectChange();
}

function onSubjectChange() {
    applyFilters();
    if (activeSection === 'classProgress') renderMainChart();
    
    const selectedStudent = localStorage.getItem('selectedStudent');
    if (selectedStudent && activeSection === 'dashboard') {
        showStudentDetail(selectedStudent);
    }
}

function renderMainDashboard() {
    applyFilters();
    renderMainChart();
}

function renderMainChart() {
    const canvas = document.getElementById('mainProgressChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const stages = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5'];
    
    const stageAvgs = stages.map(stage => {
        let sum = 0, count = 0;
        Object.values(db.students).forEach(s => {
            if (activeSubjects.length > 0) {
                activeSubjects.forEach(subj => {
                    const val = s.grades[subj]?.[stage];
                    if (val !== undefined && val !== null && val !== "") {
                        sum += parseFloat(val);
                        count++;
                    }
                });
            } else {
                Object.values(s.grades).forEach(subj => {
                    Object.entries(subj).forEach(([key, val]) => {
                        if (!key.endsWith('_detail') && val !== undefined && val !== null && val !== "") {
                            sum += parseFloat(val);
                            count++;
                        }
                    });
                });
            }
        });
        return count > 0 ? (sum / count).toFixed(2) : null;
    });

    let pointColors = [];
    let lastVal = null;
    stageAvgs.forEach(val => {
        if (val === null) {
            pointColors.push('#94a3b8');
        } else {
            const current = parseFloat(val);
            if (lastVal === null) {
                pointColors.push('#2563eb');
            } else if (current > lastVal) {
                pointColors.push('#10b981');
            } else if (current < lastVal) {
                pointColors.push('#ef4444');
            } else {
                pointColors.push('#f59e0b');
            }
            lastVal = current;
        }
    });

    if (mainChart) mainChart.destroy();
    
    const chartLabel = activeSubjects.length === 1 ? activeSubjects[0] : (activeSubjects.length > 1 ? `معدل (${activeSubjects.length} مواد)` : 'متوسط القسم العام');

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['المرحلة 1', 'المرحلة 2', 'المرحلة 3', 'المرحلة 4', 'المرحلة 5'],
            datasets: [{
                label: chartLabel,
                data: stageAvgs,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: pointColors,
                pointBorderColor: pointColors,
                pointRadius: 6,
                pointHoverRadius: 8,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true } },
            scales: {
                y: { min: 0, max: 10 },
                x: { ticks: { font: { family: 'Tajawal' } } }
            }
        }
    });
}

function hideDetail() {
    localStorage.removeItem('selectedStudent');
    const detailCard = document.getElementById('studentDetail');
    const emptyState = document.getElementById('emptyDashboardState');
    if (detailCard) detailCard.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
}

function showStudentDetail(id) {
    const student = db.students[id];
    if (!student) return;

    localStorage.setItem('selectedStudent', id);
    const detailCard = document.getElementById('studentDetail');
    const emptyState = document.getElementById('emptyDashboardState');
    
    if (detailCard) detailCard.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    
    const detName = document.getElementById('detName');
    const detMassar = document.getElementById('detMassar');
    const detLevel = document.getElementById('detLevel');
    if (detName) detName.innerText = student.name;
    if (detMassar) detMassar.innerText = student.massarId;
    if (detLevel) detLevel.innerText = student.level || "";

    // Populate official card header fields
    const detSchoolName = document.getElementById('detSchoolName');
    const detSchoolYear = document.getElementById('detSchoolYear');
    const detClass = document.getElementById('detClass');
    const detTeachers = document.getElementById('detTeachers');
    
    if (detSchoolName) detSchoolName.innerText = db.schoolName || "غير محدد";
    if (detSchoolYear) detSchoolYear.innerText = db.schoolYear || "غير محدد";
    if (detClass) detClass.innerText = student.class || "غير محدد";
    
    const studentTeachers = [];
    Object.keys(student.grades).forEach(subj => {
        if (db.teachers && db.teachers[subj]) {
            studentTeachers.push(`${subj}: ${db.teachers[subj]}`);
        }
    });
    if (detTeachers) {
        detTeachers.innerText = studentTeachers.length > 0 ? studentTeachers.join(' | ') : "غير محدد";
    }


    let totalSum = 0, totalCount = 0;
    Object.values(student.grades).forEach(subj => {
        Object.entries(subj).forEach(([key, val]) => {
            // Only count stage grades, ignore _detail objects
            if (!key.endsWith('_detail') && val !== undefined && val !== null && val !== "") {
                totalSum += parseFloat(val);
                totalCount++;
            }
        });
    });
    const overallAvg = totalCount > 0 ? (totalSum / totalCount).toFixed(2) : "-";
    const detAvg = document.getElementById('detAvg');
    if (detAvg) {
        detAvg.innerText = overallAvg;
        detAvg.className = 'student-overall-avg'; // reset class
        if (overallAvg !== "-") {
            const num = parseFloat(overallAvg);
            if (num < 5) detAvg.classList.add('grade-red');
            else if (num < 7.5) detAvg.classList.add('grade-orange');
            else detAvg.classList.add('grade-green');
        }
    }

    const canvasS = document.getElementById('studentChart');
    if (!canvasS) return;
    const ctx = canvasS.getContext('2d');
    const stages = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5'];
    const studentData = stages.map(stage => {
        if (activeSubjects.length > 0) {
            let sum = 0, count = 0;
            activeSubjects.forEach(subj => {
                const val = student.grades[subj]?.[stage];
                if (val !== undefined && val !== null && val !== "") {
                    sum += parseFloat(val);
                    count++;
                }
            });
            return count > 0 ? (sum / count).toFixed(2) : null;
        } else {
            let sum = 0, count = 0;
            Object.values(student.grades).forEach(subj => {
                Object.entries(subj).forEach(([key, val]) => {
                    if (!key.endsWith('_detail') && val !== undefined && val !== null && val !== "") {
                        sum += parseFloat(val);
                        count++;
                    }
                });
            });
            return count > 0 ? (sum / count).toFixed(2) : null;
        }
    });

    let pointColors = [];
    let lastVal = null;
    studentData.forEach(val => {
        if (val === null) {
            pointColors.push('#94a3b8');
        } else {
            const current = parseFloat(val);
            if (lastVal === null) {
                pointColors.push('#2563eb'); // Blue for first point
            } else if (current > lastVal) {
                pointColors.push('#10b981'); // Green for improvement
            } else if (current < lastVal) {
                pointColors.push('#ef4444'); // Red for decline
            } else {
                pointColors.push('#f59e0b'); // Orange for stable
            }
            lastVal = current;
        }
    });

    if (studentChart) studentChart.destroy();

    const chartLabel = activeSubjects.length === 1 ? activeSubjects[0] : (activeSubjects.length > 1 ? `المعدل (${activeSubjects.length} مواد)` : 'المعدل العام');

    studentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['م 1', 'م 2', 'م 3', 'م 4', 'م 5'],
            datasets: [{
                label: chartLabel,
                data: studentData,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: pointColors,
                pointBorderColor: pointColors,
                pointRadius: 6,
                pointHoverRadius: 8,
                spanGaps: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true } },
            scales: { y: { min: 0, max: 10 } }
        }
    });

    const tbody = document.querySelector('#detGradesTable tbody');
    if (tbody) {
        tbody.innerHTML = '';
        Object.keys(student.grades).forEach(subj => {
            if (activeSubjects.length > 0 && !activeSubjects.includes(subj)) return;
            
            const row = document.createElement('tr');
            let html = `<td>${subj}</td>`;
            stages.forEach(st => {
                html += `<td>${getGradeBadge(student.grades[subj][st])}</td>`;
            });
            row.innerHTML = html;
            tbody.appendChild(row);
        });
    }

    let report = `التلميذ(ة) ${student.name} يظهر `;
    const validGrades = studentData.filter(g => g !== null);
    const lastGrade = validGrades.length > 0 ? validGrades[validGrades.length - 1] : 0;
    if (lastGrade >= 8) report += "مستوى ممتازاً جداً.";
    else if (lastGrade >= 6) report += "مستوى جيداً ومستقراً.";
    else if (lastGrade >= 5) report += "مستوى متوسطاً.";
    else report += "تعثراً واضحاً في التحصيل الدراسي.";

    const repContent = document.getElementById('reportContent');
    if (repContent) repContent.innerText = report;

    // Load Note
    const noteArea = document.getElementById('studentNote');
    if (noteArea) noteArea.value = student.note || '';

    // Render Competency Tables
    const compContainer = document.getElementById('competencyTablesContainer');
    if (compContainer) {
        compContainer.innerHTML = '';
        stages.forEach((stage, idx) => {
            const subjectsToRender = activeSubjects.length > 0 ? activeSubjects : Object.keys(student.grades);
            
            subjectsToRender.forEach(currentSubject => {
                const details = student.grades[currentSubject]?.[`${stage}_detail`];
                
                if (details && Object.keys(details).length > 0) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'stage-comp-table-wrapper';
                    wrapper.style.marginTop = '15px';
                    
                    const title = document.createElement('h5');
                    title.innerText = `تفاصيل كفايات المرحلة ${idx + 1} (${currentSubject})`;
                    wrapper.appendChild(title);

                    const scroll = document.createElement('div');
                    scroll.className = 'comp-table-scroll';

                    const table = document.createElement('table');
                    table.className = 'comp-table';
                    
                    const thead = document.createElement('tr');
                    const tbody = document.createElement('tr');
                    
                    Object.entries(details).forEach(([comp, val]) => {
                        const th = document.createElement('th');
                        th.innerText = comp;
                        thead.appendChild(th);
                        
                        const td = document.createElement('td');
                        td.innerText = val;
                        tbody.appendChild(td);
                    });

                    // Add Average Column
                    const thAvg = document.createElement('th');
                    thAvg.innerText = 'المعدل';
                    thAvg.style.backgroundColor = '#f1f5f9';
                    thead.appendChild(thAvg);

                    const tdAvg = document.createElement('td');
                    const avgVal = student.grades[currentSubject]?.[stage];
                    tdAvg.innerText = avgVal !== undefined ? avgVal : "-";
                    tdAvg.style.fontWeight = '800';
                    tdAvg.style.color = 'var(--secondary)';
                    tdAvg.style.backgroundColor = '#f8fafc';
                    tbody.appendChild(tdAvg);

                    table.appendChild(thead);
                    table.appendChild(tbody);
                    scroll.appendChild(table);
                    wrapper.appendChild(scroll);
                    compContainer.appendChild(wrapper);
                }
            });
        });
    }
}

async function saveNote() {
    const massarId = localStorage.getItem('selectedStudent');
    const note = document.getElementById('studentNote').value;
    if (!massarId) return;

    try {
        const response = await fetch('/save-note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ massarId, note })
        });
        if (response.ok) {
            db.students[massarId].note = note;
            showToast("تم حفظ الملاحظة بنجاح", "success");
        }
    } catch (e) {
        showToast("خطأ في حفظ الملاحظة", "error");
    }
}

function hideDetail() {
    localStorage.removeItem('selectedStudent');
    const det = document.getElementById('studentDetail');
    if (det) det.style.display = 'none';
}

function renderStudentsList(filteredList) {
    const tbody = document.querySelector('#studentsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    filteredList.forEach(s => {
        const tr = document.createElement('tr');
        const stages = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5'];
        let sum = 0, count = 0;
        
        stages.forEach(st => {
            if (activeSubjects.length > 0) {
                activeSubjects.forEach(subj => {
                    const val = s.grades[subj]?.[st];
                    if (val !== undefined && val !== null && val !== "") { sum += parseFloat(val); count++; }
                });
            } else {
                Object.values(s.grades).forEach(subj => {
                    Object.entries(subj).forEach(([key, val]) => {
                        if (!key.endsWith('_detail') && val !== undefined && val !== null && val !== "") {
                            sum += parseFloat(val);
                            count++;
                        }
                    });
                });
            }
        });
        const avg = count > 0 ? (sum / count).toFixed(2) : "-";

        tr.innerHTML = `
            <td>${s.name}</td>
            <td>${s.massarId}</td>
            <td>${s.class}</td>
            <td><strong>${getGradeBadge(avg)}</strong></td>
            <td><button class="action-btn" onclick="showStudentDetail('${s.massarId}'); showSection('dashboard')">عرض</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function setupDropZone() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    dropZone.ondragover = () => {
        dropZone.style.borderColor = 'var(--secondary)';
        dropZone.style.background = '#f8fafc';
    };

    dropZone.ondragleave = () => {
        dropZone.style.borderColor = 'var(--text-light)';
        dropZone.style.background = 'white';
    };

    dropZone.ondrop = async (e) => {
        const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.xlsx'));
        queuedFiles = files;
        renderQueuedFiles();
    };

    fileInput.onchange = () => {
        queuedFiles = Array.from(fileInput.files);
        renderQueuedFiles();
    };
}

function renderQueuedFiles() {
    const container = document.getElementById('queuedFilesContainer');
    const list = document.getElementById('queuedFilesList');
    const count = document.getElementById('queuedCount');

    if (!container) return;

    if (queuedFiles.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    count.innerText = queuedFiles.length;
    list.innerHTML = queuedFiles.map(f => `
        <div class="queued-item">
            <span><i class="fas fa-file-excel"></i> ${f.name}</span>
            <small>${(f.size / 1024).toFixed(1)} KB</small>
        </div>
    `).join('');
    
    const prog = document.getElementById('uploadProgress');
    if (prog) prog.innerHTML = '';
}

async function startImport() {
    if (queuedFiles.length === 0) return;
    
    const progressContainer = document.getElementById('uploadProgress');
    const startBtn = document.getElementById('startImportBtn');
    progressContainer.innerHTML = '';
    startBtn.disabled = true;
    startBtn.innerText = 'جاري المعالجة...';

    const formData = new FormData();
    for (const file of queuedFiles) {
        formData.append('files', file);
        
        const item = document.createElement('div');
        item.className = 'upload-item processing';
        item.id = `file-${file.name.replace(/[^a-z0-9]/gi, '_')}`;
        item.innerHTML = `
            <div style="flex: 1">
                <div style="display: flex; justify-content: space-between">
                    <span>${file.name}</span>
                    <span class="status-text">جاري الرفع...</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: 30%"></div>
                </div>
            </div>
        `;
        progressContainer.appendChild(item);
    }

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        const results = await response.json();
        
        let hasError = false;
        results.forEach(r => {
            const id = `file-${r.name.replace(/[^a-z0-9]/gi, '_')}`;
            const item = document.getElementById(id);
            if (item) {
                item.className = `upload-item ${r.status}`;
                const statusText = item.querySelector('.status-text');
                statusText.innerText = r.status === 'success' ? `تم (م${r.stage})` : (r.message || r.status);
                
                const fill = item.querySelector('.progress-bar-fill');
                fill.style.width = '100%';
                if (r.status === 'success') fill.style.background = 'var(--success)';
                else if (r.status === 'warning') fill.style.background = '#f59e0b';
                else {
                    fill.style.background = 'var(--danger)';
                    hasError = true;
                }
            }
        });

        if (hasError) {
            showToast("بعض الملفات المرفوعة غير صالحة أو غير متوافقة!", "error");
            openExcelGuideModal();
        } else {
            showToast("اكتملت عملية الاستيراد بنجاح", "success");
        }

        await fetchData();
        populateFilters();
        applyFilters();
        renderMainChart();
        
        queuedFiles = [];
        document.getElementById('queuedFilesContainer').style.display = 'none';
    } catch (e) {
        showToast("حدث خطأ أثناء الاستيراد", "error");
    } finally {
        startBtn.disabled = false;
        startBtn.innerText = 'ابدأ عملية الاستيراد الآن';
    }
}

async function checkNewFiles() {
    try {
        const response = await fetch('/check-new-files');
        const data = await response.json();
        const alertBox = document.getElementById('floatingSyncAlert');
        if (alertBox) {
            if (data.hasNewFiles) {
                alertBox.classList.add('show');
            } else {
                alertBox.classList.remove('show');
            }
        }
    } catch (e) {
        console.error("Error checking new files:", e);
    }
}

async function triggerManualSync() {
    const sidebarIcon = document.querySelector('#sidebarSyncBtn svg, #sidebarSyncBtn i');
    const alertIcon = document.querySelector('#floatingSyncAlert .sync-alert-btn svg, #floatingSyncAlert .sync-alert-btn i');
    const sidebarBtn = document.getElementById('sidebarSyncBtn');

    if (sidebarIcon) sidebarIcon.classList.add('spinning-icon');
    if (alertIcon) alertIcon.classList.add('spinning-icon');
    if (sidebarBtn) sidebarBtn.disabled = true;

    showToast("جاري مزامنة مستودع النقط الآن... الرجاء الانتظار", "info");

    try {
        const response = await fetch('/trigger-sync', { method: 'POST' });
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            showToast("تمت مزامنة المستودع بنجاح وتحديث كافة البيانات!", "success");
            
            // Reload all data
            await fetchData();
            populateFilters();
            applyFilters();
            renderMainChart();
            
            // Hide the alert banner
            const alertBox = document.getElementById('floatingSyncAlert');
            if (alertBox) alertBox.classList.remove('show');
        } else {
            showToast(result.error || "فشلت عملية المزامنة", "error");
        }
    } catch (e) {
        console.error("Sync error:", e);
        showToast("حدث خطأ أثناء الاتصال بالخادم لمزامنة المستودع", "error");
    } finally {
        if (sidebarIcon) sidebarIcon.classList.remove('spinning-icon');
        if (alertIcon) alertIcon.classList.remove('spinning-icon');
        if (sidebarBtn) sidebarBtn.disabled = false;
    }
}

function goToUploadAndSync() {
    // Perform sync directly when clicked
    triggerManualSync();
}

function showCustomConfirm(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const modalTitle = document.getElementById('customModalTitle');
        const modalBody = document.getElementById('customModalBody');
        const confirmBtn = document.getElementById('customModalConfirmBtn');
        const cancelBtn = document.getElementById('customModalCancelBtn');

        if (!modal) {
            resolve(false);
            return;
        }

        modalTitle.innerText = title;
        modalBody.innerText = message;

        modal.classList.add('show');

        function cleanup(result) {
            modal.classList.remove('show');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        }

        function onConfirm() { cleanup(true); }
        function onCancel() { cleanup(false); }

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
}

async function confirmWipeData() {
    const message = 
        "هل أنت متأكد تماماً من رغبتك في تصفير المنظومة لموسم جديد؟\n\n" +
        "هذا الإجراء سيقوم بما يلي:\n" +
        "1. حذف جميع التلاميذ والصفوف وقيم النقط والتقارير نهائياً.\n" +
        "2. تفريغ مجلد 'مستودع النقط' بالكامل وحذف كافة ملفات الـ Excel المخزنة فيه.\n\n" +
        "⚠️ تنبيه: لا يمكن التراجع عن هذه العملية بعد تأكيدها! هل ترغب في الاستمرار؟";

    const confirmed = await showCustomConfirm("🚨 تحذير هام جداً!", message);
    if (!confirmed) return;

    showToast("جاري تهيئة وتصفير المنظومة بالكامل...", "info");

    try {
        const response = await fetch('/wipe-data', { method: 'POST' });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            showToast("تم تصفير المنظومة بنجاح تام والاستعداد لبدء موسم دراسي جديد!", "success");
            
            // Reload clean slate data
            await fetchData();
            populateFilters();
            applyFilters();
            renderMainChart();
            
            // Navigate back to the dashboard page to see the beautiful empty state
            showSection('dashboard');
        } else {
            showToast(result.error || "فشلت عملية تصفير المنظومة", "error");
        }
    } catch (e) {
        console.error("Wipe data error:", e);
        showToast("حدث خطأ أثناء الاتصال بالخادم لتصفير البيانات", "error");
    }
}

function printStudentCard() {
    const noteArea = document.getElementById('studentNote');
    const printNote = document.getElementById('printNoteContent');
    if (noteArea && printNote) {
        printNote.textContent = noteArea.value.trim() || "لا توجد ملاحظات خاصة.";
    }
    window.print();
}

function openExcelGuideModal() {
    const modal = document.getElementById('excelGuideModal');
    if (modal) modal.classList.add('show');
}

function closeExcelGuideModal() {
    const modal = document.getElementById('excelGuideModal');
    if (modal) modal.classList.remove('show');
}

window.onload = init;


