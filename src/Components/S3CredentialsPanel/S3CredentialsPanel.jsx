import React, { useEffect, useState } from 'react';
import { Heading, Button, Form, Notification } from 'react-bulma-components';
import copy from 'copy-to-clipboard';
import TokenSignPanel, { VERB_GROUPS } from '../TokenSignPanel/TokenSignPanel';
import api from '../../api';
import {
	base64ToBytes,
	hexToBytesToBase64,
	isPublicReadContainer,
} from '../../Functions/handle';

const VERBS = VERB_GROUPS.flatMap((group) => group.verbs);

const newContext = () => ({ containerID: '', verbs: VERBS.map((item) => item.verb) });

export default function S3CredentialsPanel({
	authmate,
	walletData,
	containers = [],
	onAuth,
	onSign,
}) {
	const [gates, setGates] = useState([]);
	const [boxContainer, setBoxContainer] = useState('');
	const [contexts, setContexts] = useState([newContext()]);
	const [expiration, setExpiration] = useState('');
	const [step, setStep] = useState('');
	const [error, setError] = useState('');
	const [result, setResult] = useState(null);
	const [copied, setCopied] = useState('');

	const isLoading = step !== '';
	const publicContainers = containers.filter((item) => isPublicReadContainer(item.basicAcl));
	const objectToken = walletData.tokens.object;
	const canStoreBox = !!objectToken && (!Array.isArray(objectToken.verbs) || objectToken.verbs.includes('OBJECT_PUT'));

	useEffect(() => {
		api('GET', `${authmate}/v1/auth/s3/gates`).then((e) => {
			if (e.message) {
				setError(e.message);
			} else {
				setGates(e.gates.map((key) => ({ key, checked: true })));
			}
		}).catch(() => setError('Authmate service is not available'));
	}, [authmate]);

	const toggleGate = (index) => {
		setGates(gates.map((gate, i) => (i === index ? { ...gate, checked: !gate.checked } : gate)));
	};

	const updateContext = (index, patch) => {
		setContexts(contexts.map((context, i) => (i === index ? { ...context, ...patch } : context)));
	};

	const toggleVerb = (index, verb) => {
		const verbs = contexts[index].verbs;
		updateContext(index, { verbs: verbs.includes(verb) ? verbs.filter((item) => item !== verb) : [...verbs, verb] });
	};

	const onCopy = (value) => {
		copy(value);
		setCopied(value);
		setTimeout(() => setCopied(''), 700);
	};

	const onIssue = async () => {
		setError('');
		try {
			const selectedGates = gates.filter((gate) => gate.checked).map((gate) => gate.key);
			if (selectedGates.length === 0) throw new Error('Select at least one S3 gateway');
			if (contexts.some((context) => context.verbs.length === 0)) throw new Error('Each context must allow at least one operation');

			setStep('Requesting session tokens');
			const prepared = await api('POST', `${authmate}/v1/auth/s3`, {
				issuer: walletData.account.address,
				gates: selectedGates,
				contexts: contexts.map((context) => ({
					...(context.containerID ? { containerID: context.containerID } : {}),
					verbs: context.verbs,
				})),
				...(expiration ? { 'expiration-rfc3339': new Date(expiration).toISOString() } : {}),
			});
			if (prepared.message) throw new Error(prepared.message);

			const tokens = [];
			for (let i = 0; i < prepared.tokens.length; i += 1) {
				setStep(`Sign token ${i + 1} of ${prepared.tokens.length} in your wallet`);
				const signature = await onSign(prepared.tokens[i]);
				if (!signature || signature.error) throw new Error('Signing aborted');
				tokens.push({
					token: prepared.tokens[i],
					key: hexToBytesToBase64(signature.publicKey),
					signature: hexToBytesToBase64(signature.data + signature.salt),
					scheme: 'WALLETCONNECT',
				});
			}

			setStep('Packing access box');

			const completed = await api('POST', `${authmate}/v1/auth/s3/complete`, { tokens, ...(prepared.state ? { state: prepared.state } : {}) });
			if (completed.message) throw new Error(completed.message);

			setStep('Storing access box');
			const stored = await api('POST', `/v1/objects/${boxContainer}`, new Blob([base64ToBytes(completed.accessBox)]), {
				'Content-Type': 'application/octet-stream',
				'Authorization': `Bearer ${walletData.tokens.object.bearer}`,
				'X-Neofs-Expiration-RFC3339': completed.expiresAt,
			});
			if (stored.message) throw new Error(stored.message);

			setResult({
				accessKeyId: `${boxContainer}0${stored.object_id}`,
				secretAccessKey: prepared.secretAccessKey || completed.secretAccessKey,
				expiresAt: completed.expiresAt,
				box: `${boxContainer}/${stored.object_id}`,
			});
		} catch (e) {
			setError(e?.message || 'Something went wrong, try again');
		} finally {
			setStep('');
		}
	};

	if (result) {
		return (
			<>
				<Notification color="warning" light style={{ fontSize: 14 }}>
					These credentials work only while the access box object below is stored in NeoFS and its container stays readable for others. Save the secret key now, it will not be shown again.
				</Notification>
				{[['Access key ID', result.accessKeyId], ['Secret access key', result.secretAccessKey]].map(([label, value]) => (
					<div key={label}>
						<Heading size={6} weight="normal" style={{ margin: '10px 10px 0' }}>{label}</Heading>
						<div className="modal_highlighted_copy" onClick={() => onCopy(value)}>
							{value}
							{copied === value && <div className="tooltip">Copied!</div>}
						</div>
					</div>
				))}
				{[['Expires at', result.expiresAt], ['Access box object', result.box]].map(([label, value]) => (
					<Heading key={label} size={6} weight="light" style={{ margin: '0 10px 10px', wordBreak: 'break-all' }}>
						<span style={{ fontWeight: 600 }}>{`${label}: `}</span>
						{value}
					</Heading>
				))}
			</>
		);
	}

	return (
		<>
			<Heading align="center" size={6} style={{ margin: '0 auto 1rem', maxWidth: 500, color: '#666', fontWeight: 'normal' }}>
				Issue AWS-compatible credentials for NeoFS S3 gateways. The number of session tokens to sign with your wallet depends on the number of gateways.
			</Heading>
			<Form.Field>
				<Form.Label>S3 gateways</Form.Label>
				{gates.length === 0 && !error && (
					<Heading size={6} weight="light">Loading...</Heading>
				)}
				{gates.map((gate, index) => (
					<Form.Control key={gate.key}>
						<Form.Checkbox
							renderAs="input"
							checked={gate.checked}
							disabled={isLoading}
							onChange={() => toggleGate(index)}
						>
							&nbsp;<span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{gate.key}</span>
						</Form.Checkbox>
					</Form.Control>
				))}
			</Form.Field>
			<Form.Field>
				<Form.Label>Container to store the access box</Form.Label>
				<Heading className="input_caption">S3 gateways should be able to read (GET/HEAD) the access box object, so both basic and extended ACLs of this container should be set up accordingly. Only containers with a suitable basic ACL are listed.</Heading>
				{publicContainers.length === 0 ? (
					<Notification className="error_message">
						No publicly readable container found. Create a container with the "allow reads for others" eACL preset first.
					</Notification>
				) : (
					<Form.Control>
						<Form.Select
							renderAs="select"
							value={boxContainer}
							onChange={(e) => setBoxContainer(e.target.value)}
							disabled={isLoading}
						>
							<option value="">Select container</option>
							{publicContainers.map((item) => (
								<option key={item.containerId} value={item.containerId}>{item.containerName || item.containerId}</option>
							))}
						</Form.Select>
					</Form.Control>
				)}
			</Form.Field>
			<Form.Field>
				<Form.Label>Permissions</Form.Label>
				<Heading className="input_caption">Each context limits the credentials to a container and a set of operations. Creating buckets needs both "Create container" and "Manage eACL".</Heading>
				{contexts.map((context, index) => (
					<div key={index} style={{ border: '1px solid #dfe3e3', padding: 10, marginBottom: 10 }}>
						<Form.Field kind="addons">
							<Form.Control fullwidth>
								<Form.Select
									renderAs="select"
									size="small"
									value={context.containerID}
									onChange={(e) => updateContext(index, { containerID: e.target.value })}
									disabled={isLoading}
								>
									<option value="">Any container</option>
									{containers.map((item) => (
										<option key={item.containerId} value={item.containerId}>{item.containerName || item.containerId}</option>
									))}
								</Form.Select>
							</Form.Control>
							{contexts.length > 1 && (
								<Form.Control>
									<Button
										renderAs="button"
										size="small"
										onClick={() => setContexts(contexts.filter((_, i) => i !== index))}
										disabled={isLoading}
									>
										Remove
									</Button>
								</Form.Control>
							)}
						</Form.Field>
						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px' }}>
							{VERBS.map(({ verb, label }) => (
								<Form.Checkbox
									key={verb}
									renderAs="input"
									checked={context.verbs.includes(verb)}
									disabled={isLoading}
									onChange={() => toggleVerb(index, verb)}
								>
									&nbsp;{label}
								</Form.Checkbox>
							))}
						</div>
					</div>
				))}
				<Button
					renderAs="button"
					color="primary"
					size="small"
					onClick={() => setContexts([...contexts, newContext()])}
					disabled={isLoading}
					style={{ display: 'flex', margin: '10px auto 0' }}
				>
					Add context
				</Button>
			</Form.Field>
			<Form.Field>
				<Form.Label>Expiration</Form.Label>
				<Form.Control>
					<Form.Input
						renderAs="input"
						type="datetime-local"
						value={expiration}
						onChange={(e) => setExpiration(e.target.value)}
						disabled={isLoading}
					/>
				</Form.Control>
				<Heading className="input_caption">Leave empty to use the maximum lifetime allowed by the service (1 year).</Heading>
			</Form.Field>
			{error && (
				<Notification className="error_message" style={{ margin: '20px 0' }}>{error}</Notification>
			)}
			{!canStoreBox ? (
				<TokenSignPanel
					walletData={walletData}
					onAuth={onAuth}
					title="Sign token to store the access box"
					requiredVerbs={['OBJECT_PUT']}
					style={{ margin: '25px 0 10px', maxWidth: 'unset' }}
				/>
			) : (
				<>
					<Button
						renderAs="button"
						color="primary"
						onClick={onIssue}
						disabled={isLoading || !boxContainer}
						style={{ display: 'flex', margin: '30px auto 0' }}
					>
						{isLoading ? (
							<img
								src="/img/icons/spinner.svg"
								className="spinner"
								width={20}
								height={20}
								alt="spinner"
							/>
						) : 'Issue credentials'}
					</Button>
					{isLoading && (
						<Heading align="center" size={6} weight="light" style={{ marginTop: 10 }}>{step}</Heading>
					)}
				</>
			)}
		</>
	);
}
