import React, { useEffect, useState } from 'react';
import Neon from "@cityofzion/neon-js";
import {
	Container,
	Section,
	Heading,
	Button,
	Box,
	Tag,
	Form,
	Notification,
} from 'react-bulma-components';
import DomainItem from './Components/DomainItem/DomainItem';
import ContainerItem from './Components/ContainerItem/ContainerItem';
import {
	formatBytes,
	formatGasPerMonth,
	invokeFunction,
} from './Functions/handle';
import api from './api';

function formatAddress(address) {
	return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

const Profile = ({
		params,
		networkInfo,
		NeoFSContract,
		activeNet,
		domainsRefreshTick,
		walletData,
		setWalletData,
		handleError,
		onModal,
		onPopup,
		openDomainRegister,
		wcSdk,
		dapi,
		neolineN3,
		isLoadContainers,
		setLoadContainers,
		onAuth,
	}) => {
	const [isLoading, setIsLoading] = useState(false);

	const [activeTransfer, setActiveTransfer] = useState(null);
	const [isSendingTransfer, setSendingTransfer] = useState(false);
	const [quantity, setQuantity] = useState('');

	const [domains, setDomains] = useState([]);
	const [isLoadingDomains, setIsLoadingDomains] = useState(false);

	const [containers, setContainers] = useState([]);
	const [isLoadingContainers, setIsLoadingContainers] = useState(false);

	const [neoBalance, setNeoBalance] = useState(false);
	const [isLoadingNeoBalance, setIsLoadingNeoBalance] = useState(false);

	const [neoFSBalance, setNeoFSBalance] = useState(0);
	const [isLoadingNeoFSBalance, setIsLoadingNeoFSBalance] = useState(false);

	const [isNotAvailableNeoFS, setNotAvailableNeoFS] = useState(false);

	const [objectsTotalSize, setObjectsTotalSize] = useState(0);

	useEffect(() => {
		if (params.rest_gw.indexOf('http://') !== 0 && params.rest_gw.indexOf('https://') !== 0) {
			setIsLoadingContainers(false);
			setIsLoadingNeoFSBalance(false);
			setNotAvailableNeoFS(true);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (isLoadContainers === true) {
			onGetContainers();
			setLoadContainers(false);
		}
	}, [isLoadContainers]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (walletData && walletData.account && NeoFSContract.sidechainContract && !isLoading) {
			setTimeout(() => onNeoBalance(), 500);
			onNeoFSBalance();
			onGetContainers();
			onGetDomains();
			setIsLoading(true);
		}
	}, [walletData, NeoFSContract]); // eslint-disable-line react-hooks/exhaustive-deps

	const onNeoFSBalance = async () => {
		setIsLoadingNeoFSBalance(true);
		api('GET', `/v1/accounting/balance/${walletData.account.address}`).then((e) => {
			if (e.message) {
				onPopup('failed', e.message);
			} else {
				onPopup('success', 'NeoFS chain balance has been updated');
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
		let response = '';
		setIsLoadingNeoBalance(true);
		const invocations = [{
			scriptHash: NeoFSContract.gasToken,
			operation: 'balanceOf',
			args: [
				{ type: 'Hash160', value: Neon.create.account(walletData.account.address).scriptHash },
			]
		}];

		const signers = [{
			scopes: 'CalledByEntry',
			account: Neon.create.account(walletData.account.address).scriptHash,
		}];

		if (neolineN3) {
			response = await neolineN3.invokeRead({ ...invocations[0], signers }).catch((err) => handleError(err, 'balance'));
		} else if (dapi) {
			response = await dapi.call({ hash: invocations[0].scriptHash, operation: invocations[0].operation, args: invocations[0].args }).catch((err) => handleError(err, 'balance'));
		} else {
			if (wcSdk.session.expiry * 1000 < new Date().getTime()) {
				onModal('failed', 'Session expired, re-login to continue');
			}

			if (walletData.name === 'CoZ Wallet Prototype') {
				signers[0].scopes = 1;
			}

			response = await wcSdk.testInvoke({ invocations, signers }).catch((err) => handleError(err, 'balance'));
		}
		setIsLoadingNeoBalance(false);
		if (response && !response.error && response.stack.length > 0) {
			onPopup('success', `${activeNet} balance has been updated`);
			setNeoBalance(response.stack[0].value);
			setTimeout(() => {
				setIsLoadingNeoBalance(false);
			}, 500);
		} else if (response && response.exception) {
			onPopup('failed', response.exception);
		} else {
			onPopup('failed', 'Something went wrong');
		}
	};

	const onGetDomains = async () => {
		if (!NeoFSContract?.nnsHash) {
			onPopup('failed', 'NNS contract is not initialized yet');
			return;
		}
		setIsLoadingDomains(true);
		try {
			const response = await invokeFunction(
				NeoFSContract.sidechain,
				[
					NeoFSContract.nnsHash,
					"tokensOf",
					[{ type: "Hash160", value: Neon.create.account(walletData.account.address).scriptHash }]
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
			if (!Array.isArray(response.stack)) {
				onPopup('failed', response.message || 'Failed to load domains');
				return;
			}
			const iterator = response.stack[0]?.iterator ?? [];
			setDomains(iterator.map((item) => atob(item.value)));
			onPopup('success', 'Domains have been updated');
		} catch (error) {
			onPopup('failed', error?.message || 'Something went wrong');
		} finally {
			setTimeout(() => {
				setIsLoadingDomains(false);
			}, 1000);
		}
	};

	const refreshDomains = async () => {
		await onGetDomains();
	};

	useEffect(() => {
		if (!domainsRefreshTick) return;
		if (!walletData?.account?.address || !NeoFSContract?.sidechainContract) return;
		refreshDomains();
	}, [domainsRefreshTick]); // eslint-disable-line react-hooks/exhaustive-deps


	const onGetContainers = () => {
		setIsLoadingContainers(true);
		api('GET', `/v1/containers?ownerId=${walletData.account.address}`).then((e) => {
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
		if (quantity * 1e8 >= 1 && quantity * 1e8 <= neoBalance) {
			onModal('approveRequest');
			const invocations = [{
				scriptHash: NeoFSContract.gasToken,
				operation: 'transfer',
				args: [
					{ type: 'Hash160', value: Neon.create.account(walletData.account.address).scriptHash },
					{ type: 'Hash160', value: Neon.create.account(NeoFSContract.account).scriptHash },
					{ type: 'Integer', value: String(Math.round(quantity * 1e8)) },
					{ type: 'Any', value: null },
				]
			}];

			const signers = [{
				scopes: 'CalledByEntry',
				account: Neon.create.account(walletData.account.address).scriptHash,
			}];

			let response = '';
			if (neolineN3) {
				response = await neolineN3.invoke({ ...invocations[0], signers }).catch((err) => handleError(err));
			} else if (dapi) {
				response = await dapi.invoke(
					[{ hash: invocations[0].scriptHash, operation: invocations[0].operation, args: invocations[0].args }],
					signers,
				).catch((err) => handleError(err));
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
			if (response && !response.error) {
				setQuantity('');
				onModal('success', response.txid ? response.txid : response);
				return true;
			}
		} else {
			onPopup('failed', 'Incorrect amount');
		}
		return false;
	};

	const onWithdraw = async () => {
		if (quantity >= 1 && quantity * 1e12 <= neoFSBalance) {
			onModal('approveRequest');
			const invocations = [{
				scriptHash: NeoFSContract.scriptHash,
				operation: 'withdraw',
				args: [
					{ type: 'Hash160', value: Neon.create.account(walletData.account.address).scriptHash },
					{ type: 'Integer', value: quantity },
				]
			}];

			const signers = [{
				scopes: 'CustomContracts',
				account: Neon.create.account(walletData.account.address).scriptHash,
				allowedContracts: [NeoFSContract.gasToken, NeoFSContract.scriptHash]
			}];

			let response = '';
			if (neolineN3) {
				response = await neolineN3.invoke({ ...invocations[0], signers }).catch((err) => handleError(err));
			} else if (dapi) {
				response = await dapi.invoke(
					[{ hash: invocations[0].scriptHash, operation: invocations[0].operation, args: invocations[0].args }],
					signers,
				).catch((err) => handleError(err));
			} else {
				response = await wcSdk.invokeFunction({ invocations, signers }).catch((err) => handleError(err));
			}
			if (response && !response.message) {
				setQuantity('');
				onModal('success', response.txid ? response.txid : response);
				return true;
			}
		} else {
			onPopup('failed', 'Incorrect amount');
		}
		return false;
	};

	const onToggleTransfer = (transfer) => {
		setQuantity('');
		setActiveTransfer(activeTransfer === transfer ? null : transfer);
	};

	const onSubmitTransfer = async () => {
		setSendingTransfer(true);
		const isSucceed = activeTransfer === 'deposit'
			? await onDeposit()
			: await onWithdraw();
		setSendingTransfer(false);
		if (isSucceed) {
			setActiveTransfer(null);
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
					{walletData.net.toLowerCase().indexOf(activeNet.toLowerCase()) === -1 && (
						<Box style={{ fontSize: 14, wordBreak: 'break-all', background: '#fece0f' }}>
							<div style={{ fontSize: 20, fontWeight: 'bold' }}>{`Сonnected wallet uses ${walletData.net} network`}</div>
							<div>{`Panel is configured for ${activeNet}, mismatching networks can lead to incorrect behavior.`}</div>
						</Box>
					)}
					<Box id="account">
						<Heading style={{ marginBottom: 15 }} weight="bold">
							<span style={{ margin: '0 15px 0 0' }}>{formatAddress(walletData.account.address)}</span>
							<Tag style={{ margin: '5px 0 10px' }}>{walletData.name}</Tag>
						</Heading>
						<table>
							<tbody>
								<tr>
									<td>{`${activeNet}:`}</td>
									<td>{Math.trunc(neoBalance * 0.00000001)}</td>
									<td>
										{`.${((neoBalance * 0.00000001).toFixed(8) + '').split(".")[1]} GAS`}
										{!isNotAvailableNeoFS && (
											<img
												src="/img/icons/sync.svg"
												alt="sync"
												style={isLoadingNeoBalance ? {
													animation: 'spin 1.5s infinite linear',
												} : {}}
												onClick={onNeoBalance}
											/>
										)}
									</td>
								</tr>
								<tr>
									<td>NeoFS:</td>
									<td>{Math.trunc(neoFSBalance * 0.000000000001)}</td>
									<td>
										{`.${((neoFSBalance * 0.000000000001).toFixed(12) + '').split(".")[1]} GAS`}
										{!isNotAvailableNeoFS && (
											<img
												src="/img/icons/sync.svg"
												width={20}
												height={20}
												alt="sync"
												style={isLoadingNeoFSBalance ? {
													animation: 'spin 1.5s infinite linear',
												} : {}}
												onClick={onNeoFSBalance}
											/>
										)}
									</td>
								</tr>
							</tbody>
						</table>
						<div style={{ display: 'flex', flexWrap: 'wrap' }}>
							<Button
								renderAs="button"
								color={activeTransfer === 'deposit' ? 'primary' : 'secondary'}
								size="small"
								onClick={() => onToggleTransfer('deposit')}
								style={isNotAvailableNeoFS ? { display: 'block', margin: '0 10px 10px 0', pointerEvents: 'none', opacity: 0.6 } : { display: 'block', margin: '0 10px 10px 0' }}
							>
								{`Deposit from ${activeNet} to NeoFS`}
							</Button>
							<Button
								renderAs="button"
								color={activeTransfer === 'withdraw' ? 'primary' : 'secondary'}
								size="small"
								onClick={() => onToggleTransfer('withdraw')}
								style={isNotAvailableNeoFS ? { display: 'block', pointerEvents: 'none', opacity: 0.6 } : { display: 'block' }}
							>
								{`Withdraw from NeoFS to ${activeNet}`}
							</Button>
						</div>
						{activeTransfer && (
							<div style={{ marginTop: 10, maxWidth: 420 }}>
								{activeTransfer === 'withdraw' && (
									<Heading className="input_caption" style={{ maxWidth: 420 }}>{`Withdrawing requires a fee to be paid, currently it's ${networkInfo ? 7 * networkInfo.withdrawalFee * 1e-8 : '-'} GAS.`} It will be reduced once the <a href="https://github.com/neo-project/neo/issues/1573" target="_blank" rel="noopener noreferrer">notary subsystem</a> is implemented in Neo</Heading>
								)}
								<Form.Field kind="addons">
									<Form.Control fullwidth>
										<Form.Input
											renderAs="input"
											type="number"
											size="small"
											autoFocus
											placeholder="Quantity (GAS)"
											value={quantity}
											onChange={(e) => setQuantity(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter' && !isSendingTransfer) {
													onSubmitTransfer();
												} else if (e.key === 'Escape') {
													setActiveTransfer(null);
												} else if (activeTransfer === 'withdraw' && e.key.length === 1 && !/[0-9]/.test(e.key)) {
													e.preventDefault();
												}
											}}
										/>
									</Form.Control>
									<Form.Control>
										<Button
											renderAs="button"
											color="primary"
											size="small"
											disabled={isSendingTransfer}
											onClick={onSubmitTransfer}
										>
											{activeTransfer === 'deposit' ? 'Make a payment' : 'Receive funds'}
										</Button>
									</Form.Control>
								</Form.Field>
							</div>
						)}
					</Box>
					<Box id="domains">
						<Heading style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} weight="bold">
							<span style={{ display: 'flex', alignItems: 'center' }}>
								{`Domains`}
								<img
									src="/img/icons/sync.svg"
									width={20}
									height={20}
									alt="sync"
									style={isLoadingDomains ? {
										marginLeft: 10,
										cursor: 'pointer',
										animation: 'spin 1.5s infinite linear',
									} : {
										marginLeft: 10,
										cursor: 'pointer',
									}}
									onClick={onGetDomains}
								/>
							</span>
							<Button
								renderAs="button"
								color="primary"
								size="small"
								onClick={() => openDomainRegister()}
								disabled={!wcSdk?.session}
								style={!wcSdk?.session ? { pointerEvents: 'none', opacity: 0.6 } : {}}
							>
								Register domain
							</Button>
						</Heading>
						{!wcSdk?.session && (
							<Notification color="warning" light>
								Domain operations are available only with the Neon wallet. Reconnect using Neon to manage domains.
							</Notification>
						)}
						{domains.map((domainItem) => (
							<DomainItem
								key={domainItem}
								NeoFSContract={NeoFSContract}
								wcSdk={wcSdk}
								domainItem={domainItem}
								onModal={onModal}
								openDomainRegister={openDomainRegister}
							/>
						))}
					</Box>
					<Box id="containers">
						<Heading style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} weight="bold">
							<div>
								<span style={{ display: 'flex', alignItems: 'center' }}>
									{`Containers`}
									{!isNotAvailableNeoFS && (
										<img
											src="/img/icons/sync.svg"
											width={20}
											height={20}
											alt="sync"
											style={isLoadingContainers ? {
												marginLeft: 10,
												cursor: 'pointer',
												animation: 'spin 1.5s infinite linear',
											} : {
												marginLeft: 10,
												cursor: 'pointer',
											}}
											onClick={onGetContainers}
										/>
									)}
								</span>
								<Heading
									size={6}
									weight="light"
									style={{
										margin: '0',
										fontSize: '14px',
										color: 'rgba(0,0,0,.7)',
									}}
								>{objectsTotalSize && networkInfo ? `${formatGasPerMonth(objectsTotalSize, networkInfo)} GAS per month (${formatBytes(objectsTotalSize)})` : '-'}</Heading>
							</div>
							<Button
								renderAs="button"
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
								NeoFSContract={NeoFSContract}
								networkInfo={networkInfo}
								setWalletData={setWalletData}
								setObjectsTotalSize={setObjectsTotalSize}
								walletData={walletData}
								onModal={onModal}
								onPopup={onPopup}
								index={index}
								containerItem={containerItem}
								onAuth={onAuth}
								isLoadContainers={isLoadContainers}
								setLoadContainers={setLoadContainers}
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
							src="/img/icons/loader.svg"
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
