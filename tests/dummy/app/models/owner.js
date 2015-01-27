import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr('string'),
  team: DS.belongsTo('team', {async:true}),
  favoriteCar: DS.belongsTo('car', {async:true})
});
