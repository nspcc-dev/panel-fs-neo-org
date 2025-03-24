import React, { useState } from "react";
import {
	Heading,
	Section,
} from 'react-bulma-components';
import { formatBytes } from '../../Functions/handle';
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
				/>
			)))}
			{containerChildren[objectPath]['/'] && containerChildren[objectPath]['/'].map((objectItem, objectIndex) => (
				<Tree.File
					key={`${objectItem.name}-${objectIndex}`}
					name={objectItem.name}
					containerItem={containerItem}
					objectItem={objectItem}
					walletData={walletData}
					onModal={onModal}
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
					src="/img/icons/folder.svg"
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
		name,
		containerItem,
		objectItem,
		walletData,
		onModal,
	}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [objectDate, setObjectDate] = useState(null);

	const handleToggle = e => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			api('HEAD', `/objects/${containerItem.containerId}/by_id/${objectItem.address.objectId}`, {}, {
				"Authorization": `Bearer ${walletData.tokens.object.bearer}`,
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
					src="/img/icons/file.svg"
					width={10}
					alt="file"
					style={{ display: 'block' }}
				/>
				<span
					style={{
						WebkitLineClamp: '1',
						display: '-webkit-box',
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden'
					}}
				>{name}</span>
			</div>
			<div
				className="file_collapsible"
				style={isOpen ? { height: "auto" } : { height: 0 }}
			>
				<div className="objects_tree_file_content">
					{objectDate ? (
						<>
							<Section>
								<Heading size={5} weight="bolder" style={{ color: '#00e599' }}>Information</Heading>
								<Heading size={6} weight="light">
									<span>{`Object id: `}</span>
									{objectItem.address.objectId}
								</Heading>
								<Heading size={6} weight="light">
									<span>{`Owner id: `}</span>
									{objectDate.ownerId}
								</Heading>
								<Heading size={6} weight="light">
									<span>{`Object size: `}</span>
									{objectDate.objectSize ? formatBytes(objectDate.objectSize) : ''}
								</Heading>
							</Section>
							<Section style={{ paddingTop: 0 }}>
								<Heading size={5} weight="bolder" style={{ color: '#00e599' }}>Attributes</Heading>
								{objectDate ? (
									<>
										{Object.keys(objectDate.attributes).map((attributeKey) => (
											<Heading size={6} weight="light" key={attributeKey}>
												<span>{`${attributeKey}: `}</span>
												{objectDate.attributes[attributeKey]}
											</Heading>
										))}
										<Heading size={6} weight="light">
											<span>Content-Type: </span>
											{objectDate.contentType}
										</Heading>
									</>
								) : '-'}
							</Section>
							<Section style={{ paddingTop: 0 }}>
								<Heading size={5} weight="bolder" style={{ color: '#00e599' }}>Manage</Heading>
								{!window.OneGate && (
									<>
										<img
											src="/img/icons/manage/open.png"
											className="manage_icon"
											onClick={() => {
												onModal('loading');
												api('GET', `/objects/${containerItem.containerId}/by_id/${objectItem.address.objectId}`, {}, {
													"Authorization": `Bearer ${walletData.tokens.object.bearer}`,
												}).then((data) => {
													if (data.message) {
														onModal('failed', data.message);
													} else if (data.header.indexOf("image/") !== -1 || data.header === 'text/plain; charset=utf-8') {
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
											width={40}
											height={40}
											alt="get an object by bearer"
											title="get an object by bearer"
										/>
										<img
											src="/img/icons/manage/download.png"
											className="manage_icon"
											onClick={() => {
												onModal('loading');
												api('GET', `/objects/${containerItem.containerId}/by_id/${objectItem.address.objectId}`, {}, {
													"Authorization": `Bearer ${walletData.tokens.object.bearer}`,
												}).then((data) => {
													if (data.message) {
														onModal('failed', data.message);
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
											width={40}
											height={40}
											alt="download an object"
											title="download an object"
										/>
									</>
								)}
								<img
									src="/img/icons/manage/share.png"
									className="manage_icon"
									onClick={() => {
										onModal('loading');
										api('HEAD', `/objects/${containerItem.containerId}/by_id/${objectItem.address.objectId}`, {}, {
											"Authorization": `Bearer ${walletData.tokens.object.bearer}`,
										}).then((e) => {
											onModal('shareObjectLink', {
												type: e === 200 ? 'public' : 'private',
												containerId: containerItem.containerId,
												objectId: objectItem.address.objectId,
											});
										});
									}}
									width={40}
									height={40}
									alt="share an object"
									title="share an object"
								/>
								<img
									src="/img/icons/manage/delete.png"
									className="manage_icon"
									onClick={(e) => {
										onModal('deleteObject', { containerId: containerItem.containerId, objectId: objectItem.address.objectId });
										e.stopPropagation();
									}}
									width={40}
									height={40}
									alt="delete an object"
									title="delete an object"
								/>
							</Section>
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
				</div>
			</div>
		</div>
	);
};

Tree.File = File;
Tree.Folder = Folder;
Tree.Branch = Branch;

export default function TreeView({
	containerItem,
	walletData,
	onModal,
	containerIndex,
	onGetObjects,
	objects,
}) {
	return (
		<Tree>
			{objects && Object.keys(objects).map((objectPath, index) => (
				<div key={objectPath}>
					{objectPath !== '/' && (
						<Tree.Branch
							objectPath={objectPath}
							walletData={walletData}
							onModal={onModal}
							containerItem={containerItem}
							containerChildren={objects}
							containerIndex={containerIndex}
							onGetObjects={onGetObjects}
						/>
					)}
					{Object.keys(objects).length === (index + 1) && objects['/'] && objects['/'].map((objectItem, objectIndex) => (
						<Tree.File
							key={`${objectItem.name}-${objectIndex}`}
							name={objectItem.name}
							containerItem={containerItem}
							objectItem={objectItem}
							walletData={walletData}
							onModal={onModal}
						/>
					))}
				</div>
			))}
		</Tree>
	);
}
