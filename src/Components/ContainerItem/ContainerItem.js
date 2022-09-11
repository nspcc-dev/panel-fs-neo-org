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
} from 'react-bulma-components';
import TreeView from '../TreeView/TreeView';
import {
	formatForTreeView,
	formatForContainerName,
} from '../../Functions/handle';
import api from '../../api';

export default function ContainerItem({
	containerItem,
	walletData,
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
	const [eACLParams, setEACLParams] = useState([]);
	const [activePanel, setActivePanel] = useState('');
	const [isSending, setSending] = useState(false);
	const [isLoadingForm, setLoadingForm] = useState(false);

	useEffect(() => {
		if (isLoadContainers === containerItem.containerId) {
			onGetObjects(isLoadContainers);
			setLoadContainers(false);
			onModal();
		}
	}, [isLoadContainers]); // eslint-disable-line react-hooks/exhaustive-deps

	const onGetObjects = (containerId) => {
		api('POST', `/objects/${containerId}/search?walletConnect=true`, {
			"filters": [],
		}, {
			[ContentTypeHeader]: "application/json",
			[AuthorizationHeader]: `Bearer ${walletData.tokens.object.GET.token}`,
			[BearerOwnerIdHeader]: walletData.account,
			[BearerSignatureHeader]: walletData.tokens.object.GET.signature,
			[BearerSignatureKeyHeader]: walletData.publicKey,
		}).then((e) => {
			setObjects(e.objects ? formatForTreeView(e.objects) : []);
		});
	};

	const onGetEACL = (containerId) => {
		if (walletData.tokens.container.SETEACL) {
			onModal('loading');
			api('GET', `/containers/${containerId}/eacl?walletConnect=true`, {}, {
				[ContentTypeHeader]: "application/json",
				[AuthorizationHeader]: `Bearer ${walletData.tokens.container.SETEACL.token}`,
				[BearerOwnerIdHeader]: walletData.account,
				[BearerSignatureHeader]: walletData.tokens.container.SETEACL.signature,
				[BearerSignatureKeyHeader]: walletData.publicKey,
			}).then((e) => {
				onModal();
				if (e.records) {
					setEACLParams(e.records);
				}
			});
		} else {
			onModal('signTokens', 'container.SETEACL');
		}
	};

	const onSetEACL = (containerId) => {
		if (eACLParams.every((eACLItem) => eACLItem.operation !== '' && eACLItem.action !== '' && eACLItem.targets[0].role !== '' && eACLItem.filters.every((filterItem) => filterItem.headerType !== '' && filterItem.matchType !== '' && filterItem.key !== '' && filterItem.value !== ''))) {
			setSending(false);
			setLoadingForm(true);
			api('PUT', `/containers/${containerId}/eacl?walletConnect=true`, {
				"records": eACLParams.filter((item) => delete item.isOpen),
			}, {
				[ContentTypeHeader]: "application/json",
				[AuthorizationHeader]: `Bearer ${walletData.tokens.container.SETEACL.token}`,
				[BearerOwnerIdHeader]: walletData.account,
				[BearerSignatureHeader]: walletData.tokens.container.SETEACL.signature,
				[BearerSignatureKeyHeader]: walletData.publicKey,
			}).then((e) => {
				setLoadingForm(false);
				if (e.message) {
					onPopup('failed', e.message);
				} else {
					setLoadContainers(true);
				}
			});
		} else {
			setSending(true);
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
												{attribute.key === 'Timestamp' ? `${new Date(attribute.value * 1000).toISOString()}` : attribute.value}
											</Heading>
										)))}
									</Section>
									<Section>
										<Heading
											size={6}
											weight="bolder"
											onClick={() => {
												if (!walletData.tokens.container.SETEACL) {
													onModal('signTokens', 'container.SETEACL');
												} else if (activePanel === 'eACL') {
													setActivePanel('');
													setSending(false);
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
																			className={isSending && eACLItem.operation === '' ? 'is-error' : ""}
																			onChange={(e) => {
																				const aECLParamsTemp = [...eACLParams];
																				aECLParamsTemp[index].operation = e.target.value;
																				setEACLParams(aECLParamsTemp);
																			}}
																		>
																			<option value="" disabled>Operation</option>
																			{['PUT', 'GET', 'HEAD', 'DELETE', 'SEARCH', 'RANGE', 'RANGEHASH'].map((item) => (
																				<option value={item} key={item}>{item}</option>
																			))}
																		</Form.Select>
																	</Form.Control>
																	<Form.Control>
																		<Form.Select
																			value={eACLItem.action}
																			className={isSending && eACLItem.action === '' ? 'is-error' : ""}
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
																			className={isSending && eACLItem.targets[0].role === '' ? 'is-error' : ""}
																			onChange={(e) => {
																				const aECLParamsTemp = [...eACLParams];
																				aECLParamsTemp[index].targets[0].role = e.target.value;
																				setEACLParams(aECLParamsTemp);
																			}}
																		>
																			<option value="" disabled>Role</option>
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
																				className={isSending && filterItem.headerType === '' ? 'is-error' : ""}
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
																				className={isSending && filterItem.matchType === '' ? 'is-error' : ""}
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
																				className={isSending && filterItem.key === '' ? 'is-error' : ""}
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
																				className={isSending && filterItem.value === '' ? 'is-error' : ""}
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
												{isSending && !(eACLParams.every((eACLItem) => eACLItem.operation !== '' && eACLItem.action !== '' && eACLItem.targets[0].role !== '' && eACLItem.filters.every((filterItem) => filterItem.headerType !== '' && filterItem.matchType !== '' && filterItem.key !== '' && filterItem.value !== ''))) && (
													<Notification className="error_message">
														Please fill in all required fields
													</Notification>
												)}
												<Button
													color="primary"
													onClick={() => onSetEACL(containerItem.containerId)}
													style={isLoadingForm ? {
														display: 'flex',
														margin: '20px auto 0',
														pointerEvents: 'none',
														opacity: 0.8,
													} : {
														display: 'flex',
														margin: '20px auto 0',
													}}
												>
													{isLoadingForm ? (
														<img
															src="./img/spinner.svg"
															className="spinner"
															width={20}
															height={20}
															alt="spinner"
														/>
													) : "Update"}
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
													onModal('signTokens', 'object.GET');
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
												<Button
													color="primary"
													onClick={() => onModal('createObject', { containerId: containerItem.containerId })}
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
									className="modal_loader"
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
