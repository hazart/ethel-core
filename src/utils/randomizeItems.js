/**
 * Get a random integer
 *
 * @param min
 * @param max
 * @return {number}
 */
const getRandomIntInclusive = function(min, max) {
  const newMin = Math.ceil(min);
  const newMax = Math.floor(max);
  return Math.floor(Math.random() * (newMin - newMax + 1)) + newMin;
};

/**
 * Get randomized items
 *
 * @param items
 * @param order
 * @return {Array}
 */
function getRandomizedItems(items, order) {

  let randomItems = [];

  switch (order) {

    case 'x': {
      const imin = 0;
      const imax = items.length - 1;
      randomItems.push(items[getRandomIntInclusive(imin, imax)]);
      break;
    }
    case 'ox': {
      const imin = 1;
      const imax = items.length - 1;
      randomItems.push(items[0]);
      randomItems.push(items[getRandomIntInclusive(imin, imax)]);
      break;
    }
    default: {
      break;
    }
  }

  return randomItems;
}


module.exports = {
  getRandomizedItems,
};
