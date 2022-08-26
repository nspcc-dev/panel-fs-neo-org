import React, { useState, useEffect } from "react";
import {
	Heading,
	Section,
	Button,
	Tile,
	Box,
	Notification,
	Panel,
	Form,
	Tag,
} from 'react-bulma-components';
import TreeView from '../TreeView/TreeView';
import api from '../../api';

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

export default function ContainerItem({
	containerItem,
	walletData,
	onPopup,
	index,
	isLoadContainers,
	setLoadContainers,
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [objects, setObjects] = useState(null);
	const [eACLParams, setEACLParams] = useState([]);
	const [activePanel, setActivePanel] = useState('');

	useEffect(() => {
		if (isLoadContainers === containerItem.containerId) {
			onGetObjects(isLoadContainers);
			setLoadContainers(false);
			onPopup();
		}
	}, [isLoadContainers]); // eslint-disable-line react-hooks/exhaustive-deps

	const onGetObjects = (containerId) => {
		api('POST', `/objects/${containerId}/search?walletConnect=true`, {
			"filters": [],
		}, {
			"Content-Type": "application/json",
			"X-Bearer-Owner-Id": walletData.account,
			'X-Bearer-Signature': walletData.tokens.object.GET.signature,
			'X-Bearer-Signature-Key': walletData.publicKey,
			'Authorization': `Bearer ${walletData.tokens.object.GET.token}`
		}).then((e) => {
			setObjects(e.objects ? formatForTreeView(e.objects) : []);
		});
	};

	const onGetEACL = (containerId) => {
		if (walletData.tokens.container.SETEACL) {
			onPopup('loading');
			api('GET', `/containers/${containerId}/eacl?walletConnect=true`, {}, {
				"Content-Type": "application/json",
				"X-Bearer-Owner-Id": walletData.account,
				'X-Bearer-Signature': walletData.tokens.container.SETEACL.signature,
				'X-Bearer-Signature-Key': walletData.publicKey,
				'Authorization': `Bearer ${walletData.tokens.container.SETEACL.token}`
			}).then((e) => {
				onPopup();
				if (e.records) {
					setEACLParams(e.records);
				}
			});
		} else {
			onPopup('signTokens', 'container.SETEACL');
		}
	};

	const onSetEACL = (containerId) => {
		if (walletData.tokens.container.SETEACL) {
			onPopup('loading');
			api('PUT', `/containers/${containerId}/eacl?walletConnect=true`, {
				"records": eACLParams.filter((item) => delete item.isOpen),
			}, {
				"Content-Type": "application/json",
				"X-Bearer-Owner-Id": walletData.account,
				'X-Bearer-Signature': walletData.tokens.container.SETEACL.signature,
				'X-Bearer-Signature-Key': walletData.publicKey,
				'Authorization': `Bearer ${walletData.tokens.container.SETEACL.token}`
			}).then(() => {
				setLoadContainers(true);
			});
		} else {
			onPopup('signTokens', 'container.SETEACL');
		}
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
								src="./img/trashbin.svg"
								width={30}
								height={30}
								fill="#f14668"
								alt="delete"
								style={{ cursor: 'pointer' }}
								onClick={(e) => {
									onPopup('deleteContainer', { containerId: containerItem.containerId });
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
										<Heading size={7} weight="bolder" style={{ color: '#828282' }}>Information</Heading>
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
											{`0x${containerItem.basicAcl}${containerItem.cannedAcl ? ` (${containerItem.cannedAcl}` : ''})`}
										</Heading>
										{containerItem.attributes.map((attribute) => ( attribute.key === 'Timestamp' && (
											<Heading size={6} weight="light" key={attribute.key}>
												<span>{`${attribute.key === 'Timestamp' ? 'Creation' : attribute.key}: `}</span>
												{attribute.key === 'Timestamp' ? `${new Date(attribute.value * 1000).toLocaleTimeString()} ${new Date(attribute.value * 1000).toLocaleDateString()}` : attribute.value}
											</Heading>
										)))}
									</Section>
									<Section>
										<Heading
											size={6}
											weight="bolder"
											onClick={() => {
												if (!walletData.tokens.container.SETEACL) {
													onPopup('signTokens', 'container.SETEACL');
												} else if (activePanel === 'eACL') {
													setActivePanel('');
												} else {
													onGetEACL(containerItem.containerId);
													setActivePanel('eACL');
												}
											}}
											style={{ cursor: 'pointer' }}
										>
											<img
												src={activePanel === 'eACL' ? './img/chevron_down.svg' : './img/chevron_right.svg'}
												style={{ marginRight: 10 }}
												width={12}
												height={12}
												alt="chevron"
											/>
											eACL
										</Heading>
										{activePanel === 'eACL' && (
											<Box
												style={{
													marginTop: 15,
													padding: '0 0 1.25rem 0',
													border: '1px solid #dbdbdc',
													boxShadow: '0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 2%)',
												}}
											>
												{eACLParams.map((eACLItem, index) => (
													<Panel.Block
														active
														renderAs="a"
														key={index}
													>
														<div
															className="panel-block-header"
															onClick={() => {
																const aECLParamsTemp = [...eACLParams];
																aECLParamsTemp[index].isOpen = !aECLParamsTemp[index].isOpen;
																setEACLParams(aECLParamsTemp);
															}}
														>
															<Panel.Icon>
																<img
																	src={eACLItem.isOpen ? './img/chevron_down.svg' : './img/chevron_right.svg'}
																	style={{ marginRight: 10 }}
																	width={12}
																	height={12}
																	alt="chevron"
																/>
															</Panel.Icon>
															{`Rule #${index + 1}`}
															{eACLItem.isOpen && (
																<Panel.Icon>
																	<img
																		src="./img/trashbin.svg"
																		width={25}
																		height={25}
																		alt="delete"
																		style={{ cursor: 'pointer', position: 'absolute', right: 0, top: 0 }}
																		onClick={(e) => {
																			const aECLParamsTemp = [...eACLParams];
																			aECLParamsTemp.splice(index, 1);
																			setEACLParams(aECLParamsTemp);
																			e.stopPropagation();
																		}}
																	/>
																</Panel.Icon>
															)}
														</div>
														{eACLItem.isOpen && (
															<div className="panel-block-content">
																<Form.Field kind="group">
																	<Form.Control>
																		<Form.Select
																			value={eACLItem.operation}
																			onChange={(e) => {
																				const aECLParamsTemp = [...eACLParams];
																				aECLParamsTemp[index].operation = e.target.value;
																				setEACLParams(aECLParamsTemp);
																			}}
																		>
																			<option value="" disabled>Operation</option>
																			{['PUT', 'GET', 'HEAD', 'DELETE', 'SEARCH', 'GETRANGE', 'GETRANGEHASH'].map((item) => (
																				<option value={item} key={item}>{item}</option>
																			))}
																		</Form.Select>
																	</Form.Control>
																	<Form.Control>
																		<Form.Select
																			value={eACLItem.action}
																			onChange={(e) => {
																				const aECLParamsTemp = [...eACLParams];
																				aECLParamsTemp[index].action = e.target.value;
																				setEACLParams(aECLParamsTemp);
																			}}
																		>
																			<option value="" disabled>Action</option>
																			{['ALLOW', 'DENY'].map((item) => (
																				<option value={item} key={item}>{item}</option>
																			))}
																		</Form.Select>
																	</Form.Control>
																	<Form.Control>
																		<Form.Select
																			value={eACLItem.targets[0].role}
																			onChange={(e) => {
																				const aECLParamsTemp = [...eACLParams];
																				aECLParamsTemp[index].targets[0].role = e.target.value;
																				setEACLParams(aECLParamsTemp);
																			}}
																		>
																			<option value="" disabled>Action</option>
																			{['USER', 'SYSTEM', 'OTHERS'].map((item) => (
																				<option value={item} key={item}>{item}</option>
																			))}
																		</Form.Select>
																	</Form.Control>
																</Form.Field>
																<Heading align="center" weight="normal" size={6} style={{ marginBottom: 10 }}>Filters</Heading>
																{eACLItem.filters.map((filterItem, filterIndex) => (
																	<Form.Field className="panel-block-content" kind="group" key={filterIndex}>
																		<Form.Control>
																			<Form.Select
																				value={filterItem.headerType}
																				onChange={(e) => {
																					const aECLParamsTemp = [...eACLParams];
																					aECLParamsTemp[index].filters[filterIndex].headerType = e.target.value;
																					setEACLParams(aECLParamsTemp);
																				}}
																			>
																				<option value="" disabled>headerType</option>
																				{['REQUEST', 'OBJECT', 'SERVICE'].map((item) => (
																					<option value={item} key={item}>{item}</option>
																				))}
																			</Form.Select>
																		</Form.Control>
																		<Form.Control>
																			<Form.Select
																				value={filterItem.matchType}
																				onChange={(e) => {
																					const aECLParamsTemp = [...eACLParams];
																					aECLParamsTemp[index].filters[filterIndex].matchType = e.target.value;
																					setEACLParams(aECLParamsTemp);
																				}}
																			>
																				<option value="" disabled>matchType</option>
																				{['STRING_EQUAL', 'STRING_NOT_EQUAL'].map((item) => (
																					<option value={item} key={item}>{item}</option>
																				))}
																			</Form.Select>
																		</Form.Control>
																		<Form.Control>
																			<Form.Input
																				placeholder="Key"
																				value={filterItem.key}
																				onChange={(e) => {
																					const aECLParamsTemp = [...eACLParams];
																					aECLParamsTemp[index].filters[filterIndex].key = e.target.value;
																					setEACLParams(aECLParamsTemp);
																				}}
																			/>
																		</Form.Control>
																		<Form.Control>
																			<Form.Input
																				placeholder="Value"
																				value={filterItem.value}
																				onChange={(e) => {
																					const aECLParamsTemp = [...eACLParams];
																					aECLParamsTemp[index].filters[filterIndex].value = e.target.value;
																					setEACLParams(aECLParamsTemp);
																				}}
																			/>
																		</Form.Control>
																		<img
																			src="./img/trashbin.svg"
																			width={25}
																			height={25}
																			alt="delete"
																			style={{ cursor: 'pointer', right: 0, top: 0 }}
																			onClick={() => {
																				const aECLParamsTemp = [...eACLParams];
																				aECLParamsTemp[index].filters.splice(filterIndex, 1);
																				setEACLParams(aECLParamsTemp);
																			}}
																		/>
																	</Form.Field>
																))}
																<Button
																	outlined
																	onClick={() => {
																		let aECLParamsTemp = [...eACLParams];
																		aECLParamsTemp[index].filters.push({
																			headerType: "",
																			matchType: "",
																			key: "",
																			value: ""
																		});
																		setEACLParams(aECLParamsTemp);
																	}}
																	style={{ display: 'flex', margin: 'auto' }}
																>
																	Add filter
																</Button>
															</div>
														)}
													</Panel.Block>
												))}
												<Panel.Block>
													<Button
														fullwidth
														outlined
														onClick={() => {
															let aECLParamsTemp = [...eACLParams];
															aECLParamsTemp.push({
																operation: "",
																action: "",
																isOpen: true,
																filters: [],
																targets: [{
																	keys: [],
																	role: '',
																}],
															});
															setEACLParams(aECLParamsTemp);
														}}
													>
														Add rule
													</Button>
												</Panel.Block>
												<Button
													color="primary"
													onClick={() => onSetEACL(containerItem.containerId)}
													style={{
														display: 'flex',
														margin: '20px auto 0',
													}}
												>
													Update
												</Button>
											</Box>
										)}
									</Section>
									<Section>
										<Heading
											size={6}
											weight="bolder"
											onClick={() => activePanel === 'attributes' ? setActivePanel('') : setActivePanel('attributes')}
											style={{ cursor: 'pointer' }}
										>
											<img
												src={activePanel === 'attributes' ? './img/chevron_down.svg' : './img/chevron_right.svg'}
												style={{ marginRight: 10 }}
												width={12}
												height={12}
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
												if (!walletData.tokens.object.GET) {
													onPopup('signTokens', 'object.GET');
												} else if (activePanel === 'objects') {
													setActivePanel('');
												} else {
													onGetObjects(containerItem.containerId);
													setActivePanel('objects');
												}
											}}
											style={{ cursor: 'pointer' }}
										>
											<img
												src={activePanel === 'objects' ? './img/chevron_down.svg' : './img/chevron_right.svg'}
												style={{ marginRight: 10 }}
												width={12}
												height={12}
												alt="chevron"
											/>
											Objects
										</Heading>
										{activePanel === 'objects' && (
											<Box
												style={{
													marginTop: 15,
													border: '1px solid #dbdbdc',
													boxShadow: '0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 2%)',
												}}
											>
												<TreeView
													walletData={walletData}
													onPopup={onPopup}
													containerIndex={index}
													containerItem={containerItem}
													objects={objects}
												/>
												<Button
													color="primary"
													onClick={() => onPopup('createObject', { containerId: containerItem.containerId })}
													style={{ display: 'flex', margin: '20px auto 0' }}
												>
													New object
												</Button>
											</Box>
										)}
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
	);
}
