/* compiled file, donot modify directly! */
class Eventer {
  constructor() {
    this.eventSubscriptions = {};
  }

  on(eventName, callback) {
    // Retrieve a list of current subscribers for eventName (if any)
    var subscribers = this.eventSubscriptions[eventName];

    if (typeof subscribers === 'undefined') {
      // If no subscribers for this event were found,
      // initialize a new empty array
      subscribers = this.eventSubscriptions[eventName] = [];
    }

    // Add the given callback function to the end of the array with
    // eventSubscriptions for this event.
    subscribers.push(callback);
  }

  off (eventName) {
    delete this.eventSubscriptions[eventName];
  }

  trigger(eventName, data, context) {
    var subscribers = this.eventSubscriptions[eventName], i, iMax;

    if (typeof subscribers === 'undefined') {
      // No list found for this event, return early to abort execution
      return;
    }

    // Ensure data is an array or is wrapped in an array,
    // for Function.prototype.apply use
    data = (data instanceof Array) ? data : [data];

    // Set a default value for `this` in the callback
    context = context || this;

    for (i = 0, iMax = subscribers.length; i < iMax; i += 1) {
      subscribers[i].apply(context, data);
    }
  }
}

module.exports = Eventer;