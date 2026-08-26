import React, { useState, useMemo, useEffect } from 'react';
import { Heading, Button, Form } from 'react-bulma-components';
import './TokenSignPanel.css';

const VERB_GROUPS = [
	{
		title: 'Container',
		verbs: [
			{ verb: 'CONTAINER_PUT', label: 'Create container' },
			{ verb: 'CONTAINER_DELETE', label: 'Delete container' },
			{ verb: 'CONTAINER_SET_EACL', label: 'Manage eACL' },
		],
	},
	{
		title: 'Object',
		verbs: [
			{ verb: 'OBJECT_PUT', label: 'Upload object' },
			{ verb: 'OBJECT_GET', label: 'Download object' },
			{ verb: 'OBJECT_HEAD', label: 'Read object metadata' },
			{ verb: 'OBJECT_DELETE', label: 'Delete object' },
			{ verb: 'OBJECT_RANGE', label: 'Read object range' },
			{ verb: 'OBJECT_SEARCH', label: 'Search objects' },
		],
	},
];

const ALL_VERBS = VERB_GROUPS.flatMap((group) => group.verbs.map((verb) => verb.verb));

const isVerbSigned = (tokens, verb) => {
	if (verb.startsWith('CONTAINER_')) return !!tokens.container?.[verb];
	if (verb.startsWith('OBJECT_')) {
		if (!tokens.object) return false;
		if (Array.isArray(tokens.object.verbs)) return tokens.object.verbs.includes(verb);
		return true;
	}
	return false;
};

export default function TokenSignPanel({
	walletData,
	onAuth,
	title = 'Sign master token',
	requiredVerbs = [],
	availableVerbs = ALL_VERBS,
	resignVerbs = [],
	params = {},
	style,
}) {
	const tokens = walletData?.tokens || { container: {}, object: null };
	const isSigned = (verb) => !resignVerbs.includes(verb) && isVerbSigned(tokens, verb);

	const initialVerbs = useMemo(() => {
		const set = new Set();
		availableVerbs.forEach((verb) => {
			if (!isSigned(verb)) set.add(verb);
		});
		requiredVerbs.forEach((verb) => {
			if (!isSigned(verb)) set.add(verb);
		});
		return set;
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const [isExpanded, setExpanded] = useState(false);
	const [selectedVerbs, setSelectedVerbs] = useState(initialVerbs);
	const [isSigning, setSigning] = useState(false);
	const [pending, setPending] = useState(null);

	const requiredKey = requiredVerbs.join('|');
	const availableKey = availableVerbs.join('|');
	const resignKey = resignVerbs.join('|');

	useEffect(() => {
		setSelectedVerbs((prev) => {
			const next = new Set(prev);
			let changed = false;
			requiredVerbs.forEach((verb) => {
				if (!isSigned(verb) && !next.has(verb)) {
					next.add(verb);
					changed = true;
				}
			});
			availableVerbs.forEach((verb) => {
				if (!isSigned(verb) && !prev.has(verb) && !next.has(verb)) {
					next.add(verb);
					changed = true;
				}
			});
			return changed ? next : prev;
		});
	}, [requiredKey, availableKey, resignKey]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!isSigning || !pending) return;
		const isDone = pending.every((verb) => isSigned(verb));
		if (isDone) {
			setSigning(false);
			setPending(null);
		}
	}, [walletData, isSigning, pending]); // eslint-disable-line react-hooks/exhaustive-deps

	const onSign = async () => {
		const verbsSet = new Set(selectedVerbs);
		requiredVerbs.forEach((verb) => verbsSet.add(verb));
		const verbs = Array.from(verbsSet).filter((verb) => !isSigned(verb));
		if (verbs.length === 0) return;

		const hasNewObjectVerbs = verbs.some((verb) => verb.startsWith('OBJECT_'));
		if (hasNewObjectVerbs && Array.isArray(tokens.object?.verbs)) {
			tokens.object.verbs.forEach((verb) => {
				if (!verbs.includes(verb)) verbs.push(verb);
			});
		}

		setPending(verbs);
		setSigning(true);
		try {
			await onAuth('container', verbs, params);
		} catch (e) {
			setSigning(false);
			setPending(null);
		}
	};

	const toggleVerb = (verb) => {
		if (requiredVerbs.includes(verb)) return;
		if (isSigned(verb)) return;
		setSelectedVerbs((prev) => {
			const next = new Set(prev);
			if (next.has(verb)) next.delete(verb);
			else next.add(verb);
			return next;
		});
	};

	return (
		<div className="token_sign_panel" style={style}>
			<div className="token_sign_panel_row">
				<Heading size={6} style={{ margin: '0 10px 0 0' }}>{title}</Heading>
				<Button
					renderAs="button"
					color="primary"
					size="small"
					onClick={onSign}
					disabled={isSigning}
				>
					{isSigning ? (
						<img
							src="/img/icons/spinner.svg"
							className="spinner"
							style={{ padding: 4, margin: 4 }}
							width={20}
							height={20}
							alt="spinner"
						/>
					) : 'Sign'}
				</Button>
			</div>
			<div
				className="token_sign_panel_toggle"
				onClick={() => setExpanded(!isExpanded)}
			>
				{isExpanded ? '▾' : '▸'} Customize permissions
			</div>
			{isExpanded && (
				<div className="token_sign_panel_options">
					{VERB_GROUPS.map((group) => {
						const groupVerbs = group.verbs.filter((opt) => availableVerbs.includes(opt.verb));
						if (groupVerbs.length === 0) return null;
						return (
							<div key={group.title} className="token_sign_panel_group">
								<div className="token_sign_panel_group_title">{group.title}</div>
								{groupVerbs.map(({ verb, label }) => {
									const isRequired = requiredVerbs.includes(verb);
									const alreadySigned = isSigned(verb);
									return (
										<Form.Field key={verb}>
											<Form.Control>
												<Form.Checkbox
													renderAs="input"
													checked={alreadySigned || selectedVerbs.has(verb)}
													disabled={isRequired || alreadySigned || isSigning}
													onChange={() => toggleVerb(verb)}
												>
													&nbsp;{label}
													{isRequired && <span className="token_sign_panel_hint"> (required)</span>}
													{alreadySigned && <span className="token_sign_panel_hint"> (signed)</span>}
												</Form.Checkbox>
											</Form.Control>
										</Form.Field>
									);
								})}
							</div>
						);
					})}
					<div className="token_sign_panel_note">
						All selected operations are bundled into one wallet signature.
					</div>
				</div>
			)}
		</div>
	);
}
