class Squad {
    constructor() {
        this.positions = {
            'KL': { x: 50, y: 10, name: 'Kaleci' },
            'STP': { x: 50, y: 30, name: 'Stoper' },
            'SĞB': { x: 75, y: 40, name: 'Sağ Bek' },
            'SLB': { x: 25, y: 40, name: 'Sol Bek' },
            'MDO': { x: 50, y: 50, name: 'Merkez Defansif' },
            'MO': { x: 50, y: 60, name: 'Merkez Orta' },
            'MOO': { x: 50, y: 70, name: 'Merkez Ofansif' },
            'SĞK': { x: 75, y: 80, name: 'Sağ Kanat' },
            'SLK': { x: 25, y: 80, name: 'Sol Kanat' },
            'ST': { x: 50, y: 90, name: 'Santrafor' }
        };

        this.squad = {};
        Object.keys(this.positions).forEach(pos => {
            this.squad[pos] = [];
        });
    }

    addPlayer(position, name) {
        name = name.trim();
        if (!name) return false;
        
        // Check if player already exists in any position
        for (const pos in this.squad) {
            if (this.squad[pos].includes(name)) {
                return false;
            }
        }

        // Add player to the specified position
        this.squad[position].push(name);
        this.updateUI(position);
        return true;
    }

    updateUI(position) {
        const container = document.querySelector(`.position-item[data-position="${position}"] .added-players`);
        if (!container) return;
        
        // Store the current scroll position
        const scrollTop = container.scrollTop;
        
        container.innerHTML = '';
        
        this.squad[position].forEach(player => {
            const playerEl = document.createElement('div');
            // Keep both classes for styling and identification
            playerEl.className = 'player player-card';
            playerEl.draggable = true;
            playerEl.dataset.name = player;
            playerEl.dataset.position = position;
            playerEl.innerHTML = `
                <span class="player-content">${player}</span>
                <button class="remove-player" data-position="${position}" data-player="${player}" aria-label="${player} oyuncusunu kaldır">×</button>
            `;

            // Drag handlers
            playerEl.addEventListener('dragstart', (e) => {
                playerEl.classList.add('dragging');
                const payload = { position, name: player };
                e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                e.dataTransfer.effectAllowed = 'move';
            });
            playerEl.addEventListener('dragend', () => {
                playerEl.classList.remove('dragging');
            });

            container.appendChild(playerEl);
        });
        
        // Restore the scroll position
        container.scrollTop = scrollTop;
        
        // Update the selected count
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const selectedCountElement = document.getElementById('selectedCount');
        if (selectedCountElement) {
            const selectedCount = Object.values(this.squad).reduce((acc, players) => acc + players.length, 0);
            selectedCountElement.textContent = selectedCount;
        }
    }

