
var request = require('request');
var Alexa = require('alexa-sdk');
var xml2js = require('xml2js').parseString;
var APP_ID = undefined;

// api key used to make REST call to GoodReads gateway
var GOOD_READS_API_KEY = 're6BYmOJoljhKLCJqtQA';

function getBookInfo(title, callback) {
    var book = null;
    var url = 'https://www.goodreads.com/book/title.xml?key=' + GOOD_READS_API_KEY + '&title=' + title;
    console.log('requesting url: ' + url);
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            xml2js(body, function(error, result) {
                if (!error) {
                    var bookInfo = result.GoodreadsResponse.book[0];
                    book = {
                        id: bookInfo.id,
                        title: bookInfo.title,
                        ratings_count: bookInfo.ratings_count,
                        average_rating: bookInfo.average_rating,
                        authors: bookInfo.authors
                    };
                    callback(book);
                } else {
                    book = {
                        error: error
                    };
                    callback(book);
                }
            });
        } else {
            book = {
                error: error
            };
            callback(book);
        }
    });
}

//test();

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    //alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit(':tell', 'How are you James');
    },
    'testIntent': function () {
        this.emit('TestMethod');
    }
};

function TestMethod() {
    var book = null;
    var title = 'The Martian';
    title = title.replace(/,\s*$/, '');
    getBookInfo(title, getBookInfoCallback);
}

var getBookInfoCallback = function(book) {
        this.emit(':tellWithCard', 'Here is a test', 'Kindle Companion', 'test')
};
