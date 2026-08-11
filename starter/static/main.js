// Client-side rendering and interaction for the Flask-backed Sudoku

const SIZE = 9;

let puzzle = [];
let startTime = null;
let timerInterval = null;
let hintsUsed = 0;
let gameCompleted = false;


// ============================================================
// CREATE SUDOKU BOARD
// ============================================================

function createBoardElement() {
    const boardDiv = document.getElementById("sudoku-board");

    if (!boardDiv) {
        console.error("Element #sudoku-board not found.");
        return;
    }

    boardDiv.innerHTML = "";

    for (let i = 0; i < SIZE; i++) {
        const rowDiv = document.createElement("div");
        rowDiv.className = "sudoku-row";

        for (let j = 0; j < SIZE; j++) {
            const input = document.createElement("input");

            input.type = "text";
            input.maxLength = 1;
            input.className = "sudoku-cell";

            input.dataset.row = i;
            input.dataset.col = j;

            // Allow only numbers 1-9
            input.addEventListener("input", function (e) {
                e.target.value = e.target.value.replace(/[^1-9]/g, "");
            });

            rowDiv.appendChild(input);
        }

        boardDiv.appendChild(rowDiv);
    }
}


// ============================================================
// RENDER PUZZLE
// ============================================================

function renderPuzzle(puz) {
    puzzle = puz;

    createBoardElement();

    const boardDiv = document.getElementById("sudoku-board");

    if (!boardDiv) {
        return;
    }

    const inputs = boardDiv.getElementsByTagName("input");

    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {

            const index = i * SIZE + j;
            const value = puzzle[i][j];
            const input = inputs[index];

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
        const difficultyElement = document.getElementById("difficulty");

        const clues = parseInt(
            difficultyElement.value,
            10
        );

        const response = await fetch(`/new?clues=${clues}`);

        if (!response.ok) {
            throw new Error("Unable to create a new game.");
        }

        const data = await response.json();

        renderPuzzle(data.puzzle);

        const message = document.getElementById("message");

        if (message) {
            message.innerText = "";
        }

        // Reset game state
        hintsUsed = 0;
        gameCompleted = false;

        // Start timer
        startTimer();

    } catch (error) {

        console.error(error);

        const message = document.getElementById("message");

        if (message) {
            message.style.color = "#d32f2f";
            message.innerText = "Unable to start a new game.";
        }
    }
}


// ============================================================
// CHECK SOLUTION
// ============================================================

async function checkSolution() {

    if (gameCompleted) {
        return;
    }

    const boardDiv = document.getElementById("sudoku-board");

    if (!boardDiv) {
        return;
    }

    const inputs = boardDiv.getElementsByTagName("input");

    const board = [];

    for (let i = 0; i < SIZE; i++) {

        board[i] = [];

        for (let j = 0; j < SIZE; j++) {

            const index = i * SIZE + j;

            const value = inputs[index].value;

            board[i][j] = value
                ? parseInt(value, 10)
                : 0;
        }
    }


    try {

        const response = await fetch("/check", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                board: board
            })
        });


        if (!response.ok) {
            throw new Error("Unable to check solution.");
        }


        const data = await response.json();

        const message = document.getElementById("message");


        // Server returned an error
        if (data.error) {

            if (message) {
                message.style.color = "#d32f2f";
                message.innerText = data.error;
            }

            return;
        }


        // Store incorrect cells
        const incorrect = new Set();

        if (Array.isArray(data.incorrect)) {

            data.incorrect.forEach(function (position) {

                const row = position[0];
                const col = position[1];

                incorrect.add(row * SIZE + col);
            });
        }


        // Highlight incorrect cells
        for (let index = 0; index < inputs.length; index++) {

            const input = inputs[index];

            if (input.disabled) {
                continue;
            }

            input.className = "sudoku-cell";

            if (incorrect.has(index)) {
                input.className = "sudoku-cell incorrect";
            }
        }


        // ====================================================
        // CORRECT SOLUTION
        // ====================================================

        if (incorrect.size === 0) {

            gameCompleted = true;

            stopTimer();

            if (message) {
                message.style.color = "#388e3c";
                message.innerText =
                    "Congratulations! You solved it!";
            }

            showNameModal();

        }

        // ====================================================
        // INCORRECT SOLUTION
        // ====================================================

        else {

            if (message) {
                message.style.color = "#d32f2f";
                message.innerText =
                    "Some cells are incorrect.";
            }
        }

    } catch (error) {

        console.error(error);

        const message = document.getElementById("message");

        if (message) {
            message.style.color = "#d32f2f";
            message.innerText =
                "Unable to check the solution.";
        }
    }
}


