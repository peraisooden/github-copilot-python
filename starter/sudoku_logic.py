import copy
import random
SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def remove_cells(board, clues):
    # Remove cells while ensuring the puzzle has a unique solution.
    # We try removing cells in random order; if removing a cell causes
    # multiple or zero solutions, we restore it.
    target_non_empty = clues
    # current non-empty count
    def count_non_empty(b):
        return sum(1 for r in range(SIZE) for c in range(SIZE) if b[r][c] != EMPTY)

    non_empty = count_non_empty(board)
    # List of cell positions to try (shuffled)
    positions = [(r, c) for r in range(SIZE) for c in range(SIZE)]
    random.shuffle(positions)

    # Helper: count solutions up to a given limit (stop early if exceeds limit)
    def count_solutions(b, limit=2):
        # Find first empty cell
        for i in range(SIZE):
            for j in range(SIZE):
                if b[i][j] == EMPTY:
                    row, col = i, j
                    break
            else:
                continue
            break
        else:
            # No empty cells => one valid complete solution found
            return 1

        count = 0

        for num in range(1, SIZE + 1):
            if is_safe(b, row, col, num):
                b[row][col] = num
                found = count_solutions(b, limit)
                count += found
                b[row][col] = EMPTY
                if count >= limit:
                    return count
        return count

    # Attempt removals in passes until we've reached target or no progress
    progress = True
    while non_empty > target_non_empty and progress:
        progress = False
        for (row, col) in positions:
            if non_empty <= target_non_empty:
                break
            if board[row][col] == EMPTY:
                continue
            backup = board[row][col]
            board[row][col] = EMPTY
            # Count solutions on a deep copy to avoid mutating working board
            sols = count_solutions(deep_copy(board), limit=2)
            if sols == 1:
                non_empty -= 1
                progress = True
            else:
                board[row][col] = backup


def generate_puzzle(clues=35):
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution
