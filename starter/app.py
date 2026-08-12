from flask import Flask, render_template, jsonify, request
import sudoku_logic

app = Flask(__name__)

# Store the current puzzle and its solution
CURRENT = {
    "puzzle": None,
    "solution": None
}


@app.route("/")
def index():
    return render_template("index.html")


# ============================================================
# NEW GAME
# ============================================================

@app.route("/new", methods=["GET"])
def new_game():

    try:
        clues = int(request.args.get("clues", 35))

        puzzle, solution = sudoku_logic.generate_puzzle(clues)

        CURRENT["puzzle"] = puzzle
        CURRENT["solution"] = solution

        return jsonify({
            "puzzle": puzzle
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# CHECK SOLUTION
# ============================================================

@app.route("/check", methods=["POST"])
def check_solution():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "error": "Invalid request."
        }), 400

    board = data.get("board")
    solution = CURRENT.get("solution")

    if solution is None:
        return jsonify({
            "error": "No game in progress."
        }), 400

    if board is None:
        return jsonify({
            "error": "Board data is missing."
        }), 400

    incorrect = []

    for row in range(sudoku_logic.SIZE):

        for col in range(sudoku_logic.SIZE):

            # Empty cells are NOT considered incorrect.
            # The frontend checks whether the board is complete.
            if board[row][col] == sudoku_logic.EMPTY:
                continue

            if board[row][col] != solution[row][col]:

                incorrect.append([
                    row,
                    col
                ])

    return jsonify({
        "incorrect": incorrect
    })


# ============================================================
# HINT
# ============================================================

@app.route("/hint", methods=["GET"])
def hint():

    solution = CURRENT.get("solution")
    puzzle = CURRENT.get("puzzle")

    if solution is None or puzzle is None:

        return jsonify({
            "error": "No game in progress."
        }), 400

    # Get cells already used as hints from main.js
    exclude_string = request.args.get(
        "exclude",
        ""
    )

    excluded_cells = set()

    if exclude_string:

        for item in exclude_string.split(","):

            item = item.strip()

            if not item:
                continue

            try:

                row, col = item.split("-")

                row = int(row)
                col = int(col)

                excluded_cells.add(
                    (row, col)
                )

            except ValueError:

                continue

    # Find an empty cell that has not already
    # been given as a hint
    available_cells = []

    for row in range(sudoku_logic.SIZE):

        for col in range(sudoku_logic.SIZE):

            if puzzle[row][col] == sudoku_logic.EMPTY:

                if (row, col) not in excluded_cells:

                    available_cells.append(
                        (row, col)
                    )

    # No more hints available
    if not available_cells:

        return jsonify({
            "error": "No more hints available."
        }), 400

    # Give the first available hint
    row, col = available_cells[0]

    value = solution[row][col]

    return jsonify({
        "row": row,
        "col": col,
        "value": value
    })


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":
    app.run(debug=True)