/*----------------------Input data format--------------------*/
// [
// 	{
// 		transport: {
// 			type: <transportType>
// 			routeNumber: <transportNumber>,
// 			seat: <seatNumber>,
// 			gate: <gateNumber>,
//			baggage: <baggageNumber>
// 		},
// 		departure: {
// 			name: <departureName>
// 		},
// 		destination: {
// 			name: <destinationName>
// 		}
// 	}
// ]
//
// Here described minimalistic ticket data format. 
// Each transport type can be decorated with additional data
// field with corresponding representation rule.
// The only field strongly required are <departureName>
// and <destinationName>.
//
// Also you may to specify phrases, which should be outputted 
// as the result of buildPath() or sort() functions:
//  
// {
// 	<transportType>: {
// 		action: <actionType>
// 	},
//  common: {
// 		commonAction: <commonActionType>,
//		commonTransport: '<commonTransportType>',
//
//		seatPhrase: <seatPhrase>,
// 		defaultSeatPhrase: <defaultSeatPhrase>,
//
//		baggagePhrase: <baggagePhrase>,
// 		defaultBaggagePhrase: <defaultBaggagePhrase>,
//
// 		gatePhrase: <gatePhrase>,
// 		defaultGatePhrase: <defaultGatePhrase>
// 	}
// }
//
// Common representation rule for all transport types can be
// described with kind of production:
// 
// <rule> = <actionType> <transportType> <transportNumber>
//				| <commonActionType> <commonTransportType>
// 				'from' <departureName> 'to' <destinationName>. 
// 				<gatePhrase> <gateNumber> | <defaultGatePhrase>.
// 				<seatPhrase> <seatNumber> | <defaultSeatPhrase>.
// 				<baggagePhrase> <baggageNumber> | <defaultBaggagePhrase>.
//
//
// For the sake of simplicity in this solution it`s intentionally
// ommited individual error checking at the fields, which potentionally
// may contain some typos etc (for example, validating the route number
// with regexes).

