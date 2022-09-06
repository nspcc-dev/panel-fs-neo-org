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
		onDisconnectWallet,
		onPopup,
		walletConnectCtx,
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

	const [neoFSBalance, setNeoFSBalance] = useState(0);
	const [isLoadingNeoFSBalance, setIsLoadingNeoFSBalance] = useState(false);

	const [depositQuantity, setDepositQuantity] = useState(0);
	const [withdrawQuantity, setWithdrawQuantity] = useState(0);

	useEffect(() => {
		if (isLoadContainers === true) {
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
			setContainers(e.containers);
			onPopup();
			setTimeout(() => {
				setIsLoadingContainers(false);
			}, 1000);
		});
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
													<span>{neoFSBalance ? `${(neoFSBalance * 0.000000000001).toFixed(12)} GAS` : '-'}</span>
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
							<ContainerItem
								key={containerItem.containerId}
								walletData={walletData}
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
						<Button
							color="primary"
							onClick={() => onPopup('createContainer')}
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
