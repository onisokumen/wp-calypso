/**
 * External dependencies
 */
import { assert } from 'chai';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { useNock } from 'test/helpers/use-nock';

import {
	accountRecoveryFetch,
	accountRecoveryFetchSuccess,
	accountRecoveryFetchFailed,
} from '../actions';

import {
	ACCOUNT_RECOVERY_FETCH,
	ACCOUNT_RECOVERY_FETCH_SUCCESS,
	ACCOUNT_RECOVERY_FETCH_FAILED,
} from 'state/action-types';

import dummyData from './test-data';

describe( 'account-recovery ctions', () => {
	const spy = sinon.spy();

	beforeEach( () => {
		spy.reset();
	} );

	describe( '#accountRecoveryFetch() success', () => {
		useNock( ( nock ) => {
			nock( 'https://public-api.wordpress.com:443' )
				.get( '/rest/v1.1/me/account-recovery' )
				.reply( 200, dummyData );
		} );

		it( 'should dispatch fetch / success actions.', () => {
			const fetch = accountRecoveryFetch()( spy );

			assert( spy.calledWith( { type: ACCOUNT_RECOVERY_FETCH } ) );

			return fetch.then( () => {
				assert( spy.calledWith( {
					type: ACCOUNT_RECOVERY_FETCH_SUCCESS,
					...dummyData,
				} ) );
			} );
		} );
	} );

	describe( '#accountRecoveryFetch() failed', () => {
		const message = 'something wrong!';

		useNock( ( nock ) => {
			nock( 'https://public-api.wordpress.com:443' )
				.get( '/rest/v1.1/me/account-recovery' )
				.reply( 400, { message } );
		} );

		it( 'should dispatch fetch / fail actions.', () => {
			const fetch = accountRecoveryFetch()( spy );

			assert( spy.calledWith( { type: ACCOUNT_RECOVERY_FETCH } ) );

			return fetch.then( () => {
				assert( spy.calledWith( {
					type: ACCOUNT_RECOVERY_FETCH_FAILED,
					error: {
						status: 400,
						message,
					},
				} ) );
			} );
		} );
	} );

	describe( '#accountRecoveryFetchSuccess()', () => {
		it( 'should return ACCOUNT_RECOVERY_FETCH_SUCCESS', () => {
			const action = accountRecoveryFetchSuccess( dummyData );
			assert.deepEqual( action, {
				type: ACCOUNT_RECOVERY_FETCH_SUCCESS,
				...dummyData,
			} );
		} );
	} );

	describe( '#accountRecoveryFetchFailed()', () => {
		it( 'should return ACCOUNT_RECOVERY_FETCH_FAILED', () => {
			const dummyError = 'failed';
			const action = accountRecoveryFetchFailed( dummyError );

			assert.deepEqual( action, {
				type: ACCOUNT_RECOVERY_FETCH_FAILED,
				error: dummyError,
			} );
		} );
	} );
} );