import { readJSONFile, writeJSONFile, findIndex } from './utils';

class Storage {

  FILE_PATH = {
    customers: './storage/customers.json',
    orders: './storage/orders.json',
  };

  addOrUpdateRecord = (type, id, diff) => {
    return this.getAllRecords(type).then(allRecords => {
      const recordIndex = findIndex(allRecords, { id });
      const currentRecord = allRecords[recordIndex] || {};
      const updatedRecord = {
        ...currentRecord,
        ...diff,
      };
      const updatedAllRecords = allRecords.slice(0, recordIndex)
        .concat(updatedRecord)
        .concat(allRecords.slice(recordIndex + 1));
      return this.saveRecords(type, updatedAllRecords);
    });
  };

  getAllRecords = (type) => {
    return readJSONFile(this.FILE_PATH[type])
      .then(records => records.length ? records : [])
      .catch(() => []);
  };

  saveRecords = (type, records) => {
    return writeJSONFile(this.FILE_PATH[type], records);
  };
}
