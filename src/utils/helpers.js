const constants = require('../var/constants');
const fs = require('fs');
const {KiteConnect} = require('kiteconnect');
const moment = require('moment');
const dateFormat = 'YYYY-MM-DD hh:mm:ss';
const kite = new KiteConnect(constants.API_KEY, constants.API_SECRET);

const instrumentsFile = `${constants.DATA_DIR}/instruments.json`;

let logFile = fs.openSync(constants.LOG_DIR + '/app.log', 'a');
let errorLogFile = fs.openSync(constants.LOG_DIR + '/error.log', 'a');

function _writeToLogFile(data, isError){
	let logFileHandle = isError ? errorLogFile : logFile;
	if(typeof data === 'object'){
		data = JSON.stringify(data, null, 4);
	}
	fs.writeSync(logFileHandle, data + '\n\n');
	fs.writeSync(logFileHandle, '______________________________________________________________________________________________');
}

function log(message, data){
	if(message instanceof Error){
		console.error(message);// eslint-disable-line
		_writeToLogFile(message, true);
	}
	else{
		console.log(`${constants.APPLICATION_NAME} ver${constants.VERSION} ${JSON.stringify(message, null, 4)}`);// eslint-disable-line
		_writeToLogFile(message);
	}
	if(data){
		console.log(JSON.stringify(message, null, 4));// eslint-disable-line
		_writeToLogFile(data);
	}
}

function getLoginURL(){
	return kite.getLoginURL();
}

function generateSession(token){
	return kite.generateSession(token, constants.API_SECRET);
}

async function downloadInstruments(){
	log('Downloading NSE Instruments');
	let instruments = await kite.getInstruments('NSE');
	fs.writeFileSync(instrumentsFile);
	return instruments;
}

function getInstruments(){
	if(fs.existsSync(instrumentsFile)){
		return new Promise(function(resolve){
			resolve(JSON.parse(fs.readFileSync(instrumentsFile)));
		});
	}
	else{
		return downloadInstruments();
	}
}

async function downloadHistoricalData(symbol, startDate, endDate){
	let instrument = (await getInstruments()).find(i => i.tradingSymbol === symbol);
	if(!instrument){
		return log(`No such instrument found: ${symbol}`, true);
	}
	log(`Downloading OHLC for ${symbol}  for dates between: ${startDate} - ${endDate}`);
	let data = await kite.getHistoricalData(instrument.instrument_token, 'day', startDate, endDate, false);
	let ohlc = data.sort((d1, d2) => new Date(d2.date) - new Date(d1.date));
	const year = moment(endDate, dateFormat).format('YYYY');
	fs.writeFileSync(`${constants.DATA_DIR}/${symbol}`, ...instrument);
	return fs.writeFileSync(`${constants.DATA_DIR}/${year}-${symbol}.json`, ohlc);
}

async function downloadNFOHistoryDate(startDate, endDate){
	log(`Downloading All NFO Historical Data for dates between: ${startDate} - ${endDate}`);
	let promises = constants.NFO_STOCKS.map((symbol, i) => {
		return new Promise(function(resolve, reject){
			setTimeout(async ()=>{
				try{
					await downloadHistoricalData(symbol, startDate, endDate);
					resolve();
				}
				catch(err){
					reject(err);
				}
			}, 500 * i);
			
		});
	});
	await Promise.all(promises);
}

function downloadNFOHistoryYear(year){
	log(`Downloading All NFO Historical Data for year: ${year}`);
	let startDate = moment(`${year}-01-01 00:00:01`, dateFormat).format(dateFormat);
	let endDate = moment().format('YYYY') === year ? moment().format(dateFormat) : moment(`${year}-12-31 11:59:59`, dateFormat).format(dateFormat);
	return downloadNFOHistoryDate(startDate, endDate);
}

function groupByDate(array) {
	return array.reduce((acc, item) => {
		if (!acc[item.date]) acc[item.date] = [];
		acc[item.date].push(item);
		return acc;
	}, {});
}
function round(number) {
	return Math.round(number * 100) / 100;
}

function percentChange(a, b) {
	return round(((b - a) / a) * 100);
}

module.exports = {
	getLoginURL,
	generateSession,
	log,
	getInstruments,
	downloadNFOHistoryYear,
	downloadNFOHistoryDate,
	groupByDate,
	round,
	percentChange
};