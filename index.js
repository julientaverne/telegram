// curl -F "url=https://stormy-stream-37547.herokuapp.com/new-message"  https://api.telegram.org/bot1544386242:AAGn7SBWQGrUn45hk2nJMwV6bhxToMpCI_A/setWebhook
var express = require("express")
var app = express()
var bodyParser = require("body-parser")
const axios = require("axios")

app.use(bodyParser.json()) // for parsing application/json
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
) // for parsing application/x-www-form-urlencoded

app.get("/", function(req, res) {
    console.log("julien");
})

//This is the route the API will call
app.post("/www", function(req, res) {
	const { message } = req.body
        const update = req;    
/*
let update = JSON.parse(req['postData']['contents']);
          
    // Make sure this is update is a type message
    if (update.hasOwnProperty('inline_query')) {
      let inlineQuery = update['inline_query'];
  //    handleInlineQuery(inlineQuery);
              
    } else if(update.hasOwnProperty('message')) {
      let msg = update['message'];
      
      if(msg.hasOwnProperty('text')) {
        if(msg['text'].indexOf('/start') > -1) {
	console.log(msg);
          //handleStart(msg);
        } else {
          if(!msg.hasOwnProperty('via_bot')) {
                console.log(msg);
		//handleMessageDefault(msg);
          }
        }
      }
    }
*/

/*
	//Each message contains "text" and a "chat" object, which has an "id" which is the chat id

	if (!message || message.text.toLowerCase().indexOf("marco") < 0) {
		// In case a message is not present, or if our message does not have the word marco in it, do nothing and return an empty response
		return res.end()
	}
*/
	// If we've gotten this far, it means that we have received a message containing the word "marco".
	// Respond by hitting the telegram bot API and responding to the appropriate chat_id with the word "Polo!!"
	// Remember to use your own API toked instead of the one below  "https://api.telegram.org/bot<your_api_token>/sendMessage"
	axios
		.post(
			"https://api.telegram.org/bot1544386242:AAGn7SBWQGrUn45hk2nJMwV6bhxToMpCI_A/sendMessage",
			{
				chat_id: message.chat.id,
				text: "Polo!! v4,update:"+update+"",
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

// Finally, start our server
app.listen(process.env.PORT, function() {
	console.log("Telegram app listening on port 3000!")
})
