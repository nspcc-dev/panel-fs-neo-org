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
		onConnectWallet,
	}) => {

	return (
		<Container
			id="login"
			style={{ minHeight: 'calc(100vh - 221px)' }}
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
							<Heading align="center">Connect your wallet to log in</Heading>
							<Button
								color="primary"
								onClick={onConnectWallet}
								style={{ display: 'flex', margin: '0 auto 20px' }}
							>
								Connect wallet
							</Button>
							<Heading align="center" size={6} weight="normal">
								We support <a href="https://melanke.github.io/aero-beta/" target="_blank" rel="noopener noreferrer">Aero web wallet</a>, <a href="https://neonwallet.com/" target="_blank" rel="noopener noreferrer">NEON wallet</a>
							</Heading>
						</>
					)}
				</Box>
			</Section>
		</Container>
	);
};

export default Home;
