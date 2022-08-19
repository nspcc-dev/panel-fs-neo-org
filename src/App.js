import React, { useState, useEffect } from 'react';
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
	Form,
	Tag,
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
	const [attributes, setAttributes] = useState([]);
	const [isLoadContainers, setLoadContainers] = useState(false);
	const [containerForm, setContainerForm] = useState({
		containerName: '',
		placementPolicy: '',
		basicAcl: '',
	});
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
		if (localStorage['wc@2:client//session:settled'] === '[]') {
			onDisconnectWallet();
		}
	}, [walletConnectCtx]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (walletConnectCtx.accounts.length !== 0) {
			setWalletData({
				type: walletConnectCtx.accounts[0].split(':')[0],
				net: walletConnectCtx.accounts[0].split(':')[1],
				account: walletConnectCtx.accounts[0].split(':')[2],
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
			"X-Bearer-Owner-Id": walletData.account,
		}
		api('POST', '/auth', body, headers).then((e) => {
			onSignMessage(e[0].token, type, operation);
		});
	};

	const onSignMessage = async (msg = '', type, operation) => {
		const response = await walletConnectCtx.signMessage(msg);
		if (response.result.error) {
			onPopup('failed', response.result.error.message)
		} else {
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
		}
	};

	const onCreateContainer = () => {
		if (walletData.tokens.container.PUT) {
			if (containerForm.containerName.length > 0 && containerForm.placementPolicy.length > 0 && containerForm.basicAcl.length > 0) {
				onPopup('loading');
				api('PUT', '/containers?walletConnect=true&name-scope-global=true', {
					"containerName": containerForm.containerName,
					"placementPolicy": containerForm.placementPolicy,
					"basicAcl": containerForm.basicAcl,
					"attributes": attributes,
				}, {
					"Content-Type": "application/json",
					"X-Bearer-Owner-Id": walletData.account,
					'X-Bearer-Signature': walletData.tokens.container.PUT.signature,
					'X-Bearer-Signature-Key': walletData.publicKey,
					'Authorization': `Bearer ${walletData.tokens.container.PUT.token}`
				}).then(() => {
					setLoadContainers(true);
					setContainerForm({
						containerName: '',
						placementPolicy: '',
						basicAcl: '',
					});
					setAttributes([]);
				});
			} else {
				onPopup('failed', 'Specify the name, placement policy and basic acl of the container');
			}
		} else {
			onPopup('signTokens', 'container.PUT');
		}
	};

	const onDeleteContainer = (containerName) => {
		if (walletData.tokens.container.DELETE) {
			onPopup('loading');
			api('DELETE', `/containers/${containerName}?walletConnect=true`, {}, {
				"Content-Type": "application/json",
				"X-Bearer-Owner-Id": walletData.account,
				'X-Bearer-Signature': walletData.tokens.container.DELETE.signature,
				'X-Bearer-Signature-Key': walletData.publicKey,
				'Authorization': `Bearer ${walletData.tokens.container.DELETE.token}`
			}).then(() => {
				setLoadContainers(true);
			});
		} else {
			onPopup('signTokens', 'container.DELETE');
		}
	};

	const onCreateObject = (e, containerId) => {
		if (walletData.tokens.object.PUT) {
			onPopup('loading');
			const file = e.target.files;
			const reader = new FileReader();
			reader.readAsDataURL(file[0]);
			reader.onload = () => {
				const base64file = reader.result;
				api('PUT', '/objects?walletConnect=true', {
					"containerId": containerId,
					"fileName": file[0].name,
					"payload": base64file.split('base64,')[1],
					"attributes": attributes,
				}, {
					"Content-Type": "application/json",
					"X-Bearer-Owner-Id": walletData.account,
					'X-Bearer-Signature': walletData.tokens.object.PUT.signature,
					'X-Bearer-Signature-Key': walletData.publicKey,
					'Authorization': `Bearer ${walletData.tokens.object.PUT.token}`
				}).then(() => {
					setLoadContainers(true);
					setAttributes([]);
				});
			};
			reader.onerror = (error) => {
				onPopup('failed', error);
			};
		} else {
			onPopup('signTokens', 'object.PUT');
			document.getElementById('upload').value = '';
		}
	};

	const onDeleteObject = (containerId, objectId) => {
		if (walletData.tokens.object.DELETE) {
			onPopup('loading');
			api('DELETE', `/objects/${containerId}/${objectId}?walletConnect=true`, {}, {
				"Content-Type": "application/json",
				"X-Bearer-Owner-Id": walletData.account,
				'X-Bearer-Signature': walletData.tokens.object.DELETE.signature,
				'X-Bearer-Signature-Key': walletData.publicKey,
				'Authorization': `Bearer ${walletData.tokens.object.DELETE.token}`
			}).then(() => {
				setLoadContainers(true);
			});
		} else {
			onPopup('signTokens', 'object.DELETE');
		}
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

	const onDisconnectWallet = () => {
		walletConnectCtx.disconnect();
		setWalletData(null);
		localStorage.removeItem('wc@2:client//pairing:settled');
		localStorage.removeItem('wc@2:client//session:pending');
		localStorage.removeItem('wc@2:client//pairing:history');
		localStorage.removeItem('wc@2:client//session:settled');
		localStorage.removeItem('wc@2:client//pairing:pending');
		localStorage.removeItem('wc@2:client//keychain');
	};

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
							{(popup.text === '' || popup.text === 'container.PUT' || popup.text === 'container.DELETE' || popup.text === 'container.SETEACL') && (
								<Columns.Column>
									<Heading align="center" size={6}>Containers</Heading>
									{(popup.text === '' || popup.text === 'container.PUT') && (
										<div className="token_status_panel">
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
									)}
									{(popup.text === '' || popup.text === 'container.DELETE') && (
										<div className="token_status_panel">
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
									)}
									{(popup.text === '' || popup.text === 'container.SETEACL') && (
										<div className="token_status_panel">
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
									)}
								</Columns.Column>
							)}
							{(popup.text === '' || popup.text === 'object.PUT' || popup.text === 'object.DELETE' || popup.text === 'object.GET') && (
								<Columns.Column>
									<Heading align="center" size={6}>Objects</Heading>
									{(popup.text === '' || popup.text === 'object.PUT') && (
										<div className="token_status_panel">
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
									)}
									{(popup.text === '' || popup.text === 'object.DELETE') && (
										<div className="token_status_panel">
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
									)}
									{(popup.text === '' || popup.text === 'object.GET') && (
										<div className="token_status_panel">
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
									)}
								</Columns.Column>
							)}
						</Columns>
						{walletData && walletData.tokens.container.PUT && walletData.tokens.container.DELETE && walletData.tokens.container.SETEACL
							&& walletData.tokens.object.PUT && walletData.tokens.object.DELETE && walletData.tokens.object.GET && (
							<Button
								color="primary"
								onClick={onPopup}
								style={{ margin: '20px auto 0', display: 'flex' }}
							>
								Start
							</Button>
						)}
					</div>
				</div>
			)}
			{popup.current === 'createContainer' && (
				<div className="popup">
					<div
						className="popup_close_panel"
						onClick={() => {
							onPopup();
							setAttributes([]);
						}}
					/>
					<div className="popup_content">
						<div
							className="popup_close"
							onClick={() => {
								onPopup();
								setAttributes([]);
							}}
						>
							<img
								src="./img/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5}>New container</Heading>
						{!walletData.tokens.container.PUT ? (
							<>
								<Heading align="center" size={6} weight="normal">To use creation function, you must use signed user token</Heading>
								<div className="token_status_panel">
									<div>For creation operations</div>
									<Button
										color="primary"
										size="small"
										onClick={() => onAuth('container', 'PUT')}
									>
										Sign
									</Button>
								</div>
							</>
						) : (
							<>
								<Form.Field>
									<Form.Label>Name</Form.Label>
									<Form.Control>
										<Form.Input
											type="text"
											value={containerForm.containerName}
											onChange={(e) => setContainerForm({ ...containerForm , containerName: e.target.value })}
										/>
									</Form.Control>
								</Form.Field>
								<Form.Field>
									<Form.Label>Placement policy</Form.Label>
									<Form.Control>
										<Form.Input
											type="text"
											value={containerForm.placementPolicy}
											onChange={(e) => setContainerForm({ ...containerForm , placementPolicy: e.target.value })}
										/>
										{[
											'REP 2 IN X CBF 3 SELECT 2 FROM * AS X',
											'REP 3',
										].map((placementPolicyExample) => (
											<Tag
												key={placementPolicyExample}
												onClick={() => setContainerForm({ ...containerForm , placementPolicy: placementPolicyExample })}
												style={{ margin: '5px 5px 0 0', cursor: 'pointer' }}
											>{placementPolicyExample}</Tag>
										))}
									</Form.Control>
								</Form.Field>
								<Form.Field>
									<Form.Label>Basic acl</Form.Label>
									<Form.Control>
										<Form.Input
											type="text"
											value={containerForm.basicAcl}
											onChange={(e) => setContainerForm({ ...containerForm , basicAcl: e.target.value })}
										/>
										{[
											'private',
											'eacl-private',
											'public-read',
											'eacl-public-read',
											'public-read-write',
											'eacl-public-read-write',
											'public-append',
											'eacl-public-append',
										].map((basicAclExample) => (
											<Tag
												key={basicAclExample}
												onClick={() => setContainerForm({ ...containerForm , basicAcl: basicAclExample })}
												style={{ margin: '5px 5px 0 0', cursor: 'pointer' }}
											>{basicAclExample}</Tag>
										))}
									</Form.Control>
								</Form.Field>
								<Form.Field>
									<Form.Label>Attributes</Form.Label>
									<div style={attributes.length >= 3 ? { overflow: 'scroll', maxHeight: 180 } : {}}>
										{attributes.map((attribute, index) => (
											<Form.Field kind="group" key={index}>
												<Form.Control>
													<Form.Input
														placeholder="Key"
														value={attribute.key}
														onChange={(e) => {
															const attributesTemp = [...attributes];
															attributesTemp[index].key = e.target.value;
															setAttributes(attributesTemp);
														}}
													/>
												</Form.Control>
												<Form.Control>
													<Form.Input
														placeholder="Value"
														value={attribute.value}
														onChange={(e) => {
															const attributesTemp = [...attributes];
															attributesTemp[index].value = e.target.value;
															setAttributes(attributesTemp);
														}}
													/>
												</Form.Control>
												<Form.Control>
													<img
														src="./img/trashbin.svg"
														width={30}
														height={30}
														alt="delete"
														style={{ cursor: 'pointer', margin: 4 }}
														onClick={() => {
															let attributesTemp = [...attributes];
															attributesTemp.splice(index, 1);
															setAttributes(attributesTemp);
														}}
													/>
												</Form.Control>
											</Form.Field>
										))}
									</div>
									<Button
										color="primary"
										size="small"
										onClick={() => {
											let attributesTemp = [...attributes];
											attributesTemp.push({
												key: "",
												value: "",
											});
											setAttributes(attributesTemp);
										}}
										style={{ display: 'flex', margin: '10px auto 0' }}
									>
										Add attribute
									</Button>
								</Form.Field>
								{attributes.every((attribute) => attribute.key.length > 0 && attribute.value.length > 0) ? (
									<Button
										color="primary"
										onClick={onCreateContainer}
										style={{ display: 'flex', margin: '30px auto 0' }}
									>
										Create
									</Button>
								) : (
									<>
										<Button
											color="primary"
											style={{
												display: 'flex',
												margin: '30px auto 0',
												opacity: 0.6,
												pointerEvents: 'none',
											}}
										>
											Create
										</Button>
										<div
											style={{
												textAlign: 'center',
												marginTop: 20,
												fontSize: 14,
												color: '#ff405b',
											}}
										>Attributes should not be empty</div>
									</>
								)}
							</>
						)}
					</div>
				</div>
			)}
			{popup.current === 'deleteContainer' && (
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
						<Heading align="center" size={5}>Container Deletion</Heading>
						{!walletData.tokens.container.DELETE ? (
							<>
								<Heading align="center" size={6} weight="normal">To use deletion function, you must use signed user token</Heading>
								<div className="token_status_panel">
									<div>For deletion operations</div>
									<Button
										color="primary"
										size="small"
										onClick={() => onAuth('container', 'DELETE')}
									>
										Sign
									</Button>
								</div>
							</>
						) : (
							<>
								<Heading align="center" size={6}>Are you sure you want to delete container?</Heading>
								<div style={{ margin: '30px 0 0', display: 'flex', justifyContent: 'center' }}>
									<Button
										color="gray"
										onClick={onPopup}
										style={{ marginRight: 10 }}
									>
										No
									</Button>
									<Button
										color="danger"
										onClick={() => onDeleteContainer(popup.text.containerId)}
									>
										Yes
									</Button>
								</div>
							</>
						)}
					</div>
				</div>
			)}
			{popup.current === 'createObject' && (
				<div className="popup">
					<div
						className="popup_close_panel"
						onClick={() => {
							onPopup();
							setAttributes([]);
						}}
					/>
					<div className="popup_content">
						<div
							className="popup_close"
							onClick={() => {
								onPopup();
								setAttributes([]);
							}}
						>
							<img
								src="./img/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5}>New object</Heading>
						{!walletData.tokens.object.PUT ? (
							<>
								<Heading align="center" size={6} weight="normal">To use creation function, you must use signed user token</Heading>
								<div className="token_status_panel">
									<div>For creation operations</div>
									<Button
										color="primary"
										size="small"
										onClick={() => onAuth('object', 'PUT')}
									>
										Sign
									</Button>
								</div>
							</>
						) : (
							<>
								<Form.Field>
									<Form.Label>Attributes</Form.Label>
									<div style={attributes.length >= 3 ? { overflow: 'scroll', maxHeight: 180 } : {}}>
										{attributes.map((attribute, index) => (
											<Form.Field kind="group" key={index}>
												<Form.Control>
													<Form.Input
														placeholder="Key"
														value={attribute.key}
														onChange={(e) => {
															const attributesTemp = [...attributes];
															attributesTemp[index].key = e.target.value;
															setAttributes(attributesTemp);
														}}
													/>
												</Form.Control>
												<Form.Control>
													<Form.Input
														placeholder="Value"
														value={attribute.value}
														onChange={(e) => {
															const attributesTemp = [...attributes];
															attributesTemp[index].value = e.target.value;
															setAttributes(attributesTemp);
														}}
													/>
												</Form.Control>
												<Form.Control>
													<img
														src="./img/trashbin.svg"
														width={30}
														height={30}
														alt="delete"
														style={{ cursor: 'pointer', margin: 4 }}
														onClick={() => {
															let attributesTemp = [...attributes];
															attributesTemp.splice(index, 1);
															setAttributes(attributesTemp);
														}}
													/>
												</Form.Control>
											</Form.Field>
										))}
									</div>
									<Button
										color="primary"
										size="small"
										onClick={() => {
											let attributesTemp = [...attributes];
											attributesTemp.push({
												key: "",
												value: "",
											});
											setAttributes(attributesTemp);
										}}
										style={{ display: 'flex', margin: '10px auto 0' }}
									>
										Add attribute
									</Button>
								</Form.Field>
								{attributes.every((attribute) => attribute.key.length > 0 && attribute.value.length > 0) ? (
									<div className="input_block" style={{ marginTop: 30 }}>
										<label htmlFor="upload">Upload object</label>
										<input
											id="upload"
											type="file"
											name="Upload"
											onClick={(e) => {
												if (!walletData.tokens.object.PUT) {
													onPopup('signTokens', 'object.PUT');
													document.getElementById('upload').value = '';
													e.preventDefault();
												}
											}}
											onChange={(e) => onCreateObject(e, popup.text.containerId)}
										/>
									</div>
								) : (
									<div
										style={{
											textAlign: 'center',
											marginTop: 30,
											fontSize: 14,
											color: '#ff405b',
										}}
									>Attributes should not be empty</div>
								)}
							</>
						)}
					</div>
				</div>
			)}
			{popup.current === 'deleteObject' && (
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
						<Heading align="center" size={5}>Object Deletion</Heading>
						{!walletData.tokens.object.DELETE ? (
							<>
								<Heading align="center" size={6} weight="normal">To use deletion function, you must use signed user token</Heading>
								<div className="token_status_panel">
									<div>For deletion operations</div>
									<Button
										color="primary"
										size="small"
										onClick={() => onAuth('object', 'DELETE')}
									>
										Sign
									</Button>
								</div>
							</>
						) : (
							<>
								<Heading align="center" size={6}>Are you sure you want to delete object?</Heading>
								<div style={{ margin: '30px 0 0', display: 'flex', justifyContent: 'center' }}>
									<Button
										color="gray"
										onClick={onPopup}
										style={{ marginRight: 10 }}
									>
										No
									</Button>
									<Button
										color="danger"
										onClick={() => onDeleteObject(popup.text.containerId, popup.text.objectId)}
									>
										Yes
									</Button>
								</div>
							</>
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
								width={75}
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
						onAuth={onAuth}
						walletData={walletData}
						walletConnectCtx={walletConnectCtx}
						isLoadContainers={isLoadContainers}
						setLoadContainers={setLoadContainers}
						onDisconnectWallet={onDisconnectWallet}
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
