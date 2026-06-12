/* ==========================================================================
   Neon Grid - Tic-Tac-Toe Game Logic & Core Functions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X'; // X starts
    let gameActive = true;
    let gameMode = 'pvp'; // 'pvp' or 'ai'
    let scores = { x: 0, ties: 0, o: 0 };
    let aiThinking = false;

    // --- DOM Elements ---
    const boardElement = document.getElementById('board');
    const cells = document.querySelectorAll('.cell');
    const btnPvp = document.getElementById('btn-pvp');
    const btnAi = document.getElementById('btn-ai');
    const turnSlider = document.getElementById('turn-slider');
    const turnXLabel = document.getElementById('turn-x-label');
    const turnOLabel = document.getElementById('turn-o-label');
    const labelPlayerO = document.getElementById('label-player-o');
    const scoreXElement = document.getElementById('score-x');
    const scoreOElement = document.getElementById('score-o');
    const scoreTiesElement = document.getElementById('score-ties');
    const btnRestart = document.getElementById('btn-restart');
    const btnResetScores = document.getElementById('btn-reset-scores');
    const resultOverlay = document.getElementById('result-overlay');
    const resultText = document.getElementById('result-text');
    const resultSubtext = document.getElementById('result-subtext');
    const btnPlayAgain = document.getElementById('btn-play-again');
    const winnerSymbolContainer = document.getElementById('winner-symbol-container');
    const scoreCardX = document.getElementById('score-card-x');
    const scoreCardO = document.getElementById('score-card-o');

    // Winning Combinations
    const WINNING_COMBOS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    // SVG templates for X and O
    const svgTemplates = {
        X: `<svg class="marker-svg x-marker" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line class="marker-path-x" x1="18" y1="6" x2="6" y2="18" />
                <line class="marker-path-x" x1="6" y1="6" x2="18" y2="18" />
            </svg>`,
        O: `<svg class="marker-svg o-marker" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle class="marker-path-o" cx="12" cy="12" r="9" />
            </svg>`
    };

    // --- Local Storage Initialization ---
    function initLocalStorage() {
        const savedScores = localStorage.getItem('neongrid_scores');
        const savedMode = localStorage.getItem('neongrid_mode');
        
        if (savedScores) {
            scores = JSON.parse(savedScores);
            updateScoreboardUI();
        }
        if (savedMode) {
            gameMode = savedMode;
            updateModeSelectorUI();
        }
    }

    function saveScores() {
        localStorage.setItem('neongrid_scores', JSON.stringify(scores));
    }

    function saveMode() {
        localStorage.setItem('neongrid_mode', gameMode);
    }

    // --- UI Update Helpers ---
    function updateScoreboardUI() {
        scoreXElement.textContent = scores.x;
        scoreOElement.textContent = scores.o;
        scoreTiesElement.textContent = scores.ties;
    }

    function updateModeSelectorUI() {
        if (gameMode === 'pvp') {
            btnPvp.classList.add('active');
            btnAi.classList.remove('active');
            labelPlayerO.textContent = 'PLAYER O';
            scoreCardO.classList.remove('ai-card');
        } else {
            btnAi.classList.add('active');
            btnPvp.classList.remove('active');
            labelPlayerO.textContent = 'NEON AI';
            scoreCardO.classList.add('ai-card');
        }
    }

    function updateTurnIndicator() {
        if (currentPlayer === 'X') {
            turnSlider.className = 'turn-slider turn-x';
            turnXLabel.classList.add('active');
            turnOLabel.classList.remove('active');
        } else {
            turnSlider.className = 'turn-slider turn-o';
            turnOLabel.classList.add('active');
            turnXLabel.classList.remove('active');
        }
    }

    // --- Game Engine Operations ---

    function handleCellClick(e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;

        const cellIndex = parseInt(cell.getAttribute('data-index'));

        // Guard: Occupied cell, finished game, or AI thinking
        if (board[cellIndex] !== '' || !gameActive || aiThinking) {
            return;
        }

        makeMove(cellIndex, currentPlayer);
    }

    function makeMove(index, player) {
        board[index] = player;
        const cell = cells[index];
        cell.innerHTML = svgTemplates[player];
        cell.classList.add('occupied');
        
        // Remove hover preview class
        cell.classList.remove('preview-x', 'preview-o');

        // Check for state change
        const winResult = checkWin(board, player);
        if (winResult) {
            endGame(player, winResult.combo);
            return;
        }

        if (checkDraw(board)) {
            endGame('draw');
            return;
        }

        // Switch active turns
        currentPlayer = player === 'X' ? 'O' : 'X';
        updateTurnIndicator();

        // If AI mode active and it is O's turn, execute minimax move
        if (gameMode === 'ai' && currentPlayer === 'O' && gameActive) {
            triggerAIMove();
        }
    }

    // Hover Preview Event Triggers
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', () => {
            const idx = parseInt(cell.getAttribute('data-index'));
            if (board[idx] === '' && gameActive && !aiThinking) {
                cell.classList.add(currentPlayer === 'X' ? 'preview-x' : 'preview-o');
            }
        });

        cell.addEventListener('mouseleave', () => {
            cell.classList.remove('preview-x', 'preview-o');
        });
    });

    // Win Validator
    function checkWin(currentBoard, player) {
        for (let i = 0; i < WINNING_COMBOS.length; i++) {
            const combo = WINNING_COMBOS[i];
            if (combo.every(index => currentBoard[index] === player)) {
                return { winner: player, combo: combo };
            }
        }
        return null;
    }

    // Draw Validator
    function checkDraw(currentBoard) {
        return currentBoard.every(cell => cell !== '');
    }

    // End Game Logic
    function endGame(outcome, winningCombo = null) {
        gameActive = false;
        
        if (outcome === 'draw') {
            scores.ties++;
            saveScores();
            updateScoreboardUI();
            showResultModal('draw');
        } else {
            // outcome is winner ('X' or 'O')
            if (outcome === 'X') {
                scores.x++;
            } else {
                scores.o++;
            }
            saveScores();
            updateScoreboardUI();

            // Highlight cells
            if (winningCombo) {
                winningCombo.forEach(index => {
                    cells[index].classList.add('winning-cell');
                });
            }

            // Delay showing the modal briefly for dramatic effect
            setTimeout(() => {
                showResultModal(outcome);
            }, 900);
        }
    }

    // Result Modal Control
    function showResultModal(outcome) {
        resultOverlay.classList.add('active');
        
        if (outcome === 'draw') {
            winnerSymbolContainer.className = 'winner-symbol-wrapper win-tie';
            winnerSymbolContainer.innerHTML = `
                <svg class="marker-svg tie-marker" viewBox="0 0 24 24" fill="none" stroke="var(--color-tie)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <circle cx="12" cy="12" r="10"></circle>
                </svg>
            `;
            resultText.className = 'result-title win-tie';
            resultText.textContent = "GRID TIE!";
            resultSubtext.textContent = "Equally balanced grid energy. A perfect draw.";
            startConfetti(false); // No confetti for ties
        } else {
            const isX = outcome === 'X';
            winnerSymbolContainer.className = `winner-symbol-wrapper ${isX ? 'win-x' : 'win-o'}`;
            winnerSymbolContainer.innerHTML = isX ? svgTemplates.X : svgTemplates.O;
            
            resultText.className = `result-title ${isX ? 'win-x' : 'win-o'}`;
            
            if (gameMode === 'ai') {
                if (isX) {
                    resultText.textContent = "YOU DEFEATED AI!";
                    resultSubtext.textContent = "Human supremacy restored. Incredible tactical thinking!";
                } else {
                    resultText.textContent = "NEON AI WINS!";
                    resultSubtext.textContent = "The matrix wins this time. Better luck next game.";
                }
            } else {
                resultText.textContent = `PLAYER ${outcome} WINS!`;
                resultSubtext.textContent = "Absolute grid domination. Well played!";
            }

            // Start confetti on win
            startConfetti(true);
        }
    }

    function resetBoardState() {
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        aiThinking = false;
        
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.className = 'cell';
        });

        updateTurnIndicator();
        stopConfetti();
    }

    function restartMatch() {
        resetBoardState();
    }

    function resetScores() {
        scores = { x: 0, ties: 0, o: 0 };
        saveScores();
        updateScoreboardUI();
        resetBoardState();
    }

    function playAgain() {
        resultOverlay.classList.remove('active');
        resetBoardState();
    }

    // --- Mode Change Selection ---
    function setGameMode(mode) {
        if (gameMode === mode) return;
        gameMode = mode;
        saveMode();
        updateModeSelectorUI();
        resetScores();
    }

    // --- Unbeatable AI Engine (Minimax) ---
    function triggerAIMove() {
        aiThinking = true;
        // Visual indicator that O is working/thinking
        boardElement.style.pointerEvents = 'none';

        // Brief realistic thinking delay for cybernetic realism
        setTimeout(() => {
            if (!gameActive) {
                boardElement.style.pointerEvents = 'auto';
                aiThinking = false;
                return;
            }

            const bestMoveIndex = getBestMove();
            boardElement.style.pointerEvents = 'auto';
            aiThinking = false;
            makeMove(bestMoveIndex, 'O');
        }, 550);
    }

    function getBestMove() {
        // Minimax calculation starter
        let bestVal = -Infinity;
        let bestMove = -1;

        // Check if board is empty, play center as a default quick first-turn move
        const emptyCellsCount = board.filter(c => c === '').length;
        if (emptyCellsCount === 9) {
            return 4; // Center
        }
        if (emptyCellsCount === 8 && board[4] === '') {
            return 4; // Center if opponent did not take it
        }

        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O'; // Make AI move
                const moveVal = minimax(board, 0, false);
                board[i] = ''; // Revert AI move

                if (moveVal > bestVal) {
                    bestVal = moveVal;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    }

    function minimax(tempBoard, depth, isMax) {
        // Terminal state evaluation
        const winO = checkWin(tempBoard, 'O');
        if (winO) return 10 - depth;

        const winX = checkWin(tempBoard, 'X');
        if (winX) return depth - 10;

        if (checkDraw(tempBoard)) return 0;

        if (isMax) {
            let best = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (tempBoard[i] === '') {
                    tempBoard[i] = 'O';
                    best = Math.max(best, minimax(tempBoard, depth + 1, false));
                    tempBoard[i] = '';
                }
            }
            return best;
        } else {
            let best = Infinity;
            for (let i = 0; i < 9; i++) {
                if (tempBoard[i] === '') {
                    tempBoard[i] = 'X';
                    best = Math.min(best, minimax(tempBoard, depth + 1, true));
                    tempBoard[i] = '';
                }
            }
            return best;
        }
    }

    // --- Celebratory Canvas Confetti Particles System ---
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    let animationFrameId = null;
    let particles = [];
    const colors = [
        '#00f0ff', // Cyan
        '#ec4899', // Magenta
        '#f59e0b', // Gold
        '#10b981', // Success Emerald
        '#3b82f6', // Light Blue
        '#8b5cf6'  // Purple
    ];

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * -canvas.height - 20;
            this.size = Math.random() * 8 + 6;
            this.speedX = Math.random() * 4 - 2;
            this.speedY = Math.random() * 6 + 4;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.rotation = Math.random() * 360;
            this.rotationSpeed = Math.random() * 3 - 1.5;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.rotation += this.rotationSpeed;

            // Loop reset
            if (this.y > canvas.height) {
                this.y = -20;
                this.x = Math.random() * canvas.width;
                this.speedY = Math.random() * 6 + 4;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.fillStyle = this.color;
            // Draw small rectangles for confetti
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.restore();
        }
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function initParticles() {
        particles = [];
        const particleCount = Math.min(120, Math.floor(window.innerWidth / 8));
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animateConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        animationFrameId = requestAnimationFrame(animateConfetti);
    }

    function startConfetti(enable) {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        if (!enable) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        initParticles();
        animateConfetti();
    }

    function stopConfetti() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.removeEventListener('resize', resizeCanvas);
    }


    // --- Event Listeners Setup ---
    boardElement.addEventListener('click', handleCellClick);
    
    btnPvp.addEventListener('click', () => setGameMode('pvp'));
    btnAi.addEventListener('click', () => setGameMode('ai'));
    
    btnRestart.addEventListener('click', restartMatch);
    btnResetScores.addEventListener('click', resetScores);
    btnPlayAgain.addEventListener('click', playAgain);

    // Initialise Application
    initLocalStorage();
    updateTurnIndicator();
});
