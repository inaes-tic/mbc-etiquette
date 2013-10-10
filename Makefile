export NODE_CONFIG_DIR ?= $(PWD)/node_modules/mbc-common/config

mos: locale/es/LC_MESSAGES/messages.mo

locale/es/LC_MESSAGES/messages.mo:
	./bin/extract_po.sh
	./bin/update_languages.sh
	./bin/compile-json locale locale

all: update serve

node_modules:
	mkdir -p $@

npm:
	npm install

update: npm mos

serve: update
	node server.js

serve_noweb:
	node server.js

serve_debug:
	node --debug-brk server.js

.PHONY: npm serve serve_noweb serve_debug
