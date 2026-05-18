.PHONY: dev build test check format push doctor prune clean help

# ── Default ──────────────────────────────────────────────────────────────────
help:
	@echo "RenderKit development commands:"
	@echo ""
	@echo "  make dev        Start dev server (Next.js + WC watch)"
	@echo "  make build      Build all packages"
	@echo "  make test       Run test suite"
	@echo "  make check      Run Biome lint + type check"
	@echo "  make format     Auto-format source files"
	@echo "  make push       Push example artifact"
	@echo "  make doctor     Check server health"
	@echo "  make prune      Delete test artifacts (rk-test-* prefix)"
	@echo "  make clean      Remove build artifacts (.next)"
	@echo ""

# ── Development ──────────────────────────────────────────────────────────────
dev:
	pnpm dev

build:
	pnpm build

# ── Quality ──────────────────────────────────────────────────────────────────
test:
	pnpm run test

check:
	pnpm biome:check
	cd apps/web && pnpm exec tsc --noEmit --pretty false

format:
	pnpm format

# ── CLI shortcuts ─────────────────────────────────────────────────────────────
push:
	node packages/cli/bin/renderkit.mjs push examples/hello.html --open

doctor:
	node packages/cli/bin/renderkit.mjs doctor

prune:
	@echo "Deleting test artifacts (title prefix: rk-test-)..."
	node packages/cli/bin/renderkit.mjs prune --pattern "rk-test-"

prune-dry:
	node packages/cli/bin/renderkit.mjs prune --pattern "rk-test-" --dry-run

# ── Cleanup ──────────────────────────────────────────────────────────────────
clean:
	rm -rf apps/web/.next
