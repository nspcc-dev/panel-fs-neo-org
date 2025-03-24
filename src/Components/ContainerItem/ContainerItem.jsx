import React, { useState, useEffect } from "react";
import {
	Heading,
	Section,
	Form,
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
	containerItem,
	onAuth,
	walletData,
	setWalletData,
	onModal,
	onPopup,
	index,
	isLoadContainers,
	setLoadContainers,
}) {
	const ObjectsPerPage = 40;
	const [isOpen, setIsOpen] = useState(false);
	const [pagination, setPagination] = useState({
		page: 0,
		objects: 0,
	});
	const [filters, setFilters] = useState([{
		key: '',
		match: 'MatchStringEqual',
		value: '',
	}]);
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

	const onGetObjects = (containerId, pageTemp = pagination.page) => {
		setPagination({ ...pagination, page: pageTemp});
		setLoadingObjects(true);
		api('POST', `/objects/${containerId}/search?limit=${ObjectsPerPage}&offset=${pageTemp * ObjectsPerPage}`, {
			filters: filters.every((item) => item.key !== '' && item.value !== '') ? filters : [],
		}, {
			"Authorization": `Bearer ${walletData.tokens.object.bearer}`,
		}).then((e) => {
			setLoadingObjects(false);
			if (e.message) {
				onPopup('failed', e.message);
			} else {
				setPagination({ objects: e.objects ? e.objects.length : 0, page: pageTemp});
				setObjects(e.objects ? formatForTreeView(e.objects) : []);
			}
		});
	};

	const onGetEACL = (containerId) => {
		setLoadingEACL(true);
		api('GET', `/containers/${containerId}/eacl`, {}, {
			"X-Bearer-Owner-Id": walletData.account.address,
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
													onGetObjects(containerItem.containerId, 0);
													setActivePanel('objects');
												}
											}}
											style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
										>
											<div style={{ display: 'flex', alignItems: 'center' }}>
												<img
													src={activePanel === 'objects' ? '/img/icons/chevron_down.svg' : '/img/icons/chevron_right.svg'}
													style={{ marginRight: 10 }}
													width={22}
													height={22}
													alt="chevron"
												/>
												Objects
											</div>
											{activePanel === 'objects' && (
												<Button
													renderAs="button"
													size="small"
													color="primary"
													onClick={(e) => {
														onModal('createObject', { containerId: containerItem.containerId })
														e.stopPropagation();
													}}
												>
													New object
												</Button>
											)}
										</Heading>
										{activePanel === 'objects' && (
											<>
												{objects && (objects.length !== 0 || (objects.length === 0 && filters !== null)) && (
													<div className="filters_block">
														<Heading
															align="center"
															weight="normal"
															size={6}
															style={{
																display: 'flex',
																alignItems: 'center',
																justifyContent: 'space-between',
																margin: 0,
															}}
														>
															<span style={{ position: 'relative' }}>
																Filter
																<div className="tooltip_block">
																	<img
																		className="input_icon"
																		src="/img/icons/info_circle.svg"
																		height={18}
																		width={18}
																		alt="info"
																	/>
																	<div className="tooltip">Flexible search allows you to use any attributes to search through the attribute-operation-value formula, you can use attributes such as FilePath, FileName, etc.</div>
																</div>
															</span>
															<Button
																renderAs="button"
																color="primary"
																size="small"
																onClick={() => {
																	let filtersTemp = [ ...filters ];
																	filtersTemp.push({
																		key: '',
																		match: 'MatchStringEqual',
																		value: '',
																	});
																	setFilters(filtersTemp);
																}}
																disabled={isLoadingObjects}
															>
																Add filter
															</Button>
														</Heading>
														{filters.map((filterItem, indexFilter) => (
															<div className="filter_item" key={indexFilter}>
																<Form.Control>
																	<Form.Input
																		renderAs="input"
																		size='small'
																		placeholder="Attribute"
																		value={filterItem.key}
																		onChange={(e) => {
																			let filtersTemp = [ ...filters ];
																			filtersTemp[indexFilter].key = e.target.value;
																			setFilters(filtersTemp);
																		}}
																		disabled={isLoadingObjects}
																	/>
																</Form.Control>
																<Form.Control className="select_wrapper">
																	<Form.Select
																		renderAs="select"
																		size='small'
																		value={filterItem.match}
																		onChange={(e) => {
																			let filtersTemp = [ ...filters ];
																			filtersTemp[indexFilter].match = e.target.value;
																			setFilters(filtersTemp);
																		}}
																		disabled={isLoadingObjects}
																	>
																		{[
																			{ value: 'MatchStringEqual', title: 'equal' },
																			{ value: 'MatchStringNotEqual', title: 'not equal' },
																			{ value: 'MatchCommonPrefix', title: 'has prefix' },
																		].map((item) => (
																			<option value={item.value} key={item.title}>{item.title}</option>
																		))}
																	</Form.Select>
																</Form.Control>
																<Form.Control>
																	<Form.Input
																		renderAs="input"
																		size='small'
																		placeholder="Value"
																		value={filterItem.value}
																		onChange={(e) => {
																			let filtersTemp = [ ...filters ];
																			filtersTemp[indexFilter].value = e.target.value;
																			setFilters(filtersTemp);
																		}}
																		disabled={isLoadingObjects}
																	/>
																</Form.Control>
																<img
																	src="/img/icons/trashbin.svg"
																	width={14}
																	height={14}
																	fill="#f14668"
																	alt="delete"
																	style={{ cursor: 'pointer', marginLeft: 8 }}
																	onClick={() => {
																		let filtersTemp = [ ...filters ];
																		filtersTemp.splice(indexFilter, 1);
																		setFilters(filtersTemp);
																	}}
																/>
															</div>
														))}
														<Button
															renderAs="button"
															fullwidth
															color="primary"
															size="small"
															style={{ marginTop: 8 }}
															onClick={() => onGetObjects(containerItem.containerId, 0)}
															disabled={isLoadingObjects || filters.some((item) => item.key === '' || item.value === '')}
														>
															Search
														</Button>
													</div>
												)}
												{!isLoadingObjects ? (
													<>
														{objects && objects.length === 0 && (
															<Heading size={6} weight="light" align="center">Objects not found</Heading>
														)}
														<TreeView
															walletData={walletData}
															onModal={onModal}
															containerIndex={index}
															containerItem={containerItem}
															objects={objects}
														/>
														{!(pagination.page === 0 && pagination.objects === 0) && (
															<div className="pagination">
																<div
																	className="pagination-previous"
																	onClick={() => onGetObjects(containerItem.containerId, pagination.page - 1)}
																	style={pagination.page === 0 ? { pointerEvents: 'none', borderColor: '#e9e9e9' } : {}}
																>{`<`}</div>
																<div className="pagination-text">{pagination.page + 1}</div>
																<div
																	className="pagination-next"
																	onClick={() => onGetObjects(containerItem.containerId, pagination.page + 1)}
																	style={pagination.objects < ObjectsPerPage ? { pointerEvents: 'none', borderColor: '#e9e9e9' } : {}}
																>{`>`}</div>
															</div>
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
