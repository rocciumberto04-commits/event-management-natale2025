// ========== CONFIGURAZIONE FIREBASE MODERNA ==========
// Firebase è già inizializzato nell'HTML con la tua config reale
// Utilizziamo le variabili globali firebaseApp e firebaseDatabase

// Import moderni Firebase v12 (già caricati nell'HTML)
import { ref, set, get, onValue, off } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

// ========== VARIABILI GLOBALI ==========
const CORRECT_PASSWORD = "cenaNataleMorosini2025";
let database;
let isFirebaseConnected = false;

let appData = {
  contatti: [],
  location: [],
  sponsor: []
};

let teamMembers = ["Membro 1", "Membro 2", "Membro 3"];
let sponsorTarget = 0;

const OPTIONS = {
  statoContatto: ['Nuovo Contatto', 'In Corso', 'Contattato', 'Confermato', 'Rifiutato'],
  priorita: ['Alta', 'Media', 'Bassa'],
  statusLocation: ['Da contattare', 'Preventivo richiesto', 'In valutazione', 'Confermato', 'Scartato'],
  tipoSponsor: ['Platinum', 'Gold', 'Silver', 'Bronze', 'Partner Tecnico', 'Media Partner'],
  tipoContributo: ['Cash', 'In-Kind', 'Servizio', 'Prodotti'],
  statusSponsor: ['Da contattare', 'Proposta inviata', 'In negoziazione', 'Confermato', 'Declinato']
};

// ========== INIZIALIZZAZIONE FIREBASE MODERNA ==========
async function initFirebase() {
  return new Promise((resolve) => {
    try {
      console.log('🔥 Inizializzazione Firebase moderna...');
      updateSyncStatus('connecting', 'Connessione Firebase...');

      // Prima carica dati locali come fallback
      loadFromLocalStorage();

      // Usa le variabili globali definite nell'HTML
      database = window.firebaseDatabase;

      if (!database) {
        throw new Error('Firebase database non disponibile');
      }

      console.log('🔥 Firebase database ottenuto');

      // TEST CONNESSIONE con timeout
      const timeout = setTimeout(() => {
        console.warn('⚠️ Timeout Firebase - uso localStorage');
        updateSyncStatus('error', 'Modalità offline');
        resolve();
      }, 10000); // 10 secondi timeout

      // Test connessione con .info/connected
      const connectedRef = ref(database, '.info/connected');
      onValue(connectedRef, (snapshot) => {
        clearTimeout(timeout);

        if (snapshot.val() === true) {
          console.log('✅ Firebase connesso - carico dati cloud');
          isFirebaseConnected = true;
          updateSyncStatus('connected', 'Sincronizzato ☁️');

          // Carica dati da Firebase
          loadFromFirebase().then(() => {
            setupRealTimeListeners();
            resolve();
          });
        } else {
          console.warn('❌ Firebase disconnesso - uso localStorage');
          updateSyncStatus('error', 'Modalità offline');
          resolve();
        }
      });

    } catch (error) {
      console.error('❌ Errore inizializzazione Firebase:', error);
      updateSyncStatus('error', 'Errore Firebase');
      resolve();
    }
  });
}

// ========== CARICAMENTO DATI DA FIREBASE MODERNO ==========
async function loadFromFirebase() {
  return new Promise((resolve) => {
    try {
      if (!database) {
        resolve();
        return;
      }

      const promises = [
        get(ref(database, 'eventData/data')),
        get(ref(database, 'eventData/team')),
        get(ref(database, 'eventData/settings'))
      ];

      Promise.all(promises).then(([dataSnapshot, teamSnapshot, settingsSnapshot]) => {
        // Carica dati principali
        if (dataSnapshot.exists()) {
          const cloudData = dataSnapshot.val();
          if (cloudData && typeof cloudData === 'object') {
            appData = {
              contatti: cloudData.contatti || [],
              location: cloudData.location || [],
              sponsor: cloudData.sponsor || []
            };
            console.log(`☁️ Dati cloud caricati - Contatti: ${appData.contatti.length}, Location: ${appData.location.length}, Sponsor: ${appData.sponsor.length}`);
          }
        }

        // Carica team
        if (teamSnapshot.exists()) {
          const cloudTeam = teamSnapshot.val();
          if (cloudTeam && Array.isArray(cloudTeam)) {
            teamMembers = cloudTeam;
            console.log('☁️ Team cloud caricato:', teamMembers);
          }
        }

        // Carica settings
        if (settingsSnapshot.exists()) {
          const cloudSettings = settingsSnapshot.val();
          if (cloudSettings && typeof cloudSettings === 'object') {
            sponsorTarget = cloudSettings.sponsorTarget || 0;
            console.log('☁️ Settings cloud caricati');
          }
        }

        resolve();
      }).catch(error => {
        console.error('❌ Errore caricamento da Firebase:', error);
        resolve();
      });

    } catch (error) {
      console.error('❌ Errore loadFromFirebase:', error);
      resolve();
    }
  });
}

