import React, { useEffect } from 'react';
import {
	Container,
	Section,
	Heading,
	Button,
	Box,
} from 'react-bulma-components';

const Home = ({
		onConnectWallet,
		walletData,
		location,
	}) => {

	useEffect(() => {
		if (walletData && !walletData.balance && walletData.account) {
			if (location.pathname.indexOf('/profile') === -1) {
				document.location.href = "/profile";
			}
		}
	}, [walletData]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Container
			id="login"
			style={{ minHeight: 'calc(100vh - 212px)' }}
		>
			<Section>
				<Box style={{ maxWidth: 600, margin: 'auto' }}>
					<Heading align="center">Connect your wallet to log in</Heading>
					<Button
						color="primary"
						onClick={onConnectWallet}
						style={{ display: 'flex', margin: '0 auto 20px' }}
					>
						Connect wallet
					</Button>
					<Heading align="center" size={6} weight="normal">
						We support <a href="https://aero.coz.io/" target="_blank" rel="noopener noreferrer">Aero web wallet</a>, <a href="https://neonwallet.com/" target="_blank" rel="noopener noreferrer">NEON wallet</a>
					</Heading>
				</Box>
			</Section>
		</Container>
	);
};

export default Home;
