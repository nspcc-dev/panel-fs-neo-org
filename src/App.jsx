import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import TokenSignPanel from './Components/TokenSignPanel/TokenSignPanel';
import WalletAuthMethods from './Components/WalletAuthMethods/WalletAuthMethods';
import api from './api';
import Neon from "@cityofzion/neon-js";
import QRCode from "react-qr-code";
import {
	invokeFunction,
	hexToBytesToBase64,
	attributesToBase64,
} from './Functions/handle';
import { getWcSdk } from './Functions/wcSdk';
import 'bulma/css/bulma.min.css';
import './App.css';

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

const NETWORK_MAGIC = {
	860833102: 'mainnet',
	894710606: 'testnet',
};

function formatDateToHours(date) {
	return Math.floor((new Date(`${date}T23:59:00`).getTime() - new Date().getTime()) / 1000 / 60 / 60)
}

export const App = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [wcSdk, setWcSdk] = useState(null);
	const dapi = useMemo(() => window.OneGateDapiProvider || null, []);
	let [neolineN3, setNeolineN3] = useState(null);
	const [activeNet] = useState(import.meta.env.VITE_NETWORK ? capitalizeFirstLetter(import.meta.env.VITE_NETWORK) : 'Mainnet');
	const [NeoFSContract, setNeoFSContract] = useState({
		gasToken: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
		account: import.meta.env.VITE_NEOFS_ACCOUNT ? import.meta.env.VITE_NEOFS_ACCOUNT : 'NNxVrKjLsRkWsmGgmuNXLcMswtxTGaNQLk',
		scriptHash: Neon.create.account(import.meta.env.VITE_NEOFS_ACCOUNT).scriptHash,
		sidechain: import.meta.env.VITE_SIDECHAIN_RPC,
		sidechainContract: null,
		nnsHash: null,
	});

	const [params] = useState({
		rest_gw: import.meta.env.VITE_RESTGW ? import.meta.env.VITE_RESTGW : 'https://rest.t5.fs.neo.org',
	});

	const [objectLinkLifetime, setObjectLinkLifetime] = useState(new Date().toLocaleDateString("sv"));
	const [networkInfo, setNetworkInfo] = useState(null);
	const [gatewayInfo, setGatewayInfo] = useState(null);
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
			}],
		}
	});
	const [shareObjectForm, setShareObjectForm] = useState({
		type: '',
		address: '',
	});
	const [domainForm, setDomainForm] = useState({
		name: '',
		email: '',
		refresh: '3600',
		retry: '600',
		expire: '86400',
		ttl: '3600',
	});
	const [domainsRefreshTick, setDomainsRefreshTick] = useState(0);
	const [isDomainAdvancedOpen, setDomainAdvancedOpen] = useState(false);
	const [containerForm, setContainerForm] = useState({
		containerName: '',
		placementPolicy: '',
		basicAcl: 'eacl-public-read-write',
		eACLParams: presets.forbid.eACLParams,
		preset: 'forbid',
	});
	const [walletData, setWalletData] = useState(null);
	const [isNeoLineSupport, setNeoLineSupport] = useState(false);
	const [isNeonReady, setNeonReady] = useState(false);

	const [modal, setModal] = useState({
		current: null,
		text: '',
		params: '',
	});
	const [popups, setPopups] = useState([]);
	const popupTimers = useRef(new Map());
	const popupCounter = useRef(0);

	const onModal = (current = null, text = null, params = null) => {
		setModal({ current, text, params });
	};

	const openDomainRegister = (name = '') => {
		setDomainForm((prev) => ({ ...prev, name, email: '' }));
		const neoNamespace = wcSdk?.session?.namespaces?.neo3;
		const sessionChains = neoNamespace?.accounts?.map((a) => a.split(':').slice(0, 2).join(':'));
		const hasPrivate = neoNamespace?.chains?.includes('neo3:private') || sessionChains?.includes('neo3:private');
		onModal(hasPrivate ? 'registerDomain' : 'fsChainSwitch');
	};

	const onPopup = (current = null, text = null) => {
		if (!current || !text) {
			return;
		}

		const id = `${Date.now()}-${popupCounter.current++}`;
		setPopups((prev) => [...prev, { id, current, text }]);

		const timerId = setTimeout(() => {
			setPopups((prev) => prev.filter((popupItem) => popupItem.id !== id));
			popupTimers.current.delete(id);
		}, 3000);

		popupTimers.current.set(id, timerId);
	};

	useEffect(() => {
		return () => {
			popupTimers.current.forEach((timerId) => clearTimeout(timerId));
			popupTimers.current.clear();
		};
	}, []);

	useEffect(() => {
		let cancelled = false;
		getWcSdk().then((sdk) => {
			if (cancelled) return;
			setWcSdk(sdk);
		}).catch((err) => console.error('WalletConnect init failed', err));
		return () => { cancelled = true; };
	}, []);

	const onLoadWalletSessionData = () => {
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
	};

	const onHandleConnectedWallet = (nextWalletData) => {
		setWalletData(nextWalletData);
		onPopup('success', 'Wallet connected');
		onModal();
		onLoadWalletSessionData();

		if (location.pathname.indexOf('/profile') === -1 && location.pathname.indexOf('/getobject') === -1) {
			navigate('/profile');
		}
	};

	useEffect(() => {
		window.addEventListener('NEOLine.NEO.EVENT.READY', () => {
			setNeoLineSupport(true);
		});
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!wcSdk) return;
		try {
			if (!wcSdk.getChainId()) {
				setNeonReady(true);
			}
		} catch {
			// SDK not ready yet — expected, leave neonReady as is.
		}
	}, [wcSdk]);

	useEffect(() => {
		let isCancelled = false;

		const initWalletSession = async () => {
			if (walletData) {
				return;
			}

			const withTimeout = async (promise, timeout = 1500) => (
				await Promise.race([
					promise,
					new Promise((resolve) => setTimeout(() => resolve(null), timeout)),
				])
			);

			const isProtectedRoute = location.pathname !== '/' && location.pathname.indexOf('/getobject') === -1;
			if (wcSdk?.isConnected()) {
				if (isCancelled) {
					return;
				}
				onHandleConnectedWallet({
					name: wcSdk.session.peer.metadata.name,
					type: wcSdk.session.namespaces.neo3.accounts[0].split(':')[0],
					net: wcSdk.session.namespaces.neo3.accounts[0].split(':')[1],
					account: {
						address: wcSdk.session.namespaces.neo3.accounts[0].split(':')[2],
						publicKey: wcSdk.session.peer.publicKey,
					},
					tokens: {
						container: {},
						object: null,
					}
				});
			} else if (isProtectedRoute && isNeonReady) {
				let isWalletConnected = false;

				if (!isWalletConnected && dapi) {
					try {
						const accounts = await withTimeout(dapi.getAccounts());
						const account = accounts && accounts[0];
						if (account && !isCancelled) {
							onHandleConnectedWallet({
								name: dapi.name,
								type: 'neo3',
								net: NETWORK_MAGIC[dapi.network] || activeNet.toLowerCase(),
								account: { address: account.address },
								tokens: {
									container: {},
									object: null,
								}
							});
							isWalletConnected = true;
						}
					} catch {}
				}

				if (!isWalletConnected && !isCancelled) {
					document.location.href = "/";
				}
			}
		};

		initWalletSession();

		return () => {
			isCancelled = true;
		};
	}, [wcSdk, dapi, location.pathname, walletData, isNeonReady]); // eslint-disable-line react-hooks/exhaustive-deps

	const onGetSidechainContract = async (containerId) => {
		try {
			const response_nns = await invokeFunction(
				NeoFSContract.sidechain,
				[1],
				"getcontractstate",
			);
			if (!response_nns || response_nns.message || !response_nns.hash) {
				onPopup('failed', response_nns?.message || 'Failed to resolve NNS contract');
				return;
			}

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
			if (!response) {
				onPopup('failed', 'No response from RPC');
				return;
			}
			if (response.exception) {
				onPopup('failed', response.exception);
				return;
			}
			const sidechainContractValue = response.stack?.[0]?.value?.[0]?.value;
			if (!Array.isArray(response.stack) || sidechainContractValue == null) {
				onPopup('failed', response.message || 'Failed to resolve container contract');
				return;
			}
			setNeoFSContract({
				...NeoFSContract,
				sidechainContract: atob(sidechainContractValue),
				nnsHash: response_nns.hash,
			});
		} catch (error) {
			onPopup('failed', error?.message || 'Failed to initialize NeoFS contract');
		}
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
		setWalletData((prev) => {
			const next = {
				...prev,
				publicKey: response.publicKey,
				tokens: {
					...prev.tokens,
					container: { ...prev.tokens.container },
					object: prev.tokens.object,
				},
			};
			if (type === 'container') {
				const objectVerbs = [];
				operation.forEach((verb) => {
					if (verb.startsWith('CONTAINER_')) {
						next.tokens.container[verb] = {
							...params,
							token: bearer,
							lock: msg.lock,
							signature: response.data + response.salt,
						};
					} else if (verb.startsWith('OBJECT_')) {
						objectVerbs.push(verb);
					}
				});
				if (objectVerbs.length > 0) {
					next.tokens.object = {
						...params,
						token: bearer,
						bearer,
						lock: msg.lock,
						signature: response.data + response.salt,
						verbs: objectVerbs,
					};
				}
			} else if (type === 'sharedObjectAccess') {
				next.tokens.sharedObjectAccess = {
					...prev.tokens.sharedObjectAccess,
					[operation]: {
						...params,
						token: bearer,
						lock: msg.lock,
						signature: response.data + response.salt,
					},
				};
			}
			if (!next.expiry || next.expiry < new Date().getTime()) {
				next.expiry = new Date().getTime() + 7200000;
			}
			return next;
		});
	}

	const onAuth = async (type, operation, params = {}) => {
		let body = {};
		if (type === 'container') {
			body = {
				"contexts": [{
					"verbs": operation,
				}],
				"issuer": walletData.account.address,
				"targets": [gatewayInfo.address],
			}
			const e = await api('POST', '/v2/auth/session', body);
			if (e.message) {
				onPopup('failed', e.message);
				throw new Error(e.message);
			}
			await onSignMessage(e, type, operation, params);
			return;
		} else if (type === 'sharedObjectAccess') {
			body = {
				"contexts": [{
					"containerID": params.containerId,
					"verbs": ['OBJECT_GET', 'OBJECT_RANGE', 'OBJECT_HEAD'],
				}],
				"issuer": walletData.account.address,
				"targets": [gatewayInfo.address],
			}
			api('POST', '/v2/auth/session', body).then((e) => {
				if (e.message) {
					onPopup('failed', e.message);
				} else {
					onSignMessage(e, type, operation, params).catch(() => {});
				}
			});
			return;
		} else if (type === 'object' && params.address) {
			body = {
				"issuer": walletData.account.address,
				"owner": params.address,
				"lifetime": formatDateToHours(objectLinkLifetime),
				"records": [{
					"operation": 'GET',
					"action": "ALLOW",
					"filters": [{
						"headerType": "OBJECT",
						"key": "$Object:objectID",
						"matchType": "STRING_EQUAL",
						"value": params.objectId,
					}],
					"targets": [{
						"accounts": [params.address],
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
						"accounts": [params.address],
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
						"accounts": [params.address],
					}]
				}, ...presets.forbid.eACLParams]
			}
		} else if (type === 'object' && params.objectId) {
			body = {
				"issuer": walletData.account.address,
				"lifetime": formatDateToHours(objectLinkLifetime),
				"records": [{
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
			}
		} else if (type === 'object') {
			body = {
				"issuer": walletData.account.address,
				"lifetime": 2,
				"records": [{
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
			}
		}

		api('POST', '/v2/auth/bearer', body).then((e) => {
			if (e.message) {
				onPopup('failed', e.message);
			} else {
				onSignMessage(e, type, operation, params);
			}
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

		if (neolineN3) {
			response = await neolineN3.signMessage({ message: msg.token }).catch((err) => handleError(err));
		} else if (dapi) {
			response = await dapi.signMessage(msg.token).catch((err) => handleError(err));
			if (response) {
				response = { publicKey: response.pubkey, data: response.signature, salt: '' };
			}
		} else {
			response = await wcSdk.signMessage({ message: msg.token, version: 1 }).catch((err) => handleError(err));
		}

		if (type === 'object') {
			api('POST', '/v2/auth/bearer/complete', {
				"key": response.publicKey,
				"scheme": "WALLETCONNECT",
				"token": msg.token,
				"signature": response.data + response.salt,
			}).then((e) => {
				if (params.objectId || params.address) {
					onModal('shareObjectLink', { ...params, token: e.token })
				} else {
					onUpdateWalletData(response, params, operation, type, msg, e.token);
				}
			});
		} else if (!response.error) {
			const e = await api('POST', '/v2/auth/session/complete', {
				"key": response.publicKey,
				"lock": msg.lock,
				"scheme": "WALLETCONNECT",
				"token": msg.token,
				"signature": hexToBytesToBase64(response.data + response.salt),
			});
			if (e.message) {
				onPopup('failed', e.message);
				throw new Error(e.message);
			}
			onUpdateWalletData(response, params, operation, type, msg, e.token);
		} else {
			throw new Error('Signing aborted');
		}
	};

	const onCreateContainer = () => {
		if (containerForm.eACLParams.every((eACLItem) => eACLItem.operation !== '' && eACLItem.action !== '' && eACLItem.targets[0].role !== '' && eACLItem.filters.every((filterItem) => filterItem.headerType !== '' && filterItem.matchType !== '' && filterItem.key !== '' && filterItem.value !== ''))) {
			if (attributes.every((attribute) => attribute.key.length > 0 && attribute.value.length > 0)) {
				if (containerForm.containerName.length > 0 && containerForm.placementPolicy.length > 0 && containerForm.basicAcl.length > 0) {
					if (containerForm.containerName.length >= 3) {
						setError({ active: false, type: [], text: '' });
						setLoadingForm(true);
						api('POST', '/v1/containers?walletConnect=true&name-scope-global=true', {
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
			const selectedFileName = file[0].name;
			setObjectForm({
				name: selectedFileName,
				file: e.target.files[0],
				loading: false,
			});
			setAttributes((prev) => ([
				...prev.filter((attribute) => attribute.key !== 'FileName' && attribute.key !== 'FilePath'),
				{ key: 'FileName', value: selectedFileName },
				{ key: 'FilePath', value: selectedFileName },
			]));
		} else {
			document.getElementById('upload').value = '';
			setObjectForm({
				name: '',
				file: '',
				loading: false,
			});
			setAttributes((prev) => prev.filter((attribute) => attribute.key !== 'FileName' && attribute.key !== 'FilePath'));
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
					'Content-Type': objectForm.file.type || 'application/octet-stream',
					"Authorization": `Bearer ${walletData.tokens.object.bearer}`,
					'X-Attributes-Base64': attributesToBase64(attributesHeaders),
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
					setLoadingForm(false);
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

	const onDomainRegister = async () => {
		if (isLoadingForm) {
			return;
		}
		const normalizedDomainName = domainForm.name.trim().toLowerCase();
		if (normalizedDomainName.length === 0) {
			onPopup('failed', 'Insert domain name');
			return;
		}
		if (!walletData?.account?.address) {
			onPopup('failed', 'Wallet is not connected');
			return;
		}
		if (!NeoFSContract?.nnsHash) {
			onPopup('failed', 'NNS contract is not initialized yet');
			return;
		}

		const isContractNotFound = (msg) => typeof msg === 'string' && /called contract\s+\w+\s+not found/i.test(msg);

		setLoadingForm(true);
		try {
			const availability = await invokeFunction(
				NeoFSContract.sidechain,
				[
					NeoFSContract.nnsHash,
					"isAvailable",
					[{ type: "String", value: normalizedDomainName }],
				],
			);
			if (availability?.exception) {
				onPopup('failed', availability.exception);
				return;
			}
			if (availability?.message) {
				onPopup('failed', availability.message);
				return;
			}
			const isDomainAvailable = String(availability?.stack?.[0]?.value).toLowerCase() === 'true';
			if (!isDomainAvailable) {
				onPopup('failed', `Domain "${normalizedDomainName}" is not available`);
				return;
			}

			const soaFields = [
				['refresh', domainForm.refresh],
				['retry', domainForm.retry],
				['expire', domainForm.expire],
				['ttl', domainForm.ttl],
			];
			for (const [label, value] of soaFields) {
				const trimmed = String(value).trim();
				if (!/^\d+$/.test(trimmed) || Number(trimmed) <= 0) {
					onPopup('failed', `SOA "${label}" must be a positive number`);
					return;
				}
			}

			const accountScriptHash = Neon.create.account(walletData.account.address).scriptHash;
			const invocation = {
				scriptHash: NeoFSContract.nnsHash,
				operation: "register",
				args: [
					{ type: "String", value: normalizedDomainName },
					{ type: "Hash160", value: accountScriptHash },
					{ type: "String", value: domainForm.email.trim() },
					{ type: "Integer", value: String(domainForm.refresh).trim() },
					{ type: "Integer", value: String(domainForm.retry).trim() },
					{ type: "Integer", value: String(domainForm.expire).trim() },
					{ type: "Integer", value: String(domainForm.ttl).trim() },
				],
			};
			const baseSigner = {
				scopes: 'CalledByEntry',
				account: accountScriptHash,
			};

			const handleRegisterError = (err) => {
				if (isContractNotFound(err?.message) || isContractNotFound(err?.data?.message)) {
					onModal('fsChainSwitch');
					return;
				}
				handleError(err);
			};

			onModal('approveRequest');
			const response = await wcSdk.signClient.request({
				topic: wcSdk.session.topic,
				chainId: 'neo3:private',
				request: {
					method: 'invokeFunction',
					params: { invocations: [invocation], signers: [baseSigner] },
				},
			}).catch(handleRegisterError);

			if (response?.exception) {
				if (isContractNotFound(response.exception)) {
					onModal('fsChainSwitch');
					return;
				}
				handleError(new Error(response.exception));
				return;
			}
			if (response && !response.error && !response.message) {
				setDomainForm({ name: '', email: '', refresh: '3600', retry: '600', expire: '86400', ttl: '3600' });
				setTimeout(() => setDomainsRefreshTick((prev) => prev + 1), 4000);
				onModal('success', response.txid ? response.txid : response);
			}
		} catch (error) {
			handleError(error);
		} finally {
			setLoadingForm(false);
		}
	};

	const onConnectWallet = async (type) => {
		try {
			if (type === 'neoline') {
				const neolineN3 = new window.NEOLineN3.Init();
				setNeolineN3(neolineN3);
				neolineN3.getPublicKey().then((account) => {
					neolineN3.getNetworks().then((networks) => {
						onHandleConnectedWallet({
							name: 'NeoLine',
							type: 'neo3',
							net: networks.defaultNetwork.toLowerCase(),
							account: account,
							tokens: {
								container: {},
								object: null,
							}
						});
					}).catch((err) => handleError(err));
				}).catch((err) => handleError(err));
			} else if (type === 'onegate') {
				const accounts = await dapi.getAccounts().catch((err) => handleError(err));
				const account = accounts && accounts[0];

				if (account) {
					onHandleConnectedWallet({
						name: dapi.name,
						type: 'neo3',
						net: NETWORK_MAGIC[dapi.network] || activeNet.toLowerCase(),
						account: { address: account.address },
						tokens: {
							container: {},
							object: null,
						}
					});
				}
			} else {
				if (!wcSdk?.signClient) {
					onModal('failed', 'WalletConnect is not ready yet, please try again in a moment');
					return;
				}
				const methods = ['invokeFunction', 'testInvoke', 'signMessage', 'verifyMessage'];
				const primaryChain = `neo3:${activeNet.toLowerCase()}`;
				const connectParams = {
					requiredNamespaces: {
						neo3: { chains: [primaryChain], methods, events: [] },
					},
				};
				if (primaryChain !== 'neo3:private') {
					connectParams.optionalNamespaces = {
						neo3: { chains: ['neo3:private'], methods, events: [] },
					};
				}
				const { uri, approval } = await wcSdk.signClient.connect(connectParams);
				onModal('connectWallet', uri);
				const session = await approval();
				wcSdk.session = session;

				const neo3ns = session.namespaces?.neo3;
				const chainsInSession = neo3ns?.chains || neo3ns?.accounts?.map((a) => a.split(':').slice(0, 2).join(':')) || [];
				if (!chainsInSession.includes('neo3:private') && primaryChain !== 'neo3:private') {
					try {
						const address = neo3ns.accounts[0].split(':')[2];
						const updatedNs = {
							neo3: {
								accounts: Array.from(new Set([...neo3ns.accounts, `neo3:private:${address}`])),
								chains: Array.from(new Set([...(neo3ns.chains || []), primaryChain, 'neo3:private'])),
								methods: neo3ns.methods,
								events: neo3ns.events,
							},
						};
						const { acknowledged } = await wcSdk.signClient.update({
							topic: session.topic,
							namespaces: updatedNs,
						});
						await acknowledged();
						wcSdk.session = wcSdk.signClient.session.get(session.topic);
					} catch (e) {
						console.warn('Failed to extend session with neo3:private', e);
					}
				}

				const liveSession = wcSdk.session;
				const accountStr = liveSession?.namespaces?.neo3?.accounts?.[0];
				if (accountStr) {
					const [, net, address] = accountStr.split(':');
					onHandleConnectedWallet({
						name: liveSession.peer.metadata.name,
						type: 'neo3',
						net,
						account: {
							address,
							publicKey: liveSession.peer.publicKey,
						},
						tokens: {
							container: {},
							object: null,
						},
					});
				}
			}
		} catch (error) {
			onModal('failed', type === 'onegate' ? 'OneGate connection works only if you open the page from OneGate explorer' : 'Failed to connect to the wallet, please try again');
		}
	}

	const onDisconnectWallet = async () => {
		try {
			if (!dapi && wcSdk?.isConnected()) {
				await wcSdk.disconnect();
			}
		} catch (e) {
			console.warn('Wallet disconnect threw', e);
		}
		onPopup('success', 'Wallet disconnected');
		setWalletData(null);
		document.location.href = "/";
	};

	return (
		<>
			{popups.length > 0 && (
				<div className="popup">
					{popups.map((popupItem) => (
						<div
							key={popupItem.id}
							className={popupItem.current === 'success' ? "popup_content popup_content_success" : "popup_content popup_content_failed"}
						>
							<div className="popup_badge">
								{popupItem.current === 'success' ? (
									<img
										src="/img/icons/success.svg"
										width={16}
										height={16}
										className="popup_badge_icon"
										alt="success"
									/>
								) : '!'}
							</div>
							<Heading size={7} className="popup_message">{popupItem.text}</Heading>
						</div>
					))}
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
						{modal.text && modal.text.indexOf('0x') === -1 && (
							<Heading align="center" size={6} weight="normal">{modal.text}</Heading>
						)}
					</div>
				</div>
			)}
			{modal.current === 'fsChainSwitch' && (
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
								alt="close"
							/>
						</div>
						<Heading align="center" size={5} weight="bold">Switch network to FS-Chain</Heading>
						<Heading align="center" size={6} weight="normal">
							Domain operations run on the private FS-Chain network. Add and select it in your wallet:
						</Heading>
						<ol style={{ margin: '15px 0 25px', paddingLeft: 22, lineHeight: 1.7 }}>
							<li>Open <span style={{ fontWeight: 600 }}>Network Configuration</span> in your wallet settings.</li>
							<li>Create a new profile.</li>
							<li>
								In <span style={{ fontWeight: 600 }}>Current network</span> choose <span style={{ fontWeight: 600 }}>Add custom network</span>, enter the FS-Chain parameters from{' '}
								<a href="https://status.fs.neo.org" target="_blank" rel="noopener noreferrer">status.fs.neo.org</a>{' '}
								(the <span style={{ fontWeight: 600 }}>Side chain RPC nodes</span> section), then select it.
							</li>
						</ol>
						<Button
							renderAs="button"
							color="primary"
							size="small"
							onClick={onModal}
							style={{ display: 'block', margin: '0 auto' }}
						>
							Got it
						</Button>
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
			{modal.current === 'authMethods' && (
				<div className="modal">
					<div
						className="modal_close_panel"
						onClick={onModal}
					/>
					<div className="modal_content" style={{ maxWidth: 560 }}>
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
						<Heading align="center" size={5} weight="bold">Connect your wallet</Heading>
						<Heading align="center" size={6} weight="normal">Choose the authorization method</Heading>
						<WalletAuthMethods
							isNeoLineSupport={isNeoLineSupport}
							isNeonReady={isNeonReady}
							isOneGateSupport={Boolean(dapi)}
							onSelectWallet={(type) => {
								onModal();
								onConnectWallet(type);
							}}
							onInstallWallet={() => onModal('installWallet')}
						/>
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
						<Heading align="center" size={6} style={{ margin: '0 auto 1rem', maxWidth: 500, color: '#666', fontWeight: 'normal' }}>
							Sign one master token covering all operations, or expand to choose which permissions to grant.
						</Heading>
						{walletData && walletData.tokens.container.CONTAINER_PUT && walletData.tokens.container.CONTAINER_DELETE && walletData.tokens.container.CONTAINER_SET_EACL && walletData.tokens.object ? (
							<>
								<div className="token_sign_panel">
									<div className="token_sign_panel_row">
										<Heading size={6} style={{ margin: '0 10px 0 0' }}>All permissions signed</Heading>
										<img
											src="/img/icons/success.svg"
											height={25}
											width={25}
											alt="success"
										/>
									</div>
								</div>
								<Button
									renderAs="button"
									color="primary"
									onClick={onModal}
									style={{ margin: '20px auto 0', display: 'flex' }}
								>
									Start
								</Button>
							</>
						) : (
							<TokenSignPanel
								walletData={walletData}
								onAuth={onAuth}
								title="Sign master token"
								params={modal.params || {}}
							/>
						)}
					</div>
				</div>
			)}
			{modal.current === 'registerDomain' && (
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
						<Heading align="center" size={5} weight="bold">Register domain</Heading>
						<Heading className="input_caption">See the <a href="https://github.com/nspcc-dev/neofs-node/blob/master/docs/verified-node-domains.md" target="_blank" rel="noopener noreferrer">documentation</a> on verified domains for NeoFS storage nodes.</Heading>
						<Form.Field>
							<Form.Label>Domain name</Form.Label>
							<Form.Control>
								<Form.Input
									renderAs="input"
									type="text"
									value={domainForm.name}
									className={isError.active && isError.type.indexOf('domainName') !== -1 ? 'is-error' : ""}
									onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })}
									disabled={isLoadingForm}
								/>
							</Form.Control>
							<Form.Help>
								Use lowercase letters, digits and hyphens only. Each part must be 1–62 characters and must not start or end with a hyphen. Example: my-node.neofs
							</Form.Help>
						</Form.Field>
						<Form.Field>
							<Form.Label>Email</Form.Label>
							<Form.Control>
								<Form.Input
									renderAs="input"
									type="text"
									placeholder="Wallet address or email"
									value={domainForm.email}
									style={{ marginBottom: '0.5rem' }}
									onChange={(e) => setDomainForm({ ...domainForm, email: e.target.value })}
									disabled={isLoadingForm}
								/>
							</Form.Control>
						</Form.Field>
						<Heading
							size={6}
							weight="semibold"
							style={{
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
							onClick={() => setDomainAdvancedOpen(!isDomainAdvancedOpen)}
						>
							Advanced
							<img
								src="/img/icons/chevron_down.svg"
								width={22}
								height={22}
								style={isDomainAdvancedOpen ? { transform: 'rotateZ(180deg)' } : {}}
								alt="toggle advanced"
							/>
						</Heading>
						{isDomainAdvancedOpen && (
							<>
								<Heading className="input_caption">DNS SOA record timers, in seconds. Defaults are fine for most domains.</Heading>
								<Form.Field>
									<Form.Label>Refresh</Form.Label>
									<Form.Control>
										<Form.Input
											renderAs="input"
											type="number"
											value={domainForm.refresh}
											onChange={(e) => setDomainForm({ ...domainForm, refresh: e.target.value })}
											disabled={isLoadingForm}
										/>
									</Form.Control>
								</Form.Field>
								<Form.Field>
									<Form.Label>Retry</Form.Label>
									<Form.Control>
										<Form.Input
											renderAs="input"
											type="number"
											value={domainForm.retry}
											onChange={(e) => setDomainForm({ ...domainForm, retry: e.target.value })}
											disabled={isLoadingForm}
										/>
									</Form.Control>
								</Form.Field>
								<Form.Field>
									<Form.Label>Expire</Form.Label>
									<Form.Control>
										<Form.Input
											renderAs="input"
											type="number"
											value={domainForm.expire}
											onChange={(e) => setDomainForm({ ...domainForm, expire: e.target.value })}
											disabled={isLoadingForm}
										/>
									</Form.Control>
								</Form.Field>
								<Form.Field>
									<Form.Label>TTL</Form.Label>
									<Form.Control>
										<Form.Input
											renderAs="input"
											type="number"
											value={domainForm.ttl}
											onChange={(e) => setDomainForm({ ...domainForm, ttl: e.target.value })}
											disabled={isLoadingForm}
										/>
									</Form.Control>
								</Form.Field>
							</>
						)}
						<Button
							renderAs="button"
							color="primary"
							onClick={() => onDomainRegister()}
							size="small"
							disabled={isLoadingForm}
							style={isLoadingForm ? {
								display: 'flex',
								margin: 'auto',
								pointerEvents: 'none',
								opacity: 0.8,
							} : {
								display: 'flex',
								margin: 'auto',
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
							) : 'Register'}
						</Button>
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
									<Heading className="input_caption">NeoFS Panel is incompatible with basic ACLs that disable Bearer tokens or use Final bit. Therefore, basic ACL can't be changed here, but you can set any EACL rules you need. If you need a container with some different basic ACL, please use the <a href="https://github.com/nspcc-dev/neofs-node" target="_blank" rel="noopener noreferrer">CLI</a>.</Heading>
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
								<TokenSignPanel
									walletData={walletData}
									onAuth={onAuth}
									title="Sign token to create container"
									requiredVerbs={containerForm.eACLParams.length > 0
										? ['CONTAINER_PUT', 'CONTAINER_SET_EACL']
										: ['CONTAINER_PUT']}
									style={{ margin: '25px 0 10px', maxWidth: 'unset' }}
								/>
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
							<TokenSignPanel
								walletData={walletData}
								onAuth={onAuth}
								title="Sign token to delete container"
								requiredVerbs={['CONTAINER_DELETE']}
							/>
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
						onClick={() => {
							setShareObjectForm({ address: '', type: '' });
							onModal();
						}}
					/>
					<div className="modal_content" style={{ maxWidth: 400 }}>
						<div
							className="modal_close"
							onClick={() => {
								setShareObjectForm({ address: '', type: '' });
								onModal();
							}}
						>
							<img
								src="/img/icons/close.svg"
								height={30}
								width={30}
								alt="loader"
							/>
						</div>
						{shareObjectForm.type === '' ? (
							<>
								<Heading align="center" size={5} weight="bold">How do you want to share this object?</Heading>
								<Form.Control>
									<Form.Radio
										renderAs="input"
										value="everyone"
										name="radio-everyone"
										checked={shareObjectForm.type === 'everyone'}
										onChange={() => setShareObjectForm({ ...shareObjectForm, type: 'everyone' })}
										style={{ display: 'block', margin: '1rem' }}
									>Everyone</Form.Radio>
									<Form.Radio
										renderAs="input"
										value="address"
										name="radio-address"
										checked={shareObjectForm.type === 'address'}
										onChange={() => setShareObjectForm({ ...shareObjectForm, type: 'address' })}
										style={{ display: 'block', margin: '1rem' }}
									>Selected address</Form.Radio>
								</Form.Control>
							</>
						) : (
							<>
								<Heading align="center" size={5} weight="bold">Sharing object</Heading>
								<Heading align="center" size={6} style={{ margin: '1.5rem auto', width: '350px' }}>
									{`You can share a link to this object, it will be available to ${shareObjectForm.type === 'address' ? 'selected address' : 'everyone'} without authorization until${modal.text.type === 'private' ? ':' : ' EACL change'}${!modal.text.token && modal.text.type === 'private' ? '' : ` ${new Date(objectLinkLifetime).toLocaleDateString()}`}`}
								</Heading>
								{!modal.text.token && modal.text.type === 'private' ? (
									<>
										{shareObjectForm.type === 'address' && (
											<Form.Control style={{ margin: '1rem 0' }}>
												<Form.Input
													renderAs="input"
													placeholder="Enter account address"
													value={shareObjectForm.address}
													onChange={(e) => setShareObjectForm({ ...shareObjectForm, address: e.target.value })}
												/>
											</Form.Control>
										)}
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
												disabled={shareObjectForm.type === 'address' && shareObjectForm.address.trim().length === 0}
												onClick={() => onAuth('object', null, { ...modal.text, address: shareObjectForm.type === 'address' ? shareObjectForm.address : null })}
											>
												Sign
											</Button>
										</div>
									</>
								) : (
									<>
										<a
											href={`${document.location.origin}/getobject?cid=${modal.text.containerId}&oid=${modal.text.objectId}${modal.text.token ? `&token=${modal.text.token}${shareObjectForm.type === 'address' ? `&auth=true` : ''}` : ''}`}
											className="modal_highlighted_copy"
											target="_blank"
											rel="noopener noreferrer"
										>
											<span>
												{`${document.location.origin}/getobject?cid=${modal.text.containerId}&oid=${modal.text.objectId}${modal.text.token ? `&token=${modal.text.token}${shareObjectForm.type === 'address' ? `&auth=true` : ''}` : ''}`}
											</span>
										</a>
										<div
											className="copy_text"
											onClick={() => {
												copy(`${document.location.origin}/getobject?cid=${modal.text.containerId}&oid=${modal.text.objectId}${modal.text.token ? `&token=${modal.text.token}${shareObjectForm.type === 'address' ? `&auth=true` : ''}` : ''}`);
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
						isNeonReady={isNeonReady}
						onConnectWallet={onConnectWallet}
					/>}
				/>
				<Route
					path="/getobject"
					element={<Getobject
						walletData={walletData}
						onModal={onModal}
						onAuth={onAuth}
						isGatewayReady={!!gatewayInfo?.address}
					/>}
				/>
				<Route
					path="/profile"
					element={<Profile
						params={params}
						networkInfo={networkInfo}
						NeoFSContract={NeoFSContract}
						activeNet={activeNet}
						domainsRefreshTick={domainsRefreshTick}
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
						openDomainRegister={openDomainRegister}
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
