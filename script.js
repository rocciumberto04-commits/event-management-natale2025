// ========== CONFIGURAZIONE ==========
const CORRECT_PASSWORD = "cenaNataleMorosini2025";
const STORAGE_KEYS = {
  data: "eventManagement_data_v1",
  team: "eventManagement_team_v1",
  settings: "eventManagement_settings_v1"
};

// ========== VARIABILI GLOBALI ==========
let appData = {
  contatti: [],
  location: [],
  sponsor: []
};

let teamMembers = ["Membro 1", "Membro 2", "Membro 3"];

const OPTIONS = {
  statoContatto: ['Nuovo Contatto', 'In Corso', 'Contattato', 'Confermato', 'Rifiutato'],
  priorita: ['Alta', 'Media', 'Bassa'],
  statusLocation: ['Da contattare', 'Preventivo richiesto', 'In valutazione', 'Confermato', 'Scartato'],
  tipoSponsor: ['Platinum', 'Gold', 'Silver', 'Bronze', 'Partner Tecnico', 'Media Partner'],
  tipoContributo: ['Cash', 'In-Kind', 'Servizio', 'Prodotti'],
  statusSponsor: ['Da contattare', 'Proposta inviata', 'In negoziazione', 'Confermato', 'Declinato']
};

// ========== GESTIONE DATI PERSISTENTI ==========

function saveToStorage(key, data) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    console.log(`✅ Dati salvati: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Errore salvataggio ${key}:`, error);
    showNotification("Errore nel salvataggio dati", "error");
    return false;
  }
}

function loadFromStorage(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return JSON.parse(stored);
  } catch (error) {
    console.error(`❌ Errore caricamento ${key}:`, error);
    return defaultValue;
  }
}

function saveAllData() {
  const success = saveToStorage(STORAGE_KEYS.data, appData) && 
                  saveToStorage(STORAGE_KEYS.team, teamMembers);

  if (success) {
    showSaveIndicator();
  }
  return success;
}

function loadAllData() {
  // Carica i dati principali
  const savedData = loadFromStorage(STORAGE_KEYS.data);
  if (savedData && typeof savedData === 'object') {
    appData = {
      contatti: savedData.contatti || [],
      location: savedData.location || [],
      sponsor: savedData.sponsor || []
    };
  }

  // Carica i membri del team
  const savedTeam = loadFromStorage(STORAGE_KEYS.team);
  if (savedTeam && Array.isArray(savedTeam) && savedTeam.length === 3) {
    teamMembers = savedTeam;
  }

  console.log(`✅ Dati caricati - Contatti: ${appData.contatti.length}, Location: ${appData.location.length}, Sponsor: ${appData.sponsor.length}`);
}

// ========== SISTEMA DI AUTENTICAZIONE ==========

function handleLogin(event) {
  event.preventDefault();

  const passwordInput = document.getElementById('password-input');
  const errorDiv = document.getElementById('login-error');
  const enteredPassword = passwordInput.value.trim();

  if (enteredPassword === CORRECT_PASSWORD) {
    // Login riuscito
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';

    // Carica dati e inizializza app
    loadAllData();
    initializeApp();

    console.log('🚀 Login riuscito - App inizializzata');
  } else {
    // Login fallito
    errorDiv.style.display = 'block';
    passwordInput.value = '';
    passwordInput.focus();

    // Nascondi errore dopo 3 secondi
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 3000);
  }
}

function logout() {
  if (confirm('Sei sicuro di voler uscire dal sistema?')) {
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('password-input').value = '';
    document.getElementById('password-input').focus();
    console.log('👋 Logout effettuato');
  }
}

// ========== INIZIALIZZAZIONE APP ==========

function initializeApp() {
  // Aggiorna interfaccia con dati caricati
  updateTeamInputsFromData();
  updateTeamPreview();
  updateAllTables();
  updateDashboardStats();

  // Setup event listeners
  setupEventListeners();

  console.log('✅ App completamente inizializzata');
}

function setupEventListeners() {
  // Search listeners
  const searchInputs = ['contatti-search', 'location-search', 'sponsor-search'];
  searchInputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', function() {
        const tableType = id.split('-')[0];
        searchTable(tableType, this.value);
      });
    }
  });

  // Team preview update listeners
  ['membro1-input', 'membro2-input', 'membro3-input'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', updateTeamPreview);
    }
  });

  // Form submit listener
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

// ========== GESTIONE TEAM ==========

function updateTeamInputsFromData() {
  document.getElementById('membro1-input').value = teamMembers[0] || '';
  document.getElementById('membro2-input').value = teamMembers[1] || '';
  document.getElementById('membro3-input').value = teamMembers[2] || '';
}