(function (window) {
	'use strict'    

	let forwardOrderedHT;
	let backOrderedHT;

	let tickets;

	let sorted;
	let lastBuiltPath;

	let outputPhrasesConfig;

	let defaultPhrasesConfig = {
		flight: {
			action: 'Take'
		},
		train: {
			action: 'Take'
		},
		bus: {
			action: 'Take'
		},
		common: {
			action: 'Move',
			transportType: '',

			seatPhrase: 'Take your seat at',
			defaultSeatPhrase: 'No seat assignment',

			baggagePhrase: 'Baggage drop at ticket counter',
			defaultBaggagePhrase: 'Baggage will be automatically transferred from your last leg',

			gatePhrase: 'Gate',
			defaultGatePhrase: 'No gate'
		}
	}

	function buildHashTables() {
		forwardOrderedHT = tickets.reduce(function(init, ticket, index) {
	    	init[ticket.departure.name] = index;
	    	return init;
	    }, {} );

		backOrderedHT = tickets.reduce(function(init, ticket, index) {
			init[ticket.destination.name] = index;
			return init;
		}, {} );
	}
	   
	function traverse(from, to, ordered, callback) {
	    let hashTable;

	    if (ordered) {
	    	hashTable = forwardOrderedHT;
	    } else {
	    	hashTable = backOrderedHT;
	    }

		let currentIndex = hashTable[from];
		let currentTicket;
		let path = [];

		while (currentIndex >= 0) {
			path.push(currentIndex);
			currentTicket = tickets[currentIndex];

			if (ordered) {
				if (to && currentTicket.destination.name === to) break;
				currentIndex = hashTable[currentTicket.destination.name];
			} else {
				//if (to && currrentTicket.departure.name === to) break;
				currentIndex = hashTable[currentTicket.departure.name];
			}
		}

		if (callback) {
			callback(path);
		} else
		  return path;    
	}

	/*-----Error handling---------*/
	function validateEndPoints(from, to, callback) {
		let errorObj = {
			//code: POINT_NOT_EXISTS,
			message: 'Destination point do not exists',
			invalidPoint: ''
		};

		let invalidPoint;

		if (forwardOrderedHT[from] === undefined) {
			invalidPoint = from;
		} else if (to && forwardOrderedHT[to] === undefined) {
		    invalidPoint = to;
		}

		if (invalidPoint) {
			errorObj.invalidPoint = invalidPoint;
			callback(errorObj);
		} else {
			callback();
		}
	}

	// Check whether required fieilds are specified.
	// If not, should pass an error with array of indexes of
	// empty field tickets into a callback.
	function validateData(data, callback) {
		let errorObj = {
			message: 'Required fields are empty',
			invalidTicketsIndexes: []
		};

		data.forEach(function(ticket, index) {
			if (ticket.departure.name === '' 
				|| ticket.destination.name === '')
				errorObj.invalidTicketsIndexes.push(index);
		});

		if (errorObj.invalidTicketsIndexes.length > 0) {
			callback(errorObj);
		} else {
			tickets = data;

			buildHashTables();
		}
	}

	/*---------Other-----------*/

	//TODO: deepest refactoring :)
	// Honestly, this function must be declared outside this module.
	// Get{prase_type} functions should take all needefull data as arguments
	// to implement more functional style and to be testable.
	function printTicket(index) {
		let ticket = tickets[index];
		let sp = ' ', dot = '.', eol = '\n';
		let ticketStr = '';

		const transportType = ticket.transport.type
			|| outputPhrasesConfig.common.transportType;		

		const action = outputPhrasesConfig[transportType].action
			|| outputPhrasesConfig.common.action;

		const transportNumber = ticket.transport.routeNumber || '';

		const departureName = ticket.departure.name;
		const destinationName = ticket.destination.name;

		let getSeatPhrase = function() {
			let seatNumber = ticket.transport.seat;
			let seatPhrase;
			if (seatNumber) {
				seatPhrase = outputPhrasesConfig.common.seatPhrase;

				return sp + seatPhrase + sp + seatNumber + dot;
			} else {
				seatPhrase = outputPhrasesConfig.common.defaultSeatPhrase;

				return sp + seatPhrase + dot;
			}
		};

		let getGatePhrase = function() {
			let gatePhrase, gateNumber;

			if (transportType === 'flight'){
				if (ticket.transport.gate) {
					gatePhrase = outputPhrasesConfig.common.gatePhrase;
					gateNumber = ticket.transport.gate;

					return sp + gatePhrase + sp + gateNumber + dot;
				} else {
					gatePhrase = outputPhrasesConfig.common.defaultGatePhrase;

					return sp + gatePhrase + dot;
				}
			} else {
				return '';
			}
		}

		let getBaggagePhrase = function() {
			let baggagePhrase, baggageNumber;

			if (transportType === 'flight') {
				if (ticket.transport.baggage) {
					baggagePhrase = outputPhrasesConfig.common.baggagePhrase
					baggageNumber = ticket.transport.baggage;

					return sp + baggagePhrase + sp + baggageNumber + dot;
				} else {
					baggagePhrase = outputPhrasesConfig.common.defaultBaggagePhrase;
					
					return sp + baggagePhrase + dot;
				}
			} else {
				return '';
			}
		}

		ticketStr = action + sp + transportType + sp + transportNumber
			+ ' from ' + departureName + ' to ' + destinationName + dot
			+ getGatePhrase() + getSeatPhrase() + getBaggagePhrase() + eol;

		return ticketStr; 
	}

	/*---Public Section ---*/
	let ts = {};

	ts.initialize = function(data, config, callback) {
		let cb;

		sorted = lastBuiltPath = null;

		if (arguments.length == 2) {
			cb = config;
			outputPhrasesConfig = defaultPhrasesConfig;
		} else {
			cb = callback;
			outputPhrasesConfig = config;
		}

		validateData(data, cb);

		return ts;
	}

	ts.sort = function(callback) {
		if (tickets) {
			let middleIndex = Math.floor(tickets.length / 2);
			let firstTicketIndex = 
				traverse(tickets[middleIndex].destination.name, null, false).pop();
			let firstTicketDepName = tickets[firstTicketIndex].departure.name;
			
			sorted = traverse(firstTicketDepName, null, true);
			lastBuiltPath = sorted;

			if (callback)
				callback(sorted);
		}

		return ts;    
	}

	ts.buildPath = function(from, to, callback) {
		validateEndPoints(from, to, function(err) {
			if (err) {
				callback(null, err)			
			} else {
				lastBuiltPath = traverse(from, to, true);
				callback(lastBuiltPath);
			}
		});		

		return ts;
	}

	ts.prettyPrint = function(callback) {
		if (tickets && lastBuiltPath) {
			let output = [];
			lastBuiltPath.forEach((index) => {
				output.push(printTicket(index));
			});
			callback(output);
		}

		return ts;
	}

	window.ts = ts;
}(window));

//to use this api, you should minify js code with one of 
//the available task runner