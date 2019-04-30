// All the functions in this file have a Promise version (P). This version throws an error so it can be used in a Promise chain.

/**
 * isPrimitiveAvailableP
 *
 * @param  {type} data
 */
function isPrimitiveAvailableP(data) {

  if (typeof data !== 'undefined' && data) {
    return data;
  } else {
    throw new Error('The data is null or undefined');
  }
}

/**
 * isPrimitiveAvailable
 *
 * @param  {type} data
 */
function isPrimitiveAvailable(data) {

  if (typeof data !== 'undefined' && data) {
    return data;
  } else {
    return false;
  }
}

/**
 * isArrayAvailableP
 *
 * @param  {array} data
 */
function isArrayAvailableP(data) {
  if (Array.isArray(data) && data.length > 0) {
    return data;
  } else {
    throw new Error('The type of data is not an array or it\'s empty');
  }
}

/**
 * isArrayAvailable
 *
 * @param  {array} data
 */
function isArrayAvailable(data) {

  if (Array.isArray(data) && data.length > 0) {
    return data;
  } else {
    return false;
  }
}

/**
 * isObjectAvailableP
 *
 * @param  {object} data
 */
function isObjectAvailableP(data) {

  let emptyObject = true;

  const dataProps = Object.keys(data);
  for (let i = 0; i < dataProps.length; i += 1) {
    const prop = dataProps[i];
    if (Object.prototype.hasOwnProperty.call(data, prop)) {
      emptyObject = false;
    }
  }

  if (!emptyObject) {
    return data;
  } else {
    throw new Error('The type of data is not an object or it\'s empty');
  }
}

/**
 * isObjectAvailable
 *
 * @param  {object} data
 */
function isObjectAvailable(data) {

  let emptyObject = true;

  if (data) {
    const dataProps = Object.keys(data);
    for (let i = 0; i < dataProps.length; i += 1) {
      const prop = dataProps[i];
      if (Object.prototype.hasOwnProperty.call(data, prop)) {
        emptyObject = false;
      }
    }
  }

  if (!emptyObject) {
    return data;
  } else {
    return false;
  }
}

/**
 * isDbResultAvailableP
 *
 * Check if the object received from the database is not null and not undefined.
 * If it is null or undefined, reject with an error.
 *
 * @param  {object} data
 */
function isDbResultAvailableP(data) {
  if (typeof data !== 'undefined' && data) {

    if (typeof data.dataValues !== 'undefined' && data.dataValues) {
      return data;
    } else {
      throw new Error('The database result is null or undefined');
    }

  } else {
    throw new Error('The database result is null or undefined');
  }
}

/**
 * isDbResultAvailable
 *
 * Check if the object is already on database without returning errors.
 *
 * @param  {object} data
 */
function isDbResultAvailable(data) {

  if (typeof data !== 'undefined' && data) {
    if (typeof data.dataValues !== 'undefined' && data.dataValues) {
      return data;
    } else {
      return false;
    }

  } else {
    return false;
  }
}

/**
 * isFunctionAvailableP
 *
 * Check if the variable received is a function.
 * If it is null or undefined, reject with an error.
 *
 * @param  {function} data
 */
function isFunctionAvailableP(data) {

  if (typeof data !== 'undefined' && data && typeof data === 'function') {
    return data;
  } else {
    throw new Error('The variable is null, undefined or it\'s not a function');
  }
}

/**
* isFunctionAvailable
*
* Check if the variable received is a function without returning errors.
*
* @param  {function} data
*/
function isFunctionAvailable(data) {

  if (typeof data !== 'undefined' && data && typeof data === 'function') {
    return data;
  } else {
    return false;
  }
}


module.exports = {
  isPrimitiveAvailableP,
  isPrimitiveAvailable,
  isArrayAvailableP,
  isArrayAvailable,
  isObjectAvailableP,
  isObjectAvailable,
  isDbResultAvailableP,
  isDbResultAvailable,
  isFunctionAvailableP,
  isFunctionAvailable,
};
