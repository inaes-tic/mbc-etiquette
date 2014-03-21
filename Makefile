export NODE_CONFIG_DIR ?= $(PWD)/node_modules/mbc-common/config

ifeq ($(shell getconf LONG_BIT), 64)
    CHROMEDRIVER = chromedriver_linux64.zip
else
    CHROMEDRIVER = chromedriver_linux32.zip
endif

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
		  https://saucelabs.com/downloads/Sauce-Connect-3.0-r24.zip
	@echo 'Done.'
	@echo 'Unzipping Sauce Connect...'
	@cd bin/; unzip Sauce-Connect-latest.zip; rm Sauce-Connect-latest.zip; cd -
	@echo 'Done.'

bin/chromedriver:
	@echo 'Downloading Chrome Driver $(CHROMEDRIVER)...'
	@curl -o bin/$(CHROMEDRIVER) \
		  http://chromedriver.storage.googleapis.com/2.9/$(CHROMEDRIVER)
	@echo 'Done.'
	@echo 'Unzipping Chrome Driver...'
	@cd bin/; unzip $(CHROMEDRIVER); rm $(CHROMEDRIVER); cd -
	@echo 'Done.'

test_sauce:
	@echo "Running funcional tests on saucelabs..."
	@bin/run-sauce-test

test_local: bin/chromedriver
	@echo "Running local funcional tests..."
	@bin/run-local-test

test: sauce_connect test_sauce

.PHONY: npm serve serve_noweb serve_debug
