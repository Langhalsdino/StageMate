
const splitTextToList = function(text) {
  return text.toLowerCase().split(" ");
};

const toLowerCase = function(item){
    return item.toLowerCase();
}


module.exports = {
    splitTextToList,
    toLowerCase
};
