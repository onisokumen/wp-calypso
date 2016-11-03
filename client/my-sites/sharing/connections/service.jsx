/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { some } from 'lodash';

/**
 * Internal dependencies
 */
var ServiceTip = require( './service-tip' ),
	ServiceDescription = require( './service-description' ),
	ServiceExamples = require( './service-examples' ),
	ServiceAction = require( './service-action' ),
	ServiceConnectedAccounts = require( './service-connected-accounts' ),
	notices = require( 'notices' ),
	observe = require( 'lib/mixins/data-observe' ),
	sites = require( 'lib/sites-list' )(),
	serviceConnections = require( './service-connections' ),
	analytics = require( 'lib/analytics' ),
	FoldableCard = require( 'components/foldable-card' ),
	SocialLogo = require( 'components/social-logo' );

import { getConnectionsBySiteId, isFetchingConnections } from 'state/sharing/publicize/selectors';
import { getSelectedSiteId } from 'state/ui/selectors';

const SharingService = React.createClass( {
	displayName: 'SharingService',

	propTypes: {
		site: React.PropTypes.object,                    // The site for which connections are created
		user: React.PropTypes.object,                    // A user object
		service: React.PropTypes.object.isRequired,      // The single service object
		connections: React.PropTypes.object,             // A collections-list instance
		onAddConnection: React.PropTypes.func,           // Handler for creating a new connection for this service
		onRemoveConnection: React.PropTypes.func,        // Handler for removing a connection from this service
		onRefreshConnection: React.PropTypes.func,       // Handler for refreshing a Keyring connection for this service
		onToggleSitewideConnection: React.PropTypes.func // Handler to invoke when toggling a connection to be shared sitewide
	},

	mixins: [ observe( 'connections' ) ],

	getInitialState: function() {
		return {
			isOpen: false,          // The service is visually opened
			isConnecting: false,    // A pending connection is awaiting authorization
			isDisconnecting: false, // A pending disconnection is awaiting completion
			isRefreshing: false     // A pending refresh is awaiting completion
		};
	},

	getDefaultProps: function() {
		return {
			onAddConnection: function() {},
			onRemoveConnection: function() {},
			onRefreshConnection: function() {},
			onToggleSitewideConnection: function() {}
		};
	},

	componentWillUnmount: function() {
		this.props.connections.off( 'create:success', this.onConnectionSuccess );
		this.props.connections.off( 'create:error', this.onConnectionError );
		this.props.connections.off( 'destroy:success', this.onDisconnectionSuccess );
		this.props.connections.off( 'destroy:error', this.onDisconnectionError );
		this.props.connections.off( 'refresh:success', this.onRefreshSuccess );
		this.props.connections.off( 'refresh:error', this.onRefreshError );
	},

	onConnectionSuccess: function() {
		this.setState( { isConnecting: false } );
		this.props.connections.off( 'create:error', this.onConnectionError );

		notices.success( this.translate( 'The %(service)s account was successfully connected.', {
			args: { service: this.props.service.label },
			context: 'Sharing: Publicize connection confirmation'
		} ) );

		if ( ! this.state.isOpen ) {
			this.setState( { isOpen: true } );
		}
	},

	onConnectionError: function( reason ) {
		this.setState( { isConnecting: false } );
		this.props.connections.off( 'create:success', this.onConnectionSuccess );

		if ( reason && reason.cancel ) {
			notices.warning( this.translate( 'The %(service)s connection could not be made because no account was selected.', {
				args: { service: this.props.service.label },
				context: 'Sharing: Publicize connection confirmation'
			} ) );
		} else if ( reason && reason.connected ) {
			notices.warning( this.translate( 'The %(service)s connection could not be made because all available accounts are already connected.', {
				args: { service: this.props.service.label },
				context: 'Sharing: Publicize connection confirmation'
			} ) );
		} else {
			notices.error( this.translate( 'The %(service)s connection could not be made.', {
				args: { service: this.props.service.label },
				context: 'Sharing: Publicize connection confirmation'
			} ) );
		}
	},

	onDisconnectionSuccess: function() {
		this.setState( { isDisconnecting: false } );
		this.props.connections.off( 'destroy:error', this.onDisconnectionError );

		notices.success( this.translate( 'The %(service)s account was successfully disconnected.', {
			args: { service: this.props.service.label },
			context: 'Sharing: Publicize disconnection confirmation'
		} ) );
	},

	onDisconnectionError: function() {
		this.setState( { isDisconnecting: false } );
		this.props.connections.off( 'destroy:success', this.onDisconnectionSuccess );

		notices.error( this.translate( 'The %(service)s account was unable to be disconnected.', {
			args: { service: this.props.service.label },
			context: 'Sharing: Publicize disconnection confirmation'
		} ) );
	},

	onRefreshSuccess: function() {
		this.setState( { isRefreshing: false } );
		this.props.connections.off( 'refresh:error', this.onRefreshError );

		notices.success( this.translate( 'The %(service)s account was successfully reconnected.', {
			args: { service: this.props.service.label },
			context: 'Sharing: Publicize reconnection confirmation'
		} ) );
	},

	onRefreshError: function() {
		this.setState( { isRefreshing: false } );
		this.props.connections.off( 'refresh:success', this.onRefreshSuccess );

		notices.error( this.translate( 'The %(service)s account was unable to be reconnected.', {
			args: { service: this.props.service.label },
			context: 'Sharing: Publicize reconnection confirmation'
		} ) );
	},

	connect: function() {
		this.setState( { isConnecting: true } );
		this.props.connections.once( 'create:success', this.onConnectionSuccess );
		this.props.connections.once( 'create:error', this.onConnectionError );
		this.props.onAddConnection( this.props.service );
	},

	disconnect: function( connections ) {
		if ( 'undefined' === typeof connections ) {
			// If connections is undefined, assume that all connections for
			// this service are to be removed.
			connections = serviceConnections.getRemovableConnections( this.props.service.ID );
		}

		this.setState( { isDisconnecting: true } );
		this.props.connections.once( 'destroy:success', this.onDisconnectionSuccess );
		this.props.connections.once( 'destroy:error', this.onDisconnectionError );
		this.props.onRemoveConnection( connections );
	},

	refresh: function( connection ) {
		this.setState( { isRefreshing: true } );
		this.props.connections.once( 'refresh:success', this.onRefreshSuccess );
		this.props.connections.once( 'refresh:error', this.onRefreshError );

		if ( ! connection ) {
			// When triggering a refresh from the primary action button, find
			// the first broken connection owned by the current user.
			connection = serviceConnections.getRefreshableConnections( this.props.service.ID )[ 0 ];
		}
		this.props.onRefreshConnection( connection );
	},

	performAction: function() {
		const connectionStatus = serviceConnections.getConnectionStatus( this.props.service.ID );

		// Depending on current status, perform an action when user clicks the
		// service action button
		if ( 'connected' === connectionStatus && serviceConnections.getRemovableConnections( this.props.service.ID ).length ) {
			this.disconnect();
			analytics.ga.recordEvent( 'Sharing', 'Clicked Disconnect Button', this.props.service.ID );
		} else if ( 'reconnect' === connectionStatus ) {
			this.refresh();
			analytics.ga.recordEvent( 'Sharing', 'Clicked Reconnect Button', this.props.service.ID );
		} else {
			this.connect();
			analytics.ga.recordEvent( 'Sharing', 'Clicked Connect Button', this.props.service.ID );
		}
	},

	/**
	 * Given a service name and optional site ID, returns the current status of the
	 * service's connection.
	 *
	 * @param {string} service The name of the service to check
	 * @return {string} Connection status.
	 */
	getConnectionStatus: function( service ) {
		let status;

		if ( this.props.isFetching ) {
			// When connections are still loading, we don't know the status
			status = 'unknown';
		} else if ( ! some( this.props.siteConnections, { service } ) ) {
			// If no connections exist, the service isn't connected
			status = 'not-connected';
		} else if ( some( this.props.siteConnections, { status: 'broken', keyring_connection_user_ID: this.props.user.ID } ) ) {
			// A problematic connection exists
			status = 'reconnect';
		} else {
			// If all else passes, assume service is connected
			status = 'connected';
		}

		return status;
	},

	render: function() {
		const connectionStatus = this.getConnectionStatus( this.props.service.ID ),
			connections = serviceConnections.getConnections( this.props.service.ID ),
			elementClass = [
				'sharing-service',
				this.props.service.ID,
				connectionStatus,
				this.state.isOpen ? 'is-open' : ''
			].join( ' ' ),
			iconsMap = {
				Facebook: 'facebook',
				Twitter: 'twitter',
				'Google+': 'google-plus',
				LinkedIn: 'linkedin',
				Tumblr: 'tumblr',
				Path: 'path',
				Eventbrite: 'eventbrite'
			};

		const header = (
			<div>
				<SocialLogo
					icon={ iconsMap[ this.props.service.label ] }
					size={ 48 }
					className="sharing-service__logo" />

				<div className="sharing-service__name">
					<h2>{ this.props.service.label }</h2>
					<ServiceDescription
						service={ this.props.service }
						status={ connectionStatus }
						numberOfConnections={ connections.length } />
				</div>
			</div>
		);

		const content = (
			<div
				className={ 'sharing-service__content ' + ( serviceConnections.isFetchingAccounts() ? 'is-placeholder' : '' ) }>
				<ServiceExamples service={ this.props.service } site={ sites.getSelectedSite() } />
				<ServiceConnectedAccounts
					site={ this.props.site }
					user={ this.props.user }
					service={ this.props.service }
					connections={ connections }
					onAddConnection={ this.connect }
					onRemoveConnection={ this.disconnect }
					isDisconnecting={ this.state.isDisconnecting }
					onRefreshConnection={ this.refresh }
					isRefreshing={ this.state.isRefreshing }
					onToggleSitewideConnection={ this.props.onToggleSitewideConnection } />
				<ServiceTip service={ this.props.service } />
			</div> );

		const action = (
			<ServiceAction
				status={ connectionStatus }
				service={ this.props.service }
				onAction={ this.performAction }
				isConnecting={ this.state.isConnecting }
				isRefreshing={ this.state.isRefreshing }
				isDisconnecting={ this.state.isDisconnecting }
				removableConnections={ serviceConnections.getRemovableConnections( this.props.service.ID ) } />
		);
		return (
			<FoldableCard
				className={ elementClass }
				header={ header }
				clickableHeader
				compact
				summary={ action }
				expandedSummary={ action } >
				{ content }
			</FoldableCard>
		);
	}
} );

export default connect(
	( state ) => ( {
		isFetching: isFetchingConnections( state, getSelectedSiteId( state ) ),
		siteConnections: getConnectionsBySiteId( state, getSelectedSiteId( state ) ),
	} ),
)( SharingService );
