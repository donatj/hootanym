VERSION = $(shell jq .version -r manifest.json)
DESCR = $(shell jq .description -r manifest.json)

.PHONY: build
build: style.css
	npx rollup --config rollup.content.config.js
	npx rollup --config rollup.options.config.js

.PHONY: sync
sync:
	jq --arg V "${VERSION}" --arg D "${DESCR}" '.version = $$V | .description = $$D' -r package.json > package.json.tmp
	mv package.json.tmp package.json

.PHONY: clean
clean:
	-rm *.zip
	-rm style.css
	-rm -rf dist

style.css: style.scss
	npx sass style.scss:style.css

.PHONY: release
release: sync release-${VERSION}.zip

release-${VERSION}.zip: clean build
	zip -r release-${VERSION}.zip manifest.json *.html *.css *.png *.md dist
