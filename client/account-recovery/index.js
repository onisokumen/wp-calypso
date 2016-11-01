/**
 * Internal dependencies
 */
import { lostPassword } from './controller';

export default function( router ) {
	// Main route for account recovery is the lost password page
	router( '/account-recovery', lostPassword );
}
