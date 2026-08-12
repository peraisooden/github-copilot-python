// ============================================================
// SUDOKU GAME - CLIENT SIDE JAVASCRIPT
// ============================================================

const SIZE = 9;

let puzzle = [];
let startTime = null;
let timerInterval = null;
let hintsUsed = 0;
let gameCompleted = false;
let themeMode = "light";

// Keep track of cells already filled using Hint
let hintedCells = new Set();


// ============================================================
// THEME
// ============================================================

function saveThemePreference(mode) {
    try {
        localStorage.setItem("sudoku_theme", mode);
    } catch (error) {
        console.error("Unable to save theme preference:", error);
    }
}

function loadThemePreference() {
    try {
        const stored = localStorage.getItem("sudoku_theme");
        return stored === "dark" ? "dark" : "light";
    } catch (error) {
        console.error("Unable to load theme preference:", error);
        return "light";
    }
}

function applyTheme(mode) {
    themeMode = mode === "dark" ? "dark" : "light";

    document.documentElement.classList.toggle(
        "dark-mode",
        themeMode === "dark"
    );

    const button = document.getElementById("toggle-theme");

    if (button) {
        button.textContent =
            themeMode === "dark"
                ? "Light Mode"
                : "Dark Mode";
    }

    saveThemePreference(themeMode);
}

function toggleTheme() {
    applyTheme(
        themeMode === "dark"
            ? "light"
            : "dark"
    );
}


// ============================================================
// CREATE BOARD
// ============================================================

function createBoardElement() {
    const board = document.getElementById("sudoku-board");

    if (!board) {
        console.error("Element #sudoku-board not found.");
        return;
    }

    board.innerHTML = "";

    for (let row = 0; row < SIZE; row++) {

        const rowDiv = document.createElement("div");
        rowDiv.className = "sudoku-row";

        for (let col = 0; col < SIZE; col++) {

            const input = document.createElement("input");

            input.type = "text";
            input.maxLength = 1;
            input.className = "sudoku-cell";

            input.dataset.row = row;
            input.dataset.col = col;

            // Only allow numbers 1-9
            input.addEventListener("input", function () {

                this.value = this.value.replace(
                    /[^1-9]/g,
                    ""
                );

                // Remove old incorrect marking
                this.classList.remove("incorrect");

                // If user edits the cell, remove it from hinted cells
                const key = `${row}-${col}`;
                hintedCells.delete(key);
            });

            rowDiv.appendChild(input);
        }

        board.appendChild(rowDiv);
    }
}


// ============================================================
// RENDER PUZZLE
// ============================================================

function renderPuzzle(newPuzzle) {

    puzzle = newPuzzle;

    createBoardElement();

    const board = document.getElementById("sudoku-board");

    if (!board) {
        return;
    }

    const inputs = board.getElementsByTagName("input");

    for (let row = 0; row < SIZE; row++) {

        for (let col = 0; col < SIZE; col++) {

            const index = row * SIZE + col;
            const input = inputs[index];
            const value = puzzle[row][col];

            if (value !== 0) {

                input.value = value;
                input.disabled = true;
                input.className = "sudoku-cell prefilled";

            } else {

                input.value = "";
                input.disabled = false;
                input.className = "sudoku-cell";
            }
        }
    }
}


// ============================================================
// NEW GAME
// ============================================================

async function newGame() {

    try {

        const difficulty = document.getElementById("difficulty");

        const clues = difficulty
            ? parseInt(difficulty.value, 10)
            : 35;

        const response = await fetch(
            `/new?clues=${clues}`
        );

        if (!response.ok) {
            throw new Error("Unable to create new game.");
        }

        const data = await response.json();

        if (!data.puzzle) {
            throw new Error("Puzzle was not returned.");
        }

        renderPuzzle(data.puzzle);

        // Reset game state
        hintsUsed = 0;
        hintedCells.clear();
        gameCompleted = false;

        const message = document.getElementById("message");

        if (message) {
            message.innerText = "";
            message.style.color = "#d32f2f";
        }

        startTimer();

    } catch (error) {

        console.error(error);

        const message = document.getElementById("message");

        if (message) {
            message.style.color = "#d32f2f";
            message.innerText =
                "Unable to start a new game.";
        }
    }
}


