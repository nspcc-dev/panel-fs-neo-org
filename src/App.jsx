import React, { useState, useEffect } from 'react';
import {
	Routes,
	Route,
	Link,
	useLocation,
	useNavigate,
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
import copy from 'copy-to-clipboard';
import Home from './Home';
import Profile from './Profile';
import Getobject from './Getobject';
import EACLPanel from './Components/EACLPanel/EACLPanel';
import api from './api';
import Neon from "@cityofzion/neon-js";
import { useWalletConnect } from "@cityofzion/wallet-connect-sdk-react";
import { BaseDapi } from '@neongd/neo-dapi';
import neo3Dapi from "neo3-dapi";
import QRCode from "react-qr-code";
import {
	invokeFunction,
	hexToBytesToBase64,
} from './Functions/handle';
import 'bulma/css/bulma.min.css';
import './App.css';

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDateToHours(date) {
	return Math.floor((new Date(`${date}T23:59:00`).getTime() - new Date().getTime()) / 1000 / 60 / 60)
}

export const App = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const wcSdk = useWalletConnect();
	const dapi = window.OneGate ? new BaseDapi(window.OneGate) : null;
	let [neolineN3, setNeolineN3] = useState(null);
	const [activeNet] = useState(import.meta.env.VITE_NETWORK ? capitalizeFirstLetter(import.meta.env.VITE_NETWORK) : 'Mainnet');
	const [NeoFSContract, setNeoFSContract] = useState({
		gasToken: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
		account: import.meta.env.VITE_NEOFS_ACCOUNT ? import.meta.env.VITE_NEOFS_ACCOUNT : 'NNxVrKjLsRkWsmGgmuNXLcMswtxTGaNQLk',
		scriptHash: Neon.create.account(import.meta.env.VITE_NEOFS_ACCOUNT).scriptHash,
		sidechain: import.meta.env.VITE_SIDECHAIN_RPC,
		sidechainContract: null,
	});

	const [params] = useState({
		rest_gw: import.meta.env.VITE_RESTGW ? import.meta.env.VITE_RESTGW : 'https://rest.t5.fs.neo.org',
	});

	const [objectLinkLifetime, setObjectLinkLifetime] = useState(new Date().toLocaleDateString("sv"));
	const [networkInfo, setNetworkInfo] = useState(null);
	const [gatewayInfo, setGatewayInfo] = useState(null);
	const [depositQuantity, setDepositQuantity] = useState(0);
	const [withdrawQuantity, setWithdrawQuantity] = useState(0);
	const [attributes, setAttributes] = useState([]);
	const [isLoadContainers, setLoadContainers] = useState(false);
	const [isLoadingForm, setLoadingForm] = useState(false);
	const [isCopied, setCopy] = useState(false);
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
				"operation": "GET",
				"action": "ALLOW",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}, {
				"operation": "HEAD",
				"action": "ALLOW",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}, {
				"operation": "RANGE",
				"action": "ALLOW",
				"filters": [],
				"targets": [{ "keys": [], "role": "OTHERS" }],
			}, {
				"operation": "RANGEHASH",
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
	const [isNeoLineSupport, setNeoLineSupport] = useState(false);

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
		window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
			setNeoLineSupport(true);
		});
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (wcSdk.isConnected() && location.pathname.indexOf('/getobject') === -1) {
			setWalletData({
				name:  wcSdk.session.peer.metadata.name,
				type: wcSdk.session.namespaces.neo3.accounts[0].split(':')[0],
				net: wcSdk.session.namespaces.neo3.accounts[0].split(':')[1],
				account: {
					address: wcSdk.session.namespaces.neo3.accounts[0].split(':')[2],
					publicKey: wcSdk.session.peer.publicKey,
				},
				tokens: {
					container: {},
					object: null
				}
			});
			onPopup('success', 'Wallet connected');
			onModal();

			api('GET', '/v1/network-info').then((e) => {
				if (!e.message) {
					setNetworkInfo(e);
				}
			});

			api('GET', '/v1/gateway').then((e) => {
				if (!e.message) {
					setGatewayInfo(e);
				}
			});

			onGetSidechainContract();

			if (location.pathname.indexOf('/profile') === -1 && location.pathname.indexOf('/getobject') === -1) {
				navigate('/profile');
			}
		} else if (location.pathname !== '/' && location.pathname.indexOf('/getobject') === -1) {
			document.location.href = "/";
		}
	}, [wcSdk]); // eslint-disable-line react-hooks/exhaustive-deps

	const onGetSidechainContract = async (containerId) => {
		const response_nns = await invokeFunction(
			NeoFSContract.sidechain,
			[1],
			"getcontractstate",
		);

		const response = await invokeFunction(
			NeoFSContract.sidechain,
			[
				response_nns.hash,
				"resolve",
				[
					{ type: "String", value: "container.neofs" },
					{ type: "Integer", value: "16" },
				]
			],
		);
		setNeoFSContract({ ...NeoFSContract, sidechainContract: atob(response.stack[0].value[0].value) })
	};

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
						token: bearer,
						lock: msg.lock,
						signature: response.data + response.salt,
					}
				}
			}
		}
		if (type === 'object') {
			walletDataTemp.tokens[type] = {
				...params,
				token: msg.token,
				lock: msg.lock,
				signature: response.data + response.salt,
			};
		}
		if (bearer) {
			walletDataTemp.tokens[type].bearer = bearer;
		}
		if (!walletDataTemp.expiry || walletDataTemp.expiry < new Date().getTime()) {
			walletDataTemp.expiry = new Date().getTime() + 7200000;
		}
		setWalletData(walletDataTemp);
	}

	const onAuth = async (type, operation, params = {}) => {
		let body = {};
		if (type === 'container') {
			body = {
				"contexts": [{
					"verbs": [operation],
				}],
				"issuer": walletData.account.address,
				"targets": [gatewayInfo.address],
			}
		} else if (type === 'object' && params.objectId) {
			body = [{
				"object": [{
					"operation": 'GET',
					"action": "ALLOW",
					"filters": [{
						"headerType": "OBJECT",
						"key": "$Object:objectID",
						"matchType": "STRING_EQUAL",
						"value": params.objectId,
					}],
					"targets": [{
						"role": "OTHERS",
						"keys": []
					}]
				}, {
					"operation": 'RANGE',
					"action": "ALLOW",
					"filters": [{
						"headerType": "OBJECT",
						"key": "$Object:objectID",
						"matchType": "STRING_EQUAL",
						"value": params.objectId,
					}],
					"targets": [{
						"role": "OTHERS",
						"keys": []
					}]
				}, {
					"operation": 'HEAD',
					"action": "ALLOW",
					"filters": [{
						"headerType": "OBJECT",
						"key": "$Object:objectID",
						"matchType": "STRING_EQUAL",
						"value": params.objectId,
					}],
					"targets": [{
						"role": "OTHERS",
						"keys": []
					}]
				}, ...presets.forbid.eACLParams]
			}]
		} else if (type === 'object') {
			body = [{
				"object": [{
					"operation": 'GET',
					"action": "ALLOW",
					"filters": [],
					"targets": [{
						"role": "OTHERS",
						"keys": []
					}]
				}, {
					"operation": 'PUT',
					"action": "ALLOW",
					"filters": [],
					"targets": [{
						"role": "OTHERS",
						"keys": []
					}]
				}, {
					"operation": 'DELETE',
					"action": "ALLOW",
					"filters": [],
					"targets": [{
						"role": "OTHERS",
						"keys": []
					}]
				}]
			}]
		}

		api('POST', type === 'container' ? '/v2/auth/session' : '/v1/auth', body, type === 'container' ? {} : {
			"X-Bearer-Owner-Id": walletData.account.address,
			"X-Bearer-Lifetime": params.objectId ? formatDateToHours(objectLinkLifetime) : 2,
			"X-Bearer-For-All-Users": true,
		}).then((e) => {
			onSignMessage(e, type, operation, params);
		});
	};

	const handleError = (error, type) => {
		if (error.data && error.data.message) {
			onModal('failed', error.data.message);
		} else if (error.message) {
			onModal('failed', error.message);
		} else if (error.description && error.description.msg) {
			onModal('failed', error.description.msg);
		} else if (error.description) {
			onModal('failed', error.description);
		} else if (error.type) {
			onModal('failed', error.type);
		} else if (type === 'balance') {
			onModal('failed', 'Wallet request failed: check your wallet connection');
		} else {
			onModal('failed', 'Something went wrong, try again');
		}
	};

	const onSignMessage = async (msg = '', type, operation, params) => {
		let response = '';

		if (walletData.name === 'o3-desktop') {
			response = await neo3Dapi.signMessage({ message: msg.token }).catch((err) => handleError(err));
		} else if (neolineN3) {
			response = await neolineN3.signMessage({ message: msg.token }).catch((err) => handleError(err));
		} else if (dapi) {
			response = await dapi.signMessage({ message: msg.token }).catch((err) => handleError(err));
			response.data = response.signature;
		} else {
			response = await wcSdk.signMessage({ message: msg.token, version: 1 }).catch((err) => handleError(err));
		}

		if (type === 'object') {
			api('GET', '/v1/auth/bearer?walletConnect=true', {}, {
				"Authorization": `Bearer ${msg.token}`,
				"X-Bearer-Signature": response.data + response.salt,
				"X-Bearer-Signature-Key": response.publicKey,
			}).then((e) => {
				if (params.objectId) {
					onModal('shareObjectLink', { ...params, token: e.token })
				} else {
					onUpdateWalletData(response, params, operation, type, msg, e.token);
				}
			});
		} else if (!response.error) {
			api('POST', '/v2/auth/session/complete', {
				"key": response.publicKey,
				"lock": msg.lock,
				"scheme": "WALLETCONNECT",
				"token": msg.token,
				"signature": hexToBytesToBase64(response.data + response.salt),
			}).then((e) => {
				onUpdateWalletData(response, params, operation, type, msg, e.token);
			});
		}
	};

	const onCreateContainer = () => {
		if (containerForm.eACLParams.every((eACLItem) => eACLItem.operation !== '' && eACLItem.action !== '' && eACLItem.targets[0].role !== '' && eACLItem.filters.every((filterItem) => filterItem.headerType !== '' && filterItem.matchType !== '' && filterItem.key !== '' && filterItem.value !== ''))) {
			if (attributes.every((attribute) => attribute.key.length > 0 && attribute.value.length > 0)) {
				if (containerForm.containerName.length > 0 && containerForm.placementPolicy.length > 0 && containerForm.basicAcl.length > 0) {
					if (containerForm.containerName.length >= 3) {
						setError({ active: false, type: [], text: '' });
						setLoadingForm(true);
						api('PUT', '/v1/containers?walletConnect=true&name-scope-global=true', {
							"containerName": containerForm.containerName,
							"placementPolicy": containerForm.placementPolicy,
							"basicAcl": containerForm.basicAcl,
							"attributes": attributes,
						}, {
							"Authorization": `Bearer ${walletData.tokens.container.CONTAINER_PUT.token}`,
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
									api('PUT', `/v1/containers/${e.containerId}/eacl?walletConnect=true`, {
										"records": containerForm.eACLParams.filter((item) => delete item.isOpen),
									}, {
										"Authorization": `Bearer ${walletData.tokens.container.CONTAINER_SET_EACL.token}`,
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
		setLoadingForm(true);
		setError({ active: false, type: [], text: '' });
		api('DELETE', `/v1/containers/${containerName}?walletConnect=true`, {}, {
			"Authorization": `Bearer ${walletData.tokens.container.CONTAINER_DELETE.token}`,
		}).then((e) => {
			setLoadingForm(false);
			if (e.message) {
				setError({ active: true, type: [], text: e.message });
			} else {
				onModal();
				onPopup('success', 'Container was deleted successfully');
				setLoadContainers(true);
			}
		});
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

				const attributesHeaders = {};
				attributes.map((attribute) => attributesHeaders[attribute.key] = attribute.value);
				api('POST', `/v1/objects/${containerId}`, objectForm.file, {
					'Content-Type': objectForm.file.type,
					"Authorization": `Bearer ${walletData.tokens.object.bearer}`,
					'X-Attributes': JSON.stringify({
						'FileName': objectForm.name,
						...attributesHeaders,
					}),
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
		setError({ active: false, type: [], text: '' });
		setLoadingForm(true);
		api('DELETE', `/v1/objects/${containerId}/${objectId}`, {}, {
			"Authorization": `Bearer ${walletData.tokens.object.bearer}`,
		}).then((e) => {
			setLoadingForm(false);
			if (e.message) {
				setError({ active: true, type: [], text: e.message });
			} else {
				onPopup('success', 'Object was deleted successfully');
				setLoadContainers(containerId);
			}
		});
	};

	const onDeposit = async (neoBalanceTemp) => {
		if (depositQuantity * 1e8 >= 1 && depositQuantity * 1e8 <= neoBalanceTemp) {
			onModal('approveRequest');
			const invocations = [{
				scriptHash: NeoFSContract.gasToken,
				operation: 'transfer',
				args: [
					{ type: 'Hash160', value: Neon.create.account(walletData.account.address).scriptHash },
					{ type: 'Hash160', value: Neon.create.account(NeoFSContract.account).scriptHash },
					{ type: 'Integer', value: depositQuantity * 1e8 },
					{ type: 'Any', value: null },
				]
			}];

			const signers = [{
				scopes: 'CalledByEntry',
				account: Neon.create.account(walletData.account.address).scriptHash,
			}];

			let response = '';
			if (walletData.name === 'o3-desktop') {
				response = await neo3Dapi.invoke({ ...invocations[0], signers }).catch((err) => handleError(err));
			} else if (neolineN3) {
				response = await neolineN3.invoke({ ...invocations[0], signers }).catch((err) => handleError(err));
			} else if (dapi) {
				response = await dapi.invoke({ ...invocations[0], signers }).catch((err) => handleError(err));
			} else {
				response = await wcSdk.invokeFunction({ invocations, signers }).catch((error) => {
					if (error.message === 'Failed or Rejected Request') {
						onModal('failed', 'Failed or Rejected Request');
					} else if (error.message === 'Error: intrinsic gas too low') {
						onModal('failed', 'Transaction intrinsic gas too low');
					} else {
						onModal('failed', 'Something went wrong, try again');
					}
				});
			}
			if (!response.error) {
				setDepositQuantity(0);
				onModal('success', response.txid ? response.txid : response);
			}
		} else {
			onPopup('failed', 'Incorrect amount');
		}
	};

	const onWithdraw = async (neoFSBalanceTemp) => {
		if (withdrawQuantity >= 1 && withdrawQuantity * 1e12 <= neoFSBalanceTemp) {
			onModal('approveRequest');
			const invocations = [{
				scriptHash: NeoFSContract.scriptHash,
				operation: 'withdraw',
				args: [
					{ type: 'Hash160', value: Neon.create.account(walletData.account.address).scriptHash },
					{ type: 'Integer', value: withdrawQuantity },
				]
			}];

			const signers = [{
				scopes: 'CustomContracts',
				account: Neon.create.account(walletData.account.address).scriptHash,
				allowedContracts: [NeoFSContract.gasToken, NeoFSContract.scriptHash]
			}];

			let response = '';
			if (walletData.name === 'o3-desktop') {
				response = await neo3Dapi.invoke({ ...invocations[0], signers }).catch((err) => handleError(err));
			} else if (neolineN3) {
				response = await neolineN3.invoke({ ...invocations[0], signers }).catch((err) => handleError(err));
			} else if (dapi) {
				response = await dapi.invoke({ ...invocations[0], signers }).catch((err) => handleError(err));
			} else {
				response = await wcSdk.invokeFunction({ invocations, signers }).catch((err) => handleError(err));
			}
			if (response && !response.message) {
				setWithdrawQuantity(0);
				onModal('success', response.txid ? response.txid : response);
			}
		} else {
			onPopup('failed', 'Incorrect amount');
		}
	};

	const onConnectWallet = async (type) => {
		try {
			if (type === 'o3') {
				const account = await neo3Dapi.getPublicKey().catch((err) => handleError(err));
				const provider = await neo3Dapi.getProvider();
				const networks = await neo3Dapi.getNetworks();

				if (account) {
					setWalletData({
						name: provider.name,
						type: 'neo3',
						net: networks.defaultNetwork.toLowerCase(),
						account: account,
						tokens: {
							container: {},
							object: null,
						}
					});

					onPopup('success', 'Wallet connected');
					onModal();

					if (location.pathname.indexOf('/profile') === -1) {
						navigate('/profile');
					}
				}
			} else if (type === 'neoline') {
				const neolineN3 = new window.NEOLineN3.Init();
				setNeolineN3(neolineN3);
				neolineN3.getPublicKey().then((account) => {
					neolineN3.getNetworks().then((networks) => {
						setWalletData({
							name: 'NeoLine',
							type: 'neo3',
							net: networks.defaultNetwork.toLowerCase(),
							account: account,
							tokens: {
								container: {},
								object: null,
							}
						});

						onPopup('success', 'Wallet connected');
						onModal();

						if (location.pathname.indexOf('/profile') === -1) {
							navigate('/profile');
						}
					}).catch((err) => handleError(err));
				}).catch((err) => handleError(err));
			} else if (type === 'onegate') {
				const account = await dapi.getAccount().catch((err) => handleError(err));
				const provider = await dapi.getProvider();
				const networks = await dapi.getNetworks();

				if (account) {
					setWalletData({
						name: provider.name,
						type: 'neo3',
						net: networks.defaultNetwork.toLowerCase(),
						account: account,
						tokens: {
							container: {},
							object: null,
						}
					});
					onPopup('success', 'Wallet connected');
					onModal();

					if (location.pathname.indexOf('/profile') === -1) {
						navigate('/profile');
					}
				}
			} else {
				const { uri, approval } = await wcSdk.createConnection(`neo3:${activeNet.toLowerCase()}`, ['invokeFunction', 'testInvoke', 'signMessage', 'verifyMessage']);
				onModal('connectWallet', uri);
				const session = await approval();
				wcSdk.setSession(session);
			}
		} catch (error) {
			onModal('failed', type === 'onegate' ? 'OneGate connection works only if you open the page from OneGate explorer' : 'Failed to connect to the wallet, please try again');
		}
	}

	const onDisconnectWallet = async () => {
		if (walletData && walletData.name === 'o3-desktop') {
			await neo3Dapi.disconnect();
		} else if (!dapi) {
			await wcSdk.disconnect();
		}
		onPopup('success', 'Wallet disconnected');
		document.location.href = "/";
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
						{modal.text.indexOf('0x') !== -1 && (
							<>
								<Heading align="center" size={6} weight="normal">Transaction id:</Heading>
								<div
									className="modal_highlighted_copy"
									style={{ marginBottom: 0 }}
									onClick={() => {
										copy(modal.text);
										setCopy(true);
										setTimeout(() => {
											setCopy(false);
										}, 700);
									}}
								>
									{modal.text}
									{isCopied && (
										<div className="tooltip">Copied!</div>
									)}
								</div>
								<div className='btns_group'>
									<a
										href={`https://dora.coz.io/transaction/neo3/${activeNet.toLowerCase()}/${modal.text}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Button
											renderAs="button"
											color="primary"
											size="small"
										>
											Dora
										</Button>
									</a>
									<a
										href={activeNet.toLowerCase() === 'mainnet' ? `https://neotube.io/transaction/${modal.text}` : `https://${activeNet.toLowerCase()}.neotube.io/transaction/${modal.text}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Button
											renderAs="button"
											color="primary"
											size="small"
										>
											NeoTube
										</Button>
									</a>
								</div>
							</>
						)}
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
						<Heading align="center" size={5} weight="bold">Select connection method</Heading>
						<Heading align="center" size={6} style={{ marginBottom: 10 }}>QR code connection</Heading>
						<Heading align="center" size={7} weight="normal">Please scan QR code to connect your wallet on a compatible device</Heading>
						<div style={{ margin: "0 auto 20px", width: 128 }}>
							<QRCode
								value={modal.text}
								style={{ height: "auto", maxWidth: "100%", width: "100%" }}
							/>
						</div>
						<Heading align="center" size={6} style={{ marginBottom: 10 }}>Connection URL</Heading>
						<Heading align="center" size={7} weight="normal">Copy and paste the connection URL into the Add connection page in your wallet</Heading>
						<div
							className="modal_highlighted_copy"
							onClick={() => {
								copy(modal.text);
								setCopy(true);
								setTimeout(() => {
									setCopy(false);
								}, 700);
							}}
						>
							{modal.text}
							{isCopied && (
								<div className="tooltip">Copied!</div>
							)}
						</div>
					</div>
				</div>
			)}
			{modal.current === 'installWallet' && (
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
						<Heading align="center" size={5} weight="bold">New here?</Heading>
						<Heading className="input_caption" style={{ width: '300px', margin: '0 auto 15px' }}>In order to use Panel you need to connect a Neo N3 wallet.</Heading>
						<a
							href="https://neoline.io/"
							style={{ textDecoration: 'none' }}
							rel="noopener noreferrer"
							target="_blank"
						>
							<Button className="btn_connect_wallet" renderAs="button">
								Install NeoLine
								<img src="/img/icons/wallets/neoline.svg" alt="neoline logo" />
							</Button>
						</a>
						<a
							href="https://o3.network/#/wallet"
							style={{ textDecoration: 'none' }}
							rel="noopener noreferrer"
							target="_blank"
						>
							<Button className="btn_connect_wallet" renderAs="button">
								Install O3
								<img src="/img/icons/wallets/o3.svg" alt="o3 logo" />
							</Button>
						</a>
						<a
							href="https://neon.coz.io/"
							style={{ textDecoration: 'none' }}
							rel="noopener noreferrer"
							target="_blank"
						>
							<Button className="btn_connect_wallet" renderAs="button">
								Install Neon
								<img src="/img/icons/wallets/neon.svg" alt="neon logo" />
							</Button>
						</a>
						<a
							href="https://onegate.space/"
							style={{ textDecoration: 'none' }}
							rel="noopener noreferrer"
							target="_blank"
						>
							<Button className="btn_connect_wallet" renderAs="button">
								Install Onegate
								<img src="/img/icons/wallets/onegate.svg" alt="onegate logo" />
							</Button>
						</a>
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
							{(modal.text === '' || modal.text === 'container.CONTAINER_PUT' || modal.text === 'container.CONTAINER_DELETE' || modal.text === 'container.CONTAINER_SET_EACL') && (
								<Columns.Column>
									{(modal.text === '' || modal.text === 'container.CONTAINER_PUT') && (
										<div className="token_status_panel">
											<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock create&nbsp;operation</Heading>
											{walletData && walletData.tokens.container.CONTAINER_PUT ? (
												<img
													src="/img/icons/success.svg"
													height={25}
													width={25}
													alt="success"
												/>
											) : (
												<Button
													renderAs="button"
													color="primary"
													size="small"
													onClick={() => onAuth('container', 'CONTAINER_PUT')}
												>
													Sign
												</Button>
											)}
										</div>
									)}
									{(modal.text === '' || modal.text === 'container.CONTAINER_DELETE') && (
										<div className="token_status_panel">
											<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock delete&nbsp;operation</Heading>
											{walletData && walletData.tokens.container.CONTAINER_DELETE ? (
												<img
													src="/img/icons/success.svg"
													height={25}
													width={25}
													alt="success"
												/>
											) : (
												<Button
													renderAs="button"
													color="primary"
													size="small"
													onClick={() => onAuth('container', 'CONTAINER_DELETE')}
												>
													Sign
												</Button>
											)}
										</div>
									)}
									{(modal.text === '' || modal.text === 'container.CONTAINER_SET_EACL') && (
										<div className="token_status_panel">
											<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock eACL&nbsp;management</Heading>
											{walletData && walletData.tokens.container.CONTAINER_SET_EACL ? (
												<img
													src="/img/icons/success.svg"
													height={25}
													width={25}
													alt="success"
												/>
											) : (
												<Button
													renderAs="button"
													color="primary"
													size="small"
													onClick={() => onAuth('container', 'CONTAINER_SET_EACL', modal.params)}
												>
													Sign
												</Button>
											)}
										</div>
									)}
								</Columns.Column>
							)}
							{(modal.text === '' || modal.text === 'object') && (
								<Columns.Column>
									<div className="token_status_panel">
										<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock object&nbsp;operations</Heading>
										{walletData && walletData.tokens.object ? (
											<img
												src="/img/icons/success.svg"
												height={25}
												width={25}
												alt="success"
											/>
										) : (
											<Button
												renderAs="button"
												color="primary"
												size="small"
												onClick={() => onAuth('object', null, modal.params)}
											>
												Sign
											</Button>
										)}
									</div>
								</Columns.Column>
							)}
						</Columns>
						{walletData && walletData.tokens.container.CONTAINER_PUT && walletData.tokens.container.CONTAINER_DELETE && walletData.tokens.container.CONTAINER_SET_EACL
							&& walletData.tokens.object && (
							<Button
								renderAs="button"
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
							<Heading className="input_caption">{`Container cost is ${networkInfo ? 7 * (networkInfo.containerFee + networkInfo.namedContainerFee) * 1e-12 : '-'} GAS for ${activeNet.toLowerCase()} now.`}</Heading>
							<Form.Field>
								<Form.Label>Name</Form.Label>
								<Form.Control>
									<Form.Input
										renderAs="input"
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
										renderAs="input"
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
													renderAs="input"
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
													renderAs="input"
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
									renderAs="button"
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
										renderAs="input"
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
							{(!walletData.tokens.container.CONTAINER_PUT || (!walletData.tokens.container.CONTAINER_SET_EACL && containerForm.eACLParams.length > 0)) ? (
								<>
									{!walletData.tokens.container.CONTAINER_PUT && (
										<div className="token_status_panel" style={{ margin: '25px 0 10px', maxWidth: 'unset' }}>
											<Heading size={6} style={{ margin: '0 10px 0 0', maxWidth: 290 }}>Sign token to unlock create&nbsp;operation</Heading>
											<Button
												renderAs="button"
												color="primary"
												size="small"
												onClick={() => onAuth('container', 'CONTAINER_PUT')}
											>
												Sign
											</Button>
										</div>
									)}
									{!walletData.tokens.container.CONTAINER_SET_EACL && containerForm.eACLParams.length > 0 && (
										<div className="token_status_panel" style={{ margin: '10px 0', maxWidth: 'unset' }}>
											<Heading size={6} style={{ margin: '0 10px 0 0', maxWidth: 300 }}>Sign token to unlock eACL&nbsp;management</Heading>
											<Button
												renderAs="button"
												color="primary"
												size="small"
												onClick={() => onAuth('container', 'CONTAINER_SET_EACL')}
											>
												Sign
											</Button>
										</div>
									)}
								</>
							) : (
								<Button
									renderAs="button"
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
						{!walletData.tokens.container.CONTAINER_DELETE ? (
							<div className="token_status_panel">
								<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock delete&nbsp;operation</Heading>
								<Button
									renderAs="button"
									color="primary"
									size="small"
									onClick={() => onAuth('container', 'CONTAINER_DELETE')}
								>
									Sign
								</Button>
							</div>
						) : (
							<div style={{ margin: '30px 0 0', display: 'flex', justifyContent: 'center' }}>
								{!isLoadingForm && (
									<Button
										renderAs="button"
										color="gray"
										onClick={() => {
											onModal();
											setError({ active: false, type: [], text: '' });
										}}
										style={{ marginRight: 10 }}
									>
										No
									</Button>
								)}
								<Button
									renderAs="button"
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
						<Heading className="input_caption">Attributes are key value pairs (string:string) that are attached to the metadata of objects. You can specify anything as an attribute.<br/><br/>If you set the FileName attribute, you can also see the file name in the object list. The FilePath attribute allows you to present the list of objects as a tree in the panel interface.</Heading>
							<div style={attributes.length >= 3 ? { overflow: 'scroll', maxHeight: 180 } : {}}>
								{attributes.map((attribute, index) => (
									<Form.Field kind="group" key={index}>
										<Form.Control>
											<Form.Input
												renderAs="input"
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
												renderAs="input"
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
								renderAs="button"
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
						<Button
							renderAs="button"
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
					</div>
				</div>
			)}
			{modal.current === 'shareObjectLink' && (
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
						<Heading align="center" size={5} weight="bold">Sharing object</Heading>
						<Heading align="center" size={6} style={{ margin: '1.5rem auto', width: '350px' }}>{`You can share a link to this object, it will be available to everyone without authorization until${modal.text.type === 'private' ? ':' : ' EACL change'}${!modal.text.token && modal.text.type === 'private' ? '' : ` ${new Date(objectLinkLifetime).toLocaleDateString()}`}`}</Heading>
						{!modal.text.token && modal.text.type === 'private' ? (
							<>
								<Form.Control style={{ marginBottom: '1.5rem' }}>
									<Form.Input
										renderAs="input"
										type="date"
										value={objectLinkLifetime}
										onChange={(e) => setObjectLinkLifetime(e.target.value)}
									/>
								</Form.Control>
								<div className="token_status_panel">
									<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to share&nbsp;object</Heading>
									<Button
										renderAs="button"
										color="primary"
										size="small"
										onClick={() => onAuth('object', null, modal.text)}
									>
										Sign
									</Button>
								</div>
							</>
						) : (
							<>
								<a
									href={`${document.location.origin}/getobject?cid=${modal.text.containerId}&oid=${modal.text.objectId}${modal.text.token ? `&token=${modal.text.token}` : ''}`}
									className="modal_highlighted_copy"
									target="_blank"
									rel="noopener noreferrer"
								>
									<span>
										{`${document.location.origin}/getobject?cid=${modal.text.containerId}&oid=${modal.text.objectId}${modal.text.token ? `&token=${modal.text.token}` : ''}`}
									</span>
								</a>
								<div
									className="copy_text"
									onClick={() => {
										copy(`${document.location.origin}/getobject?cid=${modal.text.containerId}&oid=${modal.text.objectId}${modal.text.token ? `&token=${modal.text.token}` : ''}`);
										setCopy(true);
										setTimeout(() => {
											setCopy(false);
										}, 700);
									}}
								>
									<Button
										renderAs="button"
										color="primary"
										size="small"
										style={{ margin: 'auto', display: 'flex' }}
									>
										Copy link
										{isCopied && (
											<div className="tooltip">Copied!</div>
										)}
									</Button>
								</div>
							</>
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
						<div style={{ margin: '30px 0 0', display: 'flex', justifyContent: 'center' }}>
							{!isLoadingForm && (
								<Button
									renderAs="button"
									color="gray"
									onClick={() => {
										onModal();
										setError({ active: false, type: [], text: '' });
									}}
									style={{ marginRight: 10 }}
								>
									No
								</Button>
							)}
							<Button
								renderAs="button"
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
					</div>
				</div>
			)}
			{modal.current === 'deposit' && (
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
						<Heading align="center" size={5} weight="bold">{`Deposit from ${activeNet} to NeoFS`}</Heading>
						<Form.Field>
							<Form.Label size="small" weight="light">Quantity (GAS)</Form.Label>
							<Form.Control>
								<Form.Input
									renderAs="input"
									type="number"
									value={depositQuantity}
									onChange={(e) => setDepositQuantity(e.target.value)}
								/>
							</Form.Control>
						</Form.Field>
						<Button
							renderAs="button"
							color="primary"
							onClick={() => onDeposit(modal.text.neoBalance)}
							size="small"
							style={{ display: 'flex', margin: 'auto' }}
						>
							Make a payment
						</Button>
					</div>
				</div>
			)}
			{modal.current === 'withdraw' && (
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
						<Heading align="center" size={5} weight="bold">{`Withdraw from NeoFS to ${activeNet}`}</Heading>
						<Heading className="input_caption" style={{ maxWidth: 310 }}>{`Withdrawing requires a fee to be paid, currently it's ${networkInfo ? 7 * networkInfo.withdrawalFee * 1e-8  : '-'} GAS.`} It will be reduced once the <a href="https://github.com/neo-project/neo/issues/1573" target="_blank" rel="noopener noreferrer" alt="neofs-node">notary subsystem</a> is implemented in Neo</Heading>
						<Form.Field>
							<Form.Label size="small" weight="light">Quantity (GAS)</Form.Label>
							<Form.Control>
								<Form.Input
									renderAs="input"
									type="number"
									value={withdrawQuantity}
									onChange={(e) => setWithdrawQuantity(e.target.value)}
									onKeyPress={(event) => {
										if (!/[0-9]/.test(event.key)) {
											event.preventDefault();
										}
									}}
								/>
							</Form.Control>
						</Form.Field>
						<Button
							renderAs="button"
							color="primary"
							onClick={() => onWithdraw(modal.text.neoFSBalance)}
							size="small"
							style={{ display: 'flex', margin: 'auto' }}
						>
							Receive funds
						</Button>
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
				<Navbar.Brand
					style={{ justifyContent: 'space-between' }}
				>
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
					{walletData && (
						<Navbar.Item renderAs="div" align="end">
							<Button
								renderAs="button"
								color="secondary"
								size="small"
								onClick={onDisconnectWallet}
							>
								Disconnect
							</Button>
						</Navbar.Item>
					)}
			</Navbar.Brand>
			</Navbar>
			<Routes>
				<Route
					path="/"
					element={<Home
						onModal={onModal}
						dapi={dapi}
						isNeoLineSupport={isNeoLineSupport}
						onConnectWallet={onConnectWallet}
					/>}
				/>
				<Route
					path="/getobject"
					element={<Getobject
						onModal={onModal}
					/>}
				/>
				<Route
					path="/profile"
					element={<Profile
						params={params}
						networkInfo={networkInfo}
						NeoFSContract={NeoFSContract}
						activeNet={activeNet}
						onAuth={onAuth}
						walletData={walletData}
						handleError={handleError}
						setWalletData={setWalletData}
						wcSdk={wcSdk}
						dapi={dapi}
						neolineN3={neolineN3}
						isLoadContainers={isLoadContainers}
						setLoadContainers={setLoadContainers}
						onDisconnectWallet={onDisconnectWallet}
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
					size={7}
					weight="light"
					subtitle
					align="center"
					style={{ marginBottom: 0 }}
				>
					<a
						href="https://fs.neo.org/hosting/"
						target="_blank"
						rel="noopener noreferrer"
						style={{ textDecoration: 'underline', color: '#003' }}
					>Hosted on NeoFS</a>
				</Heading>
				<Heading
					size={7}
					weight="light"
					subtitle
					align="center"
				>
					{import.meta.env.VITE_VERSION}
				</Heading>
			</Footer>
		</>
	);
}
