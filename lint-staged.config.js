module.exports = {
  '*.{js,jsx,ts,tsx}': ['npm run lint'],
  '*.rs': ['cargo fmt --check', 'cargo clippy -- -D warnings'],
}