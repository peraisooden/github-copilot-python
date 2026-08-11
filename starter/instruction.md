# Copilot Instructions

## Project Overview
This project is a Flask-based Sudoku game. Keep the application modular,
readable, maintainable, and easy to understand.

## Coding Standards
- Use clear and descriptive names for variables, functions, and classes.
- Keep functions small and focused on a single responsibility.
- Follow standard Python and Flask practices.
- Avoid unnecessary changes to existing working code.
- Reuse existing functions and components whenever possible.
- Add comments when they help explain non-obvious logic.
- Handle errors gracefully and provide clear feedback to the user.

## Sudoku Logic
- Sudoku boards must follow standard Sudoku rules.
- Generated puzzles must have exactly one unique solution.
- Prefilled cells must remain locked.
- Invalid moves should provide clear visual feedback.
- Difficulty levels should be supported.

## User Interface
- Keep the interface clean, responsive, and accessible.
- Preserve the existing application structure and functionality.
- Ensure the Sudoku 3x3 sections are visually distinguishable.
- Make sure text and buttons remain visible in light and dark modes.

## Testing
- Use pytest for automated testing.
- Do not remove or weaken existing tests.
- When making changes, verify that existing tests continue to pass.
- Prefer deterministic and reliable tests.

## Copilot Behavior
- Before making changes, inspect the existing code and understand its structure.
- Make the smallest necessary change to solve the requested problem.
- Explain important changes clearly.
- Do not modify unrelated files or functionality.
- Ask for clarification when requirements are ambiguous.