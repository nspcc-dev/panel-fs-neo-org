import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
	Container,
	Section,
	Heading,
	Button,
	Columns,
	Box,
} from 'react-bulma-components';
import {
	formatBytes,
} from './Functions/handle';
import api from './api';

const Getobject = ({
		onModal,
		walletData,
		onAuth,
	}) => {
	const [searchParams] = useSearchParams();
	const [objectData, setObjectData] = useState(null);
	const [objectStatus, setObjectStatus] = useState('Loading');
	const [params, setParams] = useState(null);
	const objectAccessData = walletData?.tokens?.sharedObjectAccess?.OBJECT_ACCESS;
	const objectAccessToken = objectAccessData?.containerId === params?.containerId ? objectAccessData?.token : null;

	useEffect(() => {
		const token = searchParams.get('token') ? searchParams.get('token').replace(/ /g, '+') : '';
		const containerId = searchParams.get('cid');
		const objectId = searchParams.get('oid');
		const isAuth = searchParams.get('auth');
		setParams({ token, containerId, objectId, isAuth });

		if (isAuth) {
			setObjectStatus('Not authorized');
		} else {
			onHeadObject(containerId, objectId, token);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (walletData && params?.isAuth) {
			if (objectAccessToken) {
				onHeadObject(params.containerId, params.objectId, objectAccessToken, params.token);
			} else {
				setObjectStatus('Allow access');
			}
		}
	}, [walletData, params, objectAccessToken]); // eslint-disable-line react-hooks/exhaustive-deps

	const onHeadObject = (containerId, objectId, token, bearer = null) => {
		const payload = {};
		if (token) {
			payload["Authorization"] = `Bearer ${token}`;
		}
		if (bearer) {
			payload["NeoFS-Bearer-Token"] = bearer;
		}
		api('HEAD', `/v1/objects/${containerId}/by_id/${objectId}`, {}, payload).then((e) => {
			if (e === 400 || e === 404) {
				setObjectStatus('Not found');
			} else if (e === 403) {
				setObjectStatus('Forbidden');
			} else if (e.message) {
				setObjectStatus('Forbidden');
				onModal('failed', e.message);
			} else {
				setObjectStatus('Available');
				setObjectData(e);
			}
		});
	}

	const onDownload = () => {
		onModal('loading');

		const payload = {};
		if (params.isAuth && objectAccessToken) {
			payload["Authorization"] = `Bearer ${objectAccessToken}`;
		} else if (params.token) {
			payload["Authorization"] = `Bearer ${params.token}`;
		}
		if (params.isAuth && params.token) {
			payload["NeoFS-Bearer-Token"] = params.token;
		}
		api('GET', `/v1/objects/${params.containerId}/by_id/${params.objectId}`, {}, payload).then((data) => {
			if (data.message) {
				onModal('failed', data.message);
			} else {
				const a = document.createElement('a');
				document.body.appendChild(a);
				const url = window.URL.createObjectURL(data.res);
				a.href = url;
				a.download = objectData.filename ? objectData.filename : params.objectId;
				a.target = '_blank';
				a.click();
				setTimeout(() => {
					onModal();
					window.URL.revokeObjectURL(url);
					document.body.removeChild(a);
				}, 0);
			}
		});
	};

	return (
		<Container style={{ minHeight: 'calc(100vh - 212px)' }}>
			{params && params.containerId && params.objectId && objectStatus !== 'Loading' ? (
				<Section>
					{objectStatus !== 'Available' ? (
						<Box id="share">
							<Heading weight="bold" align="center">{objectStatus}</Heading>
							{objectStatus === 'Not authorized' && (
								<Button
									renderAs="button"
									color="primary"
									style={{ margin: '20px auto 0', display: 'flex' }}
									onClick={() => onModal('authMethods')}
								>
									Sign in
								</Button>
							)}
							{objectStatus === 'Allow access' && (
								<Columns.Column>
									<div className="token_status_panel">
										<Heading size={6} style={{ margin: '0 10px 0 0' }}>Sign token to unlock object&nbsp;operations</Heading>
										{objectAccessToken ? (
											<img
												src="/img/icons/success.svg"
												height={25}
												width={25}
												alt="success"
										/>
									) : (
											<Button
												renderAs="button"
												color="primary"
												size="small"
												onClick={() => onAuth('sharedObjectAccess', 'OBJECT_ACCESS', { containerId: params.containerId })}
											>
												Sign
											</Button>
										)}
									</div>
								</Columns.Column>
							)}
						</Box>
					) : (
						<Box id="share">
							<Heading weight="bold">Sharing object</Heading>
							<div className="objects_tree_file_content">
								<Section>
									<Heading size={5} weight="bolder" style={{ color: '#00e599' }}>Information</Heading>
									<Heading size={6} weight="light">
										<span>{`Container id: `}</span>
										{params.containerId}
									</Heading>
									<Heading size={6} weight="light">
										<span>{`Object id: `}</span>
										{params.objectId}
									</Heading>
									{objectData && (
										<>
											<Heading size={6} weight="light">
												<span>{`Owner id: `}</span>
												{objectData.ownerId}
											</Heading>
											<Heading size={6} weight="light">
												<span>{`Object size: `}</span>
												{formatBytes(objectData.objectSize)}
											</Heading>
										</>
									)}
								</Section>
								<Section style={{ paddingTop: 0 }}>
									<Heading size={5} weight="bolder" style={{ color: '#00e599' }}>Attributes</Heading>
									{objectData ? (
										<>
											{Object.keys(objectData.attributes || {}).map((attributeKey) => (
												<Heading size={6} weight="light" key={attributeKey}>
													<span>{`${attributeKey}: `}</span>
													{objectData.attributes[attributeKey]}
												</Heading>
											))}
											<Heading size={6} weight="light">
												<span>Content-Type: </span>
												{objectData.contentType}
											</Heading>
										</>
									) : '-'}
								</Section>
								<Section style={{ paddingTop: 0 }}>
									<Heading size={5} weight="bolder" style={{ color: '#00e599' }}>Manage</Heading>
									{objectData ? (
										<img
											src="/img/icons/manage/download.png"
											className="manage_icon"
											onClick={onDownload}
											width={40}
											height={40}
											alt="download an object"
											title="download an object"
										/>
									) : '-'}
								</Section>
							</div>
						</Box>
					)}
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

export default Getobject;
