import React, { useState, useEffect } from "react";
import {
	Heading,
	Button,
	Box,
	Notification,
	Panel,
	Form,
} from 'react-bulma-components';
import api from '../../api';

export default function EACLPanel({
	walletData,
	onAuth,
	containerItem,
	setLoadContainers,
	eACLParams,
	setEACLParams,
	isEdit = true,
	isErrorParent,
}) {
	const [isError, setError] = useState(false);
	const [isLoadingForm, setLoadingForm] = useState(false);
	const [dragAndDropEACLParams, setDragAndDropEACLParams] = useState({
		draggedFrom: null,
		draggedTo: null,
		isDragging: false,
		originalOrder: [],
		updatedOrder: [],
	});

	useEffect(() => {
		setError({ active: false, type: [], text: '' });
	}, []);

	useEffect(() => {
		if (isErrorParent) {
			setError(isErrorParent);
		}
	}, [isErrorParent]);

	const onSetEACL = (containerId) => {
		if (eACLParams.every((eACLItem) => eACLItem.operation !== '' && eACLItem.action !== '' && (eACLItem.targets[0]?.role !== '' || eACLItem.targets[0].accounts?.length > 0) && eACLItem.filters.every((filterItem) => filterItem.headerType !== '' && filterItem.matchType !== '' && filterItem.key !== '' && filterItem.value !== ''))) {
			setError({ active: false, type: [], text: '' });
			setLoadingForm(true);
			api('PUT', `/v1/containers/${containerId}/eacl?walletConnect=true`, {
				"records": eACLParams.filter((item) => delete item.isOpen),
			}, {
				"Authorization": `Bearer ${walletData.tokens.container.SETEACL.token}`,
				"X-Bearer-Owner-Id": walletData.account.address,
				"X-Bearer-Signature": walletData.tokens.container.SETEACL.signature,
				"X-Bearer-Signature-Key": walletData.publicKey,
			}).then((e) => {
				setLoadingForm(false);
				if (e.message) {
					setError({ active: true, type: ['eacl'], text: e.message });
				} else {
					setLoadContainers(true);
				}
			});
		} else {
			setError({ active: true, type: ['eacl'], text: 'Please fill in all required fields.' });
		}
	};

	const onDragStart = (event) => {
		setDragAndDropEACLParams({
		 ...dragAndDropEACLParams,
		 draggedFrom: Number(event.currentTarget.dataset.position),
		 isDragging: true,
		 originalOrder: eACLParams,
		});
		event.dataTransfer.setData("text/html", '');
	 }

	const onDragOver = (event) => {
		event.preventDefault();

		const draggedTo = Number(event.currentTarget.dataset.position);
		if (draggedTo !== dragAndDropEACLParams.draggedTo) {
			let newList = dragAndDropEACLParams.originalOrder;
			const draggedFrom = dragAndDropEACLParams.draggedFrom;
			const remainingItems = newList.filter((item, index) => index !== draggedFrom);
			newList = [
				...remainingItems.slice(0, draggedTo),
				newList[draggedFrom],
				...remainingItems.slice(draggedTo),
			];

			setDragAndDropEACLParams({
				...dragAndDropEACLParams,
				updatedOrder: newList,
				draggedTo: draggedTo,
			});
			setEACLParams(newList);
		}
	}

	const onDrop = () => {
		setDragAndDropEACLParams({ ...dragAndDropEACLParams, draggedFrom: null, draggedTo: null, isDragging: false });
	}

	const onDragLeave = () => {
		setDragAndDropEACLParams({ ...dragAndDropEACLParams, draggedTo: null });
	}

	return (
		<Box
			style={{
				marginTop: 10,
				padding: 0,
				border: '1px solid #dfe3e3',
				boxShadow: 'unset',
			}}
		>
			{eACLParams.map((eACLItem, index) => (
				<Panel.Block
					active
					renderAs="a"
					key={index}
					data-position={index}
					className={dragAndDropEACLParams && dragAndDropEACLParams.draggedTo === Number(index) ? "drop_area" : ""}
					onDragStart={onDragStart}
					onDragOver={onDragOver}
					onDragLeave={onDragLeave}
					onDrop={onDrop}
					draggable
				>
					<div
						className="panel-block-header"
						onClick={() => {
							const aECLParamsTemp = [...eACLParams];
							aECLParamsTemp[index].isOpen = !aECLParamsTemp[index].isOpen;
							setEACLParams(aECLParamsTemp);
						}}
					>
						<img
							src="/img/icons/drag2drop.svg"
							className="drag2drop"
							alt="drag and drop"
						/>
						<Panel.Icon>
							<img
								src={eACLItem.isOpen ? '/img/icons/chevron_down.svg' : '/img/icons/chevron_right.svg'}
								style={{ marginRight: 10 }}
								width={22}
								height={22}
								alt="chevron"
							/>
						</Panel.Icon>
						{`Rule #${index + 1} ${eACLItem.operation && eACLItem.action && (eACLItem.targets[0].role || eACLItem.targets[0].accounts) ? `(${eACLItem.operation}-${eACLItem.action}-${eACLItem.targets[0].role ? eACLItem.targets[0].role : 'ACCOUNTS'})` : ''}`}
						{eACLItem.isOpen && isEdit && (
							<Panel.Icon>
								<img
									src="/img/icons/trashbin.svg"
									width={18}
									height={18}
									alt="delete"
									style={{ cursor: 'pointer', position: 'absolute', right: 0, top: 0 }}
									onClick={(e) => {
										if (!isLoadingForm) {
											const aECLParamsTemp = [...eACLParams];
											aECLParamsTemp.splice(index, 1);
											setEACLParams(aECLParamsTemp);
											e.stopPropagation();
										}
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
										renderAs="select"
										value={eACLItem.operation}
										className={isError.active && isError.type.indexOf('eacl') !== -1 && eACLItem.operation.length === 0 ? 'is-error' : ""}
										onChange={(e) => {
											const aECLParamsTemp = [...eACLParams];
											aECLParamsTemp[index].operation = e.target.value;
											setEACLParams(aECLParamsTemp);
										}}
										disabled={!isEdit || isLoadingForm}
									>
										<option value="" disabled>Operation</option>
										{['PUT', 'GET', 'HEAD', 'DELETE', 'SEARCH', 'RANGE', 'RANGEHASH'].map((item) => (
											<option value={item} key={item}>{item}</option>
										))}
									</Form.Select>
								</Form.Control>
								<Form.Control>
									<Form.Select
										renderAs="select"
										value={eACLItem.action}
										className={isError.active && isError.type.indexOf('eacl') !== -1 && eACLItem.action.length === 0 ? 'is-error' : ""}
										onChange={(e) => {
											const aECLParamsTemp = [...eACLParams];
											aECLParamsTemp[index].action = e.target.value;
											setEACLParams(aECLParamsTemp);
										}}
										disabled={!isEdit || isLoadingForm}
									>
										<option value="" disabled>Action</option>
										{['ALLOW', 'DENY'].map((item) => (
											<option value={item} key={item}>{item}</option>
										))}
									</Form.Select>
								</Form.Control>
								<Form.Control>
									<Form.Select
										renderAs="select"
										value={eACLItem.targets[0].role ? eACLItem.targets[0].role : 'ACCOUNTS'}
										className={isError.active && isError.type.indexOf('eacl') !== -1 && eACLItem.targets[0].role?.length === 0 ? 'is-error' : ""}
										onChange={(e) => {
											const aECLParamsTemp = [...eACLParams];
											aECLParamsTemp[index].targets = [e.target.value === 'ACCOUNTS' ? { accounts: [] } : { role: e.target.value }];
											setEACLParams(aECLParamsTemp);
										}}
										disabled={!isEdit || isLoadingForm}
									>
										<option value="" disabled>Role</option>
										{['USER', 'SYSTEM', 'OTHERS', 'ACCOUNTS'].map((item) => (
											<option value={item} key={item}>{item}</option>
										))}
									</Form.Select>
								</Form.Control>
							</Form.Field>
							{eACLItem.targets[0].accounts && (
								<Form.Field>
									<Form.Control>
										<Form.Input
											renderAs="input"
											placeholder="Enter comma separated account addresses"
											value={eACLItem.targets[0]?.accounts?.join(',')}
											className={isError.active && isError.type.indexOf('eacl') !== -1 && eACLItem.targets[0].accounts.length === 0 ? 'is-error' : ""}
											onChange={(e) => {
												const aECLParamsTemp = [...eACLParams];
												aECLParamsTemp[index].targets[0].accounts = e.target.value.split(',').map(item => item.trim());
												setEACLParams(aECLParamsTemp);
											}}
											disabled={!isEdit || isLoadingForm}
										/>
									</Form.Control>
								</Form.Field>
							)}
							{isEdit && (
								<Heading
									align="center"
									weight="normal"
									size={6}
									style={{
										marginBottom: '10px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									Filters
									<Button
										renderAs="button"
										color="primary"
										size="small"
										onClick={() => {
											if (!isLoadingForm) {
												let aECLParamsTemp = [...eACLParams];
												aECLParamsTemp[index].filters.push({
													headerType: "",
													matchType: "",
													key: "",
													value: ""
												});
												setEACLParams(aECLParamsTemp);
											}
										}}
									>
										Add filter
									</Button>
								</Heading>
							)}
							{eACLItem.filters.map((filterItem, filterIndex) => (
								<Form.Field className="panel-block-content" kind="group" key={filterIndex}>
									<Form.Control>
										<Form.Select
											renderAs="select"
											value={filterItem.headerType}
											className={isError.active && isError.type.indexOf('eacl') !== -1 && filterItem.headerType.length === 0 ? 'is-error' : ""}
											onChange={(e) => {
												const aECLParamsTemp = [...eACLParams];
												aECLParamsTemp[index].filters[filterIndex].headerType = e.target.value;
												setEACLParams(aECLParamsTemp);
											}}
											disabled={!isEdit || isLoadingForm}
										>
											<option value="" disabled>headerType</option>
											{['REQUEST', 'OBJECT', 'SERVICE'].map((item) => (
												<option value={item} key={item}>{item}</option>
											))}
										</Form.Select>
									</Form.Control>
									<Form.Control>
										<Form.Select
											renderAs="select"
											value={filterItem.matchType}
											className={isError.active && isError.type.indexOf('eacl') !== -1 && filterItem.matchType.length === 0 ? 'is-error' : ""}
											onChange={(e) => {
												const aECLParamsTemp = [...eACLParams];
												aECLParamsTemp[index].filters[filterIndex].matchType = e.target.value;
												setEACLParams(aECLParamsTemp);
											}}
											disabled={!isEdit || isLoadingForm}
										>
											<option value="" disabled>matchType</option>
											{['STRING_EQUAL', 'STRING_NOT_EQUAL'].map((item) => (
												<option value={item} key={item}>{item}</option>
											))}
										</Form.Select>
									</Form.Control>
									<Form.Control>
										<Form.Input
											renderAs="input"
											placeholder="Key"
											value={filterItem.key}
											className={isError.active && isError.type.indexOf('eacl') !== -1 && filterItem.key.length === 0 ? 'is-error' : ""}
											onChange={(e) => {
												const aECLParamsTemp = [...eACLParams];
												aECLParamsTemp[index].filters[filterIndex].key = e.target.value;
												setEACLParams(aECLParamsTemp);
											}}
											disabled={!isEdit || isLoadingForm}
										/>
									</Form.Control>
									<Form.Control>
										<Form.Input
											renderAs="input"
											placeholder="Value"
											value={filterItem.value}
											className={isError.active && isError.type.indexOf('eacl') !== -1 && filterItem.value.length === 0 ? 'is-error' : ""}
											onChange={(e) => {
												const aECLParamsTemp = [...eACLParams];
												aECLParamsTemp[index].filters[filterIndex].value = e.target.value;
												setEACLParams(aECLParamsTemp);
											}}
											disabled={!isEdit || isLoadingForm}
										/>
									</Form.Control>
									{isEdit && (
										<img
											src="/img/icons/trashbin.svg"
											width={18}
											height={18}
											alt="delete"
											style={{ cursor: 'pointer', right: 0, top: 0 }}
											onClick={() => {
												if (!isLoadingForm) {
													const aECLParamsTemp = [...eACLParams];
													aECLParamsTemp[index].filters.splice(filterIndex, 1);
													setEACLParams(aECLParamsTemp);
												}
											}}
										/>
									)}
								</Form.Field>
							))}
						</div>
					)}
				</Panel.Block>
			))}
			{isEdit && (
				<Panel.Block>
					<Button
						renderAs="button"
						fullwidth
						color="primary"
						size="small"
						onClick={() => {
							let aECLParamsTemp = [...eACLParams];
							aECLParamsTemp.push({
								operation: "",
								action: "",
								isOpen: true,
								filters: [],
								targets: [{
									role: '',
								}],
							});
							setEACLParams(aECLParamsTemp);
						}}
						disabled={!isEdit || isLoadingForm}
					>
						Add rule
					</Button>
				</Panel.Block>
			)}
			{isError.active && !isErrorParent && (
				<Notification className="error_message">
					{isError.text}
				</Notification>
			)}
			{walletData && (
				<>
					{!walletData.tokens.container.SETEACL ? (
						<div className="token_status_panel" style={{ margin: '15px auto' }}>
							<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock eACL&nbsp;management</Heading>
							<Button
								renderAs="button"
								color="primary"
								size="small"
								onClick={() => onAuth('container', 'SETEACL')}
							>
								Sign
							</Button>
						</div>
					) : (
						<Button
							renderAs="button"
							color="primary"
							onClick={() => onSetEACL(containerItem.containerId)}
							style={isLoadingForm ? {
								display: 'flex',
								margin: '20px auto',
								pointerEvents: 'none',
								opacity: 0.8,
							} : {
								display: 'flex',
								margin: '20px auto',
							}}
						>
							{isLoadingForm ? (
								<img
									src="/img/icons/spinner.svg"
									className="spinner"
									width={20}
									height={20}
									alt="spinner"
								/>
							) : "Update"}
						</Button>
					)}
				</>
			)}
		</Box>
	);
}
