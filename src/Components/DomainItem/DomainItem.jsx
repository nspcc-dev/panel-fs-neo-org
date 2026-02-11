import React, { useState, useEffect } from "react";
import {
	Heading,
	Section,
	Form,
	Button,
	Tile,
	Notification,
} from 'react-bulma-components';
import {
	invokeFunction,
} from '../../Functions/handle';

export default function DomainItem({
	NeoFSContract,
	domainItem,
	onModal,
	onPopup,
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [domainData, setDomainData] = useState(null);
	const [domainRecords, setDomainRecords] = useState(null);
	const RECORD_TYPE = {
		1:  "A",
		5:  "CNAME",
		6:  "SOA",
		16: "TXT",
		28: "AAAA",
	};

	const handleToggle = async e => {
		setIsOpen(!isOpen);
		if (!isOpen) {

			const response = await invokeFunction(
				NeoFSContract.sidechain,
				[
					NeoFSContract.nnsHash,
					"getAllRecords",
					[{ type: "String", value: domainItem }]
				],
			);
			onPopup('success', 'Domains has been updated');
			setDomainRecords(response.exception ? response.exception : response.stack[0]?.iterator);

			const responseDomainData = await invokeFunction(
				NeoFSContract.sidechain,
				[
					NeoFSContract.nnsHash,
					"properties",
					[{ type: "ByteString", value: btoa(domainItem) }]
				],
			);
			setDomainData(responseDomainData.stack[0]?.value);
		}
		e.preventDefault();
	};

	return (
		<Tile
			kind="ancestor"
			key={domainItem}
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
						onClick={handleToggle}
					>
						{domainItem}
						<img
							src="/img/icons/chevron_down.svg"
							width={26}
							height={26}
							style={isOpen ? { transform: 'rotateZ(180deg)'} : {}}
							alt="open"
						/>
					</Heading>
					{isOpen && (
						<div className="container_panel">
							{domainRecords && typeof domainRecords === 'object' ? (
								<div>
									<div className="table_container">
										<table className="table">
											<thead>
												<tr>
													<th>Name</th>
													<th>Type</th>
													<th>Data</th>
													<th>ID</th>
												</tr>
											</thead>
											<tbody>
												{domainRecords && domainRecords.map((record) => (
													<tr key={record.value[0].value}>
														<td>{atob(record.value[0].value)}</td>
														<td>{RECORD_TYPE[Number(record.value[1].value)]}</td>
														<td>{atob(record.value[2].value)}</td>
														<td>{record.value[3].value}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
									<div style={{ display: 'flex', flexWrap: 'wrap' }}>
										<Button
											renderAs="button"
											color="primary"
											size="small"
											onClick={() => onModal('addDomainRecord', domainItem)}
											style={{ display: 'block', margin: '0 10px 10px 0' }}
										>
											Add record
										</Button>
										<Button
											renderAs="button"
											color="primary"
											size="small"
											onClick={() => onModal('addDomainRecord', domainItem)}
										>
											Delete records
										</Button>
									</div>
									<Section>
										<Heading size={6} weight="bold">Properties</Heading>
										{domainData && domainData.map((data) => (
											<Heading size={6} weight="light" key={data.key.value}>
												<span>{`${atob(data.key.value)}: `}</span>
												{data.value?.type === 'ByteString'
													? atob(data.value.value)
													: data.value?.type === 'Integer'
														? new Date(Number(data.value.value)).toISOString()
														: data.value?.type === 'Any'
															? 'Any'
															: data.value?.value || ''}
											</Heading>
										))}
									</Section>
								</div>
							) : (
								<>
									{typeof domainRecords === 'string' ? (
										<div>
											{`Error: ${domainRecords}`}
											{domainRecords.indexOf('name has expired') !== -1 && (
												<Button
													renderAs="button"
													color="primary"
													size="small"
													onClick={renewDomain}
													style={{ display: 'block', margin: '10px 0 0' }}
												>
													Renew domain
												</Button>
											)}
										</div>
									) : (
										<img
											className="modal_loader"
											src="/img/icons/loader.svg"
											height={30}
											width={30}
											alt="loader"
										/>
									)}
								</>
							)}
						</div>
					)}
				</Tile>
			</Tile>
		</Tile>
	);
}
