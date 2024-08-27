import React, { useEffect, useState } from 'react';
import Neon from "@cityofzion/neon-js";
import neo3Dapi from "neo3-dapi";
import {
	Container,
	Section,
	Heading,
	Button,
	Box,
	Tag,
} from 'react-bulma-components';
import ContainerItem from './Components/ContainerItem/ContainerItem';
import api from './api';

function formatAddress(address) {
	return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

const Profile = ({
		params,
		NeoFSContract,
		activeNet,
		walletData,
		setWalletData,
		handleError,
		onModal,
		onPopup,
		wcSdk,
		dapi,
		neolineN3,
		isLoadContainers,
		setLoadContainers,
		onAuth,
	}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [containers, setContainers] = useState([]);
	const [isLoadingContainers, setIsLoadingContainers] = useState(false);

	const [neoBalance, setNeoBalance] = useState(false);
	const [isLoadingNeoBalance, setIsLoadingNeoBalance] = useState(false);

	const [neoFSBalance, setNeoFSBalance] = useState(0);
	const [isLoadingNeoFSBalance, setIsLoadingNeoFSBalance] = useState(false);

	const [isNotAvailableNeoFS, setNotAvailableNeoFS] = useState(false);

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
		if (walletData && walletData.account && !isLoading) {
			setTimeout(() => onNeoBalance(), 500);
			onNeoFSBalance();
			onGetContainers();
			setIsLoading(true);
		}
	}, [walletData]); // eslint-disable-line react-hooks/exhaustive-deps

	const onNeoFSBalance = async () => {
		setIsLoadingNeoFSBalance(true);
		api('GET', `/accounting/balance/${walletData.account.address}`).then((e) => {
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

		if (walletData.name === 'o3-desktop') {
			response = await neo3Dapi.invokeRead({ ...invocations[0], signers }).catch((err) => handleError(err, 'balance'));
		} else if (neolineN3) {
			response = await neolineN3.invokeRead({ ...invocations[0], signers }).catch((err) => handleError(err, 'balance'));
		} else if (dapi) {
			response = await dapi.invokeRead({ ...invocations[0] }).catch((err) => handleError(err, 'balance'));
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

	const onGetContainers = () => {
		setIsLoadingContainers(true);
		api('GET', `/containers?ownerId=${walletData.account.address}`).then((e) => {
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
					<Box id="account">
						<Heading style={{ marginBottom: 15 }} weight="bold">
							<span style={{ margin: '0 15px 0 0' }}>{formatAddress(walletData.account.address)}</span>
							<Tag style={{ margin: '5px 0 10px' }}>{walletData.name}</Tag>
						</Heading>
						<table>
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
						</table>
						<div style={{ display: 'flex', flexWrap: 'wrap' }}>
							<Button
								color="primary"
								size="small"
								onClick={() => onModal('deposit', { neoBalance })}
								style={isNotAvailableNeoFS ? { display: 'block', margin: '0 10px 10px 0', pointerEvents: 'none', opacity: 0.6 } : { display: 'block', margin: '0 10px 10px 0' }}
							>
								{`Deposit from ${activeNet} to NeoFS`}
							</Button>
							<Button
								color="primary"
								size="small"
								onClick={() => onModal('withdraw', { neoFSBalance })}
								style={isNotAvailableNeoFS ? { display: 'block', pointerEvents: 'none', opacity: 0.6 } : { display: 'block' }}
							>
								{`Withdraw from NeoFS to ${activeNet}`}
							</Button>
						</div>
					</Box>
					<Box id="containers">
						<Heading style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} weight="bold">
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
