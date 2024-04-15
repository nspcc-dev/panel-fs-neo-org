import React from 'react';
import {
	Container,
	Section,
	Heading,
	Button,
	Box,
	Tile,
	Notification,
} from 'react-bulma-components';

const Home = ({
		onModal,
		onConnectWallet,
		dapi,
	}) => {

	return (
		<Container
			id="login"
			style={{ minHeight: 'calc(100vh - 212px)' }}
		>
			<Section>
				<Box style={{ maxWidth: 600, margin: 'auto' }}>
					{!process.env.REACT_APP_WC_PROJECT_ID ? (
						<Tile kind="parent">
							<Tile
								kind="child"
								renderAs={Notification}
								color="danger"
							>
								Error: Global variable REACT_APP_WC_PROJECT_ID is not set. Obtain the <span style={{ fontWeight: 600 }}>WalletConnect project id</span> on the website <a href="https://cloud.walletconnect.com/app" style={{ textDecoration: 'underline' }} target="_blank" rel="noreferrer">cloud.walletconnect.com/app</a> and set in the .env file.
							</Tile>
						</Tile>
					) : (
						<>
							<Heading align="center" size={6}>Welcome to NeoFS Panel, it allows you to move funds from/to NeoFS and manage containers and objects via web UI</Heading>
							<Heading align="center" size={6} weight="normal">Connect your wallet to log&nbsp;in</Heading>
							<Button
								className="btn_connect_wallet"
								onClick={() => onConnectWallet('neoline')}
							>
								NeoLine
								<img src="/img/icons/wallets/neoline.svg" alt="neoline logo" />
							</Button>
							<Button
								className="btn_connect_wallet"
								onClick={() => onConnectWallet('o3')}
							>
								O3
								<img src="/img/icons/wallets/o3.svg" alt="o3 logo" />
							</Button>
							<Button
								className="btn_connect_wallet"
								onClick={() => onConnectWallet('neon')}
							>
								Neon
								<img src="/img/icons/wallets/neon.svg" alt="neon logo" />
							</Button>
							<Button
								className="btn_connect_wallet"
								onClick={() => onConnectWallet('onegate')}
							>
								Onegate
								{dapi ? (
									<span>Connect</span>
								) : (
									<img src="/img/icons/wallets/onegate.svg" alt="onegate logo" />
								)}
							</Button>
							<Heading align="center" size={6} weight="normal" style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => onModal('installWallet')}>I don't have a wallet</Heading>
						</>
					)}
				</Box>
			</Section>
		</Container>
	);
};

export default Home;