function updateTeamPreview() {
  const membro1 = document.getElementById('membro1-input')?.value || teamMembers[0] || 'Membro 1';
  const membro2 = document.getElementById('membro2-input')?.value || teamMembers[1] || 'Membro 2';
  const membro3 = document.getElementById('membro3-input')?.value || teamMembers[2] || 'Membro 3';

  const previewElement = document.getElementById('team-preview');
  if (previewElement) {
    previewElement.innerHTML = `
      <div class="team-member-preview">
        <span class="team-member-icon">👤</span>
        <span>${membro1}</span>
      </div>
      <div class="team-member-preview">
        <span class="team-member-icon">👤</span>
        <span>${membro2}</span>
      </div>
      <div class="team-member-preview">
        <span class="team-member-icon">👤</span>
        <span>${membro3}</span>
      </div>
    `;
  }
}

function saveSettings() {
  const membro1 = document.getElementById('membro1-input').value.trim() || 'Membro 1';
  const membro2 = document.getElementById('membro2-input').value.trim() || 'Membro 2';
  const membro3 = document.getElementById('membro3-input').value.trim() || 'Membro 3';

  teamMembers = [membro1, membro2, membro3];

  if (saveAllData()) {
    showNotification('✅ Configurazione team salvata con successo!', 'success');
    updateTeamPreview();
    updateAllTables(); // Ricarica le tabelle con i nuovi nomi
  }
}

// ========== CRUD OPERATIONS ==========

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Contatti
function addContatto() {
  const newContatto = {
    id: generateId(),
    nome: '',
    cognome: '',
    azienda: '',
    email: '',
    telefono: '',
    ruolo: '',
    assegnato: teamMembers[0],
    stato: 'Nuovo Contatto',
    scopo: '',
    dataUltimoContatto: '',
    prossimoFollowup: '',
    note: '',
    priorita: 'Media'
  };

  appData.contatti.push(newContatto);
  saveAllData();
  updateContattiTable();
  updateDashboardStats();
  showNotification('Contatto aggiunto', 'success');
}

function updateContatto(id, field, value) {
  const contatto = appData.contatti.find(item => item.id === id);
  if (contatto) {
    contatto[field] = value;
    saveAllData();
    updateDashboardStats();
  }
}

function deleteContatto(id) {
  if (confirm('Sei sicuro di voler eliminare questo contatto?')) {
    appData.contatti = appData.contatti.filter(item => item.id !== id);
    saveAllData();
    updateContattiTable();
    updateDashboardStats();
    showNotification('Contatto eliminato', 'success');
  }
}

// Location
function addLocation() {
  const newLocation = {
    id: generateId(),
    nome: '',
    indirizzo: '',
    referente: '',
    contatto: '',
    capienza: '',
    budgetBase: '',
    costiAggiuntivi: '',
    orari: '',
    attrezzature: '',
    catering: 'No',
    parcheggio: 'No',
    trasporti: '',
    status: 'Da contattare',
    valutazione: 3,
    note: ''
  };

  appData.location.push(newLocation);
  saveAllData();
  updateLocationTable();
  updateDashboardStats();
  showNotification('Location aggiunta', 'success');
}

function updateLocation(id, field, value) {
  const location = appData.location.find(item => item.id === id);
  if (location) {
    location[field] = value;
    saveAllData();
    updateDashboardStats();
  }
}

function deleteLocation(id) {
  if (confirm('Sei sicuro di voler eliminare questa location?')) {
    appData.location = appData.location.filter(item => item.id !== id);
    saveAllData();
    updateLocationTable();
    updateDashboardStats();
    showNotification('Location eliminata', 'success');
  }
}

// Sponsor
function addSponsor() {
  const newSponsor = {
    id: generateId(),
    nome: '',
    referente: '',
    email: '',
    telefono: '',
    tipoSponsor: 'Bronze',
    importo: '',
    tipoContributo: 'Cash',
    servizi: '',
    status: 'Da contattare',
    dataProposta: '',
    scadenzaRisposta: '',
    benefici: '',
    deliverables: false,
    note: ''
  };

  appData.sponsor.push(newSponsor);
  saveAllData();
  updateSponsorTable();
  updateDashboardStats();
  showNotification('Sponsor aggiunto', 'success');
}

function updateSponsor(id, field, value) {
  const sponsor = appData.sponsor.find(item => item.id === id);
  if (sponsor) {
    sponsor[field] = value;
    saveAllData();
    updateDashboardStats();
  }
}

