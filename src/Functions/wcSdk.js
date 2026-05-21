import WcSdkCore from "@cityofzion/wallet-connect-sdk-core";

const wcOptions = {
	projectId: import.meta.env.VITE_WC_PROJECT_ID,
	relayUrl: 'wss://relay.walletconnect.com',
	metadata: {
		name: 'NeoFS Panel',
		description: 'NeoFS Panel',
		url: import.meta.env.VITE_URL,
		icons: [`${(import.meta.env.VITE_URL || '').replace(/\/$/, '')}/img/favicon.ico`],
	},
};

let sdkPromise = null;

export function getWcSdk() {
	if (!sdkPromise) {
		sdkPromise = WcSdkCore.init(wcOptions).then(async (sdk) => {
			sdk.manageDisconnect();
			await sdk.loadSession();
			return sdk;
		}).catch((err) => {
			sdkPromise = null;
			throw err;
		});
	}
	return sdkPromise;
}
