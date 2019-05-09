const models = require('../index').server.getModels();

const User = models.user.Model;
const UserDetail = models.userDetail.Model;
const Email = models.targetEmail.Model;
const dataCheck = require('../index').server.getUtils().dataCheck;
const logger = require('../index').server.getUtils().logger;


class ContactActions {
  constructor() {
    this.send = this.send.bind(this);
  }
  send(dialogParams) {
    return new Promise((resolve, reject) => {
      const parameters = dialogParams.apiAiResponse.queryResult.outputContexts[0].parametersFormatted;
      if ((typeof parameters.contact_email !== 'undefined' && parameters.contact_email)
        || (typeof parameters.contact_tel !== 'undefined' && parameters.contact_tel
        && typeof parameters.contact_tel_moment !== 'undefined' && parameters.contact_tel_moment)
        || (typeof parameters.contact_skype !== 'undefined' && parameters.contact_skype)
        || (typeof parameters.contact_chat !== 'undefined' && parameters.contact_chat)) {

        this._createEmail(dialogParams.userId)
          .then(() => UserDetail.update({
            validatedAt: new Date(),
          }, {
            where: {
              name: 'contact_target',
            },
            include: [
              { model: User, where: { id: dialogParams.userId } },
            ],
          }))
          .then(() => {
            resolve(dialogParams);
          })
          .catch((err) => {
            console.error('DF - Error creating contact: ', err);
            reject(err);
          });
      } else {
        resolve(dialogParams);
      }
    });
  }

  _createEmail(userId) {

    logger.info('DF - New request for a contact');


    return new Promise((resolve, reject) => {

      UserDetail.findOne({
        where: {
          name: 'contact_target',
          value: {
            $not: null,
            $ne: ' ',
          },
          validatedAt: null,
        },
        include: [
          { model: User, where: { id: userId } },
        ],
        order: 'created_at DESC',
      })
        .then((data) => {

          if (dataCheck.isDbResultAvailable(data)) {
            return data.id;
          } else {
            logger.debug(`DF - User ${userId} don't have a contact target available`);
            return null;
          }
        })
        .then(data => Email.create({
          user_id: userId,
          subject: 'test contact',
          body: 'some user details',
          user_detail_id: data,
        }))
        .then(resolve)
        .catch(reject);
    });
  }

}

module.exports = ContactActions;
