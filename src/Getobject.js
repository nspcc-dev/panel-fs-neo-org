import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
	Container,
	Section,
	Heading,
	Box,
} from 'react-bulma-components';
import api from './api';

const Getobject = ({
		onModal,
		formatBytes,
		ContentTypeHeader,
		AuthorizationHeader,
	}) => {
	const [searchParams] = useSearchParams();
	const [objectData, setObjectData] = useState(null);
	const [params, setParams] = useState(null);

	useEffect(() => {
		const token = searchParams.get('token') ? searchParams.get('token').replace(/ /g, '+') : '';
		const containerId = searchParams.get('cid');
		const objectId = searchParams.get('oid');
		setParams({ token, containerId, objectId });

		const payload = {};
		if (token) {
			payload[ContentTypeHeader] = "application/json";
			payload[AuthorizationHeader] = `Bearer ${token}`;
		}
		api('GET', `/objects/${containerId}/${objectId}?fullBearer=true`, {}, payload).then((e) => {
			if (e.message) {
				onModal('failed', e.message);
			} else {
				setObjectData(e);
			}
		});
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const onDownload = () => {
		onModal('loading');

		const payload = {};
		if (params.token) {
			payload[ContentTypeHeader] = "application/json";
			payload[AuthorizationHeader] = `Bearer ${params.token}`;
		}
		api('GET', `/get/${params.containerId}/${params.objectId}`, {}, payload).then((data) => {
			if (data.message) {
				onModal('failed', data.message);
			} else {
				const a = document.createElement('a');
				document.body.appendChild(a);
				const url = window.URL.createObjectURL(data.res);
				a.href = url;
				a.download = objectData['x-attribute-filename'] ? objectData['x-attribute-filename'] : params.objectId;
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
		<Container style={{ minHeight: 'calc(100vh - 217px)' }}>
			{params && params.containerId && params.objectId ? (
				<Section>
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
								{objectData ? objectData.attributes.map((attribute) => (
									<Heading size={6} weight="light" key={attribute.key}>
										<span>{`${attribute.key}: `}</span>
										{attribute.value}
									</Heading>
								)) : '-'}
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
