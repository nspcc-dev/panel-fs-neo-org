import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { WalletConnectProvider } from "@cityofzion/wallet-connect-sdk-react";
import { BrowserRouter } from "react-router-dom";

const wcOptions = {
	projectId: process.env.REACT_APP_WC_PROJECT_ID,
	relayServer: "wss://relay.walletconnect.com",
	appMetadata: {
		name: "NeoFS Panel",
		description: "NeoFS Panel",
		url: process.env.REACT_APP_URL,
		icons: [`${process.env.REACT_APP_URL}/img/favicon.ico`],
	}
};

ReactDOM.render(
	<React.StrictMode>
		<WalletConnectProvider autoManageSession={true} options={wcOptions}>
			<BrowserRouter>
				<App />
			</BrowserRouter>
		</WalletConnectProvider>
	</React.StrictMode>,
	document.getElementById('root')
);