    enableDragAndDrop() {
        // Make position items drop targets
        document.querySelectorAll('.position-item').forEach(item => {
            const position = item.dataset.position;
            const dropZone = item.querySelector('.added-players');

            if (!dropZone) return;

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                
                try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const fromPosition = data.position;
                    const playerName = data.name;
                    const toPosition = position;

                    // If dropped in the same position, do nothing
                    if (fromPosition === toPosition) return;

                    // Move player in data model
                    const fromList = this.squad[fromPosition];
                    const idx = fromList.indexOf(playerName);
                    if (idx > -1) fromList.splice(idx, 1);

                    const toList = this.squad[toPosition];
                    if (!toList.includes(playerName)) toList.push(playerName);

                    // Re-render both positions
                    this.updateUI(fromPosition);
                    this.updateUI(toPosition);
                } catch (error) {
                    console.error('Error handling drop:', error);
                }
            });
        });
    }

    // Remove player from squad
    removePlayer(position, name) {
        if (!this.squad[position]) return false;
        const idx = this.squad[position].indexOf(name);
        if (idx === -1) return false;
        this.squad[position].splice(idx, 1);
        this.updateUI(position);
        return true;
    }

    // Get current squad data
    getSquadData() {
        return JSON.parse(JSON.stringify(this.squad));
    }

    // Set squad data and re-render all positions
    setSquadData(data) {
        if (!data || typeof data !== 'object') return;
        // Replace internal model with provided data (only known positions)
        Object.keys(this.squad).forEach(pos => {
            this.squad[pos] = Array.isArray(data[pos]) ? [...data[pos]] : [];
            this.updateUI(pos);
        });
    }

    // Clear the squad and update UI
    clear() {
        // Clear all positions
        for (const position in this.squad) {
            this.squad[position] = [];
            // Update UI for each position
            this.updateUI(position);
        }
        return this.getSquadData();
    }

    // Show all players in a modal
    showAllPlayers() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('allPlayersModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'allPlayersModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Tüm Oyuncular</h3>
                        <div class="modal-actions">
                            <button id="downloadSquadBtn" class="download-btn">Kadroyu İndir</button>
                            <span class="close-modal">&times;</span>
                        </div>
                    </div>
                    <div class="modal-body" id="allPlayersList">
                        <!-- Players will be listed here -->
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close modal when clicking the X
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Close modal when clicking outside the modal content
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Clear and repopulate the players list
        const playersList = modal.querySelector('#allPlayersList');
        playersList.innerHTML = '';

        // Group players by position
        let hasPlayers = false;
        for (const [pos, players] of Object.entries(this.squad)) {
            if (players.length === 0) continue;
            
            hasPlayers = true;
            const positionGroup = document.createElement('div');
            positionGroup.className = 'position-group';
            
            const positionTitle = document.createElement('h4');
            positionTitle.textContent = this.positions[pos]?.name || pos;
            positionGroup.appendChild(positionTitle);
            
            const playersContainer = document.createElement('div');
            playersContainer.className = 'players-container';
            
            players.forEach(player => {
                const playerEl = document.createElement('div');
                playerEl.className = 'player-card';
                playerEl.textContent = player;
                playersContainer.appendChild(playerEl);
            });
            
            positionGroup.appendChild(playersContainer);
            playersList.appendChild(positionGroup);
        }

        // Show message if no players
        if (!hasPlayers) {
            playersList.innerHTML = '<p class="no-players">Henüz hiç oyuncu eklenmemiş.</p>';
        }

        // Show the modal
        modal.style.display = 'block';
        
        // Add event listener for download button
        const downloadBtn = modal.querySelector('#downloadSquadBtn');
        if (downloadBtn) {
            downloadBtn.onclick = () => this.downloadSquadImage();
        }
    }
    
    downloadSquadImage() {
        // Create a temporary canvas for the field image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const fieldImg = new Image();
        
        fieldImg.onload = () => {
            // Set canvas size to match the field image
            canvas.width = fieldImg.width;
            canvas.height = fieldImg.height;
            
            // Draw the field image
            ctx.drawImage(fieldImg, 0, 0);
            
            // Set text styles
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 7;  // Increased outline width for better visibility
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 50px Arial';  // Increased from 16px to 24px
            
            // Position mapping for players (x, y) as percentage of canvas dimensions
            const positionMap = {
                'KL': { x: 0.5, y: 0.87 },  // Kaleci - moved slightly forward (from 0.9 to 0.85)
                'STP': { x: 0.5, y: 0.75 },  // Stoper - center back (kept same)
                'SĞB': { x: 0.8, y: 0.7 },  // Sağ Bek - moved wider (from 0.7 to 0.8)
                'SLB': { x: 0.2, y: 0.7 },  // Sol Bek - moved wider (from 0.3 to 0.2)
                'MDO': { x: 0.5, y: 0.60 },  // Merkez Defansif - moved forward (from 0.6 to 0.65)
                'MO': { x: 0.5, y: 0.45 },   // Merkez Orta - moved forward (from 0.5 to 0.45)
                'MOO': { x: 0.5, y: 0.30 },  // Merkez Ofansif - moved forward (from 0.4 to 0.35)
                'SĞK': { x: 0.80, y: 0.25 },  // Sağ Kanat - moved forward and wider (from 0.7,0.3 to 0.85,0.25)
                'SLK': { x: 0.20, y: 0.25 },  // Sol Kanat - moved forward and wider (from 0.3,0.3 to 0.15,0.25)
                'ST': { x: 0.5, y: 0.15 }    // Santrafor - moved further forward (from 0.2 to 0.15)
            };
            
            // Draw each player on their position
            for (const [pos, players] of Object.entries(this.squad)) {
                if (players.length === 0) continue;
                
                const position = positionMap[pos];
                if (!position) continue;
                
                // Calculate position on canvas
                const x = canvas.width * position.x;
                let y = canvas.height * position.y;
                
                // Draw each player in this position
                players.forEach((player, index) => {
                    // Draw text with outline for better visibility
                    ctx.strokeText(player, x, y + (index * 40));  
                    ctx.fillText(player, x, y + (index * 40));
                });
            }
            
            // Add title
            ctx.font = 'bold 50px Arial';  
            const title = `${window.gameManager?.currentPlayer || 1}. Oyuncu Kadrosu`;
            ctx.strokeText(title, canvas.width / 2, 40);  
            ctx.fillText(title, canvas.width / 2, 40);
            
            // Convert canvas to image and trigger download
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `kadro_${window.gameManager?.currentPlayer || 1}.png`;
            link.href = dataURL;
            link.click();
        };
        
        // Start loading the field image
        fieldImg.src = 'futbolsahasi.png';
    }
}

// Kullanım:
// const squad = new Squad();
// squad.enableDragAndDrop();
// squad.addPlayer("SĞB", "Ahmet");
