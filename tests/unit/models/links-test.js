import {
  test,
  moduleForModel
} from "ember-qunit";
import Pretender from "pretender";
import Ember from "ember";

var server;

moduleForModel('moose', 'Links', {
  needs: ['serializer:application', 'adapter:application'],
  teardown: function(){
    if (server) {
      server.shutdown();
      server = null;
    }
  }
});

test('single resource links are available in model data.links property', function(assert){
  server = new Pretender(function(){
    this.get('/mooses/1', function(){
      return [200, {}, {
        id: 1,
        _links: {
          self:  { href: '/mooses/1' },
          cats:  { href: '/mooses/1/cats' }
        }
      }];
    });
  });

  var store = this.store();
  return Ember.run(function(){
    return store.findRecord('moose', 1).then(function(moose){
      var links = moose.get('data.links');

      assert.deepEqual(links, {self: '/mooses/1', cats: '/mooses/1/cats' });
    });
  });
});
