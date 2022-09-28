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

export default function ContainerItem({
	walletData,
	containerItem,
	setLoadContainers,
	eACLParams,
	setEACLParams,
	ContentTypeHeader,
	AuthorizationHeader,
	BearerOwnerIdHeader,
	BearerSignatureHeader,
	BearerSignatureKeyHeader,
	isEdit = true,
	isErrorParent,
}) {
	const [isError, setError] = useState(false);
	const [isLoadingForm, setLoadingForm] = useState(false);

	useEffect(() => {
		setError({ active: false, type: [], text: '' });
	}, []);

	useEffect(() => {
		if (isErrorParent) {
			setError(isErrorParent);
		}
	}, [isErrorParent]);

	const onSetEACL = (containerId) => {
		if (eACLParams.every((eACLItem) => eACLItem.operation !== '' && eACLItem.action !== '' && eACLItem.targets[0].role !== '' && eACLItem.filters.every((filterItem) => filterItem.headerType !== '' && filterItem.matchType !== '' && filterItem.key !== '' && filterItem.value !== ''))) {
			setError({ active: false, type: [], text: '' });
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
					setError({ active: true, type: ['eacl'], text: e.message });
				} else {
					setLoadContainers(true);
				}
			});
		} else {
			setError({ active: true, type: ['eacl'], text: 'Please fill in all required fields.' });
		}
	};

	return (
		<Box
			style={walletData ? {
				marginTop: 10,
				padding: '0 0 1.25rem 0',
				border: '1px solid #dbdbdc',
				boxShadow: '0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 2%)',
			} : {
				marginTop: 10,
				padding: '0 0 0 0',
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
						{eACLItem.isOpen && isEdit && (
							<Panel.Icon>
								<img
									src="./img/trashbin.svg"
									width={25}
									height={25}
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
										value={eACLItem.targets[0].role}
										className={isError.active && isError.type.indexOf('eacl') !== -1 && eACLItem.targets[0].role.length === 0 ? 'is-error' : ""}
										onChange={(e) => {
											const aECLParamsTemp = [...eACLParams];
											aECLParamsTemp[index].targets[0].role = e.target.value;
											setEACLParams(aECLParamsTemp);
										}}
										disabled={!isEdit || isLoadingForm}
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
											src="./img/trashbin.svg"
											width={25}
											height={25}
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
							{isEdit && (
								<Button
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
									style={{ display: 'flex', margin: 'auto' }}
								>
									Add filter
								</Button>
							)}
						</div>
					)}
				</Panel.Block>
			))}
			<Panel.Block>
				<Button
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
								keys: [],
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
			{isError.active && !isErrorParent && (
				<Notification className="error_message">
					{isError.text}
				</Notification>
			)}
			{walletData && (
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
			)}
		</Box>
	);
}