// ========== LISTENER REAL-TIME MODERNI ==========
function setupRealTimeListeners() {
  if (!database || !isFirebaseConnected) return;

  try {
    // Listener per dati principali
    const dataRef = ref(database, 'eventData/data');
    onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const newData = snapshot.val();
        if (newData && typeof newData === 'object') {
          const oldLength = appData.contatti.length + appData.location.length + appData.sponsor.length;

          appData = {
            contatti: newData.contatti || [],
            location: newData.location || [],
            sponsor: newData.sponsor || []
          };

          const newLength = appData.contatti.length + appData.location.length + appData.sponsor.length;

          if (newLength !== oldLength) {
            console.log('🔄 Dati aggiornati in real-time');
            updateAllTables();
            updateDashboardStats();
            updateSponsorStats();
            updateLocationCheckboxes();
            showNotification('📡 Dati sincronizzati automaticamente', 'success');
          }
        }
      }
    });

    // Listener per team
    const teamRef = ref(database, 'eventData/team');
    onValue(teamRef, (snapshot) => {
      if (snapshot.exists()) {
        const newTeam = snapshot.val();
        if (newTeam && Array.isArray(newTeam)) {
          teamMembers = newTeam;
          updateTeamInputsFromData();
          updateTeamPreview();
          updateAllTables(); // Per aggiornare i dropdown "Assegnato a"
        }
      }
    });

    // Listener per settings
    const settingsRef = ref(database, 'eventData/settings');
    onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const newSettings = snapshot.val();
        if (newSettings && typeof newSettings === 'object') {
          sponsorTarget = newSettings.sponsorTarget || 0;
          const targetInput = document.getElementById('sponsor-target');
          if (targetInput) targetInput.value = sponsorTarget;
          updateSponsorStats();
        }
      }
    });

    console.log('🔄 Listeners real-time attivati');

  } catch (error) {
    console.error('❌ Errore setup listeners:', error);
  }
}

function updateSyncStatus(status, text) {
  const statusEl = document.getElementById('sync-status');
  const textEl = document.getElementById('sync-text');

  if (statusEl && textEl) {
    statusEl.className = `sync-status ${status}`;
    textEl.textContent = text;
  }
}

// ========== SALVATAGGIO SU FIREBASE MODERNO ==========
function saveToFirebase(path, data) {
  return new Promise((resolve) => {
    if (isFirebaseConnected && database) {
      try {
        const dbRef = ref(database, `eventData/${path}`);
        set(dbRef, data).then(() => {
          console.log(`☁️ Salvato su Firebase: ${path}`);
          showSaveIndicator('☁️ Sincronizzato');

          // Salva anche localmente come backup
          saveToLocalStorage(path, data);
          resolve(true);
        }).catch(error => {
          console.error(`❌ Errore salvataggio Firebase ${path}:`, error);
          saveToLocalStorage(path, data);
          resolve(false);
        });
      } catch (error) {
        console.error(`❌ Errore Firebase ${path}:`, error);
        saveToLocalStorage(path, data);
        resolve(false);
      }
    } else {
      saveToLocalStorage(path, data);
      resolve(false);
    }
  });
}

function saveToLocalStorage(key, data) {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(`eventManagement_${key}`, serialized);
    console.log(`💾 Salvato localmente: ${key}`);
    if (!isFirebaseConnected) {
      showSaveIndicator('💾 Salvato localmente');
    }
    return true;
  } catch (error) {
    console.error(`❌ Errore salvataggio locale ${key}:`, error);
    showNotification("Errore nel salvataggio dati", "error");
    return false;
  }
}

