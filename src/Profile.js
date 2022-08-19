import React, { useEffect, useState } from 'react';
import {
	Container,
	Section,
	Form,
	Heading,
	Notification,
	Tile,
	Button,
	Box,
	Tag,
	Tabs,
} from 'react-bulma-components';
import TreeView from './Components/TreeView/TreeView';
import api from './api';

function formatForTreeView(objects) {
	const getTreeView = objectsList => (
		objectsList.reduce((root, item) => {
			const parts = item.filePath ? item.filePath.split('/') : [''];
			const lastPart = parts[parts.length - 1];
			if (parts.length === 1 && lastPart === '') {
				let childrenTemp = [];
				if (root.children) {
					childrenTemp = root.children;
				}
				root = { ...root, children: [...childrenTemp, item] };
			}
			parts.filter((n) => n !== '').reduce((acc, part) => {
				let children = [];
				if (part === lastPart) {
					let childrenTemp = [];
					if (acc[part]) {
						childrenTemp = acc[part].children;
					}
					children = [...childrenTemp, item];
				} else if (acc[part]) {
					let childrenTemp = [];
					childrenTemp = acc[part].children;
					children = [...childrenTemp];
				}
				return (acc[part] && (acc[part] = { ...acc[part], children })) || (acc[part] = { children });
			}, root);
			return root;
		}, Object.create(null))
	);

	for (let i = 0; i < objects.length; i++) {
		if (!objects[i].filePath) {
			objects[i].filePath = '';
		}

		const path = objects[i].filePath.split('/');
		if (path[path.length - 1] === '') {
			objects[i].filePath = '';
		} else {
			objects[i].name = path[path.length - 1];
			objects[i].filePath = path.slice(0, path.length - 1).join('/');
		}

		if (!objects[i].name) {
			objects[i].name = objects[i].address.objectId;
		}

		objects[i].fullName = `${objects[i].filePath ? `${objects[i].filePath.trim()}/` : ''}${objects[i].name.trim()}`;
	}

	objects.sort((a, b) => {
		if (a.fullName < b.fullName) {
			return -1;
		}

		if (a.fullName > b.fullName) {
			return 1;
		}

		return 0;
	});
	return getTreeView(objects);
}

function formatForContainerName(attributes, containerId) {
	if (attributes.length > 0) {
		const pos = attributes.map((item) => item.key).indexOf('Name');
		return attributes[pos].value;
	}
	return containerId;
}

