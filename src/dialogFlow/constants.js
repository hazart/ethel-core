module.exports = {
  default: 'platform_unspecified',
  facebook: 'facebook',
  google: 'actions_on_google',
  slack: 'slack',
  alexa: 'alexa',

  content: {
    image: 'image',
    card: 'card',
    carousel: 'carousel', // custom, we have this type when we have several cards in same intent
    text: 'text',
    payload: 'payload',
    quickReplies: 'quickReplies',
  },

  agentType: {
    user: 'user',
    agent: 'agent',
  },
};
