var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Create Schema
var PSdata = new Schema({
  Date: { type: Date },
  Description1: { type: String },
  Description2: { type: String },
  Amount: { type: Number },
  Currency: { type: String },
  BaseAmount: { type: Number },
  BaseCurrency: { type: String },
  TransactionType: { type: String },
  Account: { type: String },
  ClosingBalance: { type: Number },
  Category: { type: String },
  ParentCategories: { type: String },
  Labels: { type: String },
  Memo: { type: String },
  Note: { type: String },
  ID: { type: String },
  Bank: { type: String }
});

module.exports = mongoose.model("psdata", PSdata, "psdata");
