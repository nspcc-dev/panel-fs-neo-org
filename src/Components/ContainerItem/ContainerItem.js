import React, { useState } from "react";
import {
	Heading,
	Section,
	Tabs,
	Button,
	Tile,
	Box,
	Notification,
} from 'react-bulma-components';
import TreeView from '../TreeView/TreeView';

export default function ContainerItem({
	containerItem,
	walletData,
	onPopup,
	index,
	onGetObjectData,
	onAuth,
	formatForContainerName,
	onSetEacl,
}) {
	const [activeAttributes, setActiveAttributes] = useState('main');
	const [isOpen, setIsOpen] = useState(false);

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
							if (walletData.tokens.object.GET && isOpen) {
								onGetObjectData(containerItem.containerId, index);
							}
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
									onPopup('deleteContainer', { containerId: containerItem.containerId });
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
										<Heading size={5} weight="bolder">Information</Heading>
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
											{`0x${containerItem.basicAcl}`}
										</Heading>
										<Button
											color="primary"
											onClick={() => onSetEacl(containerItem.containerId)}
											style={{ margin: '10px 0', display: 'block' }}
										>Set eACL</Button>
									</Section>
									<Section>
										<Heading size={5} weight="bolder">Attributes</Heading>
										<Tabs>
											<Tabs.Tab
												onClick={() => {
													setActiveAttributes('main');
												}}
												active={activeAttributes === 'main'}
											>
												Main
											</Tabs.Tab>
											<Tabs.Tab
												onClick={() => {
													setActiveAttributes('system');
												}}
												active={activeAttributes === 'system'}
											>
												System
											</Tabs.Tab>
										</Tabs>
										{activeAttributes === 'main' && containerItem.attributes.map((attribute) => ( attribute.key.indexOf('__NEOFS__') === -1 && (
											<Heading size={6} weight="light" style={{ marginLeft: 10 }} key={attribute.key}>
												<span>{`${attribute.key === 'Timestamp' ? 'Creation' : attribute.key}: `}</span>
												{attribute.key === 'Timestamp' ? new Date(attribute.value * 1000).toLocaleDateString() : attribute.value}
											</Heading>
										)))}
										{activeAttributes === 'system' && containerItem.attributes.map((attribute) => ( attribute.key.indexOf('__NEOFS__') !== -1 && (
											<Heading size={6} weight="light" style={{ marginLeft: 10 }} key={attribute.key}>
												<span>{`${attribute.key === 'Timestamp' ? 'Creation' : attribute.key}: `}</span>
												{attribute.key === 'Timestamp' ? new Date(attribute.value * 1000).toLocaleDateString() : attribute.value}
											</Heading>
										)))}
									</Section>
									<Section>
										<Heading size={5} weight="bolder">Objects</Heading>
										<Box
											style={{
												marginTop: 15,
												border: '1px solid #dbdbdc',
												boxShadow: '0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 2%)',
											}}
										>
											{walletData.tokens.object.GET ? (
												<>
													<TreeView
														walletData={walletData}
														onPopup={onPopup}
														containerIndex={index}
														containerItem={containerItem}
													/>
													<Button
														color="primary"
														onClick={() => onPopup('createObject', { containerId: containerItem.containerId })}
														style={{ display: 'flex', margin: '20px auto 0' }}
													>
														New object
													</Button>
												</>
											) : (
												<div className="token_status_panel">
													<div>For getting operations</div>
													<Button
														color="primary"
														size="small"
														onClick={() => onAuth('object', 'GET')}
													>
														Sign
													</Button>
												</div>
											)}
										</Box>
									</Section>
								</div>
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
					)}
				</Tile>
			</Tile>
		</Tile>
	);
}
