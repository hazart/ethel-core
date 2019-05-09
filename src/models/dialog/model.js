const Sequelize = require('sequelize');
const sequelize = require('../../utils/sequelize').sequelize;


const Dialog = sequelize.define('dialog', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  intentId: {
    type: Sequelize.INTEGER(10).UNSIGNED,
    field: 'intent_id',
    allowNull: true,
  },
  previousIntentName: {
    type: Sequelize.STRING,
    field: 'previous_intent_name',
    allowNull: true,
  },
  currentIntentName: {
    type: Sequelize.STRING,
    field: 'current_intent_name',
    allowNull: true,
  },
  speech: {
    type: Sequelize.STRING,
    field: 'speech',
    allowNull: true,
  },
  resolvedQuery: {
    type: Sequelize.STRING,
    field: 'resolved_query',
    allowNull: true,
  },
}, {
  freezeTableName: true,
  force: false,
  charset: 'utf8',
  collate: 'utf8_general_ci',
  underscored: true,
  timestamps: true,
});

module.exports = Dialog;

