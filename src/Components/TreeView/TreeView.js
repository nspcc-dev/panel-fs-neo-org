import React, { useState } from "react";
import {
	Heading,
	Section,
} from 'react-bulma-components';
import api from '../../api';

const Tree = ({ children }) => {
  return <div className="objects_tree">{children}</div>;
};

const Branch = ({ objectPath, containerItem, containerChildren, walletData, onGetObjectData, containerIndex, onPopup }) => {
  return (
		<Tree.Folder name={objectPath}>
			{Object.keys(containerChildren[objectPath]).length > 1 && Object.keys(containerChildren[objectPath]).map((objectPathNew) => ( objectPathNew !== 'children' && (
				<Tree.Branch
					key={objectPathNew}
					objectPath={objectPathNew}
					walletData={walletData}
					onPopup={onPopup}
					containerItem={containerItem}
					containerChildren={containerChildren[objectPath]}
					containerIndex={containerIndex}
					onGetObjectData={onGetObjectData}
				/>
			)))}
			{containerChildren[objectPath].children && containerChildren[objectPath].children.map((objectItem, objectIndex) => (
				<Tree.File
					key={`${objectItem.name}-${objectIndex}`}
					name={objectItem.name}
					containerItem={containerItem}
					objectItem={objectItem}
					walletData={walletData}
					onPopup={onPopup}
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
					src="./img/folder.svg"
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

const File = ({ name, containerItem, objectItem, walletData, onPopup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [objectDate, setObjectDate] = useState(null);

	const handleToggle = e => {
    setIsOpen(!isOpen);
		if (!isOpen) {
			api('GET', `/objects/${containerItem.containerId}/${objectItem.address.objectId}?walletConnect=true`, {}, {
				"Content-Type": "application/json",
				"X-Bearer-Owner-Id": walletData.account,
				'X-Bearer-Signature': walletData.tokens.object.GET.signature,
				'X-Bearer-Signature-Key': walletData.publicKey,
				'Authorization': `Bearer ${walletData.tokens.object.GET.token}`
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
					src="./img/file.svg"
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
								src="./img/trashbin.svg"
								width={22}
								height={22}
								fill="#f14668"
								alt="delete"
								className="objects_tree_file_delete"
								onClick={(e) => {
									if (walletData.tokens.object.DELETE) {
										onPopup('deleteObject', { containerId: containerItem.containerId, objectId: objectItem.address.objectId });
									} else {
										onPopup('signTokens', 'object.DELETE')
									}
									e.stopPropagation();
								}}
							/>
							<Section style={{ paddingTop: 0 }}>
								<Heading size={7} weight="bolder" style={{ color: '#828282' }}>Information</Heading>
								<Heading size={6} weight="light">
									<span>{`Object id: `}</span>
									<a
										href={`${process.env.REACT_APP_NGINX}/get/${containerItem.containerId}/${objectItem.address.objectId}`}
										target="_blank"
										rel="noopener noreferrer"
										style={{ textDecoration: 'underline' }}
									>{objectItem.address.objectId}</a>
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
							<Section style={{ paddingBottom: 0 }}>
								<Heading size={7} weight="bolder" style={{ color: '#828282' }}>Attributes</Heading>
								{objectDate.attributes.map((attribute) => (
									<Heading size={6} weight="light">
										<span>{`${attribute.key === 'Timestamp' ? 'Creation' : attribute.key}: `}</span>
										{attribute.key === 'Timestamp' ? new Date(attribute.value * 1000).toLocaleDateString() : attribute.value}
									</Heading>
								))}
							</Section>
						</>
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
	onPopup,
	containerIndex,
	onGetObjectData,
}) {
  return (
		<Tree>
			{containerItem.objects && Object.keys(containerItem.objects).map((objectPath, index) => (
				<div key={objectPath}>
					{objectPath !== 'children' && (
						<Tree.Branch
							objectPath={objectPath}
							walletData={walletData}
							onPopup={onPopup}
							containerItem={containerItem}
							containerChildren={containerItem.objects}
							containerIndex={containerIndex}
							onGetObjectData={onGetObjectData}
						/>
					)}
					{Object.keys(containerItem.objects).length === (index + 1) && containerItem.objects.children && containerItem.objects.children.map((objectItem, objectIndex) => (
						<Tree.File
							key={`${objectItem.name}-${objectIndex}`}
							name={objectItem.name}
							containerItem={containerItem}
							objectItem={objectItem}
							walletData={walletData}
							onPopup={onPopup}
						/>
					))}
				</div>
			))}
		</Tree>
  );
}
