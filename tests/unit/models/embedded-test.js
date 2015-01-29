import {
  test,
  moduleForModel
} from "ember-qunit";
import Pretender from "pretender";
import Ember from "ember";

var server;

moduleForModel('car', 'Embedded Records', {
  needs: [
    'model:wheel',
    'model:lugnut',
    'model:owner',
    'model:team',

    'serializer:application',
    'adapter:application'
  ],
  teardown: function(){
    if (server) {
      server.shutdown();
      server = null;
    }
  }
});

test('findMany: loads deeply nested embedded records', function(){
  server = new Pretender(function(){
    this.get('/cars', function(){
      return [200, {}, {
        _links: {
          self: {
            href: "/cars"
          }
        },
        _embedded: {
          cars: [{
            id: 'miata-1',
            _links: {
              self: {
                href: "/cars/miata-1",
              },
              wheels: {
                href: "/cars/miata-1/wheels",
              }
            },
            _embedded: {
              wheels: [{
                id: 'wheel-front-left',
                _links: {
                  self: { href: "/wheels/wheel-front-left" },
                  car:  { href: "/cars/miata-1" },
                  lugnuts:  { href: "/cars/miata-1/lugnuts" }
                },
                _embedded: {
                  lugnuts: [{
                    id: 'lugnut-1',
                    size: 'extra small'
                  }]
                }
              }, {
                id: 'wheel-front-right',
                _links: {
                  self: { href: "/wheels/wheel-front-right" },
                  car:  { href: "/cars/miata-1" }
                }
              }, {
                id: 'wheel-back-right',
                _links: {
                  self: { href: "/wheels/wheel-back-right" },
                  car:  { href: "/cars/miata-1" }
                }
              }, {
                id: 'wheel-back-left',
                _links: {
                  self: { href: "/wheels/wheel-back-left" },
                  car:  { href: "/cars/miata-1" }
                }
              }]
            }
          }]
        }
      }];
    });
  });

  server.unhandledRequest = function(verb, path, request){
    console.error('unhandled request');
    ok(false, 'Unhandled request for ' + verb + ' ' + path);
  };

  return this.store().find('car').then(function(cars){
    ok(cars, 'records found');
    ok(cars.get('length') > 0, 'cars found');

    var car = cars.get('firstObject');
    return car.get('wheels');
  }).then(function(wheels){
    var firstWheel = wheels.get('firstObject');
    return firstWheel.get('lugnuts');
  }).then(function(lugnuts){
    equal(lugnuts.get('length'), 1, 'finds 1 lugnut');
    equal(lugnuts.get('firstObject.size'), 'extra small', 'finds correct lugnut');
  });
});

test('findMany: loads singly nested embedded single records', function(){
  server = new Pretender(function(){
    this.get('/cars', function(){
      return [200, {}, {
        _links: {
          self: {
            href: "/cars"
          }
        },
        _embedded: {
          cars: [{
            id: 'miata-1',
            _links: {
              self: {
                href: "/cars/miata-1",
              },
              owner: {
                href: "/cars/miata-1/owner",
              }
            },
            _embedded: {
              owner: {
                id: 'owner1',
                name: 'owner #1',
                _links: {
                  self: { href: "/owners/owner1" }
                }
              }
            }
          }, {
            id: 'miata-2',
            _links: {
              self: {
                href: "/cars/miata-2",
              },
              owner: {
                href: "/cars/miata-2/owner",
              }
            },
            _embedded: {
              owner: {
                id: 'owner2',
                name: 'owner #2',
                _links: {
                  self: { href: "/owners/owner2" }
                }
              }
            }
          }]
        }
      }];
    });
  });

  server.unhandledRequest = function(verb, path, request){
    console.error('unhandled request');
    ok(false, 'Unhandled request for ' + verb + ' ' + path);
  };

  var cars;

  return this.store().find('car').then(function(_cars){
    cars = _cars;
    equal(cars.get('length'), 2, 'cars found');

    var car1 = cars.get('firstObject');
    return car1.get('owner');
  }).then(function(owner){
    equal(owner.get('name'), 'owner #1', 'loads embedded owner 1');

    var car2 = cars.get('lastObject');
    return car2.get('owner');
  }).then(function(owner){
    equal(owner.get('name'), 'owner #2', 'loads embedded owner 2');
  });
});

