import React, { useState, useEffect } from 'react';
import $ from "jquery";
import {
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import {
	Navbar,
	Heading,
	Button,
	Footer,
	Columns,
} from 'react-bulma-components';
import Home from './Home';
import Profile from './Profile';
import api from './api';
import { useWalletConnect } from "@cityofzion/wallet-connect-sdk-react";
import { CopyToClipboardBlock } from './CopyToClipboardBlock';
import 'bulma/css/bulma.min.css';
import './App.css';

export const App = () => {
	const location = useLocation();
	const walletConnectCtx = useWalletConnect();
	const [walletData, setWalletData] = useState(null);

  const [popup, setPopup] = useState({
		current: null,
		text: '',
	});

  const onPopup = (current = null, text = null) => {
    setPopup({ current, text });
	};

	useEffect(() => {
		if (walletConnectCtx.uri.length) {
			onPopup('connectWallet', walletConnectCtx.uri);
		}
	}, [walletConnectCtx.uri]);

	useEffect(() => {
		if (walletConnectCtx.accounts.length !== 0) {
			setWalletData({
				account: walletConnectCtx.accounts[0],
				data: walletConnectCtx.session.peer,
				tokens: {
					container: {},
					object: {}
				}
			});
			onPopup();
		}
	}, [walletConnectCtx.accounts]); // eslint-disable-line react-hooks/exhaustive-deps

	const onAuth = async (type, operation) => {
		let body = {};
		if (type === 'container') {
			body = [{
				"container": {
					"verb": operation,
				}
			}]
		} else if (type === 'object') {
			body = [{
				"object": [{
					"operation": operation,
					"action": "ALLOW",
					"filters": [],
					"targets": [{
						"role": "OTHERS",
						"keys": []
					}]
				}]
			}]
		}
		const headers = {
			"Content-Type": "application/json",
			"X-Bearer-Scope": type,
			"X-Bearer-Owner-Id": walletData.account.replace('neo3:testnet:', ''),
		}
		api('POST', '/auth', body, headers).then((e) => {
			onSignMessage(e[0].token, type, operation);
		});
	};

	const onSignMessage = async (msg = '', type, operation) => {
		const response = await walletConnectCtx.signMessage(msg);
		setWalletData({
			...walletData,
			publicKey: response.result.publicKey,
			tokens: {
				...walletData.tokens,
				[type]: {
					...walletData.tokens[type],
					[operation]: {
						token: msg,
						signature: response.result.data + response.result.salt,
					}
				}
			}
		});
	};

	const onConnectWallet = async () => {
		localStorage.removeItem('wc@2:client//pairing:settled');
		localStorage.removeItem('wc@2:client//session:pending');
		localStorage.removeItem('wc@2:client//pairing:history');
		localStorage.removeItem('wc@2:client//session:settled');
		localStorage.removeItem('wc@2:client//pairing:pending');
		localStorage.removeItem('wc@2:client//keychain');
		await walletConnectCtx.connect();
	}

  return (
		<>
			{(popup.current === 'success' || popup.current === 'failed') && (
				<div className="popup">
					<div
						className="popup_close_panel"
						onClick={onPopup}
					/>
					<div className="popup_content">
						<div
							className="popup_close"
							onClick={onPopup}
						>
							<img
								src="/img/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5}>{popup.current === 'success' ? 'Success' : 'Failed'}</Heading>
						<Heading align="center" size={6} weight="normal">{popup.text}</Heading>
					</div>
				</div>
			)}
			{popup.current === 'connectWallet' && (
        <div className="popup">
          <div
            className="popup_close_panel"
            onClick={onPopup}
          />
          <div className="popup_content" style={{ maxWidth: 400 }}>
						<div
							className="popup_close"
							onClick={onPopup}
						>
							<img
								src="./img/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5}>Please select an option</Heading>
						<Heading align="center" size={6}>Connection URL</Heading>
						<Heading align="center" size={6} weight="normal">Copy and paste the connection URL into the Add connection page in your wallet</Heading>
						<div>
							<CopyToClipboardBlock
								copy={popup.text}
								text={popup.text}
								className="popup_highlighted_copy"
							/>
						</div>
						<Heading align="center" size={6}>QR code connection</Heading>
						<Heading align="center" size={6} weight="normal">Please scan QR code to connect your wallet on a compatible device</Heading>
						<Button
							color="primary"
							size="small"
							onClick={() => window.open(`https://neon.coz.io/connect?uri=${popup.text}`, '_blank').focus()}
							style={{ margin: 'auto', display: 'flex' }}
						>
							Scan
						</Button>
          </div>
        </div>
      )}
			{popup.current === 'signTokens' && (
        <div className="popup">
          <div
            className="popup_close_panel"
            onClick={onPopup}
          />
          <div className="popup_content">
						<div
							className="popup_close"
							onClick={onPopup}
						>
							<img
								src="./img/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5}>Please sign your tokens</Heading>
						<Heading align="center" size={6} weight="normal">To use all functions, you must use signed user tokens</Heading>
						<Columns>
							<Columns.Column>
								<Heading align="center" size={6}>Containers</Heading>
								<div
									className="token_status_panel"
									style={popup.text === 'container.PUT' ? { background: '#f14668', color: '#fff' } : {}}
								>
									<div>For creation operations</div>
									{walletData && walletData.tokens.container.PUT ? (
										<img
											src="./img/success.svg"
											height={25}
											width={25}
											alt="success"
										/>
									) : (
										<Button
											color="primary"
											size="small"
											onClick={() => onAuth('container', 'PUT')}
										>
											Sign
										</Button>
									)}
								</div>
								<div
									className="token_status_panel"
									style={popup.text === 'container.DELETE' ? { background: '#f14668', color: '#fff' } : {}}
								>
									<div>For deletion operations</div>
									{walletData && walletData.tokens.container.DELETE ? (
										<img
											src="./img/success.svg"
											height={25}
											width={25}
											alt="success"
										/>
									) : (
										<Button
											color="primary"
											size="small"
											onClick={() => onAuth('container', 'DELETE')}
										>
											Sign
										</Button>
									)}
								</div>
								<div
									className="token_status_panel"
									style={popup.text === 'container.SETEACL' ? { background: '#f14668', color: '#fff' } : {}}
								>
									<div>For eACL management</div>
									{walletData && walletData.tokens.container.SETEACL ? (
										<img
											src="./img/success.svg"
											height={25}
											width={25}
											alt="success"
										/>
									) : (
										<Button
											color="primary"
											size="small"
											onClick={() => onAuth('container', 'SETEACL')}
										>
											Sign
										</Button>
									)}
								</div>
							</Columns.Column>
							<Columns.Column>
								<Heading align="center" size={6}>Objects</Heading>
								<div
									className="token_status_panel"
									style={popup.text === 'object.PUT' ? { background: '#f14668', color: '#fff' } : {}}
								>
									<div>For creation operations</div>
									{walletData && walletData.tokens.object.PUT ? (
										<img
											src="./img/success.svg"
											height={25}
											width={25}
											alt="success"
										/>
									) : (
										<Button
											color="primary"
											size="small"
											onClick={() => onAuth('object', 'PUT')}
										>
											Sign
										</Button>
									)}
								</div>
								<div
									className="token_status_panel"
									style={popup.text === 'object.DELETE' ? { background: '#f14668', color: '#fff' } : {}}
								>
									<div>For deletion operations</div>
									{walletData && walletData.tokens.object.DELETE ? (
										<img
											src="./img/success.svg"
											height={25}
											width={25}
											alt="success"
										/>
									) : (
										<Button
											color="primary"
											size="small"
											onClick={() => onAuth('object', 'DELETE')}
										>
											Sign
										</Button>
									)}
								</div>
								<div
									className="token_status_panel"
									style={popup.text === 'object.GET' ? { background: '#f14668', color: '#fff' } : {}}
								>
									<div>For getting operations</div>
									{walletData && walletData.tokens.object.GET ? (
										<img
											src="./img/success.svg"
											height={25}
											width={25}
											alt="success"
										/>
									) : (
										<Button
											color="primary"
											size="small"
											onClick={() => onAuth('object', 'GET')}
										>
											Sign
										</Button>
									)}
								</div>
							</Columns.Column>
						</Columns>
						{walletData && walletData.tokens.container.PUT && walletData.tokens.container.DELETE && walletData.tokens.container.SETEACL
							&& walletData.tokens.object.PUT && walletData.tokens.object.DELETE && walletData.tokens.object.GET && (
							<Button
								color="primary"
								size="small"
								onClick={onPopup}
								style={{ margin: '20px auto 0', display: 'flex' }}
							>
								Start
							</Button>
						)}
          </div>
        </div>
      )}
			{popup.current === 'loading' && (
        <div className="popup">
          <div
            className="popup_close_panel"
            onClick={onPopup}
          />
          <div className="popup_content">
						<div
							className="popup_close"
							onClick={onPopup}
						>
							<img
								src="./img/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5}>Loading</Heading>
						<img
							className="popup_loader"
							src="./img/loader.svg"
							height={30}
							width={30}
							alt="loader"
						/>
          </div>
        </div>
      )}
			{popup.current === 'approveRequest' && (
        <div className="popup">
          <div
            className="popup_close_panel"
            onClick={onPopup}
          />
          <div className="popup_content">
						<div
							className="popup_close"
							onClick={onPopup}
						>
							<img
								src="./img/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5}>Pending Call Request</Heading>
						<img
							className="popup_loader"
							src="./img/loader.svg"
							height={30}
							width={30}
							alt="loader"
						/>
						<Heading align="center" size={6} weight="normal">Approve or reject request using your wallet</Heading>
          </div>
        </div>
      )}
			<Navbar style={{ background: "#29363a" }}>
				<Navbar.Brand>
					<Navbar.Item renderAs="div">
						<Link to="/" style={{ lineHeight: 0 }}>
							<img
								src="/img/logo.svg"
								height={28}
								width={112}
								alt="logo"
							/>
						</Link>
					</Navbar.Item>
				</Navbar.Brand>
			</Navbar>
			<Routes>
				<Route
					path="/"
					element={<Home
						onConnectWallet={onConnectWallet}
						walletData={walletData}
						location={location}
					/>}
				/>
				<Route
					path="/profile"
					element={<Profile
						walletData={walletData}
						setWalletData={setWalletData}
						walletConnectCtx={walletConnectCtx}
						onPopup={onPopup}
					/>}
				/>
			</Routes>
			<Footer>
				<div className="socials">
					<a href="https://neo.org/" target="_blank" rel="noopener noreferrer">
						<img
							src="/img/socials/neo.svg"
							width={26}
							height={26}
							alt="neo logo"
						/>
					</a>
					<a className="neospcc" href="https://nspcc.ru/en" target="_blank" rel="noopener noreferrer" style={{ borderRight: '2px solid #fff', paddingRight: 20 }}>
						<img
							src="/img/socials/neo_spcc.svg"
							width={37}
							height={37}
							style={{ filter: 'invert(1)' }}
							alt="neo spcc logo"
						/>
					</a>
					<a href="https://github.com/nspcc-dev" target="_blank" rel="noopener noreferrer">
						<img
							src="/img/socials/github.svg"
							width={30}
							height={30}
							style={{ filter: 'invert(1)' }}
							alt="github logo"
						/>
					</a>
					<a href="https://twitter.com/neospcc" target="_blank" rel="noopener noreferrer">
						<img
							src="/img/socials/twitter.svg"
							width={30}
							height={30}
							style={{ filter: 'invert(1)' }}
							alt="twitter logo"
						/>
					</a>
					<a href="https://www.youtube.com/channel/UCAC6lR1bJFv0-O07Nol_p8w" target="_blank" rel="noopener noreferrer">
						<img
							src="/img/socials/youtube.svg"
							width={30}
							height={30}
							style={{ filter: 'invert(1)' }}
							alt="youtube logo"
						/>
					</a>
				</div>
				<Heading
					size={6}
					weight="light"
					subtitle
					align="center"
					style={{ color: '#fff' }}
				>
					NeoFS Panel
				</Heading>
			</Footer>
    </>
  );
}
