
const models = require('../models');

const User = models.user.Model;
const Dialog = models.dialog.Model;
const UserDetail = models.userDetail.Model;
const UserString = models.userString.Model;
const TargetEmail = models.targetEmail.Model;

// Associations
User.hasMany(Dialog, {
  foreignKey: {
    allowNull: false,
    onDelete: 'CASCADE',
  },
});
Dialog.belongsTo(User);

User.hasMany(UserDetail, {
  foreignKey: {
    allowNull: false,
    onDelete: 'CASCADE',
  },
});
UserDetail.belongsTo(User);

User.hasMany(UserString, {
  foreignKey: {
    allowNull: false,
    onDelete: 'CASCADE',
  },
});
UserString.belongsTo(User);

User.hasMany(TargetEmail, {
  foreignKey: {
    allowNull: false,
    onDelete: 'CASCADE',
  },
});
TargetEmail.belongsTo(User);

UserDetail.hasMany(TargetEmail, {
  foreignKey: {
    allowNull: true,
    onDelete: 'CASCADE',
  },
});
TargetEmail.belongsTo(UserDetail);

User.sync();
Dialog.sync();
UserDetail.sync();
UserString.sync();
TargetEmail.sync();