test('findMany: loads multiply nested embedded single records', function(){
  server = new Pretender(function(){
    this.get('/cars', function(){
      return [200, {}, {
        _links: {
          self: {
            href: "/cars"
          }
        },
        _embedded: {
          cars: [{
            id: 'miata-1',
            _links: {
              self: {
                href: "/cars/miata-1",
              },
              owner: {
                href: "/cars/miata-1/owner",
              }
            },
            _embedded: {
              owner: {
                id: 'owner1',
                name: 'owner #1',
                _links: {
                  self: { href: "/owners/owner1" }
                },
                _embedded: {
                  team: {
                    id: 'team-1',
                    name: 'winning team'
                  }
                }
              }
            }
          }, {
            id: 'miata-2',
            _links: {
              self: {
                href: "/cars/miata-2",
              },
              owner: {
                href: "/cars/miata-2/owner",
              }
            },
            _embedded: {
              owner: {
                id: 'owner2',
                name: 'owner #2',
                _links: {
                  self: { href: "/owners/owner2" }
                },
                _embedded: {
                  team: {
                    id: 'team-2',
                    name: 'losing team'
                  }
                }
              }
            }
          }]
        }
      }];
    });
  });

  server.unhandledRequest = function(verb, path, request){
    console.error('unhandled request');
    ok(false, 'Unhandled request for ' + verb + ' ' + path);
  };

  var cars;

  return this.store().find('car').then(function(_cars){
    cars = _cars;
    equal(cars.get('length'), 2, 'cars found');

    var car1 = cars.get('firstObject');
    return car1.get('owner');
  }).then(function(owner){
    return owner.get('team');
  }).then(function(team){
    equal(team.get('name'), 'winning team', 'loads doubly embedded team model');
  });
});

test('findMany: handles the same object embedded for different records', function(){
  server = new Pretender(function(){
    this.get('/owners', function(){
      return [200, {}, {
        _links: {
          self: {
            href: "/owners"
          }
        },
        _embedded: {
          owners: [{
            id: "owner-1",
            _links: {
              self: { href: "/owners/owner-1" },
              team: { href: "/teams/team-1" }
            },
            _embedded: {
              team: {
                id: 'team-1',
                name: 'winning team',
                _links: {
                  self: { href: "/teams/team-1" }
                }
              }
            }
          }, {
            id: "owner-2",
            _links: {
              self: { href: "/owners/owner-2" },
              team: { href: "/teams/team-1" },
            },
            _embedded: {
              team: {
                id: "team-1",
                name: "winning team",
                _links: {
                  self: { href: "/teams/team-1" }
                }
              }
            }
          },{
            id: "owner-3",
            _links: {
              self: { href: "/owners/owner-3" },
              team: { href: "/teams/team-2" },
            },
            _embedded: {
              team: {
                id: "team-2",
                name: "losing team",
                _links: {
                  self: { href: "/teams/team-2" }
                }
              }
            }
          }]
        }
      }];
    });
  });

  server.unhandledRequest = function(verb, path, request){
    console.error('unhandled request');
    ok(false, 'Unhandled request for ' + verb + ' ' + path);
  };

  var owners, winningTeam;

  return this.store().find('owner').then(function(_owners){
    owners = _owners;

    equal(owners.get('length'), 3, 'finds owners');

    return owners.objectAt(0).get('team');
  }).then(function(team){
    equal(team.get('name'), 'winning team', 'finds owner 1 team');
    winningTeam = team;

    return owners.objectAt(1).get('team');
  }).then(function(team){
    equal(team.get('name'), 'winning team', 'finds owner 2 team');

    ok(team === winningTeam, 'owner 1 and 2 have same team');

    return owners.objectAt(2).get('team');
  }).then(function(team){
    equal(team.get('name'), 'losing team', 'finds owner 3 team');

    ok(team !== winningTeam, 'losing team is not winning team');
  });
});

