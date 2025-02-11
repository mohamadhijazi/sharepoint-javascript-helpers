/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var RSVP = __webpack_require__(2);

	SJH = {};

	SJH.Status = {};

	SJH.Status.retryingSecurityValidation = false;

	SJH.Status.lastSiteUsed = "";

	SJH.Config = {errorAlerts: true};

	SJH.Utils = {};

	SJH.Utils.getContext = function(site) {
	  if (site) {
	    return new SP.ClientContext(site);
	  } else {
	    return new SP.ClientContext.get_current();
	  }
	};

	SJH.spread = function(callback) {
	  /* From Axios - https://github.com/mzabriskie/axios/ */
	  return function (arr) {
	    callback.apply(null, arr);
	  };
	};

	SJH.all = function (promises) {
	  /* From Axios - https://github.com/mzabriskie/axios/ */
	  return RSVP.all(promises);
	};

	SJH.executeQueryAsync = function(context, resolve, reject, returnValue) {
	  var originalArguments = arguments;
	  context.executeQueryAsync(
	    function() {
	      var returnValueResolved = returnValue && returnValue();
	      resolve(returnValueResolved); 
	    },
	    function(sender, args) { 
	       SJH.error(sender, args, reject, resolve, SJH.executeQueryAsync, originalArguments);
	    });
	};
SJH.addListItems = function (options) {
	  return new RSVP.Promise(function(resolve, reject) {
	    var context = SJH.Utils.getContext(options.site);
	    SJH.Status.lastSiteUsed = options.site;
	    var list = context.get_web().get_lists().getByTitle(options.list);
		var results = [];
		
		listItems=options.data;
		// for each item of in list items we create item in SharePoint list
            for (var i = 0; i < listItems.length; i++) {
 
                var listItem = listItems[i];
                var listItemCreationInfo = new SP.ListItemCreationInformation();
                var oListItem = list.addItem(listItemCreationInfo);
 
                // for each property of current item, we assign field values
                for (var field in listItem) {
                    oListItem.set_item(field, listItem[field]);
                }
 
                // update and load SharePoint list item and add it to results array
                oListItem.update();
                context.load(oListItem);
                results.push(oListItem);
            }
		
	    // for (var key in options.data) {
	      // if (options.data.hasOwnProperty(key)) {
	        // listItem.set_item(key, options.data[key]);
	      // }
	    // }

	   // listItem.update();

	   // context.load(listItem); /* loading the item gets its ID */

	    SJH.executeQueryAsync(context, resolve, reject, function() { return results });
	  });
	};
	SJH.addListItem = function (options) {
	  return new RSVP.Promise(function(resolve, reject) {
	    var context = SJH.Utils.getContext(options.site);
	    SJH.Status.lastSiteUsed = options.site;
	    var list = context.get_web().get_lists().getByTitle(options.list);
	    var itemCreateInfo = new SP.ListItemCreationInformation();
	    var listItem = list.addItem(itemCreateInfo);

	    for (var key in options.data) {
	      if (options.data.hasOwnProperty(key)) {
	        listItem.set_item(key, options.data[key]);
	      }
	    }

	    listItem.update();

	    context.load(listItem); /* loading the item gets its ID */

	    SJH.executeQueryAsync(context, resolve, reject, function() { return listItem.get_id() });
	  });
	};

	SJH.getListItems = function(options) {
	  var originalArguments = arguments;
	  return new RSVP.Promise(function(resolve, reject) {
	    var context = SJH.Utils.getContext(options.site);
	    SJH.Status.lastSiteUsed = options.site;
	    var web = context.get_web();
	    var listObject = web.get_lists().getByTitle(options.list);

	    var camlQuery = new SP.CamlQuery();

	    camlQuery.set_viewXml(options.query);

	    var listItems = listObject.getItems(camlQuery);

	    context.load(listItems, "Include(" + options.fields + ")");

	    context.executeQueryAsync(function() {
	      var listItemArray = [];
	      var listItemEnumerator = listItems.getEnumerator();

	      while (listItemEnumerator.moveNext()) {
	        var listItem = listItemEnumerator.get_current();
	        var listItemAsObject = {};
	        for (index = 0; index < options.fields.length; ++index) {
	          if (options.fields[index].toLowerCase() == "id") {
	            listItemAsObject[options.fields[index]] = listItem.get_id();
	          } else if (options.fields[index].toLowerCase() == "displayname") {
	            listItemAsObject[options.fields[index]] = listItem.get_displayName();
	          } else {
	            listItemAsObject[options.fields[index]] = listItem.get_item(options.fields[index]);
	          }        
	        }
	        listItemAsObject.object = listItem;
	        listItemArray.push(listItemAsObject);
	      }
	      return resolve(listItemArray);

	    },
	    function(sender, args) { 
	      SJH.error(sender, args, reject, resolve, SJH.getListItems, originalArguments);
	      });
	  });
	};

	
	SJH.updateListItems = function (options) {
	  return new RSVP.Promise(function(resolve, reject) {
	    var context = SJH.Utils.getContext(options.site);
	    SJH.Status.lastSiteUsed = options.site;
	    var list = context.get_web().get_lists().getByTitle(options.list);
		var results = [];
		
		listItems=options.data;
		// for each item of in list items we create item in SharePoint list
            for (var i = 0; i < listItems.length; i++) {
 
                var listItem = listItems[i];
				
                var oListItem = list.getItemById(listItem.Id);
 
                // for each property of current item, we assign field values
                for (var field in listItem) {
					if(field!="Id" && field!="object"){
					oListItem.set_item(field, listItem[field]);	
					}
                    
                }
 
                // update and load SharePoint list item and add it to results array
                oListItem.update();
                context.load(oListItem);
                results.push(oListItem);
            }
		 
	    SJH.executeQueryAsync(context, resolve, reject, function() { return results });
	  });
	};
	
	SJH.updateListItem = function (options) {
	  return new RSVP.Promise(function(resolve, reject) {
	    var context = SJH.Utils.getContext(options.site);
	    SJH.Status.lastSiteUsed = options.site;
	    var list = context.get_web().get_lists().getByTitle(options.list);
	    var listItem = list.getItemById(options.id);

	    for (var key in options.data) {
	      if (options.data.hasOwnProperty(key)) {
	        listItem.set_item(key, options.data[key]);
	      }
	    }

	    listItem.update();

	    SJH.executeQueryAsync(context, resolve, reject);
	  });
	};

	SJH.deleteListItem = function (options) {
	  return new RSVP.Promise(function(resolve, reject) {
	    var context = SJH.Utils.getContext(options.site);
	    SJH.Status.lastSiteUsed = options.site;
	    var list = context.get_web().get_lists().getByTitle(options.list);
	    var listItem = list.getItemById(options.id);

	    listItem.deleteObject();

	    SJH.executeQueryAsync(context, resolve, reject);
	  });
	};
	
	SJH.getCurrentUser = function(options) {
	  return new RSVP.Promise(function(resolve, reject) {
	    var context = SJH.Utils.getContext((options && options.site) || null);
	    SJH.Status.lastSiteUsed = options.site;
	    var web = context.get_web();
	    var currentUser = web.get_currentUser();

	    context.load(currentUser);
console.log(currentUser);
	    SJH.executeQueryAsync(context, resolve, reject, function() { return currentUser });
	  });
	};
