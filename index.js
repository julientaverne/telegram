var express = require('express');
var fs = require('fs')
var https = require('https')
var request = require('request');
var app = express();
const fetch = require('node-fetch');
const axios = require("axios");

/**
 * Checks if the update received in the web server comes from Telegram Bot API 
 *
 * @param {object} request Request received in web server
 *
 * @return {boolean} True if the message comes from Telegram Bot API, False otherwise
 *
 */
function checkTelegramAuth(request) {
    console.log("001",request);
    if(request['parameter'] && request['parameter']['token']) {
      return request['parameter']['token'] == scriptProperties.getProperty('TelegramAPIAuthToken')
    }
    
    return false;
  }


  app.use(bodyParser.json()) // for parsing application/json
  app.use(
      bodyParser.urlencoded({
          extended: true,
      })
  ) // for parsing application/x-www-form-urlencoded

  app.post("/new-message", function(req, res) {
	const { message } = req.body

	//Each message contains "text" and a "chat" object, which has an "id" which is the chat id

	if (!message || message.text.toLowerCase().indexOf("marco") < 0) {
		// In case a message is not present, or if our message does not have the word marco in it, do nothing and return an empty response
		return res.end()
	}

	// If we've gotten this far, it means that we have received a message containing the word "marco".
	// Respond by hitting the telegram bot API and responding to the appropriate chat_id with the word "Polo!!"
	// Remember to use your own API toked instead of the one below  "https://api.telegram.org/bot<your_api_token>/sendMessage"
	axios
		.post(
			"https://api.telegram.org/bot1544386242:AAGn7SBWQGrUn45hk2nJMwV6bhxToMpCI_A/sendMessage",
			{
				chat_id: message.chat.id,
				text: "Polo!! v2",
			}
		)
		.then((response) => {
			// We get here if the message was successfully posted
			console.log("Message posted")
			res.end("ok")
		})
		.catch((err) => {
			// ...and here if it was not
			console.log("Error :", err)
			res.end("Error :" + err)
		})
})


app.post('/www', function (req, res) {
    console.log("req", req);
    //if(checkTelegramAuth(request)) {
        let update = JSON.parse(request['postData']['contents']);
              
        // Make sure this is update is a type message
        if (update.hasOwnProperty('inline_query')) {
          let inlineQuery = update['inline_query'];
          handleInlineQuery(inlineQuery);
                  
        } else if(update.hasOwnProperty('message')) {
          let msg = update['message'];
          
          if(msg.hasOwnProperty('text')) {
            if(msg['text'].indexOf('/start') > -1) {
              handleStart(msg);
            } else {
              if(!msg.hasOwnProperty('via_bot')) {
                handleMessageDefault(msg);
              }
            }
          }
        }
      //}
})




//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// CONTROLLER
/**
 * Handle inline queries from the different Telegram clients
 *
 * @param {object} inlineQuery Inline query received from Telegram client
 */
