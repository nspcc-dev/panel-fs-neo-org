import React from 'react';
import {
	Button,
	Heading,
} from 'react-bulma-components';

const WalletAuthMethods = ({
		isNeoLineSupport,
		isNeonReady,
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
				onClick={() => onSelectWallet('neon')}
				disabled={!isNeonReady}
			>
				Neon
				<img src="/img/icons/wallets/neon.svg" alt="neon logo" />
			</Button>
			<Button
				renderAs="button"
				className="btn_connect_wallet"
				onClick={() => window.open('https://github.com/nspcc-dev/panel-fs-neo-org/issues/276', '_blank', 'noopener,noreferrer')}
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
