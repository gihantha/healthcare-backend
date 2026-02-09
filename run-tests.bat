@echo off
echo =================================================
echo 🏥 HEALTHCARE BACKEND TEST RUNNER
echo =================================================
echo.

echo [1/3] Running all tests...
npx cross-env NODE_ENV=test jest tests/ --testPathPattern=\.test\.js$ --detectOpenHandles --forceExit

if %errorlevel% neq 0 (
    echo.
    echo ❌ Tests failed!
    exit /b 1
)

echo.
echo [2/3] Generating coverage report...
npx cross-env NODE_ENV=test jest --coverage --testPathPattern=tests/.*\.test\.js$

echo.
echo [3/3] Generating detailed test report...
node tests/test-report.js

echo.
echo =================================================
echo ✅ TEST EXECUTION COMPLETE
echo =================================================