function loadFromLocalStorage() {
  try {
    // Carica i dati principali
    const savedData = localStorage.getItem('eventManagement_data');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (parsedData && typeof parsedData === 'object') {
        appData = {
          contatti: parsedData.contatti || [],
          location: parsedData.location || [],
          sponsor: parsedData.sponsor || []
        };
      }
    }

    // Carica i membri del team
    const savedTeam = localStorage.getItem('eventManagement_team');
    if (savedTeam) {
      const parsedTeam = JSON.parse(savedTeam);
      if (parsedTeam && Array.isArray(parsedTeam) && parsedTeam.length === 3) {
        teamMembers = parsedTeam;
      }
    }

    // Carica le impostazioni
    const savedSettings = localStorage.getItem('eventManagement_settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      if (parsedSettings && typeof parsedSettings === 'object') {
        sponsorTarget = parsedSettings.sponsorTarget || 0;
      }
    }

    console.log(`💾 Dati locali caricati - Contatti: ${appData.contatti.length}, Location: ${appData.location.length}, Sponsor: ${appData.sponsor.length}`);
  } catch (error) {
    console.error('❌ Errore caricamento localStorage:', error);
  }
}

async function saveAllData() {
  const promises = [
    saveToFirebase('data', appData),
    saveToFirebase('team', teamMembers),
    saveToFirebase('settings', { sponsorTarget })
  ];

  const results = await Promise.all(promises);
  return results.some(result => result); // True se almeno uno è andato a buon fine
}

// ========== SISTEMA DI AUTENTICAZIONE ==========
async function handleLogin(event) {
  event.preventDefault();

  const passwordInput = document.getElementById('password-input');
  const errorDiv = document.getElementById('login-error');
  const enteredPassword = passwordInput.value.trim();

  if (enteredPassword === CORRECT_PASSWORD) {
    // Login riuscito
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';

    try {
      // PRIMA inizializza Firebase e aspetta che finisca
      await initFirebase();

      // POI inizializza l'interfaccia con i dati caricati
      initializeApp();

      console.log('🚀 Login riuscito - App completamente inizializzata');
    } catch (error) {
      console.error('❌ Errore durante inizializzazione:', error);
      // Anche in caso di errore, mostra l'app con i dati locali
      initializeApp();
    }
  } else {
    // Login fallito
    errorDiv.style.display = 'block';
    passwordInput.value = '';
    passwordInput.focus();

    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 3000);
  }
}

function logout() {
  if (confirm('Sei sicuro di voler uscire dal sistema?')) {
    // Disconnetti listeners Firebase
    if (database && isFirebaseConnected) {
      try {
        off(ref(database, 'eventData'));
      } catch (error) {
        console.warn('Errore disconnessione listeners:', error);
      }
    }

    document.getElementById('main-app').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('password-input').value = '';
    document.getElementById('password-input').focus();
    console.log('👋 Logout effettuato');
  }
}

// ========== INIZIALIZZAZIONE APP ==========
function initializeApp() {
  updateTeamInputsFromData();
  updateTeamPreview();
  updateAllTables();
  updateDashboardStats();
  updateSponsorStats();
  updateLocationCheckboxes();
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

  ['membro1-input', 'membro2-input', 'membro3-input'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', updateTeamPreview);
    }
  });

  const loginForm = document.querySelector('.login-form');
  if (loginForm) {
    loginForm.removeEventListener('submit', handleLogin);
    loginForm.addEventListener('submit', handleLogin);
  }

  const targetInput = document.getElementById('sponsor-target');
  if (targetInput) {
    targetInput.value = sponsorTarget;
  }
}

// ========== FUNZIONI FIREBASE TESTING ==========
function testFirebaseConnection() {
  showNotification('🔍 Test connessione Firebase...', 'info');

  if (isFirebaseConnected && database) {
    // Test scrittura/lettura Firebase
    const testData = { test: Date.now() };
    const testRef = ref(database, 'eventData/test');

    set(testRef, testData).then(() => {
      return get(testRef);
    }).then((snapshot) => {
      if (snapshot.exists() && snapshot.val().test === testData.test) {
        showNotification('✅ Firebase completamente funzionante!', 'success');
        set(testRef, null); // Cleanup
      } else {
        showNotification('⚠️ Firebase lettura/scrittura non funziona', 'warning');
      }
    }).catch((error) => {
      console.error('❌ Test Firebase fallito:', error);
      showNotification('❌ Test Firebase fallito: ' + error.message, 'error');
    });
  } else {
    showNotification('⚠️ Firebase non connesso - dati solo locali', 'warning');
  }
}

