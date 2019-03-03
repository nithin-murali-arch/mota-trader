const helpers = require('../utils/helpers');
const moment = require('moment');
const bnf = require('../../data/bnf.json');
const nifty = require('../../data/nifty.json');
const indiaVix = require('../../data/indiaVix.json');
const DATE_FORMAT = 'DD-MM-YYYY hh:mm:ss';
const slippage = 1 + 0.022; // 0.22%

function runTest(symbol, array){
	let maxIteration = array.length - 4;
	let allTrades = [];
	for(let start = 0; start < maxIteration; start++){
		let d0 = array[start];
		let d1 = array[start + 1];
		let d2 = array[start + 2];
		let d3 = array[start + 3];
		let d4 = array[start + 4];
		if ((d1.close - d2.close) > (d2.close - d3.close)
      && (d2.close - d3.close) > (d3.close - d4.close)
      && (d1.close > d2.close)
      && (d2.close > d3.close)
      && (d3.close > d4.close)) {
			const d1inc = helpers.percentChange(d2.close, d1.close);
			const d2inc = helpers.percentChange(d3.close, d2.close);
			const d3inc = helpers.percentChange(d4.close, d4.close);
			if (d1inc > d2inc && d2inc > d3inc) {
			// We got an entry in our stock on d1 date :)
				const date = moment(d1.date).format(DATE_FORMAT);
				// Take the entry price with a small slippage into account
				const entry = helpers.round(d1.close * slippage);
				// Take the exit price at next day open (d0 for our case)
				const exit = d0.open;
				// calculate the pnl percent
				const pnlPercent = helpers.percentChange(entry, exit);
				// record the trade with entry/exit etc.
				allTrades.push({
					date, entry, exit, symbol, pnlPercent, change: d1inc,
				});
			}
		}
	}
	return allTrades;
}
let array = runTest('IndiaVix', indiaVix).concat(runTest('Nifty', nifty)).concat(runTest('Bank Nifty', bnf));
console.log(JSON.stringify(array));
