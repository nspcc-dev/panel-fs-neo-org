import React, { useState } from "react";
import {
	Heading,
	Section,
} from 'react-bulma-components';
import api from '../../api';

const Tree = ({ children }) => {
	return <div className="objects_tree">{children}</div>;
};

const Branch = ({
		params,
		objectPath,
		containerItem,
		containerChildren,
		walletData,
		onGetObjects,
		containerIndex,
		onModal,
		ContentTypeHeader,
		AuthorizationHeader,
		BearerOwnerIdHeader,
		BearerSignatureHeader,
		BearerSignatureKeyHeader,
	}) => {
	return (
		<Tree.Folder name={objectPath}>
			{Object.keys(containerChildren[objectPath]).length > 1 && Object.keys(containerChildren[objectPath]).map((objectPathNew) => ( objectPathNew !== '/' && (
				<Tree.Branch
					key={objectPathNew}
					params={params}
					objectPath={objectPathNew}
					walletData={walletData}
					onModal={onModal}
					containerItem={containerItem}
					containerChildren={containerChildren[objectPath]}
					containerIndex={containerIndex}
					onGetObjects={onGetObjects}
					ContentTypeHeader={ContentTypeHeader}
					AuthorizationHeader={AuthorizationHeader}
					BearerOwnerIdHeader={BearerOwnerIdHeader}
					BearerSignatureHeader={BearerSignatureHeader}
					BearerSignatureKeyHeader={BearerSignatureKeyHeader}
				/>
			)))}
			{containerChildren[objectPath]['/'] && containerChildren[objectPath]['/'].map((objectItem, objectIndex) => (
				<Tree.File
					key={`${objectItem.name}-${objectIndex}`}
					params={params}
					name={objectItem.name}
					containerItem={containerItem}
					objectItem={objectItem}
					walletData={walletData}
					onModal={onModal}
					ContentTypeHeader={ContentTypeHeader}
					AuthorizationHeader={AuthorizationHeader}
					BearerOwnerIdHeader={BearerOwnerIdHeader}
					BearerSignatureHeader={BearerSignatureHeader}
					BearerSignatureKeyHeader={BearerSignatureKeyHeader}
				/>
			))}
		</Tree.Folder>
	);
};

const Folder = ({ name, children }) => {
	const [isOpen, setIsOpen] = useState(true);

	const handleToggle = e => {
		e.preventDefault();
		setIsOpen(!isOpen);
	};

	return (
		<div className="objects_tree_folder">
			<div className="folder--label" onClick={handleToggle}>
				<img
					src="/img/folder.svg"
					width={15}
					alt="folder"
				/>
				<span>{name}</span>
			</div>
			<div
				className="folder_collapsible"
				style={isOpen ? { height: "auto" } : { height: 0 }}
			>{children}</div>
		</div>
	);
};

