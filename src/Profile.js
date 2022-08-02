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
} from 'react-bulma-components';
import api from './api';

const Profile = ({
		walletData,
		setWalletData,
		onPopup,
		walletConnectCtx,
		isLoadContainers,
		setLoadContainers,
	}) => {
	const [CDNContract] = useState({
		scriptHash: process.env.REACT_APP_SCRIPT_HASH,
		account: process.env.REACT_APP_ACCOUNT,
		gasToken: process.env.REACT_APP_GAS_TOKEN,
	});
	const [containers, setContainers] = useState([]);
	const [isLoadingContainers, setIsLoadingContainers] = useState(false);

	const [isLoadingBalance, setIsLoadingBalance] = useState(false);
	const [neoFSBalance, setNeoFSBalance] = useState(0);
	const [isLoadingNeoFSBalance, setIsLoadingNeoFSBalance] = useState(false);
	const [depositQuantity, setDepositQuantity] = useState(0);
	const [withdrawQuantity, setWithdrawQuantity] = useState(0);

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
		if (walletData && !walletData.balance && walletData.account) {
			onBalance();
			onNeoFSBalance();
			onGetContainers();
		}
	}, [walletData]); // eslint-disable-line react-hooks/exhaustive-deps

	const onBalance = async () => {
		setIsLoadingBalance(true);
		const targetAddress = walletConnectCtx.getAccountAddress(0);
		const invocations = [{
			scriptHash: CDNContract.scriptHash,
			operation: 'balanceOf',
			args: [
				{ type: 'Address', value: targetAddress },
			]
		}];

		const signers = [{
			scopes: 1, // WitnessScope.CalledByEntry
		}];

		const response = await walletConnectCtx.testInvoke({ invocations, signers });
		setTimeout(() => {
			setIsLoadingBalance(false);
		}, 500);
		if (!response.result.error && response.result.stack.length > 0) {
			setWalletData({
				...walletData,
				balance: response.result.stack[0].value,
			});
		} else if (response.result.exception) {
			onPopup('failed', response.result.exception);
		}
	};

	const onNeoFSBalance = async () => {
		setIsLoadingNeoFSBalance(true);
		api('GET', `/accounting/balance/${walletData.account.replace('neo3:testnet:', '')}`).then((e) => {
			setNeoFSBalance(e.value);
			setTimeout(() => {
				setIsLoadingNeoFSBalance(false);
			}, 500);
		});
	};

	const onGetContainers = () => {
		setIsLoadingContainers(true);
		api('GET', `/containers?ownerId=${walletData.account.replace('neo3:testnet:', '')}`).then((e) => {
			const containersTemp = [ ...e.containers ];
			containersTemp.map((container) => container.isActive = false);
			setContainers(e.containers);
			onPopup();
			setTimeout(() => {
				setIsLoadingContainers(false);
			}, 1000);
		});
	};

	const onGetContainerData = (containerId, index) => {
		api('POST', `/objects/${containerId}/search?walletConnect=true`, {
			"filters": [],
		}, {
			"Content-Type": "application/json",
			"X-Bearer-Owner-Id": walletData.account.replace('neo3:testnet:', ''),
			'X-Bearer-Signature': walletData.tokens.object.GET.signature,
			'X-Bearer-Signature-Key': walletData.publicKey,
			'Authorization': `Bearer ${walletData.tokens.object.GET.token}`
		}).then((e) => {
			const containersTemp = [ ...containers ];
			containersTemp[index] = { ...containersTemp[index], objects: e.objects, isActive: true };
			setContainers(containersTemp);
		});
	};

	const onGetObjectData = (containerId, objectId, containerIndex, objectIndex) => {
		api('GET', `/objects/${containerId}/${objectId}?walletConnect=true`, {}, {
			"Content-Type": "application/json",
			"X-Bearer-Owner-Id": walletData.account.replace('neo3:testnet:', ''),
			'X-Bearer-Signature': walletData.tokens.object.GET.signature,
			'X-Bearer-Signature-Key': walletData.publicKey,
			'Authorization': `Bearer ${walletData.tokens.object.GET.token}`
		}).then((e) => {
			const containersTemp = [ ...containers ];
			containersTemp[containerIndex].objects[objectIndex] = {
				...e,
				...containersTemp[containerIndex].objects[objectIndex],
				isActive: true,
			};
			setContainers(containersTemp);
		});
	};

	const onSetEacl = (containerId, index) => {
		if (walletData.tokens.container.SETEACL) {
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
				"X-Bearer-Owner-Id": walletData.account.replace('neo3:testnet:', ''),
				'X-Bearer-Signature': walletData.tokens.container.SETEACL.signature,
				'X-Bearer-Signature-Key': walletData.publicKey,
				'Authorization': `Bearer ${walletData.tokens.container.SETEACL.token}`
			}).then(() => {
				onGetContainers();
			});
		} else {
			onPopup('signTokens', 'container.SETEACL');
		}
	};

  const onCreateObject = (e, containerId, index) => {
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
					"attributes": [
						{
							"key": "User-Attribute",
							"value": "some-value"
						}
					]
				}, {
					"Content-Type": "application/json",
					"X-Bearer-Owner-Id": walletData.account.replace('neo3:testnet:', ''),
					'X-Bearer-Signature': walletData.tokens.object.PUT.signature,
					'X-Bearer-Signature-Key': walletData.publicKey,
					'Authorization': `Bearer ${walletData.tokens.object.PUT.token}`
				}).then(() => {
					onGetContainers();
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

  const onDeposit = async () => {
		if (depositQuantity >= 0.00000001) {
			onPopup('approveRequest');
			const senderAddress = walletConnectCtx.getAccountAddress(0);
			const invocations = [{
				scriptHash: CDNContract.gasToken,
				operation: 'transfer',
				args: [
					{ type: 'Address', value: senderAddress },
					{ type: 'Address', value: CDNContract.account },
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
				scriptHash: CDNContract.scriptHash,
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
		<Container style={{ minHeight: 'calc(100vh - 212px)' }}>
			{walletData ? (
				<Section>
					<Box style={{ fontSize: 14, wordBreak: 'break-all', display: 'flex' }}>
						{`«${walletData.data.metadata.name}» connected`}
					</Box>
					<Box
						id="account"
						style={{ marginTop: '1.5rem' }}
					>
						<Heading style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span>Account</span>
							<img
								src="./img/logout.svg"
								width={25}
								height={25}
								alt="logout"
								style={{ marginLeft: 5, cursor: 'pointer' }}
								onClick={onDisconnectWallet}
							/>
						</Heading>
						<Tile kind="ancestor">
							<Tile kind="parent">
								<Tile
									kind="child"
									renderAs={Notification}
									color="grey"
								>
									<Heading size={6} weight="bold" style={{ display: 'flex' }}>
										{`GAS Balance: `}
										<span>{walletData.balance ? `${(walletData.balance * 0.00000001).toFixed(8)} GAS` : '-'}</span>
										<img
											src="./img/sync.svg"
											width={20}
											height={20}
											alt="logout"
											style={isLoadingBalance ? {
												marginLeft: 5,
												cursor: 'pointer',
												animation: 'spin 1.5s infinite linear',
											} : {
												marginLeft: 5,
												cursor: 'pointer',
											}}
											onClick={onBalance}
										/>
									</Heading>
									<Heading size={6} weight="bold" style={{ display: 'flex' }}>
										{`NeoFS Balance: `}
										<span>{neoFSBalance ? `${(neoFSBalance * 0.00000001).toFixed(8)} GAS` : '-'}</span>
										<img
											src="./img/sync.svg"
											width={20}
											height={20}
											alt="logout"
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
									<Heading size={6} weight="normal" style={{ overflow: 'scroll' }}>
										{`Address: `}
										<span>{walletData.account}</span>
									</Heading>
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
									<Heading size={5}>Deposit</Heading>
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
									<Heading size={5}>Withdraw</Heading>
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
									alt="logout"
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
								alt="sign_tokens"
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
												if (containerItem.isActive) {
													containersTemp[index].isActive = false;
													setContainers(containersTemp);
												} else if (walletData.tokens.object.GET) {
													containersTemp[index].isActive = true;
													setContainers(containersTemp);
													onGetContainerData(containerItem.containerId, index);
												} else {
													onPopup('signTokens', 'object.GET');
												}
											}}
										>
											{containerItem.attributes.filter((attribute) => attribute.key === 'Name')[0].value}
											{containerItem.isActive && (
												<img
													src="./img/trashbin.svg"
													width={30}
													height={30}
													fill="#f14668"
													alt="sign_tokens"
													style={{ cursor: 'pointer' }}
													onClick={(e) => {
														onPopup('deleteContainer', containerItem.containerId);
														e.stopPropagation();
													}}
												/>
											)}
										</Heading>
										{containerItem.isActive === true && (
											<div className="container_panel">
												{containerItem.ownerId ? (
													<div>
														<Heading size={6} weight="light">
															<span>{`Container id: `}</span>
															{containerItem.containerId}
														</Heading>
														<Heading size={6} weight="light">
															<span>{`Owner id: `}</span>
															{containerItem.ownerId}
														</Heading>
														<Heading size={6} weight="light">
															<span>{`Creation: `}</span>
															{new Date(containerItem.attributes[0].value * 1000).toLocaleDateString()}
														</Heading>
														<Heading size={6} weight="light">
															<span>{`Zone: `}</span>
															{containerItem.attributes[2].value}
														</Heading>
														<Heading size={6} weight="light">
															<span>{`Basic acl: `}</span>
															{`0x${containerItem.basicAcl}`}
														</Heading>
														<Heading size={6} weight="light">
															<span>{`Placement policy: `}</span>
															{containerItem.placementPolicy}
														</Heading>
														<Heading size={6} weight="light">
															<span>{`Version: `}</span>
															{containerItem.version}
														</Heading>
														<Button
															color="primary"
															onClick={() => onSetEacl(containerItem.containerId, index)}
															style={{ margin: '10px 0', display: 'block' }}
														>Set eACL</Button>
														<Heading size={6} weight="semibold">Objects</Heading>
														{containerItem.objects && containerItem.objects.map((objectItem, objectIndex) => (
															<div key={objectItem.address.objectId}>
																<Heading
																	size={6}
																	weight="semibold"
																	className={objectItem.isActive ? 'active' : ''}
																	style={objectItem.isActive ? {
																    alignItems: 'center',
																		cursor: 'pointer',
																		border: '1px solid #363636',
																		display: 'inline-flex',
																		padding: '5px 10px',
																		borderRadius: 4,
																		background: '#363636',
																		color: '#fff',
																	} : {
																    alignItems: 'center',
																		cursor: 'pointer',
																		border: '1px solid #363636',
																		display: 'inline-flex',
																		padding: '5px 10px',
																		borderRadius: 4,
																	}}
																	onClick={() => {
																		const containersTemp = [ ...containers ];
																		if (objectItem.isActive) {
																			containersTemp[index].objects[objectIndex].isActive = false;
																			setContainers(containersTemp);
																		} else {
																			containersTemp[index].objects[objectIndex].isActive = true;
																			setContainers(containersTemp);
																			onGetObjectData(containerItem.containerId, objectItem.address.objectId, index, objectIndex);
																		}
																	}}
																>
																	{objectItem.name}
																	{objectItem.isActive && (
																		<img
																			src="./img/trashbin.svg"
																			width={22}
																			height={22}
																			fill="#f14668"
																			alt="sign_tokens"
																			style={{ marginLeft: 10, cursor: 'pointer' }}
																			onClick={(e) => {
																				onPopup('deleteObject', { containerId: containerItem.containerId, objectId: objectItem.address.objectId });
																				e.stopPropagation();
																			}}
																		/>
																	)}
																</Heading>
																{objectItem.isActive === true && (
																	<div style={{ padding: '5px 10px' }}>
																		{objectItem.ownerId ? (
																			<div>
																				<Heading size={6} weight="light">
																					<span>{`Object id: `}</span>
																					<a
																						href={`${process.env.REACT_APP_NGINX}/get/${containerItem.containerId}/${objectItem.address.objectId}`}
																						target="_blank"
																						rel="noopener noreferrer"
																						style={{ textDecoration: 'underline' }}
																					>{objectItem.address.objectId}</a>
																				</Heading>
																				<Heading size={6} weight="light">
																					<span>{`Owner id: `}</span>
																					{objectItem.ownerId}
																				</Heading>
																				<Heading size={6} weight="light">
																					<span>{`Object size: `}</span>
																					{objectItem.objectSize}
																				</Heading>
																				<Heading size={6} weight="light">
																					<span>{`Payload size: `}</span>
																					{objectItem.payloadSize}
																				</Heading>
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
															</div>
														))}
														<div className="input_block">
															<label htmlFor="upload">Upload object</label>
															<input
																id="upload"
																type="file"
																name="Upload"
																onChange={(e) => onCreateObject(e, containerItem.containerId, index)}
															/>
														</div>
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
							onClick={(e) => onPopup('createContainer')}
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
