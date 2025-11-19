const PSdata = require("../models/PSdata");

class DateGateway {
  //Helpers for PSdata (RSS PSdata) database
  async PSdata_ReadAll() {
    var items = await PSdata.find();
    return items;
  }

  //Read many PSdata by their IDs
  async PSdata_ReadMany(ids) {
    var items = await PSdata.find({ _id: { $in: ids } });
    return items;
  }

  //Clear all PSdata records
  async PSdata_ClearAll() {
    var res = await PSdata.deleteMany({});
    return res;
  }

  async PSdata_InsertMany(records, options = {}) {
    if (!Array.isArray(records) || records.length === 0) {
      return [];
    }
    const insertOptions = Object.assign({ ordered: false }, options);
    const inserted = await PSdata.insertMany(records, insertOptions);
    return inserted;
  }

  //Create PSdata records, avoiding duplicates based on 'guid'
  async PSdata_Create(PSdata) {
    let toInsert = [];
    for (let i = 0; i < PSdata.length; i++) {
      var item = await PSdata.find({ guid: PSdata[i].guid });
      if (item.length == 0) {
        await toInsert.push(PSdata[i]);
        console.log("[DG]: Inserted New Item: ", PSdata[i].title);
      } else {
        console.log(
          "[DG]: Item exists already not inserted: ",
          PSdata[i].title
        );
      }
    }
    var ret = await PSdata.insertMany(toInsert);
    return ret;
  }
}
module.exports = DateGateway;