test('find many: loads embedded array of records with a custom name', function(){
  server = new Pretender(function(){
    this.get('/owners', function(){
      return [200, {}, {
        _embedded: {
          owners: [{
            id: "owner-1",
            name: 'owner #1',
            _embedded: {
              amazing_teams: [{
                id: 'team1',
                name: 'winning team',
                _links: { self: { href: "/teams/team1" } }
              },{
                id: 'team2',
                name: 'losing team',
                _links: { self: { href: "/teams/team2" } }
              }]
            }
          }, {
            id: "owner2",
            name: 'owner #2',
            _embedded: {
              amazing_teams: [{
                id: 'team3',
                name: 'team#3',
                _links: { self: { href: "/teams/team3" } }
              },{
                id: 'team4',
                name: 'team#4',
                _links: { self: { href: "/teams/team4" } }
              }]
            }
          }]
        }
      }];
    });
  });

  server.unhandledRequest = function(verb, path, request){
    console.error('unhandled request');
    ok(false, 'Unhandled request for ' + verb + ' ' + path);
  };

  var store = this.store();
  var owners;

  return Ember.run(function(){
    return store.find('owner').then(function(_owners){
      owners = _owners;

      equal(owners.get('length'), 2, 'gets 2 owners');

      return owners.objectAt(0).get('amazingTeams');
    }).then(function(teams){
      ok(!!teams, 'loads amazing teams for first owner');

      equal(teams.get('length'), 2, 'gets all amazing teams');
      equal(teams.get('firstObject.name'), 'winning team');
      equal(teams.get('lastObject.name'), 'losing team');

      return owners.objectAt(1).get('amazingTeams');
    }).then(function(teams){
      ok(!!teams, 'loads amazing teams for second owner');

      equal(teams.get('length'), 2, 'gets all amazing teams');
      equal(teams.get('firstObject.name'), 'team#3');
      equal(teams.get('lastObject.name'), 'team#4');
    });
  });
});


test('find one: loads embedded array of records with a custom name', function(){
  server = new Pretender(function(){
    this.get('/owners/owner-1', function(){
      return [200, {}, {
        id: "owner-1",
        name: 'owner #1',
        _embedded: {
          amazing_teams: [{
            id: 'team-1',
            name: 'winning team',
            _links: { self: { href: "/teams/team-1" } }
          },{
            id: 'team-2',
            name: 'losing team',
            _links: { self: { href: "/teams/team-2" } }
          }]
        }
      }];
    });
  });

  server.unhandledRequest = function(verb, path, request){
    console.error('unhandled request');
    ok(false, 'Unhandled request for ' + verb + ' ' + path);
  };

  var store = this.store();
  var owner;

  return Ember.run(function(){
    return store.find('owner', 'owner-1').then(function(_owner){
      owner = _owner;

      ok(!!owner, 'loads owner');
      equal(owner.get('name'), 'owner #1');

      return owner.get('amazingTeams');
    }).then(function(teams){
      ok(!!teams, 'loads amazing team');

      equal(teams.get('length'), 2, 'gets all amazing teams');
      equal(teams.get('firstObject.name'), 'winning team');
      equal(teams.get('lastObject.name'), 'losing team');
    });
  });
});

test('find one: loads singly embedded records', function(){
  server = new Pretender(function(){
    this.get('/owners/owner-1', function(){
      return [200, {}, {
        _links: {
          self: { href: "/owners/owner-1" },
          team: { href: "/teams/team-1" }
        },
        id: "owner-1",
        name: 'owner #1',
        _embedded: {
          team: {
            id: 'team-1',
            name: 'winning team',
            _links: { self: { href: "/teams/team-1" } }
          }
        }
      }];
    });
  });

  server.unhandledRequest = function(verb, path, request){
    console.error('unhandled request');
    ok(false, 'Unhandled request for ' + verb + ' ' + path);
  };

  var store = this.store();

  return Ember.run(function(){
    return store.find('owner', 'owner-1').then(function(owner){
      ok(!!owner, 'loads owner');
      equal(owner.get('name'), 'owner #1');

      return owner.get('team');
    }).then(function(team){
      ok(!!team, 'loads team');
      equal(team.get('name'), 'winning team');
    });
  });
});

test('find one: loads an embedded record with a custom name', function(){
  server = new Pretender(function(){
    this.get('/owners/owner-1', function(){
      return [200, {}, {
        id: "owner-1",
        name: 'owner #1',
        _embedded: {
          favorite_team: {
            id: 'team-1',
            name: 'winning team',
            _links: { self: { href: "/teams/team-1" } }
          },
          team: {
            id: 'team-2',
            name: 'losing team',
            _links: { self: { href: "/teams/team-2" } }
          }
        }
      }];
    });
  });

  server.unhandledRequest = function(verb, path, request){
    console.error('unhandled request');
    ok(false, 'Unhandled request for ' + verb + ' ' + path);
  };

  var store = this.store();
  var owner;

  return Ember.run(function(){
    return store.find('owner', 'owner-1').then(function(_owner){
      owner = _owner;

      ok(!!owner, 'loads owner');
      equal(owner.get('name'), 'owner #1');

      return owner.get('team');
    }).then(function(team){
      ok(!!team, 'loads team');
      equal(team.get('name'), 'losing team');

      return owner.get('favoriteTeam');
    }).then(function(team){
      ok(!!team, 'loads favorite team');
      equal(team.get('name'), 'winning team');
    });
  });
});
