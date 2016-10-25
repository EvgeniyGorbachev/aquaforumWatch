var express = require('express');
var cheerio = require('cheerio');

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport('smtps://postmaster@sandboxd9a4ef7df6404def898aa18d119cbb4d.mailgun.org:5f597779f2b3b6497488a45c8feebea9@smtp.mailgun.org');

var request = require('request');
var app = express();

var Iconv = require('iconv').Iconv;

var fromEnc = 'cp1251';
var toEnc = 'utf-8';

var translator = new Iconv(fromEnc,toEnc);

var Datastore = require('nedb');
db = new Datastore({ filename: 'data.db' , autoload: true});

//aquaforum sales page
var url = 'http://www.aquaforum.ua/forumdisplay.php?f=709';

//watching period in sec.
var period = 120;

//email for send
var email = 'webvagus@gmail.com';

function sendEmail (textSubject, theme) {
    var mailOptions = {
        from: '"Aquaforum watch 👥" <aquaforum@watch.com>', // sender address 
        to: email, // list of receivers 
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

                    db.find(theme, function (err, docs) {
                        if (docs.length == 0) {
                            db.insert([theme], function (err) {
                                sendEmail('A new theme on aquaforum!', theme);
                            });
                        }
                    });
                });
            }
        });
}

//start watching
setInterval(function(){
    pageParse(url);
    console.log('Parse each 2 minutes!');
}, period * 1000);
