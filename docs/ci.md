# Validate the map in CI

Run the deterministic validator on every pull request:

```yaml
# .github/workflows/businesslens-validate.yml
name: Validate BusinessLens map
on:
  pull_request:
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx businesslens@latest validate
```

The phase-one public CLI does not connect to or publish to the BusinessLens
platform.