// ============================================================
// TIMER
// ============================================================

function startTimer() {

    stopTimer();

    startTime = Date.now();

    const timerElement =
        document.getElementById("timer");

    if (timerElement) {
        timerElement.innerText = "00:00";
    }


    timerInterval = setInterval(function () {

        if (!startTime) {
            return;
        }

        const elapsedSeconds =
            Math.floor(
                (Date.now() - startTime) / 1000
            );

        if (timerElement) {

            const minutes =
                String(
                    Math.floor(elapsedSeconds / 60)
                ).padStart(2, "0");

            const seconds =
                String(
                    elapsedSeconds % 60
                ).padStart(2, "0");

            timerElement.innerText =
                `${minutes}:${seconds}`;
        }

    }, 500);
}


// ============================================================
// STOP TIMER
// ============================================================

function stopTimer() {

    if (timerInterval !== null) {

        clearInterval(timerInterval);

        timerInterval = null;
    }
}


// ============================================================
// GET ELAPSED TIME
// ============================================================

function getElapsedSeconds() {

    if (!startTime) {
        return 0;
    }

    return Math.floor(
        (Date.now() - startTime) / 1000
    );
}


// ============================================================
// FORMAT TIME
// ============================================================

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


    // Create modal if it does not already exist
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
            modal.querySelector(".name-modal-content");

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

        setTimeout(function () {
            input.focus();
        }, 50);
    }
}


// ============================================================
// SAVE PLAYER SCORE
// ============================================================

function savePlayerScore() {

    const nameInput =
        document.getElementById("player-name");

    let playerName =
        nameInput ? nameInput.value.trim() : "";


    if (!playerName) {
        playerName = "Player";
    }


    // Limit name length
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


    const time =
        getElapsedSeconds();


    const entry = {

        name: playerName,

        time: time,

        difficulty: difficulty,

        hints: hintsUsed
    };


    saveScore(entry);


    hideNameModal();

    showLeaderboard();
}


// ============================================================
// HIDE NAME MODAL
// ============================================================

function hideNameModal() {

    const modal =
        document.getElementById("name-modal");

    if (modal) {
        modal.style.display = "none";
    }
}


// ============================================================
// LOAD LEADERBOARD
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


// ============================================================
// SAVE LEADERBOARD
// ============================================================

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


// ============================================================
// SAVE SCORE
// ============================================================

function saveScore(entry) {

    const list =
        loadLeaderboard();


    // Add new score
    list.push(entry);


    // Sort by completion time
    list.sort(function (a, b) {

        return Number(a.time) -
               Number(b.time);

    });


    // Keep only Top 10
    const topTen =
        list.slice(0, 10);


    saveLeaderboard(topTen);
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


    const list =
        loadLeaderboard();


    tbody.innerHTML = "";


    list.forEach(function (item, index) {

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
// SAFE HTML ESCAPING
// ============================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}


// ============================================================
// PAGE INITIALIZATION
// ============================================================

window.addEventListener(
    "load",
    function () {

        const newGameButton =
            document.getElementById(
                "new-game"
            );

        const checkButton =
            document.getElementById(
                "check-solution"
            );

        const leaderboardButton =
            document.getElementById(
                "show-leaderboard"
            );

        const closeLeaderboardButton =
            document.getElementById(
                "close-leaderboard"
            );

        const clearLeaderboardButton =
            document.getElementById(
                "clear-leaderboard"
            );


        // New Game
        if (newGameButton) {

            newGameButton.addEventListener(
                "click",
                newGame
            );
        }


        // Check Solution
        if (checkButton) {

            checkButton.addEventListener(
                "click",
                checkSolution
            );
        }


        // Show Leaderboard
        if (leaderboardButton) {

            leaderboardButton.addEventListener(
                "click",
                showLeaderboard
            );
        }


        // Close Leaderboard
        if (closeLeaderboardButton) {

            closeLeaderboardButton.addEventListener(
                "click",
                hideLeaderboard
            );
        }


        // Clear Leaderboard
        if (clearLeaderboardButton) {

            clearLeaderboardButton.addEventListener(
                "click",
                clearLeaderboard
            );
        }


        // Start the first game
        newGame();
    }
);