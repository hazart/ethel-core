const Sequelize = require('sequelize');
const sequelize = require('../../utils/sequelize').sequelize;

const UserString = sequelize.define('user_string', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  str: {
    type: Sequelize.STRING,
    field: 'str',
    allowNull: false,
  },
  times: {
    type: Sequelize.INTEGER,
    field: 'times',
    allowNull: false,
  },
}, {
  freezeTableName: true,
  force: false,
  charset: 'utf8',
  collate: 'utf8_general_ci',
  underscored: true,
  timestamps: true,
});

module.exports = UserString;
