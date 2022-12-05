#!/usr/bin/make -f

PORT = 3000
NODE_VERSION ?= 14

ifeq ($(shell uname), Linux)
	STAT:=-u $(shell stat -c "%u:%g" .)
endif

# Build and run optimized server.
.PHONY: all
all: build
	@npm install --location=local serve
	@./node_modules/.bin/serve -s output -p $(PORT)

# Run npm build.
.PHONY: build
build: clean install
	@npm run build

# Run npm install.
.PHONY: install
install:
	@npm install

# Run npm start.
.PHONY: start
start: install
	@npm start

# Run npm test.
.PHONY: test
test:
	@npm run test

# Create archive with build output.
.PHONY: release
release: build
	@rm -rf release
	@mkdir release
	@tar -czvf release/neofs-panel.tar.gz -C output .

# Remove all produced artifacts.
.PHONY: clean
clean:
	@rm -rf release
	@rm -rf output
	@rm -rf node_modules

# Run `make %` in Golang container, for more information run `make help.docker/%`
.PHONY: docker/%
docker/%:
	@echo "=> Running 'make $*' in clean Docker environment"
	@docker run --rm -it \
		--name panel_fs_neo_org \
		-v `pwd`:/usr/src/app \
		-p $(PORT):$(PORT) \
		-w /usr/src/app \
		$(STAT) \
		node:$(NODE_VERSION) sh -c 'make $*'

include help.mk
