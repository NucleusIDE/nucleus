Meteor.startup(function() {
	Statuses = {
		OFFLINE: 1,
		IDLE: 2,
		ONLINE: 3
	};
	
	Meteor.setInterval(function() {
		console.log('KEEPALIVE CLIENT');
		Meteor.call('keepalive', NucleusUser.me().nick, Statuses.ONLINE);
	}, 30*1000);
});