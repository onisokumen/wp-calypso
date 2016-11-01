/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { LostPasswordPage } from 'account-recovery/lost-password';

export function lostPassword( context, next ) {
	context.primary = <LostPasswordPage basePath={ context.path } />;
	next();
}
