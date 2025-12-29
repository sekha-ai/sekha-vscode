#!/bin/bash
set -e

echo "💻 Running Sekha VSCode Test Suite..."

TEST_TYPE=${1:-"all"}

case $TEST_TYPE in
  "lint")
    echo "🔍 Running ESLint..."
    eslint src/ tests/
    ;;
  "unit")
    echo "Running unit tests..."
    mocha --config .mocharc.json
    ;;
  "all"|*)
    echo "Running linting and all tests..."
    eslint src/ tests/
    mocha --config .mocharc.json
    ;;
esac

echo "✅ Tests complete!"