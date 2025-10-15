class Wheel {
    constructor() {
        this.canvas = document.getElementById('mainWheel');
        this.ctx = this.canvas.getContext('2d');
        this.currentWheel = 'main';
        
        // Karıştırma yardımcı fonksiyonu
        const shuffleArray = (array) => {
            const shuffled = [...array];
            // Fisher-Yates karıştırma
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            // Aynı seçeneklerin yan yana gelmemesi için kontrol
            for (let i = 0; i < shuffled.length - 1; i++) {
                if (shuffled[i] === shuffled[i + 1]) {
                    // Sonraki farklı olan seçenekle yer değiştir
                    for (let j = i + 2; j < shuffled.length; j++) {
                        if (shuffled[i] !== shuffled[j] && 
                            (j === shuffled.length - 1 || shuffled[j] !== shuffled[j + 1])) {
                            [shuffled[i + 1], shuffled[j]] = [shuffled[j], shuffled[i + 1]];
                            break;
                        }
                    }
                }
            }
            return shuffled;
        };

        // Ana çark için 4'er tekrarlı karışık dizi oluştur
        const mainOptions = ['Mevki', 'Yaş', 'Uyruk', 'Lig'];
        const repeatedMain = [];
        for (let i = 0; i < 4; i++) {
            mainOptions.forEach(option => repeatedMain.push(option));
        }
        
        // Tüm seçenek dizilerini oluştur ve karıştır
        const positions = ['KL', 'STP', 'SĞB', 'SLB', 'MDO', 'MO', 'MOO', 'SĞK/SĞO', 'SLK/SLO', 'ST'];
        const ages = Array.from({length: 18}, (_, i) => i + 18).concat(['35+']);
        const nationalities = [
            'İngiltere', 'Fransa', 'Almanya', 'İtalya', 'İspanya', 'Portekiz',
            'Hollanda', 'Belçika', 'Hırvatistan', 'Sırbistan', 'İsviçre', 'Türkiye',
            'Polonya', 'Norveç', 'Brezilya', 'Arjantin', 'Uruguay', 'Şili',
            'Kolombiya', 'Kamerun', 'Gana', 'Fas', 'Senegal', 'Fildişi Sahili',
            'Japonya', 'Güney Kore', 'Suudi Arabistan', 'Meksika', 'Kanada', 'Çekya'
        ];

        this.options = {
            main: shuffleArray(repeatedMain),
            position: shuffleArray(positions),
            age: shuffleArray(ages),
            nationality: shuffleArray(nationalities),
            league: shuffleArray([
                'Premier League', 'EFL Championship', 'La Liga', 'La Liga 2',
                'Serie A', 'Serie B', 'Bundesliga', '2. Bundesliga',
                'Ligue 1', 'Ligue 2', 'Süper Lig', 'Eredivisie',
                'Primeira Liga', 'Belgian Pro League'
            ])
        };

        this.isSpinning = false;
        this.currentRotation = 0;
        this.targetRotation = 0;
        this.spinButton = document.getElementById('spinWheel');
        this.resultDiv = document.getElementById('wheelResult');

        this.setupWheel();
        this.setupEventListeners();
    }

    setupWheel() {
        // Ensure canvas and parent are available and visible, then size and draw
        setTimeout(() => {
            try {
                if (!this.canvas || !this.canvas.parentElement) {
                    console.warn('Wheel: canvas or parent missing');
                    return;
                }

                // Make sure canvas is visible
                this.canvas.style.display = 'block';

                const containerWidth = this.canvas.parentElement.offsetWidth || this.canvas.parentElement.clientWidth || 300;
                const size = Math.min(containerWidth * 0.9, 500);
                // Set both element attributes (actual drawing buffer) and css size
                this.canvas.width = size;
                this.canvas.height = size;
                this.canvas.style.width = size + 'px';
                this.canvas.style.height = size + 'px';
                console.log('Wheel: setup size', size);
                this.drawWheel();
            } catch (err) {
                console.error('Wheel setup error', err);
            }
        }, 50);
    }

    setupEventListeners() {
        if (this.spinButton) {
            this.spinButton.addEventListener('click', () => this.spin());
        } else {
            console.warn('Wheel: spin button not found');
        }
        window.addEventListener('resize', () => this.setupWheel());
    }

    drawWheel() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        const currentOptions = this.options[this.currentWheel];
        const sliceAngle = (Math.PI * 2) / currentOptions.length;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw slices
        currentOptions.forEach((option, i) => {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius,
                i * sliceAngle + this.currentRotation,
                (i + 1) * sliceAngle + this.currentRotation);
            ctx.closePath();

            ctx.fillStyle = i % 2 === 0 ? '#6c5ce7' : '#a29bfe';
            ctx.fill();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(i * sliceAngle + sliceAngle / 2 + this.currentRotation);
            ctx.textAlign = 'right';
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Poppins';
            ctx.fillText(option, radius - 20, 5);
            ctx.restore();
        });

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a2e';
        ctx.fill();

        // Draw arrow
        ctx.beginPath();
        ctx.moveTo(centerX + radius - 30, centerY);
        ctx.lineTo(centerX + radius, centerY - 10);
        ctx.lineTo(centerX + radius, centerY + 10);
        ctx.closePath();
        ctx.fillStyle = '#ff6b6b';
        ctx.fill();
    }

    spin() {
        if (this.isSpinning) return;

        this.isSpinning = true;
        this.spinButton.disabled = true;
        
        // Başlangıç hızı ve yavaşlama parametreleri
        this.velocity = 0.6; // Daha da hızlı başlangıç hızı
        this.startTime = Date.now();
        this.phase = 'fast'; // Dönüş fazı: hızlı, orta, yavaş
        this.deceleration = 0.003; // Çok daha hızlı yavaşlama
        
        requestAnimationFrame(() => this.animate());
    }

    animate() {
        const elapsed = Date.now() - this.startTime;
        
        // Faz değişimleri
        if (this.phase === 'fast' && this.velocity < 0.3) {
            this.phase = 'medium';
            this.deceleration = 0.001; // Orta hızda yavaşlama
        } else if (this.phase === 'medium' && this.velocity < 0.15) {
            this.phase = 'slow';
            this.deceleration = 0.0003; // Son faz yavaşlaması
        }
        
        // Hızı azalt (her faza göre farklı yavaşlama)
        if (this.phase === 'fast') {
            this.velocity = Math.max(this.velocity - this.deceleration, 0.2);
        } else if (this.phase === 'medium') {
            this.velocity = Math.max(this.velocity - this.deceleration, 0.1);
        } else {
            this.velocity = Math.max(this.velocity - this.deceleration, 0.001);
        }
        
        // Rotasyonu güncelle
        this.currentRotation += this.velocity;
        this.currentRotation %= (Math.PI * 2);
        this.drawWheel();
        
        // En düşük hıza ulaştığında dur
        if (this.velocity <= 0.001) {
            this.isSpinning = false;
            this.spinButton.disabled = false;
            this.showResult();
            return;
        }
        
        requestAnimationFrame(() => this.animate());
    }

    showResult() {
        const optionsCount = this.options[this.currentWheel].length;
        const sliceAngle = (Math.PI * 2) / optionsCount;
    // Arrow is at angle 0 (pointing to +x). We draw slices from i*sliceAngle + rotation.
    // The slice under the arrow corresponds to angle = 0, so solve for i where
    // i*sliceAngle + rotation <= 0 < (i+1)*sliceAngle + rotation -> i = floor((-rotation)/sliceAngle)
    const normalizedRotation = ((-this.currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let selectedIndex = Math.floor(normalizedRotation / sliceAngle);
    selectedIndex = (selectedIndex + optionsCount) % optionsCount;
        const result = this.options[this.currentWheel][selectedIndex];

        this.resultDiv.textContent = `Sonuç: ${result}`;
        this.resultDiv.style.opacity = '0';
        
        setTimeout(() => {
            this.resultDiv.style.transition = 'opacity 0.5s ease-in-out';
            this.resultDiv.style.opacity = '1';
        }, 100);

        if (this.currentWheel === 'main') {
            setTimeout(() => {
                switch(result.toLowerCase()) {
                    case 'mevki':
                        this.currentWheel = 'position';
                        break;
                    case 'yaş':
                        this.currentWheel = 'age';
                        break;
                    case 'uyruk':
                        this.currentWheel = 'nationality';
                        break;
                    case 'lig':
                        this.currentWheel = 'league';
                        break;
                }
                this.drawWheel();
            }, 1500);
        } else {
            setTimeout(() => {
                this.currentWheel = 'main';
                this.drawWheel();
            }, 2000);
        }
    }
}

window.addEventListener('load', () => {
    window.wheelInstance = new Wheel();
});
