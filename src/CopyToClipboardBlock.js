import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

export const CopyToClipboardBlock = ({ text, copy, className }) => {
	const [copied, setCopied] = useState(false);
	return (
		<CopyToClipboard
			text={copy}
			className={`highlighted highlighted_copy${className ? ` ${className}` : ''}`}
			onCopy={() => {
				setCopied(true);
				setTimeout(() => {
					setCopied(false);
				}, 1000);
			}}
		>
			<span>{copied ? 'copied' : text}</span>
		</CopyToClipboard>
	);
};