function deleteSponsor(id) {
  if (confirm('Sei sicuro di voler eliminare questo sponsor?')) {
    appData.sponsor = appData.sponsor.filter(item => item.id !== id);
    saveAllData();
    updateSponsorTable();
    updateDashboardStats();
    showNotification('Sponsor eliminato', 'success');
  }
}

// ========== AGGIORNAMENTO TABELLE ==========

function updateAllTables() {
  updateContattiTable();
  updateLocationTable();
  updateSponsorTable();
}

function updateContattiTable() {
  const tableBody = document.getElementById('contatti-table-body');
  const emptyState = document.getElementById('contatti-empty-state');
  const table = document.getElementById('contatti-table');

  if (appData.contatti.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    table.style.display = 'table';
    emptyState.style.display = 'none';

    tableBody.innerHTML = appData.contatti.map(contatto => `
      <tr class="table-row">
        <td><input type="text" value="${contatto.nome}" onchange="updateContatto('${contatto.id}', 'nome', this.value)" class="table-input"></td>
        <td><input type="text" value="${contatto.cognome}" onchange="updateContatto('${contatto.id}', 'cognome', this.value)" class="table-input"></td>
        <td><input type="text" value="${contatto.azienda}" onchange="updateContatto('${contatto.id}', 'azienda', this.value)" class="table-input"></td>
        <td><input type="email" value="${contatto.email}" onchange="updateContatto('${contatto.id}', 'email', this.value)" class="table-input"></td>
        <td><input type="tel" value="${contatto.telefono}" onchange="updateContatto('${contatto.id}', 'telefono', this.value)" class="table-input"></td>
        <td><input type="text" value="${contatto.ruolo}" onchange="updateContatto('${contatto.id}', 'ruolo', this.value)" class="table-input"></td>
        <td>
          <select onchange="updateContatto('${contatto.id}', 'assegnato', this.value)" class="table-select">
            ${teamMembers.map(member => 
              `<option value="${member}" ${contatto.assegnato === member ? 'selected' : ''}>${member}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <select onchange="updateContatto('${contatto.id}', 'stato', this.value)" class="table-select">
            ${OPTIONS.statoContatto.map(stato => 
              `<option value="${stato}" ${contatto.stato === stato ? 'selected' : ''}>${stato}</option>`
            ).join('')}
          </select>
        </td>
        <td><input type="text" value="${contatto.scopo}" onchange="updateContatto('${contatto.id}', 'scopo', this.value)" class="table-input"></td>
        <td><input type="date" value="${contatto.dataUltimoContatto}" onchange="updateContatto('${contatto.id}', 'dataUltimoContatto', this.value)" class="table-input"></td>
        <td><input type="date" value="${contatto.prossimoFollowup}" onchange="updateContatto('${contatto.id}', 'prossimoFollowup', this.value)" class="table-input"></td>
        <td><textarea onchange="updateContatto('${contatto.id}', 'note', this.value)" class="table-textarea">${contatto.note}</textarea></td>
        <td>
          <select onchange="updateContatto('${contatto.id}', 'priorita', this.value)" class="table-select">
            ${OPTIONS.priorita.map(priorita => 
              `<option value="${priorita}" ${contatto.priorita === priorita ? 'selected' : ''}>${priorita}</option>`
            ).join('')}
          </select>
        </td>
        <td><button onclick="deleteContatto('${contatto.id}')" class="btn btn--danger">🗑️</button></td>
      </tr>
    `).join('');
  }
}

function updateLocationTable() {
  const tableBody = document.getElementById('location-table-body');
  const emptyState = document.getElementById('location-empty-state');
  const table = document.getElementById('location-table');

  if (appData.location.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    table.style.display = 'table';
    emptyState.style.display = 'none';

    tableBody.innerHTML = appData.location.map(location => `
      <tr class="table-row">
        <td><input type="text" value="${location.nome}" onchange="updateLocation('${location.id}', 'nome', this.value)" class="table-input"></td>
        <td><input type="text" value="${location.indirizzo}" onchange="updateLocation('${location.id}', 'indirizzo', this.value)" class="table-input"></td>
        <td><input type="text" value="${location.referente}" onchange="updateLocation('${location.id}', 'referente', this.value)" class="table-input"></td>
        <td><input type="text" value="${location.contatto}" onchange="updateLocation('${location.id}', 'contatto', this.value)" class="table-input"></td>
        <td><input type="number" value="${location.capienza}" onchange="updateLocation('${location.id}', 'capienza', this.value)" class="table-input"></td>
        <td><input type="number" value="${location.budgetBase}" onchange="updateLocation('${location.id}', 'budgetBase', this.value)" class="table-input"></td>
        <td><input type="number" value="${location.costiAggiuntivi}" onchange="updateLocation('${location.id}', 'costiAggiuntivi', this.value)" class="table-input"></td>
        <td><input type="text" value="${location.orari}" onchange="updateLocation('${location.id}', 'orari', this.value)" class="table-input"></td>
        <td><input type="text" value="${location.attrezzature}" onchange="updateLocation('${location.id}', 'attrezzature', this.value)" class="table-input" placeholder="Es: Proiettori, Audio, WiFi"></td>
        <td>
          <select onchange="updateLocation('${location.id}', 'catering', this.value)" class="table-select">
            <option value="Si" ${location.catering === 'Si' ? 'selected' : ''}>Si</option>
            <option value="No" ${location.catering === 'No' ? 'selected' : ''}>No</option>
          </select>
        </td>
        <td>
          <select onchange="updateLocation('${location.id}', 'parcheggio', this.value)" class="table-select">
            <option value="Si" ${location.parcheggio === 'Si' ? 'selected' : ''}>Si</option>
            <option value="No" ${location.parcheggio === 'No' ? 'selected' : ''}>No</option>
            <option value="A pagamento" ${location.parcheggio === 'A pagamento' ? 'selected' : ''}>A pagamento</option>
          </select>
        </td>
        <td><input type="text" value="${location.trasporti}" onchange="updateLocation('${location.id}', 'trasporti', this.value)" class="table-input"></td>
        <td>
          <select onchange="updateLocation('${location.id}', 'status', this.value)" class="table-select">
            ${OPTIONS.statusLocation.map(status => 
              `<option value="${status}" ${location.status === status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <select onchange="updateLocation('${location.id}', 'valutazione', parseInt(this.value))" class="table-select">
            ${[1,2,3,4,5].map(val => 
              `<option value="${val}" ${location.valutazione === val ? 'selected' : ''}>${val} ⭐</option>`
            ).join('')}
          </select>
        </td>
        <td><textarea onchange="updateLocation('${location.id}', 'note', this.value)" class="table-textarea">${location.note}</textarea></td>
        <td><button onclick="deleteLocation('${location.id}')" class="btn btn--danger">🗑️</button></td>
      </tr>
    `).join('');
  }
}

function updateSponsorTable() {
  const tableBody = document.getElementById('sponsor-table-body');
  const emptyState = document.getElementById('sponsor-empty-state');
  const table = document.getElementById('sponsor-table');

  if (appData.sponsor.length === 0) {
    table.style.display = 'none';
    emptyState.style.display = 'block';
  } else {
    table.style.display = 'table';
    emptyState.style.display = 'none';

    tableBody.innerHTML = appData.sponsor.map(sponsor => `
      <tr class="table-row">
        <td><input type="text" value="${sponsor.nome}" onchange="updateSponsor('${sponsor.id}', 'nome', this.value)" class="table-input"></td>
        <td><input type="text" value="${sponsor.referente}" onchange="updateSponsor('${sponsor.id}', 'referente', this.value)" class="table-input"></td>
        <td><input type="email" value="${sponsor.email}" onchange="updateSponsor('${sponsor.id}', 'email', this.value)" class="table-input"></td>
        <td><input type="tel" value="${sponsor.telefono}" onchange="updateSponsor('${sponsor.id}', 'telefono', this.value)" class="table-input"></td>
        <td>
          <select onchange="updateSponsor('${sponsor.id}', 'tipoSponsor', this.value)" class="table-select">
            ${OPTIONS.tipoSponsor.map(tipo => 
              `<option value="${tipo}" ${sponsor.tipoSponsor === tipo ? 'selected' : ''}>${tipo}</option>`
            ).join('')}
          </select>
        </td>
        <td><input type="number" value="${sponsor.importo}" onchange="updateSponsor('${sponsor.id}', 'importo', this.value)" class="table-input"></td>
        <td>
          <select onchange="updateSponsor('${sponsor.id}', 'tipoContributo', this.value)" class="table-select">
            ${OPTIONS.tipoContributo.map(tipo => 
              `<option value="${tipo}" ${sponsor.tipoContributo === tipo ? 'selected' : ''}>${tipo}</option>`
            ).join('')}
          </select>
        </td>
        <td><input type="text" value="${sponsor.servizi}" onchange="updateSponsor('${sponsor.id}', 'servizi', this.value)" class="table-input"></td>
        <td>
          <select onchange="updateSponsor('${sponsor.id}', 'status', this.value)" class="table-select">
            ${OPTIONS.statusSponsor.map(status => 
              `<option value="${status}" ${sponsor.status === status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </td>
        <td><input type="date" value="${sponsor.dataProposta}" onchange="updateSponsor('${sponsor.id}', 'dataProposta', this.value)" class="table-input"></td>
        <td><input type="date" value="${sponsor.scadenzaRisposta}" onchange="updateSponsor('${sponsor.id}', 'scadenzaRisposta', this.value)" class="table-input"></td>
        <td><input type="text" value="${sponsor.benefici}" onchange="updateSponsor('${sponsor.id}', 'benefici', this.value)" class="table-input"></td>
        <td><input type="checkbox" ${sponsor.deliverables ? 'checked' : ''} onchange="updateSponsor('${sponsor.id}', 'deliverables', this.checked)" class="table-checkbox"></td>
        <td><textarea onchange="updateSponsor('${sponsor.id}', 'note', this.value)" class="table-textarea">${sponsor.note}</textarea></td>
        <td><button onclick="deleteSponsor('${sponsor.id}')" class="btn btn--danger">🗑️</button></td>
      </tr>
    `).join('');
  }
}

// ========== DASHBOARD E STATISTICHE ==========

function updateDashboardStats() {
  // Totali
  document.getElementById('total-contatti').textContent = appData.contatti.length;
  document.getElementById('total-location').textContent = appData.location.length;
  document.getElementById('total-sponsor').textContent = appData.sponsor.length;

  // Confermati
  const contattiConfermati = appData.contatti.filter(c => c.stato === 'Confermato').length;
  const locationConfermate = appData.location.filter(l => l.status === 'Confermato').length;
  const sponsorConfermati = appData.sponsor.filter(s => s.status === 'Confermato').length;

  document.getElementById('contatti-confermati').textContent = contattiConfermati;
  document.getElementById('location-confermate').textContent = locationConfermate;

  // Valore sponsor
  const totalSponsorValue = appData.sponsor
    .filter(s => s.importo && !isNaN(parseFloat(s.importo)))
    .reduce((sum, s) => sum + parseFloat(s.importo), 0);

  document.getElementById('valore-sponsor').textContent = `€${totalSponsorValue.toLocaleString()}`;

  // Priorità alta
  const prioritaAlta = appData.contatti.filter(c => c.priorita === 'Alta').length;
  document.getElementById('priorita-alta').textContent = prioritaAlta;
}

// ========== UTILITÀ ==========

function switchTab(tabName) {
  // Nascondi tutti i tab
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  // Rimuovi classe attiva da tutti i bottoni
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Mostra il tab selezionato
  document.getElementById(`${tabName}-tab`).classList.add('active');

  // Aggiungi classe attiva al bottone cliccato
  event.target.classList.add('active');
}

function searchTable(tableType, searchTerm) {
  const rows = document.querySelectorAll(`#${tableType}-table-body tr`);

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    if (text.includes(searchTerm.toLowerCase())) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function exportData() {
  const dataToExport = {
    teamMembers: teamMembers,
    data: appData,
    exportDate: new Date().toISOString(),
    version: "1.0"
  };

  const dataStr = JSON.stringify(dataToExport, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `event-management-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showNotification('✅ Dati esportati con successo!', 'success');
}

function showSaveIndicator() {
  const indicator = document.getElementById('save-indicator');
  if (indicator) {
    indicator.style.display = 'flex';
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 2000);
  }
}

function showNotification(message, type = 'info') {
  // Crea elemento notifica
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message;

  // Stili inline per la notifica
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '10000',
    transform: 'translateX(400px)',
    transition: 'transform 0.3s ease-out',
    backgroundColor: type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#3b82f6'
  });

  document.body.appendChild(notification);

  // Animazione di entrata
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Rimozione automatica
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// ========== INIZIALIZZAZIONE ==========

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Sistema Event Management avviato');

  // Controlla supporto localStorage
  if (typeof Storage === 'undefined') {
    alert('⚠️ Il tuo browser non supporta il salvataggio automatico. I dati verranno persi alla chiusura della pagina.');
  }

  // Focus sul campo password
  const passwordInput = document.getElementById('password-input');
  if (passwordInput) {
    passwordInput.focus();
  }

  console.log('✅ Sistema pronto - inserire password per accedere');
});

// ========== DEBUG (solo per sviluppo) ==========
// Uncomment per debug
// window.debugApp = { appData, teamMembers, loadAllData, saveAllData };