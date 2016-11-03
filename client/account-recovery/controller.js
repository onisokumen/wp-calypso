/**
 * External dependencies
 */
import React from 'react';
import page from 'page';

/**
 * Internal dependencies
 */
import LostPasswordPage from 'account-recovery/lost-password';
import { getCurrentUser } from 'state/current-user/selectors';

export function lostPassword( context, next ) {
	context.primary = <LostPasswordPage basePath={ context.path } className="account-recovery__container" />;
	next();
}

export function redirectLoggedIn( context, next ) {
	const currentUser = getCurrentUser( context.store.getState() );

	if ( currentUser ) {
		page.redirect( '/' );
		return;
	}

	next();
}
