import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  team: DS.belongsTo('team', {async:true}),
  favoriteTeam: DS.belongsTo('team', {async:true}),
  amazingTeams: DS.hasMany('team', {async:true})
});
