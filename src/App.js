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
	Notification,
} from 'react-bulma-components';
import Home from './Home';
import Profile from './Profile';
import EACLPanel from './Components/EACLPanel/EACLPanel';
import api from './api';
import { useWalletConnect } from "@cityofzion/wallet-connect-sdk-react";
import { CopyToClipboardBlock } from './CopyToClipboardBlock';
import 'bulma/css/bulma.min.css';
import './App.css';

export const App = () => {
	const location = useLocation();
	const wcSdk = useWalletConnect();
	const [activeNet] = useState(process.env.REACT_APP_NETWORK ? process.env.REACT_APP_NETWORK : 'mainnet');

	const [ContentTypeHeader] = useState("Content-Type");
	const [AuthorizationHeader] = useState("Authorization");
	const [BearerOwnerIdHeader] = useState("X-Bearer-Owner-Id");
	const [BearerForAllUsers] = useState("X-Bearer-For-All-Users");
	const [BearerSignatureHeader] = useState("X-Bearer-Signature");
	const [BearerSignatureKeyHeader] = useState("X-Bearer-Signature-Key");
	const [BearerLifetime] = useState("X-Bearer-Lifetime");

	const [params] = useState({
		rest_gw: process.env.REACT_APP_RESTGW ? process.env.REACT_APP_RESTGW : 'https://rest.t5.fs.neo.org/v1',
		http_gw: process.env.REACT_APP_HTTPGW ? process.env.REACT_APP_HTTPGW : 'https://http.t5.fs.neo.org',
	});

	const [attributes, setAttributes] = useState([]);
	const [isLoadContainers, setLoadContainers] = useState(false);
	const [isLoadingForm, setLoadingForm] = useState(false);
	const [isError, setError] = useState({
		active: false,
		type: [],
		text: '',
	});
	const [objectForm, setObjectForm] = useState({
		name: '',
		file: '',
		loading: false,
	});
	const [presets] = useState({
		forbid: {
			name: 'forbid everything',
			preset: 'forbid',
			eACLParams: [{
				"operation": "GET",
				"action": "DENY",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}, {
				"operation": "HEAD",
				"action": "DENY",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}, {
				"operation": "PUT",
				"action": "DENY",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}, {
				"operation": "DELETE",
				"action": "DENY",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}, {
				"operation": "SEARCH",
				"action": "DENY",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}, {
				"operation": "RANGE",
				"action": "DENY",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}, {
				"operation": "RANGEHASH",
				"action": "DENY",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}],
		},
		shared: {
			name: 'allow reads for others',
			preset: 'shared',
			eACLParams: [{
				"operation": "GET",
				"action": "ALLOW",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}, {
				"operation": "HEAD",
				"action": "ALLOW",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}],
		}
	});
	const [containerForm, setContainerForm] = useState({
		containerName: '',
		placementPolicy: '',
		basicAcl: 'eacl-public-read-write',
		eACLParams: presets.forbid.eACLParams,
		preset: 'forbid',
	});
	const [walletData, setWalletData] = useState(null);

	const [modal, setModal] = useState({
		current: null,
		text: '',
		params: '',
	});
	const [popup, setPopup] = useState({
		current: null,
		text: '',
	});

	const onModal = (current = null, text = null, params = null) => {
		setModal({ current, text, params });
	};

	const onPopup = (current = null, text = null) => {
		setPopup({ current, text });
		setTimeout(() => {
			setPopup({ current: null, text: null });
		}, 2000);
	};

	useEffect(() => {
		if (process.env.REACT_APP_WC_PROJECT_ID && process.env.REACT_APP_WC_PROJECT_ID !== '') {
			if (wcSdk.isConnected()) {
				setWalletData({
					type: wcSdk.session.namespaces.neo3.accounts[0].split(':')[0],
					net: wcSdk.session.namespaces.neo3.accounts[0].split(':')[1],
					account: wcSdk.session.namespaces.neo3.accounts[0].split(':')[2],
					data: wcSdk.session.peer,
					tokens: {
						container: {},
						object: {}
					}
				});
				onPopup('success', 'Wallet connected');
				onModal();

				if (location.pathname.indexOf('/profile') === -1) {
					document.location.href = "/profile";
				}
			} else if (walletData) {
				onDisconnectWallet();
				if (location.pathname !== '/') {
					document.location.href = "/";
				}
			}
		} else {
			onModal('failed', 'Error: Global variable REACT_APP_WC_PROJECT_ID is not set.');
		}
	}, [wcSdk]); // eslint-disable-line react-hooks/exhaustive-deps

	const onResetContainerForm = () => {
		setContainerForm({
			containerName: '',
			placementPolicy: '',
			basicAcl: 'eacl-public-read-write',
			eACLParams: presets.forbid.eACLParams,
			preset: 'forbid',
		});
	}

	const onUpdateWalletData = (response, params, operation, type, msg, bearer) => {
		const walletDataTemp = {
			...walletData,
			publicKey: response.publicKey,
			tokens: {
				...walletData.tokens,
				[type]: {
					...walletData.tokens[type],
					[operation]: {
						...params,
						token: msg,
						signature: response.data + response.salt,
					}
				}
			}
		}
		if (bearer) {
			walletDataTemp.tokens[type][operation].bearer = bearer;
		}
		if (!walletDataTemp.expiry || walletDataTemp.expiry < new Date().getTime()) {
			walletDataTemp.expiry = new Date().getTime() + 7200000;
		}
		setWalletData(walletDataTemp);
	}

	const onAuth = async (type, operation, params = {}) => {
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

		api('POST', '/auth', body, {
			[ContentTypeHeader]: "application/json",
			[BearerOwnerIdHeader]: walletData.account,
			[BearerLifetime]: 2,
			[BearerForAllUsers]: true,
		}).then((e) => {
			onSignMessage(e[0].token, type, operation, params);
		});
	};

	const onSignMessage = async (msg = '', type, operation, params) => {
		const response = await wcSdk.signMessage({ message: msg, version: 1 }).catch((error) => {
			if (error.message) {
				onModal('failed', error.message);
			} else {
				onModal('failed', 'Something went wrong, try again');
			}
		});
		if (type === 'object') {
			api('GET', '/auth/bearer?walletConnect=true', {}, {
				[ContentTypeHeader]: "application/json",
				[AuthorizationHeader]: `Bearer ${msg}`,
				[BearerSignatureHeader]: response.data + response.salt,
				[BearerSignatureKeyHeader]: response.publicKey,
			}).then((e) => {
				onUpdateWalletData(response, params, operation, type, msg, e.token);
			});
		} else if (!response.error) {
			onUpdateWalletData(response, params, operation, type, msg);
		}
	};

	const onCreateContainer = () => {
		if (containerForm.eACLParams.every((eACLItem) => eACLItem.operation !== '' && eACLItem.action !== '' && eACLItem.targets[0].role !== '' && eACLItem.filters.every((filterItem) => filterItem.headerType !== '' && filterItem.matchType !== '' && filterItem.key !== '' && filterItem.value !== ''))) {
			if (attributes.every((attribute) => attribute.key.length > 0 && attribute.value.length > 0)) {
				if (containerForm.containerName.length > 0 && containerForm.placementPolicy.length > 0 && containerForm.basicAcl.length > 0) {
					if (containerForm.containerName.length >= 3) {
						setError({ active: false, type: [], text: '' });
						setLoadingForm(true);
						api('PUT', '/containers?walletConnect=true&name-scope-global=true', {
							"containerName": containerForm.containerName,
							"placementPolicy": containerForm.placementPolicy,
							"basicAcl": containerForm.basicAcl,
							"attributes": attributes,
						}, {
							[ContentTypeHeader]: "application/json",
							[AuthorizationHeader]: `Bearer ${walletData.tokens.container.PUT.token}`,
							[BearerOwnerIdHeader]: walletData.account,
							[BearerSignatureHeader]: walletData.tokens.container.PUT.signature,
							[BearerSignatureKeyHeader]: walletData.publicKey,
						}).then((e) => {
							if (e.message && e.message.indexOf('insufficient balance to create container') !== -1) {
								setLoadingForm(false);
								setError({ active: true, type: [], text: 'Insufficient balance to create container' });
							} else if (e.message && e.message.indexOf('name is already taken') !== -1) {
								setLoadingForm(false);
								setError({ active: true, type: ['containerName'], text: 'Name is already taken' });
							} else if (e.message && e.message.indexOf('couldn\'t parse placement policy') !== -1) {
								setLoadingForm(false);
								setError({ active: true, type: ['placementPolicy'], text: 'Incorrect placement policy' });
							} else if (e.message && e.message.indexOf('couldn\'t parse basic acl') !== -1) {
								setLoadingForm(false);
								setError({ active: true, type: ['basicAcl'], text: 'Incorrect basic acl' });
							} else if (e.message) {
								setLoadingForm(false);
								setError({ active: true, type: [], text: e.message });
							} else {
								if (containerForm.eACLParams.length > 0) {
									api('PUT', `/containers/${e.containerId}/eacl?walletConnect=true`, {
										"records": containerForm.eACLParams.filter((item) => delete item.isOpen),
									}, {
										[ContentTypeHeader]: "application/json",
										[AuthorizationHeader]: `Bearer ${walletData.tokens.container.SETEACL.token}`,
										[BearerOwnerIdHeader]: walletData.account,
										[BearerSignatureHeader]: walletData.tokens.container.SETEACL.signature,
										[BearerSignatureKeyHeader]: walletData.publicKey,
									}).then(() => {
										setLoadingForm(false);
										onPopup('success', 'New container with EACL has been created');
										setLoadContainers(true);
										onResetContainerForm();
										setAttributes([]);
										onModal();
									});
								} else {
									setLoadingForm(false);
									onPopup('success', 'New container has been created');
									setLoadContainers(true);
									onResetContainerForm();
									setAttributes([]);
									onModal();
								}
							}
						});
					} else {
						setError({ active: true, type: ['containerName'], text: 'Container name must contain at least 3 characters.' });
					}
				} else {
					let fields = [];
					if (containerForm.containerName.length === 0) {
						fields.push('containerName');
					}
					if (containerForm.placementPolicy.length === 0) {
						fields.push('placementPolicy');
					}
					if (containerForm.basicAcl.length === 0) {
						fields.push('basicAcl');
					}
					setError({ active: true, type: fields, text: 'Please fill in all required fields.' });
				}
			} else {
				setError({ active: true, type: ['attributes'], text: 'Attributes should not be empty.' });
			}
		} else {
			setError({ active: true, type: ['eacl'], text: 'Please fill in all required fields in Extended ACL section.' });
		}
	};

	const onDeleteContainer = (containerName) => {
		if (walletData.tokens.container.DELETE) {
			setLoadingForm(true);
			setError({ active: false, type: [], text: '' });
			api('DELETE', `/containers/${containerName}?walletConnect=true`, {}, {
				[ContentTypeHeader]: "application/json",
				[AuthorizationHeader]: `Bearer ${walletData.tokens.container.DELETE.token}`,
				[BearerOwnerIdHeader]: walletData.account,
				[BearerSignatureHeader]: walletData.tokens.container.DELETE.signature,
				[BearerSignatureKeyHeader]: walletData.publicKey,
			}).then((e) => {
				setLoadingForm(false);
				if (e.message) {
					setError({ active: true, type: [], text: e.message });
				} else {
					onPopup('success', 'Container was deleted successfully');
					setLoadContainers(true);
				}
			});
		} else {
			onModal('signTokens', 'container.DELETE');
		}
	};

	const onHandleObject = (e) => {
		const file = e.target.files;
		if (file.length > 0) {
			setObjectForm({
				name: file[0].name,
				file: e.target.files[0],
				loading: false,
			});
		} else {
			document.getElementById('upload').value = '';
			setObjectForm({
				name: '',
				file: '',
				loading: false,
			});
		}
	};

	const onCreateObject = (containerId) => {
		if (objectForm.name !== '') {
			if (attributes.every((attribute) => attribute.key.length > 0 && attribute.value.length > 0)) {
				setError({ active: false, type: [], text: '' });
				setLoadingForm(true);

				let formdata = new FormData();
				formdata.append('data', objectForm.file);
				formdata.append('name', objectForm.name);

				const attributesHeaders = {};
				attributes.map((attribute) => attributesHeaders[`X-Attribute-${attribute.key}`] = attribute.value);
				api('POST', `/upload/${containerId}`, formdata, {
					'Content-Type': "multipart/form-data",
					[AuthorizationHeader]: `Bearer ${walletData.tokens.object.PUT.bearer}`,
					...attributesHeaders,
				}).then((e) => {
					setLoadingForm(false);
					if (e.message && e.message.indexOf('access to object operation denied') !== -1) {
						setError({ active: true, type: [], text: 'Access to object operation denied' });
					} else if (e.message) {
						setError({ active: true, type: [], text: e.message });
					} else {
						onPopup('success', 'New object has been created');
						setLoadContainers(containerId);
						setAttributes([]);
						setObjectForm({
							name: '',
							file: '',
							loading: false,
						});
					}
				}).catch((err) => {
					onModal('failed', `Something went wrong: ${err}`);
				});
			} else {
				setError({ active: true, type: ['attributes'], text: 'Attributes should not be empty.' });
			}
		}	else {
			setError({ active: true, type: ['objectName'], text: 'Object should not be empty.' });
		}
	};

	const onDeleteObject = (containerId, objectId) => {
		if (walletData.tokens.object.DELETE) {
			setError({ active: false, type: [], text: '' });
			setLoadingForm(true);
			api('DELETE', `/objects/${containerId}/${objectId}?walletConnect=true`, {}, {
				[ContentTypeHeader]: "application/json",
				[AuthorizationHeader]: `Bearer ${walletData.tokens.object.DELETE.token}`,
				[BearerOwnerIdHeader]: walletData.account,
				[BearerSignatureHeader]: walletData.tokens.object.DELETE.signature,
				[BearerSignatureKeyHeader]: walletData.publicKey,
			}).then((e) => {
				setLoadingForm(false);
				if (e.message) {
					setError({ active: true, type: [], text: e.message });
				} else {
					onPopup('success', 'Object was deleted successfully');
					setLoadContainers(containerId);
				}
			});
		} else {
			onModal('signTokens', 'object.DELETE');
		}
	};

	const onConnectWallet = async () => {
		try {
			const { uri, approval } = await wcSdk.createConnection(`neo3:${activeNet}`, ['invokeFunction', 'testInvoke', 'signMessage', 'verifyMessage']);
			onModal('connectWallet', uri);
			const session = await approval();
			wcSdk.setSession(session);
		} catch (error) {
			onModal('failed', 'Something went wrong, contact the application administrator');
		}
	}

	const onDisconnectWallet = async () => {
		await wcSdk.disconnect();
		onPopup('success', 'Wallet disconnected');
		setWalletData(null);
	};

	return (
		<>
			{(popup.current === 'success' || popup.current === 'failed') && (
				<div className="popup">
					<div
						className={popup.current === 'success' ? "popup_content popup_content_success" : "popup_content popup_content_failed"}
					>
						<Heading align="center" size={7}>{popup.text}</Heading>
					</div>
				</div>
			)}
			{(modal.current === 'success' || modal.current === 'failed') && (
				<div className="modal">
					<div
						className="modal_close_panel"
						onClick={onModal}
					/>
					<div className="modal_content">
						<div
							className="modal_close"
							onClick={onModal}
						>
							<img
								src="/img/icons/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5} weight="bold">{modal.current === 'success' ? 'Success' : 'Failed'}</Heading>
						<Heading align="center" size={6} weight="normal">{modal.text}</Heading>
					</div>
				</div>
			)}
			{modal.current === 'connectWallet' && (
				<div className="modal">
					<div
						className="modal_close_panel"
						onClick={onModal}
					/>
					<div className="modal_content" style={{ maxWidth: 400 }}>
						<div
							className="modal_close"
							onClick={onModal}
						>
							<img
								src="/img/icons/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5} weight="bold">Please select an option</Heading>
						<Heading align="center" size={6}>Connection URL</Heading>
						<Heading align="center" size={6} weight="normal">Copy and paste the connection URL into the Add connection page in your wallet</Heading>
						<div>
							<CopyToClipboardBlock
								copy={modal.text}
								text={modal.text}
								onPopup={onPopup}
								className="modal_highlighted_copy"
							/>
						</div>
						<Heading align="center" size={6}>QR code connection</Heading>
						<Heading align="center" size={6} weight="normal">Please scan QR code to connect your wallet on a compatible device</Heading>
						<Button
							color="primary"
							onClick={() => window.open(`https://neon.coz.io/connect?uri=${modal.text}`, '_blank').focus()}
							style={{ margin: 'auto', display: 'flex' }}
						>
							Scan
						</Button>
					</div>
				</div>
			)}
			{modal.current === 'signTokens' && (
				<div className="modal">
					<div
						className="modal_close_panel"
						onClick={onModal}
					/>
					<div className="modal_content" style={{ maxWidth: 650 }}>
						<div
							className="modal_close"
							onClick={onModal}
						>
							<img
								src="/img/icons/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5} weight="bold">Token signing</Heading>
						<Columns>
							{(modal.text === '' || modal.text === 'container.PUT' || modal.text === 'container.DELETE' || modal.text === 'container.SETEACL') && (
								<Columns.Column>
									{(modal.text === '' || modal.text === 'container.PUT') && (
										<div className="token_status_panel">
											<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock create&nbsp;operation</Heading>
											{walletData && walletData.tokens.container.PUT ? (
												<img
													src="/img/icons/success.svg"
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
									{(modal.text === '' || modal.text === 'container.DELETE') && (
										<div className="token_status_panel">
											<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock delete&nbsp;operation</Heading>
											{walletData && walletData.tokens.container.DELETE ? (
												<img
													src="/img/icons/success.svg"
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
									{(modal.text === '' || modal.text === 'container.SETEACL') && (
										<div className="token_status_panel">
											<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock eACL&nbsp;management</Heading>
											{walletData && walletData.tokens.container.SETEACL ? (
												<img
													src="/img/icons/success.svg"
													height={25}
													width={25}
													alt="success"
												/>
											) : (
												<Button
													color="primary"
													size="small"
													onClick={() => onAuth('container', 'SETEACL', modal.params)}
												>
													Sign
												</Button>
											)}
										</div>
									)}
								</Columns.Column>
							)}
							{(modal.text === '' || modal.text === 'object.PUT' || modal.text === 'object.DELETE' || modal.text === 'object.GET') && (
								<Columns.Column>
									{(modal.text === '' || modal.text === 'object.PUT') && (
										<div className="token_status_panel">
											<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock create&nbsp;operation</Heading>
											{walletData && walletData.tokens.object.PUT ? (
												<img
													src="/img/icons/success.svg"
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
									{(modal.text === '' || modal.text === 'object.DELETE') && (
										<div className="token_status_panel">
											<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock delete&nbsp;operation</Heading>
											{walletData && walletData.tokens.object.DELETE ? (
												<img
													src="/img/icons/success.svg"
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
									{(modal.text === '' || modal.text === 'object.GET') && (
										<div className="token_status_panel">
											<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock get&nbsp;operation</Heading>
											{walletData && walletData.tokens.object.GET ? (
												<img
													src="/img/icons/success.svg"
													height={25}
													width={25}
													alt="success"
												/>
											) : (
												<Button
													color="primary"
													size="small"
													onClick={() => onAuth('object', 'GET', modal.params)}
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
								onClick={onModal}
								style={{ margin: '20px auto 0', display: 'flex' }}
							>
								Start
							</Button>
						)}
					</div>
				</div>
			)}
			{modal.current === 'createContainer' && (
				<div className="modal">
					<div
						className="modal_close_panel"
						onClick={() => {
							onModal();
							setLoadingForm(false);
							setAttributes([]);
							setError({ active: false, type: [], text: '' });
							onResetContainerForm();
						}}
					/>
					<div className="modal_scroll">
						<div className="modal_content">
							<div
								className="modal_close"
								onClick={() => {
									onModal();
									setLoadingForm(false);
									setAttributes([]);
									setError({ active: false, type: [], text: '' });
									onResetContainerForm();
								}}
							>
								<img
									src="/img/icons/close.svg"
									height={30}
									width={30}
									alt="loader"
								/>
							</div>
							<Heading align="center" size={5} weight="bold">New container</Heading>
							{modal.text.neoFSBalance === 0 && (
								<Notification className="error_message" style={{ margin: '20px 0' }}>
									Container creation is a paid operation, make sure you have sufficient NeoFS chain balance
								</Notification>
							)}
							<Form.Field>
								<Form.Label>Name</Form.Label>
								<Form.Control>
									<Form.Input
										type="text"
										value={containerForm.containerName}
										className={isError.active && isError.type.indexOf('containerName') !== -1 ? 'is-error' : ""}
										onChange={(e) => setContainerForm({ ...containerForm , containerName: e.target.value })}
										disabled={isLoadingForm}
									/>
								</Form.Control>
							</Form.Field>
							<Form.Field>
								<Form.Label>Placement policy</Form.Label>
								<Form.Control>
									<Form.Input
										type="text"
										value={containerForm.placementPolicy}
										className={isError.active && isError.type.indexOf('placementPolicy') !== -1 ? 'is-error' : ""}
										onChange={(e) => setContainerForm({ ...containerForm , placementPolicy: e.target.value })}
										disabled={isLoadingForm}
									/>
									{[
										'REP 2 IN X CBF 3 SELECT 2 FROM * AS X',
										'REP 3',
									].map((placementPolicyExample) => (
										<Tag
											key={placementPolicyExample}
											className={isLoadingForm ? "tag_disabled" : ""}
											onClick={() => setContainerForm({ ...containerForm , placementPolicy: placementPolicyExample })}
											style={{ margin: '5px 5px 0 0', cursor: 'pointer' }}
										>{placementPolicyExample}</Tag>
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
													className={isError.active && isError.type.indexOf('attributes') !== -1 && attribute.key.length === 0 ? 'is-error' : ""}
													onChange={(e) => {
														const attributesTemp = [...attributes];
														attributesTemp[index].key = e.target.value;
														setAttributes(attributesTemp);
													}}
													disabled={isLoadingForm}
												/>
											</Form.Control>
											<Form.Control>
												<Form.Input
													placeholder="Value"
													value={attribute.value}
													className={isError.active && isError.type.indexOf('attributes') !== -1 && attribute.value.length === 0 ? 'is-error' : ""}
													onChange={(e) => {
														const attributesTemp = [...attributes];
														attributesTemp[index].value = e.target.value;
														setAttributes(attributesTemp);
													}}
													disabled={isLoadingForm}
												/>
											</Form.Control>
											<Form.Control>
												<img
													src="/img/icons/trashbin.svg"
													width={18}
													height={18}
													alt="delete"
													style={{ cursor: 'pointer', margin: '9px 4px 4px' }}
													onClick={() => {
														if (!isLoadingForm) {
															let attributesTemp = [...attributes];
															attributesTemp.splice(index, 1);
															setAttributes(attributesTemp);
														}
													}}
												/>
											</Form.Control>
										</Form.Field>
									))}
								</div>
								<Button
									color="primary"
									size="small"
									className={isLoadingForm ? "button_disabled" : ""}
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
							<Form.Field>
								<Form.Label>Access Control</Form.Label>
							</Form.Field>
							<Form.Field>
								<Form.Label size="small">Basic ACL</Form.Label>
								<Form.Control>
									<Form.Input
										type="text"
										value={containerForm.basicAcl}
										className={isError.active && isError.type.indexOf('basicAcl') !== -1 ? 'is-error' : ""}
										onChange={(e) => setContainerForm({ ...containerForm , basicAcl: e.target.value })}
										disabled={true}
									/>
									<Heading className="input_caption">NeoFS Panel is incompatible with basic ACLs that disable Bearer tokens or use Final bit. Therefore, basic ACL can't be changed here, but you can set any EACL rules you need. If you need a container with some different basic ACL, please use the <a href="https://github.com/nspcc-dev/neofs-node" target="_blank" rel="noopener noreferrer" alt="neofs-node">CLI</a>.</Heading>
								</Form.Control>
								<Form.Label size="small" style={{ marginTop: 10 }}>Extended ACL</Form.Label>
								{Object.keys(presets).map((basicPresetExample) => (
									<Tag
										key={basicPresetExample}
										className={isLoadingForm ? "tag_disabled" : ""}
										onClick={() => {
											if (containerForm.preset !== basicPresetExample) {
												setContainerForm({
													...containerForm,
													eACLParams: presets[basicPresetExample].eACLParams,
													preset: basicPresetExample,
												})}
											}
										}
										style={basicPresetExample === containerForm.preset ? {
											margin: '5px 5px 0 0',
											cursor: 'pointer',
											background: '#00e599',
											color: '#fff',
										} : {
											margin: '5px 5px 0 0',
											cursor: 'pointer',
										}}
									>{presets[basicPresetExample].name}</Tag>
								))}
								<EACLPanel
									onAuth={onAuth}
									isErrorParent={isError}
									isEdit={!(containerForm.preset === 'forbid' || containerForm.preset === 'shared' || isLoadingForm)}
									eACLParams={containerForm.eACLParams}
									setEACLParams={(e) => setContainerForm({ ...containerForm, eACLParams: e })}
								/>
							</Form.Field>
							{isError.active && (
								<Notification className="error_message" style={{ margin: '20px 0' }}>
									{isError.text}
								</Notification>
							)}
							{(!walletData.tokens.container.PUT || (!walletData.tokens.container.SETEACL && containerForm.eACLParams.length > 0)) ? (
								<>
									{!walletData.tokens.container.PUT && (
										<div className="token_status_panel" style={{ margin: '25px 0 10px', maxWidth: 'unset' }}>
											<Heading size={6} style={{ margin: '0 10px 0 0', maxWidth: 290 }}>Sign token to unlock create&nbsp;operation</Heading>
											<Button
												color="primary"
												size="small"
												onClick={() => onAuth('container', 'PUT')}
											>
												Sign
											</Button>
										</div>
									)}
									{!walletData.tokens.container.SETEACL && containerForm.eACLParams.length > 0 && (
										<div className="token_status_panel" style={{ margin: '10px 0', maxWidth: 'unset' }}>
											<Heading size={6} style={{ margin: '0 10px 0 0', maxWidth: 300 }}>Sign token to unlock eACL&nbsp;management</Heading>
											<Button
												color="primary"
												size="small"
												onClick={() => onAuth('container', 'SETEACL')}
											>
												Sign
											</Button>
										</div>
									)}
								</>
							) : (
								<Button
									color="primary"
									onClick={onCreateContainer}
									style={isLoadingForm ? {
										display: 'flex',
										margin: '30px auto 0',
										pointerEvents: 'none',
										opacity: 0.8,
									} : {
										display: 'flex',
										margin: '30px auto 0',
									}}
								>
									{isLoadingForm ? (
										<img
											src="/img/icons/spinner.svg"
											className="spinner"
											width={20}
											height={20}
											alt="spinner"
										/>
									) : "Create"}
								</Button>
							)}
						</div>
					</div>
				</div>
			)}
			{modal.current === 'deleteContainer' && (
				<div className="modal">
					<div
						className="modal_close_panel"
						onClick={() => {
							onModal();
							setError({ active: false, type: [], text: '' });
						}}
					/>
					<div className="modal_content">
						<div
							className="modal_close"
							onClick={() => {
								onModal();
								setError({ active: false, type: [], text: '' });
							}}
						>
							<img
								src="/img/icons/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5} weight="bold">Container Deletion</Heading>
						<Heading align="center" size={6}>Are you sure you want to delete container?</Heading>
						{isError.active && (
							<Notification className="error_message" style={{ margin: '20px 0' }}>
								{isError.text}
							</Notification>
						)}
						{!walletData.tokens.container.DELETE ? (
							<div className="token_status_panel">
								<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock delete&nbsp;operation</Heading>
								<Button
									color="primary"
									size="small"
									onClick={() => onAuth('container', 'DELETE')}
								>
									Sign
								</Button>
							</div>
						) : (
							<div style={{ margin: '30px 0 0', display: 'flex', justifyContent: 'center' }}>
								{!isLoadingForm && (
									<Button
										color="gray"
										onClick={onModal}
										style={{ marginRight: 10 }}
									>
										No
									</Button>
								)}
								<Button
									color="danger"
									onClick={() => onDeleteContainer(modal.text.containerId)}
								>
									{isLoadingForm ? (
									<img
										src="/img/icons/spinner.svg"
										className="spinner"
										width={20}
										height={20}
										alt="spinner"
									/>
								) : "Yes"}
								</Button>
							</div>
						)}
					</div>
				</div>
			)}
			{modal.current === 'createObject' && (
				<div className="modal">
					<div
						className="modal_close_panel"
						onClick={() => {
							onModal();
							setAttributes([]);
							setLoadingForm(false);
							setError({ active: false, type: [], text: '' });
							setObjectForm({
								name: '',
								file: '',
								loading: false,
							});
						}}
					/>
					<div className="modal_content">
						<div
							className="modal_close"
							onClick={() => {
								onModal();
								setAttributes([]);
								setLoadingForm(false);
								setError({ active: false, type: [], text: '' });
								setObjectForm({
									name: '',
									file: '',
									loading: false,
								});
							}}
						>
							<img
								src="/img/icons/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5} weight="bold">New object</Heading>
						<Form.Field>
							<div className="input_block" style={{ marginTop: 30 }}>
								{objectForm.loading ? (
									<label htmlFor="upload">Loading...</label>
								) : (
									<label
										htmlFor="upload"
										className={isError.active && isError.type.indexOf('objectName') !== -1 ? 'is-error' : ""}
										style={objectForm.name ? { background: '#f0f5f6', borderStyle: 'double' } : {}}
									>{objectForm.name ? objectForm.name : 'Upload object'}</label>
								)}
								<input
									id="upload"
									type="file"
									name="Upload"
									onChange={onHandleObject}
									onClick={isLoadingForm ? (e) => e.preventDefault() : () => {}}
								/>
							</div>
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
												className={isError.active && isError.type.indexOf('attributes') !== -1 && attribute.key.length === 0 ? 'is-error' : ""}
												onChange={(e) => {
													const attributesTemp = [...attributes];
													attributesTemp[index].key = e.target.value;
													setAttributes(attributesTemp);
												}}
												disabled={isLoadingForm}
											/>
										</Form.Control>
										<Form.Control>
											<Form.Input
												placeholder="Value"
												value={attribute.value}
												className={isError.active && isError.type.indexOf('attributes') !== -1 && attribute.value.length === 0 ? 'is-error' : ""}
												onChange={(e) => {
													const attributesTemp = [...attributes];
													attributesTemp[index].value = e.target.value;
													setAttributes(attributesTemp);
												}}
												disabled={isLoadingForm}
											/>
										</Form.Control>
										<Form.Control>
											<img
												src="/img/icons/trashbin.svg"
												width={18}
												height={18}
												alt="delete"
												style={{ cursor: 'pointer', margin: '9px 4px 4px' }}
												onClick={() => {
													if (!isLoadingForm) {
														let attributesTemp = [...attributes];
														attributesTemp.splice(index, 1);
														setAttributes(attributesTemp);
													}
												}}
											/>
										</Form.Control>
									</Form.Field>
								))}
							</div>
							<Button
								color="primary"
								size="small"
								className={isLoadingForm ? "button_disabled" : ""}
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
						{isError.active && (
							<Notification className="error_message" style={{ margin: '20px 0' }}>
								{isError.text}
							</Notification>
						)}
						{!walletData.tokens.object.PUT ? (
							<div className="token_status_panel" style={{ marginTop: '25px' }}>
								<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock create&nbsp;operation</Heading>
								<Button
									color="primary"
									size="small"
									onClick={() => onAuth('object', 'PUT')}
								>
									Sign
								</Button>
							</div>
						) : (
							<Button
								color="primary"
								onClick={() => onCreateObject(modal.text.containerId)}
								style={isLoadingForm ? {
									display: 'flex',
									margin: '30px auto 0',
									pointerEvents: 'none',
									opacity: 0.8,
								} : {
									display: 'flex',
									margin: '30px auto 0',
								}}
							>
								{isLoadingForm ? (
									<img
										src="/img/icons/spinner.svg"
										className="spinner"
										width={20}
										height={20}
										alt="spinner"
									/>
								) : "Create"}
							</Button>
						)}
					</div>
				</div>
			)}
			{modal.current === 'deleteObject' && (
				<div className="modal">
					<div
						className="modal_close_panel"
						onClick={() => {
							onModal();
							setError({ active: false, type: [], text: '' });
						}}
					/>
					<div className="modal_content">
						<div
							className="modal_close"
							onClick={() => {
								onModal();
								setError({ active: false, type: [], text: '' });
							}}
						>
							<img
								src="/img/icons/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5} weight="bold">Object Deletion</Heading>
						<Heading align="center" size={6}>Are you sure you want to delete object?</Heading>
						{isError.active && (
							<Notification className="error_message" style={{ margin: '20px 0' }}>
								{isError.text}
							</Notification>
						)}
						{!walletData.tokens.object.DELETE ? (
							<div className="token_status_panel">
								<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock delete&nbsp;operation</Heading>
								<Button
									color="primary"
									size="small"
									onClick={() => onAuth('object', 'DELETE')}
								>
									Sign
								</Button>
							</div>
						) : (
							<div style={{ margin: '30px 0 0', display: 'flex', justifyContent: 'center' }}>
								{!isLoadingForm && (
									<Button
										color="gray"
										onClick={onModal}
										style={{ marginRight: 10 }}
									>
										No
									</Button>
								)}
								<Button
									color="danger"
									onClick={() => onDeleteObject(modal.text.containerId, modal.text.objectId)}
								>
									{isLoadingForm ? (
										<img
											src="/img/icons/spinner.svg"
											className="spinner"
											width={20}
											height={20}
											alt="spinner"
										/>
									) : "Yes"}
								</Button>
							</div>
						)}
					</div>
				</div>
			)}
			{modal.current === 'loading' && (
				<div className="modal">
					<div
						className="modal_close_panel"
						onClick={onModal}
					/>
					<div className="modal_content">
						<div
							className="modal_close"
							onClick={onModal}
						>
							<img
								src="/img/icons/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5} weight="bold">Loading</Heading>
						<img
							className="modal_loader"
							src="/img/icons/loader.svg"
							height={30}
							width={30}
							alt="loader"
						/>
					</div>
				</div>
			)}
			{modal.current === 'approveRequest' && (
				<div className="modal">
					<div
						className="modal_close_panel"
						onClick={onModal}
					/>
					<div className="modal_content">
						<div
							className="modal_close"
							onClick={onModal}
						>
							<img
								src="/img/icons/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						<Heading align="center" size={5} weight="bold">Pending Call Request</Heading>
						<img
							className="modal_loader"
							src="/img/icons/loader.svg"
							height={30}
							width={30}
							alt="loader"
						/>
						<Heading align="center" size={6} weight="normal">Approve or reject request using your wallet</Heading>
					</div>
				</div>
			)}
			<Navbar>
				<Navbar.Brand>
					<Navbar.Item renderAs="div">
						<Link
							to={walletData ? "/profile" : "/"}
							style={{ lineHeight: 0 }}
						>
							<img
								src="/img/logo.svg"
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
					/>}
				/>
				<Route
					path="/profile"
					element={<Profile
						params={params}
						onAuth={onAuth}
						walletData={walletData}
						setWalletData={setWalletData}
						wcSdk={wcSdk}
						isLoadContainers={isLoadContainers}
						setLoadContainers={setLoadContainers}
						onDisconnectWallet={onDisconnectWallet}
						ContentTypeHeader={ContentTypeHeader}
						AuthorizationHeader={AuthorizationHeader}
						BearerOwnerIdHeader={BearerOwnerIdHeader}
						BearerSignatureHeader={BearerSignatureHeader}
						BearerSignatureKeyHeader={BearerSignatureKeyHeader}
						onModal={onModal}
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
							style={{ filter: 'invert(1)' }}
							alt="neo logo"
						/>
					</a>
					<span className="social_pipe">
						<a className="neospcc" href="https://nspcc.io/" target="_blank" rel="noopener noreferrer">
							<img
								src="/img/socials/neo_spcc.svg"
								width={37}
								height={37}
								alt="neo spcc logo"
							/>
						</a>
					</span>
					<a href="https://github.com/nspcc-dev" target="_blank" rel="noopener noreferrer" style={{ paddingLeft: 10 }}>
						<img
							src="/img/socials/github.svg"
							width={30}
							height={30}
							alt="github logo"
						/>
					</a>
					<a href="https://twitter.com/neospcc" target="_blank" rel="noopener noreferrer">
						<img
							src="/img/socials/twitter.svg"
							width={30}
							height={30}
							alt="twitter logo"
						/>
					</a>
					<a href="https://www.youtube.com/@NeoSPCC" target="_blank" rel="noopener noreferrer">
						<img
							src="/img/socials/youtube.svg"
							width={30}
							height={30}
							alt="youtube logo"
						/>
					</a>
					<a href="https://neospcc.medium.com/" target="_blank" rel="noopener noreferrer">
						<img
							src="/img/socials/medium.svg"
							width={30}
							height={30}
							alt="medium logo"
						/>
					</a>
				</div>
				<Heading
					size={6}
					weight="light"
					subtitle
					align="center"
					style={{ marginBottom: 0 }}
				>
					NeoFS Panel
				</Heading>
				<Heading
					size={7}
					weight="light"
					subtitle
					align="center"
				>
					{process.env.REACT_APP_VERSION}
				</Heading>
			</Footer>
		</>
	);
}