function handleInlineQuery(inlineQuery) {
    console.log("inlineQuery",inlineQuery);
    let query = inlineQuery['query'];
        
    if(query != '') {
      
      let page = 1;
      let nextOffset = 1;
      
      if(inlineQuery['offset'] !== '') {
        page = Number(inlineQuery['offset']) + 1;
        nextOffset = Number(inlineQuery['offset']) + 1;
      }
      
      if(inlineQuery['from'].hasOwnProperty('inline_query')) {
        var searchResults = searchMulti(searchQuery=query, language=inlineQuery['from']['language_code'], page=page);
      } else {
        var searchResults = searchMulti(searchQuery=query, page=page);
      }
      
      let answers = [];
      
      let answersCount = 0;
      for(let i in searchResults['results']) {
        if(searchResults['results'][i]['media_type'] == 'tv' || searchResults['results'][i]['media_type'] == 'movie') {
          let answer = {};
          
          answer['type'] = 'article';
          answer['id'] = String(answersCount);
          answer['thumb_url'] = imageBaseUrl + searchResults['results'][i]['poster_path'];
          answer['hide_url'] = true;
          
          if(searchResults['results'][i].hasOwnProperty('overview')) {
            answer['description'] = searchResults['results'][i]['overview'];
          }
          
          
          if(searchResults['results'][i].hasOwnProperty('title')) {
            answer['title'] = searchResults['results'][i]['title'];
          } else if(searchResults['results'][i].hasOwnProperty('name')) {
            answer['title'] = searchResults['results'][i]['name'];
          }
          
          let tmdbUrl = '';
          
          if(searchResults['results'][i]['media_type'] == 'tv') {
            tmdbUrl = tmdbBaseTvUrl + searchResults['results'][i]['id'];
          } else {
            tmdbUrl = tmdbBaseUrl + searchResults['results'][i]['id'];
          }
          
          answer['url'] = tmdbUrl;
          
          answer['input_message_content'] = {
            'message_text': generateTemplatedText(answer['title'], tmdbUrl, searchResults['results'][i]),
            'parse_mode': 'HTML'
          };
          
          answers.push(answer);
          answersCount += 1;
        }            
      }
      
      if(answers.length >= 20) {
        answerInlineQuery(inlineQuery, answers, cacheTime=300, nextOffset=nextOffset + 1);    
      } else {
        answerInlineQuery(inlineQuery, answers, cacheTime=300);    
      }
      
    }
  }
  
  /**
   * Generates InlineKeyboardMarkup object
   *
   * @param {array} buttonsArray Array of arrays with InlineKeyboardButtons
   * @return {object} InlineKeyboardMarkup object generated
   */
  function generateInlineKeyboardMarkup(buttonsArray) {
    let inlineKeyboardMarkup = {
      'inline_keyboard': buttonsArray
    };
    
    return inlineKeyboardMarkup;
    
  }
  
  /**
   * Generates InlineKeyboardButton object with switchInlineQuery or switchInlineQueryCurrentChat
   *
   * @param {string} text Text of the button
   * @param {object} switchInlineQuery Optional query to be passed to the bot on the same chat
   * @return {object} switchInlineQueryCurrentChat Optional query to be passed to the bot on a different chat
   */
  function generateInlineKeyBoardButton(text, switchInlineQuery=null, switchInlineQueryCurrentChat=null) {
    let inlineKeyboardButton = {
      'text': text
    };
    
    if(switchInlineQuery || switchInlineQuery === '') {
      inlineKeyboardButton['switch_inline_query'] = switchInlineQuery
    }
    
    if(switchInlineQueryCurrentChat || switchInlineQueryCurrentChat === '') {
      inlineKeyboardButton['switch_inline_query_current_chat'] = switchInlineQueryCurrentChat
    }
    
    return inlineKeyboardButton; 
    
  }
  
  /**
   * Generates templated message to be returned by InlineQuery
   *
   * @param {string} title Title of the movie/TV show
   * @param {string} tmdbUrl TMDB URL of the movie/TV show
   * @param {object} searchResults Object representing a movie/TV with info from TMDB
   * @return {string} Rendered template
   */
  function generateTemplatedText(title, tmdbUrl, searchResults) {
    let template = HtmlService.createTemplateFromFile('InlineQuery/views/inlineQuerySearchResult');
            
    let toTemplate = {
      'title': title,
      'mediaType': searchResults['media_type'],
      'releaseDate': searchResults['release_date'],
      'voteAverage': searchResults['vote_average'],
      'originalLanguage': searchResults['original_language'],
      'thumb_url': imageBaseUrl + searchResults['poster_path']    
    }
    
    if(searchResults.hasOwnProperty('overview')) {
      toTemplate['description'] = searchResults['overview'];
    } else {
      toTemplate['description'] = '';
    }
      
    if(searchResults['media_type'] == 'tv') {
      tmdbUrl = tmdbBaseTvUrl + searchResults['id'];
    } else {
      tmdbUrl = tmdbBaseUrl + searchResults['id'];
    }
    
    toTemplate['tmdbUrl'] = tmdbUrl;
    
    template['data'] = toTemplate;
    
    return template.evaluate().getContent();
  }






//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// MESSAGES
/**
 * Handle /start messages sent to the bot
 *
 */