const File = ({
		params,
		name,
		containerItem,
		objectItem,
		walletData,
		onModal,
		ContentTypeHeader,
		AuthorizationHeader,
		BearerOwnerIdHeader,
		BearerSignatureHeader,
		BearerSignatureKeyHeader,
	}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [objectDate, setObjectDate] = useState(null);

	const handleToggle = e => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			api('GET', `/objects/${containerItem.containerId}/${objectItem.address.objectId}?walletConnect=true`, {}, {
				[ContentTypeHeader]: "application/json",
				[AuthorizationHeader]: `Bearer ${walletData.tokens.object.GET.token}`,
				[BearerOwnerIdHeader]: walletData.account,
				[BearerSignatureHeader]: walletData.tokens.object.GET.signature,
				[BearerSignatureKeyHeader]: walletData.publicKey,
			}).then((e) => {
				setObjectDate(e);
			});
		}
		e.preventDefault();
	};

	return (
		<div className="objects_tree_file">
			<div
				className="file--label"
				onClick={handleToggle}
			>
				<img
					src="/img/file.svg"
					width={10}
					alt="file"
					style={{ display: 'block' }}
				/>
				<span>{name}</span>
			</div>
			<div
				className="file_collapsible"
				style={isOpen ? { height: "auto" } : { height: 0 }}
			>
				<div className="objects_tree_file_content">
					{objectDate ? (
						<>
							<img
								src="/img/trashbin.svg"
								width={20}
								height={20}
								fill="#f14668"
								alt="delete"
								className="objects_tree_file_delete"
								onClick={(e) => {
									onModal('deleteObject', { containerId: containerItem.containerId, objectId: objectItem.address.objectId });
									e.stopPropagation();
								}}
							/>
							<Section>
								<Heading size={5} weight="bolder" style={{ color: '#00e599' }}>Information</Heading>
								<Heading size={6} weight="light" style={{ display: 'flex' }}>
									<span style={{ marginRight: 5 }}>{`Object id:`}</span>
									<div
										onClick={() => {
											onModal('loading');
											api('GET', `${params.http_gw}/get/${containerItem.containerId}/${objectItem.address.objectId}`, {}, {
												[ContentTypeHeader]: "application/json",
												[AuthorizationHeader]: `Bearer ${walletData.tokens.object.GET.bearer}`,
											}).then((data) => {
												if (data.header.indexOf("image/") !== -1 || data.header === 'text/plain; charset=utf-8') {
													const fileURL = URL.createObjectURL(data.res);
													window.open(fileURL, '_blank');
													onModal();
												} else {
													const a = document.createElement('a');
													document.body.appendChild(a);
													const url = window.URL.createObjectURL(data.res);
													a.href = url;
													a.download = name;
													a.target = '_blank';
													a.click();
													setTimeout(() => {
														onModal();
														window.URL.revokeObjectURL(url);
														document.body.removeChild(a);
													}, 0);
												}
											});
										}}
										style={{ textDecoration: 'underline', cursor: 'pointer' }}
									>{objectItem.address.objectId}</div>
								</Heading>
								<Heading size={6} weight="light">
									<span>{`Owner id: `}</span>
									{objectDate.ownerId}
								</Heading>
								<Heading size={6} weight="light">
									<span>{`Object size: `}</span>
									{objectDate.objectSize}
								</Heading>
							</Section>
							<Section style={{ paddingTop: 0 }}>
								<Heading size={5} weight="bolder" style={{ color: '#00e599' }}>Attributes</Heading>
								{objectDate.attributes.map((attribute) => (
									<Heading size={6} weight="light" key={attribute.key}>
										<span>{`${attribute.key}: `}</span>
										{attribute.value}
									</Heading>
								))}
							</Section>
						</>
					) : (
						<img
							className="modal_loader"
							src="/img/loader.svg"
							height={30}
							width={30}
							alt="loader"
						/>
					)}
				</div>
			</div>
		</div>
	);
};

Tree.File = File;
Tree.Folder = Folder;
Tree.Branch = Branch;

export default function TreeView({
	params,
	containerItem,
	walletData,
	onModal,
	containerIndex,
	onGetObjects,
	objects,
	ContentTypeHeader,
	AuthorizationHeader,
	BearerOwnerIdHeader,
	BearerSignatureHeader,
	BearerSignatureKeyHeader,
}) {
	return (
		<Tree>
			{objects && Object.keys(objects).map((objectPath, index) => (
				<div key={objectPath}>
					{objectPath !== '/' && (
						<Tree.Branch
							params={params}
							objectPath={objectPath}
							walletData={walletData}
							onModal={onModal}
							containerItem={containerItem}
							containerChildren={objects}
							containerIndex={containerIndex}
							onGetObjects={onGetObjects}
							ContentTypeHeader={ContentTypeHeader}
							AuthorizationHeader={AuthorizationHeader}
							BearerOwnerIdHeader={BearerOwnerIdHeader}
							BearerSignatureHeader={BearerSignatureHeader}
							BearerSignatureKeyHeader={BearerSignatureKeyHeader}
						/>
					)}
					{Object.keys(objects).length === (index + 1) && objects['/'] && objects['/'].map((objectItem, objectIndex) => (
						<Tree.File
							key={`${objectItem.name}-${objectIndex}`}
							params={params}
							name={objectItem.name}
							containerItem={containerItem}
							objectItem={objectItem}
							walletData={walletData}
							onModal={onModal}
							ContentTypeHeader={ContentTypeHeader}
							AuthorizationHeader={AuthorizationHeader}
							BearerOwnerIdHeader={BearerOwnerIdHeader}
							BearerSignatureHeader={BearerSignatureHeader}
							BearerSignatureKeyHeader={BearerSignatureKeyHeader}
						/>
					))}
				</div>
			))}
		</Tree>
	);
}
