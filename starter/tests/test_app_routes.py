import json
from app import CURRENT


def test_new_game_endpoint_sets_current_and_returns_puzzle(client):
    resp = client.get('/new?clues=28')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'puzzle' in data
    puzzle = data['puzzle']
    assert len(puzzle) == 9
    non_empty = sum(1 for row in puzzle for cell in row if cell != 0)
    assert non_empty == 28
    # Ensure server stored a solution
    assert CURRENT.get('solution') is not None


def test_check_solution_returns_incorrect_positions(client):
    # Start a new game to populate CURRENT['solution']
    client.get('/new?clues=35')
    solution = CURRENT.get('solution')
    assert solution is not None
    # Posting the correct solution should yield no incorrect positions
    resp = client.post('/check', json={'board': solution})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('incorrect') == []


def test_check_without_game_returns_error(client):
    # Clear any existing solution
    CURRENT['solution'] = None
    resp = client.post('/check', json={'board': [[0]*9 for _ in range(9)]})
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'error' in data