// ============================================================
// GET CURRENT BOARD
// ============================================================

function getCurrentBoard() {

    const board = document.getElementById("sudoku-board");

    if (!board) {
        return null;
    }

    const inputs = board.getElementsByTagName("input");

    const currentBoard = [];

    for (let row = 0; row < SIZE; row++) {

        currentBoard[row] = [];

        for (let col = 0; col < SIZE; col++) {

            const index = row * SIZE + col;

            const value = inputs[index].value.trim();

            currentBoard[row][col] =
                value === ""
                    ? 0
                    : parseInt(value, 10);
        }
    }

    return currentBoard;
}


// ============================================================
// CHECK SOLUTION
// ============================================================

async function checkSolution() {

    if (gameCompleted) {
        return;
    }

    const board = document.getElementById("sudoku-board");

    if (!board) {
        return;
    }

    const inputs = board.getElementsByTagName("input");

    const currentBoard = getCurrentBoard();

    if (!currentBoard) {
        return;
    }

    const message = document.getElementById("message");

    // --------------------------------------------------------
    // IMPORTANT:
    // Check for EMPTY CELLS first.
    // An incomplete board must NEVER show Congratulations.
    // --------------------------------------------------------

    let emptyCells = 0;

    for (let row = 0; row < SIZE; row++) {

        for (let col = 0; col < SIZE; col++) {

            if (currentBoard[row][col] === 0) {
                emptyCells++;
            }
        }
    }

    try {

        const response = await fetch("/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                board: currentBoard
            })
        });

        if (!response.ok) {
            throw new Error("Unable to check solution.");
        }

        const data = await response.json();

        if (data.error) {

            if (message) {
                message.style.color = "#d32f2f";
                message.innerText = data.error;
            }

            return;
        }

        // ----------------------------------------------------
        // Get incorrect cells from server
        // ----------------------------------------------------

        const incorrect = new Set();

        if (Array.isArray(data.incorrect)) {

            data.incorrect.forEach(position => {

                if (
                    Array.isArray(position) &&
                    position.length >= 2
                ) {

                    const row = Number(position[0]);
                    const col = Number(position[1]);

                    if (
                        row >= 0 &&
                        row < SIZE &&
                        col >= 0 &&
                        col < SIZE
                    ) {

                        incorrect.add(
                            row * SIZE + col
                        );
                    }
                }
            });
        }

        // ----------------------------------------------------
        // Clear previous incorrect highlighting
        // ----------------------------------------------------

        for (let index = 0; index < inputs.length; index++) {

            const input = inputs[index];

            input.classList.remove("incorrect");

            // Never highlight prefilled cells
            if (input.disabled) {
                continue;
            }

            const value = input.value.trim();

            // Highlight only cells:
            // 1. Reported incorrect by server
            // 2. Actually contain a value
            if (
                incorrect.has(index) &&
                value !== ""
            ) {

                input.classList.add("incorrect");
            }
        }

        // ----------------------------------------------------
        // INCOMPLETE BOARD
        // ----------------------------------------------------

        if (emptyCells > 0) {

            if (message) {
                message.style.color = "#d32f2f";
                message.innerText =
                    `Please fill all cells. ${emptyCells} cell(s) remaining.`;
            }

            return;
        }

        // ----------------------------------------------------
        // WRONG COMPLETED BOARD
        // ----------------------------------------------------

        if (incorrect.size > 0) {

            if (message) {
                message.style.color = "#d32f2f";
                message.innerText =
                    "Some cells are incorrect.";
            }

            return;
        }

        // ----------------------------------------------------
        // CORRECT COMPLETED BOARD
        // ----------------------------------------------------

        gameCompleted = true;

        stopTimer();

        if (message) {
            message.style.color = "#388e3c";
            message.innerText =
                "Congratulations! You solved it!";
        }

        showNameModal();

    } catch (error) {

        console.error(error);

        if (message) {
            message.style.color = "#d32f2f";
            message.innerText =
                "Unable to check the solution.";
        }
    }
}


// ============================================================
// HINT
// ============================================================

async function requestHint() {

    if (gameCompleted) {
        return;
    }

    try {

        // Send cells that already received hints.
        // app.py should use this list to choose another cell.
        const excluded = Array.from(hintedCells).join(",");

        const url =
            excluded.length > 0
                ? `/hint?exclude=${encodeURIComponent(excluded)}`
                : "/hint";

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Unable to get hint.");
        }

        const data = await response.json();

        const message = document.getElementById("message");

        if (data.error) {

            if (message) {
                message.style.color = "#d32f2f";
                message.innerText = data.error;
            }

            return;
        }

        if (
            data.row === undefined ||
            data.col === undefined ||
            data.value === undefined
        ) {

            if (message) {
                message.style.color = "#d32f2f";
                message.innerText =
                    "Invalid hint received.";
            }

            return;
        }

        const key = `${data.row}-${data.col}`;

        // Make sure we don't use the same hint twice
        if (hintedCells.has(key)) {

            if (message) {
                message.style.color = "#d32f2f";
                message.innerText =
                    "Please try the Hint button again.";
            }

            return;
        }

        fillHintCell(
            Number(data.row),
            Number(data.col),
            Number(data.value)
        );

    } catch (error) {

        console.error(error);

        const message = document.getElementById("message");

        if (message) {
            message.style.color = "#d32f2f";
            message.innerText =
                "Unable to retrieve a hint.";
        }
    }
}


// ============================================================
// FILL HINT CELL
// ============================================================

function fillHintCell(row, col, value) {

    if (
        row < 0 ||
        row >= SIZE ||
        col < 0 ||
        col >= SIZE
    ) {
        return;
    }

    const board = document.getElementById("sudoku-board");

    if (!board) {
        return;
    }

    const inputs = board.getElementsByTagName("input");

    const index = row * SIZE + col;

    const input = inputs[index];

    if (!input || input.disabled) {
        return;
    }

    input.value = value;

    // Make hinted cell behave like a prefilled cell
    input.disabled = true;
    input.className = "sudoku-cell prefilled";

    const key = `${row}-${col}`;

    hintedCells.add(key);

    hintsUsed++;

    // Update local puzzle
    if (puzzle[row]) {
        puzzle[row][col] = value;
    }

    const message = document.getElementById("message");

    if (message) {
        message.style.color = "#333";
        message.innerText =
            `Hint used: ${hintsUsed}`;
    }
}


// ============================================================
// TIMER
// ============================================================

function startTimer() {

    stopTimer();

    startTime = Date.now();

    const timer = document.getElementById("timer");

    if (timer) {
        timer.innerText = "00:00";
    }

    timerInterval = setInterval(() => {

        if (!startTime) {
            return;
        }

        const elapsedSeconds =
            Math.floor(
                (Date.now() - startTime) / 1000
            );

        if (timer) {

            const minutes =
                String(
                    Math.floor(elapsedSeconds / 60)
                ).padStart(2, "0");

            const seconds =
                String(
                    elapsedSeconds % 60
                ).padStart(2, "0");

            timer.innerText =
                `${minutes}:${seconds}`;
        }

    }, 500);
}

function stopTimer() {

    if (timerInterval !== null) {

        clearInterval(timerInterval);

        timerInterval = null;
    }
}

function getElapsedSeconds() {

    if (!startTime) {
        return 0;
    }

    return Math.floor(
        (Date.now() - startTime) / 1000
    );
}

