const Sequelize = require('sequelize');
const sequelize = require('../../utils/sequelize').sequelize;

const User = sequelize.define('user', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  senderId: {
    type: Sequelize.STRING,
    field: 'sender_id',
    allowNull: false,
  },
  messenger: {
    type: Sequelize.STRING,
    field: 'messenger',
    allowNull: false,
  },
  firstName: {
    type: Sequelize.STRING,
    field: 'first_name',
    allowNull: true,
  },
  lastName: {
    type: Sequelize.STRING,
    field: 'last_name',
    allowNull: true,
  },
  gender: {
    type: Sequelize.STRING,
    field: 'gender',
    allowNull: true,
  },
  locale: {
    type: Sequelize.STRING,
    field: 'locale',
    allowNull: true,
  },
  profilePic: {
    type: Sequelize.STRING,
    field: 'profile_pic',
    allowNull: true,
  },
  timezone: {
    type: Sequelize.STRING,
    field: 'timezone',
    allowNull: true,
  },
  unavailable: {
    type: Sequelize.BOOLEAN,
    field: 'unavailable',
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

module.exports = User;
