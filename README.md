# NeoFS panel

## Overview

NeoFS panel web application using React framework under the hood

## Requirements

- make
- docker
- node.js

## Make instructions
* Compile the build using `make` (will be generated in `output` dir)
* Start app using `make start PORT=3000` (PORT=3000 by default)
* Get release dir with tar.gz using `make release`

## Getting started
1. Set Contract variables in `.env` file
```
REACT_APP_URL=http://localhost:3000
REACT_APP_SERVER=http://localhost:8083/v1
REACT_APP_NGINX=http://localhost:8082
REACT_APP_NEOFS_ACCOUNT=NadZ8YfvkddivcFFkztZgfwxZyKf1acpRF
REACT_APP_NEOFS_SCRIPT_HASH=0xb65d8243ac63983206d17e5221af0653a7266fa1
REACT_APP_NEOFS_GAS_TOKEN=0xd2a4cff31913016155e38e474a2c06d08be276cf
```

## Getting started with wallet
### [Neonwallet on Windows, Mac OS, and Linux](https://neon.coz.io/)
1. Download and run cross-platform light wallet
2. Import wallet or generate a new one
3. Type wallet password
4. Choose your network `Testnet` / `Mainnet` in the setting panel
5. Make a new connection with Panel web page using Connect wallet button
6. Approve connection in the wallet
7. Now you can use your wallet on the Panel web app

### [Aero web wallet](https://aero.coz.io/)
1. Import wallet or generate a new one
2. Type wallet password
3. Choose your network `Testnet` / `Mainnet` / `Private Network`
4. Make a new connection with Panel web page using Connect wallet button
6. Approve connection in the wallet
7. Now you can use your wallet on the Panel web app
