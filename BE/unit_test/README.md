# Backend Unit Tests

The functional test matrix is documented in [functional_test_cases.md](functional_test_cases.md).

Run the executable access-control tests from the `BE/app` directory:

```powershell
\.venv\Scripts\python.exe -m unittest discover -s ..\unit_test -p "test_*.py" -v
```

These tests do not require a database connection. They cover JWT decoding and the existing `require_staff` and `require_admin` dependency functions.
