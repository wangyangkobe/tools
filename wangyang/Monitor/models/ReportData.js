/**
 * Created by elqstux on 2015/1/7.
 */
var mongoose = require('mongoose');

var ReportShcema = new mongoose.Schema({
    url: String,
    reportData: [{type: String}]
});

var ReportData = mongoose.model('ReportData', ReportShcema, 'report');

module.exports = ReportData;