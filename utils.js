function template(str, data) {
  return str.replace(/<%=\s*([a-z0-9]+)\s*%>/igm, (match, key) => data[key] || '');
}

function makeQueryString(params) {
  let queryString = [];
  for (let key in params) {
    queryString.push(key + '=' + encodeURIComponent(params[key]));
  }
  return queryString.join('&');
}

function getTimestamp() {
  return new Date().toISOString();
}

function inflect(number, endings, hideNumber = false){
  const cases = [2, 0, 1, 1, 1, 2];
  const endingIndex = (number % 100 > 4 && number % 100 < 20) ? 2 : cases[ Math.min(number % 10, 5) ];
  const ending = endings[endingIndex] || endings[0];
  return hideNumber ? ending : number + ' ' + ending;
}
