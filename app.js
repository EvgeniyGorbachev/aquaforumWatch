var express = require('express');
var cheerio = require('cheerio');

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://postmaster@sandboxd9a4ef7df6404def898aa18d119cbb4d.mailgun.org:5f597779f2b3b6497488a45c8feebea9@smtp.mailgun.org');

var request = require('request');
var app = express();
app.listen(3001);

var Iconv = require('iconv').Iconv;

var fromEnc = 'cp1251';
var toEnc = 'utf-8';

var translator = new Iconv(fromEnc,toEnc);

var mysql      = require('mysql');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'aquaforum_parse'
});

connection.connect();

//aquaforum sales
var url = 'http://www.aquaforum.ua/forumdisplay.php?f=709';

function sendEmail (textSubject, theme) {
    var mailOptions = {
        from: '"Aquaforum watch 👥" <aquaforum@watch.com>', // sender address 
        to: 'webvagus@gmail.com', // list of receivers 
        subject: textSubject, // Subject line 
        text: theme.title, // plaintext body
        html: '<a href="http://www.aquaforum.ua/showthread.php?t=' + theme.link_id + '">hurry up...</a>'
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
    });
}

function pageParse (url) {
    request(
        {
            uri: url,
            encoding: null
        }
        ,function (error, response, body) {
            if (!error && response.statusCode == 200) {

                $ = cheerio.load(translator.convert(body).toString());

                $("[id^=thread_title_]").each(function( index, value ){

                    var theme = {
                        link_id: $(value).attr('id').split('_')[2],
                        title: $(value).text()
                    };

                    connection.query('SELECT * FROM parse_data WHERE link_id = ?', [theme.link_id],function(err, rows, fields) {
                        if (err) throw err;

                        if (rows.length == 0) {
                            connection.query('INSERT INTO parse_data SET ?', theme, function(err, result) {
                                if (err) throw err;
                                sendEmail('A new theme on aquaforum!', theme);
                            });

                        }
                    });
                });
            }
        });
}

setInterval(function(){
    pageParse(url);
    console.log('Parse each 2 minutes!');
}, 120000);

module.exports = app;