//Thirdparty
const express = require('express');
const bodyParser = require('body-parser');
//Local Deps
const KiteAdapter = require('./KiteAdapter');
//Routes
let exampleRoute = require('../routes/examples');
//Mixins
const helpers = require('./utils/helpers');
//Instruments
let instruments;

let app = express();
app.use(bodyParser.json());
app.use('/', exampleRoute);

app.get('/login', (req, res) => {
	helpers.log('Kite Login');
	res.redirect(helpers.getLoginURL());
});

app.get('/login/callback', async (req, res) => {
	try{
		const {status, request_token} = req.query;
		if(status !== 'success'){
			return res.status(401).send('UNAUTHORIZED');
		}
		const session = await helpers.generateSession(request_token);
		const successMessage = `${session.user_name} logged in successfully at ${session.login_time}`;
		helpers.log(successMessage);
		if(!instruments){
			instruments = await helpers.getInstruments();
		}
		return res.send(successMessage);
	}
	catch(err){
		helpers.log(err, true);
		return res.status(400).send(`Error: ${err.message}`);
	}
	
});

app.get('/backtest', async (req, res) => {
	try{

	}
	catch(err){
		helpers.log(err, true);
		return res.status(400).send(`Error: ${err.message}`);
	}
});

app.listen(1337 || process.env.port);