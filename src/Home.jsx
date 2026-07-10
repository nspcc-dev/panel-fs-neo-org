import React from 'react';
import {
	Container,
	Section,
	Heading,
	Box,
	Tile,
	Notification,
} from 'react-bulma-components';
import WalletAuthMethods from './Components/WalletAuthMethods/WalletAuthMethods';

const Home = ({
		onModal,
		onConnectWallet,
		isNeoLineSupport,
		isNeonReady,
		dapi,
	}) => {

	return (
		<Container
			id="login"
			style={{ minHeight: 'calc(100vh - 212px)' }}
		>
			<Section>
				<Box style={{ maxWidth: 600, margin: 'auto' }}>
					{!import.meta.env.VITE_WC_PROJECT_ID ? (
						<Tile kind="parent">
							<Tile
								kind="child"
								renderAs={Notification}
								color="danger"
							>
								Error: Global variable VITE_WC_PROJECT_ID is not set. Obtain the <span style={{ fontWeight: 600 }}>WalletConnect project id</span> on the website <a href="https://cloud.walletconnect.com/app" style={{ textDecoration: 'underline' }} target="_blank" rel="noreferrer">cloud.walletconnect.com/app</a> and set in the .env file.
							</Tile>
						</Tile>
					) : (
						<>
							<Heading align="center" size={6}>Welcome to NeoFS Panel, it allows you to move funds from/to NeoFS and manage containers and objects via web UI</Heading>
							<Heading align="center" size={6} weight="normal">Connect your wallet to log&nbsp;in</Heading>
							<WalletAuthMethods
								isNeoLineSupport={isNeoLineSupport}
								isNeonReady={isNeonReady}
								isOneGateSupport={Boolean(dapi)}
								onSelectWallet={onConnectWallet}
								onInstallWallet={() => onModal('installWallet')}
							/>
						</>
					)}
				</Box>
			</Section>
		</Container>
	);
};

export default Home;
