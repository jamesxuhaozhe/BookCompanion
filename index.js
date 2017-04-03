
var request = require('request');
var Alexa = require('alexa-sdk');
var xml2js = require('xml2js').parseString;
var APP_ID = undefined;
var SKILL_NAME = 'Kindle Companion';

// api key used to make REST call to GoodReads gateway
var GOOD_READS_API_KEY = 'xxxxxx';

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
        var message = 'Hi I am Kindle Companion. I can get ratings and description of the book for now.'
        + ' Simply say get book, followed by book title.';
        this.emit(':ask', message, 'Hi I am Kindle Companion! What can I help you with? Just say get book, followed by book title.');
    },
    'testIntent': function () {
        this.emit('TestMethod');
    },

    'AMAZON.HelpIntent': function () {
        var speechOutput = 'You can say get book followed by book title, or, you can say exit... What can I help you with?';
        var reprompt = 'What can I help you with? Just say get book, followed by book title.';
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'Goodbye! Have a wonderful hack day!');
    },

    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'Goodbye! Have a nice hack day!');
    },

    'visionIntent': function() {
        this.emit(':tell', 'My functionalities are quit limited for now, however if I can be connected to internal Kindle services. I can provide better recommendations, purchase books for you and much more. Happy hack day!');
    },

    'getRating': function() {
        if (this.attributes['bookFound']) {
            var book = this.attributes['book'];
            var speechOutput = book.title + " has " + book.ratings_count + ' ratings.' + ' The average rating is ' + book.average_rating;
            var message = "There are " + book.ratings_count + ' ratings,' + ' And the average is ' + book.average_rating;
            this.emit(':ask', speechOutput, SKILL_NAME, message);
        } else {
            var message = 'Sorry I was not able to find your book. I can find a book for you. Simply say get book, followed by book title. Or you can also say help.';
            this.emit(':tell', message);
        }
    },

    'getDescription': function() {
        if (this.attributes['bookFound']) {
            var book = this.attributes['book'];
            if (book.description) {
                var speechOutput = 'Here is the description. ' + book.description;
                var message = speechOutput.replace(/<\/?[^>]+(>|$)/g, "");
                this.emit(':ask', message, message);
            } else {
                var speech = 'I am sorry that I was not able to find any description for for this book. You can ask me another book.';
                this.emit(':tell', message);
            }

        } else {
            var message = 'Sorry I was not able to find your book. I can find a book for you. Simply say get book, followed by book title. Or you can also say help.';
            this.emit(':tell', message);
        }
    },
    'getBook': function() {

        this.attributes['bookFound'] = false;
        var slots = this.event.request.intent.slots;
        var input = getslots(slots);
        if (!input.status) {
            var message = 'Sorry I was not able to find your book. I can find a book for you. Simply say get book, followed by book title.';
            this.emit(':ask', message, 'Simply say get book, followed by book title.');
        }
        //var title = 'The Martian';
        var title = input.title;
        title = title.replace(/,\s*$/, '');
        var self = this;

        var getBookInfoCallback = function(book) {
            var message = '';
            if (book.error) {
                message = 'Sorry I was not able to find your book.';
                self.emit('LaunchRequest');
            } else {
                var speechOutput = 'I found your book!' + ' ' + book.title + '.' + ' Please say get rating to know the rating of the book and get description to know what the book is about.';
                var reprompt = speechOutput;
                self.attributes['bookFound'] = true;
                self.attributes['book'] = book;
                self.handler.shouldEndSession = false;
                self.emit(':ask', speechOutput, reprompt);
            }
        };

        var maiCallback = function getBookInfo(title, callback) {
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
                                authors: bookInfo.authors,
                                description: bookInfo.description
                            };
                            callback(book);
                        } else {
                            book = {
                                error: 'error'
                            };
                            callback(book);
                        }
                    });
                } else {
                    book = {
                        error: 'error'
                    };
                    callback(book);
                }
            });
        };

        maiCallback(title, getBookInfoCallback);
    }
};

function getslots(slots) {
    var input = null;
    for (var slot in slots) {
        if (slots[slot].value != undefined) {
            input = {
                title: slots[slot].value.toString(),
                status: true
            };
            return input;
        }
    }
    input = {
        title: '',
        status: false
    }
    return input;
}
