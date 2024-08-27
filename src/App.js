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
import { CopyToClipboard } from 'react-copy-to-clipboard';
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
import 'bulma/css/bulma.min.css';
import './App.css';

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

export const App = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const wcSdk = useWalletConnect();
	const dapi = window.OneGate ? new BaseDapi(window.OneGate) : null;
	let [neolineN3, setNeolineN3] = useState(null);
	const [activeNet] = useState(process.env.REACT_APP_NETWORK ? capitalizeFirstLetter(process.env.REACT_APP_NETWORK) : 'Mainnet');
	const [NeoFSContract] = useState({
		gasToken: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
		account: process.env.REACT_APP_NEOFS_ACCOUNT ? process.env.REACT_APP_NEOFS_ACCOUNT : 'NNxVrKjLsRkWsmGgmuNXLcMswtxTGaNQLk',
		scriptHash: Neon.create.account(process.env.REACT_APP_NEOFS_ACCOUNT).scriptHash,
	});

	const [params] = useState({
		rest_gw: process.env.REACT_APP_RESTGW ? process.env.REACT_APP_RESTGW : 'https://rest.t5.fs.neo.org/v1',
	});

	const [networkInfo, setNetworkInfo] = useState(null);
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

			api('GET', '/network-info').then((e) => {
				if (!e.message) {
					setNetworkInfo(e);
				}
			});

			if (location.pathname.indexOf('/profile') === -1 && location.pathname.indexOf('/getobject') === -1) {
				navigate('/profile');
			}
		} else if (location.pathname !== '/' && location.pathname.indexOf('/getobject') === -1) {
			document.location.href = "/";
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
		if (type === 'object') {
			walletDataTemp.tokens[type] = {
				...params,
				token: msg,
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
			body = [{
				"container": {
					"verb": operation,
				}
			}]
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

		api('POST', '/auth', body, {
			"X-Bearer-Owner-Id": walletData.account.address,
			"X-Bearer-Lifetime": params.objectId ? 24 : 2,
			"X-Bearer-For-All-Users": true,
		}).then((e) => {
			onSignMessage(e[0].token, type, operation, params);
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
			response = await neo3Dapi.signMessage({ message: msg }).catch((err) => handleError(err));
		} else if (neolineN3) {
			response = await neolineN3.signMessage({ message: msg }).catch((err) => handleError(err));
		} else if (dapi) {
			response = await dapi.signMessage({ message: msg }).catch((err) => handleError(err));
			response.data = response.signature;
		} else {
			response = await wcSdk.signMessage({ message: msg, version: 1 }).catch((err) => handleError(err));
		}

		if (type === 'object') {
			api('GET', '/auth/bearer?walletConnect=true', {}, {
				"Authorization": `Bearer ${msg}`,
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
							"Authorization": `Bearer ${walletData.tokens.container.PUT.token}`,
							"X-Bearer-Owner-Id": walletData.account.address,
							"X-Bearer-Signature": walletData.tokens.container.PUT.signature,
							"X-Bearer-Signature-Key": walletData.publicKey,
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
										"Authorization": `Bearer ${walletData.tokens.container.SETEACL.token}`,
										"X-Bearer-Owner-Id": walletData.account.address,
										"X-Bearer-Signature": walletData.tokens.container.SETEACL.signature,
										"X-Bearer-Signature-Key": walletData.publicKey,
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
		api('DELETE', `/containers/${containerName}?walletConnect=true`, {}, {
			"Authorization": `Bearer ${walletData.tokens.container.DELETE.token}`,
			"X-Bearer-Owner-Id": walletData.account.address,
			"X-Bearer-Signature": walletData.tokens.container.DELETE.signature,
			"X-Bearer-Signature-Key": walletData.publicKey,
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
				api('POST', `/objects/${containerId}`, objectForm.file, {
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
		api('DELETE', `/objects/${containerId}/${objectId}`, {}, {
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
						<CopyToClipboard
							text={modal.text}
							className="modal_highlighted_copy"
							style={{ marginBottom: 0 }}
							onCopy={() => {
								setCopy(true);
								setTimeout(() => {
									setCopy(false);
								}, 700);
							}}
						>
							<div>
								{modal.text}
								{isCopied && (
									<div className="tooltip">Copied!</div>
								)}
							</div>
						</CopyToClipboard>
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
							<Button className="btn_connect_wallet">
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
							<Button className="btn_connect_wallet">
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
							<Button className="btn_connect_wallet">
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
							<Button className="btn_connect_wallet">
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
						{walletData && walletData.tokens.container.PUT && walletData.tokens.container.DELETE && walletData.tokens.container.SETEACL
							&& walletData.tokens.object && (
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
							<Heading className="input_caption">{`Container cost is ${networkInfo ? 7 * (networkInfo.containerFee + networkInfo.namedContainerFee) * 1e-12 : '-'} GAS for mainnet now.`}</Heading>
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
						<Heading align="center" size={6}>{`You can share a link to this object, it will be available ${modal.text.type === 'private' ? 'for 1 day' : 'until EACL change'} to everyone without authorization`}</Heading>
						{!modal.text.token && modal.text.type === 'private' ? (
							<div className="token_status_panel">
								<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to share&nbsp;object</Heading>
								<Button
									color="primary"
									size="small"
									onClick={() => onAuth('object', null, modal.text)}
								>
									Sign
								</Button>
							</div>
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
								<CopyToClipboard
									text={`${document.location.origin}/getobject?cid=${modal.text.containerId}&oid=${modal.text.objectId}${modal.text.token ? `&token=${modal.text.token}` : ''}`}
									className="copy_text"
									onCopy={() => {
										setCopy(true);
										setTimeout(() => {
											setCopy(false);
										}, 700);
									}}
								>
									<Button
										color="primary"
										size="small"
										style={{ margin: 'auto', display: 'flex' }}
									>
										Copy link
										{isCopied && (
											<div className="tooltip">Copied!</div>
										)}
									</Button>
								</CopyToClipboard>
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
									type="number"
									value={depositQuantity}
									onChange={(e) => setDepositQuantity(e.target.value)}
								/>
							</Form.Control>
						</Form.Field>
						<Button
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
					{process.env.REACT_APP_VERSION}
				</Heading>
			</Footer>
		</>
	);
}