function formatTime(seconds) {

    const minutes =
        String(
            Math.floor(seconds / 60)
        ).padStart(2, "0");

    const remainingSeconds =
        String(
            seconds % 60
        ).padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
}


// ============================================================
// NAME MODAL
// ============================================================

function showNameModal() {

    let modal =
        document.getElementById("name-modal");

    if (!modal) {

        modal = document.createElement("div");

        modal.id = "name-modal";

        modal.innerHTML = `
            <div class="name-modal-content">

                <h2>Congratulations!</h2>

                <p>
                    You solved the Sudoku!
                    Enter your name for the leaderboard.
                </p>

                <input
                    type="text"
                    id="player-name"
                    placeholder="Enter your name"
                    maxlength="30"
                    autocomplete="off"
                >

                <div class="name-modal-buttons">
                    <button id="save-score">
                        Save Score
                    </button>
                </div>

            </div>
        `;

        document.body.appendChild(modal);

        // Basic modal styling
        modal.style.position = "fixed";
        modal.style.left = "0";
        modal.style.top = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor =
            "rgba(0, 0, 0, 0.55)";
        modal.style.display = "flex";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.zIndex = "9999";

        const content =
            modal.querySelector(
                ".name-modal-content"
            );

        content.style.backgroundColor = "#ffffff";
        content.style.padding = "30px";
        content.style.borderRadius = "10px";
        content.style.width = "320px";
        content.style.textAlign = "center";

        const nameInput =
            modal.querySelector("#player-name");

        nameInput.style.width = "90%";
        nameInput.style.padding = "10px";
        nameInput.style.margin = "15px 0";

        const saveButton =
            modal.querySelector("#save-score");

        saveButton.style.padding = "10px 20px";
        saveButton.style.cursor = "pointer";

        saveButton.addEventListener(
            "click",
            savePlayerScore
        );

        nameInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {
                    savePlayerScore();
                }
            }
        );
    }

    modal.style.display = "flex";

    const input =
        document.getElementById("player-name");

    if (input) {

        input.value = "";

        setTimeout(() => {
            input.focus();
        }, 50);
    }
}

function hideNameModal() {

    const modal =
        document.getElementById("name-modal");

    if (modal) {
        modal.style.display = "none";
    }
}


// ============================================================
// LEADERBOARD
// ============================================================

function loadLeaderboard() {

    try {

        const raw =
            localStorage.getItem(
                "sudoku_leaderboard"
            );

        if (!raw) {
            return [];
        }

        const data = JSON.parse(raw);

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "Unable to load leaderboard:",
            error
        );

        return [];
    }
}

function saveLeaderboard(list) {

    try {

        localStorage.setItem(
            "sudoku_leaderboard",
            JSON.stringify(list)
        );

    } catch (error) {

        console.error(
            "Unable to save leaderboard:",
            error
        );
    }
}

function saveScore(entry) {

    const list = loadLeaderboard();

    list.push(entry);

    // Fastest time first
    list.sort((a, b) => {
        return Number(a.time) - Number(b.time);
    });

    // Keep top 10
    const topTen = list.slice(0, 10);

    saveLeaderboard(topTen);
}

function savePlayerScore() {

    const nameInput =
        document.getElementById("player-name");

    let playerName =
        nameInput
            ? nameInput.value.trim()
            : "";

    if (!playerName) {
        playerName = "Player";
    }

    playerName =
        playerName.substring(0, 30);

    const difficultyElement =
        document.getElementById("difficulty");

    let difficulty = "Unknown";

    if (
        difficultyElement &&
        difficultyElement.selectedOptions.length > 0
    ) {

        difficulty =
            difficultyElement
                .selectedOptions[0]
                .text;
    }

    const entry = {

        name: playerName,

        time: getElapsedSeconds(),

        difficulty: difficulty,

        hints: hintsUsed
    };

    saveScore(entry);

    hideNameModal();

    showLeaderboard();
}


// ============================================================
// SHOW LEADERBOARD
// ============================================================

