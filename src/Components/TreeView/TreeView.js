import React, { useState } from "react";
import {
	Heading,
} from 'react-bulma-components';

const File = ({ name, children, onGetData }) => {
  const [isOpen, setIsOpen] = useState(false);

	const handleToggle = e => {
    setIsOpen(!isOpen);
		onGetData();
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
			>{children}</div>
		</div>
  );
};

const Folder = ({ name, children }) => {
  const [isOpen, setIsOpen] = useState(false);

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

const Tree = ({ children }) => {
  return <div className="objects_tree">{children}</div>;
};

Tree.File = File;
Tree.Folder = Folder;

export default function TreeView({
	containerItem,
	walletData,
	onPopup,
	containerIndex,
	containers,
	setContainers,
	onGetObjectData,
}) {
  return (
		<Tree>
			{containerItem.objects && Object.keys(containerItem.objects).map((objectPath) => (
				<Tree.Folder
					key={objectPath}
					name={objectPath}
				>
					{containerItem.objects[objectPath].files && containerItem.objects[objectPath].files.map((objectItem, objectIndex) => (
						<Tree.File
							key={`${objectItem.name}-${objectIndex}`}
							name={objectItem.name}
							onGetData={() => {
								const containersTemp = [ ...containers ];
								if (objectItem.isActive) {
									containersTemp[containerIndex].objects[objectPath].files[objectIndex].isActive = false;
									setContainers(containersTemp);
								} else {
									containersTemp[containerIndex].objects[objectPath].files[objectIndex].isActive = true;
									setContainers(containersTemp);
									onGetObjectData(containerItem.containerId, objectItem.address.objectId, objectPath, containerIndex, objectIndex);
								}
							}}
						>
							<div className="objects_tree_file_content">
								{objectItem.ownerId ? (
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
											{objectItem.ownerId}
										</Heading>
										<Heading size={6} weight="light">
											<span>{`Object size: `}</span>
											{objectItem.objectSize}
										</Heading>
										<Heading size={6} weight="light">
											<span>{`Payload size: `}</span>
											{objectItem.payloadSize}
										</Heading>
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
						</Tree.File>
					))}
				</Tree.Folder>
			))}
		</Tree>
  );
}