const Profile = ({
		walletData,
		onDisconnectWallet,
		onPopup,
		walletConnectCtx,
		isLoadContainers,
		setLoadContainers,
		onAuth,
	}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [NeoFSContract] = useState({
		scriptHash: process.env.REACT_APP_NEOFS_SCRIPT_HASH,
		account: process.env.REACT_APP_NEOFS_ACCOUNT,
		gasToken: process.env.REACT_APP_NEOFS_GAS_TOKEN,
	});
	const [containers, setContainers] = useState([]);
	const [isLoadingContainers, setIsLoadingContainers] = useState(false);

	const [neoFSBalance, setNeoFSBalance] = useState(0);
	const [isLoadingNeoFSBalance, setIsLoadingNeoFSBalance] = useState(false);

	const [depositQuantity, setDepositQuantity] = useState(0);
	const [withdrawQuantity, setWithdrawQuantity] = useState(0);

	const [activeAttributes, setActiveAttributes] = useState('main');

	useEffect(() => {
		if (isLoadContainers) {
			onGetContainers();
			setLoadContainers(false);
		}
	}, [isLoadContainers]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!localStorage['wc@2:client//keychain']) {
			document.location.href = "/";
		}
		if (walletData && walletData.account && !isLoading) {
			onNeoFSBalance();
			onGetContainers();
			setIsLoading(true);
		}
	}, [walletData]); // eslint-disable-line react-hooks/exhaustive-deps

	const onNeoFSBalance = async () => {
		setIsLoadingNeoFSBalance(true);
		api('GET', `/accounting/balance/${walletData.account}`).then((e) => {
			setNeoFSBalance(e.value);
			setTimeout(() => {
				setIsLoadingNeoFSBalance(false);
			}, 500);
		});
	};

	const onGetContainers = () => {
		setIsLoadingContainers(true);
		api('GET', `/containers?ownerId=${walletData.account}`).then((e) => {
			const containersTemp = [ ...e.containers ];
			containersTemp.map((container) => container.isActive = false);
			setContainers(e.containers);
			onPopup();
			setTimeout(() => {
				setIsLoadingContainers(false);
			}, 1000);
		});
	};

	const onGetObjectData = (containerId, index) => {
		api('POST', `/objects/${containerId}/search?walletConnect=true`, {
			"filters": [],
		}, {
			"Content-Type": "application/json",
			"X-Bearer-Owner-Id": walletData.account,
			'X-Bearer-Signature': walletData.tokens.object.GET.signature,
			'X-Bearer-Signature-Key': walletData.publicKey,
			'Authorization': `Bearer ${walletData.tokens.object.GET.token}`
		}).then((e) => {
			const containersTemp = [ ...containers ];
			containersTemp[index] = { ...containersTemp[index], objects: e.objects ? formatForTreeView(e.objects) : [] };
			setContainers(containersTemp);
		});
	};

	const onSetEacl = (containerId) => {
		if (walletData.tokens.container.SETEACL) {
			onPopup('loading');
			api('PUT', `/containers/${containerId}/eacl?walletConnect=true`, {
				"records": [
					{
						"operation": "GET",
						"action": "ALLOW",
						"filters": [],
						"targets": [
							{
								"role": "OTHERS",
								"keys": []
							}
						]
					}
				]
			}, {
				"Content-Type": "application/json",
				"X-Bearer-Owner-Id": walletData.account,
				'X-Bearer-Signature': walletData.tokens.container.SETEACL.signature,
				'X-Bearer-Signature-Key': walletData.publicKey,
				'Authorization': `Bearer ${walletData.tokens.container.SETEACL.token}`
			}).then(() => {
				onGetContainers();
				onPopup(false);
			});
		} else {
			onPopup('signTokens', 'container.SETEACL');
		}
	};

	const onDeposit = async () => {
		if (depositQuantity >= 0.00000001) {
			onPopup('approveRequest');
			const senderAddress = walletConnectCtx.getAccountAddress(0);
			const invocations = [{
				scriptHash: NeoFSContract.gasToken,
				operation: 'transfer',
				args: [
					{ type: 'Address', value: senderAddress },
					{ type: 'Address', value: NeoFSContract.account },
					{ type: 'Integer', value: depositQuantity * 100000000 },
					{ type: 'ByteArray', value: '' },
				]
			}];

			const signers = [{
				scopes: 1, // WitnessScope.CalledByEntry
			}];

			const response = await walletConnectCtx.invokeFunction({ invocations, signers });
			if (!response.result.error) {
				onPopup('success', response.result);
			} else if (response.result.error.message === 'Failed or Rejected Request') {
				onPopup('failed', 'Failed or Rejected Request');
			} else if (response.toString() === 'Error: intrinsic gas too low') {
				onPopup('failed', 'Transaction intrinsic gas too low');
			} else {
				onPopup('failed', 'Something went wrong, try again');
			}
		} else {
			onPopup('failed', 'Incorrect quantity value');
		}
	};

	const onWithdraw = async () => {
		if (withdrawQuantity >= 0.00000001) {
			onPopup('approveRequest');
			const senderAddress = walletConnectCtx.getAccountAddress(0);
			const invocations = [{
				scriptHash: NeoFSContract.scriptHash,
				operation: 'withdraw',
				args: [
					{ type: 'Address', value: senderAddress },
					{ type: 'Integer', value: withdrawQuantity * 100000000 },
				]
			}];

			const signers = [{
				scopes: 1, // WitnessScope.CalledByEntry
			}];

			const response = await walletConnectCtx.invokeFunction({ invocations, signers });
			if (!response.result.error) {
				onPopup('success', response.result);
			} else if (response.result.error.message === 'Failed or Rejected Request') {
				onPopup('failed', 'Failed or Rejected Request');
			} else if (response.toString() === 'Error: intrinsic gas too low') {
				onPopup('failed', 'Transaction intrinsic gas too low');
			} else {
				onPopup('failed', 'Something went wrong, try again');
			}
		} else {
			onPopup('failed', 'Incorrect quantity value');
		}
	};

	return (
		<Container style={{ minHeight: 'calc(100vh - 212px)' }}>
			{walletData ? (
				<Section>
					<Box
						id="account"
						style={{ marginTop: '1.5rem' }}
					>
						<Heading style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span>
								Account
								<Tag style={{ margin: '0 0px 0 15px' }}>{`«${walletData.data.metadata.name}»`}</Tag>
							</span>
							<img
								src="./img/logout.svg"
								width={25}
								height={25}
								alt="logout"
								style={{ marginLeft: 5, cursor: 'pointer' }}
								onClick={onDisconnectWallet}
							/>
						</Heading>
						{walletData.net !== 'testnet' && (
							<Box style={{ fontSize: 14, wordBreak: 'break-all', background: '#f14668', color: '#fff' }}>
								<div>{`You use ${walletData.net === 'private' ? 'private net' : walletData.net}. For a better experience, use testnet.`}</div>
							</Box>
						)}
						<Tile kind="ancestor">
							<Tile kind="parent">
								<Tile
									kind="child"
									renderAs={Notification}
									color="grey"
								>
									<Heading size={6} style={{ marginBottom: 15 }}>
										{`Address: `}
										<span>{walletData.account}</span>
									</Heading>
									<Tile kind="ancestor">
										<Tile kind="parent">
											<Tile
												kind="child"
												renderAs={Notification}
												color="gray"
												style={{
													border: '1px solid #dbdbdc',
													boxShadow: '0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 2%)',
												}}
											>
												<Heading size={6} weight="bold" style={{ display: 'flex' }}>
													<span>{neoFSBalance ? `${(neoFSBalance * 0.00000001).toFixed(8)} GAS` : '-'}</span>
													<img
														src="./img/sync.svg"
														width={20}
														height={20}
														alt="sync"
														style={isLoadingNeoFSBalance ? {
															marginLeft: 5,
															cursor: 'pointer',
															animation: 'spin 1.5s infinite linear',
														} : {
															marginLeft: 5,
															cursor: 'pointer',
														}}
														onClick={onNeoFSBalance}
													/>
												</Heading>
												<Heading size={6} >NeoFS Balance</Heading>
											</Tile>
										</Tile>
									</Tile>
								</Tile>
							</Tile>
						</Tile>
						<Tile kind="ancestor">
							<Tile kind="parent">
								<Tile
									kind="child"
									renderAs={Notification}
									color="grey"
								>
									<Heading size={5}>Deposit NeoFS</Heading>
									<Form.Field>
										<Form.Label size="small">Quantity (GAS)</Form.Label>
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
										onClick={onDeposit}
										style={{ display: 'flex', margin: 'auto' }}
									>
										Make a payment
									</Button>
								</Tile>
							</Tile>
							<Tile kind="parent">
								<Tile
									kind="child"
									renderAs={Notification}
									color="grey"
								>
									<Heading size={5}>Withdraw NeoFS</Heading>
									<Form.Field>
										<Form.Label size="small">Quantity (GAS)</Form.Label>
										<Form.Control>
											<Form.Input
												type="number"
												value={withdrawQuantity}
												onChange={(e) => setWithdrawQuantity(e.target.value)}
											/>
										</Form.Control>
									</Form.Field>
									<Button
										color="primary"
										onClick={onWithdraw}
										style={{ display: 'flex', margin: 'auto' }}
									>
										Receive funds
									</Button>
								</Tile>
							</Tile>
						</Tile>
					</Box>
					<Box>
						<Heading style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span>
								{`Containers`}
								<img
									src="./img/sync.svg"
									width={20}
									height={20}
									alt="sync"
									style={isLoadingContainers ? {
										marginLeft: 5,
										cursor: 'pointer',
										animation: 'spin 1.5s infinite linear',
									} : {
										marginLeft: 5,
										cursor: 'pointer',
									}}
									onClick={onGetContainers}
								/>
							</span>
							<img
								src="./img/settings.svg"
								width={22}
								height={22}
								alt="settings"
								style={{ marginLeft: 5, cursor: 'pointer' }}
								onClick={() => onPopup('signTokens', '')}
							/>
						</Heading>
						{containers.map((containerItem, index) => (
							<Tile
								kind="ancestor"
								key={containerItem.containerId}
							>
								<Tile kind="parent">
									<Tile
										kind="child"
										renderAs={Notification}
										color="gray"
									>
										<Heading
											size={5}
											weight="semibold"
											style={{
												cursor: 'pointer',
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
											}}
											className={containerItem.isActive ? 'active' : ''}
											onClick={() => {
												const containersTemp = [ ...containers ];
												containersTemp[index].isActive = !containerItem.isActive;
												setContainers(containersTemp);
												if (walletData.tokens.object.GET && containersTemp[index].isActive) {
													onGetObjectData(containerItem.containerId, index);
												}
											}}
										>
											{formatForContainerName(containerItem.attributes, containerItem.containerId)}
											{containerItem.isActive && (
												<img
													src="./img/trashbin.svg"
													width={30}
													height={30}
													fill="#f14668"
													alt="delete"
													style={{ cursor: 'pointer' }}
													onClick={(e) => {
														if (walletData.tokens.container.DELETE) {
															onPopup('deleteContainer', { containerId: containerItem.containerId });
														} else {
															onPopup('signTokens', 'container.DELETE')
														}
														e.stopPropagation();
													}}
												/>
											)}
										</Heading>
										{containerItem.isActive === true && (
											<div className="container_panel">
												{containerItem.ownerId ? (
													<div>
														<Section>
															<Heading size={5} weight="bolder">Information</Heading>
															<Heading size={6} weight="light">
																<span>{`Container id: `}</span>
																{containerItem.containerId}
															</Heading>
															<Heading size={6} weight="light">
																<span>{`Owner id: `}</span>
																{containerItem.ownerId}
															</Heading>
															<Heading size={6} weight="light">
																<span>{`Placement policy: `}</span>
																{containerItem.placementPolicy}
															</Heading>
															<Heading size={6} weight="light">
																<span>{`Version: `}</span>
																{containerItem.version}
															</Heading>
															<Heading size={6} weight="light">
																<span>{`Basic acl: `}</span>
																{`0x${containerItem.basicAcl}`}
															</Heading>
															<Button
																color="primary"
																onClick={() => onSetEacl(containerItem.containerId)}
																style={{ margin: '10px 0', display: 'block' }}
															>Set eACL</Button>
														</Section>
														<Section>
															<Heading size={5} weight="bolder">Attributes</Heading>
															<Tabs>
																<Tabs.Tab
																	onClick={() => {
																		setActiveAttributes('main');
																	}}
																	active={activeAttributes === 'main'}
																>
																	Main
																</Tabs.Tab>
																<Tabs.Tab
																	onClick={() => {
																		setActiveAttributes('system');
																	}}
																	active={activeAttributes === 'system'}
																>
																	System
																</Tabs.Tab>
															</Tabs>
															{activeAttributes === 'main' && containerItem.attributes.map((attribute) => ( attribute.key.indexOf('__NEOFS__') === -1 && (
																<Heading size={6} weight="light" style={{ marginLeft: 10 }} key={attribute.key}>
																	<span>{`${attribute.key === 'Timestamp' ? 'Creation' : attribute.key}: `}</span>
																	{attribute.key === 'Timestamp' ? new Date(attribute.value * 1000).toLocaleDateString() : attribute.value}
																</Heading>
															)))}
															{activeAttributes === 'system' && containerItem.attributes.map((attribute) => ( attribute.key.indexOf('__NEOFS__') !== -1 && (
																<Heading size={6} weight="light" style={{ marginLeft: 10 }} key={attribute.key}>
																	<span>{`${attribute.key === 'Timestamp' ? 'Creation' : attribute.key}: `}</span>
																	{attribute.key === 'Timestamp' ? new Date(attribute.value * 1000).toLocaleDateString() : attribute.value}
																</Heading>
															)))}
														</Section>
														<Section>
															<Heading size={5} weight="bolder">Objects</Heading>
															<Box
																style={{
																	marginTop: 15,
																	border: '1px solid #dbdbdc',
																	boxShadow: '0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 2%)',
																}}
															>
																{walletData.tokens.object.GET ? (
																	<>
																		<TreeView
																			walletData={walletData}
																			onPopup={onPopup}
																			containerIndex={index}
																			containerItem={containerItem}
																		/>
																		<Button
																			color="primary"
																			onClick={() => walletData.tokens.object.PUT ? onPopup('createObject', { containerId: containerItem.containerId }) : onPopup('signTokens', 'object.PUT')}
																			style={{ display: 'flex', margin: '20px auto 0' }}
																		>
																			New object
																		</Button>
																	</>
																) : (
																	<div className="token_status_panel">
																		<div>For getting operations</div>
																		<Button
																			color="primary"
																			size="small"
																			onClick={() => onAuth('object', 'GET')}
																		>
																			Sign
																		</Button>
																	</div>
																)}
															</Box>
														</Section>
													</div>
												) : (
													<img
														className="popup_loader"
														src="./img/loader.svg"
														height={30}
														width={30}
														alt="loader"
													/>
												)}
											</div>
										)}
									</Tile>
								</Tile>
							</Tile>
						))}
						<Button
							color="primary"
							onClick={() => walletData.tokens.container.PUT ? onPopup('createContainer') : onPopup('signTokens', 'container.PUT')}
							style={{ display: 'flex', margin: 'auto' }}
						>
							New container
						</Button>
					</Box>
				</Section>
			) : (
				<Section>
					<Box>
						<Heading align="center" size={5}>Loading</Heading>
						<img
							className="popup_loader"
							src="./img/loader.svg"
							height={30}
							width={30}
							alt="loader"
						/>
					</Box>
				</Section>
			)}
		</Container>
	);
};

export default Profile;
