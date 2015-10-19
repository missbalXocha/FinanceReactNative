var Reflux = require('reflux');
var store = require('react-native-simple-store');

// Flux
var Actions = require('./actions');

// Utils
var UtilFuncs = require('../functions');
var finance = require('../../Utils/finance');

var Store = Reflux.createStore({
  listenables: Actions,

  onAddStock: function(symbol) {
    store.get('watchlist').then((result) => {
      var symbols = result.map((item) => {
        return item.symbol.toUpperCase();
      });

      if (symbols.indexOf(symbol.toUpperCase()) === -1) {
        result.push({symbol: symbol.toUpperCase(), share: 100});
        result.sort(UtilFuncs.dynamicSort('symbol'));
        console.log('onAddStock', result, symbol);
        store.save('watchlist', result).then(() => {
          Promise.resolve(
            this.onUpdateStocks()
          ).then(() => this.trigger(result));
        });
      }
    });
  },

  onDeleteStock: function(symbol) {
    store.get('watchlist').then((result) => {
      console.log('onDeleteStock', result, symbol);
      return UtilFuncs.removeObjectfromArray(result, 'symbol', symbol);
    }).then((result) => {
      store.save('watchlist', result);
      return result;
    }).then((result) => {
      Promise.resolve(
        this.onUpdateStocks()
      ).then(() => this.trigger(result));
    });
  },

  onUpdateStocks: function() {
    console.log('onUpdateStocks');
    var that = this;
    store.get('watchlist').then((result) => {
      if (!Array.isArray(result) || result.length === 0) {
        result = [
          {symbol: 'AAPL', share: 100},
          {symbol: 'GOOG', share: 100},
        ];
        store.save('watchlist', result);
      }

      var symbols = result.map((item) => {
        return item.symbol;
      });

      finance.getStock({stock: symbols}, 'quotes')
        .then(function(response) {
          return response.json();
        }).then(function(json) {
          var quotes = json.query.results.quote ;
          quotes = Array.isArray(quotes) ? quotes : [quotes];

          // Caching
          store.save('watchlistResult', quotes);

          var watchlistCache = {};
          quotes.forEach((quote) => {
            watchlistCache[quote.symbol] = quote;
          });
          store.save('watchlistResultCache', watchlistCache);
        }).then((result) => {
          this.trigger(result);
        }).catch((error) => {
          console.log('Request failed', error);
        });
    });
  },
});

module.exports = Store;