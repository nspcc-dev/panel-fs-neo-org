#!/usr/bin/make -f
PORT = 3000

all:
	@rm -rf output
	docker run \
	-u `stat -c "%u:%g" .` \
	-v `pwd`:/usr/src/app \
	-w /usr/src/app node:14-alpine \
	sh -c 'npm install --silent && npm run build'

start:
	docker run \
	-p $(PORT):3000 \
	-v `pwd`:/usr/src/app \
	-w /usr/src/app node:14-alpine \
	sh -c 'npm install --silent && npm run build && npm install -g serve && serve -s output -p 3000'

test:
	npm run test

release: all
	@rm -rf release
	@mkdir release
	@tar -czvf release/neofs-panel.tar.gz -C output .

clean:
	@rm -rf release
	@rm -rf output
	@rm -rf node_modules