function showFirebaseStats() {
  const stats = {
    firebase: isFirebaseConnected ? 'Connesso ✅' : 'Offline ❌',
    contatti: appData.contatti.length,
    location: appData.location.length, 
    sponsor: appData.sponsor.length,
    lastSync: new Date().toLocaleString(),
    localStorage: 'Disponibile ✅'
  };

  const message = `📊 Statistiche Sincronizzazione:\n\n` +
    `🔥 Firebase: ${stats.firebase}\n` +
    `💾 LocalStorage: ${stats.localStorage}\n\n` +
    `📊 Dati attuali:\n` +
    `👥 Contatti: ${stats.contatti}\n` +
    `📍 Location: ${stats.location}\n` +
    `💰 Sponsor: ${stats.sponsor}\n\n` +
    `🕐 Ultimo aggiornamento: ${stats.lastSync}`;

  alert(message);
}

// ========== GESTIONE TEAM ==========
function updateTeamInputsFromData() {
  const input1 = document.getElementById('membro1-input');
  const input2 = document.getElementById('membro2-input');
  const input3 = document.getElementById('membro3-input');

  if (input1) input1.value = teamMembers[0] || '';
  if (input2) input2.value = teamMembers[1] || '';
  if (input3) input3.value = teamMembers[2] || '';
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
        <span>${membro3}</span>
      </div>
      <div class="team-member-preview">
        <span class="team-member-icon">👤</span>
        <span>${membro3}</span>
      </div>
    `;
  }
}

async function saveSettings() {
  const membro1 = document.getElementById('membro1-input')?.value?.trim() || 'Membro 1';
  const membro2 = document.getElementById('membro2-input')?.value?.trim() || 'Membro 2';
  const membro3 = document.getElementById('membro3-input')?.value?.trim() || 'Membro 3';

  teamMembers = [membro1, membro2, membro3];

  const success = await saveAllData();
  if (success || !isFirebaseConnected) {
    showNotification('✅ Configurazione team salvata!', 'success');
    updateTeamPreview();
    updateAllTables();
  } else {
    showNotification('⚠️ Errore salvataggio - riprova', 'warning');
  }
}

// ========== CRUD OPERATIONS ==========
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Contatti
async function addContatto() {
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
  await saveAllData();
  updateContattiTable();
  updateDashboardStats();
  showNotification('Contatto aggiunto', 'success');
}

async function updateContatto(id, field, value) {
  const contatto = appData.contatti.find(item => item.id === id);
  if (contatto) {
    contatto[field] = value;
    await saveAllData();
    updateDashboardStats();
  }
}

async function deleteContatto(id) {
  if (confirm('Sei sicuro di voler eliminare questo contatto?')) {
    appData.contatti = appData.contatti.filter(item => item.id !== id);
    await saveAllData();
    updateContattiTable();
    updateDashboardStats();
    showNotification('Contatto eliminato', 'success');
  }
}

// Location
async function addLocation() {
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
  await saveAllData();
  updateLocationTable();
  updateLocationCheckboxes();
  updateDashboardStats();
  showNotification('Location aggiunta', 'success');
}

async function updateLocation(id, field, value) {
  const location = appData.location.find(item => item.id === id);
  if (location) {
    location[field] = value;
    await saveAllData();
    updateDashboardStats();
  }
}

async function deleteLocation(id) {
  if (confirm('Sei sicuro di voler eliminare questa location?')) {
    appData.location = appData.location.filter(item => item.id !== id);
    await saveAllData();
    updateLocationTable();
    updateLocationCheckboxes();
    updateDashboardStats();
    showNotification('Location eliminata', 'success');
  }
}

// Sponsor
async function addSponsor() {
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
  await saveAllData();
  updateSponsorTable();
  updateSponsorStats();
  updateDashboardStats();
  showNotification('Sponsor aggiunto', 'success');
}

async function updateSponsor(id, field, value) {
  const sponsor = appData.sponsor.find(item => item.id === id);
  if (sponsor) {
    sponsor[field] = value;
    await saveAllData();
    updateSponsorStats();
    updateDashboardStats();
  }
}

async function deleteSponsor(id) {
  if (confirm('Sei sicuro di voler eliminare questo sponsor?')) {
    appData.sponsor = appData.sponsor.filter(item => item.id !== id);
    await saveAllData();
    updateSponsorTable();
    updateSponsorStats();
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

  if (!tableBody) return;

  if (appData.contatti.length === 0) {
    if (table) table.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
  } else {
    if (table) table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    tableBody.innerHTML = appData.contatti.map(contatto => `
      <tr class="table-row">
        <td><input type="text" value="${contatto.nome}" onchange="updateContatto('${contatto.id}', 'nome', this.value)"></td>
        <td><input type="text" value="${contatto.cognome}" onchange="updateContatto('${contatto.id}', 'cognome', this.value)"></td>
        <td><input type="text" value="${contatto.azienda}" onchange="updateContatto('${contatto.id}', 'azienda', this.value)"></td>
        <td><input type="email" value="${contatto.email}" onchange="updateContatto('${contatto.id}', 'email', this.value)"></td>
        <td><input type="tel" value="${contatto.telefono}" onchange="updateContatto('${contatto.id}', 'telefono', this.value)"></td>
        <td><input type="text" value="${contatto.ruolo}" onchange="updateContatto('${contatto.id}', 'ruolo', this.value)"></td>
        <td>
          <select onchange="updateContatto('${contatto.id}', 'assegnato', this.value)">
            ${teamMembers.map(member => 
              `<option value="${member}" ${contatto.assegnato === member ? 'selected' : ''}>${member}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <select onchange="updateContatto('${contatto.id}', 'stato', this.value)">
            ${OPTIONS.statoContatto.map(stato => 
              `<option value="${stato}" ${contatto.stato === stato ? 'selected' : ''}>${stato}</option>`
            ).join('')}
          </select>
        </td>
        <td><input type="text" value="${contatto.scopo}" onchange="updateContatto('${contatto.id}', 'scopo', this.value)"></td>
        <td><input type="date" value="${contatto.dataUltimoContatto}" onchange="updateContatto('${contatto.id}', 'dataUltimoContatto', this.value)"></td>
        <td><input type="date" value="${contatto.prossimoFollowup}" onchange="updateContatto('${contatto.id}', 'prossimoFollowup', this.value)"></td>
        <td><textarea onchange="updateContatto('${contatto.id}', 'note', this.value)">${contatto.note}</textarea></td>
        <td>
          <select onchange="updateContatto('${contatto.id}', 'priorita', this.value)">
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

  if (!tableBody) return;

  if (appData.location.length === 0) {
    if (table) table.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
  } else {
    if (table) table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    tableBody.innerHTML = appData.location.map(location => {
      const budgetBase = parseFloat(location.budgetBase) || 0;
      const costiExtra = parseFloat(location.costiAggiuntivi) || 0;
      const totale = budgetBase + costiExtra;

      return `
      <tr class="table-row">
        <td><input type="text" value="${location.nome}" onchange="updateLocation('${location.id}', 'nome', this.value)"></td>
        <td><input type="text" value="${location.indirizzo}" onchange="updateLocation('${location.id}', 'indirizzo', this.value)"></td>
        <td><input type="text" value="${location.referente}" onchange="updateLocation('${location.id}', 'referente', this.value)"></td>
        <td><input type="text" value="${location.contatto}" onchange="updateLocation('${location.id}', 'contatto', this.value)"></td>
        <td><input type="number" value="${location.capienza}" onchange="updateLocation('${location.id}', 'capienza', this.value)"></td>
        <td><input type="number" value="${location.budgetBase}" onchange="updateLocation('${location.id}', 'budgetBase', this.value)"></td>
        <td><input type="number" value="${location.costiAggiuntivi}" onchange="updateLocation('${location.id}', 'costiAggiuntivi', this.value)"></td>
        <td style="font-weight: 600; color: #1d4ed8;">€${totale.toLocaleString()}</td>
        <td><input type="text" value="${location.orari}" onchange="updateLocation('${location.id}', 'orari', this.value)"></td>
        <td><input type="text" value="${location.attrezzature}" onchange="updateLocation('${location.id}', 'attrezzature', this.value)"></td>
        <td>
          <select onchange="updateLocation('${location.id}', 'catering', this.value)">
            <option value="Si" ${location.catering === 'Si' ? 'selected' : ''}>Si</option>
            <option value="No" ${location.catering === 'No' ? 'selected' : ''}>No</option>
          </select>
        </td>
        <td>
          <select onchange="updateLocation('${location.id}', 'parcheggio', this.value)">
            <option value="Si" ${location.parcheggio === 'Si' ? 'selected' : ''}>Si</option>
            <option value="No" ${location.parcheggio === 'No' ? 'selected' : ''}>No</option>
            <option value="A pagamento" ${location.parcheggio === 'A pagamento' ? 'selected' : ''}>A pagamento</option>
          </select>
        </td>
        <td><input type="text" value="${location.trasporti}" onchange="updateLocation('${location.id}', 'trasporti', this.value)"></td>
        <td>
          <select onchange="updateLocation('${location.id}', 'status', this.value)">
            ${OPTIONS.statusLocation.map(status => 
              `<option value="${status}" ${location.status === status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <select onchange="updateLocation('${location.id}', 'valutazione', parseInt(this.value))">
            ${[1,2,3,4,5].map(val => 
              `<option value="${val}" ${location.valutazione === val ? 'selected' : ''}>${val} ⭐</option>`
            ).join('')}
          </select>
        </td>
        <td><textarea onchange="updateLocation('${location.id}', 'note', this.value)">${location.note}</textarea></td>
        <td><button onclick="deleteLocation('${location.id}')" class="btn btn--danger">🗑️</button></td>
      </tr>
    `;
    }).join('');
  }
}

function updateSponsorTable() {
  const tableBody = document.getElementById('sponsor-table-body');
  const emptyState = document.getElementById('sponsor-empty-state');
  const table = document.getElementById('sponsor-table');

  if (!tableBody) return;

  if (appData.sponsor.length === 0) {
    if (table) table.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
  } else {
    if (table) table.style.display = 'table';
    if (emptyState) emptyState.style.display = 'none';

    tableBody.innerHTML = appData.sponsor.map(sponsor => `
      <tr class="table-row">
        <td><input type="text" value="${sponsor.nome}" onchange="updateSponsor('${sponsor.id}', 'nome', this.value)"></td>
        <td><input type="text" value="${sponsor.referente}" onchange="updateSponsor('${sponsor.id}', 'referente', this.value)"></td>
        <td><input type="email" value="${sponsor.email}" onchange="updateSponsor('${sponsor.id}', 'email', this.value)"></td>
        <td><input type="tel" value="${sponsor.telefono}" onchange="updateSponsor('${sponsor.id}', 'telefono', this.value)"></td>
        <td>
          <select onchange="updateSponsor('${sponsor.id}', 'tipoSponsor', this.value)">
            ${OPTIONS.tipoSponsor.map(tipo => 
              `<option value="${tipo}" ${sponsor.tipoSponsor === tipo ? 'selected' : ''}>${tipo}</option>`
            ).join('')}
          </select>
        </td>
        <td><input type="number" value="${sponsor.importo}" onchange="updateSponsor('${sponsor.id}', 'importo', this.value)"></td>
        <td>
          <select onchange="updateSponsor('${sponsor.id}', 'tipoContributo', this.value)">
            ${OPTIONS.tipoContributo.map(tipo => 
              `<option value="${tipo}" ${sponsor.tipoContributo === tipo ? 'selected' : ''}>${tipo}</option>`
            ).join('')}
          </select>
        </td>
        <td><input type="text" value="${sponsor.servizi}" onchange="updateSponsor('${sponsor.id}', 'servizi', this.value)"></td>
        <td>
          <select onchange="updateSponsor('${sponsor.id}', 'status', this.value)">
            ${OPTIONS.statusSponsor.map(status => 
              `<option value="${status}" ${sponsor.status === status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </td>
        <td><input type="date" value="${sponsor.dataProposta}" onchange="updateSponsor('${sponsor.id}', 'dataProposta', this.value)"></td>
        <td><input type="date" value="${sponsor.scadenzaRisposta}" onchange="updateSponsor('${sponsor.id}', 'scadenzaRisposta', this.value)"></td>
        <td><input type="text" value="${sponsor.benefici}" onchange="updateSponsor('${sponsor.id}', 'benefici', this.value)"></td>
        <td><input type="checkbox" ${sponsor.deliverables ? 'checked' : ''} onchange="updateSponsor('${sponsor.id}', 'deliverables', this.checked)"></td>
        <td><textarea onchange="updateSponsor('${sponsor.id}', 'note', this.value)">${sponsor.note}</textarea></td>
        <td><button onclick="deleteSponsor('${sponsor.id}')" class="btn btn--danger">🗑️</button></td>
      </tr>
    `).join('');
  }
}

// ========== DASHBOARD E STATISTICHE ==========
function updateDashboardStats() {
  const elements = {
    'total-contatti': appData.contatti.length,
    'total-location': appData.location.length,
    'total-sponsor': appData.sponsor.length,
    'contatti-confermati': appData.contatti.filter(c => c.stato === 'Confermato').length,
    'location-confermate': appData.location.filter(l => l.status === 'Confermato').length,
    'sponsor-confermati': appData.sponsor.filter(s => s.status === 'Confermato').length
  };

  Object.entries(elements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  const totalSponsorValue = appData.sponsor
    .filter(s => s.importo && !isNaN(parseFloat(s.importo)))
    .reduce((sum, s) => sum + parseFloat(s.importo), 0);

  const confirmedSponsorValue = appData.sponsor
    .filter(s => s.status === 'Confermato' && s.importo && !isNaN(parseFloat(s.importo)))
    .reduce((sum, s) => sum + parseFloat(s.importo), 0);

  const valoreSponsorEl = document.getElementById('valore-sponsor');
  const valoreConfEl = document.getElementById('valore-confermato');

  if (valoreSponsorEl) valoreSponsorEl.textContent = `€${totalSponsorValue.toLocaleString()}`;
  if (valoreConfEl) valoreConfEl.textContent = `€${confirmedSponsorValue.toLocaleString()}`;

  const prioritaAlta = appData.contatti.filter(c => c.priorita === 'Alta').length;
  const prioritaEl = document.getElementById('priorita-alta');
  if (prioritaEl) prioritaEl.textContent = prioritaAlta;
}

async function updateSponsorStats() {
  const totalValue = appData.sponsor
    .filter(s => s.importo && !isNaN(parseFloat(s.importo)))
    .reduce((sum, s) => sum + parseFloat(s.importo), 0);

  const confirmedValue = appData.sponsor
    .filter(s => s.status === 'Confermato' && s.importo && !isNaN(parseFloat(s.importo)))
    .reduce((sum, s) => sum + parseFloat(s.importo), 0);

  const pendingValue = appData.sponsor
    .filter(s => s.status === 'In negoziazione' && s.importo && !isNaN(parseFloat(s.importo)))
    .reduce((sum, s) => sum + parseFloat(s.importo), 0);

  const totalSponsors = appData.sponsor.length;
  const confirmedSponsors = appData.sponsor.filter(s => s.status === 'Confermato').length;
  const pendingSponsors = appData.sponsor.filter(s => s.status === 'In negoziazione').length;

  const elements = {
    'total-sponsorship-value': `€${totalValue.toLocaleString()}`,
    'confirmed-sponsorship-value': `€${confirmedValue.toLocaleString()}`,
    'pending-sponsorship-value': `€${pendingValue.toLocaleString()}`,
    'sponsor-breakdown': `${totalSponsors} sponsor totali`,
    'confirmed-sponsor-breakdown': `${confirmedSponsors} sponsor confermati`,
    'pending-sponsor-breakdown': `${pendingSponsors} sponsor in corso`
  };

  Object.entries(elements).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });

  const targetInput = document.getElementById('sponsor-target');
  const currentTarget = parseFloat(targetInput?.value) || sponsorTarget;
  if (currentTarget > 0) {
    const percentage = Math.round((confirmedValue / currentTarget) * 100);
    const progressEl = document.getElementById('target-progress');
    if (progressEl) progressEl.textContent = `${Math.min(percentage, 100)}%`;
    if (sponsorTarget !== currentTarget) {
      sponsorTarget = currentTarget;
      await saveAllData();
    }
  } else {
    const progressEl = document.getElementById('target-progress');
    if (progressEl) progressEl.textContent = '0%';
  }
}

// ========== CONFRONTO LOCATION ==========
let locationComparisonVisible = false;

function toggleLocationComparison() {
  const container = document.getElementById('location-comparison');
  const btn = document.getElementById('compare-btn');

  if (!container || !btn) return;

  locationComparisonVisible = !locationComparisonVisible;

  if (locationComparisonVisible) {
    container.style.display = 'block';
    btn.textContent = '❌ Chiudi Confronto';
    updateLocationCheckboxes();
  } else {
    container.style.display = 'none';
    btn.textContent = '📊 Confronta Location';
  }
}

function updateLocationCheckboxes() {
  const container = document.getElementById('location-checkboxes');
  if (!container) return;

  if (appData.location.length === 0) {
    container.innerHTML = '<p style="color: #64748b;">Aggiungi location per utilizzare il confronto</p>';
    return;
  }

  container.innerHTML = appData.location.map(location => `
    <div class="checkbox-item">
      <input type="checkbox" id="compare-${location.id}" value="${location.id}">
      <label for="compare-${location.id}">${location.nome || 'Location senza nome'}</label>
    </div>
  `).join('');
}

function generateComparison() {
  const checkboxes = document.querySelectorAll('#location-checkboxes input[type="checkbox"]:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.value);

  if (selectedIds.length < 2) {
    alert('Seleziona almeno 2 location per il confronto');
    return;
  }

  const selectedLocations = appData.location.filter(loc => selectedIds.includes(loc.id));
  const resultsContainer = document.getElementById('comparison-results');
  const table = document.getElementById('comparison-table');

  if (!resultsContainer || !table) return;

  const headers = ['Caratteristica', ...selectedLocations.map(loc => loc.nome || 'Senza nome')];

  const rows = [
    ['Capienza', ...selectedLocations.map(loc => loc.capienza || 'N/D')],
    ['Budget Base (€)', ...selectedLocations.map(loc => loc.budgetBase ? `€${parseInt(loc.budgetBase).toLocaleString()}` : 'N/D')],
    ['Costi Extra (€)', ...selectedLocations.map(loc => loc.costiAggiuntivi ? `€${parseInt(loc.costiAggiuntivi).toLocaleString()}` : 'N/D')],
    ['Totale (€)', ...selectedLocations.map(loc => {
      const base = parseFloat(loc.budgetBase) || 0;
      const extra = parseFloat(loc.costiAggiuntivi) || 0;
      return `€${(base + extra).toLocaleString()}`;
    })],
    ['Catering', ...selectedLocations.map(loc => loc.catering || 'N/D')],
    ['Parcheggio', ...selectedLocations.map(loc => loc.parcheggio || 'N/D')],
    ['Valutazione', ...selectedLocations.map(loc => `${loc.valutazione || 0} ⭐`)],
    ['Status', ...selectedLocations.map(loc => loc.status || 'N/D')]
  ];

  const budgetTotals = selectedLocations.map(loc => {
    const base = parseFloat(loc.budgetBase) || 0;
    const extra = parseFloat(loc.costiAggiuntivi) || 0;
    return base + extra;
  });
  const minBudget = Math.min(...budgetTotals.filter(b => b > 0));
  const maxBudget = Math.max(...budgetTotals);

  table.innerHTML = `
    <thead>
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows.map((row, rowIndex) => `
        <tr>
          ${row.map((cell, cellIndex) => {
            let className = '';
            if (rowIndex === 3 && cellIndex > 0) {
              const value = budgetTotals[cellIndex - 1];
              if (value === minBudget && value > 0) className = 'best-value';
              if (value === maxBudget && value > minBudget) className = 'worst-value';
            }
            return `<td class="${className}">${cell}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  `;

  resultsContainer.style.display = 'block';
  showNotification(`Confronto generato per ${selectedIds.length} location`, 'success');
}

// ========== UTILITÀ ==========
function switchTab(tabName) {
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const targetTab = document.getElementById(`${tabName}-tab`);
  if (targetTab) targetTab.classList.add('active');

  if (event && event.target) {
    event.target.classList.add('active');
  }
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
    settings: { sponsorTarget },
    firebase: { 
      connected: isFirebaseConnected,
      project: 'event-management-assomor-a7b0f'
    },
    exportDate: new Date().toISOString(),
    version: "5.0-ModernFirebase"
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

function showSaveIndicator(text = '☁️ Sincronizzato') {
  const indicator = document.getElementById('save-indicator');
  if (indicator) {
    indicator.textContent = text;
    indicator.style.display = 'flex';
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 2000);
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message;

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
    backgroundColor: type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#3b82f6'
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

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
  console.log('🚀 Sistema Event Management con Firebase moderno avviato');

  if (typeof Storage === 'undefined') {
    alert('⚠️ Il tuo browser non supporta il salvataggio automatico.');
  }

  // Controlla se Firebase è disponibile
  if (!window.firebaseApp || !window.firebaseDatabase) {
    console.error('❌ Firebase non inizializzato correttamente');
    alert('❌ Errore: Firebase non inizializzato. Controlla la connessione internet.');
  }

  const passwordInput = document.getElementById('password-input');
  if (passwordInput) {
    passwordInput.focus();
  }

  console.log('✅ Sistema pronto - inserire password per accedere');
});
