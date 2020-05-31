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


export function getFullFilePath(relativePath) {
  const path = require('path');
  return path.join(__dirname, relativePath);
}


export function readJSONFile(relativePath) {
  const fs = require('fs');
  return new Promise((resolve, reject) => {
    fs.readFile(getFullFilePath(relativePath), { encoding: 'utf-8' }, (error, data) => {
      if (!error) {
        try {
          const json = JSON.parse(data);
          resolve(json);
        }
        catch (e) {
          reject(e);
        }
        resolve()
      }
      else {
        return reject(error);
      }
    });
  });
}


export function writeJSONFile(relativePath, data) {
  const fs = require('fs');
  const dataStr = JSON.stringify(data, 0, 2);

  return new Promise((resolve, reject) => {
    fs.writeFile(getFullFilePath(relativePath), dataStr, 'utf8', error => {
      if (error) {
        reject(error);
      }
      else {
        resolve();
      }
    });
  });
}

export function findIndex(array, query) {
  for (let index = 0; index < array.length; index++) {
    const item = array[index];
    let isMatch = true;
    for (let key in query) {
      if (query[key] !== item[key]) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) {
      return index;
    }
  }
  return -1;
}
