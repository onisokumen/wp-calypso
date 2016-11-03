/**
 * External dependencies
 */
import React from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import PageViewTracker from 'lib/analytics/page-view-tracker';
import Main from 'components/main';
import DocumentHead from 'components/data/document-head';
import LostPasswordForm from './lost-password-form';

export default localize( ( { className, translate, basePath } ) => (
	<Main className={ className }>
		<PageViewTracker path={ basePath } title="Account Recovery > Lost Password" />
		<DocumentHead title={ translate( 'Lost Password ‹ Account Recovery' ) } />
		<LostPasswordForm />
	</Main>
) );
