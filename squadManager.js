class SquadManager {
    constructor() {
        this.squad = new Squad();
        this.setupEventListeners();
        this.squad.enableDragAndDrop();
    }

    setupEventListeners() {
        // Use event delegation for all clicks
        document.addEventListener('click', (e) => {
            // Handle add player button
            if (e.target.classList.contains('add-player')) {
                this.handleAddPlayer(e);
            } 
            // Handle remove player button
            else if (e.target.classList.contains('remove-player')) {
                this.handleRemovePlayer(e);
            }
        });

        // Handle Enter key in input field
        document.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('player-name') && e.key === 'Enter') {
                e.preventDefault();
                const position = e.target.dataset.position;
                const button = document.querySelector(`.add-player[data-position="${position}"]`);
                if (button) button.click();
            }
        });

        // Handle Show All Players button
        const showAllPlayersBtn = document.getElementById('showAllPlayersBtn');
        if (showAllPlayersBtn) {
            showAllPlayersBtn.addEventListener('click', () => {
                this.squad.showAllPlayers();
            });
        }
    }

    handleAddPlayer(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const button = event.target.closest('.add-player');
        if (!button) return;
        
        const position = button.dataset.position;
        const input = document.querySelector(`.player-name[data-position="${position}"]`);
        if (!input) return;
        
        const playerName = input.value.trim();

        if (!playerName) {
            input.focus();
            return;
        }

        const success = this.squad.addPlayer(position, playerName);
        if (success) {
            input.value = ''; // Clear input on success
            input.focus(); // Focus back to input for next entry
            this.updateSelectedCount();
        } else {
            // Show error message near the input
            this.showErrorMessage(input, 'Bu oyuncu zaten kadroda!');
        }
    }

    handleRemovePlayer(event) {
        event.preventDefault();
        event.stopPropagation();

        const btn = event.target.closest('.remove-player');
        if (!btn) return;
        const position = btn.dataset.position;
        const player = btn.dataset.player;
        if (!position || !player) return;

        const removed = this.squad.removePlayer(position, player);
        if (removed) {
            this.updateSelectedCount();
        }
    }

    showErrorMessage(input, message) {
        // Remove any existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create and show new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = '#ff6b6b';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.marginTop = '4px';
        
        // Insert after the input
        input.parentNode.insertBefore(errorElement, input.nextSibling);
        
        // Auto-remove error after 3 seconds
        setTimeout(() => {
            errorElement.style.opacity = '0';
            errorElement.style.transition = 'opacity 0.5s';
            setTimeout(() => errorElement.remove(), 500);
        }, 3000);
    }

    updateSelectedCount() {
        let totalPlayers = 0;
        for (const position in this.squad.squad) {
            totalPlayers += this.squad.squad[position].length;
        }
        document.getElementById('selectedCount').textContent = totalPlayers;
    }

    clearSquad() {
        // Clear the squad and get the cleared data
        const clearedData = this.squad.clear();
        
        // Clear all player inputs
        document.querySelectorAll('.player-name').forEach(input => {
            input.value = '';
        });
        
        // Update the selected count
        this.updateSelectedCount();
        
        // Update the playerSquads object if gameManager exists
        if (window.gameManager) {
            window.gameManager.playerSquads[window.gameManager.currentPlayer] = clearedData;
        }
        
        // Re-enable drag and drop
        this.squad.enableDragAndDrop();
    }
    
    loadSquad(squadData) {
        // Clear current squad first
        this.clearSquad();
        
        // If no data provided, just return
        if (!squadData) return;
        
        // Add players from the squad data
        if (squadData.players && Array.isArray(squadData.players)) {
            squadData.players.forEach(player => {
                if (player.position && player.name) {
                    this.squad.addPlayer(player.position, player.name);
                }
            });
        }
        
        // Update the UI for all positions
        Object.keys(this.squad.squad).forEach(position => {
            this.squad.updateUI(position);
        });
        
        // Update the selected count
        this.updateSelectedCount();
    }
}

// Initialize squad manager when the page loads
window.addEventListener('load', () => {
    window.squadManager = new SquadManager();
});
