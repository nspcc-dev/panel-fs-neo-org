import React, { useEffect, useState } from 'react';
import {
	useParams,
	useSearchParams,
} from 'react-router-dom';
import {
	Container,
	Section,
	Heading,
	Box,
} from 'react-bulma-components';
import api from './api';

const Share = ({
		onModal,
		formatBytes,
		ContentTypeHeader,
		AuthorizationHeader,
	}) => {
	const { containerId, objectId } = useParams();
	const [searchParams] = useSearchParams();
	const [objectData, setObjectData] = useState(null);
	const [token, setToken] = useState(null);

	useEffect(() => {
		const token = searchParams.get('token').replace(/ /g, '+');
		setToken(token);

		api('GET', `/objects/${containerId}/${objectId}?fullBearer=true`, {}, {
			[ContentTypeHeader]: "application/json",
			[AuthorizationHeader]: `Bearer ${token}`,
		}).then((e) => {
			if (e.message) {
				onModal('failed', e.message);
			} else {
				setObjectData(e);
			}
		});
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const onDownload = () => {
		onModal('loading');
		api('GET', `/get/${containerId}/${objectId}`, {}, {
			[ContentTypeHeader]: "application/json",
			[AuthorizationHeader]: `Bearer ${token}`,
		}).then((data) => {
			if (data.message) {
				onModal('failed', data.message);
			} else {
				const a = document.createElement('a');
				document.body.appendChild(a);
				const url = window.URL.createObjectURL(data.res);
				a.href = url;
				a.download = objectData['x-attribute-filename'] ? objectData['x-attribute-filename'] : objectId;
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
			{containerId && objectId ? (
				<Section>
					<Box id="share">
						<Heading weight="bold">Sharing object</Heading>
						<div className="objects_tree_file_content">
							<Section>
								<Heading size={5} weight="bolder" style={{ color: '#00e599' }}>Information</Heading>
								<Heading size={6} weight="light">
									<span>{`Container id: `}</span>
									{containerId}
								</Heading>
								<Heading size={6} weight="light">
									<span>{`Object id: `}</span>
									{objectId}
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

export default Share;
