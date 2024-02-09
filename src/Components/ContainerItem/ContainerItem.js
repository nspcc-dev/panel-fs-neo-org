import React, { useState, useEffect } from "react";
import {
	Heading,
	Section,
	Button,
	Tile,
	Notification,
} from 'react-bulma-components';
import TreeView from '../TreeView/TreeView';
import EACLPanel from '../EACLPanel/EACLPanel';
import {
	formatForTreeView,
	formatForContainerName,
} from '../../Functions/handle';
import api from '../../api';

export default function ContainerItem({
	params,
	containerItem,
	onAuth,
	walletData,
	setWalletData,
	onModal,
	onPopup,
	index,
	isLoadContainers,
	setLoadContainers,
	ContentTypeHeader,
	AuthorizationHeader,
	BearerOwnerIdHeader,
	BearerSignatureHeader,
	BearerSignatureKeyHeader,
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [objects, setObjects] = useState(null);
	const [isLoadingObjects, setLoadingObjects] = useState(false);
	const [isLoadingEACL, setLoadingEACL] = useState(false);
	const [eACLParams, setEACLParams] = useState([]);
	const [activePanel, setActivePanel] = useState('');

	useEffect(() => {
		if (isLoadContainers === containerItem.containerId) {
			onGetObjects(isLoadContainers);
			setLoadContainers(false);
			onModal();
		}
	}, [isLoadContainers]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (walletData.tokens.object && walletData.tokens.object.containerId === containerItem.containerId) {
			setActivePanel('objects');
			onGetObjects(containerItem.containerId);
			onModal();
			setWalletData({
				...walletData,
				tokens: {
					...walletData.tokens,
					object: {
						...walletData.tokens.object,
						containerId: null,
					}
				}
			});
		} else if (walletData.tokens.container.SETEACL && walletData.tokens.container.SETEACL.containerId === containerItem.containerId) {
			onGetEACL(containerItem.containerId);
			setActivePanel('eACL');
			onModal();
			setWalletData({
				...walletData,
				tokens: {
					...walletData.tokens,
					container: {
						...walletData.tokens.container,
						SETEACL: {
							...walletData.tokens.container.SETEACL,
							containerId: null,
						}
					}
				}
			});
		}
	}, [walletData]); // eslint-disable-line react-hooks/exhaustive-deps

	const onGetObjects = (containerId) => {
		setLoadingObjects(true);
		api('POST', `/objects/${containerId}/search?walletConnect=true`, {
			"filters": [],
		}, {
			[ContentTypeHeader]: "application/json",
			[AuthorizationHeader]: `Bearer ${walletData.tokens.object.token}`,
			[BearerOwnerIdHeader]: walletData.account,
			[BearerSignatureHeader]: walletData.tokens.object.signature,
			[BearerSignatureKeyHeader]: walletData.publicKey,
		}).then((e) => {
			setLoadingObjects(false);
			if (e.message) {
				onPopup('failed', e.message);
			} else {
				setObjects(e.objects ? formatForTreeView(e.objects) : []);
			}
		});
	};

	const onGetEACL = (containerId) => {
		setLoadingEACL(true);
		api('GET', `/containers/${containerId}/eacl?walletConnect=true`, {}, {
			[ContentTypeHeader]: "application/json",
			[BearerOwnerIdHeader]: walletData.account,
		}).then((e) => {
			setLoadingEACL(false);
			if (e.records) {
				setEACLParams(e.records);
			}
		});
	};

	return (
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
						className={isOpen ? 'active' : ''}
						onClick={() => {
							setIsOpen(!isOpen);
						}}
					>
						{formatForContainerName(containerItem.attributes, containerItem.containerId)}
						{isOpen && (
							<img
								src="/img/icons/trashbin.svg"
								width={18}
								height={18}
								fill="#f14668"
								alt="delete"
								style={{ cursor: 'pointer' }}
								onClick={(e) => {
									onModal('deleteContainer', { containerId: containerItem.containerId });
									e.stopPropagation();
								}}
							/>
						)}
					</Heading>
					{isOpen && (
						<div className="container_panel">
							{containerItem.ownerId ? (
								<div>
									<Section>
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
											{`0x${containerItem.basicAcl}${containerItem.cannedAcl ? ` (${containerItem.cannedAcl})` : ''}`}
										</Heading>
										{containerItem.attributes.map((attribute) => ( attribute.key === 'Timestamp' && (
											<Heading size={6} weight="light" key={attribute.key}>
												<span>{`${attribute.key === 'Timestamp' ? 'Creation' : attribute.key}: `}</span>
												{attribute.key === 'Timestamp' ? `${new Date(attribute.value * 1000).toISOString()}` : attribute.value}
											</Heading>
										)))}
									</Section>
									<Section>
										<Heading
											size={6}
											weight="bolder"
											onClick={() => {
												if (containerItem.basicAcl.length === 8 && (containerItem.basicAcl.substr(0, 1) === '1' || containerItem.basicAcl.substr(0, 1) === '3')) {
													if (activePanel === 'eACL') {
														setActivePanel('');
													} else {
														setActivePanel('eACL');
													}
												} else if (activePanel === 'eACL') {
													setActivePanel('');
												} else {
													onGetEACL(containerItem.containerId);
													setActivePanel('eACL');
												}
											}}
											style={{ cursor: 'pointer', display: 'flex' }}
										>
											<img
												src={activePanel === 'eACL' ? '/img/icons/chevron_down.svg' : '/img/icons/chevron_right.svg'}
												style={{ marginRight: 10 }}
												width={22}
												height={22}
												alt="chevron"
											/>
											eACL
										</Heading>
										{activePanel === 'eACL' && (
											<>
												{!isLoadingEACL ? (
													<>
														{(containerItem.basicAcl.length === 8 && (containerItem.basicAcl.substr(0, 1) === '1' || containerItem.basicAcl.substr(0, 1) === '3')) ? (
															<Heading size={6} weight="light">
																Current basic acl doesn't support eACL
															</Heading>
														) : (
															<EACLPanel
																onAuth={onAuth}
																walletData={walletData}
																containerItem={containerItem}
																setLoadContainers={setLoadContainers}
																eACLParams={eACLParams}
																setEACLParams={setEACLParams}
																ContentTypeHeader={ContentTypeHeader}
																AuthorizationHeader={AuthorizationHeader}
																BearerOwnerIdHeader={BearerOwnerIdHeader}
																BearerSignatureHeader={BearerSignatureHeader}
																BearerSignatureKeyHeader={BearerSignatureKeyHeader}
															/>
														)}
													</>
												) : (
													<img
														className="modal_loader"
														src="/img/icons/loader.svg"
														height={30}
														width={30}
														alt="loader"
													/>
												)}
											</>
										)}
									</Section>
									<Section>
										<Heading
											size={6}
											weight="bolder"
											onClick={() => activePanel === 'attributes' ? setActivePanel('') : setActivePanel('attributes')}
											style={{ cursor: 'pointer', display: 'flex' }}
										>
											<img
												src={activePanel === 'attributes' ? '/img/icons/chevron_down.svg' : '/img/icons/chevron_right.svg'}
												style={{ marginRight: 10 }}
												width={22}
												height={22}
												alt="chevron"
											/>
											Attributes
										</Heading>
										{activePanel === 'attributes' && containerItem.attributes.map((attribute) => (
											<Heading size={6} weight="light" style={{ marginLeft: 10 }} key={attribute.key}>
												<span>{`${attribute.key}: `}</span>
												{attribute.value}
											</Heading>
										))}
									</Section>
									<Section>
										<Heading
											size={6}
											weight="bolder"
											onClick={() => {
												if (!walletData.tokens.object) {
													onModal('signTokens', 'object', { containerId: containerItem.containerId });
												} else if (activePanel === 'objects') {
													setActivePanel('');
												} else {
													onGetObjects(containerItem.containerId);
													setActivePanel('objects');
												}
											}}
											style={{ cursor: 'pointer', display: 'flex' }}
										>
											<img
												src={activePanel === 'objects' ? '/img/icons/chevron_down.svg' : '/img/icons/chevron_right.svg'}
												style={{ marginRight: 10 }}
												width={22}
												height={22}
												alt="chevron"
											/>
											Objects
										</Heading>
										{activePanel === 'objects' && (
											<>
												{!isLoadingObjects ? (
													<>
														{objects && objects.length === 0 && (
															<Heading size={6} weight="light" align="center">Objects not found</Heading>
														)}
														<TreeView
															params={params}
															walletData={walletData}
															onModal={onModal}
															containerIndex={index}
															containerItem={containerItem}
															objects={objects}
															ContentTypeHeader={ContentTypeHeader}
															AuthorizationHeader={AuthorizationHeader}
															BearerOwnerIdHeader={BearerOwnerIdHeader}
															BearerSignatureHeader={BearerSignatureHeader}
															BearerSignatureKeyHeader={BearerSignatureKeyHeader}
														/>
													</>
												) : (
													<img
														className="modal_loader"
														src="/img/icons/loader.svg"
														height={30}
														width={30}
														alt="loader"
													/>
												)}
												{!isLoadingObjects && (
													<Button
														color="primary"
														onClick={() => onModal('createObject', { containerId: containerItem.containerId })}
														style={{ display: 'flex', margin: '20px auto 0' }}
													>
														New object
													</Button>
												)}
											</>
										)}
									</Section>
								</div>
							) : (
								<img
									className="modal_loader"
									src="/img/icons/loader.svg"
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
	);
}
