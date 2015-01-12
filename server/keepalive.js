Meteor.startup(function() {
	Statuses = {
		OFFLINE: 1,
		IDLE: 2,
		ONLINE: 3
	};

	Meteor.methods({
		keepalive: function (nick, status) {
			console.log('KEEPALIVE METHOD CALL');
		    Meteor.users.update({nick: nick}, {$set: {last_keepalive: moment().toDate().getTime() - 0, status: status}});
		}
	});

	Meteor.startup(function() {
		Meteor.setInterval(function () {
			console.log('KEEPALIVE INTERVAL');
			var offline_threshold = moment().toDate().getTime() - (120*1000);

			Meteor.users.update({last_keepalive: {$lt: offline_threshold}}, 
						{$set: {status: Statuses.OFFLINE}}, 
						{multi: true});
					
		}, 60*1000);
	})
});