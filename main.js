class GameManager {
    constructor() {
        this.totalPlayers = 0;
        this.currentPlayer = 1;
        this.playerSquads = {};
        this.pcInit = false; // points calculator initialized once

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Ana menü butonları
        document.getElementById('startRebuild').addEventListener('click', () => this.showPlayerCount());
        document.getElementById('calculatePoints').addEventListener('click', () => this.showPointsCalculator());
        const goHomeBtn = document.getElementById('goHomeBtn');
        if (goHomeBtn) {
            goHomeBtn.addEventListener('click', () => this.goHome());
        }

        // Oyuncu sayısı girişi
        const startBtn = document.getElementById('startGame');
        if (startBtn) startBtn.addEventListener('click', () => this.startGame());

        // +/- butonları
        const inc = document.getElementById('playerIncrement');
        const dec = document.getElementById('playerDecrement');
        if (inc) inc.addEventListener('click', () => this.adjustPlayerCount(1));
        if (dec) dec.addEventListener('click', () => this.adjustPlayerCount(-1));

        // Enter ile başlatma
        const playerInputEl = document.getElementById('playerNumber');
        if (playerInputEl) {
            playerInputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.startGame();
            });
        }

        // Sıradaki oyuncu butonu
        const nextPlayerBtn = document.getElementById('nextPlayerBtn');
        if (nextPlayerBtn) {
            nextPlayerBtn.addEventListener('click', () => this.nextPlayer());
        }

        // Kadro sıfırla butonu
        const clearBtn = document.getElementById('clearSquadBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (window.squadManager) {
                    window.squadManager.clearSquad();
                    // Persist the cleared state for the current player
                    this.playerSquads[this.currentPlayer] = window.squadManager.squad.getSquadData();
                }
            });
        }
    }

    showPlayerCount() {
        document.querySelector('.main-menu').classList.add('hidden');
        document.getElementById('playerCount').classList.remove('hidden');
        // Varsayılan değeri ata ve odağı ver
        const input = document.getElementById('playerNumber');
        if (input) {
            if (!input.value) input.value = '1';
            input.focus();
            input.select();
        }
    }

    startGame() {
        const playerCount = parseInt(document.getElementById('playerNumber').value);
        if (isNaN(playerCount) || playerCount < 1) {
            alert('Lütfen geçerli bir oyuncu sayısı girin.');
            return;
        }

        this.totalPlayers = playerCount;
        this.currentPlayer = 1;
        this.playerSquads = {};

        // Initialize squads for all players
        for (let i = 1; i <= this.totalPlayers; i++) {
            this.playerSquads[i] = {
                players: [],
                formation: null
            };
        }

        // Hide player count screen and show game screen
        document.getElementById('playerCount').classList.add('hidden');
        document.getElementById('gameScreen').classList.remove('hidden');

        // Initialize wheel and squad manager if not already done
        if (!window.wheel) {
            window.wheel = new Wheel();
        }
        if (!window.squadManager) {
            window.squadManager = new SquadManager();
        }

        // Update the squad title
        this.updateSquadTitle();
    }

    nextPlayer() {
        // Save current squad state
        if (window.squadManager) {
            this.playerSquads[this.currentPlayer] = window.squadManager.squad.getSquadData();
        }

        // Move to next player
        this.currentPlayer = this.currentPlayer % this.totalPlayers + 1;

        // Update the squad title
        this.updateSquadTitle();

        // Load the next player's squad
        if (window.squadManager) {
            const nextSquad = this.playerSquads[this.currentPlayer] || { players: [], formation: null };
            window.squadManager.loadSquad(nextSquad);
        }
    }

    updateSquadTitle() {
        const squadTitle = document.getElementById('squadTitle');
        if (squadTitle) {
            squadTitle.textContent = `${this.currentPlayer}. Oyuncunun Kadrosu`;
        }
    }

    adjustPlayerCount(delta) {
        const input = document.getElementById('playerNumber');
        if (!input) return;
        const current = parseInt(input.value);
        const base = isNaN(current) ? 1 : current;
        const next = Math.max(1, base + delta);
        input.value = String(next);
    }

    nextPlayer() {
        // Mevcut oyuncunun kadrosunu DERİN kopya ile kaydet
        const currentData = window.squadManager.squad.getSquadData();
        this.playerSquads[this.currentPlayer] = currentData;

        // Sıradaki oyuncuya geç (döngüsel)
        if (this.totalPlayers <= 1) {
            // Tek oyuncuysa aynı oyuncuda kal, sadece durumu yeniden yükle
            window.squadManager.squad.setSquadData(this.playerSquads[this.currentPlayer] || {});
            this.updatePlayerDisplay();
            return;
        }

        this.currentPlayer = (this.currentPlayer % this.totalPlayers) + 1; // 1..N arasında döngü

        // Yeni oyuncunun kadrosunu yükle (yoksa boş kadro)
        const nextData = this.playerSquads[this.currentPlayer] || {};
        window.squadManager.squad.setSquadData(nextData);
        this.updatePlayerDisplay();
    }

    updatePlayerDisplay() {
        const title = document.getElementById('squadTitle');
        if (title) title.textContent = `${this.currentPlayer}. Oyuncunun Kadrosu`;
    }

    showPointsCalculator() {
        // Ekranlar arası geçiş
        const mainMenu = document.querySelector('.main-menu');
        const playerCount = document.getElementById('playerCount');
        const gameScreen = document.getElementById('gameScreen');
        const pointsScreen = document.getElementById('pointsScreen');
        if (mainMenu) mainMenu.classList.add('hidden');
        if (playerCount) playerCount.classList.add('hidden');
        if (gameScreen) gameScreen.classList.add('hidden');
        if (pointsScreen) pointsScreen.classList.remove('hidden');

        if (!this.pcInit) {
            this.initPointsCalculator();
            this.pcInit = true;
        }
        this.pcRecalc();
    }

    goHome() {
        // Tüm ekranları gizle, ana menüyü göster
        const mainMenu = document.querySelector('.main-menu');
        const playerCount = document.getElementById('playerCount');
        const gameScreen = document.getElementById('gameScreen');
        if (mainMenu) mainMenu.classList.remove('hidden');
        if (playerCount) playerCount.classList.add('hidden');
        if (gameScreen) gameScreen.classList.add('hidden');
        const pointsScreen = document.getElementById('pointsScreen');
        if (pointsScreen) pointsScreen.classList.add('hidden');
    }

    // --------------- Points Calculator ---------------
    initPointsCalculator() {
        const ids = [
            'pc_league_place','pc_league_golden_boot','pc_league_gb_split','pc_league_assist','pc_league_as_split','pc_league_gk','pc_league_gk_split','pc_league_avg','pc_league_eff',
            'pc_cups_stage',
            // UEL
            'pc_uel_participate','pc_uel_stage','pc_uel_gb','pc_uel_gb_split','pc_uel_as','pc_uel_as_split','pc_uel_gk','pc_uel_gk_split','pc_uel_elim',
            // UCL
            'pc_ucl_stage','pc_ucl_gb','pc_ucl_gb_split','pc_ucl_as','pc_ucl_as_split','pc_ucl_gk','pc_ucl_gk_split','pc_ucl_group','pc_ucl_elim'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.pcRecalc());
                el.addEventListener('change', () => this.pcRecalc());
            }
        });

        // Katılım değiştiğinde alanları etkinleştir/devre dışı bırak
        const part = document.getElementById('pc_uel_participate');
        if (part) part.addEventListener('change', () => this.pcApplyUelEnabled());
        this.pcApplyUelEnabled();

        // Actions
        const reset = document.getElementById('pc_reset');
        if (reset) reset.addEventListener('click', () => this.pcReset());
        const printBtn = document.getElementById('pc_print');
        if (printBtn) printBtn.addEventListener('click', () => window.print());
    }

    pcGetState() {
        const val = id => document.getElementById(id)?.value;
        return {
            league_place: val('pc_league_place'),
            league_gb: val('pc_league_golden_boot'), gb_split: +val('pc_league_gb_split') || 1,
            league_as: val('pc_league_assist'), as_split: +val('pc_league_as_split') || 1,
            league_gk: val('pc_league_gk'), gk_split: +val('pc_league_gk_split') || 1,
            league_avg: +val('pc_league_avg') || 0,
            league_eff: +val('pc_league_eff') || 0,

            cups_stage: val('pc_cups_stage'),

            // UEL
            uel_participate: val('pc_uel_participate') || '0',
            uel_stage: val('pc_uel_stage'),
            uel_gb: val('pc_uel_gb'), uel_gb_split: +val('pc_uel_gb_split') || 1,
            uel_as: val('pc_uel_as'), uel_as_split: +val('pc_uel_as_split') || 1,
            uel_gk: val('pc_uel_gk'), uel_gk_split: +val('pc_uel_gk_split') || 1,
            uel_elim: val('pc_uel_elim'),

            // UCL
            ucl_stage: val('pc_ucl_stage'),
            ucl_gb: val('pc_ucl_gb'), ucl_gb_split: +val('pc_ucl_gb_split') || 1,
            ucl_as: val('pc_ucl_as'), ucl_as_split: +val('pc_ucl_as_split') || 1,
            ucl_gk: val('pc_ucl_gk'), ucl_gk_split: +val('pc_ucl_gk_split') || 1,
            ucl_group: val('pc_ucl_group'), ucl_elim: val('pc_ucl_elim')
        };
    }

    pcSetState(state) {
        const set = (id, v) => { const el = document.getElementById(id); if (el && v !== undefined) el.value = String(v); };
        set('pc_league_place', state.league_place);
        set('pc_league_golden_boot', state.league_gb); set('pc_league_gb_split', state.gb_split);
        set('pc_league_assist', state.league_as); set('pc_league_as_split', state.as_split);
        set('pc_league_gk', state.league_gk); set('pc_league_gk_split', state.gk_split);
        set('pc_league_avg', state.league_avg); set('pc_league_eff', state.league_eff);
        set('pc_cups_stage', state.cups_stage);
        set('pc_uel_participate', state.uel_participate);
        set('pc_uel_stage', state.uel_stage);
        set('pc_uel_gb', state.uel_gb); set('pc_uel_gb_split', state.uel_gb_split);
        set('pc_uel_as', state.uel_as); set('pc_uel_as_split', state.uel_as_split);
        set('pc_uel_gk', state.uel_gk); set('pc_uel_gk_split', state.uel_gk_split);
        set('pc_uel_elim', state.uel_elim);
        set('pc_ucl_stage', state.ucl_stage);
        set('pc_ucl_gb', state.ucl_gb); set('pc_ucl_gb_split', state.ucl_gb_split);
        set('pc_ucl_as', state.ucl_as); set('pc_ucl_as_split', state.ucl_as_split);
        set('pc_ucl_gk', state.ucl_gk); set('pc_ucl_gk_split', state.ucl_gk_split);
        set('pc_ucl_group', state.ucl_group); set('pc_ucl_elim', state.ucl_elim);
    }

    pcRecalc() {
        const s = this.pcGetState();
        const breakdown = [];
        let total = 0;

        // 1) Lig - Sıralama
        const leaguePlacePts = { '1':250, '2':100, '3':50, '4':25, '5+':0 }[s.league_place] || 0;
        total += leaguePlacePts; breakdown.push(['Lig Sıralama', leaguePlacePts]);

        // Lig - Krallıklar
        const placePtsSmall = p => ({ '1':20, '2':10, '3':5 }[p] || 0);
        const gb = placePtsSmall(s.league_gb) / Math.max(1, s.gb_split); total += gb; breakdown.push(['Lig Gol Krallığı', gb]);
        const as = placePtsSmall(s.league_as) / Math.max(1, s.as_split); total += as; breakdown.push(['Lig Asist Krallığı', as]);
        const gk = placePtsSmall(s.league_gk) / Math.max(1, s.gk_split); total += gk; breakdown.push(['Lig Kaleci Krallığı', gk]);

        // Averaj + Puan, Verim
        total += s.league_avg; breakdown.push(['Lig Averaj + Puan', s.league_avg]);
        total += s.league_eff; breakdown.push(['Lig Verim', s.league_eff]);

        // 2) Kupalar
        const cupsPtsMap = { W:50, RU:25, SF:10, QF:5, R16:0 };
        const cupsPts = cupsPtsMap[s.cups_stage] || 0; total += cupsPts; breakdown.push(['Kupalar', cupsPts]);

        // 3) UEL
        if (s.uel_participate === '1') {
            const uelStagePts = { W:250, RU:120, SF:60, QF:30, R16:15, R16_OUT:0 }[s.uel_stage] || 0; total += uelStagePts; breakdown.push(['UEL Seviye', uelStagePts]);
            const uelGbPts = placePtsSmall(s.uel_gb) / Math.max(1, s.uel_gb_split); total += uelGbPts; breakdown.push(['UEL Gol Krallığı', uelGbPts]);
            const uelAsPts = placePtsSmall(s.uel_as) / Math.max(1, s.uel_as_split); total += uelAsPts; breakdown.push(['UEL Asist Krallığı', uelAsPts]);
            const uelGkPts = placePtsSmall(s.uel_gk) / Math.max(1, s.uel_gk_split); total += uelGkPts; breakdown.push(['UEL Kaleci Krallığı', uelGkPts]);
            const uelElimPts = s.uel_elim === '1' ? 25 : 0; total += uelElimPts; breakdown.push(['UEL Elendiğin Takım 1.', uelElimPts]);
        } else {
            breakdown.push(['UEL (devam etmedi)', 0]);
        }

        // 4) UCL
        const uclPlacePts = p => ({ '1':40, '2':20, '3':10 }[p] || 0);
        // Eğer ŞL'den elendiyse: UCL seviye, ilk aşama ve elendiğin takım puanları 0; krallıklar devam eder
        if (s.uel_participate === '1') {
            breakdown.push(['UCL Seviye (ŞL’den elendi)', 0]);
            const uclGbPts = uclPlacePts(s.ucl_gb) / Math.max(1, s.ucl_gb_split); total += uclGbPts; breakdown.push(['UCL Gol Krallığı', uclGbPts]);
            const uclAsPts = uclPlacePts(s.ucl_as) / Math.max(1, s.ucl_as_split); total += uclAsPts; breakdown.push(['UCL Asist Krallığı', uclAsPts]);
            const uclGkPts = uclPlacePts(s.ucl_gk) / Math.max(1, s.ucl_gk_split); total += uclGkPts; breakdown.push(['UCL Kaleci Krallığı', uclGkPts]);
            breakdown.push(['UCL İlk Aşama İlk 4 (ŞL’den elendi)', 0]);
            breakdown.push(['UCL Elendiğin Takım 1. (ŞL’den elendi)', 0]);
        } else {
            const uclStagePts = { W:500, RU:325, SF:200, QF:150, R16:75 }[s.ucl_stage] || 0; total += uclStagePts; breakdown.push(['UCL Seviye', uclStagePts]);
            const uclGbPts = uclPlacePts(s.ucl_gb) / Math.max(1, s.ucl_gb_split); total += uclGbPts; breakdown.push(['UCL Gol Krallığı', uclGbPts]);
            const uclAsPts = uclPlacePts(s.ucl_as) / Math.max(1, s.ucl_as_split); total += uclAsPts; breakdown.push(['UCL Asist Krallığı', uclAsPts]);
            const uclGkPts = uclPlacePts(s.ucl_gk) / Math.max(1, s.ucl_gk_split); total += uclGkPts; breakdown.push(['UCL Kaleci Krallığı', uclGkPts]);
            const uclGroupPts = s.ucl_group === '1' ? 30 : 0; total += uclGroupPts; breakdown.push(['UCL İlk Aşama İlk 4', uclGroupPts]);
            const uclElimPts = s.ucl_elim === '1' ? 50 : 0; total += uclElimPts; breakdown.push(['UCL Elendiğin Takım 1.', uclElimPts]);
        }

        // UI yaz
        const totalEl = document.getElementById('pc_total');
        if (totalEl) totalEl.textContent = Math.round(total).toString();
        const list = document.getElementById('pc_breakdown');
        if (list) {
            list.innerHTML = '';
            breakdown.forEach(([name, pts]) => {
                const li = document.createElement('li');
                const k = document.createElement('span');
                k.textContent = name;
                const v = document.createElement('span');
                v.textContent = String(Math.round(pts));
                li.appendChild(k); li.appendChild(v);
                list.appendChild(li);
            });
        }

    }

    pcReset() {
        const defaults = {
            // Lig
            league_place:'', league_gb:'', gb_split:1, league_as:'', as_split:1, league_gk:'', gk_split:1, league_avg:0, league_eff:0,
            // Kupalar
            cups_stage:'',
            // UEL
            uel_participate:'0', uel_stage:'', uel_gb:'', uel_gb_split:1, uel_as:'', uel_as_split:1, uel_gk:'', uel_gk_split:1, uel_elim:'',
            // UCL
            ucl_stage:'', ucl_gb:'', ucl_gb_split:1, ucl_as:'', ucl_as_split:1, ucl_gk:'', ucl_gk_split:1, ucl_group:'', ucl_elim:''
        };
        this.pcSetState(defaults);
        this.pcApplyUelEnabled();
        this.pcRecalc();
    }

    pcApplyUelEnabled() {
        const uelEnabled = (document.getElementById('pc_uel_participate')?.value || '0') === '1';
        const uelIds = ['pc_uel_stage','pc_uel_gb','pc_uel_gb_split','pc_uel_as','pc_uel_as_split','pc_uel_gk','pc_uel_gk_split','pc_uel_elim'];
        uelIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = !uelEnabled;
        });
        // ŞL'den elenildiyse UCL'de sıralama, ilk aşama ve elendiğin takım alanlarını devre dışı bırak
        const uclDisable = uelEnabled; // elendiyse devre dışı
        const uclIds = ['pc_ucl_stage','pc_ucl_group','pc_ucl_elim'];
        uclIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = uclDisable;
        });
    }

    // Export/Share and URL state sync removed per requirements
}

// Sayfa yüklendiğinde oyun yöneticisini başlat
window.addEventListener('load', () => {
    window.gameManager = new GameManager();
});
