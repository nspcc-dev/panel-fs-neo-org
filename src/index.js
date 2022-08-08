import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { WalletConnectContextProvider } from "@cityofzion/wallet-connect-sdk-react";
import { BrowserRouter } from "react-router-dom";

const wcOptions = {
  chains: ["neo3:testnet", "neo3:mainnet", "neo3:private"],
  logger: "debug",
  methods: ["invokeFunction", "testInvoke", "signMessage", "verifyMessage"],
  relayServer: "wss://relay.walletconnect.org",
  appMetadata: {
    name: "NeoFS Panel",
    description: "NeoFS Panel",
    url: process.env.REACT_APP_URL,
    icons: [`${process.env.REACT_APP_URL}/img/favicon.ico`],
  }
};

ReactDOM.render(
  <React.StrictMode>
    <WalletConnectContextProvider options={wcOptions}>
			<BrowserRouter>
        <App />
      </BrowserRouter>
    </WalletConnectContextProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
