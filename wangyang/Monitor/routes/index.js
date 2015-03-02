var express = require('express');
var fs = require('fs');
var watch = require('watch');
var io = require('socket.io');
var iconv = require('iconv-lite');
var split = require('split');
var path = require('path');
var moment = require('moment');
var ReportData = require("../models/ReportData");

var reportFile = "C:\\wangyang\\buy_report";
var bigbillFile = "C:\\wangyang\\big_bill";

module.exports = function (app) {

    // starting http  servers
    var server = require('http').createServer(app);
    var io = require('socket.io').listen(server);

    server.listen(app.get('port'), function () {
        console.log('Express server listening on port ' + server.address().port);
    });

    io.on('connection', function (socket) {
        console.log('socket.io connection');
    });

    // monitorFile(io);
    monitorFileChange(io);

    var date = getDateSync(bigbillFile);

    app.get('/', function (req, res) {
        return res.render('index', {data: [], date: date});
    });
    app.get('/history', function (req, res) {
        ReportData.find({}, {_id: false, url: true}, {sort: {url: 1}},function (err, urls) {
            var sortUrls = urls.sort(function(a, b){
                return a.url < b.url;
            });
            res.render('history', {urls: sortUrls, moment: moment});
        });
    });
    app.get('/history/:url', function (req, res) {
        ReportData.findOne({url: req.params.url}, function (error, data) {
            if (error) {
                return "cann't find data!";
            } else {
                return res.render('history_detail', {date: moment(req.params.url, "YYYYMMDD"),
                    data: data.reportData});
            }
        });
    });

    app.post('/', function (req, res) {
        //fs.createReadStream(reportFile).pipe(res);
        fs.readFile(reportFile, function (error, data) {
            var lines = iconv.decode(data, 'GBK')
                .split('\r\n\r\n')
                .filter(function (line) {
                    return line.length != 0;
                });
            ReportData.findOne({url: date.format("YYYYMMDD")}, function (error, obj) {
                if (obj) {
                    ReportData.update(
                        {url: date.format("YYYYMMDD")},
                        {$set: {reportData: lines}},
                        {upsert: true}, function () {
                        });
                } else {
                    console.log("write new data to db!");
                    ReportData.create(new ReportData({url: date.format("YYYYMMDD"), reportData: lines}),
                        function () {
                        });
                }
            });

            return res.render('index', {data: lines, date: date});
        });
    });
};

function monitorFileChange(io) {
    fs.watch("C:\\wangyang", {persistent: true, interval: 500}, function (event, filename) {
        var name = path.join("C:\\wangyang", filename);
        if (name == reportFile) {
            console.log('event is: ' + event + ": file is: " + name);
            console.log("server monitor file changed!");
            io.emit("fileChanged");
        } else if (name == bigbillFile) {
            console.log('event is: ' + event + ": file is: " + name);
            date = getDateSync(bigbillFile);
        }
    });
};

function monitorFile(io) {
    watch.createMonitor("C:\\wangyang", {interval: 1000}, function (monitor) {
        monitor.files[reportFile];

        monitor.on("created", function (filename, stat) {
            console.log("created: " + filename);
        });

        monitor.on("changed", function (filename, curr, prev) {
            if (filename == reportFile) {
                console.log("server monitor file changed!");
                io.emit("fileChanged");
            } else if (filename == bigbillFile) {
                date = getDateSync(bigbillFile);
            }
        });
    });
}

function getDateSync(filename) {
    var date = new Date();
    var dateStr = formatDate(date.getFullYear(), date.getMonth() + 1, date.getDay());
    try {
        var fd = fs.openSync(filename, 'r');
        var buffer = new Buffer(40);
        fs.readSync(fd, buffer, 0, 40, 0);

        var line = buffer.toString('utf8').split("\n")[0];
        var dateStr = line.split(',')[0].split(":")[1];
        return moment(dateStr, "YYYYMMDD");
    } catch (error) {
        fs.closeSync(fd);
        return moment();
    } finally {
        fs.closeSync(fd);
    }
}

function formatDate(year, month, day) {
    return year + "年" + month + "月" + day + "日";
}
function getDate(fileName, callback) {
    fs.open(fileName, 'r', function (error, fd) {
        var date = new Date();
        var dateStr = formatDate(date.getFullYear(), date.getMonth() + 1, date.getDay());
        var buffer = new Buffer(40);

        fs.read(fd, buffer, 0, 40, 0, function (error, data) {

            if (error) return callback(dateStr);

            try {
                var line = buffer.toString('utf8').split("\n")[0];
                var dateStr = line.split(',')[0].split(":")[1];
                return callback(formatDate(dateStr.slice(0, 4), dateStr.slice(4, 6), dateStr.slice(6, 8)));
            } catch (error) {
                return callback(dateStr);
            } finally {
                fs.closeSync(fd);
            }

        });
    });
}