SJH.getCurrentUserName = function(options) {
	  return new RSVP.Promise(function(resolve, reject) {
	    var context = SJH.Utils.getContext((options && options.site) || null);
	    SJH.Status.lastSiteUsed = options.site;
	    var web = context.get_web();
	    var currentUser = web.get_currentUser();

	    context.load(currentUser);

	    SJH.executeQueryAsync(context, resolve, reject, function() { return currentUser.get_title() });
	  });
	};
	SJH.getCurrentUserEmail = function(options) {
	  return new RSVP.Promise(function(resolve, reject) {
	    var context = SJH.Utils.getContext((options && options.site) || null);
	    SJH.Status.lastSiteUsed = options.site;
	    var web = context.get_web();
	    var currentUser = web.get_currentUser();

	    context.load(currentUser);

	    SJH.executeQueryAsync(context, resolve, reject, function() { return currentUser.get_email() });
	  });
	};

	 SJH.error = function(sender, args, reject, resolve, functionForRetry, argumentsForRetry) {
	    var message = (args && args.get_message()) || "";
	    var stackTrace = (args && args.get_stackTrace()) || "";

	    /* If action failed due to security validation error, get 
	    new validation and retry once */
	    if (message.indexOf("security validation") >= 0 && 
	      SJH.Status.retryingSecurityValidation === false && 
	      functionForRetry && argumentsForRetry) {
	      SJH.Status.retryingSecurityValidation = true;
	      UpdateFormDigest(SJH.Status.lastSiteUsed || "/");
	      resolve(functionForRetry.apply(null, [argumentsForRetry[0]]));
	      SJH.Status.retryingSecurityValidation = false;
	      if (window.console) {
	        console.log("Updated security validation");
	      }
	      return;
	    }

	    if (SJH.Config.errorAlerts) {
	      alert("An error has occurred." + '\n\n' + message +
	      stackTrace);
	    }

	    reject && reject();
	  };

	RSVP.on("error", function(reason) {
	  if (SJH.Config.errorAlerts && window.console && reason) {
	    console.assert(false, reason);
	  }
	});

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var require;var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(process, setImmediate, global, module) {/*!
	 * @overview RSVP - a tiny implementation of Promises/A+.
	 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors
	 * @license   Licensed under MIT license
	 *            See https://raw.githubusercontent.com/tildeio/rsvp.js/master/LICENSE
	 * @version   3.1.0
	 */

	(function() {
	    "use strict";
	    function lib$rsvp$utils$$objectOrFunction(x) {
	      return typeof x === 'function' || (typeof x === 'object' && x !== null);
	    }

	    function lib$rsvp$utils$$isFunction(x) {
	      return typeof x === 'function';
	    }

	    function lib$rsvp$utils$$isMaybeThenable(x) {
	      return typeof x === 'object' && x !== null;
	    }

	    var lib$rsvp$utils$$_isArray;
	    if (!Array.isArray) {
	      lib$rsvp$utils$$_isArray = function (x) {
	        return Object.prototype.toString.call(x) === '[object Array]';
	      };
	    } else {
	      lib$rsvp$utils$$_isArray = Array.isArray;
	    }

	    var lib$rsvp$utils$$isArray = lib$rsvp$utils$$_isArray;

	    var lib$rsvp$utils$$now = Date.now || function() { return new Date().getTime(); };

	    function lib$rsvp$utils$$F() { }

	    var lib$rsvp$utils$$o_create = (Object.create || function (o) {
	      if (arguments.length > 1) {
	        throw new Error('Second argument not supported');
	      }
	      if (typeof o !== 'object') {
	        throw new TypeError('Argument must be an object');
	      }
	      lib$rsvp$utils$$F.prototype = o;
	      return new lib$rsvp$utils$$F();
	    });
	    function lib$rsvp$events$$indexOf(callbacks, callback) {
	      for (var i=0, l=callbacks.length; i<l; i++) {
	        if (callbacks[i] === callback) { return i; }
	      }

	      return -1;
	    }

	    function lib$rsvp$events$$callbacksFor(object) {
	      var callbacks = object._promiseCallbacks;

	      if (!callbacks) {
	        callbacks = object._promiseCallbacks = {};
	      }

	      return callbacks;
	    }

	    var lib$rsvp$events$$default = {

	      /**
	        `RSVP.EventTarget.mixin` extends an object with EventTarget methods. For
	        Example:

	        ```javascript
	        var object = {};

	        RSVP.EventTarget.mixin(object);

	        object.on('finished', function(event) {
	          // handle event
	        });

	        object.trigger('finished', { detail: value });
	        ```

	        `EventTarget.mixin` also works with prototypes:

	        ```javascript
	        var Person = function() {};
	        RSVP.EventTarget.mixin(Person.prototype);

	        var yehuda = new Person();
	        var tom = new Person();

	        yehuda.on('poke', function(event) {
	          console.log('Yehuda says OW');
	        });

	        tom.on('poke', function(event) {
	          console.log('Tom says OW');
	        });

	        yehuda.trigger('poke');
	        tom.trigger('poke');
	        ```

	        @method mixin
	        @for RSVP.EventTarget
	        @private
	        @param {Object} object object to extend with EventTarget methods
	      */
	      'mixin': function(object) {
	        object['on']      = this['on'];
	        object['off']     = this['off'];
	        object['trigger'] = this['trigger'];
	        object._promiseCallbacks = undefined;
	        return object;
	      },

	      /**
	        Registers a callback to be executed when `eventName` is triggered

	        ```javascript
	        object.on('event', function(eventInfo){
	          // handle the event
	        });

	        object.trigger('event');
	        ```

	        @method on
	        @for RSVP.EventTarget
	        @private
	        @param {String} eventName name of the event to listen for
	        @param {Function} callback function to be called when the event is triggered.
	      */
	      'on': function(eventName, callback) {
	        if (typeof callback !== 'function') {
	          throw new TypeError('Callback must be a function');
	        }

	        var allCallbacks = lib$rsvp$events$$callbacksFor(this), callbacks;

	        callbacks = allCallbacks[eventName];

	        if (!callbacks) {
	          callbacks = allCallbacks[eventName] = [];
	        }

	        if (lib$rsvp$events$$indexOf(callbacks, callback) === -1) {
	          callbacks.push(callback);
	        }
	      },

	      /**
	        You can use `off` to stop firing a particular callback for an event:

	        ```javascript
	        function doStuff() { // do stuff! }
	        object.on('stuff', doStuff);

	        object.trigger('stuff'); // doStuff will be called

	        // Unregister ONLY the doStuff callback
	        object.off('stuff', doStuff);
	        object.trigger('stuff'); // doStuff will NOT be called
	        ```

	        If you don't pass a `callback` argument to `off`, ALL callbacks for the
	        event will not be executed when the event fires. For example:

	        ```javascript
	        var callback1 = function(){};
	        var callback2 = function(){};

	        object.on('stuff', callback1);
	        object.on('stuff', callback2);

	        object.trigger('stuff'); // callback1 and callback2 will be executed.

	        object.off('stuff');
	        object.trigger('stuff'); // callback1 and callback2 will not be executed!
	        ```

	        @method off
	        @for RSVP.EventTarget
	        @private
	        @param {String} eventName event to stop listening to
	        @param {Function} callback optional argument. If given, only the function
	        given will be removed from the event's callback queue. If no `callback`
	        argument is given, all callbacks will be removed from the event's callback
	        queue.
	      */
	      'off': function(eventName, callback) {
	        var allCallbacks = lib$rsvp$events$$callbacksFor(this), callbacks, index;

	        if (!callback) {
	          allCallbacks[eventName] = [];
	          return;
	        }

	        callbacks = allCallbacks[eventName];

	        index = lib$rsvp$events$$indexOf(callbacks, callback);

	        if (index !== -1) { callbacks.splice(index, 1); }
	      },

	      /**
	        Use `trigger` to fire custom events. For example:

	        ```javascript
	        object.on('foo', function(){
	          console.log('foo event happened!');
	        });
	        object.trigger('foo');
	        // 'foo event happened!' logged to the console
	        ```

	        You can also pass a value as a second argument to `trigger` that will be
	        passed as an argument to all event listeners for the event:

	        ```javascript
	        object.on('foo', function(value){
	          console.log(value.name);
	        });

	        object.trigger('foo', { name: 'bar' });
	        // 'bar' logged to the console
	        ```

	        @method trigger
	        @for RSVP.EventTarget
	        @private
	        @param {String} eventName name of the event to be triggered
	        @param {*} options optional value to be passed to any event handlers for
	        the given `eventName`
	      */
	      'trigger': function(eventName, options, label) {
	        var allCallbacks = lib$rsvp$events$$callbacksFor(this), callbacks, callback;

	        if (callbacks = allCallbacks[eventName]) {
	          // Don't cache the callbacks.length since it may grow
	          for (var i=0; i<callbacks.length; i++) {
	            callback = callbacks[i];

	            callback(options, label);
	          }
	        }
	      }
	    };

	    var lib$rsvp$config$$config = {
	      instrument: false
	    };

	    lib$rsvp$events$$default['mixin'](lib$rsvp$config$$config);

	    function lib$rsvp$config$$configure(name, value) {
	      if (name === 'onerror') {
	        // handle for legacy users that expect the actual
	        // error to be passed to their function added via
	        // `RSVP.configure('onerror', someFunctionHere);`
	        lib$rsvp$config$$config['on']('error', value);
	        return;
	      }

	      if (arguments.length === 2) {
	        lib$rsvp$config$$config[name] = value;
	      } else {
	        return lib$rsvp$config$$config[name];
	      }
	    }

	    var lib$rsvp$instrument$$queue = [];

	    function lib$rsvp$instrument$$scheduleFlush() {
	      setTimeout(function() {
	        var entry;
	        for (var i = 0; i < lib$rsvp$instrument$$queue.length; i++) {
	          entry = lib$rsvp$instrument$$queue[i];

	          var payload = entry.payload;

	          payload.guid = payload.key + payload.id;
	          payload.childGuid = payload.key + payload.childId;
	          if (payload.error) {
	            payload.stack = payload.error.stack;
	          }

	          lib$rsvp$config$$config['trigger'](entry.name, entry.payload);
	        }
	        lib$rsvp$instrument$$queue.length = 0;
	      }, 50);
	    }

	    function lib$rsvp$instrument$$instrument(eventName, promise, child) {
	      if (1 === lib$rsvp$instrument$$queue.push({
	        name: eventName,
	        payload: {
	          key: promise._guidKey,
	          id:  promise._id,
	          eventName: eventName,
	          detail: promise._result,
	          childId: child && child._id,
	          label: promise._label,
	          timeStamp: lib$rsvp$utils$$now(),
	          error: lib$rsvp$config$$config["instrument-with-stack"] ? new Error(promise._label) : null
	        }})) {
	          lib$rsvp$instrument$$scheduleFlush();
	        }
	      }
	    var lib$rsvp$instrument$$default = lib$rsvp$instrument$$instrument;

	    function  lib$rsvp$$internal$$withOwnPromise() {
	      return new TypeError('A promises callback cannot return that same promise.');
	    }

	    function lib$rsvp$$internal$$noop() {}

	    var lib$rsvp$$internal$$PENDING   = void 0;
	    var lib$rsvp$$internal$$FULFILLED = 1;
	    var lib$rsvp$$internal$$REJECTED  = 2;

	    var lib$rsvp$$internal$$GET_THEN_ERROR = new lib$rsvp$$internal$$ErrorObject();

	    function lib$rsvp$$internal$$getThen(promise) {
	      try {
	        return promise.then;
	      } catch(error) {
	        lib$rsvp$$internal$$GET_THEN_ERROR.error = error;
	        return lib$rsvp$$internal$$GET_THEN_ERROR;
	      }
	    }

	    function lib$rsvp$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
	      try {
	        then.call(value, fulfillmentHandler, rejectionHandler);
	      } catch(e) {
	        return e;
	      }
	    }

	    function lib$rsvp$$internal$$handleForeignThenable(promise, thenable, then) {
	      lib$rsvp$config$$config.async(function(promise) {
	        var sealed = false;
	        var error = lib$rsvp$$internal$$tryThen(then, thenable, function(value) {
	          if (sealed) { return; }
	          sealed = true;
	          if (thenable !== value) {
	            lib$rsvp$$internal$$resolve(promise, value);
	          } else {
	            lib$rsvp$$internal$$fulfill(promise, value);
	          }
	        }, function(reason) {
	          if (sealed) { return; }
	          sealed = true;

	          lib$rsvp$$internal$$reject(promise, reason);
	        }, 'Settle: ' + (promise._label || ' unknown promise'));

	        if (!sealed && error) {
	          sealed = true;
	          lib$rsvp$$internal$$reject(promise, error);
	        }
	      }, promise);
	    }

	    function lib$rsvp$$internal$$handleOwnThenable(promise, thenable) {
	      if (thenable._state === lib$rsvp$$internal$$FULFILLED) {
	        lib$rsvp$$internal$$fulfill(promise, thenable._result);
	      } else if (thenable._state === lib$rsvp$$internal$$REJECTED) {
	        thenable._onError = null;
	        lib$rsvp$$internal$$reject(promise, thenable._result);
	      } else {
	        lib$rsvp$$internal$$subscribe(thenable, undefined, function(value) {
	          if (thenable !== value) {
	            lib$rsvp$$internal$$resolve(promise, value);
	          } else {
	            lib$rsvp$$internal$$fulfill(promise, value);
	          }
	        }, function(reason) {
	          lib$rsvp$$internal$$reject(promise, reason);
	        });
	      }
	    }

	    function lib$rsvp$$internal$$handleMaybeThenable(promise, maybeThenable) {
	      if (maybeThenable.constructor === promise.constructor) {
	        lib$rsvp$$internal$$handleOwnThenable(promise, maybeThenable);
	      } else {
	        var then = lib$rsvp$$internal$$getThen(maybeThenable);

	        if (then === lib$rsvp$$internal$$GET_THEN_ERROR) {
	          lib$rsvp$$internal$$reject(promise, lib$rsvp$$internal$$GET_THEN_ERROR.error);
	        } else if (then === undefined) {
	          lib$rsvp$$internal$$fulfill(promise, maybeThenable);
	        } else if (lib$rsvp$utils$$isFunction(then)) {
	          lib$rsvp$$internal$$handleForeignThenable(promise, maybeThenable, then);
	        } else {
	          lib$rsvp$$internal$$fulfill(promise, maybeThenable);
	        }
	      }
	    }

	    function lib$rsvp$$internal$$resolve(promise, value) {
	      if (promise === value) {
	        lib$rsvp$$internal$$fulfill(promise, value);
	      } else if (lib$rsvp$utils$$objectOrFunction(value)) {
	        lib$rsvp$$internal$$handleMaybeThenable(promise, value);
	      } else {
	        lib$rsvp$$internal$$fulfill(promise, value);
	      }
	    }

	    function lib$rsvp$$internal$$publishRejection(promise) {
	      if (promise._onError) {
	        promise._onError(promise._result);
	      }

	      lib$rsvp$$internal$$publish(promise);
	    }

	    function lib$rsvp$$internal$$fulfill(promise, value) {
	      if (promise._state !== lib$rsvp$$internal$$PENDING) { return; }

	      promise._result = value;
	      promise._state = lib$rsvp$$internal$$FULFILLED;

	      if (promise._subscribers.length === 0) {
	        if (lib$rsvp$config$$config.instrument) {
	          lib$rsvp$instrument$$default('fulfilled', promise);
	        }
	      } else {
	        lib$rsvp$config$$config.async(lib$rsvp$$internal$$publish, promise);
	      }
	    }

	    function lib$rsvp$$internal$$reject(promise, reason) {
	      if (promise._state !== lib$rsvp$$internal$$PENDING) { return; }
	      promise._state = lib$rsvp$$internal$$REJECTED;
	      promise._result = reason;
	      lib$rsvp$config$$config.async(lib$rsvp$$internal$$publishRejection, promise);
	    }

	    function lib$rsvp$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
	      var subscribers = parent._subscribers;
	      var length = subscribers.length;

	      parent._onError = null;

	      subscribers[length] = child;
	      subscribers[length + lib$rsvp$$internal$$FULFILLED] = onFulfillment;
	      subscribers[length + lib$rsvp$$internal$$REJECTED]  = onRejection;

	      if (length === 0 && parent._state) {
	        lib$rsvp$config$$config.async(lib$rsvp$$internal$$publish, parent);
	      }
	    }

	    function lib$rsvp$$internal$$publish(promise) {
	      var subscribers = promise._subscribers;
	      var settled = promise._state;

	      if (lib$rsvp$config$$config.instrument) {
	        lib$rsvp$instrument$$default(settled === lib$rsvp$$internal$$FULFILLED ? 'fulfilled' : 'rejected', promise);
	      }

	      if (subscribers.length === 0) { return; }

	      var child, callback, detail = promise._result;

	      for (var i = 0; i < subscribers.length; i += 3) {
	        child = subscribers[i];
	        callback = subscribers[i + settled];

	        if (child) {
	          lib$rsvp$$internal$$invokeCallback(settled, child, callback, detail);
	        } else {
	          callback(detail);
	        }
	      }

	      promise._subscribers.length = 0;
	    }

	    function lib$rsvp$$internal$$ErrorObject() {
	      this.error = null;
	    }

	    var lib$rsvp$$internal$$TRY_CATCH_ERROR = new lib$rsvp$$internal$$ErrorObject();

	    function lib$rsvp$$internal$$tryCatch(callback, detail) {
	      try {
	        return callback(detail);
	      } catch(e) {
	        lib$rsvp$$internal$$TRY_CATCH_ERROR.error = e;
	        return lib$rsvp$$internal$$TRY_CATCH_ERROR;
	      }
	    }

	    function lib$rsvp$$internal$$invokeCallback(settled, promise, callback, detail) {
	      var hasCallback = lib$rsvp$utils$$isFunction(callback),
	          value, error, succeeded, failed;

	      if (hasCallback) {
	        value = lib$rsvp$$internal$$tryCatch(callback, detail);

	        if (value === lib$rsvp$$internal$$TRY_CATCH_ERROR) {
	          failed = true;
	          error = value.error;
	          value = null;
	        } else {
	          succeeded = true;
	        }

	        if (promise === value) {
	          lib$rsvp$$internal$$reject(promise, lib$rsvp$$internal$$withOwnPromise());
	          return;
	        }

	      } else {
	        value = detail;
	        succeeded = true;
	      }

	      if (promise._state !== lib$rsvp$$internal$$PENDING) {
	        // noop
	      } else if (hasCallback && succeeded) {
	        lib$rsvp$$internal$$resolve(promise, value);
	      } else if (failed) {
	        lib$rsvp$$internal$$reject(promise, error);
	      } else if (settled === lib$rsvp$$internal$$FULFILLED) {
	        lib$rsvp$$internal$$fulfill(promise, value);
	      } else if (settled === lib$rsvp$$internal$$REJECTED) {
	        lib$rsvp$$internal$$reject(promise, value);
	      }
	    }

	    function lib$rsvp$$internal$$initializePromise(promise, resolver) {
	      var resolved = false;
	      try {
	        resolver(function resolvePromise(value){
	          if (resolved) { return; }
	          resolved = true;
	          lib$rsvp$$internal$$resolve(promise, value);
	        }, function rejectPromise(reason) {
	          if (resolved) { return; }
	          resolved = true;
	          lib$rsvp$$internal$$reject(promise, reason);
	        });
	      } catch(e) {
	        lib$rsvp$$internal$$reject(promise, e);
	      }
	    }

	    function lib$rsvp$enumerator$$makeSettledResult(state, position, value) {
	      if (state === lib$rsvp$$internal$$FULFILLED) {
	        return {
	          state: 'fulfilled',
	          value: value
	        };
	      } else {
	         return {
	          state: 'rejected',
	          reason: value
	        };
	      }
	    }

	    function lib$rsvp$enumerator$$Enumerator(Constructor, input, abortOnReject, label) {
	      var enumerator = this;

	      enumerator._instanceConstructor = Constructor;
	      enumerator.promise = new Constructor(lib$rsvp$$internal$$noop, label);
	      enumerator._abortOnReject = abortOnReject;

	      if (enumerator._validateInput(input)) {
	        enumerator._input     = input;
	        enumerator.length     = input.length;
	        enumerator._remaining = input.length;

	        enumerator._init();

	        if (enumerator.length === 0) {
	          lib$rsvp$$internal$$fulfill(enumerator.promise, enumerator._result);
	        } else {
	          enumerator.length = enumerator.length || 0;
	          enumerator._enumerate();
	          if (enumerator._remaining === 0) {
	            lib$rsvp$$internal$$fulfill(enumerator.promise, enumerator._result);
	          }
	        }
	      } else {
	        lib$rsvp$$internal$$reject(enumerator.promise, enumerator._validationError());
	      }
	    }

	    var lib$rsvp$enumerator$$default = lib$rsvp$enumerator$$Enumerator;

	    lib$rsvp$enumerator$$Enumerator.prototype._validateInput = function(input) {
	      return lib$rsvp$utils$$isArray(input);
	    };

	    lib$rsvp$enumerator$$Enumerator.prototype._validationError = function() {
	      return new Error('Array Methods must be provided an Array');
	    };

	    lib$rsvp$enumerator$$Enumerator.prototype._init = function() {
	      this._result = new Array(this.length);
	    };

	    lib$rsvp$enumerator$$Enumerator.prototype._enumerate = function() {
	      var enumerator = this;
	      var length     = enumerator.length;
	      var promise    = enumerator.promise;
	      var input      = enumerator._input;

	      for (var i = 0; promise._state === lib$rsvp$$internal$$PENDING && i < length; i++) {
	        enumerator._eachEntry(input[i], i);
	      }
	    };

	    lib$rsvp$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
	      var enumerator = this;
	      var c = enumerator._instanceConstructor;
	      if (lib$rsvp$utils$$isMaybeThenable(entry)) {
	        if (entry.constructor === c && entry._state !== lib$rsvp$$internal$$PENDING) {
	          entry._onError = null;
	          enumerator._settledAt(entry._state, i, entry._result);
	        } else {
	          enumerator._willSettleAt(c.resolve(entry), i);
	        }
	      } else {
	        enumerator._remaining--;
	        enumerator._result[i] = enumerator._makeResult(lib$rsvp$$internal$$FULFILLED, i, entry);
	      }
	    };

	    lib$rsvp$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
	      var enumerator = this;
	      var promise = enumerator.promise;

	      if (promise._state === lib$rsvp$$internal$$PENDING) {
	        enumerator._remaining--;

	        if (enumerator._abortOnReject && state === lib$rsvp$$internal$$REJECTED) {
	          lib$rsvp$$internal$$reject(promise, value);
	        } else {
	          enumerator._result[i] = enumerator._makeResult(state, i, value);
	        }
	      }

	      if (enumerator._remaining === 0) {
	        lib$rsvp$$internal$$fulfill(promise, enumerator._result);
	      }
	    };

	    lib$rsvp$enumerator$$Enumerator.prototype._makeResult = function(state, i, value) {
	      return value;
	    };

	    lib$rsvp$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
	      var enumerator = this;

	      lib$rsvp$$internal$$subscribe(promise, undefined, function(value) {
	        enumerator._settledAt(lib$rsvp$$internal$$FULFILLED, i, value);
	      }, function(reason) {
	        enumerator._settledAt(lib$rsvp$$internal$$REJECTED, i, reason);
	      });
	    };
	    function lib$rsvp$promise$all$$all(entries, label) {
	      return new lib$rsvp$enumerator$$default(this, entries, true /* abort on reject */, label).promise;
	    }
	    var lib$rsvp$promise$all$$default = lib$rsvp$promise$all$$all;
	    function lib$rsvp$promise$race$$race(entries, label) {
	      /*jshint validthis:true */
	      var Constructor = this;

	      var promise = new Constructor(lib$rsvp$$internal$$noop, label);

	      if (!lib$rsvp$utils$$isArray(entries)) {
	        lib$rsvp$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
	        return promise;
	      }

	      var length = entries.length;

	      function onFulfillment(value) {
	        lib$rsvp$$internal$$resolve(promise, value);
	      }

	      function onRejection(reason) {
	        lib$rsvp$$internal$$reject(promise, reason);
	      }

	      for (var i = 0; promise._state === lib$rsvp$$internal$$PENDING && i < length; i++) {
	        lib$rsvp$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
	      }

	      return promise;
	    }
	    var lib$rsvp$promise$race$$default = lib$rsvp$promise$race$$race;
	    function lib$rsvp$promise$resolve$$resolve(object, label) {
	      /*jshint validthis:true */
	      var Constructor = this;

	      if (object && typeof object === 'object' && object.constructor === Constructor) {
	        return object;
	      }

	      var promise = new Constructor(lib$rsvp$$internal$$noop, label);
	      lib$rsvp$$internal$$resolve(promise, object);
	      return promise;
	    }
	    var lib$rsvp$promise$resolve$$default = lib$rsvp$promise$resolve$$resolve;
	    function lib$rsvp$promise$reject$$reject(reason, label) {
	      /*jshint validthis:true */
	      var Constructor = this;
	      var promise = new Constructor(lib$rsvp$$internal$$noop, label);
	      lib$rsvp$$internal$$reject(promise, reason);
	      return promise;
	    }
	    var lib$rsvp$promise$reject$$default = lib$rsvp$promise$reject$$reject;

	    var lib$rsvp$promise$$guidKey = 'rsvp_' + lib$rsvp$utils$$now() + '-';
	    var lib$rsvp$promise$$counter = 0;

	    function lib$rsvp$promise$$needsResolver() {
	      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
	    }

	    function lib$rsvp$promise$$needsNew() {
	      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
	    }

	    function lib$rsvp$promise$$Promise(resolver, label) {
	      var promise = this;

	      promise._id = lib$rsvp$promise$$counter++;
	      promise._label = label;
	      promise._state = undefined;
	      promise._result = undefined;
	      promise._subscribers = [];

	      if (lib$rsvp$config$$config.instrument) {
	        lib$rsvp$instrument$$default('created', promise);
	      }

	      if (lib$rsvp$$internal$$noop !== resolver) {
	        if (!lib$rsvp$utils$$isFunction(resolver)) {
	          lib$rsvp$promise$$needsResolver();
	        }

	        if (!(promise instanceof lib$rsvp$promise$$Promise)) {
	          lib$rsvp$promise$$needsNew();
	        }

	        lib$rsvp$$internal$$initializePromise(promise, resolver);
	      }
	    }

	    var lib$rsvp$promise$$default = lib$rsvp$promise$$Promise;

	    // deprecated
	    lib$rsvp$promise$$Promise.cast = lib$rsvp$promise$resolve$$default;
	    lib$rsvp$promise$$Promise.all = lib$rsvp$promise$all$$default;
	    lib$rsvp$promise$$Promise.race = lib$rsvp$promise$race$$default;
	    lib$rsvp$promise$$Promise.resolve = lib$rsvp$promise$resolve$$default;
	    lib$rsvp$promise$$Promise.reject = lib$rsvp$promise$reject$$default;

	    lib$rsvp$promise$$Promise.prototype = {
	      constructor: lib$rsvp$promise$$Promise,

	      _guidKey: lib$rsvp$promise$$guidKey,

	      _onError: function (reason) {
	        var promise = this;
	        lib$rsvp$config$$config.after(function() {
	          if (promise._onError) {
	            lib$rsvp$config$$config['trigger']('error', reason, promise._label);
	          }
	        });
	      },

	    /**
	      The primary way of interacting with a promise is through its `then` method,
	      which registers callbacks to receive either a promise's eventual value or the
	      reason why the promise cannot be fulfilled.

	      ```js
	      findUser().then(function(user){
	        // user is available
	      }, function(reason){
	        // user is unavailable, and you are given the reason why
	      });
	      ```

	      Chaining
	      --------

	      The return value of `then` is itself a promise.  This second, 'downstream'
	      promise is resolved with the return value of the first promise's fulfillment
	      or rejection handler, or rejected if the handler throws an exception.

	      ```js
	      findUser().then(function (user) {
	        return user.name;
	      }, function (reason) {
	        return 'default name';
	      }).then(function (userName) {
	        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
	        // will be `'default name'`
	      });

	      findUser().then(function (user) {
	        throw new Error('Found user, but still unhappy');
	      }, function (reason) {
	        throw new Error('`findUser` rejected and we're unhappy');
	      }).then(function (value) {
	        // never reached
	      }, function (reason) {
	        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
	        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
	      });
	      ```
	      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

	      ```js
	      findUser().then(function (user) {
	        throw new PedagogicalException('Upstream error');
	      }).then(function (value) {
	        // never reached
	      }).then(function (value) {
	        // never reached
	      }, function (reason) {
	        // The `PedgagocialException` is propagated all the way down to here
	      });
	      ```

	      Assimilation
	      ------------

	      Sometimes the value you want to propagate to a downstream promise can only be
	      retrieved asynchronously. This can be achieved by returning a promise in the
	      fulfillment or rejection handler. The downstream promise will then be pending
	      until the returned promise is settled. This is called *assimilation*.

	      ```js
	      findUser().then(function (user) {
	        return findCommentsByAuthor(user);
	      }).then(function (comments) {
	        // The user's comments are now available
	      });
	      ```

	      If the assimliated promise rejects, then the downstream promise will also reject.

	      ```js
	      findUser().then(function (user) {
	        return findCommentsByAuthor(user);
	      }).then(function (comments) {
	        // If `findCommentsByAuthor` fulfills, we'll have the value here
	      }, function (reason) {
	        // If `findCommentsByAuthor` rejects, we'll have the reason here
	      });
	      ```

	      Simple Example
	      --------------

	      Synchronous Example

	      ```javascript
	      var result;

	      try {
	        result = findResult();
	        // success
	      } catch(reason) {
	        // failure
	      }
	      ```

	      Errback Example

	      ```js
	      findResult(function(result, err){
	        if (err) {
	          // failure
	        } else {
	          // success
	        }
	      });
	      ```

	      Promise Example;

	      ```javascript
	      findResult().then(function(result){
	        // success
	      }, function(reason){
	        // failure
	      });
	      ```

	      Advanced Example
	      --------------

	      Synchronous Example

	      ```javascript
	      var author, books;

	      try {
	        author = findAuthor();
	        books  = findBooksByAuthor(author);
	        // success
	      } catch(reason) {
	        // failure
	      }
	      ```

	      Errback Example

	      ```js

	      function foundBooks(books) {

	      }

	      function failure(reason) {

	      }

	      findAuthor(function(author, err){
	        if (err) {
	          failure(err);
	          // failure
	        } else {
	          try {
	            findBoooksByAuthor(author, function(books, err) {
	              if (err) {
	                failure(err);
	              } else {
	                try {
	                  foundBooks(books);
	                } catch(reason) {
	                  failure(reason);
	                }
	              }
	            });
	          } catch(error) {
	            failure(err);
	          }
	          // success
	        }
	      });
	      ```

	      Promise Example;

	      ```javascript
	      findAuthor().
	        then(findBooksByAuthor).
	        then(function(books){
	          // found books
	      }).catch(function(reason){
	        // something went wrong
	      });
	      ```

	      @method then
	      @param {Function} onFulfillment
	      @param {Function} onRejection
	      @param {String} label optional string for labeling the promise.
	      Useful for tooling.
	      @return {Promise}
	    */
	      then: function(onFulfillment, onRejection, label) {
	        var parent = this;
	        var state = parent._state;

	        if (state === lib$rsvp$$internal$$FULFILLED && !onFulfillment || state === lib$rsvp$$internal$$REJECTED && !onRejection) {
	          if (lib$rsvp$config$$config.instrument) {
	            lib$rsvp$instrument$$default('chained', parent, parent);
	          }
	          return parent;
	        }

	        parent._onError = null;

	        var child = new parent.constructor(lib$rsvp$$internal$$noop, label);
	        var result = parent._result;

	        if (lib$rsvp$config$$config.instrument) {
	          lib$rsvp$instrument$$default('chained', parent, child);
	        }

	        if (state) {
	          var callback = arguments[state - 1];
	          lib$rsvp$config$$config.async(function(){
	            lib$rsvp$$internal$$invokeCallback(state, child, callback, result);
	          });
	        } else {
	          lib$rsvp$$internal$$subscribe(parent, child, onFulfillment, onRejection);
	        }

	        return child;
	      },

	    /**
	      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
	      as the catch block of a try/catch statement.

	      ```js
	      function findAuthor(){
	        throw new Error('couldn't find that author');
	      }

	      // synchronous
	      try {
	        findAuthor();
	      } catch(reason) {
	        // something went wrong
	      }

	      // async with promises
	      findAuthor().catch(function(reason){
	        // something went wrong
	      });
	      ```

	      @method catch
	      @param {Function} onRejection
	      @param {String} label optional string for labeling the promise.
	      Useful for tooling.
	      @return {Promise}
	    */
	      'catch': function(onRejection, label) {
	        return this.then(undefined, onRejection, label);
	      },

	    /**
	      `finally` will be invoked regardless of the promise's fate just as native
	      try/catch/finally behaves

	      Synchronous example:

	      ```js
	      findAuthor() {
	        if (Math.random() > 0.5) {
	          throw new Error();
	        }
	        return new Author();
	      }

	      try {
	        return findAuthor(); // succeed or fail
	      } catch(error) {
	        return findOtherAuther();
	      } finally {
	        // always runs
	        // doesn't affect the return value
	      }
	      ```

	      Asynchronous example:

	      ```js
	      findAuthor().catch(function(reason){
	        return findOtherAuther();
	      }).finally(function(){
	        // author was either found, or not
	      });
	      ```

	      @method finally
	      @param {Function} callback
	      @param {String} label optional string for labeling the promise.
	      Useful for tooling.
	      @return {Promise}
	    */
	      'finally': function(callback, label) {
	        var promise = this;
	        var constructor = promise.constructor;

	        return promise.then(function(value) {
	          return constructor.resolve(callback()).then(function(){
	            return value;
	          });
	        }, function(reason) {
	          return constructor.resolve(callback()).then(function(){
	            throw reason;
	          });
	        }, label);
	      }
	    };

	    function lib$rsvp$all$settled$$AllSettled(Constructor, entries, label) {
	      this._superConstructor(Constructor, entries, false /* don't abort on reject */, label);
	    }

	    lib$rsvp$all$settled$$AllSettled.prototype = lib$rsvp$utils$$o_create(lib$rsvp$enumerator$$default.prototype);
	    lib$rsvp$all$settled$$AllSettled.prototype._superConstructor = lib$rsvp$enumerator$$default;
	    lib$rsvp$all$settled$$AllSettled.prototype._makeResult = lib$rsvp$enumerator$$makeSettledResult;
	    lib$rsvp$all$settled$$AllSettled.prototype._validationError = function() {
	      return new Error('allSettled must be called with an array');
	    };

	    function lib$rsvp$all$settled$$allSettled(entries, label) {
	      return new lib$rsvp$all$settled$$AllSettled(lib$rsvp$promise$$default, entries, label).promise;
	    }
	    var lib$rsvp$all$settled$$default = lib$rsvp$all$settled$$allSettled;
	    function lib$rsvp$all$$all(array, label) {
	      return lib$rsvp$promise$$default.all(array, label);
	    }
	    var lib$rsvp$all$$default = lib$rsvp$all$$all;
	    var lib$rsvp$asap$$len = 0;
	    var lib$rsvp$asap$$toString = {}.toString;
	    var lib$rsvp$asap$$vertxNext;
	    function lib$rsvp$asap$$asap(callback, arg) {
	      lib$rsvp$asap$$queue[lib$rsvp$asap$$len] = callback;
	      lib$rsvp$asap$$queue[lib$rsvp$asap$$len + 1] = arg;
	      lib$rsvp$asap$$len += 2;
	      if (lib$rsvp$asap$$len === 2) {
	        // If len is 1, that means that we need to schedule an async flush.
	        // If additional callbacks are queued before the queue is flushed, they
	        // will be processed by this flush that we are scheduling.
	        lib$rsvp$asap$$scheduleFlush();
	      }
	    }

	    var lib$rsvp$asap$$default = lib$rsvp$asap$$asap;

	    var lib$rsvp$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
	    var lib$rsvp$asap$$browserGlobal = lib$rsvp$asap$$browserWindow || {};
	    var lib$rsvp$asap$$BrowserMutationObserver = lib$rsvp$asap$$browserGlobal.MutationObserver || lib$rsvp$asap$$browserGlobal.WebKitMutationObserver;
	    var lib$rsvp$asap$$isNode = typeof self === 'undefined' &&
	      typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

	    // test for web worker but not in IE10
	    var lib$rsvp$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
	      typeof importScripts !== 'undefined' &&
	      typeof MessageChannel !== 'undefined';

	    // node
	    function lib$rsvp$asap$$useNextTick() {
	      var nextTick = process.nextTick;
	      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
	      // setImmediate should be used instead instead
	      var version = process.versions.node.match(/^(?:(\d+)\.)?(?:(\d+)\.)?(\*|\d+)$/);
	      if (Array.isArray(version) && version[1] === '0' && version[2] === '10') {
	        nextTick = setImmediate;
	      }
	      return function() {
	        nextTick(lib$rsvp$asap$$flush);
	      };
	    }

	    // vertx
	    function lib$rsvp$asap$$useVertxTimer() {
	      return function() {
	        lib$rsvp$asap$$vertxNext(lib$rsvp$asap$$flush);
	      };
	    }

	    function lib$rsvp$asap$$useMutationObserver() {
	      var iterations = 0;
	      var observer = new lib$rsvp$asap$$BrowserMutationObserver(lib$rsvp$asap$$flush);
	      var node = document.createTextNode('');
	      observer.observe(node, { characterData: true });

	      return function() {
	        node.data = (iterations = ++iterations % 2);
	      };
	    }

	    // web worker
	    function lib$rsvp$asap$$useMessageChannel() {
	      var channel = new MessageChannel();
	      channel.port1.onmessage = lib$rsvp$asap$$flush;
	      return function () {
	        channel.port2.postMessage(0);
	      };
	    }

	    function lib$rsvp$asap$$useSetTimeout() {
	      return function() {
	        setTimeout(lib$rsvp$asap$$flush, 1);
	      };
	    }

	    var lib$rsvp$asap$$queue = new Array(1000);
	    function lib$rsvp$asap$$flush() {
	      for (var i = 0; i < lib$rsvp$asap$$len; i+=2) {
	        var callback = lib$rsvp$asap$$queue[i];
	        var arg = lib$rsvp$asap$$queue[i+1];

	        callback(arg);

	        lib$rsvp$asap$$queue[i] = undefined;
	        lib$rsvp$asap$$queue[i+1] = undefined;
	      }

	      lib$rsvp$asap$$len = 0;
	    }

	    function lib$rsvp$asap$$attemptVertex() {
	      try {
	        var r = require;
	        var vertx = __webpack_require__(6);
	        lib$rsvp$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
	        return lib$rsvp$asap$$useVertxTimer();
	      } catch(e) {
	        return lib$rsvp$asap$$useSetTimeout();
	      }
	    }

	    var lib$rsvp$asap$$scheduleFlush;
	    // Decide what async method to use to triggering processing of queued callbacks:
	    if (lib$rsvp$asap$$isNode) {
	      lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useNextTick();
	    } else if (lib$rsvp$asap$$BrowserMutationObserver) {
	      lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useMutationObserver();
	    } else if (lib$rsvp$asap$$isWorker) {
	      lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useMessageChannel();
	    } else if (lib$rsvp$asap$$browserWindow === undefined && "function" === 'function') {
	      lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$attemptVertex();
	    } else {
	      lib$rsvp$asap$$scheduleFlush = lib$rsvp$asap$$useSetTimeout();
	    }
	    function lib$rsvp$defer$$defer(label) {
	      var deferred = {};

	      deferred['promise'] = new lib$rsvp$promise$$default(function(resolve, reject) {
	        deferred['resolve'] = resolve;
	        deferred['reject'] = reject;
	      }, label);

	      return deferred;
	    }
	    var lib$rsvp$defer$$default = lib$rsvp$defer$$defer;
	    function lib$rsvp$filter$$filter(promises, filterFn, label) {
	      return lib$rsvp$promise$$default.all(promises, label).then(function(values) {
	        if (!lib$rsvp$utils$$isFunction(filterFn)) {
	          throw new TypeError("You must pass a function as filter's second argument.");
	        }

	        var length = values.length;
	        var filtered = new Array(length);

	        for (var i = 0; i < length; i++) {
	          filtered[i] = filterFn(values[i]);
	        }

	        return lib$rsvp$promise$$default.all(filtered, label).then(function(filtered) {
	          var results = new Array(length);
	          var newLength = 0;

	          for (var i = 0; i < length; i++) {
	            if (filtered[i]) {
	              results[newLength] = values[i];
	              newLength++;
	            }
	          }

	          results.length = newLength;

	          return results;
	        });
	      });
	    }
	    var lib$rsvp$filter$$default = lib$rsvp$filter$$filter;

	    function lib$rsvp$promise$hash$$PromiseHash(Constructor, object, label) {
	      this._superConstructor(Constructor, object, true, label);
	    }

	    var lib$rsvp$promise$hash$$default = lib$rsvp$promise$hash$$PromiseHash;

	    lib$rsvp$promise$hash$$PromiseHash.prototype = lib$rsvp$utils$$o_create(lib$rsvp$enumerator$$default.prototype);
	    lib$rsvp$promise$hash$$PromiseHash.prototype._superConstructor = lib$rsvp$enumerator$$default;
	    lib$rsvp$promise$hash$$PromiseHash.prototype._init = function() {
	      this._result = {};
	    };

	    lib$rsvp$promise$hash$$PromiseHash.prototype._validateInput = function(input) {
	      return input && typeof input === 'object';
	    };

	    lib$rsvp$promise$hash$$PromiseHash.prototype._validationError = function() {
	      return new Error('Promise.hash must be called with an object');
	    };

	    lib$rsvp$promise$hash$$PromiseHash.prototype._enumerate = function() {
	      var enumerator = this;
	      var promise    = enumerator.promise;
	      var input      = enumerator._input;
	      var results    = [];

	      for (var key in input) {
	        if (promise._state === lib$rsvp$$internal$$PENDING && Object.prototype.hasOwnProperty.call(input, key)) {
	          results.push({
	            position: key,
	            entry: input[key]
	          });
	        }
	      }

	      var length = results.length;
	      enumerator._remaining = length;
	      var result;

	      for (var i = 0; promise._state === lib$rsvp$$internal$$PENDING && i < length; i++) {
	        result = results[i];
	        enumerator._eachEntry(result.entry, result.position);
	      }
	    };

	    function lib$rsvp$hash$settled$$HashSettled(Constructor, object, label) {
	      this._superConstructor(Constructor, object, false, label);
	    }

	    lib$rsvp$hash$settled$$HashSettled.prototype = lib$rsvp$utils$$o_create(lib$rsvp$promise$hash$$default.prototype);
	    lib$rsvp$hash$settled$$HashSettled.prototype._superConstructor = lib$rsvp$enumerator$$default;
	    lib$rsvp$hash$settled$$HashSettled.prototype._makeResult = lib$rsvp$enumerator$$makeSettledResult;

	    lib$rsvp$hash$settled$$HashSettled.prototype._validationError = function() {
	      return new Error('hashSettled must be called with an object');
	    };

	    function lib$rsvp$hash$settled$$hashSettled(object, label) {
	      return new lib$rsvp$hash$settled$$HashSettled(lib$rsvp$promise$$default, object, label).promise;
	    }
	    var lib$rsvp$hash$settled$$default = lib$rsvp$hash$settled$$hashSettled;
	    function lib$rsvp$hash$$hash(object, label) {
	      return new lib$rsvp$promise$hash$$default(lib$rsvp$promise$$default, object, label).promise;
	    }
	    var lib$rsvp$hash$$default = lib$rsvp$hash$$hash;
	    function lib$rsvp$map$$map(promises, mapFn, label) {
	      return lib$rsvp$promise$$default.all(promises, label).then(function(values) {
	        if (!lib$rsvp$utils$$isFunction(mapFn)) {
	          throw new TypeError("You must pass a function as map's second argument.");
	        }

	        var length = values.length;
	        var results = new Array(length);

	        for (var i = 0; i < length; i++) {
	          results[i] = mapFn(values[i]);
	        }

	        return lib$rsvp$promise$$default.all(results, label);
	      });
	    }
	    var lib$rsvp$map$$default = lib$rsvp$map$$map;

	    function lib$rsvp$node$$Result() {
	      this.value = undefined;
	    }

	    var lib$rsvp$node$$ERROR = new lib$rsvp$node$$Result();
	    var lib$rsvp$node$$GET_THEN_ERROR = new lib$rsvp$node$$Result();

	    function lib$rsvp$node$$getThen(obj) {
	      try {
	       return obj.then;
	      } catch(error) {
	        lib$rsvp$node$$ERROR.value= error;
	        return lib$rsvp$node$$ERROR;
	      }
	    }


	    function lib$rsvp$node$$tryApply(f, s, a) {
	      try {
	        f.apply(s, a);
	      } catch(error) {
	        lib$rsvp$node$$ERROR.value = error;
	        return lib$rsvp$node$$ERROR;
	      }
	    }

	    function lib$rsvp$node$$makeObject(_, argumentNames) {
	      var obj = {};
	      var name;
	      var i;
	      var length = _.length;
	      var args = new Array(length);

	      for (var x = 0; x < length; x++) {
	        args[x] = _[x];
	      }

	      for (i = 0; i < argumentNames.length; i++) {
	        name = argumentNames[i];
	        obj[name] = args[i + 1];
	      }

	      return obj;
	    }

	    function lib$rsvp$node$$arrayResult(_) {
	      var length = _.length;
	      var args = new Array(length - 1);

	      for (var i = 1; i < length; i++) {
	        args[i - 1] = _[i];
	      }

	      return args;
	    }

	    function lib$rsvp$node$$wrapThenable(then, promise) {
	      return {
	        then: function(onFulFillment, onRejection) {
	          return then.call(promise, onFulFillment, onRejection);
	        }
	      };
	    }

	    function lib$rsvp$node$$denodeify(nodeFunc, options) {
	      var fn = function() {
	        var self = this;
	        var l = arguments.length;
	        var args = new Array(l + 1);
	        var arg;
	        var promiseInput = false;

	        for (var i = 0; i < l; ++i) {
	          arg = arguments[i];

	          if (!promiseInput) {
	            // TODO: clean this up
	            promiseInput = lib$rsvp$node$$needsPromiseInput(arg);
	            if (promiseInput === lib$rsvp$node$$GET_THEN_ERROR) {
	              var p = new lib$rsvp$promise$$default(lib$rsvp$$internal$$noop);
	              lib$rsvp$$internal$$reject(p, lib$rsvp$node$$GET_THEN_ERROR.value);
	              return p;
	            } else if (promiseInput && promiseInput !== true) {
	              arg = lib$rsvp$node$$wrapThenable(promiseInput, arg);
	            }
	          }
	          args[i] = arg;
	        }

	        var promise = new lib$rsvp$promise$$default(lib$rsvp$$internal$$noop);

	        args[l] = function(err, val) {
	          if (err)
	            lib$rsvp$$internal$$reject(promise, err);
	          else if (options === undefined)
	            lib$rsvp$$internal$$resolve(promise, val);
	          else if (options === true)
	            lib$rsvp$$internal$$resolve(promise, lib$rsvp$node$$arrayResult(arguments));
	          else if (lib$rsvp$utils$$isArray(options))
	            lib$rsvp$$internal$$resolve(promise, lib$rsvp$node$$makeObject(arguments, options));
	          else
	            lib$rsvp$$internal$$resolve(promise, val);
	        };

	        if (promiseInput) {
	          return lib$rsvp$node$$handlePromiseInput(promise, args, nodeFunc, self);
	        } else {
	          return lib$rsvp$node$$handleValueInput(promise, args, nodeFunc, self);
	        }
	      };

	      fn.__proto__ = nodeFunc;

	      return fn;
	    }

	    var lib$rsvp$node$$default = lib$rsvp$node$$denodeify;

	    function lib$rsvp$node$$handleValueInput(promise, args, nodeFunc, self) {
	      var result = lib$rsvp$node$$tryApply(nodeFunc, self, args);
	      if (result === lib$rsvp$node$$ERROR) {
	        lib$rsvp$$internal$$reject(promise, result.value);
	      }
	      return promise;
	    }

	    function lib$rsvp$node$$handlePromiseInput(promise, args, nodeFunc, self){
	      return lib$rsvp$promise$$default.all(args).then(function(args){
	        var result = lib$rsvp$node$$tryApply(nodeFunc, self, args);
	        if (result === lib$rsvp$node$$ERROR) {
	          lib$rsvp$$internal$$reject(promise, result.value);
	        }
	        return promise;
	      });
	    }

	    function lib$rsvp$node$$needsPromiseInput(arg) {
	      if (arg && typeof arg === 'object') {
	        if (arg.constructor === lib$rsvp$promise$$default) {
	          return true;
	        } else {
	          return lib$rsvp$node$$getThen(arg);
	        }
	      } else {
	        return false;
	      }
	    }
	    var lib$rsvp$platform$$platform;

	    /* global self */
	    if (typeof self === 'object') {
	      lib$rsvp$platform$$platform = self;

	    /* global global */
	    } else if (typeof global === 'object') {
	      lib$rsvp$platform$$platform = global;
	    } else {
	      throw new Error('no global: `self` or `global` found');
	    }

	    var lib$rsvp$platform$$default = lib$rsvp$platform$$platform;
	    function lib$rsvp$race$$race(array, label) {
	      return lib$rsvp$promise$$default.race(array, label);
	    }
	    var lib$rsvp$race$$default = lib$rsvp$race$$race;
	    function lib$rsvp$reject$$reject(reason, label) {
	      return lib$rsvp$promise$$default.reject(reason, label);
	    }
	    var lib$rsvp$reject$$default = lib$rsvp$reject$$reject;
	    function lib$rsvp$resolve$$resolve(value, label) {
	      return lib$rsvp$promise$$default.resolve(value, label);
	    }
	    var lib$rsvp$resolve$$default = lib$rsvp$resolve$$resolve;
	    function lib$rsvp$rethrow$$rethrow(reason) {
	      setTimeout(function() {
	        throw reason;
	      });
	      throw reason;
	    }
	    var lib$rsvp$rethrow$$default = lib$rsvp$rethrow$$rethrow;

	    // defaults
	    lib$rsvp$config$$config.async = lib$rsvp$asap$$default;
	    lib$rsvp$config$$config.after = function(cb) {
	      setTimeout(cb, 0);
	    };
	    var lib$rsvp$$cast = lib$rsvp$resolve$$default;
	    function lib$rsvp$$async(callback, arg) {
	      lib$rsvp$config$$config.async(callback, arg);
	    }

	    function lib$rsvp$$on() {
	      lib$rsvp$config$$config['on'].apply(lib$rsvp$config$$config, arguments);
	    }

	    function lib$rsvp$$off() {
	      lib$rsvp$config$$config['off'].apply(lib$rsvp$config$$config, arguments);
	    }

	    // Set up instrumentation through `window.__PROMISE_INTRUMENTATION__`
	    if (typeof window !== 'undefined' && typeof window['__PROMISE_INSTRUMENTATION__'] === 'object') {
	      var lib$rsvp$$callbacks = window['__PROMISE_INSTRUMENTATION__'];
	      lib$rsvp$config$$configure('instrument', true);
	      for (var lib$rsvp$$eventName in lib$rsvp$$callbacks) {
	        if (lib$rsvp$$callbacks.hasOwnProperty(lib$rsvp$$eventName)) {
	          lib$rsvp$$on(lib$rsvp$$eventName, lib$rsvp$$callbacks[lib$rsvp$$eventName]);
	        }
	      }
	    }

	    var lib$rsvp$umd$$RSVP = {
	      'race': lib$rsvp$race$$default,
	      'Promise': lib$rsvp$promise$$default,
	      'allSettled': lib$rsvp$all$settled$$default,
	      'hash': lib$rsvp$hash$$default,
	      'hashSettled': lib$rsvp$hash$settled$$default,
	      'denodeify': lib$rsvp$node$$default,
	      'on': lib$rsvp$$on,
	      'off': lib$rsvp$$off,
	      'map': lib$rsvp$map$$default,
	      'filter': lib$rsvp$filter$$default,
	      'resolve': lib$rsvp$resolve$$default,
	      'reject': lib$rsvp$reject$$default,
	      'all': lib$rsvp$all$$default,
	      'rethrow': lib$rsvp$rethrow$$default,
	      'defer': lib$rsvp$defer$$default,
	      'EventTarget': lib$rsvp$events$$default,
	      'configure': lib$rsvp$config$$configure,
	      'async': lib$rsvp$$async
	    };

	    /* global define:true module:true window: true */
	    if ("function" === 'function' && __webpack_require__(7)['amd']) {
	      !(__WEBPACK_AMD_DEFINE_RESULT__ = function() { return lib$rsvp$umd$$RSVP; }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof module !== 'undefined' && module['exports']) {
	      module['exports'] = lib$rsvp$umd$$RSVP;
	    } else if (typeof lib$rsvp$platform$$default !== 'undefined') {
	      lib$rsvp$platform$$default['RSVP'] = lib$rsvp$umd$$RSVP;
	    }
	}).call(this);


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3), __webpack_require__(4).setImmediate, (function() { return this; }()), __webpack_require__(5)(module)))

/***/ },
/* 3 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            currentQueue[queueIndex].run();
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	// TODO(shtylman)
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(3).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

	  immediateIds[id] = true;

	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });

	  return id;
	};

	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4).setImmediate, __webpack_require__(4).clearImmediate))

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 6 */
/***/ function(module, exports) {

	/* (ignored) */

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ }
/******/ ]);
