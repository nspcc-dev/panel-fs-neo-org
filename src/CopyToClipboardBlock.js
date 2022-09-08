import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

export const CopyToClipboardBlock = ({ text, copy, className, onPopup }) => {
	return (
		<CopyToClipboard
			text={copy}
			className={`highlighted highlighted_copy${className ? ` ${className}` : ''}`}
			onCopy={() => onPopup('success', 'Connection URL copied')}
		>
			<span>{text}</span>
		</CopyToClipboard>
	);
};
