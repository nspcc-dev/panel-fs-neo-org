import React from 'react';
import {
	Button,
	Heading,
} from 'react-bulma-components';

const WalletAuthMethods = ({
		isNeoLineSupport,
		hasOneGate,
		onSelectWallet,
		onInstallWallet,
	}) => {
	return (
		<>
			<Button
				renderAs="button"
				className="btn_connect_wallet"
				onClick={() => onSelectWallet('neoline')}
				style={isNeoLineSupport ? { border: '2px solid #00e599', background: '#00dc9633' } : {}}
			>
				NeoLine
				<img src="/img/icons/wallets/neoline.svg" alt="neoline logo" />
			</Button>
			<Button
				renderAs="button"
				className="btn_connect_wallet"
				onClick={() => onSelectWallet('o3')}
			>
				O3
				<img src="/img/icons/wallets/o3.svg" alt="o3 logo" />
			</Button>
			<Button
				renderAs="button"
				className="btn_connect_wallet"
				onClick={() => onSelectWallet('neon')}
			>
				Neon
				<img src="/img/icons/wallets/neon.svg" alt="neon logo" />
			</Button>
			<Button
				renderAs="button"
				className="btn_connect_wallet"
				onClick={() => onSelectWallet('onegate')}
			>
				Onegate
				{hasOneGate ? (
					<span>Connect</span>
				) : (
					<img src="/img/icons/wallets/onegate.svg" alt="onegate logo" />
				)}
			</Button>
			{onInstallWallet && (
				<Heading
					align="center"
					size={6}
					weight="normal"
					style={{ textDecoration: 'underline', cursor: 'pointer' }}
					onClick={onInstallWallet}
				>
					I don't have a wallet
				</Heading>
			)}
		</>
	);
};

export default WalletAuthMethods;
