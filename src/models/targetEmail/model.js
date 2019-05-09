const Sequelize = require('sequelize');
const sequelize = require('../../utils/sequelize').sequelize;

const TargetEmail = sequelize.define('target_email', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  subject: {
    type: Sequelize.STRING,
    field: 'subject',
    allowNull: true,
  },
  body: {
    type: Sequelize.STRING,
    field: 'body',
    allowNull: true,
  },
  sentAt: {
    type: Sequelize.DATE,
    field: 'sent_at',
    allowNull: true,
  },
  fail: {
    type: Sequelize.BOOLEAN,
    field: 'fail',
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

module.exports = TargetEmail;
