NucleusEventSync = {
    getRecievers: function() {
        return NucleusUsers.find({recieve_events: true});
    },
    recieveEvents: function() {
        Deps.autorun(function() {
            var events = NucleusEvents.find({});
        });
    }
};
