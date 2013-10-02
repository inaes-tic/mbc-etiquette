export NODE_CONFIG_DIR ?= $(PWD)/node_modules/mbc-common/config

all: update serve

node_modules:
	mkdir -p $@

npm:
	npm install

update: npm

serve: update
	node server.js

serve_noweb:
	node server.js

serve_debug:
	node --debug-brk server.js

.PHONY: npm serve serve_noweb serve_debug
