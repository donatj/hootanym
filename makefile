VERSION = $(shell jq .version -r manifest.json)
DESCR = $(shell jq .description -r manifest.json)

.PHONY: build
build: style.css
	npx tsc --noEmit
	npx rollup --config rollup.content.config.js
	npx rollup --config rollup.options.config.js

.PHONY: install
install:
	npm ci

.PHONY: lint
lint:
	npx oxlint --config oxlint.config.mjs src

.PHONY: lint-fix
lint-fix:
	npx oxlint --config oxlint.config.mjs --fix src

.PHONY: format
format:
	npx oxfmt --config oxfmt.config.mjs --ignore-path .oxfmtignore --write src

.PHONY: format-check
format-check:
	npx oxfmt --config oxfmt.config.mjs --ignore-path .oxfmtignore --check src

.PHONY: test
test:
	node --test tests/*.test.mjs

.PHONY: ci
ci:
	$(MAKE) install
	$(MAKE) format-check
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) release

.PHONY: sync
sync:
	jq --arg V "${VERSION}" --arg D "${DESCR}" '.version = $$V | .description = $$D' -r package.json > package.json.tmp
	mv package.json.tmp package.json

.PHONY: clean
clean:
	rm -f *.zip style.css style.css.map
	rm -rf dist

style.css: style.scss
	npx sass style.scss:style.css

.PHONY: release
release: sync release-${VERSION}.zip

release-${VERSION}.zip: clean build
	zip -r release-${VERSION}.zip manifest.json *.html *.css *.png *.md dist
