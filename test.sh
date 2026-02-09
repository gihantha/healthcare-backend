#!/bin/bash

echo "================================================="
echo "🏥 HEALTHCARE BACKEND TEST RUNNER"
echo "================================================="
echo

echo "[1/3] Running all tests..."
npx cross-env NODE_ENV=test jest tests/ --testPathPattern=\.test\.js$ --detectOpenHandles --forceExit

if [ $? -ne 0 ]; then
    echo
    echo "❌ Tests failed!"
    exit 1
fi

echo
echo "[2/3] Generating coverage report..."
npx cross-env NODE_ENV=test jest --coverage --testPathPattern=tests/.*\.test\.js$

echo
echo "[3/3] Generating detailed test report..."
node tests/test-report.js

echo
echo "================================================="
echo "✅ TEST EXECUTION COMPLETE"
echo "================================================="