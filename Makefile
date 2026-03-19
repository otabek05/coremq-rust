SHELL := /bin/zsh
.PHONY: dev server client install setup fmt lint fix

# Run both backend and frontend concurrently
dev:
	@trap 'kill 0' EXIT; \
	$(MAKE) server & \
	$(MAKE) client & \
	wait

# Run Rust backend only
server:
	export PATH="$$HOME/.cargo/bin:$$PATH"; cargo run -p coremq-server

# Run frontend dev server only
client:
	cd client && yarn dev

# Install all dependencies
install:
	cd client && yarn install

# First-time setup: install Rust + frontend deps
setup:
	@command -v cargo >/dev/null 2>&1 || { echo "Installing Rust..."; curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y; }
	source $$HOME/.cargo/env 2>/dev/null; cargo build -p coremq-server
	cd client && yarn install
	@echo "Setup complete. Run 'make dev' to start."

# Format all frontend files with prettier
fmt:
	cd client && npx prettier --write "src/**/*.{ts,tsx}"

# Lint all frontend files
lint:
	cd client && npx eslint "src/**/*.{js,jsx,ts,tsx}"

# Format + lint fix
fix:
	cd client && npm run fix:all
