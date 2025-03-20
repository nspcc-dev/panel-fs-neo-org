import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { WalletConnectProvider } from "@cityofzion/wallet-connect-sdk-react";
import { BrowserRouter } from "react-router-dom";

const wcOptions = {
	projectId: import.meta.env.VITE_WC_PROJECT_ID,
	relayUrl: "wss://relay.walletconnect.com",
	metadata: {
		name: "NeoFS Panel",
		description: "NeoFS Panel",
		url: import.meta.env.VITE_URL,
		icons: [`${import.meta.env.VITE_URL}/img/favicon.ico`],
	}
};

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<WalletConnectProvider autoManageSession={true} options={wcOptions}>
			<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<App />
			</BrowserRouter>
		</WalletConnectProvider>
	</StrictMode>,
);
