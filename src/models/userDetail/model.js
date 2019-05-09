
const Sequelize = require('sequelize');
const sequelize = require('../../utils/sequelize').sequelize;

const UserDetail = sequelize.define('user_detail', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    field: 'name',
    allowNull: false,
  },
  value: {
    type: Sequelize.STRING,
    field: 'value',
    allowNull: false,
  },
  validatedAt: {
    type: Sequelize.DATE,
    field: 'validated_at',
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

module.exports = UserDetail;