function handleStart(msg) {
  
    let localButton = generateInlineKeyBoardButton('🔍 Find me the movie/show', switchInlineQuery=null, switchInlineQueryCurrentChat="");
    let shareButton = generateInlineKeyBoardButton('↗️ Find & share movies/shows with friends', switchInlineQuery="", switchInlineQueryCurrentChat=null);
    
    let buttonsArray = [];
    buttonsArray.push([localButton]);
    buttonsArray.push([shareButton]);
    
    let inlineKeyboardMarkup = generateInlineKeyboardMarkup(buttonsArray);
    let msgText = "This bot can help you find and share movies. It works in any chat, just write @themoviedatabase_bot in the text field. Let's try!"
    sendMessage(msg, msgText, replyTo=false, replyMarkup=inlineKeyboardMarkup);
  }
  
  /**
   * Handle every other messages sent to the bot
   *
   */
  function handleMessageDefault(msg) {
    
    let queryText = msg['text'];
    let localButton = generateInlineKeyBoardButton('🔍 In this chat', switchInlineQuery=null, switchInlineQueryCurrentChat=queryText);
    let shareButton = generateInlineKeyBoardButton('↗️ Share to other chat', switchInlineQuery=queryText, switchInlineQueryCurrentChat=null);
    
    let buttonsArray = [];
    buttonsArray.push([localButton]);
    buttonsArray.push([shareButton]);
    
    let inlineKeyboardMarkup = generateInlineKeyboardMarkup(buttonsArray);
    let msgText = `You come to me and ask me to search for '<b>${queryText}</b>'. Now I ask you... where?`;
    sendMessage(msg, msgText, replyTo=false, replyMarkup=inlineKeyboardMarkup);
  }
  


//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// TELEGRAMAPI
const apiTelegramBotBaseUrl = 'https://api.telegram.org/bot';

//const apiToken = scriptProperties.getProperty('TelegramBotApiToken');
const apiToken = "1544386242:AAGn7SBWQGrUn45hk2nJMwV6bhxToMpCI_A";

/**
 * Gets info about current Telegram API Webhook
 *
 * @return {object} JSON search result resource returned by Telegram API
 */
function getWebhookInfo() {
  //let result = UrlFetchApp.fetch(`${apiTelegramBotBaseUrl}${apiToken}/getWebhookInfo`).getContentText();
  //Logger.log(result);
  //return JSON.parse(result);
  fetch(`${apiTelegramBotBaseUrl}${apiToken}/getWebhookInfo`)
  .then(res => res.text())
  .then(text => console.log(text))
}

/**
 * Sets a new Webkhook to receive updates from Telegram API
 *
 * @return {object} JSON search result resource returned by Telegram API
 */
function setWebhook() {
  
  let webhookUrl = "https://178.62.95.105/www"; //scriptProperties.getProperty('WebhookUrl');
  //let telegramApiAuthToken = scriptProperties.getProperty('TelegramAPIAuthToken');
  
  let payload = {
    'method': 'setWebhook',
    'allowed_updates': []
  }

  let data = {
    'method': 'POST',
    'payload': payload
  }
  
  //let result = UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/setWebhook?url=' + webhookUrl /*+ '?token=' + telegramApiAuthToken*/, data).getContentText();
  //let result = UrlFetchAp.fetch(apiTelegramBotBaseUrl + apiToken + '/setWebhook?url=' + webhookUrl , data).getContentText();
  fetch(apiTelegramBotBaseUrl + apiToken + '/setWebhook?url=' + webhookUrl,data)
    .then(res => res.text())
    .then(text => {
        console.log(text);
        getWebhookInfo();
    })
  //Logger.log(result);
  //return JSON.parse(result);
}


/**
 * Deletes current Webkhook to stop receiving updates from Telegram API
 *
 * @return {object} JSON search result resource returned by Telegram API
 */
function deleteWebHook() {
  
  let webhookUrl = "https://178.62.95.105/www"; //scriptProperties.getProperty('WebhookUrl');
  //let telegramApiAuthToken = scriptProperties.getProperty('TelegramAPIAuthToken');
  
  let payload = {
    'method': 'deleteWebhook'
  }

  let data = {
    'method': 'POST',
    'payload': payload
  }
  
  //let result = UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/deleteWebhook', data).getContentText();
  //Logger.log(result);
  //return JSON.parse(result);
  fetch(apiTelegramBotBaseUrl + apiToken + '/deleteWebhook',data)
    .then(res => res.text())
    .then(text => {
        console.log(text);
        setWebhook();
    })
  
}

