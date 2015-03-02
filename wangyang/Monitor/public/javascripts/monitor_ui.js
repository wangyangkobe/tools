/**
 * Created by elqstux on 2015/1/3.
 */

function divEscapedContentElement(message) {
    console.log(message);
    return $('<div></div>').text(message);
}
function divSystemContentElement(message) {
    console.log(message);
    return $('<div></div>').html('<i>' + message + '</i>');
}
/*
 $(document).ready(function () {

 var socket = io.connect();
 $('#send-form').submit(function () {
 //  window.location.reload();
 return false;
 });
 socket.on('fileChanged', function(){
 console.log('browser receive fileChanged!');
 window.location.reload();
 });
 });*/

var start = false;
$(document).ready(function () {
    var socket = io.connect();
    $('#send-form').submit(function () {
        start = true;
        reloadPage();
        socket.on('fileChanged', function () {
            console.log('browser receive fileChanged!');
            reloadPage();
        });
        return false;
    });

    if (start) {
        socket.on('fileChanged', function () {
            console.log('browser receive fileChanged!');
            reloadPage();
        });
        //  window.location.reload();
    };
});

function reloadPage(){
    $.ajax({
        url: '/',
        type: "POST",
        success: function (data) {
            $("body").html(data)
            window.scrollTo(0,document.body.scrollHeight);
        }
    });
}