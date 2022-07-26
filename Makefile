#!/usr/bin/make -f
PORT = 3000

all:
	@rm -rf output
	docker run \
	-v `pwd`:/usr/src/app \
	-w /usr/src/app node:12-alpine \
	sh -c 'npm install --silent && npm run build'

start:
	docker run \
	-p $(PORT):3000 \
	-v `pwd`:/usr/src/app \
	-w /usr/src/app node:12-alpine \
	sh -c 'npm install --silent && npm run build && npm install -g serve && serve -s output -p 3000'

release: all
	@rm -rf release
	@mkdir release
	@tar -czvf release/neofs-panel.tar.gz -C output .
