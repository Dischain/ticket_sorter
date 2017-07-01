// For the sake of simplicity in this solution it`s intentionally
// ommited error checking at the fields, which potentionally
// may contain some typos etc (for example, validating the route number
// with regexes).

(function (window) {
  'use strict';

  let 
    // Hash table with key as departure name and value as it 
    // ticket index
    forwardOrderedHT,
    // Hash table with key as destination name and value as it
    // ticket index
    backOrderedHT,

    // Cached array of last sorted tickets indexes
    sortedTickets,
    // Cached array of tickets indexes by last built path
    lastBuiltPath,

    // Config bject of predefined phrases to print
    phrasesConfig,

    initialTickets;

  const defaultPhrasesConfig = {
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
  };

  /**
   * Build forward and back ordered hash tables
   */
  function buildHashTables() {
    forwardOrderedHT = initialTickets.reduce(function(init, ticket, index) {
        init[ticket.departure.name] = index;
        return init;
      }, {} );

    backOrderedHT = initialTickets.reduce(function(init, ticket, index) {
      init[ticket.destination.name] = index;
      return init;
    }, {} );
  }
  
  /**
   * Traverse an array of tickets by specified order, builds resultant path
   * of ticket indexes (which should be sorted) and satisfies the next condition:
   *  - if ordered, current city is current ticket departure,
   *    and next city chould be current ticket destination. Traverse
   *    should run from departure to destination, in forward order.
   *  - if not ordered, current city is current ticket destination,
   *    and next city chould be current city departure. Traverse should
   *    run from destination to departure, in back order.
   * If callback function not specified, returns an array of sorted tickets
   * indexes, else invokes a callback.
   *
   * @param {String} from - departure point
   * @param {String} to - destination point. If null, traverse should run and
   *    build path till the end
   * @param {Boolean} ordered - describes the order of traverse.
   * @param {Function} callback - should be invoked after path built with 
   *    path array as argument
   * @returns {Array} of traversed indexes.
   */
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
      currentTicket = initialTickets[currentIndex];

      if (ordered) {
        if (to && currentTicket.destination.name === to) break;
        currentIndex = hashTable[currentTicket.destination.name];
      } else {
        currentIndex = hashTable[currentTicket.departure.name];
      }
    }

    if (callback) {
      callback(path);
    } else
      return path;    
  }

  /*                     Public functions
  *********************************************************/

  let ts = {};

  /**
   * Initializes with array of tickets and optionally phrases config object.
   * To check the data validity you may specify a callback function,
   * which, in case of unsuccessfull validation, should be invoked with 
   * an error object, containing message and array of indexes of invalid
   * tickets.
   * You should allways start work with invoking of this function.
   *
   * Tickets data format:
   *  [
   *    {
   *      transport: {
   *        type: <transportType>
   *        routeNumber: <transportNumber>,
   *        seat: <seatNumber>,
   *        gate: <gateNumber>,
   *        baggage: <baggageNumber>
   *      },
   *      departure: {
   *        name: <departureName>
   *      },
   *      destination: {
   *        name: <destinationName>
   *      }
   *    }
   *  ]
   *
   *  Here described minimalistic ticket data format. 
   *  Each transport type can be decorated with additional data
   *  field with corresponding representation rule.
   *  The only field strongly required are <departureName>
   *  and <destinationName>.
     *
   *  Also you may to specify phrases, which should be outputted 
   *  as the result of prettyPrint() function:
   *   
   *  {
   *    <transportType>: {
   *      action: <actionType>
   *    },
   *    common: {
   *      commonAction: <commonActionType>,
   *      commonTransport: '<commonTransportType>',
     *
   *      seatPhrase: <seatPhrase>,
   *      defaultSeatPhrase: <defaultSeatPhrase>,
     *
   *      baggagePhrase: <baggagePhrase>,
   *      defaultBaggagePhrase: <defaultBaggagePhrase>,
   *
   *      gatePhrase: <gatePhrase>,
   *      defaultGatePhrase: <defaultGatePhrase>
   *    }
   *  }
   *
   * Example:
   *
   * ts.initialize(somedata, function(error) {
   *    console.log(error.message);
   *    console.log(error.invalidTicketsIndexes);
   * });
   *
   * @param {Object} data - array of tickets
   * @param {Object} config - config object
   * @param {Function} callback
   * @returns {Object} ticket sorted object
   */
  ts.initialize = function(data, config, callback) {
    let cb;

    sortedTickets = lastBuiltPath = null;

    if (arguments.length == 2) {
      cb = config;
      phrasesConfig = defaultPhrasesConfig;
    } else {
      cb = callback;
      phrasesConfig = config;
    }

    validateData(data, cb);

    return ts;
  };

  /**
   * Sort tickets from departure to destination, store it into local variable
   * and invokes given callback with array of sorted indexes of tikets.
   * Has linear asymptotic complexity.
   *
   * @param {Functio} callback
   * @returns {Object} ticket sorter object
   */
  ts.sort = function(callback) {
    if (initialTickets) {
      let randomIndex = Math.floor(Math.random() * initialTickets.length);
      // Get first ticket index by traversing from random ticket till
      // tickets end
      let firstTicketIndex = 
        traverse(initialTickets[randomIndex].destination.name, null, false).pop();
      
      let firstTicketDepartureName = initialTickets[firstTicketIndex].departure.name;
      
      // And traverse them from start to end, storing into local variable
      sortedTickets = traverse(firstTicketDepartureName, null, true);

      lastBuiltPath = sortedTickets;

      if (callback)
        callback(sortedTickets);
    }

    return ts;    
  };

  /**
   * Build path from given start point to end, store it into local variable
   * and invokes given callback with array of indexes of tikets.
   *
   * @param {String} from
   * @param {String} to
   * @param {Function} callback
   * @returns {Object} ticket sorter object
   */
  ts.buildPath = function(from, to, callback) {
    validateEndPoints(from, to, function(err) {
      if (err) {
        callback(null, err);
      } else {
        lastBuiltPath = traverse(from, to, true);
        callback(lastBuiltPath);
      }
    });   

    return ts;
  };

  /**
   * Map the last built path or sorting result to an array of pretty 
   * simple stings, which satisfy to established representation
   * rule, and pass it to callback.
   * Common representation rule for one ticket can be described 
   * with kind of production:
   * 
   * <phrase> = <actionType> <transportType> <transportNumber>
   *      | <commonActionType> <commonTransportType>
   *      'from' <departureName> 'to' <destinationName>. 
   *      <gatePhrase> <gateNumber> | <defaultGatePhrase>.
   *      <seatPhrase> <seatNumber> | <defaultSeatPhrase>.
   *      <baggagePhrase> <baggageNumber> | <defaultBaggagePhrase>.
   *
   * Example: 
   * ts.initialize().sort().prettyPrint(function(result) {
   *    let main = document.getElementById('main');
   *    data.forEach((item) => {    
   *    let node = document.createElement('div');
   *    let textNode = document.createTextNode(item);
   *    node.appendChild(textNode);
   *    main.appendChild(node);
   *    });
   *  });
   *
   * @param {Function} callback
   */
  ts.prettyPrint = function(callback) {
    if (initialTickets && lastBuiltPath) {
      let output = [];
      lastBuiltPath.forEach((index) => {
        output.push(printTicket(index));
      });
      callback(output);
    }
  };

  /*                   Error handling
  *********************************************************/

  /**
   * Check whether the from-point and to-point exists.
   * If not, the callback functions retrieves an error
   * object, which contains the name of invalid point.
   *
   * @param {Sting} from - start point
   * @param {String} to - end point
   * @param {Function} callback
   */
  function validateEndPoints(from, to, callback) {
    if (initialTickets) {
      let errorObj = {
        message: 'Destination point not exists',
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
  }

  /** 
   * Check whether required fieilds are specified.
   * If not, should pass an error with array of indexes of
   * empty field tickets into a callback.
   * Required fields are destination name and departure name.
   *
   * @param {Object} data
   * @param {Function} callback
   */
  function validateData(data, callback) {
    let errorObj = {
      message: 'Required fields are empty',
      invalidTicketsIndexes: []
    };

    data.forEach(function(ticket, index) {
      if (ticket.departure.name === '' ||
        ticket.destination.name === '')
        errorObj.invalidTicketsIndexes.push(index);
    });

    if (errorObj.invalidTicketsIndexes.length > 0) {
      callback(errorObj);
    } else {
      initialTickets = data;

      buildHashTables();
    }
  }

  /*                   Other
  *********************************************************/

  /**
   * Print the given ticket according to representation rule by specified index
   * 
   * @param {Number} index
   * @returns {String} ticket representation
   */
  function printTicket(index) {
    // Honestly, this function should be deeply refactored.
    // Get{prase_type} functions should take all needefull data as arguments
    // to provide more functional style, immutability and to be testable.

    let ticket = initialTickets[index];
    let sp = ' ', dot = '.', eol = '\n';
    let ticketString = '';

    function getTransportType() {
      if (ticket.transport.type === '' ||
        !ticket.transport.type) {
        return phrasesConfig.common.transportType;
      } else {
        return ticket.transport.type; 
      }
    }

    const transportType = getTransportType();

    const action = phrasesConfig[transportType] ?
      phrasesConfig[transportType].action :
      phrasesConfig.common.action;

    const transportNumber = ticket.transport.routeNumber || '';

    const departureName = ticket.departure.name;
    const destinationName = ticket.destination.name;

    let getSeatPhrase = function() {
      let seatNumber = ticket.transport.seat;
      let seatPhrase;
      if (seatNumber) {
        seatPhrase = phrasesConfig.common.seatPhrase;

        return sp + seatPhrase + sp + seatNumber + dot;
      } else if (transportType === '') {
        return '';
      } else {
        seatPhrase = phrasesConfig.common.defaultSeatPhrase;

        return sp + seatPhrase + dot;
      } 
    };

    let getGatePhrase = function() {
      let gatePhrase, gateNumber;

      if (transportType === 'flight'){
        if (ticket.transport.gate) {
          gatePhrase = phrasesConfig.common.gatePhrase;
          gateNumber = ticket.transport.gate;

          return sp + gatePhrase + sp + gateNumber + dot;
        } else {
          gatePhrase = phrasesConfig.common.defaultGatePhrase;

          return sp + gatePhrase + dot;
        }
      } else {
        return '';
      }
    };

    let getBaggagePhrase = function() {
      let baggagePhrase, baggageNumber;

      if (transportType === 'flight') {
        if (ticket.transport.baggage) {
          baggagePhrase = phrasesConfig.common.baggagePhrase;
          baggageNumber = ticket.transport.baggage;

          return sp + baggagePhrase + sp + baggageNumber + dot;
        } else {
          baggagePhrase = phrasesConfig.common.defaultBaggagePhrase;
          
          return sp + baggagePhrase + dot;
        }
      } else {
        return '';
      }
    };

    ticketString = action + sp + transportType + sp + transportNumber +
      ' from ' + departureName + ' to ' + destinationName + dot +
      getGatePhrase() + getSeatPhrase() + getBaggagePhrase() + eol;

    return ticketString; 
  }

  window.ts = ts;
}(window));