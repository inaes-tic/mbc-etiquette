export NODE_CONFIG_DIR ?= $(PWD)/node_modules/mbc-common/config

all: update serve

mos: locale/es/LC_MESSAGES/messages.mo

locale/es/LC_MESSAGES/messages.mo:
	./bin/extract_po.sh
	./bin/update_languages.sh
	./bin/compile-json locale locale

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

sauce_connect: bin/Sauce-Connect.jar

bin/Sauce-Connect.jar:
	@echo 'Downloading Sauce Connect...'
	@curl -o bin/Sauce-Connect-latest.zip \
	      http://saucelabs.com/downloads/Sauce-Connect-latest.zip
	@echo 'Done.'
	@echo 'Unzipping Sauce Connect...'
	@cd bin/; unzip Sauce-Connect-latest.zip; rm Sauce-Connect-latest.zip; cd -
	@echo 'Done.'

functional_test:
	@echo "Running funcional tests..."
	@bin/run-func-tests

test: sauce_connect functional_test

.PHONY: npm serve serve_noweb serve_debug