/**
 * Sends text message to a Telegram chat represented in msg object
 *
 * @param {object} msg Telegram API message resource
 * @param {string} message Message to send to chat
 * @param {boolean} replyTo True if the message to send is a reply to the provided message
 * @param {object} replyMarkup 
 *
 * @return {object} JSON response returned by Telegram API
 */
function sendMessage(msg, message, replyTo=false, replyMarkup=null) {
  let payload = {
    'method': 'sendMessage',
    'chat_id': String(msg['chat']['id']),
    'text': message,
    'parse_mode': 'HTML'
  }
  
  if(replyTo) {
    payload['reply_to_message_id'] = msg['message_id']
  }
  
  if(replyMarkup) {
    payload['reply_markup'] = JSON.stringify(replyMarkup)
  }

  let data = {
    'method': 'POST',
    'payload': payload,
    'muteHttpExceptions': true
  }
  
  return JSON.parse(UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/', data).getContentText());
}

/**
 * Sends photo to a Telegram chat represented in msg object
 *
 * @param {object} msg Telegram API message resource
 * @param {File} photo Google Drive File object of the photo to send
 * @param {boolean} replyTo True if the message to send is a reply to the provided message
 * @param {string} caption Text to send as caption of the photo
 *
 * @return {object} JSON response returned by Telegram API
 */
function sendPhoto(msg, photo, replyTo=false, caption=null) {
  Logger.log(msg);
  let payload = {
    'method': 'sendPhoto',
    'chat_id': String(msg['chat']['id']),
    'photo': photo.getBlob(),
    'parse_mode': 'HTML'
  }
  
  if(replyTo) {
    payload['reply_to_message_id'] = String(msg['message_id']);
  }
  
  if(caption) {
    payload['caption'] = caption;
  }
  
  let data = {
    'method': 'POST',
    'payload': payload,
    'muteHttpExceptions': true
  }

  return JSON.parse(UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/', data).getContentText());  
}

// TODO: Cambiar gestión de nombre
/**
 * Sends document to a Telegram chat represented in msg object
 *
 * @param {object} msg Telegram API message resource
 * @param {File} document Google Drive File object of the document to send
 * @param {string} name Name of the document to send
 * @param {boolean} replyTo True if the message to send is a reply to the provided message
 *
 * @return {object} JSON response returned by Telegram API
 */
function sendDocument(msg, document, name, replyTo=false) {
  let payload = {
    'method': 'sendDocument',
    'chat_id': String(msg['chat']['id']),
    'document': document.getBlob().setName(name)
  }
  
  if(replyTo) {
    payload['reply_to_message_id'] = String(msg['message_id']);
  }

  let data = {
    'method': 'POST',
    'payload': payload,
    'muteHttpExceptions': true
  }

  return JSON.parse(UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/', data).getContentText());  
}

/**
 * Sends animation (GIF) to a Telegram chat represented in msg object
 *
 * @param {object} msg Telegram API message resource
 * @param {File} animation Google Drive File object of the animation to send
 * @param {boolean} replyTo True if the message to send is a reply to the provided message
 *
 * @return {object} JSON response returned by Telegram API
 */
function sendAnimation(msg, animation, replyTo=false) {
  let payload = {
    'method': 'sendAnimation',
    'chat_id': String(msg['chat']['id']),
    'animation': animation.getBlob()
  }
  
  if(replyTo) {
    payload['reply_to_message_id'] = String(msg['message_id']);
  }

  let data = {
    'method': 'POST',
    'payload': payload,
    'muteHttpExceptions': true
  }

  return JSON.parse(UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/', data).getContentText());  
}

/**
 * Sends voice file to a Telegram chat represented in msg object
 *
 * @param {object} msg Telegram API message resource
 * @param {File} voice Google Drive File object of the voice to send
 * @param {caption} Text to send as caption of the photo
 * @param {boolean} replyTo True if the message to send is a reply to the provided message
 *
 * @return {object} JSON response returned by Telegram API
 */
function sendVoice(msg, voice, caption=null, replyTo=false) {
  
  let payload = {
    'method': 'sendVoice',
    'chat_id': String(msg['chat']['id']),
    'voice': voice.getBlob()
  }
  
  if(caption) {
    payload['caption'] = caption;
  }
  
  if(replyTo) {
    payload['reply_to_message_id'] = String(msg['message_id']);
  }

  var data = {
    'method': 'POST',
    'payload': payload,
    'muteHttpExceptions': true
  }

  return JSON.parse(UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/', data).getContentText());  
}

/**
 * Sends location to a Telegram chat represented in msg object
 *
 * @param {object} msg Telegram API message resource
 * @param {float} latitude Latitude of the location to be sent
 * @param {float} longitude Longitude of the location to be sent
 * @param {boolean} replyTo True if the message to send is a reply to the provided message
 *
 * @return {object} JSON response returned by Telegram API
 */
function sendLocation(msg, latitude, longitude, replyTo=false) {
  let payload = {
    'method': 'sendLocation',
    'chat_id': String(msg['chat']['id']),
    'latitude': latitude,
    'longitude': longitude
  }
  
  if(replyTo) {
    payload['reply_to_message_id'] = msg['message_id']
  }

  let data = {
    'method': 'POST',
    'payload': payload
  }
  
  return JSON.parse(UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/', data).getContentText());
}

/**
 * Gets a file from Telegram server
 *
 * @param {string} fileID ID of the file to get
 *
 * @return {object} JSON response returned by Telegram API
 */
function getFile(fileID) {
  let payload = {
    'method': 'getFile',
    'file_id': fileID
  }
  
  let data = {
    'method': 'GET',
    'payload': payload,
    'muteHttpExceptions': true
  }
  
  return JSON.parse(UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/', data).getContentText());
}

/**
 * Downloads a file from Telegram server
 *
 * @param {string} fileID ID of the file to download
 *
 * @return {blob} Blob of the downloaded file
 */
function downloadFile(fileResource) {
  let result = UrlFetchApp.fetch('https://api.telegram.org/file/bot' + apiToken + '/' + fileResource['result']['file_path']);
  
  return result.getBlob();
}

/**
 * Gets chat information
 *
 * @param {string} chatId ID of the chat to get information of
 *
 * @return {object} JSON response returned by Telegram API
 */
function getChat(chatId) {
  let payload = {
    'method': 'getChat',
    'chat_id': chatId
  }

  let data = {
    'method': 'GET',
    'payload': payload,
    'muteHttpExceptions': true
  }

  return JSON.parse(UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/', data).getContentText());
}

/**
 * Answer to an Telegram's inline query 
 *
 * @param {object} inlineQuery Telegram API inline query resource
 * @param {array} results Array of answer results to the inline query
 * @param {number} cacheTime The maximum amount of time in seconds that the result of the inline query may be cached on the server
 * @param {string} nextOffset TOffset to be passed by next update with the same inlineQuery
 * @param {boolean} isPersonal Check if API server must store state of request by the user performing it
 * @return {object} JSON response returned by Telegram API
 */
function answerInlineQuery(inlineQuery, results, cacheTime=1, nextOffset='', isPersonal=true) {
    
  var payload = {
    'method': 'answerInlineQuery',
    'inline_query_id': inlineQuery['id'],
    'results': JSON.stringify(results),
    'cache_time': cacheTime,
    'next_offset': String(nextOffset),
    'is_personal': isPersonal
  }

  var data = {
    'method': 'POST',
    'payload': payload,
    'muteHttpExceptions': true
  }

  return JSON.parse(UrlFetchApp.fetch(apiTelegramBotBaseUrl + apiToken + '/', data).getContentText());  
}






https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app)
.listen(process.env.PORT, function () {
  console.log('Example app listening on port 443! Go to https://localhost:443/')
  deleteWebHook();
  //setWebhook();
  //getWebhookInfo();
})