function showLeaderboard() {

    const modal =
        document.getElementById(
            "leaderboard-modal"
        );

    const tbody =
        document.querySelector(
            "#leaderboard-table tbody"
        );

    if (!modal || !tbody) {

        console.error(
            "Leaderboard elements not found."
        );

        return;
    }

    const list = loadLeaderboard();

    tbody.innerHTML = "";

    list.forEach((item, index) => {

        const row =
            document.createElement("tr");

        const rankCell =
            document.createElement("td");

        rankCell.textContent =
            index + 1;

        const nameCell =
            document.createElement("td");

        nameCell.textContent =
            item.name || "Player";

        const timeCell =
            document.createElement("td");

        timeCell.textContent =
            formatTime(
                Number(item.time) || 0
            );

        const difficultyCell =
            document.createElement("td");

        difficultyCell.textContent =
            item.difficulty || "Unknown";

        const hintsCell =
            document.createElement("td");

        hintsCell.textContent =
            Number(item.hints) || 0;

        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(timeCell);
        row.appendChild(difficultyCell);
        row.appendChild(hintsCell);

        tbody.appendChild(row);
    });

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    modal.style.display = "flex";
}


// ============================================================
// HIDE LEADERBOARD
// ============================================================

function hideLeaderboard() {

    const modal =
        document.getElementById(
            "leaderboard-modal"
        );

    if (!modal) {
        return;
    }

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    modal.style.display = "none";
}


// ============================================================
// CLEAR LEADERBOARD
// ============================================================

function clearLeaderboard() {

    const confirmed =
        window.confirm(
            "Are you sure you want to clear the leaderboard?"
        );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(
        "sudoku_leaderboard"
    );

    showLeaderboard();
}


// ============================================================
// PAGE INITIALIZATION
// ============================================================

window.addEventListener("load", function () {

    const newGameButton =
        document.getElementById("new-game");

    const checkButton =
        document.getElementById("check-solution");

    const hintButton =
        document.getElementById("hint-button");

    const leaderboardButton =
        document.getElementById("show-leaderboard");

    const toggleThemeButton =
        document.getElementById("toggle-theme");

    const closeLeaderboardButton =
        document.getElementById("close-leaderboard");

    const clearLeaderboardButton =
        document.getElementById("clear-leaderboard");


    // --------------------------------------------------------
    // NEW GAME
    // --------------------------------------------------------

    if (newGameButton) {

        newGameButton.addEventListener(
            "click",
            newGame
        );
    }


    // --------------------------------------------------------
    // CHECK SOLUTION
    // --------------------------------------------------------

    if (checkButton) {

        checkButton.addEventListener(
            "click",
            checkSolution
        );
    }


    // --------------------------------------------------------
    // HINT
    // --------------------------------------------------------

    if (hintButton) {

        hintButton.addEventListener(
            "click",
            requestHint
        );
    }


    // --------------------------------------------------------
    // DARK MODE
    // --------------------------------------------------------

    if (toggleThemeButton) {

        toggleThemeButton.addEventListener(
            "click",
            toggleTheme
        );
    }


    // --------------------------------------------------------
    // LEADERBOARD
    // --------------------------------------------------------

    if (leaderboardButton) {

        leaderboardButton.addEventListener(
            "click",
            showLeaderboard
        );
    }


    // --------------------------------------------------------
    // CLOSE LEADERBOARD
    // --------------------------------------------------------

    if (closeLeaderboardButton) {

        closeLeaderboardButton.addEventListener(
            "click",
            hideLeaderboard
        );
    }


    // --------------------------------------------------------
    // CLEAR LEADERBOARD
    // --------------------------------------------------------

    if (clearLeaderboardButton) {

        clearLeaderboardButton.addEventListener(
            "click",
            clearLeaderboard
        );
    }


    // Apply saved theme
    applyTheme(
        loadThemePreference()
    );


    // Start first game
    newGame();
});