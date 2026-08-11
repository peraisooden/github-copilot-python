import sudoku_logic


def test_create_empty_board_shape_and_empty_values():
    board = sudoku_logic.create_empty_board()
    assert len(board) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in board)
    assert all(cell == sudoku_logic.EMPTY for row in board for cell in row)


def test_generate_puzzle_returns_puzzle_and_solution_of_correct_shape_and_clues():
    clues = 30
    puzzle, solution = sudoku_logic.generate_puzzle(clues=clues)
    # shapes
    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    # solution should have no EMPTY cells
    assert all(cell != sudoku_logic.EMPTY for row in solution for cell in row)
    # puzzle should have exactly `clues` non-empty cells
    non_empty = sum(1 for row in puzzle for cell in row if cell != sudoku_logic.EMPTY)
    assert non_empty == clues


def test_is_safe_detects_conflicts():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 5
    # same row
    assert not sudoku_logic.is_safe(board, 0, 1, 5)
    # same column
    assert not sudoku_logic.is_safe(board, 1, 0, 5)
    # same box
    assert not sudoku_logic.is_safe(board, 1, 1, 5)
    # safe position
    assert sudoku_logic.is_safe(board, 0, 1, 6)
