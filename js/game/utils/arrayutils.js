/**
 * Created by Jean-Baptiste on 12/03/2017.
 */
module.exports = {
    remove: function (array, item) {
        array = array.filter (function (element) {
            return element !== item;
        });
        return array;
    },
    getRandomCel: function (array) {
        return array[Math.floor(Math.random()*array.length)];
    }
};