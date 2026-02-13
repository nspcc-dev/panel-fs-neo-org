import React, { useState, useEffect } from "react";
import Neon from "@cityofzion/neon-js";
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
	base58ToBase64,
	invokeFunction,
	formatBytes,
	formatGasPerMonth,
} from '../../Functions/handle';
import api from '../../api';

export default function ContainerItem({
	NeoFSContract,
	networkInfo,
	containerItem,
	setObjectsTotalSize,
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
		history: [],
		cursor: '',
	});
	const [filters, setFilters] = useState([{
		key: '',
		match: 'MatchStringEqual',
		value: '',
	}]);
	const [objects, setObjects] = useState(null);
	const [objectsWithCopies, setObjectsWithCopies] = useState(null);
	const [isLoadingObjects, setLoadingObjects] = useState(false);
	const [isLoadingEACL, setLoadingEACL] = useState(false);
	const [eACLParams, setEACLParams] = useState([]);
	const [activePanel, setActivePanel] = useState('');
	const [isTreeViewObjects, setTreeViewObjects] = useState(false);
	const [isShowHiddenFiles, setShowFilesActive] = useState(false);

	useEffect(() => {
		if (isLoadContainers === containerItem.containerId) {
			onGetObjects(isLoadContainers, '', { history: [], cursor: '' });
			setLoadContainers(false);
			onModal();
		}
	}, [isLoadContainers]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (NeoFSContract.sidechainContract) {
			onGetContainerReportSummary(containerItem.containerId);
		}
	}, [NeoFSContract.sidechainContract]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (walletData.tokens.object && walletData.tokens.object.containerId === containerItem.containerId) {
			setActivePanel('objects');
			onGetObjects(containerItem.containerId, '', { history: [], cursor: '' });
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
		} else if (walletData.tokens.container.CONTAINER_SET_EACL && walletData.tokens.container.CONTAINER_SET_EACL.containerId === containerItem.containerId) {
			onGetEACL(containerItem.containerId);
			setActivePanel('eACL');
			onModal();
			setWalletData({
				...walletData,
				tokens: {
					...walletData.tokens,
					container: {
						...walletData.tokens.container,
						CONTAINER_SET_EACL: {
							...walletData.tokens.container.CONTAINER_SET_EACL,
							containerId: null,
						}
					}
				}
			});
		}
	}, [walletData]); // eslint-disable-line react-hooks/exhaustive-deps

	const onGetObjects = (containerId, cursor = '', paginationTemp = pagination, isTreeViewObjectsTemp = isTreeViewObjects, isShowHiddenFilesTemp = false) => {
		setLoadingObjects(true);
		let filtersApplied = filters.filter(item => item.key !== '' && item.value !== '');
		if (isTreeViewObjectsTemp) {
			const hasFilePath = filtersApplied.some(item => item.key === 'FilePath');
			filtersApplied = hasFilePath ? filtersApplied : [{ key: "FilePath", match: "MatchCommonPrefix", value: "" }, ...filtersApplied];
		}

		if (!isShowHiddenFilesTemp) {
			const hasObjectType = filtersApplied.some(item => item.key === '$Object:objectType');
			filtersApplied = hasObjectType ? filtersApplied : [{ key: "$Object:ROOT", match: "", value: "" }, ...filtersApplied];
		}

		api('POST', `/v2/objects/${containerId}/search?limit=${ObjectsPerPage}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, {
			attributes: [...new Set(filtersApplied.map(item => item.key))],
			filters: filtersApplied,
		}, {
			"Authorization": `Bearer ${walletData.tokens.object.bearer}`,
		}).then((e) => {
			setLoadingObjects(false);
			if (e.message) {
				onPopup('failed', e.message);
			} else {
				const pos = paginationTemp.history.indexOf(e.cursor);
				if (pos !== -1) {
					paginationTemp.history.splice(pos, 1);
				} else if (paginationTemp.cursor !== '') {
					paginationTemp.history.push(paginationTemp.cursor);
				}
				setPagination({ history: paginationTemp.history, cursor: e.cursor });
				setObjects(e.objects && e.objects.length > 0 ? formatForTreeView(e.objects) : []);
			}
		});
	};

	const onGetContainerReportSummary = async (containerId) => {
		const response = await invokeFunction(
			NeoFSContract.sidechain,
			[
				NeoFSContract.sidechainContract,
				"getNodeReportSummary",
				[{ type: "ByteString", value: base58ToBase64(containerId) }]
			],
		);
		setObjectsWithCopies({
			size: response.stack[0].value[0].value,
			count: response.stack[0].value[1].value,
		});

		setObjectsTotalSize((prevState) => prevState + parseInt(response.stack[0].value[0].value));
	};

	const onGetEACL = (containerId) => {
		setLoadingEACL(true);
		api('GET', `/v1/containers/${containerId}/eacl`, {}, {
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
						<div>
							<div>{formatForContainerName(containerItem.attributes, containerItem.containerId)}</div>
							<Heading
								size={6}
								weight="light"
								style={{
									margin: '0',
									fontSize: '14px',
									color: 'rgba(0,0,0,.7)',
								}}
							>{objectsWithCopies && networkInfo ? `${formatGasPerMonth(objectsWithCopies.size, networkInfo)} GAS per month (${formatBytes(objectsWithCopies.size)})` : '-'}</Heading>
						</div>
						{isOpen ? (
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
						) : (
							<img
								src="/img/icons/chevron_down.svg"
								width={26}
								height={26}
								alt="open"
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
											<span>{`Objects (physical copies): `}</span>
											{objectsWithCopies ? `${objectsWithCopies.count} object${objectsWithCopies.count === '1' ? '' : 's'}` : '-'}
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
													onGetObjects(containerItem.containerId, '', { history: [], cursor: '' });
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
												<div>
													<Button
														renderAs="button"
														size="small"
														color="primary"
														style={{ marginRight: 10 }}
														onClick={(e) => {
															setTreeViewObjects(!isTreeViewObjects);
															setShowFilesActive(false);
															onGetObjects(containerItem.containerId, '', { history: [], cursor: '' }, !isTreeViewObjects);
															e.stopPropagation();
														}}
														disabled={!isTreeViewObjects && objects?.length === 0 || isLoadingObjects}
													>
														<img
															src={`/img/icons/${isTreeViewObjects ? 'tree' : 'list'}_view.svg`}
															height={12}
															width={12}
															style={{ marginRight: 5 }}
															alt="view"
														/>
														{isTreeViewObjects ? 'Tree view' : 'List view'}
													</Button>
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
												</div>
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
																	style={isLoadingObjects ? { cursor: 'pointer', marginLeft: 8, pointerEvents: 'none' } : { cursor: 'pointer', marginLeft: 8 }}
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
															style={{ margin: '8px 0' }}
															onClick={() => onGetObjects(containerItem.containerId, '', { history: [], cursor: '' })}
															disabled={isLoadingObjects || filters.some((item) => item.key === '' || item.value === '')}
														>
															Search
														</Button>
														<Form.Control>
															<Form.Checkbox
																renderAs="input"
																onChange={(e) => {
																	setShowFilesActive(!isShowHiddenFiles);
																	onGetObjects(containerItem.containerId, '', { history: [], cursor: '' }, isTreeViewObjects, !isShowHiddenFiles);
																	e.stopPropagation();
																}}
																disabled={isLoadingObjects}
															>Show hidden files</Form.Checkbox>
														</Form.Control>
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
														{objects?.length !== 0 && (
															<div className="pagination">
																<div
																	className="pagination-previous"
																	onClick={() => onGetObjects(containerItem.containerId, pagination.history.length > 1 ? pagination.history[pagination.history.length - 2] : '')}
																	style={pagination.history.length === 0 ? { pointerEvents: 'none', borderColor: '#e9e9e9', color: '#9f9f9f' } : {}}
																>{`<`}</div>
																<div className="pagination-text">{pagination.history.length + 1}</div>
																<div
																	className="pagination-next"
																	onClick={() => onGetObjects(containerItem.containerId, pagination.cursor)}
																	style={pagination.cursor === '' ? { pointerEvents: 'none', borderColor: '#e9e9e9', color: '#9f9f9f' } : {}}
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
