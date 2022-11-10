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
} from 'react-bulma-components';
import ContainerItem from './Components/ContainerItem/ContainerItem';
import api from './api';

const Profile = ({
		walletData,
		setWalletData,
		onDisconnectWallet,
		onModal,
		onPopup,
		wcSdk,
		isLoadContainers,
		setLoadContainers,
		ContentTypeHeader,
		AuthorizationHeader,
		BearerOwnerIdHeader,
		BearerSignatureHeader,
		BearerSignatureKeyHeader,
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

	const [neoBalance, setNeoBalance] = useState(false);
	const [isLoadingNeoBalance, setIsLoadingNeoBalance] = useState(false);

	const [neoFSBalance, setNeoFSBalance] = useState(0);
	const [isLoadingNeoFSBalance, setIsLoadingNeoFSBalance] = useState(false);

	const [isNotAvailableNeoFS, setNotAvailableNeoFS] = useState(false);

	const [depositQuantity, setDepositQuantity] = useState(0);
	const [withdrawQuantity, setWithdrawQuantity] = useState(0);

	useEffect(() => {
		if (isLoadContainers === true) {
			onGetContainers();
			setLoadContainers(false);
		}
	}, [isLoadContainers]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!localStorage['wc@2:client:0.3//session'] || localStorage['wc@2:client:0.3//session'] === '[]' || process.env.REACT_APP_WC_PROJECT_ID === '') {
			document.location.href = "/";
		}
		if (walletData && walletData.account && !isLoading) {
			onNeoBalance();
			onNeoFSBalance();
			onGetContainers();
			setIsLoading(true);
		}
	}, [walletData]); // eslint-disable-line react-hooks/exhaustive-deps

	const onNeoFSBalance = async () => {
		setIsLoadingNeoFSBalance(true);
		api('GET', `/accounting/balance/${walletData.account}`).then((e) => {
			if (e.message) {
				onPopup('failed', e.message);
			} else {
				onPopup('success', 'NeoFS balance has been updated');
				setNeoFSBalance(e.value);
				setTimeout(() => {
					setIsLoadingNeoFSBalance(false);
				}, 500);
			}
		}).catch(() => {
			setIsLoadingNeoFSBalance(false);
			setNotAvailableNeoFS(true);
		});
	};

	const onNeoBalance = async () => {
		setIsLoadingNeoBalance(true);
		const targetAddress = wcSdk.getAccountAddress(0);
		const invocations = [{
			scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
			operation: 'balanceOf',
			args: [
				{ type: 'Address', value: targetAddress },
			]
		}];

		const signers = [{
			scopes: 1, // WitnessScope.CalledByEntry
		}];

		const response = await wcSdk.testInvoke({ invocations, signers }).catch((error) => {
			if (error.message) {
				onModal('failed', error.message);
			} else {
				onModal('failed', 'Something went wrong, try again');
			}
		});
		setIsLoadingNeoBalance(false);
		if (!response.error && response.stack.length > 0) {
			onPopup('success', 'Neo balance has been updated');
			setNeoBalance(response.stack[0].value);
			setTimeout(() => {
				setIsLoadingNeoBalance(false);
			}, 500);
		} else if (response.exception) {
			onPopup('failed', response.exception);
		}
	};

	const onGetContainers = () => {
		setIsLoadingContainers(true);
		api('GET', `/containers?ownerId=${walletData.account}`).then((e) => {
			onModal();
			if (e.message) {
				onPopup('failed', e.message);
			} else {
				onPopup('success', 'Containers has been updated');

				const containersNamed = e.containers.filter((container) => container.containerName).sort((a, b) => {
					const acontainerName = a.containerName.toLowerCase();
					const bcontainerName = b.containerName.toLowerCase();
					if (acontainerName < bcontainerName) return -1;
					return 1;
				});

				const containersUnnamed = e.containers.filter((container) => !container.containerName).sort((a, b) => {
					const acontainerId = a.containerId.toLowerCase();
					const bcontainerId = b.containerId.toLowerCase();
					if (acontainerId < bcontainerId) return -1;
					return 1;
				});

				setContainers([...containersNamed, ...containersUnnamed]);
				setTimeout(() => {
					setIsLoadingContainers(false);
				}, 1000);
			}
		}).catch(() => {
			setIsLoadingContainers(false);
			setNotAvailableNeoFS(true);
		});
	};

	const onDeposit = async () => {
		if (depositQuantity * 1e8 >= 1 && depositQuantity * 1e8 <= neoBalance) {
			onModal('approveRequest');
			const senderAddress = wcSdk.getAccountAddress(0);
			const invocations = [{
				scriptHash: NeoFSContract.gasToken,
				operation: 'transfer',
				args: [
					{ type: 'Address', value: senderAddress },
					{ type: 'Address', value: NeoFSContract.account },
					{ type: 'Integer', value: depositQuantity * 1e8 },
					{ type: 'ByteArray', value: '' },
				]
			}];

			const signers = [{
				scopes: 1, // WitnessScope.CalledByEntry
			}];

			const response = await wcSdk.invokeFunction({ invocations, signers }).catch((error) => {
				if (error.message === 'Failed or Rejected Request') {
					onModal('failed', 'Failed or Rejected Request');
				} else if (error.message === 'Error: intrinsic gas too low') {
					onModal('failed', 'Transaction intrinsic gas too low');
				} else {
					onModal('failed', 'Something went wrong, try again');
				}
			});
			if (!response.error) {
				onModal('success', response);
			}
		} else {
			onPopup('failed', 'Incorrect quantity value');
		}
	};

	const onWithdraw = async () => {
		if (withdrawQuantity >= 1 && withdrawQuantity * 1e12 <= neoFSBalance) {
			onModal('approveRequest');
			const senderAddress = wcSdk.getAccountAddress(0);
			const invocations = [{
				scriptHash: NeoFSContract.scriptHash,
				operation: 'withdraw',
				args: [
					{ type: 'Address', value: senderAddress },
					{ type: 'Integer', value: withdrawQuantity },
				]
			}];

			const signers = [{
				scopes: 16, // WitnessScope.CustomContracts
				allowedContracts: [NeoFSContract.gasToken, NeoFSContract.scriptHash]
			}];

			const response = await wcSdk.invokeFunction({ invocations, signers }).catch((error) => {
				if (error.message === 'Failed or Rejected Request') {
					onModal('failed', 'Failed or Rejected Request');
				} else if (error.message === 'Error: intrinsic gas too low') {
					onModal('failed', 'Transaction intrinsic gas too low');
				} else {
					onModal('failed', 'Something went wrong, try again');
				}
			});
			if (!response.message) {
				onModal('success', response);
			}
		} else {
			onPopup('failed', 'Incorrect quantity value');
		}
	};

	return (
		<Container style={{ minHeight: 'calc(100vh - 212px)' }}>
			{walletData ? (
				<Section>
					{isNotAvailableNeoFS && (
						<Box style={{ fontSize: 14, wordBreak: 'break-all', background: '#fece0f' }}>
							<div style={{ fontSize: 20, fontWeight: 'bold' }}>NeoFS REST Gateway is not available</div>
							<div>Check web app configuration or try later</div>
						</Box>
					)}
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
													<span>{neoBalance ? `${(neoBalance * 0.00000001).toFixed(8)} GAS` : '-'}</span>
													{!isNotAvailableNeoFS && (
														<img
															src="./img/sync.svg"
															width={20}
															height={20}
															alt="sync"
															style={isLoadingNeoBalance ? {
																marginLeft: 5,
																cursor: 'pointer',
																animation: 'spin 1.5s infinite linear',
															} : {
																marginLeft: 5,
																cursor: 'pointer',
															}}
															onClick={onNeoBalance}
														/>
													)}
												</Heading>
												<Heading size={6}>Neo Balance</Heading>
											</Tile>
										</Tile>
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
													<span>{neoFSBalance ? `${(neoFSBalance * 0.000000000001).toFixed(12)} GAS` : '-'}</span>
													{!isNotAvailableNeoFS && (
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
													)}
												</Heading>
												<Heading size={6}>NeoFS Balance</Heading>
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
										style={isNotAvailableNeoFS ? {
											display: 'flex',
											margin: 'auto',
											pointerEvents: 'none',
											opacity: 0.6,
										} : {
											display: 'flex',
											margin: 'auto',
										}}
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
										onClick={onWithdraw}
										style={isNotAvailableNeoFS ? {
											display: 'flex',
											margin: 'auto',
											pointerEvents: 'none',
											opacity: 0.6,
										} : {
											display: 'flex',
											margin: 'auto',
										}}
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
								{!isNotAvailableNeoFS && (
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
								)}
							</span>
							{/* <img
								src="./img/settings.svg"
								width={22}
								height={22}
								alt="settings"
								style={{ marginLeft: 5, cursor: 'pointer' }}
								onClick={() => onModal('signTokens', '')}
							/> */}
							<Button
								color="primary"
								size="small"
								onClick={() => onModal('createContainer', { neoFSBalance })}
								style={isNotAvailableNeoFS ? { pointerEvents: 'none', opacity: 0.6 } : {}}
							>
								New container
							</Button>
						</Heading>
						{containers.map((containerItem, index) => (
							<ContainerItem
								key={containerItem.containerId}
								setWalletData={setWalletData}
								walletData={walletData}
								onModal={onModal}
								onPopup={onPopup}
								index={index}
								containerItem={containerItem}
								onAuth={onAuth}
								isLoadContainers={isLoadContainers}
								setLoadContainers={setLoadContainers}
								ContentTypeHeader={ContentTypeHeader}
								AuthorizationHeader={AuthorizationHeader}
								BearerOwnerIdHeader={BearerOwnerIdHeader}
								BearerSignatureHeader={BearerSignatureHeader}
								BearerSignatureKeyHeader={BearerSignatureKeyHeader}
							/>
						))}
					</Box>
				</Section>
			) : (
				<Section>
					<Box>
						<Heading align="center" size={5}>Loading</Heading>
						<img
							className="modal_loader"
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
