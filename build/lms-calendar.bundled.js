var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { isServer } from "lit-html/is-server.js";
import { directive } from "lit/directive.js";
import { AsyncDirective } from "lit/async-directive.js";
import "lit/html.js";
import { css, LitElement, html, nothing, unsafeCSS } from "lit";
import { customElement, state, query, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { map as map$1 } from "lit/directives/map.js";
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let t$2 = class t {
  constructor(t3, { target: i2, config: h3, callback: e2, skipInitial: o2 }) {
    this.t = /* @__PURE__ */ new Set(), this.o = false, this.i = false, this.h = t3, null !== i2 && this.t.add(i2 ?? t3), this.l = h3, this.o = o2 ?? this.o, this.callback = e2, isServer || (window.ResizeObserver ? (this.u = new ResizeObserver((s2) => {
      this.handleChanges(s2), this.h.requestUpdate();
    }), t3.addController(this)) : console.warn("ResizeController error: browser does not support ResizeObserver."));
  }
  handleChanges(s2) {
    var _a;
    this.value = (_a = this.callback) == null ? void 0 : _a.call(this, s2, this.u);
  }
  hostConnected() {
    for (const s2 of this.t) this.observe(s2);
  }
  hostDisconnected() {
    this.disconnect();
  }
  async hostUpdated() {
    !this.o && this.i && this.handleChanges([]), this.i = false;
  }
  observe(s2) {
    this.t.add(s2), this.u.observe(s2, this.l), this.i = true, this.h.requestUpdate();
  }
  unobserve(s2) {
    this.t.delete(s2), this.u.unobserve(s2);
  }
  disconnect() {
    this.u.disconnect();
  }
};
var __defProp$7 = Object.defineProperty;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp$7(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField2 = (obj, key, value) => {
  __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg2) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg2);
};
var __privateIn = (member, obj) => {
  if (Object(obj) !== obj)
    throw TypeError('Cannot use the "in" operator on this value');
  return member.has(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
function defaultEquals(a2, b2) {
  return Object.is(a2, b2);
}
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
let activeConsumer = null;
let inNotificationPhase = false;
let epoch = 1;
const SIGNAL = /* @__PURE__ */ Symbol("SIGNAL");
function setActiveConsumer(consumer) {
  const prev = activeConsumer;
  activeConsumer = consumer;
  return prev;
}
function getActiveConsumer() {
  return activeConsumer;
}
function isInNotificationPhase() {
  return inNotificationPhase;
}
const REACTIVE_NODE = {
  version: 0,
  lastCleanEpoch: 0,
  dirty: false,
  producerNode: void 0,
  producerLastReadVersion: void 0,
  producerIndexOfThis: void 0,
  nextProducerIndex: 0,
  liveConsumerNode: void 0,
  liveConsumerIndexOfThis: void 0,
  consumerAllowSignalWrites: false,
  consumerIsAlwaysLive: false,
  producerMustRecompute: () => false,
  producerRecomputeValue: () => {
  },
  consumerMarkedDirty: () => {
  },
  consumerOnSignalRead: () => {
  }
};
function producerAccessed(node) {
  if (inNotificationPhase) {
    throw new Error(
      typeof ngDevMode !== "undefined" && ngDevMode ? `Assertion error: signal read during notification phase` : ""
    );
  }
  if (activeConsumer === null) {
    return;
  }
  activeConsumer.consumerOnSignalRead(node);
  const idx = activeConsumer.nextProducerIndex++;
  assertConsumerNode(activeConsumer);
  if (idx < activeConsumer.producerNode.length && activeConsumer.producerNode[idx] !== node) {
    if (consumerIsLive(activeConsumer)) {
      const staleProducer = activeConsumer.producerNode[idx];
      producerRemoveLiveConsumerAtIndex(staleProducer, activeConsumer.producerIndexOfThis[idx]);
    }
  }
  if (activeConsumer.producerNode[idx] !== node) {
    activeConsumer.producerNode[idx] = node;
    activeConsumer.producerIndexOfThis[idx] = consumerIsLive(activeConsumer) ? producerAddLiveConsumer(node, activeConsumer, idx) : 0;
  }
  activeConsumer.producerLastReadVersion[idx] = node.version;
}
function producerIncrementEpoch() {
  epoch++;
}
function producerUpdateValueVersion(node) {
  if (!node.dirty && node.lastCleanEpoch === epoch) {
    return;
  }
  if (!node.producerMustRecompute(node) && !consumerPollProducersForChange(node)) {
    node.dirty = false;
    node.lastCleanEpoch = epoch;
    return;
  }
  node.producerRecomputeValue(node);
  node.dirty = false;
  node.lastCleanEpoch = epoch;
}
function producerNotifyConsumers(node) {
  if (node.liveConsumerNode === void 0) {
    return;
  }
  const prev = inNotificationPhase;
  inNotificationPhase = true;
  try {
    for (const consumer of node.liveConsumerNode) {
      if (!consumer.dirty) {
        consumerMarkDirty(consumer);
      }
    }
  } finally {
    inNotificationPhase = prev;
  }
}
function producerUpdatesAllowed() {
  return (activeConsumer == null ? void 0 : activeConsumer.consumerAllowSignalWrites) !== false;
}
function consumerMarkDirty(node) {
  var _a;
  node.dirty = true;
  producerNotifyConsumers(node);
  (_a = node.consumerMarkedDirty) == null ? void 0 : _a.call(node.wrapper ?? node);
}
function consumerBeforeComputation(node) {
  node && (node.nextProducerIndex = 0);
  return setActiveConsumer(node);
}
function consumerAfterComputation(node, prevConsumer) {
  setActiveConsumer(prevConsumer);
  if (!node || node.producerNode === void 0 || node.producerIndexOfThis === void 0 || node.producerLastReadVersion === void 0) {
    return;
  }
  if (consumerIsLive(node)) {
    for (let i2 = node.nextProducerIndex; i2 < node.producerNode.length; i2++) {
      producerRemoveLiveConsumerAtIndex(node.producerNode[i2], node.producerIndexOfThis[i2]);
    }
  }
  while (node.producerNode.length > node.nextProducerIndex) {
    node.producerNode.pop();
    node.producerLastReadVersion.pop();
    node.producerIndexOfThis.pop();
  }
}
function consumerPollProducersForChange(node) {
  assertConsumerNode(node);
  for (let i2 = 0; i2 < node.producerNode.length; i2++) {
    const producer = node.producerNode[i2];
    const seenVersion = node.producerLastReadVersion[i2];
    if (seenVersion !== producer.version) {
      return true;
    }
    producerUpdateValueVersion(producer);
    if (seenVersion !== producer.version) {
      return true;
    }
  }
  return false;
}
function producerAddLiveConsumer(node, consumer, indexOfThis) {
  var _a;
  assertProducerNode(node);
  assertConsumerNode(node);
  if (node.liveConsumerNode.length === 0) {
    (_a = node.watched) == null ? void 0 : _a.call(node.wrapper);
    for (let i2 = 0; i2 < node.producerNode.length; i2++) {
      node.producerIndexOfThis[i2] = producerAddLiveConsumer(node.producerNode[i2], node, i2);
    }
  }
  node.liveConsumerIndexOfThis.push(indexOfThis);
  return node.liveConsumerNode.push(consumer) - 1;
}
function producerRemoveLiveConsumerAtIndex(node, idx) {
  var _a;
  assertProducerNode(node);
  assertConsumerNode(node);
  if (typeof ngDevMode !== "undefined" && ngDevMode && idx >= node.liveConsumerNode.length) {
    throw new Error(
      `Assertion error: active consumer index ${idx} is out of bounds of ${node.liveConsumerNode.length} consumers)`
    );
  }
  if (node.liveConsumerNode.length === 1) {
    (_a = node.unwatched) == null ? void 0 : _a.call(node.wrapper);
    for (let i2 = 0; i2 < node.producerNode.length; i2++) {
      producerRemoveLiveConsumerAtIndex(node.producerNode[i2], node.producerIndexOfThis[i2]);
    }
  }
  const lastIdx = node.liveConsumerNode.length - 1;
  node.liveConsumerNode[idx] = node.liveConsumerNode[lastIdx];
  node.liveConsumerIndexOfThis[idx] = node.liveConsumerIndexOfThis[lastIdx];
  node.liveConsumerNode.length--;
  node.liveConsumerIndexOfThis.length--;
  if (idx < node.liveConsumerNode.length) {
    const idxProducer = node.liveConsumerIndexOfThis[idx];
    const consumer = node.liveConsumerNode[idx];
    assertConsumerNode(consumer);
    consumer.producerIndexOfThis[idxProducer] = idx;
  }
}
function consumerIsLive(node) {
  var _a;
  return node.consumerIsAlwaysLive || (((_a = node == null ? void 0 : node.liveConsumerNode) == null ? void 0 : _a.length) ?? 0) > 0;
}
function assertConsumerNode(node) {
  node.producerNode ?? (node.producerNode = []);
  node.producerIndexOfThis ?? (node.producerIndexOfThis = []);
  node.producerLastReadVersion ?? (node.producerLastReadVersion = []);
}
function assertProducerNode(node) {
  node.liveConsumerNode ?? (node.liveConsumerNode = []);
  node.liveConsumerIndexOfThis ?? (node.liveConsumerIndexOfThis = []);
}
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
function computedGet(node) {
  producerUpdateValueVersion(node);
  producerAccessed(node);
  if (node.value === ERRORED) {
    throw node.error;
  }
  return node.value;
}
function createComputed(computation) {
  const node = Object.create(COMPUTED_NODE);
  node.computation = computation;
  const computed = () => computedGet(node);
  computed[SIGNAL] = node;
  return computed;
}
const UNSET = /* @__PURE__ */ Symbol("UNSET");
const COMPUTING = /* @__PURE__ */ Symbol("COMPUTING");
const ERRORED = /* @__PURE__ */ Symbol("ERRORED");
const COMPUTED_NODE = /* @__PURE__ */ (() => {
  return {
    ...REACTIVE_NODE,
    value: UNSET,
    dirty: true,
    error: null,
    equal: defaultEquals,
    producerMustRecompute(node) {
      return node.value === UNSET || node.value === COMPUTING;
    },
    producerRecomputeValue(node) {
      if (node.value === COMPUTING) {
        throw new Error("Detected cycle in computations.");
      }
      const oldValue = node.value;
      node.value = COMPUTING;
      const prevConsumer = consumerBeforeComputation(node);
      let newValue;
      let wasEqual = false;
      try {
        newValue = node.computation.call(node.wrapper);
        const oldOk = oldValue !== UNSET && oldValue !== ERRORED;
        wasEqual = oldOk && node.equal.call(node.wrapper, oldValue, newValue);
      } catch (err) {
        newValue = ERRORED;
        node.error = err;
      } finally {
        consumerAfterComputation(node, prevConsumer);
      }
      if (wasEqual) {
        node.value = oldValue;
        return;
      }
      node.value = newValue;
      node.version++;
    }
  };
})();
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
function defaultThrowError() {
  throw new Error();
}
let throwInvalidWriteToSignalErrorFn = defaultThrowError;
function throwInvalidWriteToSignalError() {
  throwInvalidWriteToSignalErrorFn();
}
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
function createSignal(initialValue) {
  const node = Object.create(SIGNAL_NODE);
  node.value = initialValue;
  const getter = () => {
    producerAccessed(node);
    return node.value;
  };
  getter[SIGNAL] = node;
  return getter;
}
function signalGetFn() {
  producerAccessed(this);
  return this.value;
}
function signalSetFn(node, newValue) {
  if (!producerUpdatesAllowed()) {
    throwInvalidWriteToSignalError();
  }
  if (!node.equal.call(node.wrapper, node.value, newValue)) {
    node.value = newValue;
    signalValueChanged(node);
  }
}
const SIGNAL_NODE = /* @__PURE__ */ (() => {
  return {
    ...REACTIVE_NODE,
    equal: defaultEquals,
    value: void 0
  };
})();
function signalValueChanged(node) {
  node.version++;
  producerIncrementEpoch();
  producerNotifyConsumers(node);
}
/**
 * @license
 * Copyright 2024 Bloomberg Finance L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const NODE = Symbol("node");
var Signal;
((Signal2) => {
  var _a, _brand, _b, _brand2;
  class State {
    constructor(initialValue, options = {}) {
      __privateAdd(this, _brand);
      __publicField2(this, _a);
      const ref = createSignal(initialValue);
      const node = ref[SIGNAL];
      this[NODE] = node;
      node.wrapper = this;
      if (options) {
        const equals = options.equals;
        if (equals) {
          node.equal = equals;
        }
        node.watched = options[Signal2.subtle.watched];
        node.unwatched = options[Signal2.subtle.unwatched];
      }
    }
    get() {
      if (!(0, Signal2.isState)(this))
        throw new TypeError("Wrong receiver type for Signal.State.prototype.get");
      return signalGetFn.call(this[NODE]);
    }
    set(newValue) {
      if (!(0, Signal2.isState)(this))
        throw new TypeError("Wrong receiver type for Signal.State.prototype.set");
      if (isInNotificationPhase()) {
        throw new Error("Writes to signals not permitted during Watcher callback");
      }
      const ref = this[NODE];
      signalSetFn(ref, newValue);
    }
  }
  _a = NODE;
  _brand = /* @__PURE__ */ new WeakSet();
  Signal2.isState = (s2) => typeof s2 === "object" && __privateIn(_brand, s2);
  Signal2.State = State;
  class Computed {
    // Create a Signal which evaluates to the value returned by the callback.
    // Callback is called with this signal as the parameter.
    constructor(computation, options) {
      __privateAdd(this, _brand2);
      __publicField2(this, _b);
      const ref = createComputed(computation);
      const node = ref[SIGNAL];
      node.consumerAllowSignalWrites = true;
      this[NODE] = node;
      node.wrapper = this;
      if (options) {
        const equals = options.equals;
        if (equals) {
          node.equal = equals;
        }
        node.watched = options[Signal2.subtle.watched];
        node.unwatched = options[Signal2.subtle.unwatched];
      }
    }
    get() {
      if (!(0, Signal2.isComputed)(this))
        throw new TypeError("Wrong receiver type for Signal.Computed.prototype.get");
      return computedGet(this[NODE]);
    }
  }
  _b = NODE;
  _brand2 = /* @__PURE__ */ new WeakSet();
  Signal2.isComputed = (c2) => typeof c2 === "object" && __privateIn(_brand2, c2);
  Signal2.Computed = Computed;
  ((subtle2) => {
    var _a2, _brand3, _assertSignals, assertSignals_fn;
    function untrack(cb) {
      let output;
      let prevActiveConsumer = null;
      try {
        prevActiveConsumer = setActiveConsumer(null);
        output = cb();
      } finally {
        setActiveConsumer(prevActiveConsumer);
      }
      return output;
    }
    subtle2.untrack = untrack;
    function introspectSources(sink) {
      var _a3;
      if (!(0, Signal2.isComputed)(sink) && !(0, Signal2.isWatcher)(sink)) {
        throw new TypeError("Called introspectSources without a Computed or Watcher argument");
      }
      return ((_a3 = sink[NODE].producerNode) == null ? void 0 : _a3.map((n2) => n2.wrapper)) ?? [];
    }
    subtle2.introspectSources = introspectSources;
    function introspectSinks(signal) {
      var _a3;
      if (!(0, Signal2.isComputed)(signal) && !(0, Signal2.isState)(signal)) {
        throw new TypeError("Called introspectSinks without a Signal argument");
      }
      return ((_a3 = signal[NODE].liveConsumerNode) == null ? void 0 : _a3.map((n2) => n2.wrapper)) ?? [];
    }
    subtle2.introspectSinks = introspectSinks;
    function hasSinks(signal) {
      if (!(0, Signal2.isComputed)(signal) && !(0, Signal2.isState)(signal)) {
        throw new TypeError("Called hasSinks without a Signal argument");
      }
      const liveConsumerNode = signal[NODE].liveConsumerNode;
      if (!liveConsumerNode)
        return false;
      return liveConsumerNode.length > 0;
    }
    subtle2.hasSinks = hasSinks;
    function hasSources(signal) {
      if (!(0, Signal2.isComputed)(signal) && !(0, Signal2.isWatcher)(signal)) {
        throw new TypeError("Called hasSources without a Computed or Watcher argument");
      }
      const producerNode = signal[NODE].producerNode;
      if (!producerNode)
        return false;
      return producerNode.length > 0;
    }
    subtle2.hasSources = hasSources;
    class Watcher {
      // When a (recursive) source of Watcher is written to, call this callback,
      // if it hasn't already been called since the last `watch` call.
      // No signals may be read or written during the notify.
      constructor(notify) {
        __privateAdd(this, _brand3);
        __privateAdd(this, _assertSignals);
        __publicField2(this, _a2);
        let node = Object.create(REACTIVE_NODE);
        node.wrapper = this;
        node.consumerMarkedDirty = notify;
        node.consumerIsAlwaysLive = true;
        node.consumerAllowSignalWrites = false;
        node.producerNode = [];
        this[NODE] = node;
      }
      // Add these signals to the Watcher's set, and set the watcher to run its
      // notify callback next time any signal in the set (or one of its dependencies) changes.
      // Can be called with no arguments just to reset the "notified" state, so that
      // the notify callback will be invoked again.
      watch(...signals) {
        if (!(0, Signal2.isWatcher)(this)) {
          throw new TypeError("Called unwatch without Watcher receiver");
        }
        __privateMethod(this, _assertSignals, assertSignals_fn).call(this, signals);
        const node = this[NODE];
        node.dirty = false;
        const prev = setActiveConsumer(node);
        for (const signal of signals) {
          producerAccessed(signal[NODE]);
        }
        setActiveConsumer(prev);
      }
      // Remove these signals from the watched set (e.g., for an effect which is disposed)
      unwatch(...signals) {
        if (!(0, Signal2.isWatcher)(this)) {
          throw new TypeError("Called unwatch without Watcher receiver");
        }
        __privateMethod(this, _assertSignals, assertSignals_fn).call(this, signals);
        const node = this[NODE];
        assertConsumerNode(node);
        for (let i2 = node.producerNode.length - 1; i2 >= 0; i2--) {
          if (signals.includes(node.producerNode[i2].wrapper)) {
            producerRemoveLiveConsumerAtIndex(node.producerNode[i2], node.producerIndexOfThis[i2]);
            const lastIdx = node.producerNode.length - 1;
            node.producerNode[i2] = node.producerNode[lastIdx];
            node.producerIndexOfThis[i2] = node.producerIndexOfThis[lastIdx];
            node.producerNode.length--;
            node.producerIndexOfThis.length--;
            node.nextProducerIndex--;
            if (i2 < node.producerNode.length) {
              const idxConsumer = node.producerIndexOfThis[i2];
              const producer = node.producerNode[i2];
              assertProducerNode(producer);
              producer.liveConsumerIndexOfThis[idxConsumer] = i2;
            }
          }
        }
      }
      // Returns the set of computeds in the Watcher's set which are still yet
      // to be re-evaluated
      getPending() {
        if (!(0, Signal2.isWatcher)(this)) {
          throw new TypeError("Called getPending without Watcher receiver");
        }
        const node = this[NODE];
        return node.producerNode.filter((n2) => n2.dirty).map((n2) => n2.wrapper);
      }
    }
    _a2 = NODE;
    _brand3 = /* @__PURE__ */ new WeakSet();
    _assertSignals = /* @__PURE__ */ new WeakSet();
    assertSignals_fn = function(signals) {
      for (const signal of signals) {
        if (!(0, Signal2.isComputed)(signal) && !(0, Signal2.isState)(signal)) {
          throw new TypeError("Called watch/unwatch without a Computed or State argument");
        }
      }
    };
    Signal2.isWatcher = (w2) => __privateIn(_brand3, w2);
    subtle2.Watcher = Watcher;
    function currentComputed() {
      var _a3;
      return (_a3 = getActiveConsumer()) == null ? void 0 : _a3.wrapper;
    }
    subtle2.currentComputed = currentComputed;
    subtle2.watched = Symbol("watched");
    subtle2.unwatched = Symbol("unwatched");
  })(Signal2.subtle || (Signal2.subtle = {}));
})(Signal || (Signal = {}));
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const i$2 = Symbol("SignalWatcherBrand"), s$3 = new FinalizationRegistry(({ watcher: t3, signal: i2 }) => {
  t3.unwatch(i2);
}), h$2 = /* @__PURE__ */ new WeakMap();
function e$2(e2) {
  return true === e2[i$2] ? (console.warn("SignalWatcher should not be applied to the same class more than once."), e2) : class extends e2 {
    constructor() {
      super(...arguments), this._$St = new Signal.State(0), this._$Si = false, this._$So = true, this._$Sh = /* @__PURE__ */ new Set();
    }
    _$Sl() {
      if (void 0 !== this._$Su) return;
      this._$Sv = new Signal.Computed(() => {
        this._$St.get(), super.performUpdate();
      });
      const i2 = this._$Su = new Signal.subtle.Watcher(function() {
        const t3 = h$2.get(this);
        void 0 !== t3 && (false === t3._$Si && t3.requestUpdate(), this.watch());
      });
      h$2.set(i2, this), s$3.register(this, { watcher: i2, signal: this._$Sv }), i2.watch(this._$Sv);
    }
    _$Sp() {
      void 0 !== this._$Su && (this._$Su.unwatch(this._$Sv), this._$Sv = void 0, this._$Su = void 0);
    }
    performUpdate() {
      this.isUpdatePending && (this._$Sl(), this._$Si = true, this._$St.set(this._$St.get() + 1), this._$Si = false, this._$Sv.get());
    }
    update(t3) {
      try {
        this._$So ? (this._$So = false, super.update(t3)) : this._$Sh.forEach((t4) => t4.commit());
      } finally {
        this.isUpdatePending = false, this._$Sh.clear();
      }
    }
    requestUpdate(t3, i2, s2) {
      this._$So = true, super.requestUpdate(t3, i2, s2);
    }
    connectedCallback() {
      super.connectedCallback(), this.requestUpdate();
    }
    disconnectedCallback() {
      super.disconnectedCallback(), queueMicrotask(() => {
        false === this.isConnected && this._$Sp();
      });
    }
    _(t3) {
      this._$Sh.add(t3);
      const i2 = this._$So;
      this.requestUpdate(), this._$So = i2;
    }
    m(t3) {
      this._$Sh.delete(t3);
    }
  };
}
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let h$1 = class h extends AsyncDirective {
  _$Sl() {
    if (void 0 !== this._$Su) return;
    this._$SW = new Signal.Computed(() => {
      var i3;
      return null === (i3 = this._$Sj) || void 0 === i3 ? void 0 : i3.get();
    });
    const i2 = this._$Su = new Signal.subtle.Watcher(() => {
      var t3;
      null === (t3 = this._$SO) || void 0 === t3 || t3._(this), i2.watch();
    });
    i2.watch(this._$SW);
  }
  _$Sp() {
    var i2;
    void 0 !== this._$Su && (this._$Su.unwatch(this._$SW), this._$SW = void 0, this._$Su = void 0, null === (i2 = this._$SO) || void 0 === i2 || i2.m(this));
  }
  commit() {
    this.setValue(Signal.subtle.untrack(() => {
      var i2;
      return null === (i2 = this._$SW) || void 0 === i2 ? void 0 : i2.get();
    }));
  }
  render(i2) {
    return Signal.subtle.untrack(() => i2.get());
  }
  update(i2, [t3]) {
    var h3, o2;
    return null !== (h3 = this._$SO) && void 0 !== h3 || (this._$SO = null === (o2 = i2.options) || void 0 === o2 ? void 0 : o2.host), t3 !== this._$Sj && void 0 !== this._$Sj && this._$Sp(), this._$Sj = t3, this._$Sl(), Signal.subtle.untrack(() => this._$SW.get());
  }
  disconnected() {
    this._$Sp();
  }
  reconnected() {
    this._$Sl();
  }
};
directive(h$1);
/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
Signal.State;
Signal.Computed;
const r$2 = (l2, o2) => new Signal.State(l2, o2);
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const isStrTagged = (val) => typeof val !== "string" && "strTag" in val;
const joinStringsAndValues = (strings, values, valueOrder) => {
  let concat = strings[0];
  for (let i2 = 1; i2 < strings.length; i2++) {
    concat += values[valueOrder ? valueOrder[i2 - 1] : i2 - 1];
    concat += strings[i2];
  }
  return concat;
};
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const defaultMsg = (template) => isStrTagged(template) ? joinStringsAndValues(template.strings, template.values) : template;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const LOCALE_STATUS_EVENT = "lit-localize-status";
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class LocalizeController {
  constructor(host) {
    this.__litLocalizeEventHandler = (event) => {
      if (event.detail.status === "ready") {
        this.host.requestUpdate();
      }
    };
    this.host = host;
  }
  hostConnected() {
    window.addEventListener(LOCALE_STATUS_EVENT, this.__litLocalizeEventHandler);
  }
  hostDisconnected() {
    window.removeEventListener(LOCALE_STATUS_EVENT, this.__litLocalizeEventHandler);
  }
}
const _updateWhenLocaleChanges = (host) => host.addController(new LocalizeController(host));
const updateWhenLocaleChanges = _updateWhenLocaleChanges;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const _localized = () => (classOrDescriptor) => typeof classOrDescriptor === "function" ? legacyLocalized(classOrDescriptor) : standardLocalized(classOrDescriptor);
const localized = _localized;
const standardLocalized = ({ kind, elements }) => {
  return {
    kind,
    elements,
    finisher(clazz) {
      clazz.addInitializer(updateWhenLocaleChanges);
    }
  };
};
const legacyLocalized = (clazz) => {
  clazz.addInitializer(updateWhenLocaleChanges);
  return clazz;
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class Deferred {
  constructor() {
    this.settled = false;
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }
  resolve(value) {
    this.settled = true;
    this._resolve(value);
  }
  reject(error) {
    this.settled = true;
    this._reject(error);
  }
}
/**
 * @license
 * Copyright 2014 Travis Webb
 * SPDX-License-Identifier: MIT
 */
const hl = [];
for (let i2 = 0; i2 < 256; i2++) {
  hl[i2] = (i2 >> 4 & 15).toString(16) + (i2 & 15).toString(16);
}
function fnv1a64(str) {
  let t0 = 0, v0 = 8997, t1 = 0, v1 = 33826, t22 = 0, v2 = 40164, t3 = 0, v3 = 52210;
  for (let i2 = 0; i2 < str.length; i2++) {
    v0 ^= str.charCodeAt(i2);
    t0 = v0 * 435;
    t1 = v1 * 435;
    t22 = v2 * 435;
    t3 = v3 * 435;
    t22 += v0 << 8;
    t3 += v1 << 8;
    t1 += t0 >>> 16;
    v0 = t0 & 65535;
    t22 += t1 >>> 16;
    v1 = t1 & 65535;
    v3 = t3 + (t22 >>> 16) & 65535;
    v2 = t22 & 65535;
  }
  return hl[v3 >> 8] + hl[v3 & 255] + hl[v2 >> 8] + hl[v2 & 255] + hl[v1 >> 8] + hl[v1 & 255] + hl[v0 >> 8] + hl[v0 & 255];
}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const HASH_DELIMITER = "";
const HTML_PREFIX = "h";
const STRING_PREFIX = "s";
function generateMsgId(strings, isHtmlTagged) {
  return (isHtmlTagged ? HTML_PREFIX : STRING_PREFIX) + fnv1a64(typeof strings === "string" ? strings : strings.join(HASH_DELIMITER));
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const expressionOrders = /* @__PURE__ */ new WeakMap();
const hashCache = /* @__PURE__ */ new Map();
function runtimeMsg(templates2, template, options) {
  var _a;
  if (templates2) {
    const id = (_a = options === null || options === void 0 ? void 0 : options.id) !== null && _a !== void 0 ? _a : generateId(template);
    const localized2 = templates2[id];
    if (localized2) {
      if (typeof localized2 === "string") {
        return localized2;
      } else if ("strTag" in localized2) {
        return joinStringsAndValues(
          localized2.strings,
          // Cast `template` because its type wasn't automatically narrowed (but
          // we know it must be the same type as `localized`).
          template.values,
          localized2.values
        );
      } else {
        let order = expressionOrders.get(localized2);
        if (order === void 0) {
          order = localized2.values;
          expressionOrders.set(localized2, order);
        }
        return {
          ...localized2,
          values: order.map((i2) => template.values[i2])
        };
      }
    }
  }
  return defaultMsg(template);
}
function generateId(template) {
  const strings = typeof template === "string" ? template : template.strings;
  let id = hashCache.get(strings);
  if (id === void 0) {
    id = generateMsgId(strings, typeof template !== "string" && !("strTag" in template));
    hashCache.set(strings, id);
  }
  return id;
}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function dispatchStatusEvent(detail) {
  window.dispatchEvent(new CustomEvent(LOCALE_STATUS_EVENT, { detail }));
}
let activeLocale = "";
let loadingLocale;
let sourceLocale$1;
let validLocales;
let loadLocale;
let templates;
let loading = new Deferred();
loading.resolve();
let requestId = 0;
const configureLocalization = (config) => {
  _installMsgImplementation((template, options) => runtimeMsg(templates, template, options));
  activeLocale = sourceLocale$1 = config.sourceLocale;
  validLocales = new Set(config.targetLocales);
  validLocales.add(config.sourceLocale);
  loadLocale = config.loadLocale;
  return { getLocale: getLocale$1, setLocale: setLocale$1 };
};
const getLocale$1 = () => {
  return activeLocale;
};
const setLocale$1 = (newLocale) => {
  if (newLocale === (loadingLocale !== null && loadingLocale !== void 0 ? loadingLocale : activeLocale)) {
    return loading.promise;
  }
  if (!validLocales || !loadLocale) {
    throw new Error("Internal error");
  }
  if (!validLocales.has(newLocale)) {
    throw new Error("Invalid locale code");
  }
  requestId++;
  const thisRequestId = requestId;
  loadingLocale = newLocale;
  if (loading.settled) {
    loading = new Deferred();
  }
  dispatchStatusEvent({ status: "loading", loadingLocale: newLocale });
  const localePromise = newLocale === sourceLocale$1 ? (
    // We could switch to the source locale synchronously, but we prefer to
    // queue it on a microtask so that switching locales is consistently
    // asynchronous.
    Promise.resolve({ templates: void 0 })
  ) : loadLocale(newLocale);
  localePromise.then((mod) => {
    if (requestId === thisRequestId) {
      activeLocale = newLocale;
      loadingLocale = void 0;
      templates = mod.templates;
      dispatchStatusEvent({ status: "ready", readyLocale: newLocale });
      loading.resolve();
    }
  }, (err) => {
    if (requestId === thisRequestId) {
      dispatchStatusEvent({
        status: "error",
        errorLocale: newLocale,
        errorMessage: err.toString()
      });
      loading.reject(err);
    }
  });
  return loading.promise;
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let msg = defaultMsg;
let installed = false;
function _installMsgImplementation(impl) {
  if (installed) {
    throw new Error("lit-localize can only be configured once");
  }
  msg = impl;
  installed = true;
}
class LuxonError extends Error {
}
class InvalidDateTimeError extends LuxonError {
  constructor(reason) {
    super(`Invalid DateTime: ${reason.toMessage()}`);
  }
}
class InvalidIntervalError extends LuxonError {
  constructor(reason) {
    super(`Invalid Interval: ${reason.toMessage()}`);
  }
}
class InvalidDurationError extends LuxonError {
  constructor(reason) {
    super(`Invalid Duration: ${reason.toMessage()}`);
  }
}
class ConflictingSpecificationError extends LuxonError {
}
class InvalidUnitError extends LuxonError {
  constructor(unit) {
    super(`Invalid unit ${unit}`);
  }
}
class InvalidArgumentError extends LuxonError {
}
class ZoneIsAbstractError extends LuxonError {
  constructor() {
    super("Zone is an abstract class");
  }
}
const n$2 = "numeric", s$2 = "short", l$2 = "long";
const DATE_SHORT = {
  year: n$2,
  month: n$2,
  day: n$2
};
const DATE_MED = {
  year: n$2,
  month: s$2,
  day: n$2
};
const DATE_MED_WITH_WEEKDAY = {
  year: n$2,
  month: s$2,
  day: n$2,
  weekday: s$2
};
const DATE_FULL = {
  year: n$2,
  month: l$2,
  day: n$2
};
const DATE_HUGE = {
  year: n$2,
  month: l$2,
  day: n$2,
  weekday: l$2
};
const TIME_SIMPLE = {
  hour: n$2,
  minute: n$2
};
const TIME_WITH_SECONDS = {
  hour: n$2,
  minute: n$2,
  second: n$2
};
const TIME_WITH_SHORT_OFFSET = {
  hour: n$2,
  minute: n$2,
  second: n$2,
  timeZoneName: s$2
};
const TIME_WITH_LONG_OFFSET = {
  hour: n$2,
  minute: n$2,
  second: n$2,
  timeZoneName: l$2
};
const TIME_24_SIMPLE = {
  hour: n$2,
  minute: n$2,
  hourCycle: "h23"
};
const TIME_24_WITH_SECONDS = {
  hour: n$2,
  minute: n$2,
  second: n$2,
  hourCycle: "h23"
};
const TIME_24_WITH_SHORT_OFFSET = {
  hour: n$2,
  minute: n$2,
  second: n$2,
  hourCycle: "h23",
  timeZoneName: s$2
};
const TIME_24_WITH_LONG_OFFSET = {
  hour: n$2,
  minute: n$2,
  second: n$2,
  hourCycle: "h23",
  timeZoneName: l$2
};
const DATETIME_SHORT = {
  year: n$2,
  month: n$2,
  day: n$2,
  hour: n$2,
  minute: n$2
};
const DATETIME_SHORT_WITH_SECONDS = {
  year: n$2,
  month: n$2,
  day: n$2,
  hour: n$2,
  minute: n$2,
  second: n$2
};
const DATETIME_MED = {
  year: n$2,
  month: s$2,
  day: n$2,
  hour: n$2,
  minute: n$2
};
const DATETIME_MED_WITH_SECONDS = {
  year: n$2,
  month: s$2,
  day: n$2,
  hour: n$2,
  minute: n$2,
  second: n$2
};
const DATETIME_MED_WITH_WEEKDAY = {
  year: n$2,
  month: s$2,
  day: n$2,
  weekday: s$2,
  hour: n$2,
  minute: n$2
};
const DATETIME_FULL = {
  year: n$2,
  month: l$2,
  day: n$2,
  hour: n$2,
  minute: n$2,
  timeZoneName: s$2
};
const DATETIME_FULL_WITH_SECONDS = {
  year: n$2,
  month: l$2,
  day: n$2,
  hour: n$2,
  minute: n$2,
  second: n$2,
  timeZoneName: s$2
};
const DATETIME_HUGE = {
  year: n$2,
  month: l$2,
  day: n$2,
  weekday: l$2,
  hour: n$2,
  minute: n$2,
  timeZoneName: l$2
};
const DATETIME_HUGE_WITH_SECONDS = {
  year: n$2,
  month: l$2,
  day: n$2,
  weekday: l$2,
  hour: n$2,
  minute: n$2,
  second: n$2,
  timeZoneName: l$2
};
class Zone {
  /**
   * The type of zone
   * @abstract
   * @type {string}
   */
  get type() {
    throw new ZoneIsAbstractError();
  }
  /**
   * The name of this zone.
   * @abstract
   * @type {string}
   */
  get name() {
    throw new ZoneIsAbstractError();
  }
  /**
   * The IANA name of this zone.
   * Defaults to `name` if not overwritten by a subclass.
   * @abstract
   * @type {string}
   */
  get ianaName() {
    return this.name;
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year.
   * @abstract
   * @type {boolean}
   */
  get isUniversal() {
    throw new ZoneIsAbstractError();
  }
  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */
  offsetName(ts, opts) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Returns the offset's value as a string
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts, format) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @abstract
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(ts) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Return whether this Zone is equal to another zone
   * @abstract
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    throw new ZoneIsAbstractError();
  }
  /**
   * Return whether this Zone is valid.
   * @abstract
   * @type {boolean}
   */
  get isValid() {
    throw new ZoneIsAbstractError();
  }
}
let singleton$1 = null;
class SystemZone extends Zone {
  /**
   * Get a singleton instance of the local zone
   * @return {SystemZone}
   */
  static get instance() {
    if (singleton$1 === null) {
      singleton$1 = new SystemZone();
    }
    return singleton$1;
  }
  /** @override **/
  get type() {
    return "system";
  }
  /** @override **/
  get name() {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  /** @override **/
  get isUniversal() {
    return false;
  }
  /** @override **/
  offsetName(ts, { format, locale }) {
    return parseZoneInfo(ts, format, locale);
  }
  /** @override **/
  formatOffset(ts, format) {
    return formatOffset(this.offset(ts), format);
  }
  /** @override **/
  offset(ts) {
    return -new Date(ts).getTimezoneOffset();
  }
  /** @override **/
  equals(otherZone) {
    return otherZone.type === "system";
  }
  /** @override **/
  get isValid() {
    return true;
  }
}
const dtfCache = /* @__PURE__ */ new Map();
function makeDTF(zoneName) {
  let dtf = dtfCache.get(zoneName);
  if (dtf === void 0) {
    dtf = new Intl.DateTimeFormat("en-US", {
      hour12: false,
      timeZone: zoneName,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      era: "short"
    });
    dtfCache.set(zoneName, dtf);
  }
  return dtf;
}
const typeToPos = {
  year: 0,
  month: 1,
  day: 2,
  era: 3,
  hour: 4,
  minute: 5,
  second: 6
};
function hackyOffset(dtf, date) {
  const formatted = dtf.format(date).replace(/\u200E/g, ""), parsed = /(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(formatted), [, fMonth, fDay, fYear, fadOrBc, fHour, fMinute, fSecond] = parsed;
  return [fYear, fMonth, fDay, fadOrBc, fHour, fMinute, fSecond];
}
function partsOffset(dtf, date) {
  const formatted = dtf.formatToParts(date);
  const filled = [];
  for (let i2 = 0; i2 < formatted.length; i2++) {
    const { type, value } = formatted[i2];
    const pos = typeToPos[type];
    if (type === "era") {
      filled[pos] = value;
    } else if (!isUndefined(pos)) {
      filled[pos] = parseInt(value, 10);
    }
  }
  return filled;
}
const ianaZoneCache = /* @__PURE__ */ new Map();
class IANAZone extends Zone {
  /**
   * @param {string} name - Zone name
   * @return {IANAZone}
   */
  static create(name) {
    let zone = ianaZoneCache.get(name);
    if (zone === void 0) {
      ianaZoneCache.set(name, zone = new IANAZone(name));
    }
    return zone;
  }
  /**
   * Reset local caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCache() {
    ianaZoneCache.clear();
    dtfCache.clear();
  }
  /**
   * Returns whether the provided string is a valid specifier. This only checks the string's format, not that the specifier identifies a known zone; see isValidZone for that.
   * @param {string} s - The string to check validity on
   * @example IANAZone.isValidSpecifier("America/New_York") //=> true
   * @example IANAZone.isValidSpecifier("Sport~~blorp") //=> false
   * @deprecated For backward compatibility, this forwards to isValidZone, better use `isValidZone()` directly instead.
   * @return {boolean}
   */
  static isValidSpecifier(s2) {
    return this.isValidZone(s2);
  }
  /**
   * Returns whether the provided string identifies a real zone
   * @param {string} zone - The string to check
   * @example IANAZone.isValidZone("America/New_York") //=> true
   * @example IANAZone.isValidZone("Fantasia/Castle") //=> false
   * @example IANAZone.isValidZone("Sport~~blorp") //=> false
   * @return {boolean}
   */
  static isValidZone(zone) {
    if (!zone) {
      return false;
    }
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
      return true;
    } catch (e2) {
      return false;
    }
  }
  constructor(name) {
    super();
    this.zoneName = name;
    this.valid = IANAZone.isValidZone(name);
  }
  /**
   * The type of zone. `iana` for all instances of `IANAZone`.
   * @override
   * @type {string}
   */
  get type() {
    return "iana";
  }
  /**
   * The name of this zone (i.e. the IANA zone name).
   * @override
   * @type {string}
   */
  get name() {
    return this.zoneName;
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns false for all IANA zones.
   * @override
   * @type {boolean}
   */
  get isUniversal() {
    return false;
  }
  /**
   * Returns the offset's common name (such as EST) at the specified timestamp
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the name
   * @param {Object} opts - Options to affect the format
   * @param {string} opts.format - What style of offset to return. Accepts 'long' or 'short'.
   * @param {string} opts.locale - What locale to return the offset name in.
   * @return {string}
   */
  offsetName(ts, { format, locale }) {
    return parseZoneInfo(ts, format, locale, this.name);
  }
  /**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts, format) {
    return formatOffset(this.offset(ts), format);
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   * @override
   * @param {number} ts - Epoch milliseconds for which to compute the offset
   * @return {number}
   */
  offset(ts) {
    if (!this.valid) return NaN;
    const date = new Date(ts);
    if (isNaN(date)) return NaN;
    const dtf = makeDTF(this.name);
    let [year, month, day, adOrBc, hour, minute, second] = dtf.formatToParts ? partsOffset(dtf, date) : hackyOffset(dtf, date);
    if (adOrBc === "BC") {
      year = -Math.abs(year) + 1;
    }
    const adjustedHour = hour === 24 ? 0 : hour;
    const asUTC = objToLocalTS({
      year,
      month,
      day,
      hour: adjustedHour,
      minute,
      second,
      millisecond: 0
    });
    let asTS = +date;
    const over = asTS % 1e3;
    asTS -= over >= 0 ? over : 1e3 + over;
    return (asUTC - asTS) / (60 * 1e3);
  }
  /**
   * Return whether this Zone is equal to another zone
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    return otherZone.type === "iana" && otherZone.name === this.name;
  }
  /**
   * Return whether this Zone is valid.
   * @override
   * @type {boolean}
   */
  get isValid() {
    return this.valid;
  }
}
let intlLFCache = {};
function getCachedLF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let dtf = intlLFCache[key];
  if (!dtf) {
    dtf = new Intl.ListFormat(locString, opts);
    intlLFCache[key] = dtf;
  }
  return dtf;
}
const intlDTCache = /* @__PURE__ */ new Map();
function getCachedDTF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let dtf = intlDTCache.get(key);
  if (dtf === void 0) {
    dtf = new Intl.DateTimeFormat(locString, opts);
    intlDTCache.set(key, dtf);
  }
  return dtf;
}
const intlNumCache = /* @__PURE__ */ new Map();
function getCachedINF(locString, opts = {}) {
  const key = JSON.stringify([locString, opts]);
  let inf = intlNumCache.get(key);
  if (inf === void 0) {
    inf = new Intl.NumberFormat(locString, opts);
    intlNumCache.set(key, inf);
  }
  return inf;
}
const intlRelCache = /* @__PURE__ */ new Map();
function getCachedRTF(locString, opts = {}) {
  const { base, ...cacheKeyOpts } = opts;
  const key = JSON.stringify([locString, cacheKeyOpts]);
  let inf = intlRelCache.get(key);
  if (inf === void 0) {
    inf = new Intl.RelativeTimeFormat(locString, opts);
    intlRelCache.set(key, inf);
  }
  return inf;
}
let sysLocaleCache = null;
function systemLocale() {
  if (sysLocaleCache) {
    return sysLocaleCache;
  } else {
    sysLocaleCache = new Intl.DateTimeFormat().resolvedOptions().locale;
    return sysLocaleCache;
  }
}
const intlResolvedOptionsCache = /* @__PURE__ */ new Map();
function getCachedIntResolvedOptions(locString) {
  let opts = intlResolvedOptionsCache.get(locString);
  if (opts === void 0) {
    opts = new Intl.DateTimeFormat(locString).resolvedOptions();
    intlResolvedOptionsCache.set(locString, opts);
  }
  return opts;
}
const weekInfoCache = /* @__PURE__ */ new Map();
function getCachedWeekInfo(locString) {
  let data = weekInfoCache.get(locString);
  if (!data) {
    const locale = new Intl.Locale(locString);
    data = "getWeekInfo" in locale ? locale.getWeekInfo() : locale.weekInfo;
    if (!("minimalDays" in data)) {
      data = { ...fallbackWeekSettings, ...data };
    }
    weekInfoCache.set(locString, data);
  }
  return data;
}
function parseLocaleString(localeStr) {
  const xIndex = localeStr.indexOf("-x-");
  if (xIndex !== -1) {
    localeStr = localeStr.substring(0, xIndex);
  }
  const uIndex = localeStr.indexOf("-u-");
  if (uIndex === -1) {
    return [localeStr];
  } else {
    let options;
    let selectedStr;
    try {
      options = getCachedDTF(localeStr).resolvedOptions();
      selectedStr = localeStr;
    } catch (e2) {
      const smaller = localeStr.substring(0, uIndex);
      options = getCachedDTF(smaller).resolvedOptions();
      selectedStr = smaller;
    }
    const { numberingSystem, calendar } = options;
    return [selectedStr, numberingSystem, calendar];
  }
}
function intlConfigString(localeStr, numberingSystem, outputCalendar) {
  if (outputCalendar || numberingSystem) {
    if (!localeStr.includes("-u-")) {
      localeStr += "-u";
    }
    if (outputCalendar) {
      localeStr += `-ca-${outputCalendar}`;
    }
    if (numberingSystem) {
      localeStr += `-nu-${numberingSystem}`;
    }
    return localeStr;
  } else {
    return localeStr;
  }
}
function mapMonths(f) {
  const ms = [];
  for (let i2 = 1; i2 <= 12; i2++) {
    const dt = DateTime.utc(2009, i2, 1);
    ms.push(f(dt));
  }
  return ms;
}
function mapWeekdays(f) {
  const ms = [];
  for (let i2 = 1; i2 <= 7; i2++) {
    const dt = DateTime.utc(2016, 11, 13 + i2);
    ms.push(f(dt));
  }
  return ms;
}
function listStuff(loc, length, englishFn, intlFn) {
  const mode = loc.listingMode();
  if (mode === "error") {
    return null;
  } else if (mode === "en") {
    return englishFn(length);
  } else {
    return intlFn(length);
  }
}
function supportsFastNumbers(loc) {
  if (loc.numberingSystem && loc.numberingSystem !== "latn") {
    return false;
  } else {
    return loc.numberingSystem === "latn" || !loc.locale || loc.locale.startsWith("en") || getCachedIntResolvedOptions(loc.locale).numberingSystem === "latn";
  }
}
class PolyNumberFormatter {
  constructor(intl, forceSimple, opts) {
    this.padTo = opts.padTo || 0;
    this.floor = opts.floor || false;
    const { padTo, floor, ...otherOpts } = opts;
    if (!forceSimple || Object.keys(otherOpts).length > 0) {
      const intlOpts = { useGrouping: false, ...opts };
      if (opts.padTo > 0) intlOpts.minimumIntegerDigits = opts.padTo;
      this.inf = getCachedINF(intl, intlOpts);
    }
  }
  format(i2) {
    if (this.inf) {
      const fixed = this.floor ? Math.floor(i2) : i2;
      return this.inf.format(fixed);
    } else {
      const fixed = this.floor ? Math.floor(i2) : roundTo(i2, 3);
      return padStart(fixed, this.padTo);
    }
  }
}
class PolyDateFormatter {
  constructor(dt, intl, opts) {
    this.opts = opts;
    this.originalZone = void 0;
    let z2 = void 0;
    if (this.opts.timeZone) {
      this.dt = dt;
    } else if (dt.zone.type === "fixed") {
      const gmtOffset = -1 * (dt.offset / 60);
      const offsetZ = gmtOffset >= 0 ? `Etc/GMT+${gmtOffset}` : `Etc/GMT${gmtOffset}`;
      if (dt.offset !== 0 && IANAZone.create(offsetZ).valid) {
        z2 = offsetZ;
        this.dt = dt;
      } else {
        z2 = "UTC";
        this.dt = dt.offset === 0 ? dt : dt.setZone("UTC").plus({ minutes: dt.offset });
        this.originalZone = dt.zone;
      }
    } else if (dt.zone.type === "system") {
      this.dt = dt;
    } else if (dt.zone.type === "iana") {
      this.dt = dt;
      z2 = dt.zone.name;
    } else {
      z2 = "UTC";
      this.dt = dt.setZone("UTC").plus({ minutes: dt.offset });
      this.originalZone = dt.zone;
    }
    const intlOpts = { ...this.opts };
    intlOpts.timeZone = intlOpts.timeZone || z2;
    this.dtf = getCachedDTF(intl, intlOpts);
  }
  format() {
    if (this.originalZone) {
      return this.formatToParts().map(({ value }) => value).join("");
    }
    return this.dtf.format(this.dt.toJSDate());
  }
  formatToParts() {
    const parts = this.dtf.formatToParts(this.dt.toJSDate());
    if (this.originalZone) {
      return parts.map((part) => {
        if (part.type === "timeZoneName") {
          const offsetName = this.originalZone.offsetName(this.dt.ts, {
            locale: this.dt.locale,
            format: this.opts.timeZoneName
          });
          return {
            ...part,
            value: offsetName
          };
        } else {
          return part;
        }
      });
    }
    return parts;
  }
  resolvedOptions() {
    return this.dtf.resolvedOptions();
  }
}
class PolyRelFormatter {
  constructor(intl, isEnglish, opts) {
    this.opts = { style: "long", ...opts };
    if (!isEnglish && hasRelative()) {
      this.rtf = getCachedRTF(intl, opts);
    }
  }
  format(count, unit) {
    if (this.rtf) {
      return this.rtf.format(count, unit);
    } else {
      return formatRelativeTime(unit, count, this.opts.numeric, this.opts.style !== "long");
    }
  }
  formatToParts(count, unit) {
    if (this.rtf) {
      return this.rtf.formatToParts(count, unit);
    } else {
      return [];
    }
  }
}
const fallbackWeekSettings = {
  firstDay: 1,
  minimalDays: 4,
  weekend: [6, 7]
};
class Locale {
  static fromOpts(opts) {
    return Locale.create(
      opts.locale,
      opts.numberingSystem,
      opts.outputCalendar,
      opts.weekSettings,
      opts.defaultToEN
    );
  }
  static create(locale, numberingSystem, outputCalendar, weekSettings, defaultToEN = false) {
    const specifiedLocale = locale || Settings.defaultLocale;
    const localeR = specifiedLocale || (defaultToEN ? "en-US" : systemLocale());
    const numberingSystemR = numberingSystem || Settings.defaultNumberingSystem;
    const outputCalendarR = outputCalendar || Settings.defaultOutputCalendar;
    const weekSettingsR = validateWeekSettings(weekSettings) || Settings.defaultWeekSettings;
    return new Locale(localeR, numberingSystemR, outputCalendarR, weekSettingsR, specifiedLocale);
  }
  static resetCache() {
    sysLocaleCache = null;
    intlDTCache.clear();
    intlNumCache.clear();
    intlRelCache.clear();
    intlResolvedOptionsCache.clear();
    weekInfoCache.clear();
  }
  static fromObject({ locale, numberingSystem, outputCalendar, weekSettings } = {}) {
    return Locale.create(locale, numberingSystem, outputCalendar, weekSettings);
  }
  constructor(locale, numbering, outputCalendar, weekSettings, specifiedLocale) {
    const [parsedLocale, parsedNumberingSystem, parsedOutputCalendar] = parseLocaleString(locale);
    this.locale = parsedLocale;
    this.numberingSystem = numbering || parsedNumberingSystem || null;
    this.outputCalendar = outputCalendar || parsedOutputCalendar || null;
    this.weekSettings = weekSettings;
    this.intl = intlConfigString(this.locale, this.numberingSystem, this.outputCalendar);
    this.weekdaysCache = { format: {}, standalone: {} };
    this.monthsCache = { format: {}, standalone: {} };
    this.meridiemCache = null;
    this.eraCache = {};
    this.specifiedLocale = specifiedLocale;
    this.fastNumbersCached = null;
  }
  get fastNumbers() {
    if (this.fastNumbersCached == null) {
      this.fastNumbersCached = supportsFastNumbers(this);
    }
    return this.fastNumbersCached;
  }
  listingMode() {
    const isActuallyEn = this.isEnglish();
    const hasNoWeirdness = (this.numberingSystem === null || this.numberingSystem === "latn") && (this.outputCalendar === null || this.outputCalendar === "gregory");
    return isActuallyEn && hasNoWeirdness ? "en" : "intl";
  }
  clone(alts) {
    if (!alts || Object.getOwnPropertyNames(alts).length === 0) {
      return this;
    } else {
      return Locale.create(
        alts.locale || this.specifiedLocale,
        alts.numberingSystem || this.numberingSystem,
        alts.outputCalendar || this.outputCalendar,
        validateWeekSettings(alts.weekSettings) || this.weekSettings,
        alts.defaultToEN || false
      );
    }
  }
  redefaultToEN(alts = {}) {
    return this.clone({ ...alts, defaultToEN: true });
  }
  redefaultToSystem(alts = {}) {
    return this.clone({ ...alts, defaultToEN: false });
  }
  months(length, format = false) {
    return listStuff(this, length, months, () => {
      const monthSpecialCase = this.intl === "ja" || this.intl.startsWith("ja-");
      format &= !monthSpecialCase;
      const intl = format ? { month: length, day: "numeric" } : { month: length }, formatStr = format ? "format" : "standalone";
      if (!this.monthsCache[formatStr][length]) {
        const mapper = !monthSpecialCase ? (dt) => this.extract(dt, intl, "month") : (dt) => this.dtFormatter(dt, intl).format();
        this.monthsCache[formatStr][length] = mapMonths(mapper);
      }
      return this.monthsCache[formatStr][length];
    });
  }
  weekdays(length, format = false) {
    return listStuff(this, length, weekdays, () => {
      const intl = format ? { weekday: length, year: "numeric", month: "long", day: "numeric" } : { weekday: length }, formatStr = format ? "format" : "standalone";
      if (!this.weekdaysCache[formatStr][length]) {
        this.weekdaysCache[formatStr][length] = mapWeekdays(
          (dt) => this.extract(dt, intl, "weekday")
        );
      }
      return this.weekdaysCache[formatStr][length];
    });
  }
  meridiems() {
    return listStuff(
      this,
      void 0,
      () => meridiems,
      () => {
        if (!this.meridiemCache) {
          const intl = { hour: "numeric", hourCycle: "h12" };
          this.meridiemCache = [DateTime.utc(2016, 11, 13, 9), DateTime.utc(2016, 11, 13, 19)].map(
            (dt) => this.extract(dt, intl, "dayperiod")
          );
        }
        return this.meridiemCache;
      }
    );
  }
  eras(length) {
    return listStuff(this, length, eras, () => {
      const intl = { era: length };
      if (!this.eraCache[length]) {
        this.eraCache[length] = [DateTime.utc(-40, 1, 1), DateTime.utc(2017, 1, 1)].map(
          (dt) => this.extract(dt, intl, "era")
        );
      }
      return this.eraCache[length];
    });
  }
  extract(dt, intlOpts, field) {
    const df = this.dtFormatter(dt, intlOpts), results = df.formatToParts(), matching = results.find((m2) => m2.type.toLowerCase() === field);
    return matching ? matching.value : null;
  }
  numberFormatter(opts = {}) {
    return new PolyNumberFormatter(this.intl, opts.forceSimple || this.fastNumbers, opts);
  }
  dtFormatter(dt, intlOpts = {}) {
    return new PolyDateFormatter(dt, this.intl, intlOpts);
  }
  relFormatter(opts = {}) {
    return new PolyRelFormatter(this.intl, this.isEnglish(), opts);
  }
  listFormatter(opts = {}) {
    return getCachedLF(this.intl, opts);
  }
  isEnglish() {
    return this.locale === "en" || this.locale.toLowerCase() === "en-us" || getCachedIntResolvedOptions(this.intl).locale.startsWith("en-us");
  }
  getWeekSettings() {
    if (this.weekSettings) {
      return this.weekSettings;
    } else if (!hasLocaleWeekInfo()) {
      return fallbackWeekSettings;
    } else {
      return getCachedWeekInfo(this.locale);
    }
  }
  getStartOfWeek() {
    return this.getWeekSettings().firstDay;
  }
  getMinDaysInFirstWeek() {
    return this.getWeekSettings().minimalDays;
  }
  getWeekendDays() {
    return this.getWeekSettings().weekend;
  }
  equals(other) {
    return this.locale === other.locale && this.numberingSystem === other.numberingSystem && this.outputCalendar === other.outputCalendar;
  }
  toString() {
    return `Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`;
  }
}
let singleton = null;
class FixedOffsetZone extends Zone {
  /**
   * Get a singleton instance of UTC
   * @return {FixedOffsetZone}
   */
  static get utcInstance() {
    if (singleton === null) {
      singleton = new FixedOffsetZone(0);
    }
    return singleton;
  }
  /**
   * Get an instance with a specified offset
   * @param {number} offset - The offset in minutes
   * @return {FixedOffsetZone}
   */
  static instance(offset2) {
    return offset2 === 0 ? FixedOffsetZone.utcInstance : new FixedOffsetZone(offset2);
  }
  /**
   * Get an instance of FixedOffsetZone from a UTC offset string, like "UTC+6"
   * @param {string} s - The offset string to parse
   * @example FixedOffsetZone.parseSpecifier("UTC+6")
   * @example FixedOffsetZone.parseSpecifier("UTC+06")
   * @example FixedOffsetZone.parseSpecifier("UTC-6:00")
   * @return {FixedOffsetZone}
   */
  static parseSpecifier(s2) {
    if (s2) {
      const r2 = s2.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);
      if (r2) {
        return new FixedOffsetZone(signedOffset(r2[1], r2[2]));
      }
    }
    return null;
  }
  constructor(offset2) {
    super();
    this.fixed = offset2;
  }
  /**
   * The type of zone. `fixed` for all instances of `FixedOffsetZone`.
   * @override
   * @type {string}
   */
  get type() {
    return "fixed";
  }
  /**
   * The name of this zone.
   * All fixed zones' names always start with "UTC" (plus optional offset)
   * @override
   * @type {string}
   */
  get name() {
    return this.fixed === 0 ? "UTC" : `UTC${formatOffset(this.fixed, "narrow")}`;
  }
  /**
   * The IANA name of this zone, i.e. `Etc/UTC` or `Etc/GMT+/-nn`
   *
   * @override
   * @type {string}
   */
  get ianaName() {
    if (this.fixed === 0) {
      return "Etc/UTC";
    } else {
      return `Etc/GMT${formatOffset(-this.fixed, "narrow")}`;
    }
  }
  /**
   * Returns the offset's common name at the specified timestamp.
   *
   * For fixed offset zones this equals to the zone name.
   * @override
   */
  offsetName() {
    return this.name;
  }
  /**
   * Returns the offset's value as a string
   * @override
   * @param {number} ts - Epoch milliseconds for which to get the offset
   * @param {string} format - What style of offset to return.
   *                          Accepts 'narrow', 'short', or 'techie'. Returning '+6', '+06:00', or '+0600' respectively
   * @return {string}
   */
  formatOffset(ts, format) {
    return formatOffset(this.fixed, format);
  }
  /**
   * Returns whether the offset is known to be fixed for the whole year:
   * Always returns true for all fixed offset zones.
   * @override
   * @type {boolean}
   */
  get isUniversal() {
    return true;
  }
  /**
   * Return the offset in minutes for this zone at the specified timestamp.
   *
   * For fixed offset zones, this is constant and does not depend on a timestamp.
   * @override
   * @return {number}
   */
  offset() {
    return this.fixed;
  }
  /**
   * Return whether this Zone is equal to another zone (i.e. also fixed and same offset)
   * @override
   * @param {Zone} otherZone - the zone to compare
   * @return {boolean}
   */
  equals(otherZone) {
    return otherZone.type === "fixed" && otherZone.fixed === this.fixed;
  }
  /**
   * Return whether this Zone is valid:
   * All fixed offset zones are valid.
   * @override
   * @type {boolean}
   */
  get isValid() {
    return true;
  }
}
class InvalidZone extends Zone {
  constructor(zoneName) {
    super();
    this.zoneName = zoneName;
  }
  /** @override **/
  get type() {
    return "invalid";
  }
  /** @override **/
  get name() {
    return this.zoneName;
  }
  /** @override **/
  get isUniversal() {
    return false;
  }
  /** @override **/
  offsetName() {
    return null;
  }
  /** @override **/
  formatOffset() {
    return "";
  }
  /** @override **/
  offset() {
    return NaN;
  }
  /** @override **/
  equals() {
    return false;
  }
  /** @override **/
  get isValid() {
    return false;
  }
}
function normalizeZone(input, defaultZone2) {
  if (isUndefined(input) || input === null) {
    return defaultZone2;
  } else if (input instanceof Zone) {
    return input;
  } else if (isString$1(input)) {
    const lowered = input.toLowerCase();
    if (lowered === "default") return defaultZone2;
    else if (lowered === "local" || lowered === "system") return SystemZone.instance;
    else if (lowered === "utc" || lowered === "gmt") return FixedOffsetZone.utcInstance;
    else return FixedOffsetZone.parseSpecifier(lowered) || IANAZone.create(input);
  } else if (isNumber(input)) {
    return FixedOffsetZone.instance(input);
  } else if (typeof input === "object" && "offset" in input && typeof input.offset === "function") {
    return input;
  } else {
    return new InvalidZone(input);
  }
}
const numberingSystems = {
  arab: "[٠-٩]",
  arabext: "[۰-۹]",
  bali: "[᭐-᭙]",
  beng: "[০-৯]",
  deva: "[०-९]",
  fullwide: "[０-９]",
  gujr: "[૦-૯]",
  hanidec: "[〇|一|二|三|四|五|六|七|八|九]",
  khmr: "[០-៩]",
  knda: "[೦-೯]",
  laoo: "[໐-໙]",
  limb: "[᥆-᥏]",
  mlym: "[൦-൯]",
  mong: "[᠐-᠙]",
  mymr: "[၀-၉]",
  orya: "[୦-୯]",
  tamldec: "[௦-௯]",
  telu: "[౦-౯]",
  thai: "[๐-๙]",
  tibt: "[༠-༩]",
  latn: "\\d"
};
const numberingSystemsUTF16 = {
  arab: [1632, 1641],
  arabext: [1776, 1785],
  bali: [6992, 7001],
  beng: [2534, 2543],
  deva: [2406, 2415],
  fullwide: [65296, 65303],
  gujr: [2790, 2799],
  khmr: [6112, 6121],
  knda: [3302, 3311],
  laoo: [3792, 3801],
  limb: [6470, 6479],
  mlym: [3430, 3439],
  mong: [6160, 6169],
  mymr: [4160, 4169],
  orya: [2918, 2927],
  tamldec: [3046, 3055],
  telu: [3174, 3183],
  thai: [3664, 3673],
  tibt: [3872, 3881]
};
const hanidecChars = numberingSystems.hanidec.replace(/[\[|\]]/g, "").split("");
function parseDigits(str) {
  let value = parseInt(str, 10);
  if (isNaN(value)) {
    value = "";
    for (let i2 = 0; i2 < str.length; i2++) {
      const code = str.charCodeAt(i2);
      if (str[i2].search(numberingSystems.hanidec) !== -1) {
        value += hanidecChars.indexOf(str[i2]);
      } else {
        for (const key in numberingSystemsUTF16) {
          const [min, max] = numberingSystemsUTF16[key];
          if (code >= min && code <= max) {
            value += code - min;
          }
        }
      }
    }
    return parseInt(value, 10);
  } else {
    return value;
  }
}
const digitRegexCache = /* @__PURE__ */ new Map();
function resetDigitRegexCache() {
  digitRegexCache.clear();
}
function digitRegex({ numberingSystem }, append = "") {
  const ns = numberingSystem || "latn";
  let appendCache = digitRegexCache.get(ns);
  if (appendCache === void 0) {
    appendCache = /* @__PURE__ */ new Map();
    digitRegexCache.set(ns, appendCache);
  }
  let regex = appendCache.get(append);
  if (regex === void 0) {
    regex = new RegExp(`${numberingSystems[ns]}${append}`);
    appendCache.set(append, regex);
  }
  return regex;
}
let now = () => Date.now(), defaultZone = "system", defaultLocale = null, defaultNumberingSystem = null, defaultOutputCalendar = null, twoDigitCutoffYear = 60, throwOnInvalid, defaultWeekSettings = null;
class Settings {
  /**
   * Get the callback for returning the current timestamp.
   * @type {function}
   */
  static get now() {
    return now;
  }
  /**
   * Set the callback for returning the current timestamp.
   * The function should return a number, which will be interpreted as an Epoch millisecond count
   * @type {function}
   * @example Settings.now = () => Date.now() + 3000 // pretend it is 3 seconds in the future
   * @example Settings.now = () => 0 // always pretend it's Jan 1, 1970 at midnight in UTC time
   */
  static set now(n2) {
    now = n2;
  }
  /**
   * Set the default time zone to create DateTimes in. Does not affect existing instances.
   * Use the value "system" to reset this value to the system's time zone.
   * @type {string}
   */
  static set defaultZone(zone) {
    defaultZone = zone;
  }
  /**
   * Get the default time zone object currently used to create DateTimes. Does not affect existing instances.
   * The default value is the system's time zone (the one set on the machine that runs this code).
   * @type {Zone}
   */
  static get defaultZone() {
    return normalizeZone(defaultZone, SystemZone.instance);
  }
  /**
   * Get the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultLocale() {
    return defaultLocale;
  }
  /**
   * Set the default locale to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultLocale(locale) {
    defaultLocale = locale;
  }
  /**
   * Get the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultNumberingSystem() {
    return defaultNumberingSystem;
  }
  /**
   * Set the default numbering system to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultNumberingSystem(numberingSystem) {
    defaultNumberingSystem = numberingSystem;
  }
  /**
   * Get the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static get defaultOutputCalendar() {
    return defaultOutputCalendar;
  }
  /**
   * Set the default output calendar to create DateTimes with. Does not affect existing instances.
   * @type {string}
   */
  static set defaultOutputCalendar(outputCalendar) {
    defaultOutputCalendar = outputCalendar;
  }
  /**
   * @typedef {Object} WeekSettings
   * @property {number} firstDay
   * @property {number} minimalDays
   * @property {number[]} weekend
   */
  /**
   * @return {WeekSettings|null}
   */
  static get defaultWeekSettings() {
    return defaultWeekSettings;
  }
  /**
   * Allows overriding the default locale week settings, i.e. the start of the week, the weekend and
   * how many days are required in the first week of a year.
   * Does not affect existing instances.
   *
   * @param {WeekSettings|null} weekSettings
   */
  static set defaultWeekSettings(weekSettings) {
    defaultWeekSettings = validateWeekSettings(weekSettings);
  }
  /**
   * Get the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   */
  static get twoDigitCutoffYear() {
    return twoDigitCutoffYear;
  }
  /**
   * Set the cutoff year for whether a 2-digit year string is interpreted in the current or previous century. Numbers higher than the cutoff will be considered to mean 19xx and numbers lower or equal to the cutoff will be considered 20xx.
   * @type {number}
   * @example Settings.twoDigitCutoffYear = 0 // all 'yy' are interpreted as 20th century
   * @example Settings.twoDigitCutoffYear = 99 // all 'yy' are interpreted as 21st century
   * @example Settings.twoDigitCutoffYear = 50 // '49' -> 2049; '50' -> 1950
   * @example Settings.twoDigitCutoffYear = 1950 // interpreted as 50
   * @example Settings.twoDigitCutoffYear = 2050 // ALSO interpreted as 50
   */
  static set twoDigitCutoffYear(cutoffYear) {
    twoDigitCutoffYear = cutoffYear % 100;
  }
  /**
   * Get whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static get throwOnInvalid() {
    return throwOnInvalid;
  }
  /**
   * Set whether Luxon will throw when it encounters invalid DateTimes, Durations, or Intervals
   * @type {boolean}
   */
  static set throwOnInvalid(t3) {
    throwOnInvalid = t3;
  }
  /**
   * Reset Luxon's global caches. Should only be necessary in testing scenarios.
   * @return {void}
   */
  static resetCaches() {
    Locale.resetCache();
    IANAZone.resetCache();
    DateTime.resetCache();
    resetDigitRegexCache();
  }
}
class Invalid {
  constructor(reason, explanation) {
    this.reason = reason;
    this.explanation = explanation;
  }
  toMessage() {
    if (this.explanation) {
      return `${this.reason}: ${this.explanation}`;
    } else {
      return this.reason;
    }
  }
}
const nonLeapLadder = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], leapLadder = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
function unitOutOfRange(unit, value) {
  return new Invalid(
    "unit out of range",
    `you specified ${value} (of type ${typeof value}) as a ${unit}, which is invalid`
  );
}
function dayOfWeek(year, month, day) {
  const d2 = new Date(Date.UTC(year, month - 1, day));
  if (year < 100 && year >= 0) {
    d2.setUTCFullYear(d2.getUTCFullYear() - 1900);
  }
  const js = d2.getUTCDay();
  return js === 0 ? 7 : js;
}
function computeOrdinal(year, month, day) {
  return day + (isLeapYear(year) ? leapLadder : nonLeapLadder)[month - 1];
}
function uncomputeOrdinal(year, ordinal) {
  const table = isLeapYear(year) ? leapLadder : nonLeapLadder, month0 = table.findIndex((i2) => i2 < ordinal), day = ordinal - table[month0];
  return { month: month0 + 1, day };
}
function isoWeekdayToLocal(isoWeekday, startOfWeek) {
  return (isoWeekday - startOfWeek + 7) % 7 + 1;
}
function gregorianToWeek(gregObj, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const { year, month, day } = gregObj, ordinal = computeOrdinal(year, month, day), weekday = isoWeekdayToLocal(dayOfWeek(year, month, day), startOfWeek);
  let weekNumber = Math.floor((ordinal - weekday + 14 - minDaysInFirstWeek) / 7), weekYear;
  if (weekNumber < 1) {
    weekYear = year - 1;
    weekNumber = weeksInWeekYear(weekYear, minDaysInFirstWeek, startOfWeek);
  } else if (weekNumber > weeksInWeekYear(year, minDaysInFirstWeek, startOfWeek)) {
    weekYear = year + 1;
    weekNumber = 1;
  } else {
    weekYear = year;
  }
  return { weekYear, weekNumber, weekday, ...timeObject(gregObj) };
}
function weekToGregorian(weekData, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const { weekYear, weekNumber, weekday } = weekData, weekdayOfJan4 = isoWeekdayToLocal(dayOfWeek(weekYear, 1, minDaysInFirstWeek), startOfWeek), yearInDays = daysInYear(weekYear);
  let ordinal = weekNumber * 7 + weekday - weekdayOfJan4 - 7 + minDaysInFirstWeek, year;
  if (ordinal < 1) {
    year = weekYear - 1;
    ordinal += daysInYear(year);
  } else if (ordinal > yearInDays) {
    year = weekYear + 1;
    ordinal -= daysInYear(weekYear);
  } else {
    year = weekYear;
  }
  const { month, day } = uncomputeOrdinal(year, ordinal);
  return { year, month, day, ...timeObject(weekData) };
}
function gregorianToOrdinal(gregData) {
  const { year, month, day } = gregData;
  const ordinal = computeOrdinal(year, month, day);
  return { year, ordinal, ...timeObject(gregData) };
}
function ordinalToGregorian(ordinalData) {
  const { year, ordinal } = ordinalData;
  const { month, day } = uncomputeOrdinal(year, ordinal);
  return { year, month, day, ...timeObject(ordinalData) };
}
function usesLocalWeekValues(obj, loc) {
  const hasLocaleWeekData = !isUndefined(obj.localWeekday) || !isUndefined(obj.localWeekNumber) || !isUndefined(obj.localWeekYear);
  if (hasLocaleWeekData) {
    const hasIsoWeekData = !isUndefined(obj.weekday) || !isUndefined(obj.weekNumber) || !isUndefined(obj.weekYear);
    if (hasIsoWeekData) {
      throw new ConflictingSpecificationError(
        "Cannot mix locale-based week fields with ISO-based week fields"
      );
    }
    if (!isUndefined(obj.localWeekday)) obj.weekday = obj.localWeekday;
    if (!isUndefined(obj.localWeekNumber)) obj.weekNumber = obj.localWeekNumber;
    if (!isUndefined(obj.localWeekYear)) obj.weekYear = obj.localWeekYear;
    delete obj.localWeekday;
    delete obj.localWeekNumber;
    delete obj.localWeekYear;
    return {
      minDaysInFirstWeek: loc.getMinDaysInFirstWeek(),
      startOfWeek: loc.getStartOfWeek()
    };
  } else {
    return { minDaysInFirstWeek: 4, startOfWeek: 1 };
  }
}
function hasInvalidWeekData(obj, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const validYear = isInteger(obj.weekYear), validWeek = integerBetween(
    obj.weekNumber,
    1,
    weeksInWeekYear(obj.weekYear, minDaysInFirstWeek, startOfWeek)
  ), validWeekday = integerBetween(obj.weekday, 1, 7);
  if (!validYear) {
    return unitOutOfRange("weekYear", obj.weekYear);
  } else if (!validWeek) {
    return unitOutOfRange("week", obj.weekNumber);
  } else if (!validWeekday) {
    return unitOutOfRange("weekday", obj.weekday);
  } else return false;
}
function hasInvalidOrdinalData(obj) {
  const validYear = isInteger(obj.year), validOrdinal = integerBetween(obj.ordinal, 1, daysInYear(obj.year));
  if (!validYear) {
    return unitOutOfRange("year", obj.year);
  } else if (!validOrdinal) {
    return unitOutOfRange("ordinal", obj.ordinal);
  } else return false;
}
function hasInvalidGregorianData(obj) {
  const validYear = isInteger(obj.year), validMonth = integerBetween(obj.month, 1, 12), validDay = integerBetween(obj.day, 1, daysInMonth(obj.year, obj.month));
  if (!validYear) {
    return unitOutOfRange("year", obj.year);
  } else if (!validMonth) {
    return unitOutOfRange("month", obj.month);
  } else if (!validDay) {
    return unitOutOfRange("day", obj.day);
  } else return false;
}
function hasInvalidTimeData(obj) {
  const { hour, minute, second, millisecond } = obj;
  const validHour = integerBetween(hour, 0, 23) || hour === 24 && minute === 0 && second === 0 && millisecond === 0, validMinute = integerBetween(minute, 0, 59), validSecond = integerBetween(second, 0, 59), validMillisecond = integerBetween(millisecond, 0, 999);
  if (!validHour) {
    return unitOutOfRange("hour", hour);
  } else if (!validMinute) {
    return unitOutOfRange("minute", minute);
  } else if (!validSecond) {
    return unitOutOfRange("second", second);
  } else if (!validMillisecond) {
    return unitOutOfRange("millisecond", millisecond);
  } else return false;
}
function isUndefined(o2) {
  return typeof o2 === "undefined";
}
function isNumber(o2) {
  return typeof o2 === "number";
}
function isInteger(o2) {
  return typeof o2 === "number" && o2 % 1 === 0;
}
function isString$1(o2) {
  return typeof o2 === "string";
}
function isDate(o2) {
  return Object.prototype.toString.call(o2) === "[object Date]";
}
function hasRelative() {
  try {
    return typeof Intl !== "undefined" && !!Intl.RelativeTimeFormat;
  } catch (e2) {
    return false;
  }
}
function hasLocaleWeekInfo() {
  try {
    return typeof Intl !== "undefined" && !!Intl.Locale && ("weekInfo" in Intl.Locale.prototype || "getWeekInfo" in Intl.Locale.prototype);
  } catch (e2) {
    return false;
  }
}
function maybeArray(thing) {
  return Array.isArray(thing) ? thing : [thing];
}
function bestBy(arr, by, compare) {
  if (arr.length === 0) {
    return void 0;
  }
  return arr.reduce((best, next) => {
    const pair = [by(next), next];
    if (!best) {
      return pair;
    } else if (compare(best[0], pair[0]) === best[0]) {
      return best;
    } else {
      return pair;
    }
  }, null)[1];
}
function pick(obj, keys) {
  return keys.reduce((a2, k2) => {
    a2[k2] = obj[k2];
    return a2;
  }, {});
}
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
function validateWeekSettings(settings) {
  if (settings == null) {
    return null;
  } else if (typeof settings !== "object") {
    throw new InvalidArgumentError("Week settings must be an object");
  } else {
    if (!integerBetween(settings.firstDay, 1, 7) || !integerBetween(settings.minimalDays, 1, 7) || !Array.isArray(settings.weekend) || settings.weekend.some((v2) => !integerBetween(v2, 1, 7))) {
      throw new InvalidArgumentError("Invalid week settings");
    }
    return {
      firstDay: settings.firstDay,
      minimalDays: settings.minimalDays,
      weekend: Array.from(settings.weekend)
    };
  }
}
function integerBetween(thing, bottom, top) {
  return isInteger(thing) && thing >= bottom && thing <= top;
}
function floorMod(x2, n2) {
  return x2 - n2 * Math.floor(x2 / n2);
}
function padStart(input, n2 = 2) {
  const isNeg = input < 0;
  let padded;
  if (isNeg) {
    padded = "-" + ("" + -input).padStart(n2, "0");
  } else {
    padded = ("" + input).padStart(n2, "0");
  }
  return padded;
}
function parseInteger(string) {
  if (isUndefined(string) || string === null || string === "") {
    return void 0;
  } else {
    return parseInt(string, 10);
  }
}
function parseFloating(string) {
  if (isUndefined(string) || string === null || string === "") {
    return void 0;
  } else {
    return parseFloat(string);
  }
}
function parseMillis(fraction) {
  if (isUndefined(fraction) || fraction === null || fraction === "") {
    return void 0;
  } else {
    const f = parseFloat("0." + fraction) * 1e3;
    return Math.floor(f);
  }
}
function roundTo(number, digits, rounding = "round") {
  const factor = 10 ** digits;
  switch (rounding) {
    case "expand":
      return number > 0 ? Math.ceil(number * factor) / factor : Math.floor(number * factor) / factor;
    case "trunc":
      return Math.trunc(number * factor) / factor;
    case "round":
      return Math.round(number * factor) / factor;
    case "floor":
      return Math.floor(number * factor) / factor;
    case "ceil":
      return Math.ceil(number * factor) / factor;
    default:
      throw new RangeError(`Value rounding ${rounding} is out of range`);
  }
}
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
function daysInYear(year) {
  return isLeapYear(year) ? 366 : 365;
}
function daysInMonth(year, month) {
  const modMonth = floorMod(month - 1, 12) + 1, modYear = year + (month - modMonth) / 12;
  if (modMonth === 2) {
    return isLeapYear(modYear) ? 29 : 28;
  } else {
    return [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][modMonth - 1];
  }
}
function objToLocalTS(obj) {
  let d2 = Date.UTC(
    obj.year,
    obj.month - 1,
    obj.day,
    obj.hour,
    obj.minute,
    obj.second,
    obj.millisecond
  );
  if (obj.year < 100 && obj.year >= 0) {
    d2 = new Date(d2);
    d2.setUTCFullYear(obj.year, obj.month - 1, obj.day);
  }
  return +d2;
}
function firstWeekOffset(year, minDaysInFirstWeek, startOfWeek) {
  const fwdlw = isoWeekdayToLocal(dayOfWeek(year, 1, minDaysInFirstWeek), startOfWeek);
  return -fwdlw + minDaysInFirstWeek - 1;
}
function weeksInWeekYear(weekYear, minDaysInFirstWeek = 4, startOfWeek = 1) {
  const weekOffset = firstWeekOffset(weekYear, minDaysInFirstWeek, startOfWeek);
  const weekOffsetNext = firstWeekOffset(weekYear + 1, minDaysInFirstWeek, startOfWeek);
  return (daysInYear(weekYear) - weekOffset + weekOffsetNext) / 7;
}
function untruncateYear(year) {
  if (year > 99) {
    return year;
  } else return year > Settings.twoDigitCutoffYear ? 1900 + year : 2e3 + year;
}
function parseZoneInfo(ts, offsetFormat, locale, timeZone = null) {
  const date = new Date(ts), intlOpts = {
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  };
  if (timeZone) {
    intlOpts.timeZone = timeZone;
  }
  const modified = { timeZoneName: offsetFormat, ...intlOpts };
  const parsed = new Intl.DateTimeFormat(locale, modified).formatToParts(date).find((m2) => m2.type.toLowerCase() === "timezonename");
  return parsed ? parsed.value : null;
}
function signedOffset(offHourStr, offMinuteStr) {
  let offHour = parseInt(offHourStr, 10);
  if (Number.isNaN(offHour)) {
    offHour = 0;
  }
  const offMin = parseInt(offMinuteStr, 10) || 0, offMinSigned = offHour < 0 || Object.is(offHour, -0) ? -offMin : offMin;
  return offHour * 60 + offMinSigned;
}
function asNumber(value) {
  const numericValue = Number(value);
  if (typeof value === "boolean" || value === "" || !Number.isFinite(numericValue))
    throw new InvalidArgumentError(`Invalid unit value ${value}`);
  return numericValue;
}
function normalizeObject(obj, normalizer) {
  const normalized = {};
  for (const u2 in obj) {
    if (hasOwnProperty(obj, u2)) {
      const v2 = obj[u2];
      if (v2 === void 0 || v2 === null) continue;
      normalized[normalizer(u2)] = asNumber(v2);
    }
  }
  return normalized;
}
function formatOffset(offset2, format) {
  const hours = Math.trunc(Math.abs(offset2 / 60)), minutes = Math.trunc(Math.abs(offset2 % 60)), sign = offset2 >= 0 ? "+" : "-";
  switch (format) {
    case "short":
      return `${sign}${padStart(hours, 2)}:${padStart(minutes, 2)}`;
    case "narrow":
      return `${sign}${hours}${minutes > 0 ? `:${minutes}` : ""}`;
    case "techie":
      return `${sign}${padStart(hours, 2)}${padStart(minutes, 2)}`;
    default:
      throw new RangeError(`Value format ${format} is out of range for property format`);
  }
}
function timeObject(obj) {
  return pick(obj, ["hour", "minute", "second", "millisecond"]);
}
const monthsLong = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const monthsShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];
const monthsNarrow = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
function months(length) {
  switch (length) {
    case "narrow":
      return [...monthsNarrow];
    case "short":
      return [...monthsShort];
    case "long":
      return [...monthsLong];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    case "2-digit":
      return ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    default:
      return null;
  }
}
const weekdaysLong = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];
const weekdaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekdaysNarrow = ["M", "T", "W", "T", "F", "S", "S"];
function weekdays(length) {
  switch (length) {
    case "narrow":
      return [...weekdaysNarrow];
    case "short":
      return [...weekdaysShort];
    case "long":
      return [...weekdaysLong];
    case "numeric":
      return ["1", "2", "3", "4", "5", "6", "7"];
    default:
      return null;
  }
}
const meridiems = ["AM", "PM"];
const erasLong = ["Before Christ", "Anno Domini"];
const erasShort = ["BC", "AD"];
const erasNarrow = ["B", "A"];
function eras(length) {
  switch (length) {
    case "narrow":
      return [...erasNarrow];
    case "short":
      return [...erasShort];
    case "long":
      return [...erasLong];
    default:
      return null;
  }
}
function meridiemForDateTime(dt) {
  return meridiems[dt.hour < 12 ? 0 : 1];
}
function weekdayForDateTime(dt, length) {
  return weekdays(length)[dt.weekday - 1];
}
function monthForDateTime(dt, length) {
  return months(length)[dt.month - 1];
}
function eraForDateTime(dt, length) {
  return eras(length)[dt.year < 0 ? 0 : 1];
}
function formatRelativeTime(unit, count, numeric = "always", narrow = false) {
  const units = {
    years: ["year", "yr."],
    quarters: ["quarter", "qtr."],
    months: ["month", "mo."],
    weeks: ["week", "wk."],
    days: ["day", "day", "days"],
    hours: ["hour", "hr."],
    minutes: ["minute", "min."],
    seconds: ["second", "sec."]
  };
  const lastable = ["hours", "minutes", "seconds"].indexOf(unit) === -1;
  if (numeric === "auto" && lastable) {
    const isDay = unit === "days";
    switch (count) {
      case 1:
        return isDay ? "tomorrow" : `next ${units[unit][0]}`;
      case -1:
        return isDay ? "yesterday" : `last ${units[unit][0]}`;
      case 0:
        return isDay ? "today" : `this ${units[unit][0]}`;
    }
  }
  const isInPast = Object.is(count, -0) || count < 0, fmtValue = Math.abs(count), singular = fmtValue === 1, lilUnits = units[unit], fmtUnit = narrow ? singular ? lilUnits[1] : lilUnits[2] || lilUnits[1] : singular ? units[unit][0] : unit;
  return isInPast ? `${fmtValue} ${fmtUnit} ago` : `in ${fmtValue} ${fmtUnit}`;
}
function stringifyTokens(splits, tokenToString) {
  let s2 = "";
  for (const token of splits) {
    if (token.literal) {
      s2 += token.val;
    } else {
      s2 += tokenToString(token.val);
    }
  }
  return s2;
}
const macroTokenToFormatOpts = {
  D: DATE_SHORT,
  DD: DATE_MED,
  DDD: DATE_FULL,
  DDDD: DATE_HUGE,
  t: TIME_SIMPLE,
  tt: TIME_WITH_SECONDS,
  ttt: TIME_WITH_SHORT_OFFSET,
  tttt: TIME_WITH_LONG_OFFSET,
  T: TIME_24_SIMPLE,
  TT: TIME_24_WITH_SECONDS,
  TTT: TIME_24_WITH_SHORT_OFFSET,
  TTTT: TIME_24_WITH_LONG_OFFSET,
  f: DATETIME_SHORT,
  ff: DATETIME_MED,
  fff: DATETIME_FULL,
  ffff: DATETIME_HUGE,
  F: DATETIME_SHORT_WITH_SECONDS,
  FF: DATETIME_MED_WITH_SECONDS,
  FFF: DATETIME_FULL_WITH_SECONDS,
  FFFF: DATETIME_HUGE_WITH_SECONDS
};
class Formatter {
  static create(locale, opts = {}) {
    return new Formatter(locale, opts);
  }
  static parseFormat(fmt) {
    let current = null, currentFull = "", bracketed = false;
    const splits = [];
    for (let i2 = 0; i2 < fmt.length; i2++) {
      const c2 = fmt.charAt(i2);
      if (c2 === "'") {
        if (currentFull.length > 0 || bracketed) {
          splits.push({
            literal: bracketed || /^\s+$/.test(currentFull),
            val: currentFull === "" ? "'" : currentFull
          });
        }
        current = null;
        currentFull = "";
        bracketed = !bracketed;
      } else if (bracketed) {
        currentFull += c2;
      } else if (c2 === current) {
        currentFull += c2;
      } else {
        if (currentFull.length > 0) {
          splits.push({ literal: /^\s+$/.test(currentFull), val: currentFull });
        }
        currentFull = c2;
        current = c2;
      }
    }
    if (currentFull.length > 0) {
      splits.push({ literal: bracketed || /^\s+$/.test(currentFull), val: currentFull });
    }
    return splits;
  }
  static macroTokenToFormatOpts(token) {
    return macroTokenToFormatOpts[token];
  }
  constructor(locale, formatOpts) {
    this.opts = formatOpts;
    this.loc = locale;
    this.systemLoc = null;
  }
  formatWithSystemDefault(dt, opts) {
    if (this.systemLoc === null) {
      this.systemLoc = this.loc.redefaultToSystem();
    }
    const df = this.systemLoc.dtFormatter(dt, { ...this.opts, ...opts });
    return df.format();
  }
  dtFormatter(dt, opts = {}) {
    return this.loc.dtFormatter(dt, { ...this.opts, ...opts });
  }
  formatDateTime(dt, opts) {
    return this.dtFormatter(dt, opts).format();
  }
  formatDateTimeParts(dt, opts) {
    return this.dtFormatter(dt, opts).formatToParts();
  }
  formatInterval(interval, opts) {
    const df = this.dtFormatter(interval.start, opts);
    return df.dtf.formatRange(interval.start.toJSDate(), interval.end.toJSDate());
  }
  resolvedOptions(dt, opts) {
    return this.dtFormatter(dt, opts).resolvedOptions();
  }
  num(n2, p2 = 0, signDisplay = void 0) {
    if (this.opts.forceSimple) {
      return padStart(n2, p2);
    }
    const opts = { ...this.opts };
    if (p2 > 0) {
      opts.padTo = p2;
    }
    if (signDisplay) {
      opts.signDisplay = signDisplay;
    }
    return this.loc.numberFormatter(opts).format(n2);
  }
  formatDateTimeFromString(dt, fmt) {
    const knownEnglish = this.loc.listingMode() === "en", useDateTimeFormatter = this.loc.outputCalendar && this.loc.outputCalendar !== "gregory", string = (opts, extract) => this.loc.extract(dt, opts, extract), formatOffset2 = (opts) => {
      if (dt.isOffsetFixed && dt.offset === 0 && opts.allowZ) {
        return "Z";
      }
      return dt.isValid ? dt.zone.formatOffset(dt.ts, opts.format) : "";
    }, meridiem = () => knownEnglish ? meridiemForDateTime(dt) : string({ hour: "numeric", hourCycle: "h12" }, "dayperiod"), month = (length, standalone) => knownEnglish ? monthForDateTime(dt, length) : string(standalone ? { month: length } : { month: length, day: "numeric" }, "month"), weekday = (length, standalone) => knownEnglish ? weekdayForDateTime(dt, length) : string(
      standalone ? { weekday: length } : { weekday: length, month: "long", day: "numeric" },
      "weekday"
    ), maybeMacro = (token) => {
      const formatOpts = Formatter.macroTokenToFormatOpts(token);
      if (formatOpts) {
        return this.formatWithSystemDefault(dt, formatOpts);
      } else {
        return token;
      }
    }, era = (length) => knownEnglish ? eraForDateTime(dt, length) : string({ era: length }, "era"), tokenToString = (token) => {
      switch (token) {
        case "S":
          return this.num(dt.millisecond);
        case "u":
        case "SSS":
          return this.num(dt.millisecond, 3);
        case "s":
          return this.num(dt.second);
        case "ss":
          return this.num(dt.second, 2);
        case "uu":
          return this.num(Math.floor(dt.millisecond / 10), 2);
        case "uuu":
          return this.num(Math.floor(dt.millisecond / 100));
        case "m":
          return this.num(dt.minute);
        case "mm":
          return this.num(dt.minute, 2);
        case "h":
          return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12);
        case "hh":
          return this.num(dt.hour % 12 === 0 ? 12 : dt.hour % 12, 2);
        case "H":
          return this.num(dt.hour);
        case "HH":
          return this.num(dt.hour, 2);
        case "Z":
          return formatOffset2({ format: "narrow", allowZ: this.opts.allowZ });
        case "ZZ":
          return formatOffset2({ format: "short", allowZ: this.opts.allowZ });
        case "ZZZ":
          return formatOffset2({ format: "techie", allowZ: this.opts.allowZ });
        case "ZZZZ":
          return dt.zone.offsetName(dt.ts, { format: "short", locale: this.loc.locale });
        case "ZZZZZ":
          return dt.zone.offsetName(dt.ts, { format: "long", locale: this.loc.locale });
        case "z":
          return dt.zoneName;
        case "a":
          return meridiem();
        case "d":
          return useDateTimeFormatter ? string({ day: "numeric" }, "day") : this.num(dt.day);
        case "dd":
          return useDateTimeFormatter ? string({ day: "2-digit" }, "day") : this.num(dt.day, 2);
        case "c":
          return this.num(dt.weekday);
        case "ccc":
          return weekday("short", true);
        case "cccc":
          return weekday("long", true);
        case "ccccc":
          return weekday("narrow", true);
        case "E":
          return this.num(dt.weekday);
        case "EEE":
          return weekday("short", false);
        case "EEEE":
          return weekday("long", false);
        case "EEEEE":
          return weekday("narrow", false);
        case "L":
          return useDateTimeFormatter ? string({ month: "numeric", day: "numeric" }, "month") : this.num(dt.month);
        case "LL":
          return useDateTimeFormatter ? string({ month: "2-digit", day: "numeric" }, "month") : this.num(dt.month, 2);
        case "LLL":
          return month("short", true);
        case "LLLL":
          return month("long", true);
        case "LLLLL":
          return month("narrow", true);
        case "M":
          return useDateTimeFormatter ? string({ month: "numeric" }, "month") : this.num(dt.month);
        case "MM":
          return useDateTimeFormatter ? string({ month: "2-digit" }, "month") : this.num(dt.month, 2);
        case "MMM":
          return month("short", false);
        case "MMMM":
          return month("long", false);
        case "MMMMM":
          return month("narrow", false);
        case "y":
          return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year);
        case "yy":
          return useDateTimeFormatter ? string({ year: "2-digit" }, "year") : this.num(dt.year.toString().slice(-2), 2);
        case "yyyy":
          return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year, 4);
        case "yyyyyy":
          return useDateTimeFormatter ? string({ year: "numeric" }, "year") : this.num(dt.year, 6);
        case "G":
          return era("short");
        case "GG":
          return era("long");
        case "GGGGG":
          return era("narrow");
        case "kk":
          return this.num(dt.weekYear.toString().slice(-2), 2);
        case "kkkk":
          return this.num(dt.weekYear, 4);
        case "W":
          return this.num(dt.weekNumber);
        case "WW":
          return this.num(dt.weekNumber, 2);
        case "n":
          return this.num(dt.localWeekNumber);
        case "nn":
          return this.num(dt.localWeekNumber, 2);
        case "ii":
          return this.num(dt.localWeekYear.toString().slice(-2), 2);
        case "iiii":
          return this.num(dt.localWeekYear, 4);
        case "o":
          return this.num(dt.ordinal);
        case "ooo":
          return this.num(dt.ordinal, 3);
        case "q":
          return this.num(dt.quarter);
        case "qq":
          return this.num(dt.quarter, 2);
        case "X":
          return this.num(Math.floor(dt.ts / 1e3));
        case "x":
          return this.num(dt.ts);
        default:
          return maybeMacro(token);
      }
    };
    return stringifyTokens(Formatter.parseFormat(fmt), tokenToString);
  }
  formatDurationFromString(dur, fmt) {
    const invertLargest = this.opts.signMode === "negativeLargestOnly" ? -1 : 1;
    const tokenToField = (token) => {
      switch (token[0]) {
        case "S":
          return "milliseconds";
        case "s":
          return "seconds";
        case "m":
          return "minutes";
        case "h":
          return "hours";
        case "d":
          return "days";
        case "w":
          return "weeks";
        case "M":
          return "months";
        case "y":
          return "years";
        default:
          return null;
      }
    }, tokenToString = (lildur, info) => (token) => {
      const mapped = tokenToField(token);
      if (mapped) {
        const inversionFactor = info.isNegativeDuration && mapped !== info.largestUnit ? invertLargest : 1;
        let signDisplay;
        if (this.opts.signMode === "negativeLargestOnly" && mapped !== info.largestUnit) {
          signDisplay = "never";
        } else if (this.opts.signMode === "all") {
          signDisplay = "always";
        } else {
          signDisplay = "auto";
        }
        return this.num(lildur.get(mapped) * inversionFactor, token.length, signDisplay);
      } else {
        return token;
      }
    }, tokens = Formatter.parseFormat(fmt), realTokens = tokens.reduce(
      (found, { literal, val }) => literal ? found : found.concat(val),
      []
    ), collapsed = dur.shiftTo(...realTokens.map(tokenToField).filter((t3) => t3)), durationInfo = {
      isNegativeDuration: collapsed < 0,
      // this relies on "collapsed" being based on "shiftTo", which builds up the object
      // in order
      largestUnit: Object.keys(collapsed.values)[0]
    };
    return stringifyTokens(tokens, tokenToString(collapsed, durationInfo));
  }
}
const ianaRegex = /[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;
function combineRegexes(...regexes) {
  const full = regexes.reduce((f, r2) => f + r2.source, "");
  return RegExp(`^${full}$`);
}
function combineExtractors(...extractors) {
  return (m2) => extractors.reduce(
    ([mergedVals, mergedZone, cursor], ex) => {
      const [val, zone, next] = ex(m2, cursor);
      return [{ ...mergedVals, ...val }, zone || mergedZone, next];
    },
    [{}, null, 1]
  ).slice(0, 2);
}
function parse(s2, ...patterns) {
  if (s2 == null) {
    return [null, null];
  }
  for (const [regex, extractor] of patterns) {
    const m2 = regex.exec(s2);
    if (m2) {
      return extractor(m2);
    }
  }
  return [null, null];
}
function simpleParse(...keys) {
  return (match2, cursor) => {
    const ret = {};
    let i2;
    for (i2 = 0; i2 < keys.length; i2++) {
      ret[keys[i2]] = parseInteger(match2[cursor + i2]);
    }
    return [ret, null, cursor + i2];
  };
}
const offsetRegex = /(?:([Zz])|([+-]\d\d)(?::?(\d\d))?)/;
const isoExtendedZone = `(?:${offsetRegex.source}?(?:\\[(${ianaRegex.source})\\])?)?`;
const isoTimeBaseRegex = /(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/;
const isoTimeRegex = RegExp(`${isoTimeBaseRegex.source}${isoExtendedZone}`);
const isoTimeExtensionRegex = RegExp(`(?:[Tt]${isoTimeRegex.source})?`);
const isoYmdRegex = /([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/;
const isoWeekRegex = /(\d{4})-?W(\d\d)(?:-?(\d))?/;
const isoOrdinalRegex = /(\d{4})-?(\d{3})/;
const extractISOWeekData = simpleParse("weekYear", "weekNumber", "weekDay");
const extractISOOrdinalData = simpleParse("year", "ordinal");
const sqlYmdRegex = /(\d{4})-(\d\d)-(\d\d)/;
const sqlTimeRegex = RegExp(
  `${isoTimeBaseRegex.source} ?(?:${offsetRegex.source}|(${ianaRegex.source}))?`
);
const sqlTimeExtensionRegex = RegExp(`(?: ${sqlTimeRegex.source})?`);
function int(match2, pos, fallback) {
  const m2 = match2[pos];
  return isUndefined(m2) ? fallback : parseInteger(m2);
}
function extractISOYmd(match2, cursor) {
  const item = {
    year: int(match2, cursor),
    month: int(match2, cursor + 1, 1),
    day: int(match2, cursor + 2, 1)
  };
  return [item, null, cursor + 3];
}
function extractISOTime(match2, cursor) {
  const item = {
    hours: int(match2, cursor, 0),
    minutes: int(match2, cursor + 1, 0),
    seconds: int(match2, cursor + 2, 0),
    milliseconds: parseMillis(match2[cursor + 3])
  };
  return [item, null, cursor + 4];
}
function extractISOOffset(match2, cursor) {
  const local = !match2[cursor] && !match2[cursor + 1], fullOffset = signedOffset(match2[cursor + 1], match2[cursor + 2]), zone = local ? null : FixedOffsetZone.instance(fullOffset);
  return [{}, zone, cursor + 3];
}
function extractIANAZone(match2, cursor) {
  const zone = match2[cursor] ? IANAZone.create(match2[cursor]) : null;
  return [{}, zone, cursor + 1];
}
const isoTimeOnly = RegExp(`^T?${isoTimeBaseRegex.source}$`);
const isoDuration = /^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;
function extractISODuration(match2) {
  const [s2, yearStr, monthStr, weekStr, dayStr, hourStr, minuteStr, secondStr, millisecondsStr] = match2;
  const hasNegativePrefix = s2[0] === "-";
  const negativeSeconds = secondStr && secondStr[0] === "-";
  const maybeNegate = (num, force = false) => num !== void 0 && (force || num && hasNegativePrefix) ? -num : num;
  return [
    {
      years: maybeNegate(parseFloating(yearStr)),
      months: maybeNegate(parseFloating(monthStr)),
      weeks: maybeNegate(parseFloating(weekStr)),
      days: maybeNegate(parseFloating(dayStr)),
      hours: maybeNegate(parseFloating(hourStr)),
      minutes: maybeNegate(parseFloating(minuteStr)),
      seconds: maybeNegate(parseFloating(secondStr), secondStr === "-0"),
      milliseconds: maybeNegate(parseMillis(millisecondsStr), negativeSeconds)
    }
  ];
}
const obsOffsets = {
  GMT: 0,
  EDT: -4 * 60,
  EST: -5 * 60,
  CDT: -5 * 60,
  CST: -6 * 60,
  MDT: -6 * 60,
  MST: -7 * 60,
  PDT: -7 * 60,
  PST: -8 * 60
};
function fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
  const result = {
    year: yearStr.length === 2 ? untruncateYear(parseInteger(yearStr)) : parseInteger(yearStr),
    month: monthsShort.indexOf(monthStr) + 1,
    day: parseInteger(dayStr),
    hour: parseInteger(hourStr),
    minute: parseInteger(minuteStr)
  };
  if (secondStr) result.second = parseInteger(secondStr);
  if (weekdayStr) {
    result.weekday = weekdayStr.length > 3 ? weekdaysLong.indexOf(weekdayStr) + 1 : weekdaysShort.indexOf(weekdayStr) + 1;
  }
  return result;
}
const rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;
function extractRFC2822(match2) {
  const [
    ,
    weekdayStr,
    dayStr,
    monthStr,
    yearStr,
    hourStr,
    minuteStr,
    secondStr,
    obsOffset,
    milOffset,
    offHourStr,
    offMinuteStr
  ] = match2, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  let offset2;
  if (obsOffset) {
    offset2 = obsOffsets[obsOffset];
  } else if (milOffset) {
    offset2 = 0;
  } else {
    offset2 = signedOffset(offHourStr, offMinuteStr);
  }
  return [result, new FixedOffsetZone(offset2)];
}
function preprocessRFC2822(s2) {
  return s2.replace(/\([^()]*\)|[\n\t]/g, " ").replace(/(\s\s+)/g, " ").trim();
}
const rfc1123 = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/, rfc850 = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/, ascii = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;
function extractRFC1123Or850(match2) {
  const [, weekdayStr, dayStr, monthStr, yearStr, hourStr, minuteStr, secondStr] = match2, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  return [result, FixedOffsetZone.utcInstance];
}
function extractASCII(match2) {
  const [, weekdayStr, monthStr, dayStr, hourStr, minuteStr, secondStr, yearStr] = match2, result = fromStrings(weekdayStr, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr);
  return [result, FixedOffsetZone.utcInstance];
}
const isoYmdWithTimeExtensionRegex = combineRegexes(isoYmdRegex, isoTimeExtensionRegex);
const isoWeekWithTimeExtensionRegex = combineRegexes(isoWeekRegex, isoTimeExtensionRegex);
const isoOrdinalWithTimeExtensionRegex = combineRegexes(isoOrdinalRegex, isoTimeExtensionRegex);
const isoTimeCombinedRegex = combineRegexes(isoTimeRegex);
const extractISOYmdTimeAndOffset = combineExtractors(
  extractISOYmd,
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
const extractISOWeekTimeAndOffset = combineExtractors(
  extractISOWeekData,
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
const extractISOOrdinalDateAndTime = combineExtractors(
  extractISOOrdinalData,
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
const extractISOTimeAndOffset = combineExtractors(
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
function parseISODate(s2) {
  return parse(
    s2,
    [isoYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
    [isoWeekWithTimeExtensionRegex, extractISOWeekTimeAndOffset],
    [isoOrdinalWithTimeExtensionRegex, extractISOOrdinalDateAndTime],
    [isoTimeCombinedRegex, extractISOTimeAndOffset]
  );
}
function parseRFC2822Date(s2) {
  return parse(preprocessRFC2822(s2), [rfc2822, extractRFC2822]);
}
function parseHTTPDate(s2) {
  return parse(
    s2,
    [rfc1123, extractRFC1123Or850],
    [rfc850, extractRFC1123Or850],
    [ascii, extractASCII]
  );
}
function parseISODuration(s2) {
  return parse(s2, [isoDuration, extractISODuration]);
}
const extractISOTimeOnly = combineExtractors(extractISOTime);
function parseISOTimeOnly(s2) {
  return parse(s2, [isoTimeOnly, extractISOTimeOnly]);
}
const sqlYmdWithTimeExtensionRegex = combineRegexes(sqlYmdRegex, sqlTimeExtensionRegex);
const sqlTimeCombinedRegex = combineRegexes(sqlTimeRegex);
const extractISOTimeOffsetAndIANAZone = combineExtractors(
  extractISOTime,
  extractISOOffset,
  extractIANAZone
);
function parseSQL(s2) {
  return parse(
    s2,
    [sqlYmdWithTimeExtensionRegex, extractISOYmdTimeAndOffset],
    [sqlTimeCombinedRegex, extractISOTimeOffsetAndIANAZone]
  );
}
const INVALID$2 = "Invalid Duration";
const lowOrderMatrix = {
  weeks: {
    days: 7,
    hours: 7 * 24,
    minutes: 7 * 24 * 60,
    seconds: 7 * 24 * 60 * 60,
    milliseconds: 7 * 24 * 60 * 60 * 1e3
  },
  days: {
    hours: 24,
    minutes: 24 * 60,
    seconds: 24 * 60 * 60,
    milliseconds: 24 * 60 * 60 * 1e3
  },
  hours: { minutes: 60, seconds: 60 * 60, milliseconds: 60 * 60 * 1e3 },
  minutes: { seconds: 60, milliseconds: 60 * 1e3 },
  seconds: { milliseconds: 1e3 }
}, casualMatrix = {
  years: {
    quarters: 4,
    months: 12,
    weeks: 52,
    days: 365,
    hours: 365 * 24,
    minutes: 365 * 24 * 60,
    seconds: 365 * 24 * 60 * 60,
    milliseconds: 365 * 24 * 60 * 60 * 1e3
  },
  quarters: {
    months: 3,
    weeks: 13,
    days: 91,
    hours: 91 * 24,
    minutes: 91 * 24 * 60,
    seconds: 91 * 24 * 60 * 60,
    milliseconds: 91 * 24 * 60 * 60 * 1e3
  },
  months: {
    weeks: 4,
    days: 30,
    hours: 30 * 24,
    minutes: 30 * 24 * 60,
    seconds: 30 * 24 * 60 * 60,
    milliseconds: 30 * 24 * 60 * 60 * 1e3
  },
  ...lowOrderMatrix
}, daysInYearAccurate = 146097 / 400, daysInMonthAccurate = 146097 / 4800, accurateMatrix = {
  years: {
    quarters: 4,
    months: 12,
    weeks: daysInYearAccurate / 7,
    days: daysInYearAccurate,
    hours: daysInYearAccurate * 24,
    minutes: daysInYearAccurate * 24 * 60,
    seconds: daysInYearAccurate * 24 * 60 * 60,
    milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3
  },
  quarters: {
    months: 3,
    weeks: daysInYearAccurate / 28,
    days: daysInYearAccurate / 4,
    hours: daysInYearAccurate * 24 / 4,
    minutes: daysInYearAccurate * 24 * 60 / 4,
    seconds: daysInYearAccurate * 24 * 60 * 60 / 4,
    milliseconds: daysInYearAccurate * 24 * 60 * 60 * 1e3 / 4
  },
  months: {
    weeks: daysInMonthAccurate / 7,
    days: daysInMonthAccurate,
    hours: daysInMonthAccurate * 24,
    minutes: daysInMonthAccurate * 24 * 60,
    seconds: daysInMonthAccurate * 24 * 60 * 60,
    milliseconds: daysInMonthAccurate * 24 * 60 * 60 * 1e3
  },
  ...lowOrderMatrix
};
const orderedUnits$1 = [
  "years",
  "quarters",
  "months",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
  "milliseconds"
];
const reverseUnits = orderedUnits$1.slice(0).reverse();
function clone$1(dur, alts, clear = false) {
  const conf = {
    values: clear ? alts.values : { ...dur.values, ...alts.values || {} },
    loc: dur.loc.clone(alts.loc),
    conversionAccuracy: alts.conversionAccuracy || dur.conversionAccuracy,
    matrix: alts.matrix || dur.matrix
  };
  return new Duration(conf);
}
function durationToMillis(matrix, vals) {
  let sum = vals.milliseconds ?? 0;
  for (const unit of reverseUnits.slice(1)) {
    if (vals[unit]) {
      sum += vals[unit] * matrix[unit]["milliseconds"];
    }
  }
  return sum;
}
function normalizeValues(matrix, vals) {
  const factor = durationToMillis(matrix, vals) < 0 ? -1 : 1;
  orderedUnits$1.reduceRight((previous, current) => {
    if (!isUndefined(vals[current])) {
      if (previous) {
        const previousVal = vals[previous] * factor;
        const conv = matrix[current][previous];
        const rollUp = Math.floor(previousVal / conv);
        vals[current] += rollUp * factor;
        vals[previous] -= rollUp * conv * factor;
      }
      return current;
    } else {
      return previous;
    }
  }, null);
  orderedUnits$1.reduce((previous, current) => {
    if (!isUndefined(vals[current])) {
      if (previous) {
        const fraction = vals[previous] % 1;
        vals[previous] -= fraction;
        vals[current] += fraction * matrix[previous][current];
      }
      return current;
    } else {
      return previous;
    }
  }, null);
}
function removeZeroes(vals) {
  const newVals = {};
  for (const [key, value] of Object.entries(vals)) {
    if (value !== 0) {
      newVals[key] = value;
    }
  }
  return newVals;
}
class Duration {
  /**
   * @private
   */
  constructor(config) {
    const accurate = config.conversionAccuracy === "longterm" || false;
    let matrix = accurate ? accurateMatrix : casualMatrix;
    if (config.matrix) {
      matrix = config.matrix;
    }
    this.values = config.values;
    this.loc = config.loc || Locale.create();
    this.conversionAccuracy = accurate ? "longterm" : "casual";
    this.invalid = config.invalid || null;
    this.matrix = matrix;
    this.isLuxonDuration = true;
  }
  /**
   * Create Duration from a number of milliseconds.
   * @param {number} count of milliseconds
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  static fromMillis(count, opts) {
    return Duration.fromObject({ milliseconds: count }, opts);
  }
  /**
   * Create a Duration from a JavaScript object with keys like 'years' and 'hours'.
   * If this object is empty then a zero milliseconds duration is returned.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.years
   * @param {number} obj.quarters
   * @param {number} obj.months
   * @param {number} obj.weeks
   * @param {number} obj.days
   * @param {number} obj.hours
   * @param {number} obj.minutes
   * @param {number} obj.seconds
   * @param {number} obj.milliseconds
   * @param {Object} [opts=[]] - options for creating this Duration
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the custom conversion system to use
   * @return {Duration}
   */
  static fromObject(obj, opts = {}) {
    if (obj == null || typeof obj !== "object") {
      throw new InvalidArgumentError(
        `Duration.fromObject: argument expected to be an object, got ${obj === null ? "null" : typeof obj}`
      );
    }
    return new Duration({
      values: normalizeObject(obj, Duration.normalizeUnit),
      loc: Locale.fromObject(opts),
      conversionAccuracy: opts.conversionAccuracy,
      matrix: opts.matrix
    });
  }
  /**
   * Create a Duration from DurationLike.
   *
   * @param {Object | number | Duration} durationLike
   * One of:
   * - object with keys like 'years' and 'hours'.
   * - number representing milliseconds
   * - Duration instance
   * @return {Duration}
   */
  static fromDurationLike(durationLike) {
    if (isNumber(durationLike)) {
      return Duration.fromMillis(durationLike);
    } else if (Duration.isDuration(durationLike)) {
      return durationLike;
    } else if (typeof durationLike === "object") {
      return Duration.fromObject(durationLike);
    } else {
      throw new InvalidArgumentError(
        `Unknown duration argument ${durationLike} of type ${typeof durationLike}`
      );
    }
  }
  /**
   * Create a Duration from an ISO 8601 duration string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the preset conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromISO('P3Y6M1W4DT12H30M5S').toObject() //=> { years: 3, months: 6, weeks: 1, days: 4, hours: 12, minutes: 30, seconds: 5 }
   * @example Duration.fromISO('PT23H').toObject() //=> { hours: 23 }
   * @example Duration.fromISO('P5Y3M').toObject() //=> { years: 5, months: 3 }
   * @return {Duration}
   */
  static fromISO(text, opts) {
    const [parsed] = parseISODuration(text);
    if (parsed) {
      return Duration.fromObject(parsed, opts);
    } else {
      return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }
  }
  /**
   * Create a Duration from an ISO 8601 time string.
   * @param {string} text - text to parse
   * @param {Object} opts - options for parsing
   * @param {string} [opts.locale='en-US'] - the locale to use
   * @param {string} opts.numberingSystem - the numbering system to use
   * @param {string} [opts.conversionAccuracy='casual'] - the preset conversion system to use
   * @param {string} [opts.matrix=Object] - the conversion system to use
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @example Duration.fromISOTime('11:22:33.444').toObject() //=> { hours: 11, minutes: 22, seconds: 33, milliseconds: 444 }
   * @example Duration.fromISOTime('11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T11:00').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @example Duration.fromISOTime('T1100').toObject() //=> { hours: 11, minutes: 0, seconds: 0 }
   * @return {Duration}
   */
  static fromISOTime(text, opts) {
    const [parsed] = parseISOTimeOnly(text);
    if (parsed) {
      return Duration.fromObject(parsed, opts);
    } else {
      return Duration.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
    }
  }
  /**
   * Create an invalid Duration.
   * @param {string} reason - simple string of why this datetime is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Duration}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the Duration is invalid");
    }
    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
    if (Settings.throwOnInvalid) {
      throw new InvalidDurationError(invalid);
    } else {
      return new Duration({ invalid });
    }
  }
  /**
   * @private
   */
  static normalizeUnit(unit) {
    const normalized = {
      year: "years",
      years: "years",
      quarter: "quarters",
      quarters: "quarters",
      month: "months",
      months: "months",
      week: "weeks",
      weeks: "weeks",
      day: "days",
      days: "days",
      hour: "hours",
      hours: "hours",
      minute: "minutes",
      minutes: "minutes",
      second: "seconds",
      seconds: "seconds",
      millisecond: "milliseconds",
      milliseconds: "milliseconds"
    }[unit ? unit.toLowerCase() : unit];
    if (!normalized) throw new InvalidUnitError(unit);
    return normalized;
  }
  /**
   * Check if an object is a Duration. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isDuration(o2) {
    return o2 && o2.isLuxonDuration || false;
  }
  /**
   * Get  the locale of a Duration, such 'en-GB'
   * @type {string}
   */
  get locale() {
    return this.isValid ? this.loc.locale : null;
  }
  /**
   * Get the numbering system of a Duration, such 'beng'. The numbering system is used when formatting the Duration
   *
   * @type {string}
   */
  get numberingSystem() {
    return this.isValid ? this.loc.numberingSystem : null;
  }
  /**
   * Returns a string representation of this Duration formatted according to the specified format string. You may use these tokens:
   * * `S` for milliseconds
   * * `s` for seconds
   * * `m` for minutes
   * * `h` for hours
   * * `d` for days
   * * `w` for weeks
   * * `M` for months
   * * `y` for years
   * Notes:
   * * Add padding by repeating the token, e.g. "yy" pads the years to two digits, "hhhh" pads the hours out to four digits
   * * Tokens can be escaped by wrapping with single quotes.
   * * The duration will be converted to the set of units in the format string using {@link Duration#shiftTo} and the Durations's conversion accuracy setting.
   * @param {string} fmt - the format string
   * @param {Object} opts - options
   * @param {boolean} [opts.floor=true] - floor numerical values
   * @param {'negative'|'all'|'negativeLargestOnly'} [opts.signMode=negative] - How to handle signs
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("y d s") //=> "1 6 2"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("yy dd sss") //=> "01 06 002"
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toFormat("M S") //=> "12 518402000"
   * @example Duration.fromObject({ days: 6, seconds: 2 }).toFormat("d s", { signMode: "all" }) //=> "+6 +2"
   * @example Duration.fromObject({ days: -6, seconds: -2 }).toFormat("d s", { signMode: "all" }) //=> "-6 -2"
   * @example Duration.fromObject({ days: -6, seconds: -2 }).toFormat("d s", { signMode: "negativeLargestOnly" }) //=> "-6 2"
   * @return {string}
   */
  toFormat(fmt, opts = {}) {
    const fmtOpts = {
      ...opts,
      floor: opts.round !== false && opts.floor !== false
    };
    return this.isValid ? Formatter.create(this.loc, fmtOpts).formatDurationFromString(this, fmt) : INVALID$2;
  }
  /**
   * Returns a string representation of a Duration with all units included.
   * To modify its behavior, use `listStyle` and any Intl.NumberFormat option, though `unitDisplay` is especially relevant.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#options
   * @param {Object} opts - Formatting options. Accepts the same keys as the options parameter of the native `Intl.NumberFormat` constructor, as well as `listStyle`.
   * @param {string} [opts.listStyle='narrow'] - How to format the merged list. Corresponds to the `style` property of the options parameter of the native `Intl.ListFormat` constructor.
   * @param {boolean} [opts.showZeros=true] - Show all units previously used by the duration even if they are zero
   * @example
   * ```js
   * var dur = Duration.fromObject({ months: 1, weeks: 0, hours: 5, minutes: 6 })
   * dur.toHuman() //=> '1 month, 0 weeks, 5 hours, 6 minutes'
   * dur.toHuman({ listStyle: "long" }) //=> '1 month, 0 weeks, 5 hours, and 6 minutes'
   * dur.toHuman({ unitDisplay: "short" }) //=> '1 mth, 0 wks, 5 hr, 6 min'
   * dur.toHuman({ showZeros: false }) //=> '1 month, 5 hours, 6 minutes'
   * ```
   */
  toHuman(opts = {}) {
    if (!this.isValid) return INVALID$2;
    const showZeros = opts.showZeros !== false;
    const l2 = orderedUnits$1.map((unit) => {
      const val = this.values[unit];
      if (isUndefined(val) || val === 0 && !showZeros) {
        return null;
      }
      return this.loc.numberFormatter({ style: "unit", unitDisplay: "long", ...opts, unit: unit.slice(0, -1) }).format(val);
    }).filter((n2) => n2);
    return this.loc.listFormatter({ type: "conjunction", style: opts.listStyle || "narrow", ...opts }).format(l2);
  }
  /**
   * Returns a JavaScript object with this Duration's values.
   * @example Duration.fromObject({ years: 1, days: 6, seconds: 2 }).toObject() //=> { years: 1, days: 6, seconds: 2 }
   * @return {Object}
   */
  toObject() {
    if (!this.isValid) return {};
    return { ...this.values };
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Duration.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Durations
   * @example Duration.fromObject({ years: 3, seconds: 45 }).toISO() //=> 'P3YT45S'
   * @example Duration.fromObject({ months: 4, seconds: 45 }).toISO() //=> 'P4MT45S'
   * @example Duration.fromObject({ months: 5 }).toISO() //=> 'P5M'
   * @example Duration.fromObject({ minutes: 5 }).toISO() //=> 'PT5M'
   * @example Duration.fromObject({ milliseconds: 6 }).toISO() //=> 'PT0.006S'
   * @return {string}
   */
  toISO() {
    if (!this.isValid) return null;
    let s2 = "P";
    if (this.years !== 0) s2 += this.years + "Y";
    if (this.months !== 0 || this.quarters !== 0) s2 += this.months + this.quarters * 3 + "M";
    if (this.weeks !== 0) s2 += this.weeks + "W";
    if (this.days !== 0) s2 += this.days + "D";
    if (this.hours !== 0 || this.minutes !== 0 || this.seconds !== 0 || this.milliseconds !== 0)
      s2 += "T";
    if (this.hours !== 0) s2 += this.hours + "H";
    if (this.minutes !== 0) s2 += this.minutes + "M";
    if (this.seconds !== 0 || this.milliseconds !== 0)
      s2 += roundTo(this.seconds + this.milliseconds / 1e3, 3) + "S";
    if (s2 === "P") s2 += "T0S";
    return s2;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Duration, formatted as a time of day.
   * Note that this will return null if the duration is invalid, negative, or equal to or greater than 24 hours.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Times
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @example Duration.fromObject({ hours: 11 }).toISOTime() //=> '11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressMilliseconds: true }) //=> '11:00:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ suppressSeconds: true }) //=> '11:00'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ includePrefix: true }) //=> 'T11:00:00.000'
   * @example Duration.fromObject({ hours: 11 }).toISOTime({ format: 'basic' }) //=> '110000.000'
   * @return {string}
   */
  toISOTime(opts = {}) {
    if (!this.isValid) return null;
    const millis = this.toMillis();
    if (millis < 0 || millis >= 864e5) return null;
    opts = {
      suppressMilliseconds: false,
      suppressSeconds: false,
      includePrefix: false,
      format: "extended",
      ...opts,
      includeOffset: false
    };
    const dateTime = DateTime.fromMillis(millis, { zone: "UTC" });
    return dateTime.toISOTime(opts);
  }
  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }
  /**
   * Returns an ISO 8601 representation of this Duration appropriate for use in debugging.
   * @return {string}
   */
  toString() {
    return this.toISO();
  }
  /**
   * Returns a string representation of this Duration appropriate for the REPL.
   * @return {string}
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    if (this.isValid) {
      return `Duration { values: ${JSON.stringify(this.values)} }`;
    } else {
      return `Duration { Invalid, reason: ${this.invalidReason} }`;
    }
  }
  /**
   * Returns an milliseconds value of this Duration.
   * @return {number}
   */
  toMillis() {
    if (!this.isValid) return NaN;
    return durationToMillis(this.matrix, this.values);
  }
  /**
   * Returns an milliseconds value of this Duration. Alias of {@link toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
  }
  /**
   * Make this Duration longer by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  plus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration), result = {};
    for (const k2 of orderedUnits$1) {
      if (hasOwnProperty(dur.values, k2) || hasOwnProperty(this.values, k2)) {
        result[k2] = dur.get(k2) + this.get(k2);
      }
    }
    return clone$1(this, { values: result }, true);
  }
  /**
   * Make this Duration shorter by the specified amount. Return a newly-constructed Duration.
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @return {Duration}
   */
  minus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration);
    return this.plus(dur.negate());
  }
  /**
   * Scale this Duration by the specified amount. Return a newly-constructed Duration.
   * @param {function} fn - The function to apply to each unit. Arity is 1 or 2: the value of the unit and, optionally, the unit name. Must return a number.
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits(x => x * 2) //=> { hours: 2, minutes: 60 }
   * @example Duration.fromObject({ hours: 1, minutes: 30 }).mapUnits((x, u) => u === "hours" ? x * 2 : x) //=> { hours: 2, minutes: 30 }
   * @return {Duration}
   */
  mapUnits(fn) {
    if (!this.isValid) return this;
    const result = {};
    for (const k2 of Object.keys(this.values)) {
      result[k2] = asNumber(fn(this.values[k2], k2));
    }
    return clone$1(this, { values: result }, true);
  }
  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example Duration.fromObject({years: 2, days: 3}).get('years') //=> 2
   * @example Duration.fromObject({years: 2, days: 3}).get('months') //=> 0
   * @example Duration.fromObject({years: 2, days: 3}).get('days') //=> 3
   * @return {number}
   */
  get(unit) {
    return this[Duration.normalizeUnit(unit)];
  }
  /**
   * "Set" the values of specified units. Return a newly-constructed Duration.
   * @param {Object} values - a mapping of units to numbers
   * @example dur.set({ years: 2017 })
   * @example dur.set({ hours: 8, minutes: 30 })
   * @return {Duration}
   */
  set(values) {
    if (!this.isValid) return this;
    const mixed = { ...this.values, ...normalizeObject(values, Duration.normalizeUnit) };
    return clone$1(this, { values: mixed });
  }
  /**
   * "Set" the locale and/or numberingSystem.  Returns a newly-constructed Duration.
   * @example dur.reconfigure({ locale: 'en-GB' })
   * @return {Duration}
   */
  reconfigure({ locale, numberingSystem, conversionAccuracy, matrix } = {}) {
    const loc = this.loc.clone({ locale, numberingSystem });
    const opts = { loc, matrix, conversionAccuracy };
    return clone$1(this, opts);
  }
  /**
   * Return the length of the duration in the specified unit.
   * @param {string} unit - a unit such as 'minutes' or 'days'
   * @example Duration.fromObject({years: 1}).as('days') //=> 365
   * @example Duration.fromObject({years: 1}).as('months') //=> 12
   * @example Duration.fromObject({hours: 60}).as('days') //=> 2.5
   * @return {number}
   */
  as(unit) {
    return this.isValid ? this.shiftTo(unit).get(unit) : NaN;
  }
  /**
   * Reduce this Duration to its canonical representation in its current units.
   * Assuming the overall value of the Duration is positive, this means:
   * - excessive values for lower-order units are converted to higher-order units (if possible, see first and second example)
   * - negative lower-order units are converted to higher order units (there must be such a higher order unit, otherwise
   *   the overall value would be negative, see third example)
   * - fractional values for higher-order units are converted to lower-order units (if possible, see fourth example)
   *
   * If the overall value is negative, the result of this method is equivalent to `this.negate().normalize().negate()`.
   * @example Duration.fromObject({ years: 2, days: 5000 }).normalize().toObject() //=> { years: 15, days: 255 }
   * @example Duration.fromObject({ days: 5000 }).normalize().toObject() //=> { days: 5000 }
   * @example Duration.fromObject({ hours: 12, minutes: -45 }).normalize().toObject() //=> { hours: 11, minutes: 15 }
   * @example Duration.fromObject({ years: 2.5, days: 0, hours: 0 }).normalize().toObject() //=> { years: 2, days: 182, hours: 12 }
   * @return {Duration}
   */
  normalize() {
    if (!this.isValid) return this;
    const vals = this.toObject();
    normalizeValues(this.matrix, vals);
    return clone$1(this, { values: vals }, true);
  }
  /**
   * Rescale units to its largest representation
   * @example Duration.fromObject({ milliseconds: 90000 }).rescale().toObject() //=> { minutes: 1, seconds: 30 }
   * @return {Duration}
   */
  rescale() {
    if (!this.isValid) return this;
    const vals = removeZeroes(this.normalize().shiftToAll().toObject());
    return clone$1(this, { values: vals }, true);
  }
  /**
   * Convert this Duration into its representation in a different set of units.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).shiftTo('minutes', 'milliseconds').toObject() //=> { minutes: 60, milliseconds: 30000 }
   * @return {Duration}
   */
  shiftTo(...units) {
    if (!this.isValid) return this;
    if (units.length === 0) {
      return this;
    }
    units = units.map((u2) => Duration.normalizeUnit(u2));
    const built = {}, accumulated = {}, vals = this.toObject();
    let lastUnit;
    for (const k2 of orderedUnits$1) {
      if (units.indexOf(k2) >= 0) {
        lastUnit = k2;
        let own = 0;
        for (const ak in accumulated) {
          own += this.matrix[ak][k2] * accumulated[ak];
          accumulated[ak] = 0;
        }
        if (isNumber(vals[k2])) {
          own += vals[k2];
        }
        const i2 = Math.trunc(own);
        built[k2] = i2;
        accumulated[k2] = (own * 1e3 - i2 * 1e3) / 1e3;
      } else if (isNumber(vals[k2])) {
        accumulated[k2] = vals[k2];
      }
    }
    for (const key in accumulated) {
      if (accumulated[key] !== 0) {
        built[lastUnit] += key === lastUnit ? accumulated[key] : accumulated[key] / this.matrix[lastUnit][key];
      }
    }
    normalizeValues(this.matrix, built);
    return clone$1(this, { values: built }, true);
  }
  /**
   * Shift this Duration to all available units.
   * Same as shiftTo("years", "months", "weeks", "days", "hours", "minutes", "seconds", "milliseconds")
   * @return {Duration}
   */
  shiftToAll() {
    if (!this.isValid) return this;
    return this.shiftTo(
      "years",
      "months",
      "weeks",
      "days",
      "hours",
      "minutes",
      "seconds",
      "milliseconds"
    );
  }
  /**
   * Return the negative of this Duration.
   * @example Duration.fromObject({ hours: 1, seconds: 30 }).negate().toObject() //=> { hours: -1, seconds: -30 }
   * @return {Duration}
   */
  negate() {
    if (!this.isValid) return this;
    const negated = {};
    for (const k2 of Object.keys(this.values)) {
      negated[k2] = this.values[k2] === 0 ? 0 : -this.values[k2];
    }
    return clone$1(this, { values: negated }, true);
  }
  /**
   * Removes all units with values equal to 0 from this Duration.
   * @example Duration.fromObject({ years: 2, days: 0, hours: 0, minutes: 0 }).removeZeros().toObject() //=> { years: 2 }
   * @return {Duration}
   */
  removeZeros() {
    if (!this.isValid) return this;
    const vals = removeZeroes(this.values);
    return clone$1(this, { values: vals }, true);
  }
  /**
   * Get the years.
   * @type {number}
   */
  get years() {
    return this.isValid ? this.values.years || 0 : NaN;
  }
  /**
   * Get the quarters.
   * @type {number}
   */
  get quarters() {
    return this.isValid ? this.values.quarters || 0 : NaN;
  }
  /**
   * Get the months.
   * @type {number}
   */
  get months() {
    return this.isValid ? this.values.months || 0 : NaN;
  }
  /**
   * Get the weeks
   * @type {number}
   */
  get weeks() {
    return this.isValid ? this.values.weeks || 0 : NaN;
  }
  /**
   * Get the days.
   * @type {number}
   */
  get days() {
    return this.isValid ? this.values.days || 0 : NaN;
  }
  /**
   * Get the hours.
   * @type {number}
   */
  get hours() {
    return this.isValid ? this.values.hours || 0 : NaN;
  }
  /**
   * Get the minutes.
   * @type {number}
   */
  get minutes() {
    return this.isValid ? this.values.minutes || 0 : NaN;
  }
  /**
   * Get the seconds.
   * @return {number}
   */
  get seconds() {
    return this.isValid ? this.values.seconds || 0 : NaN;
  }
  /**
   * Get the milliseconds.
   * @return {number}
   */
  get milliseconds() {
    return this.isValid ? this.values.milliseconds || 0 : NaN;
  }
  /**
   * Returns whether the Duration is invalid. Invalid durations are returned by diff operations
   * on invalid DateTimes or Intervals.
   * @return {boolean}
   */
  get isValid() {
    return this.invalid === null;
  }
  /**
   * Returns an error code if this Duration became invalid, or null if the Duration is valid
   * @return {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this Duration became invalid, or null if the Duration is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Equality check
   * Two Durations are equal iff they have the same units and the same values for each unit.
   * @param {Duration} other
   * @return {boolean}
   */
  equals(other) {
    if (!this.isValid || !other.isValid) {
      return false;
    }
    if (!this.loc.equals(other.loc)) {
      return false;
    }
    function eq(v1, v2) {
      if (v1 === void 0 || v1 === 0) return v2 === void 0 || v2 === 0;
      return v1 === v2;
    }
    for (const u2 of orderedUnits$1) {
      if (!eq(this.values[u2], other.values[u2])) {
        return false;
      }
    }
    return true;
  }
}
const INVALID$1 = "Invalid Interval";
function validateStartEnd(start, end) {
  if (!start || !start.isValid) {
    return Interval.invalid("missing or invalid start");
  } else if (!end || !end.isValid) {
    return Interval.invalid("missing or invalid end");
  } else if (end < start) {
    return Interval.invalid(
      "end before start",
      `The end of an interval must be after its start, but you had start=${start.toISO()} and end=${end.toISO()}`
    );
  } else {
    return null;
  }
}
class Interval {
  /**
   * @private
   */
  constructor(config) {
    this.s = config.start;
    this.e = config.end;
    this.invalid = config.invalid || null;
    this.isLuxonInterval = true;
  }
  /**
   * Create an invalid Interval.
   * @param {string} reason - simple string of why this Interval is invalid. Should not contain parameters or anything else data-dependent
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {Interval}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the Interval is invalid");
    }
    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
    if (Settings.throwOnInvalid) {
      throw new InvalidIntervalError(invalid);
    } else {
      return new Interval({ invalid });
    }
  }
  /**
   * Create an Interval from a start DateTime and an end DateTime. Inclusive of the start but not the end.
   * @param {DateTime|Date|Object} start
   * @param {DateTime|Date|Object} end
   * @return {Interval}
   */
  static fromDateTimes(start, end) {
    const builtStart = friendlyDateTime(start), builtEnd = friendlyDateTime(end);
    const validateError = validateStartEnd(builtStart, builtEnd);
    if (validateError == null) {
      return new Interval({
        start: builtStart,
        end: builtEnd
      });
    } else {
      return validateError;
    }
  }
  /**
   * Create an Interval from a start DateTime and a Duration to extend to.
   * @param {DateTime|Date|Object} start
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static after(start, duration) {
    const dur = Duration.fromDurationLike(duration), dt = friendlyDateTime(start);
    return Interval.fromDateTimes(dt, dt.plus(dur));
  }
  /**
   * Create an Interval from an end DateTime and a Duration to extend backwards to.
   * @param {DateTime|Date|Object} end
   * @param {Duration|Object|number} duration - the length of the Interval.
   * @return {Interval}
   */
  static before(end, duration) {
    const dur = Duration.fromDurationLike(duration), dt = friendlyDateTime(end);
    return Interval.fromDateTimes(dt.minus(dur), dt);
  }
  /**
   * Create an Interval from an ISO 8601 string.
   * Accepts `<start>/<end>`, `<start>/<duration>`, and `<duration>/<end>` formats.
   * @param {string} text - the ISO string to parse
   * @param {Object} [opts] - options to pass {@link DateTime#fromISO} and optionally {@link Duration#fromISO}
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {Interval}
   */
  static fromISO(text, opts) {
    const [s2, e2] = (text || "").split("/", 2);
    if (s2 && e2) {
      let start, startIsValid;
      try {
        start = DateTime.fromISO(s2, opts);
        startIsValid = start.isValid;
      } catch (e3) {
        startIsValid = false;
      }
      let end, endIsValid;
      try {
        end = DateTime.fromISO(e2, opts);
        endIsValid = end.isValid;
      } catch (e3) {
        endIsValid = false;
      }
      if (startIsValid && endIsValid) {
        return Interval.fromDateTimes(start, end);
      }
      if (startIsValid) {
        const dur = Duration.fromISO(e2, opts);
        if (dur.isValid) {
          return Interval.after(start, dur);
        }
      } else if (endIsValid) {
        const dur = Duration.fromISO(s2, opts);
        if (dur.isValid) {
          return Interval.before(end, dur);
        }
      }
    }
    return Interval.invalid("unparsable", `the input "${text}" can't be parsed as ISO 8601`);
  }
  /**
   * Check if an object is an Interval. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isInterval(o2) {
    return o2 && o2.isLuxonInterval || false;
  }
  /**
   * Returns the start of the Interval
   * @type {DateTime}
   */
  get start() {
    return this.isValid ? this.s : null;
  }
  /**
   * Returns the end of the Interval. This is the first instant which is not part of the interval
   * (Interval is half-open).
   * @type {DateTime}
   */
  get end() {
    return this.isValid ? this.e : null;
  }
  /**
   * Returns the last DateTime included in the interval (since end is not part of the interval)
   * @type {DateTime}
   */
  get lastDateTime() {
    return this.isValid ? this.e ? this.e.minus(1) : null : null;
  }
  /**
   * Returns whether this Interval's end is at least its start, meaning that the Interval isn't 'backwards'.
   * @type {boolean}
   */
  get isValid() {
    return this.invalidReason === null;
  }
  /**
   * Returns an error code if this Interval is invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this Interval became invalid, or null if the Interval is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Returns the length of the Interval in the specified unit.
   * @param {string} unit - the unit (such as 'hours' or 'days') to return the length in.
   * @return {number}
   */
  length(unit = "milliseconds") {
    return this.isValid ? this.toDuration(...[unit]).get(unit) : NaN;
  }
  /**
   * Returns the count of minutes, hours, days, months, or years included in the Interval, even in part.
   * Unlike {@link Interval#length} this counts sections of the calendar, not periods of time, e.g. specifying 'day'
   * asks 'what dates are included in this interval?', not 'how many days long is this interval?'
   * @param {string} [unit='milliseconds'] - the unit of time to count.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; this operation will always use the locale of the start DateTime
   * @return {number}
   */
  count(unit = "milliseconds", opts) {
    if (!this.isValid) return NaN;
    const start = this.start.startOf(unit, opts);
    let end;
    if (opts == null ? void 0 : opts.useLocaleWeeks) {
      end = this.end.reconfigure({ locale: start.locale });
    } else {
      end = this.end;
    }
    end = end.startOf(unit, opts);
    return Math.floor(end.diff(start, unit).get(unit)) + (end.valueOf() !== this.end.valueOf());
  }
  /**
   * Returns whether this Interval's start and end are both in the same unit of time
   * @param {string} unit - the unit of time to check sameness on
   * @return {boolean}
   */
  hasSame(unit) {
    return this.isValid ? this.isEmpty() || this.e.minus(1).hasSame(this.s, unit) : false;
  }
  /**
   * Return whether this Interval has the same start and end DateTimes.
   * @return {boolean}
   */
  isEmpty() {
    return this.s.valueOf() === this.e.valueOf();
  }
  /**
   * Return whether this Interval's start is after the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isAfter(dateTime) {
    if (!this.isValid) return false;
    return this.s > dateTime;
  }
  /**
   * Return whether this Interval's end is before the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  isBefore(dateTime) {
    if (!this.isValid) return false;
    return this.e <= dateTime;
  }
  /**
   * Return whether this Interval contains the specified DateTime.
   * @param {DateTime} dateTime
   * @return {boolean}
   */
  contains(dateTime) {
    if (!this.isValid) return false;
    return this.s <= dateTime && this.e > dateTime;
  }
  /**
   * "Sets" the start and/or end dates. Returns a newly-constructed Interval.
   * @param {Object} values - the values to set
   * @param {DateTime} values.start - the starting DateTime
   * @param {DateTime} values.end - the ending DateTime
   * @return {Interval}
   */
  set({ start, end } = {}) {
    if (!this.isValid) return this;
    return Interval.fromDateTimes(start || this.s, end || this.e);
  }
  /**
   * Split this Interval at each of the specified DateTimes
   * @param {...DateTime} dateTimes - the unit of time to count.
   * @return {Array}
   */
  splitAt(...dateTimes) {
    if (!this.isValid) return [];
    const sorted = dateTimes.map(friendlyDateTime).filter((d2) => this.contains(d2)).sort((a2, b2) => a2.toMillis() - b2.toMillis()), results = [];
    let { s: s2 } = this, i2 = 0;
    while (s2 < this.e) {
      const added = sorted[i2] || this.e, next = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s2, next));
      s2 = next;
      i2 += 1;
    }
    return results;
  }
  /**
   * Split this Interval into smaller Intervals, each of the specified length.
   * Left over time is grouped into a smaller interval
   * @param {Duration|Object|number} duration - The length of each resulting interval.
   * @return {Array}
   */
  splitBy(duration) {
    const dur = Duration.fromDurationLike(duration);
    if (!this.isValid || !dur.isValid || dur.as("milliseconds") === 0) {
      return [];
    }
    let { s: s2 } = this, idx = 1, next;
    const results = [];
    while (s2 < this.e) {
      const added = this.start.plus(dur.mapUnits((x2) => x2 * idx));
      next = +added > +this.e ? this.e : added;
      results.push(Interval.fromDateTimes(s2, next));
      s2 = next;
      idx += 1;
    }
    return results;
  }
  /**
   * Split this Interval into the specified number of smaller intervals.
   * @param {number} numberOfParts - The number of Intervals to divide the Interval into.
   * @return {Array}
   */
  divideEqually(numberOfParts) {
    if (!this.isValid) return [];
    return this.splitBy(this.length() / numberOfParts).slice(0, numberOfParts);
  }
  /**
   * Return whether this Interval overlaps with the specified Interval
   * @param {Interval} other
   * @return {boolean}
   */
  overlaps(other) {
    return this.e > other.s && this.s < other.e;
  }
  /**
   * Return whether this Interval's end is adjacent to the specified Interval's start.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsStart(other) {
    if (!this.isValid) return false;
    return +this.e === +other.s;
  }
  /**
   * Return whether this Interval's start is adjacent to the specified Interval's end.
   * @param {Interval} other
   * @return {boolean}
   */
  abutsEnd(other) {
    if (!this.isValid) return false;
    return +other.e === +this.s;
  }
  /**
   * Returns true if this Interval fully contains the specified Interval, specifically if the intersect (of this Interval and the other Interval) is equal to the other Interval; false otherwise.
   * @param {Interval} other
   * @return {boolean}
   */
  engulfs(other) {
    if (!this.isValid) return false;
    return this.s <= other.s && this.e >= other.e;
  }
  /**
   * Return whether this Interval has the same start and end as the specified Interval.
   * @param {Interval} other
   * @return {boolean}
   */
  equals(other) {
    if (!this.isValid || !other.isValid) {
      return false;
    }
    return this.s.equals(other.s) && this.e.equals(other.e);
  }
  /**
   * Return an Interval representing the intersection of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the maximum start time and the minimum end time of the two Intervals.
   * Returns null if the intersection is empty, meaning, the intervals don't intersect.
   * @param {Interval} other
   * @return {Interval}
   */
  intersection(other) {
    if (!this.isValid) return this;
    const s2 = this.s > other.s ? this.s : other.s, e2 = this.e < other.e ? this.e : other.e;
    if (s2 >= e2) {
      return null;
    } else {
      return Interval.fromDateTimes(s2, e2);
    }
  }
  /**
   * Return an Interval representing the union of this Interval and the specified Interval.
   * Specifically, the resulting Interval has the minimum start time and the maximum end time of the two Intervals.
   * @param {Interval} other
   * @return {Interval}
   */
  union(other) {
    if (!this.isValid) return this;
    const s2 = this.s < other.s ? this.s : other.s, e2 = this.e > other.e ? this.e : other.e;
    return Interval.fromDateTimes(s2, e2);
  }
  /**
   * Merge an array of Intervals into an equivalent minimal set of Intervals.
   * Combines overlapping and adjacent Intervals.
   * The resulting array will contain the Intervals in ascending order, that is, starting with the earliest Interval
   * and ending with the latest.
   *
   * @param {Array} intervals
   * @return {Array}
   */
  static merge(intervals) {
    const [found, final] = intervals.sort((a2, b2) => a2.s - b2.s).reduce(
      ([sofar, current], item) => {
        if (!current) {
          return [sofar, item];
        } else if (current.overlaps(item) || current.abutsStart(item)) {
          return [sofar, current.union(item)];
        } else {
          return [sofar.concat([current]), item];
        }
      },
      [[], null]
    );
    if (final) {
      found.push(final);
    }
    return found;
  }
  /**
   * Return an array of Intervals representing the spans of time that only appear in one of the specified Intervals.
   * @param {Array} intervals
   * @return {Array}
   */
  static xor(intervals) {
    let start = null, currentCount = 0;
    const results = [], ends = intervals.map((i2) => [
      { time: i2.s, type: "s" },
      { time: i2.e, type: "e" }
    ]), flattened = Array.prototype.concat(...ends), arr = flattened.sort((a2, b2) => a2.time - b2.time);
    for (const i2 of arr) {
      currentCount += i2.type === "s" ? 1 : -1;
      if (currentCount === 1) {
        start = i2.time;
      } else {
        if (start && +start !== +i2.time) {
          results.push(Interval.fromDateTimes(start, i2.time));
        }
        start = null;
      }
    }
    return Interval.merge(results);
  }
  /**
   * Return an Interval representing the span of time in this Interval that doesn't overlap with any of the specified Intervals.
   * @param {...Interval} intervals
   * @return {Array}
   */
  difference(...intervals) {
    return Interval.xor([this].concat(intervals)).map((i2) => this.intersection(i2)).filter((i2) => i2 && !i2.isEmpty());
  }
  /**
   * Returns a string representation of this Interval appropriate for debugging.
   * @return {string}
   */
  toString() {
    if (!this.isValid) return INVALID$1;
    return `[${this.s.toISO()} – ${this.e.toISO()})`;
  }
  /**
   * Returns a string representation of this Interval appropriate for the REPL.
   * @return {string}
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    if (this.isValid) {
      return `Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`;
    } else {
      return `Interval { Invalid, reason: ${this.invalidReason} }`;
    }
  }
  /**
   * Returns a localized string representing this Interval. Accepts the same options as the
   * Intl.DateTimeFormat constructor and any presets defined by Luxon, such as
   * {@link DateTime.DATE_FULL} or {@link DateTime.TIME_SIMPLE}. The exact behavior of this method
   * is browser-specific, but in general it will return an appropriate representation of the
   * Interval in the assigned locale. Defaults to the system's locale if no locale has been
   * specified.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {Object} [formatOpts=DateTime.DATE_SHORT] - Either a DateTime preset or
   * Intl.DateTimeFormat constructor options.
   * @param {Object} opts - Options to override the configuration of the start DateTime.
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(); //=> 11/7/2022 – 11/8/2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL); //=> November 7 – 8, 2022
   * @example Interval.fromISO('2022-11-07T09:00Z/2022-11-08T09:00Z').toLocaleString(DateTime.DATE_FULL, { locale: 'fr-FR' }); //=> 7–8 novembre 2022
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString(DateTime.TIME_SIMPLE); //=> 6:00 – 8:00 PM
   * @example Interval.fromISO('2022-11-07T17:00Z/2022-11-07T19:00Z').toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> Mon, Nov 07, 6:00 – 8:00 p
   * @return {string}
   */
  toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
    return this.isValid ? Formatter.create(this.s.loc.clone(opts), formatOpts).formatInterval(this) : INVALID$1;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this Interval.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISO(opts) {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toISO(opts)}/${this.e.toISO(opts)}`;
  }
  /**
   * Returns an ISO 8601-compliant string representation of date of this Interval.
   * The time components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @return {string}
   */
  toISODate() {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toISODate()}/${this.e.toISODate()}`;
  }
  /**
   * Returns an ISO 8601-compliant string representation of time of this Interval.
   * The date components are ignored.
   * @see https://en.wikipedia.org/wiki/ISO_8601#Time_intervals
   * @param {Object} opts - The same options as {@link DateTime#toISO}
   * @return {string}
   */
  toISOTime(opts) {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toISOTime(opts)}/${this.e.toISOTime(opts)}`;
  }
  /**
   * Returns a string representation of this Interval formatted according to the specified format
   * string. **You may not want this.** See {@link Interval#toLocaleString} for a more flexible
   * formatting tool.
   * @param {string} dateFormat - The format string. This string formats the start and end time.
   * See {@link DateTime#toFormat} for details.
   * @param {Object} opts - Options.
   * @param {string} [opts.separator =  ' – '] - A separator to place between the start and end
   * representations.
   * @return {string}
   */
  toFormat(dateFormat, { separator = " – " } = {}) {
    if (!this.isValid) return INVALID$1;
    return `${this.s.toFormat(dateFormat)}${separator}${this.e.toFormat(dateFormat)}`;
  }
  /**
   * Return a Duration representing the time spanned by this interval.
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example Interval.fromDateTimes(dt1, dt2).toDuration().toObject() //=> { milliseconds: 88489257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('days').toObject() //=> { days: 1.0241812152777778 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes']).toObject() //=> { hours: 24, minutes: 34.82095 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration(['hours', 'minutes', 'seconds']).toObject() //=> { hours: 24, minutes: 34, seconds: 49.257 }
   * @example Interval.fromDateTimes(dt1, dt2).toDuration('seconds').toObject() //=> { seconds: 88489.257 }
   * @return {Duration}
   */
  toDuration(unit, opts) {
    if (!this.isValid) {
      return Duration.invalid(this.invalidReason);
    }
    return this.e.diff(this.s, unit, opts);
  }
  /**
   * Run mapFn on the interval start and end, returning a new Interval from the resulting DateTimes
   * @param {function} mapFn
   * @return {Interval}
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.toUTC())
   * @example Interval.fromDateTimes(dt1, dt2).mapEndpoints(endpoint => endpoint.plus({ hours: 2 }))
   */
  mapEndpoints(mapFn) {
    return Interval.fromDateTimes(mapFn(this.s), mapFn(this.e));
  }
}
class Info {
  /**
   * Return whether the specified zone contains a DST.
   * @param {string|Zone} [zone='local'] - Zone to check. Defaults to the environment's local zone.
   * @return {boolean}
   */
  static hasDST(zone = Settings.defaultZone) {
    const proto = DateTime.now().setZone(zone).set({ month: 12 });
    return !zone.isUniversal && proto.offset !== proto.set({ month: 6 }).offset;
  }
  /**
   * Return whether the specified zone is a valid IANA specifier.
   * @param {string} zone - Zone to check
   * @return {boolean}
   */
  static isValidIANAZone(zone) {
    return IANAZone.isValidZone(zone);
  }
  /**
   * Converts the input into a {@link Zone} instance.
   *
   * * If `input` is already a Zone instance, it is returned unchanged.
   * * If `input` is a string containing a valid time zone name, a Zone instance
   *   with that name is returned.
   * * If `input` is a string that doesn't refer to a known time zone, a Zone
   *   instance with {@link Zone#isValid} == false is returned.
   * * If `input is a number, a Zone instance with the specified fixed offset
   *   in minutes is returned.
   * * If `input` is `null` or `undefined`, the default zone is returned.
   * @param {string|Zone|number} [input] - the value to be converted
   * @return {Zone}
   */
  static normalizeZone(input) {
    return normalizeZone(input, Settings.defaultZone);
  }
  /**
   * Get the weekday on which the week starts according to the given locale.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number} the start of the week, 1 for Monday through 7 for Sunday
   */
  static getStartOfWeek({ locale = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale)).getStartOfWeek();
  }
  /**
   * Get the minimum number of days necessary in a week before it is considered part of the next year according
   * to the given locale.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number}
   */
  static getMinimumDaysInFirstWeek({ locale = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale)).getMinDaysInFirstWeek();
  }
  /**
   * Get the weekdays, which are considered the weekend according to the given locale
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @returns {number[]} an array of weekdays, 1 for Monday through 7 for Sunday
   */
  static getWeekendWeekdays({ locale = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale)).getWeekendDays().slice();
  }
  /**
   * Return an array of standalone month names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @example Info.months()[0] //=> 'January'
   * @example Info.months('short')[0] //=> 'Jan'
   * @example Info.months('numeric')[0] //=> '1'
   * @example Info.months('short', { locale: 'fr-CA' } )[0] //=> 'janv.'
   * @example Info.months('numeric', { locale: 'ar' })[0] //=> '١'
   * @example Info.months('long', { outputCalendar: 'islamic' })[0] //=> 'Rabiʻ I'
   * @return {Array}
   */
  static months(length = "long", { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length);
  }
  /**
   * Return an array of format month names.
   * Format months differ from standalone months in that they're meant to appear next to the day of the month. In some languages, that
   * changes the string.
   * See {@link Info#months}
   * @param {string} [length='long'] - the length of the month representation, such as "numeric", "2-digit", "narrow", "short", "long"
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @param {string} [opts.outputCalendar='gregory'] - the calendar
   * @return {Array}
   */
  static monthsFormat(length = "long", { locale = null, numberingSystem = null, locObj = null, outputCalendar = "gregory" } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, outputCalendar)).months(length, true);
  }
  /**
   * Return an array of standalone week names.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param {string} [length='long'] - the length of the weekday representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @example Info.weekdays()[0] //=> 'Monday'
   * @example Info.weekdays('short')[0] //=> 'Mon'
   * @example Info.weekdays('short', { locale: 'fr-CA' })[0] //=> 'lun.'
   * @example Info.weekdays('short', { locale: 'ar' })[0] //=> 'الاثنين'
   * @return {Array}
   */
  static weekdays(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length);
  }
  /**
   * Return an array of format week names.
   * Format weekdays differ from standalone weekdays in that they're meant to appear next to more date information. In some languages, that
   * changes the string.
   * See {@link Info#weekdays}
   * @param {string} [length='long'] - the length of the month representation, such as "narrow", "short", "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale=null] - the locale code
   * @param {string} [opts.numberingSystem=null] - the numbering system
   * @param {string} [opts.locObj=null] - an existing locale object to use
   * @return {Array}
   */
  static weekdaysFormat(length = "long", { locale = null, numberingSystem = null, locObj = null } = {}) {
    return (locObj || Locale.create(locale, numberingSystem, null)).weekdays(length, true);
  }
  /**
   * Return an array of meridiems.
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.meridiems() //=> [ 'AM', 'PM' ]
   * @example Info.meridiems({ locale: 'my' }) //=> [ 'နံနက်', 'ညနေ' ]
   * @return {Array}
   */
  static meridiems({ locale = null } = {}) {
    return Locale.create(locale).meridiems();
  }
  /**
   * Return an array of eras, such as ['BC', 'AD']. The locale can be specified, but the calendar system is always Gregorian.
   * @param {string} [length='short'] - the length of the era representation, such as "short" or "long".
   * @param {Object} opts - options
   * @param {string} [opts.locale] - the locale code
   * @example Info.eras() //=> [ 'BC', 'AD' ]
   * @example Info.eras('long') //=> [ 'Before Christ', 'Anno Domini' ]
   * @example Info.eras('long', { locale: 'fr' }) //=> [ 'avant Jésus-Christ', 'après Jésus-Christ' ]
   * @return {Array}
   */
  static eras(length = "short", { locale = null } = {}) {
    return Locale.create(locale, null, "gregory").eras(length);
  }
  /**
   * Return the set of available features in this environment.
   * Some features of Luxon are not available in all environments. For example, on older browsers, relative time formatting support is not available. Use this function to figure out if that's the case.
   * Keys:
   * * `relative`: whether this environment supports relative time formatting
   * * `localeWeek`: whether this environment supports different weekdays for the start of the week based on the locale
   * @example Info.features() //=> { relative: false, localeWeek: true }
   * @return {Object}
   */
  static features() {
    return { relative: hasRelative(), localeWeek: hasLocaleWeekInfo() };
  }
}
function dayDiff(earlier, later) {
  const utcDayStart = (dt) => dt.toUTC(0, { keepLocalTime: true }).startOf("day").valueOf(), ms = utcDayStart(later) - utcDayStart(earlier);
  return Math.floor(Duration.fromMillis(ms).as("days"));
}
function highOrderDiffs(cursor, later, units) {
  const differs = [
    ["years", (a2, b2) => b2.year - a2.year],
    ["quarters", (a2, b2) => b2.quarter - a2.quarter + (b2.year - a2.year) * 4],
    ["months", (a2, b2) => b2.month - a2.month + (b2.year - a2.year) * 12],
    [
      "weeks",
      (a2, b2) => {
        const days = dayDiff(a2, b2);
        return (days - days % 7) / 7;
      }
    ],
    ["days", dayDiff]
  ];
  const results = {};
  const earlier = cursor;
  let lowestOrder, highWater;
  for (const [unit, differ] of differs) {
    if (units.indexOf(unit) >= 0) {
      lowestOrder = unit;
      results[unit] = differ(cursor, later);
      highWater = earlier.plus(results);
      if (highWater > later) {
        results[unit]--;
        cursor = earlier.plus(results);
        if (cursor > later) {
          highWater = cursor;
          results[unit]--;
          cursor = earlier.plus(results);
        }
      } else {
        cursor = highWater;
      }
    }
  }
  return [cursor, results, highWater, lowestOrder];
}
function diff(earlier, later, units, opts) {
  let [cursor, results, highWater, lowestOrder] = highOrderDiffs(earlier, later, units);
  const remainingMillis = later - cursor;
  const lowerOrderUnits = units.filter(
    (u2) => ["hours", "minutes", "seconds", "milliseconds"].indexOf(u2) >= 0
  );
  if (lowerOrderUnits.length === 0) {
    if (highWater < later) {
      highWater = cursor.plus({ [lowestOrder]: 1 });
    }
    if (highWater !== cursor) {
      results[lowestOrder] = (results[lowestOrder] || 0) + remainingMillis / (highWater - cursor);
    }
  }
  const duration = Duration.fromObject(results, opts);
  if (lowerOrderUnits.length > 0) {
    return Duration.fromMillis(remainingMillis, opts).shiftTo(...lowerOrderUnits).plus(duration);
  } else {
    return duration;
  }
}
const MISSING_FTP = "missing Intl.DateTimeFormat.formatToParts support";
function intUnit(regex, post = (i2) => i2) {
  return { regex, deser: ([s2]) => post(parseDigits(s2)) };
}
const NBSP = String.fromCharCode(160);
const spaceOrNBSP = `[ ${NBSP}]`;
const spaceOrNBSPRegExp = new RegExp(spaceOrNBSP, "g");
function fixListRegex(s2) {
  return s2.replace(/\./g, "\\.?").replace(spaceOrNBSPRegExp, spaceOrNBSP);
}
function stripInsensitivities(s2) {
  return s2.replace(/\./g, "").replace(spaceOrNBSPRegExp, " ").toLowerCase();
}
function oneOf(strings, startIndex) {
  if (strings === null) {
    return null;
  } else {
    return {
      regex: RegExp(strings.map(fixListRegex).join("|")),
      deser: ([s2]) => strings.findIndex((i2) => stripInsensitivities(s2) === stripInsensitivities(i2)) + startIndex
    };
  }
}
function offset(regex, groups) {
  return { regex, deser: ([, h3, m2]) => signedOffset(h3, m2), groups };
}
function simple(regex) {
  return { regex, deser: ([s2]) => s2 };
}
function escapeToken(value) {
  return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
}
function unitForToken(token, loc) {
  const one = digitRegex(loc), two = digitRegex(loc, "{2}"), three = digitRegex(loc, "{3}"), four = digitRegex(loc, "{4}"), six = digitRegex(loc, "{6}"), oneOrTwo = digitRegex(loc, "{1,2}"), oneToThree = digitRegex(loc, "{1,3}"), oneToSix = digitRegex(loc, "{1,6}"), oneToNine = digitRegex(loc, "{1,9}"), twoToFour = digitRegex(loc, "{2,4}"), fourToSix = digitRegex(loc, "{4,6}"), literal = (t3) => ({ regex: RegExp(escapeToken(t3.val)), deser: ([s2]) => s2, literal: true }), unitate = (t3) => {
    if (token.literal) {
      return literal(t3);
    }
    switch (t3.val) {
      case "G":
        return oneOf(loc.eras("short"), 0);
      case "GG":
        return oneOf(loc.eras("long"), 0);
      case "y":
        return intUnit(oneToSix);
      case "yy":
        return intUnit(twoToFour, untruncateYear);
      case "yyyy":
        return intUnit(four);
      case "yyyyy":
        return intUnit(fourToSix);
      case "yyyyyy":
        return intUnit(six);
      case "M":
        return intUnit(oneOrTwo);
      case "MM":
        return intUnit(two);
      case "MMM":
        return oneOf(loc.months("short", true), 1);
      case "MMMM":
        return oneOf(loc.months("long", true), 1);
      case "L":
        return intUnit(oneOrTwo);
      case "LL":
        return intUnit(two);
      case "LLL":
        return oneOf(loc.months("short", false), 1);
      case "LLLL":
        return oneOf(loc.months("long", false), 1);
      case "d":
        return intUnit(oneOrTwo);
      case "dd":
        return intUnit(two);
      case "o":
        return intUnit(oneToThree);
      case "ooo":
        return intUnit(three);
      case "HH":
        return intUnit(two);
      case "H":
        return intUnit(oneOrTwo);
      case "hh":
        return intUnit(two);
      case "h":
        return intUnit(oneOrTwo);
      case "mm":
        return intUnit(two);
      case "m":
        return intUnit(oneOrTwo);
      case "q":
        return intUnit(oneOrTwo);
      case "qq":
        return intUnit(two);
      case "s":
        return intUnit(oneOrTwo);
      case "ss":
        return intUnit(two);
      case "S":
        return intUnit(oneToThree);
      case "SSS":
        return intUnit(three);
      case "u":
        return simple(oneToNine);
      case "uu":
        return simple(oneOrTwo);
      case "uuu":
        return intUnit(one);
      case "a":
        return oneOf(loc.meridiems(), 0);
      case "kkkk":
        return intUnit(four);
      case "kk":
        return intUnit(twoToFour, untruncateYear);
      case "W":
        return intUnit(oneOrTwo);
      case "WW":
        return intUnit(two);
      case "E":
      case "c":
        return intUnit(one);
      case "EEE":
        return oneOf(loc.weekdays("short", false), 1);
      case "EEEE":
        return oneOf(loc.weekdays("long", false), 1);
      case "ccc":
        return oneOf(loc.weekdays("short", true), 1);
      case "cccc":
        return oneOf(loc.weekdays("long", true), 1);
      case "Z":
      case "ZZ":
        return offset(new RegExp(`([+-]${oneOrTwo.source})(?::(${two.source}))?`), 2);
      case "ZZZ":
        return offset(new RegExp(`([+-]${oneOrTwo.source})(${two.source})?`), 2);
      case "z":
        return simple(/[a-z_+-/]{1,256}?/i);
      case " ":
        return simple(/[^\S\n\r]/);
      default:
        return literal(t3);
    }
  };
  const unit = unitate(token) || {
    invalidReason: MISSING_FTP
  };
  unit.token = token;
  return unit;
}
const partTypeStyleToTokenVal = {
  year: {
    "2-digit": "yy",
    numeric: "yyyyy"
  },
  month: {
    numeric: "M",
    "2-digit": "MM",
    short: "MMM",
    long: "MMMM"
  },
  day: {
    numeric: "d",
    "2-digit": "dd"
  },
  weekday: {
    short: "EEE",
    long: "EEEE"
  },
  dayperiod: "a",
  dayPeriod: "a",
  hour12: {
    numeric: "h",
    "2-digit": "hh"
  },
  hour24: {
    numeric: "H",
    "2-digit": "HH"
  },
  minute: {
    numeric: "m",
    "2-digit": "mm"
  },
  second: {
    numeric: "s",
    "2-digit": "ss"
  },
  timeZoneName: {
    long: "ZZZZZ",
    short: "ZZZ"
  }
};
function tokenForPart(part, formatOpts, resolvedOpts) {
  const { type, value } = part;
  if (type === "literal") {
    const isSpace = /^\s+$/.test(value);
    return {
      literal: !isSpace,
      val: isSpace ? " " : value
    };
  }
  const style = formatOpts[type];
  let actualType = type;
  if (type === "hour") {
    if (formatOpts.hour12 != null) {
      actualType = formatOpts.hour12 ? "hour12" : "hour24";
    } else if (formatOpts.hourCycle != null) {
      if (formatOpts.hourCycle === "h11" || formatOpts.hourCycle === "h12") {
        actualType = "hour12";
      } else {
        actualType = "hour24";
      }
    } else {
      actualType = resolvedOpts.hour12 ? "hour12" : "hour24";
    }
  }
  let val = partTypeStyleToTokenVal[actualType];
  if (typeof val === "object") {
    val = val[style];
  }
  if (val) {
    return {
      literal: false,
      val
    };
  }
  return void 0;
}
function buildRegex(units) {
  const re = units.map((u2) => u2.regex).reduce((f, r2) => `${f}(${r2.source})`, "");
  return [`^${re}$`, units];
}
function match(input, regex, handlers) {
  const matches = input.match(regex);
  if (matches) {
    const all = {};
    let matchIndex = 1;
    for (const i2 in handlers) {
      if (hasOwnProperty(handlers, i2)) {
        const h3 = handlers[i2], groups = h3.groups ? h3.groups + 1 : 1;
        if (!h3.literal && h3.token) {
          all[h3.token.val[0]] = h3.deser(matches.slice(matchIndex, matchIndex + groups));
        }
        matchIndex += groups;
      }
    }
    return [matches, all];
  } else {
    return [matches, {}];
  }
}
function dateTimeFromMatches(matches) {
  const toField = (token) => {
    switch (token) {
      case "S":
        return "millisecond";
      case "s":
        return "second";
      case "m":
        return "minute";
      case "h":
      case "H":
        return "hour";
      case "d":
        return "day";
      case "o":
        return "ordinal";
      case "L":
      case "M":
        return "month";
      case "y":
        return "year";
      case "E":
      case "c":
        return "weekday";
      case "W":
        return "weekNumber";
      case "k":
        return "weekYear";
      case "q":
        return "quarter";
      default:
        return null;
    }
  };
  let zone = null;
  let specificOffset;
  if (!isUndefined(matches.z)) {
    zone = IANAZone.create(matches.z);
  }
  if (!isUndefined(matches.Z)) {
    if (!zone) {
      zone = new FixedOffsetZone(matches.Z);
    }
    specificOffset = matches.Z;
  }
  if (!isUndefined(matches.q)) {
    matches.M = (matches.q - 1) * 3 + 1;
  }
  if (!isUndefined(matches.h)) {
    if (matches.h < 12 && matches.a === 1) {
      matches.h += 12;
    } else if (matches.h === 12 && matches.a === 0) {
      matches.h = 0;
    }
  }
  if (matches.G === 0 && matches.y) {
    matches.y = -matches.y;
  }
  if (!isUndefined(matches.u)) {
    matches.S = parseMillis(matches.u);
  }
  const vals = Object.keys(matches).reduce((r2, k2) => {
    const f = toField(k2);
    if (f) {
      r2[f] = matches[k2];
    }
    return r2;
  }, {});
  return [vals, zone, specificOffset];
}
let dummyDateTimeCache = null;
function getDummyDateTime() {
  if (!dummyDateTimeCache) {
    dummyDateTimeCache = DateTime.fromMillis(1555555555555);
  }
  return dummyDateTimeCache;
}
function maybeExpandMacroToken(token, locale) {
  if (token.literal) {
    return token;
  }
  const formatOpts = Formatter.macroTokenToFormatOpts(token.val);
  const tokens = formatOptsToTokens(formatOpts, locale);
  if (tokens == null || tokens.includes(void 0)) {
    return token;
  }
  return tokens;
}
function expandMacroTokens(tokens, locale) {
  return Array.prototype.concat(...tokens.map((t3) => maybeExpandMacroToken(t3, locale)));
}
class TokenParser {
  constructor(locale, format) {
    this.locale = locale;
    this.format = format;
    this.tokens = expandMacroTokens(Formatter.parseFormat(format), locale);
    this.units = this.tokens.map((t3) => unitForToken(t3, locale));
    this.disqualifyingUnit = this.units.find((t3) => t3.invalidReason);
    if (!this.disqualifyingUnit) {
      const [regexString, handlers] = buildRegex(this.units);
      this.regex = RegExp(regexString, "i");
      this.handlers = handlers;
    }
  }
  explainFromTokens(input) {
    if (!this.isValid) {
      return { input, tokens: this.tokens, invalidReason: this.invalidReason };
    } else {
      const [rawMatches, matches] = match(input, this.regex, this.handlers), [result, zone, specificOffset] = matches ? dateTimeFromMatches(matches) : [null, null, void 0];
      if (hasOwnProperty(matches, "a") && hasOwnProperty(matches, "H")) {
        throw new ConflictingSpecificationError(
          "Can't include meridiem when specifying 24-hour format"
        );
      }
      return {
        input,
        tokens: this.tokens,
        regex: this.regex,
        rawMatches,
        matches,
        result,
        zone,
        specificOffset
      };
    }
  }
  get isValid() {
    return !this.disqualifyingUnit;
  }
  get invalidReason() {
    return this.disqualifyingUnit ? this.disqualifyingUnit.invalidReason : null;
  }
}
function explainFromTokens(locale, input, format) {
  const parser = new TokenParser(locale, format);
  return parser.explainFromTokens(input);
}
function parseFromTokens(locale, input, format) {
  const { result, zone, specificOffset, invalidReason } = explainFromTokens(locale, input, format);
  return [result, zone, specificOffset, invalidReason];
}
function formatOptsToTokens(formatOpts, locale) {
  if (!formatOpts) {
    return null;
  }
  const formatter = Formatter.create(locale, formatOpts);
  const df = formatter.dtFormatter(getDummyDateTime());
  const parts = df.formatToParts();
  const resolvedOpts = df.resolvedOptions();
  return parts.map((p2) => tokenForPart(p2, formatOpts, resolvedOpts));
}
const INVALID = "Invalid DateTime";
const MAX_DATE = 864e13;
function unsupportedZone(zone) {
  return new Invalid("unsupported zone", `the zone "${zone.name}" is not supported`);
}
function possiblyCachedWeekData(dt) {
  if (dt.weekData === null) {
    dt.weekData = gregorianToWeek(dt.c);
  }
  return dt.weekData;
}
function possiblyCachedLocalWeekData(dt) {
  if (dt.localWeekData === null) {
    dt.localWeekData = gregorianToWeek(
      dt.c,
      dt.loc.getMinDaysInFirstWeek(),
      dt.loc.getStartOfWeek()
    );
  }
  return dt.localWeekData;
}
function clone(inst, alts) {
  const current = {
    ts: inst.ts,
    zone: inst.zone,
    c: inst.c,
    o: inst.o,
    loc: inst.loc,
    invalid: inst.invalid
  };
  return new DateTime({ ...current, ...alts, old: current });
}
function fixOffset(localTS, o2, tz) {
  let utcGuess = localTS - o2 * 60 * 1e3;
  const o22 = tz.offset(utcGuess);
  if (o2 === o22) {
    return [utcGuess, o2];
  }
  utcGuess -= (o22 - o2) * 60 * 1e3;
  const o3 = tz.offset(utcGuess);
  if (o22 === o3) {
    return [utcGuess, o22];
  }
  return [localTS - Math.min(o22, o3) * 60 * 1e3, Math.max(o22, o3)];
}
function tsToObj(ts, offset2) {
  ts += offset2 * 60 * 1e3;
  const d2 = new Date(ts);
  return {
    year: d2.getUTCFullYear(),
    month: d2.getUTCMonth() + 1,
    day: d2.getUTCDate(),
    hour: d2.getUTCHours(),
    minute: d2.getUTCMinutes(),
    second: d2.getUTCSeconds(),
    millisecond: d2.getUTCMilliseconds()
  };
}
function objToTS(obj, offset2, zone) {
  return fixOffset(objToLocalTS(obj), offset2, zone);
}
function adjustTime(inst, dur) {
  const oPre = inst.o, year = inst.c.year + Math.trunc(dur.years), month = inst.c.month + Math.trunc(dur.months) + Math.trunc(dur.quarters) * 3, c2 = {
    ...inst.c,
    year,
    month,
    day: Math.min(inst.c.day, daysInMonth(year, month)) + Math.trunc(dur.days) + Math.trunc(dur.weeks) * 7
  }, millisToAdd = Duration.fromObject({
    years: dur.years - Math.trunc(dur.years),
    quarters: dur.quarters - Math.trunc(dur.quarters),
    months: dur.months - Math.trunc(dur.months),
    weeks: dur.weeks - Math.trunc(dur.weeks),
    days: dur.days - Math.trunc(dur.days),
    hours: dur.hours,
    minutes: dur.minutes,
    seconds: dur.seconds,
    milliseconds: dur.milliseconds
  }).as("milliseconds"), localTS = objToLocalTS(c2);
  let [ts, o2] = fixOffset(localTS, oPre, inst.zone);
  if (millisToAdd !== 0) {
    ts += millisToAdd;
    o2 = inst.zone.offset(ts);
  }
  return { ts, o: o2 };
}
function parseDataToDateTime(parsed, parsedZone, opts, format, text, specificOffset) {
  const { setZone, zone } = opts;
  if (parsed && Object.keys(parsed).length !== 0 || parsedZone) {
    const interpretationZone = parsedZone || zone, inst = DateTime.fromObject(parsed, {
      ...opts,
      zone: interpretationZone,
      specificOffset
    });
    return setZone ? inst : inst.setZone(zone);
  } else {
    return DateTime.invalid(
      new Invalid("unparsable", `the input "${text}" can't be parsed as ${format}`)
    );
  }
}
function toTechFormat(dt, format, allowZ = true) {
  return dt.isValid ? Formatter.create(Locale.create("en-US"), {
    allowZ,
    forceSimple: true
  }).formatDateTimeFromString(dt, format) : null;
}
function toISODate(o2, extended, precision) {
  const longFormat = o2.c.year > 9999 || o2.c.year < 0;
  let c2 = "";
  if (longFormat && o2.c.year >= 0) c2 += "+";
  c2 += padStart(o2.c.year, longFormat ? 6 : 4);
  if (precision === "year") return c2;
  if (extended) {
    c2 += "-";
    c2 += padStart(o2.c.month);
    if (precision === "month") return c2;
    c2 += "-";
  } else {
    c2 += padStart(o2.c.month);
    if (precision === "month") return c2;
  }
  c2 += padStart(o2.c.day);
  return c2;
}
function toISOTime(o2, extended, suppressSeconds, suppressMilliseconds, includeOffset, extendedZone, precision) {
  let showSeconds = !suppressSeconds || o2.c.millisecond !== 0 || o2.c.second !== 0, c2 = "";
  switch (precision) {
    case "day":
    case "month":
    case "year":
      break;
    default:
      c2 += padStart(o2.c.hour);
      if (precision === "hour") break;
      if (extended) {
        c2 += ":";
        c2 += padStart(o2.c.minute);
        if (precision === "minute") break;
        if (showSeconds) {
          c2 += ":";
          c2 += padStart(o2.c.second);
        }
      } else {
        c2 += padStart(o2.c.minute);
        if (precision === "minute") break;
        if (showSeconds) {
          c2 += padStart(o2.c.second);
        }
      }
      if (precision === "second") break;
      if (showSeconds && (!suppressMilliseconds || o2.c.millisecond !== 0)) {
        c2 += ".";
        c2 += padStart(o2.c.millisecond, 3);
      }
  }
  if (includeOffset) {
    if (o2.isOffsetFixed && o2.offset === 0 && !extendedZone) {
      c2 += "Z";
    } else if (o2.o < 0) {
      c2 += "-";
      c2 += padStart(Math.trunc(-o2.o / 60));
      c2 += ":";
      c2 += padStart(Math.trunc(-o2.o % 60));
    } else {
      c2 += "+";
      c2 += padStart(Math.trunc(o2.o / 60));
      c2 += ":";
      c2 += padStart(Math.trunc(o2.o % 60));
    }
  }
  if (extendedZone) {
    c2 += "[" + o2.zone.ianaName + "]";
  }
  return c2;
}
const defaultUnitValues = {
  month: 1,
  day: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, defaultWeekUnitValues = {
  weekNumber: 1,
  weekday: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
}, defaultOrdinalUnitValues = {
  ordinal: 1,
  hour: 0,
  minute: 0,
  second: 0,
  millisecond: 0
};
const orderedUnits = ["year", "month", "day", "hour", "minute", "second", "millisecond"], orderedWeekUnits = [
  "weekYear",
  "weekNumber",
  "weekday",
  "hour",
  "minute",
  "second",
  "millisecond"
], orderedOrdinalUnits = ["year", "ordinal", "hour", "minute", "second", "millisecond"];
function normalizeUnit(unit) {
  const normalized = {
    year: "year",
    years: "year",
    month: "month",
    months: "month",
    day: "day",
    days: "day",
    hour: "hour",
    hours: "hour",
    minute: "minute",
    minutes: "minute",
    quarter: "quarter",
    quarters: "quarter",
    second: "second",
    seconds: "second",
    millisecond: "millisecond",
    milliseconds: "millisecond",
    weekday: "weekday",
    weekdays: "weekday",
    weeknumber: "weekNumber",
    weeksnumber: "weekNumber",
    weeknumbers: "weekNumber",
    weekyear: "weekYear",
    weekyears: "weekYear",
    ordinal: "ordinal"
  }[unit.toLowerCase()];
  if (!normalized) throw new InvalidUnitError(unit);
  return normalized;
}
function normalizeUnitWithLocalWeeks(unit) {
  switch (unit.toLowerCase()) {
    case "localweekday":
    case "localweekdays":
      return "localWeekday";
    case "localweeknumber":
    case "localweeknumbers":
      return "localWeekNumber";
    case "localweekyear":
    case "localweekyears":
      return "localWeekYear";
    default:
      return normalizeUnit(unit);
  }
}
function guessOffsetForZone(zone) {
  if (zoneOffsetTs === void 0) {
    zoneOffsetTs = Settings.now();
  }
  if (zone.type !== "iana") {
    return zone.offset(zoneOffsetTs);
  }
  const zoneName = zone.name;
  let offsetGuess = zoneOffsetGuessCache.get(zoneName);
  if (offsetGuess === void 0) {
    offsetGuess = zone.offset(zoneOffsetTs);
    zoneOffsetGuessCache.set(zoneName, offsetGuess);
  }
  return offsetGuess;
}
function quickDT(obj, opts) {
  const zone = normalizeZone(opts.zone, Settings.defaultZone);
  if (!zone.isValid) {
    return DateTime.invalid(unsupportedZone(zone));
  }
  const loc = Locale.fromObject(opts);
  let ts, o2;
  if (!isUndefined(obj.year)) {
    for (const u2 of orderedUnits) {
      if (isUndefined(obj[u2])) {
        obj[u2] = defaultUnitValues[u2];
      }
    }
    const invalid = hasInvalidGregorianData(obj) || hasInvalidTimeData(obj);
    if (invalid) {
      return DateTime.invalid(invalid);
    }
    const offsetProvis = guessOffsetForZone(zone);
    [ts, o2] = objToTS(obj, offsetProvis, zone);
  } else {
    ts = Settings.now();
  }
  return new DateTime({ ts, zone, loc, o: o2 });
}
function diffRelative(start, end, opts) {
  const round = isUndefined(opts.round) ? true : opts.round, rounding = isUndefined(opts.rounding) ? "trunc" : opts.rounding, format = (c2, unit) => {
    c2 = roundTo(c2, round || opts.calendary ? 0 : 2, opts.calendary ? "round" : rounding);
    const formatter = end.loc.clone(opts).relFormatter(opts);
    return formatter.format(c2, unit);
  }, differ = (unit) => {
    if (opts.calendary) {
      if (!end.hasSame(start, unit)) {
        return end.startOf(unit).diff(start.startOf(unit), unit).get(unit);
      } else return 0;
    } else {
      return end.diff(start, unit).get(unit);
    }
  };
  if (opts.unit) {
    return format(differ(opts.unit), opts.unit);
  }
  for (const unit of opts.units) {
    const count = differ(unit);
    if (Math.abs(count) >= 1) {
      return format(count, unit);
    }
  }
  return format(start > end ? -0 : 0, opts.units[opts.units.length - 1]);
}
function lastOpts(argList) {
  let opts = {}, args;
  if (argList.length > 0 && typeof argList[argList.length - 1] === "object") {
    opts = argList[argList.length - 1];
    args = Array.from(argList).slice(0, argList.length - 1);
  } else {
    args = Array.from(argList);
  }
  return [opts, args];
}
let zoneOffsetTs;
const zoneOffsetGuessCache = /* @__PURE__ */ new Map();
class DateTime {
  /**
   * @access private
   */
  constructor(config) {
    const zone = config.zone || Settings.defaultZone;
    let invalid = config.invalid || (Number.isNaN(config.ts) ? new Invalid("invalid input") : null) || (!zone.isValid ? unsupportedZone(zone) : null);
    this.ts = isUndefined(config.ts) ? Settings.now() : config.ts;
    let c2 = null, o2 = null;
    if (!invalid) {
      const unchanged = config.old && config.old.ts === this.ts && config.old.zone.equals(zone);
      if (unchanged) {
        [c2, o2] = [config.old.c, config.old.o];
      } else {
        const ot = isNumber(config.o) && !config.old ? config.o : zone.offset(this.ts);
        c2 = tsToObj(this.ts, ot);
        invalid = Number.isNaN(c2.year) ? new Invalid("invalid input") : null;
        c2 = invalid ? null : c2;
        o2 = invalid ? null : ot;
      }
    }
    this._zone = zone;
    this.loc = config.loc || Locale.create();
    this.invalid = invalid;
    this.weekData = null;
    this.localWeekData = null;
    this.c = c2;
    this.o = o2;
    this.isLuxonDateTime = true;
  }
  // CONSTRUCT
  /**
   * Create a DateTime for the current instant, in the system's time zone.
   *
   * Use Settings to override these default values if needed.
   * @example DateTime.now().toISO() //~> now in the ISO format
   * @return {DateTime}
   */
  static now() {
    return new DateTime({});
  }
  /**
   * Create a local DateTime
   * @param {number} [year] - The calendar year. If omitted (as in, call `local()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month, 1-indexed
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @example DateTime.local()                                  //~> now
   * @example DateTime.local({ zone: "America/New_York" })      //~> now, in US east coast time
   * @example DateTime.local(2017)                              //~> 2017-01-01T00:00:00
   * @example DateTime.local(2017, 3)                           //~> 2017-03-01T00:00:00
   * @example DateTime.local(2017, 3, 12, { locale: "fr" })     //~> 2017-03-12T00:00:00, with a French locale
   * @example DateTime.local(2017, 3, 12, 5)                    //~> 2017-03-12T05:00:00
   * @example DateTime.local(2017, 3, 12, 5, { zone: "utc" })   //~> 2017-03-12T05:00:00, in UTC
   * @example DateTime.local(2017, 3, 12, 5, 45)                //~> 2017-03-12T05:45:00
   * @example DateTime.local(2017, 3, 12, 5, 45, 10)            //~> 2017-03-12T05:45:10
   * @example DateTime.local(2017, 3, 12, 5, 45, 10, 765)       //~> 2017-03-12T05:45:10.765
   * @return {DateTime}
   */
  static local() {
    const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
    return quickDT({ year, month, day, hour, minute, second, millisecond }, opts);
  }
  /**
   * Create a DateTime in UTC
   * @param {number} [year] - The calendar year. If omitted (as in, call `utc()` with no arguments), the current time will be used
   * @param {number} [month=1] - The month, 1-indexed
   * @param {number} [day=1] - The day of the month
   * @param {number} [hour=0] - The hour of the day, in 24-hour time
   * @param {number} [minute=0] - The minute of the hour, meaning a number between 0 and 59
   * @param {number} [second=0] - The second of the minute, meaning a number between 0 and 59
   * @param {number} [millisecond=0] - The millisecond of the second, meaning a number between 0 and 999
   * @param {Object} options - configuration options for the DateTime
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} [options.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [options.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @param {string} [options.weekSettings] - the week settings to set on the resulting DateTime instance
   * @example DateTime.utc()                                              //~> now
   * @example DateTime.utc(2017)                                          //~> 2017-01-01T00:00:00Z
   * @example DateTime.utc(2017, 3)                                       //~> 2017-03-01T00:00:00Z
   * @example DateTime.utc(2017, 3, 12)                                   //~> 2017-03-12T00:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5)                                //~> 2017-03-12T05:00:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45)                            //~> 2017-03-12T05:45:00Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, { locale: "fr" })          //~> 2017-03-12T05:45:00Z with a French locale
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10)                        //~> 2017-03-12T05:45:10Z
   * @example DateTime.utc(2017, 3, 12, 5, 45, 10, 765, { locale: "fr" }) //~> 2017-03-12T05:45:10.765Z with a French locale
   * @return {DateTime}
   */
  static utc() {
    const [opts, args] = lastOpts(arguments), [year, month, day, hour, minute, second, millisecond] = args;
    opts.zone = FixedOffsetZone.utcInstance;
    return quickDT({ year, month, day, hour, minute, second, millisecond }, opts);
  }
  /**
   * Create a DateTime from a JavaScript Date object. Uses the default zone.
   * @param {Date} date - a JavaScript Date object
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @return {DateTime}
   */
  static fromJSDate(date, options = {}) {
    const ts = isDate(date) ? date.valueOf() : NaN;
    if (Number.isNaN(ts)) {
      return DateTime.invalid("invalid input");
    }
    const zoneToUse = normalizeZone(options.zone, Settings.defaultZone);
    if (!zoneToUse.isValid) {
      return DateTime.invalid(unsupportedZone(zoneToUse));
    }
    return new DateTime({
      ts,
      zone: zoneToUse,
      loc: Locale.fromObject(options)
    });
  }
  /**
   * Create a DateTime from a number of milliseconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} milliseconds - a number of milliseconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromMillis(milliseconds, options = {}) {
    if (!isNumber(milliseconds)) {
      throw new InvalidArgumentError(
        `fromMillis requires a numerical input, but received a ${typeof milliseconds} with value ${milliseconds}`
      );
    } else if (milliseconds < -MAX_DATE || milliseconds > MAX_DATE) {
      return DateTime.invalid("Timestamp out of range");
    } else {
      return new DateTime({
        ts: milliseconds,
        zone: normalizeZone(options.zone, Settings.defaultZone),
        loc: Locale.fromObject(options)
      });
    }
  }
  /**
   * Create a DateTime from a number of seconds since the epoch (meaning since 1 January 1970 00:00:00 UTC). Uses the default zone.
   * @param {number} seconds - a number of seconds since 1970 UTC
   * @param {Object} options - configuration options for the DateTime
   * @param {string|Zone} [options.zone='local'] - the zone to place the DateTime into
   * @param {string} [options.locale] - a locale to set on the resulting DateTime instance
   * @param {string} options.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} options.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} options.weekSettings - the week settings to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromSeconds(seconds, options = {}) {
    if (!isNumber(seconds)) {
      throw new InvalidArgumentError("fromSeconds requires a numerical input");
    } else {
      return new DateTime({
        ts: seconds * 1e3,
        zone: normalizeZone(options.zone, Settings.defaultZone),
        loc: Locale.fromObject(options)
      });
    }
  }
  /**
   * Create a DateTime from a JavaScript object with keys like 'year' and 'hour' with reasonable defaults.
   * @param {Object} obj - the object to create the DateTime from
   * @param {number} obj.year - a year, such as 1987
   * @param {number} obj.month - a month, 1-12
   * @param {number} obj.day - a day of the month, 1-31, depending on the month
   * @param {number} obj.ordinal - day of the year, 1-365 or 366
   * @param {number} obj.weekYear - an ISO week year
   * @param {number} obj.weekNumber - an ISO week number, between 1 and 52 or 53, depending on the year
   * @param {number} obj.weekday - an ISO weekday, 1-7, where 1 is Monday and 7 is Sunday
   * @param {number} obj.localWeekYear - a week year, according to the locale
   * @param {number} obj.localWeekNumber - a week number, between 1 and 52 or 53, depending on the year, according to the locale
   * @param {number} obj.localWeekday - a weekday, 1-7, where 1 is the first and 7 is the last day of the week, according to the locale
   * @param {number} obj.hour - hour of the day, 0-23
   * @param {number} obj.minute - minute of the hour, 0-59
   * @param {number} obj.second - second of the minute, 0-59
   * @param {number} obj.millisecond - millisecond of the second, 0-999
   * @param {Object} opts - options for creating this DateTime
   * @param {string|Zone} [opts.zone='local'] - interpret the numbers in the context of a particular zone. Can take any value taken as the first argument to setZone()
   * @param {string} [opts.locale='system\'s locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromObject({ year: 1982, month: 5, day: 25}).toISODate() //=> '1982-05-25'
   * @example DateTime.fromObject({ year: 1982 }).toISODate() //=> '1982-01-01'
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }) //~> today at 10:26:06
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'utc' }),
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'local' })
   * @example DateTime.fromObject({ hour: 10, minute: 26, second: 6 }, { zone: 'America/New_York' })
   * @example DateTime.fromObject({ weekYear: 2016, weekNumber: 2, weekday: 3 }).toISODate() //=> '2016-01-13'
   * @example DateTime.fromObject({ localWeekYear: 2022, localWeekNumber: 1, localWeekday: 1 }, { locale: "en-US" }).toISODate() //=> '2021-12-26'
   * @return {DateTime}
   */
  static fromObject(obj, opts = {}) {
    obj = obj || {};
    const zoneToUse = normalizeZone(opts.zone, Settings.defaultZone);
    if (!zoneToUse.isValid) {
      return DateTime.invalid(unsupportedZone(zoneToUse));
    }
    const loc = Locale.fromObject(opts);
    const normalized = normalizeObject(obj, normalizeUnitWithLocalWeeks);
    const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, loc);
    const tsNow = Settings.now(), offsetProvis = !isUndefined(opts.specificOffset) ? opts.specificOffset : zoneToUse.offset(tsNow), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
    if ((containsGregor || containsOrdinal) && definiteWeekDef) {
      throw new ConflictingSpecificationError(
        "Can't mix weekYear/weekNumber units with year/month/day or ordinals"
      );
    }
    if (containsGregorMD && containsOrdinal) {
      throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
    }
    const useWeekData = definiteWeekDef || normalized.weekday && !containsGregor;
    let units, defaultValues, objNow = tsToObj(tsNow, offsetProvis);
    if (useWeekData) {
      units = orderedWeekUnits;
      defaultValues = defaultWeekUnitValues;
      objNow = gregorianToWeek(objNow, minDaysInFirstWeek, startOfWeek);
    } else if (containsOrdinal) {
      units = orderedOrdinalUnits;
      defaultValues = defaultOrdinalUnitValues;
      objNow = gregorianToOrdinal(objNow);
    } else {
      units = orderedUnits;
      defaultValues = defaultUnitValues;
    }
    let foundFirst = false;
    for (const u2 of units) {
      const v2 = normalized[u2];
      if (!isUndefined(v2)) {
        foundFirst = true;
      } else if (foundFirst) {
        normalized[u2] = defaultValues[u2];
      } else {
        normalized[u2] = objNow[u2];
      }
    }
    const higherOrderInvalid = useWeekData ? hasInvalidWeekData(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? hasInvalidOrdinalData(normalized) : hasInvalidGregorianData(normalized), invalid = higherOrderInvalid || hasInvalidTimeData(normalized);
    if (invalid) {
      return DateTime.invalid(invalid);
    }
    const gregorian = useWeekData ? weekToGregorian(normalized, minDaysInFirstWeek, startOfWeek) : containsOrdinal ? ordinalToGregorian(normalized) : normalized, [tsFinal, offsetFinal] = objToTS(gregorian, offsetProvis, zoneToUse), inst = new DateTime({
      ts: tsFinal,
      zone: zoneToUse,
      o: offsetFinal,
      loc
    });
    if (normalized.weekday && containsGregor && obj.weekday !== inst.weekday) {
      return DateTime.invalid(
        "mismatched weekday",
        `you can't specify both a weekday of ${normalized.weekday} and a date of ${inst.toISO()}`
      );
    }
    if (!inst.isValid) {
      return DateTime.invalid(inst.invalid);
    }
    return inst;
  }
  /**
   * Create a DateTime from an ISO 8601 string
   * @param {string} text - the ISO string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the time to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} [opts.outputCalendar] - the output calendar to set on the resulting DateTime instance
   * @param {string} [opts.numberingSystem] - the numbering system to set on the resulting DateTime instance
   * @param {string} [opts.weekSettings] - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromISO('2016-05-25T09:08:34.123')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00')
   * @example DateTime.fromISO('2016-05-25T09:08:34.123+06:00', {setZone: true})
   * @example DateTime.fromISO('2016-05-25T09:08:34.123', {zone: 'utc'})
   * @example DateTime.fromISO('2016-W05-4')
   * @return {DateTime}
   */
  static fromISO(text, opts = {}) {
    const [vals, parsedZone] = parseISODate(text);
    return parseDataToDateTime(vals, parsedZone, opts, "ISO 8601", text);
  }
  /**
   * Create a DateTime from an RFC 2822 string
   * @param {string} text - the RFC 2822 string
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since the offset is always specified in the string itself, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with a fixed-offset zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23:12 GMT')
   * @example DateTime.fromRFC2822('Fri, 25 Nov 2016 13:23:12 +0600')
   * @example DateTime.fromRFC2822('25 Nov 2016 13:23 Z')
   * @return {DateTime}
   */
  static fromRFC2822(text, opts = {}) {
    const [vals, parsedZone] = parseRFC2822Date(text);
    return parseDataToDateTime(vals, parsedZone, opts, "RFC 2822", text);
  }
  /**
   * Create a DateTime from an HTTP header date
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @param {string} text - the HTTP header date
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - convert the time to this zone. Since HTTP dates are always in UTC, this has no effect on the interpretation of string, merely the zone the resulting DateTime is expressed in.
   * @param {boolean} [opts.setZone=false] - override the zone with the fixed-offset zone specified in the string. For HTTP dates, this is always UTC, so this option is equivalent to setting the `zone` option to 'utc', but this option is included for consistency with similar methods.
   * @param {string} [opts.locale='system's locale'] - a locale to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @param {string} opts.numberingSystem - the numbering system to set on the resulting DateTime instance
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @example DateTime.fromHTTP('Sun, 06 Nov 1994 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sunday, 06-Nov-94 08:49:37 GMT')
   * @example DateTime.fromHTTP('Sun Nov  6 08:49:37 1994')
   * @return {DateTime}
   */
  static fromHTTP(text, opts = {}) {
    const [vals, parsedZone] = parseHTTPDate(text);
    return parseDataToDateTime(vals, parsedZone, opts, "HTTP", opts);
  }
  /**
   * Create a DateTime from an input string and format string.
   * Defaults to en-US if no locale has been specified, regardless of the system's locale. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/parsing?id=table-of-tokens).
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see the link below for the formats)
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @return {DateTime}
   */
  static fromFormat(text, fmt, opts = {}) {
    if (isUndefined(text) || isUndefined(fmt)) {
      throw new InvalidArgumentError("fromFormat requires an input string and a format");
    }
    const { locale = null, numberingSystem = null } = opts, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    }), [vals, parsedZone, specificOffset, invalid] = parseFromTokens(localeToUse, text, fmt);
    if (invalid) {
      return DateTime.invalid(invalid);
    } else {
      return parseDataToDateTime(vals, parsedZone, opts, `format ${fmt}`, text, specificOffset);
    }
  }
  /**
   * @deprecated use fromFormat instead
   */
  static fromString(text, fmt, opts = {}) {
    return DateTime.fromFormat(text, fmt, opts);
  }
  /**
   * Create a DateTime from a SQL date, time, or datetime
   * Defaults to en-US if no locale has been specified, regardless of the system's locale
   * @param {string} text - the string to parse
   * @param {Object} opts - options to affect the creation
   * @param {string|Zone} [opts.zone='local'] - use this zone if no offset is specified in the input string itself. Will also convert the DateTime to this zone
   * @param {boolean} [opts.setZone=false] - override the zone with a zone specified in the string itself, if it specifies one
   * @param {string} [opts.locale='en-US'] - a locale string to use when parsing. Will also set the DateTime to this locale
   * @param {string} opts.numberingSystem - the numbering system to use when parsing. Will also set the resulting DateTime to this numbering system
   * @param {string} opts.weekSettings - the week settings to set on the resulting DateTime instance
   * @param {string} opts.outputCalendar - the output calendar to set on the resulting DateTime instance
   * @example DateTime.fromSQL('2017-05-15')
   * @example DateTime.fromSQL('2017-05-15 09:12:34')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342+06:00')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles')
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342 America/Los_Angeles', { setZone: true })
   * @example DateTime.fromSQL('2017-05-15 09:12:34.342', { zone: 'America/Los_Angeles' })
   * @example DateTime.fromSQL('09:12:34.342')
   * @return {DateTime}
   */
  static fromSQL(text, opts = {}) {
    const [vals, parsedZone] = parseSQL(text);
    return parseDataToDateTime(vals, parsedZone, opts, "SQL", text);
  }
  /**
   * Create an invalid DateTime.
   * @param {string} reason - simple string of why this DateTime is invalid. Should not contain parameters or anything else data-dependent.
   * @param {string} [explanation=null] - longer explanation, may include parameters and other useful debugging information
   * @return {DateTime}
   */
  static invalid(reason, explanation = null) {
    if (!reason) {
      throw new InvalidArgumentError("need to specify a reason the DateTime is invalid");
    }
    const invalid = reason instanceof Invalid ? reason : new Invalid(reason, explanation);
    if (Settings.throwOnInvalid) {
      throw new InvalidDateTimeError(invalid);
    } else {
      return new DateTime({ invalid });
    }
  }
  /**
   * Check if an object is an instance of DateTime. Works across context boundaries
   * @param {object} o
   * @return {boolean}
   */
  static isDateTime(o2) {
    return o2 && o2.isLuxonDateTime || false;
  }
  /**
   * Produce the format string for a set of options
   * @param formatOpts
   * @param localeOpts
   * @returns {string}
   */
  static parseFormatForOpts(formatOpts, localeOpts = {}) {
    const tokenList = formatOptsToTokens(formatOpts, Locale.fromObject(localeOpts));
    return !tokenList ? null : tokenList.map((t3) => t3 ? t3.val : null).join("");
  }
  /**
   * Produce the the fully expanded format token for the locale
   * Does NOT quote characters, so quoted tokens will not round trip correctly
   * @param fmt
   * @param localeOpts
   * @returns {string}
   */
  static expandFormat(fmt, localeOpts = {}) {
    const expanded = expandMacroTokens(Formatter.parseFormat(fmt), Locale.fromObject(localeOpts));
    return expanded.map((t3) => t3.val).join("");
  }
  static resetCache() {
    zoneOffsetTs = void 0;
    zoneOffsetGuessCache.clear();
  }
  // INFO
  /**
   * Get the value of unit.
   * @param {string} unit - a unit such as 'minute' or 'day'
   * @example DateTime.local(2017, 7, 4).get('month'); //=> 7
   * @example DateTime.local(2017, 7, 4).get('day'); //=> 4
   * @return {number}
   */
  get(unit) {
    return this[unit];
  }
  /**
   * Returns whether the DateTime is valid. Invalid DateTimes occur when:
   * * The DateTime was created from invalid calendar information, such as the 13th month or February 30
   * * The DateTime was created by an operation on another invalid date
   * @type {boolean}
   */
  get isValid() {
    return this.invalid === null;
  }
  /**
   * Returns an error code if this DateTime is invalid, or null if the DateTime is valid
   * @type {string}
   */
  get invalidReason() {
    return this.invalid ? this.invalid.reason : null;
  }
  /**
   * Returns an explanation of why this DateTime became invalid, or null if the DateTime is valid
   * @type {string}
   */
  get invalidExplanation() {
    return this.invalid ? this.invalid.explanation : null;
  }
  /**
   * Get the locale of a DateTime, such 'en-GB'. The locale is used when formatting the DateTime
   *
   * @type {string}
   */
  get locale() {
    return this.isValid ? this.loc.locale : null;
  }
  /**
   * Get the numbering system of a DateTime, such 'beng'. The numbering system is used when formatting the DateTime
   *
   * @type {string}
   */
  get numberingSystem() {
    return this.isValid ? this.loc.numberingSystem : null;
  }
  /**
   * Get the output calendar of a DateTime, such 'islamic'. The output calendar is used when formatting the DateTime
   *
   * @type {string}
   */
  get outputCalendar() {
    return this.isValid ? this.loc.outputCalendar : null;
  }
  /**
   * Get the time zone associated with this DateTime.
   * @type {Zone}
   */
  get zone() {
    return this._zone;
  }
  /**
   * Get the name of the time zone.
   * @type {string}
   */
  get zoneName() {
    return this.isValid ? this.zone.name : null;
  }
  /**
   * Get the year
   * @example DateTime.local(2017, 5, 25).year //=> 2017
   * @type {number}
   */
  get year() {
    return this.isValid ? this.c.year : NaN;
  }
  /**
   * Get the quarter
   * @example DateTime.local(2017, 5, 25).quarter //=> 2
   * @type {number}
   */
  get quarter() {
    return this.isValid ? Math.ceil(this.c.month / 3) : NaN;
  }
  /**
   * Get the month (1-12).
   * @example DateTime.local(2017, 5, 25).month //=> 5
   * @type {number}
   */
  get month() {
    return this.isValid ? this.c.month : NaN;
  }
  /**
   * Get the day of the month (1-30ish).
   * @example DateTime.local(2017, 5, 25).day //=> 25
   * @type {number}
   */
  get day() {
    return this.isValid ? this.c.day : NaN;
  }
  /**
   * Get the hour of the day (0-23).
   * @example DateTime.local(2017, 5, 25, 9).hour //=> 9
   * @type {number}
   */
  get hour() {
    return this.isValid ? this.c.hour : NaN;
  }
  /**
   * Get the minute of the hour (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30).minute //=> 30
   * @type {number}
   */
  get minute() {
    return this.isValid ? this.c.minute : NaN;
  }
  /**
   * Get the second of the minute (0-59).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52).second //=> 52
   * @type {number}
   */
  get second() {
    return this.isValid ? this.c.second : NaN;
  }
  /**
   * Get the millisecond of the second (0-999).
   * @example DateTime.local(2017, 5, 25, 9, 30, 52, 654).millisecond //=> 654
   * @type {number}
   */
  get millisecond() {
    return this.isValid ? this.c.millisecond : NaN;
  }
  /**
   * Get the week year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 12, 31).weekYear //=> 2015
   * @type {number}
   */
  get weekYear() {
    return this.isValid ? possiblyCachedWeekData(this).weekYear : NaN;
  }
  /**
   * Get the week number of the week year (1-52ish).
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2017, 5, 25).weekNumber //=> 21
   * @type {number}
   */
  get weekNumber() {
    return this.isValid ? possiblyCachedWeekData(this).weekNumber : NaN;
  }
  /**
   * Get the day of the week.
   * 1 is Monday and 7 is Sunday
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2014, 11, 31).weekday //=> 4
   * @type {number}
   */
  get weekday() {
    return this.isValid ? possiblyCachedWeekData(this).weekday : NaN;
  }
  /**
   * Returns true if this date is on a weekend according to the locale, false otherwise
   * @returns {boolean}
   */
  get isWeekend() {
    return this.isValid && this.loc.getWeekendDays().includes(this.weekday);
  }
  /**
   * Get the day of the week according to the locale.
   * 1 is the first day of the week and 7 is the last day of the week.
   * If the locale assigns Sunday as the first day of the week, then a date which is a Sunday will return 1,
   * @returns {number}
   */
  get localWeekday() {
    return this.isValid ? possiblyCachedLocalWeekData(this).weekday : NaN;
  }
  /**
   * Get the week number of the week year according to the locale. Different locales assign week numbers differently,
   * because the week can start on different days of the week (see localWeekday) and because a different number of days
   * is required for a week to count as the first week of a year.
   * @returns {number}
   */
  get localWeekNumber() {
    return this.isValid ? possiblyCachedLocalWeekData(this).weekNumber : NaN;
  }
  /**
   * Get the week year according to the locale. Different locales assign week numbers (and therefor week years)
   * differently, see localWeekNumber.
   * @returns {number}
   */
  get localWeekYear() {
    return this.isValid ? possiblyCachedLocalWeekData(this).weekYear : NaN;
  }
  /**
   * Get the ordinal (meaning the day of the year)
   * @example DateTime.local(2017, 5, 25).ordinal //=> 145
   * @type {number|DateTime}
   */
  get ordinal() {
    return this.isValid ? gregorianToOrdinal(this.c).ordinal : NaN;
  }
  /**
   * Get the human readable short month name, such as 'Oct'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthShort //=> Oct
   * @type {string}
   */
  get monthShort() {
    return this.isValid ? Info.months("short", { locObj: this.loc })[this.month - 1] : null;
  }
  /**
   * Get the human readable long month name, such as 'October'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).monthLong //=> October
   * @type {string}
   */
  get monthLong() {
    return this.isValid ? Info.months("long", { locObj: this.loc })[this.month - 1] : null;
  }
  /**
   * Get the human readable short weekday, such as 'Mon'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayShort //=> Mon
   * @type {string}
   */
  get weekdayShort() {
    return this.isValid ? Info.weekdays("short", { locObj: this.loc })[this.weekday - 1] : null;
  }
  /**
   * Get the human readable long weekday, such as 'Monday'.
   * Defaults to the system's locale if no locale has been specified
   * @example DateTime.local(2017, 10, 30).weekdayLong //=> Monday
   * @type {string}
   */
  get weekdayLong() {
    return this.isValid ? Info.weekdays("long", { locObj: this.loc })[this.weekday - 1] : null;
  }
  /**
   * Get the UTC offset of this DateTime in minutes
   * @example DateTime.now().offset //=> -240
   * @example DateTime.utc().offset //=> 0
   * @type {number}
   */
  get offset() {
    return this.isValid ? +this.o : NaN;
  }
  /**
   * Get the short human name for the zone's current offset, for example "EST" or "EDT".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */
  get offsetNameShort() {
    if (this.isValid) {
      return this.zone.offsetName(this.ts, {
        format: "short",
        locale: this.locale
      });
    } else {
      return null;
    }
  }
  /**
   * Get the long human name for the zone's current offset, for example "Eastern Standard Time" or "Eastern Daylight Time".
   * Defaults to the system's locale if no locale has been specified
   * @type {string}
   */
  get offsetNameLong() {
    if (this.isValid) {
      return this.zone.offsetName(this.ts, {
        format: "long",
        locale: this.locale
      });
    } else {
      return null;
    }
  }
  /**
   * Get whether this zone's offset ever changes, as in a DST.
   * @type {boolean}
   */
  get isOffsetFixed() {
    return this.isValid ? this.zone.isUniversal : null;
  }
  /**
   * Get whether the DateTime is in a DST.
   * @type {boolean}
   */
  get isInDST() {
    if (this.isOffsetFixed) {
      return false;
    } else {
      return this.offset > this.set({ month: 1, day: 1 }).offset || this.offset > this.set({ month: 5 }).offset;
    }
  }
  /**
   * Get those DateTimes which have the same local time as this DateTime, but a different offset from UTC
   * in this DateTime's zone. During DST changes local time can be ambiguous, for example
   * `2023-10-29T02:30:00` in `Europe/Berlin` can have offset `+01:00` or `+02:00`.
   * This method will return both possible DateTimes if this DateTime's local time is ambiguous.
   * @returns {DateTime[]}
   */
  getPossibleOffsets() {
    if (!this.isValid || this.isOffsetFixed) {
      return [this];
    }
    const dayMs = 864e5;
    const minuteMs = 6e4;
    const localTS = objToLocalTS(this.c);
    const oEarlier = this.zone.offset(localTS - dayMs);
    const oLater = this.zone.offset(localTS + dayMs);
    const o1 = this.zone.offset(localTS - oEarlier * minuteMs);
    const o2 = this.zone.offset(localTS - oLater * minuteMs);
    if (o1 === o2) {
      return [this];
    }
    const ts1 = localTS - o1 * minuteMs;
    const ts2 = localTS - o2 * minuteMs;
    const c1 = tsToObj(ts1, o1);
    const c2 = tsToObj(ts2, o2);
    if (c1.hour === c2.hour && c1.minute === c2.minute && c1.second === c2.second && c1.millisecond === c2.millisecond) {
      return [clone(this, { ts: ts1 }), clone(this, { ts: ts2 })];
    }
    return [this];
  }
  /**
   * Returns true if this DateTime is in a leap year, false otherwise
   * @example DateTime.local(2016).isInLeapYear //=> true
   * @example DateTime.local(2013).isInLeapYear //=> false
   * @type {boolean}
   */
  get isInLeapYear() {
    return isLeapYear(this.year);
  }
  /**
   * Returns the number of days in this DateTime's month
   * @example DateTime.local(2016, 2).daysInMonth //=> 29
   * @example DateTime.local(2016, 3).daysInMonth //=> 31
   * @type {number}
   */
  get daysInMonth() {
    return daysInMonth(this.year, this.month);
  }
  /**
   * Returns the number of days in this DateTime's year
   * @example DateTime.local(2016).daysInYear //=> 366
   * @example DateTime.local(2013).daysInYear //=> 365
   * @type {number}
   */
  get daysInYear() {
    return this.isValid ? daysInYear(this.year) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's year
   * @see https://en.wikipedia.org/wiki/ISO_week_date
   * @example DateTime.local(2004).weeksInWeekYear //=> 53
   * @example DateTime.local(2013).weeksInWeekYear //=> 52
   * @type {number}
   */
  get weeksInWeekYear() {
    return this.isValid ? weeksInWeekYear(this.weekYear) : NaN;
  }
  /**
   * Returns the number of weeks in this DateTime's local week year
   * @example DateTime.local(2020, 6, {locale: 'en-US'}).weeksInLocalWeekYear //=> 52
   * @example DateTime.local(2020, 6, {locale: 'de-DE'}).weeksInLocalWeekYear //=> 53
   * @type {number}
   */
  get weeksInLocalWeekYear() {
    return this.isValid ? weeksInWeekYear(
      this.localWeekYear,
      this.loc.getMinDaysInFirstWeek(),
      this.loc.getStartOfWeek()
    ) : NaN;
  }
  /**
   * Returns the resolved Intl options for this DateTime.
   * This is useful in understanding the behavior of formatting methods
   * @param {Object} opts - the same options as toLocaleString
   * @return {Object}
   */
  resolvedLocaleOptions(opts = {}) {
    const { locale, numberingSystem, calendar } = Formatter.create(
      this.loc.clone(opts),
      opts
    ).resolvedOptions(this);
    return { locale, numberingSystem, outputCalendar: calendar };
  }
  // TRANSFORM
  /**
   * "Set" the DateTime's zone to UTC. Returns a newly-constructed DateTime.
   *
   * Equivalent to {@link DateTime#setZone}('utc')
   * @param {number} [offset=0] - optionally, an offset from UTC in minutes
   * @param {Object} [opts={}] - options to pass to `setZone()`
   * @return {DateTime}
   */
  toUTC(offset2 = 0, opts = {}) {
    return this.setZone(FixedOffsetZone.instance(offset2), opts);
  }
  /**
   * "Set" the DateTime's zone to the host's local zone. Returns a newly-constructed DateTime.
   *
   * Equivalent to `setZone('local')`
   * @return {DateTime}
   */
  toLocal() {
    return this.setZone(Settings.defaultZone);
  }
  /**
   * "Set" the DateTime's zone to specified zone. Returns a newly-constructed DateTime.
   *
   * By default, the setter keeps the underlying time the same (as in, the same timestamp), but the new instance will report different local times and consider DSTs when making computations, as with {@link DateTime#plus}. You may wish to use {@link DateTime#toLocal} and {@link DateTime#toUTC} which provide simple convenience wrappers for commonly used zones.
   * @param {string|Zone} [zone='local'] - a zone identifier. As a string, that can be any IANA zone supported by the host environment, or a fixed-offset name of the form 'UTC+3', or the strings 'local' or 'utc'. You may also supply an instance of a {@link DateTime#Zone} class.
   * @param {Object} opts - options
   * @param {boolean} [opts.keepLocalTime=false] - If true, adjust the underlying time so that the local time stays the same, but in the target zone. You should rarely need this.
   * @return {DateTime}
   */
  setZone(zone, { keepLocalTime = false, keepCalendarTime = false } = {}) {
    zone = normalizeZone(zone, Settings.defaultZone);
    if (zone.equals(this.zone)) {
      return this;
    } else if (!zone.isValid) {
      return DateTime.invalid(unsupportedZone(zone));
    } else {
      let newTS = this.ts;
      if (keepLocalTime || keepCalendarTime) {
        const offsetGuess = zone.offset(this.ts);
        const asObj = this.toObject();
        [newTS] = objToTS(asObj, offsetGuess, zone);
      }
      return clone(this, { ts: newTS, zone });
    }
  }
  /**
   * "Set" the locale, numberingSystem, or outputCalendar. Returns a newly-constructed DateTime.
   * @param {Object} properties - the properties to set
   * @example DateTime.local(2017, 5, 25).reconfigure({ locale: 'en-GB' })
   * @return {DateTime}
   */
  reconfigure({ locale, numberingSystem, outputCalendar } = {}) {
    const loc = this.loc.clone({ locale, numberingSystem, outputCalendar });
    return clone(this, { loc });
  }
  /**
   * "Set" the locale. Returns a newly-constructed DateTime.
   * Just a convenient alias for reconfigure({ locale })
   * @example DateTime.local(2017, 5, 25).setLocale('en-GB')
   * @return {DateTime}
   */
  setLocale(locale) {
    return this.reconfigure({ locale });
  }
  /**
   * "Set" the values of specified units. Returns a newly-constructed DateTime.
   * You can only set units with this method; for "setting" metadata, see {@link DateTime#reconfigure} and {@link DateTime#setZone}.
   *
   * This method also supports setting locale-based week units, i.e. `localWeekday`, `localWeekNumber` and `localWeekYear`.
   * They cannot be mixed with ISO-week units like `weekday`.
   * @param {Object} values - a mapping of units to numbers
   * @example dt.set({ year: 2017 })
   * @example dt.set({ hour: 8, minute: 30 })
   * @example dt.set({ weekday: 5 })
   * @example dt.set({ year: 2005, ordinal: 234 })
   * @return {DateTime}
   */
  set(values) {
    if (!this.isValid) return this;
    const normalized = normalizeObject(values, normalizeUnitWithLocalWeeks);
    const { minDaysInFirstWeek, startOfWeek } = usesLocalWeekValues(normalized, this.loc);
    const settingWeekStuff = !isUndefined(normalized.weekYear) || !isUndefined(normalized.weekNumber) || !isUndefined(normalized.weekday), containsOrdinal = !isUndefined(normalized.ordinal), containsGregorYear = !isUndefined(normalized.year), containsGregorMD = !isUndefined(normalized.month) || !isUndefined(normalized.day), containsGregor = containsGregorYear || containsGregorMD, definiteWeekDef = normalized.weekYear || normalized.weekNumber;
    if ((containsGregor || containsOrdinal) && definiteWeekDef) {
      throw new ConflictingSpecificationError(
        "Can't mix weekYear/weekNumber units with year/month/day or ordinals"
      );
    }
    if (containsGregorMD && containsOrdinal) {
      throw new ConflictingSpecificationError("Can't mix ordinal dates with month/day");
    }
    let mixed;
    if (settingWeekStuff) {
      mixed = weekToGregorian(
        { ...gregorianToWeek(this.c, minDaysInFirstWeek, startOfWeek), ...normalized },
        minDaysInFirstWeek,
        startOfWeek
      );
    } else if (!isUndefined(normalized.ordinal)) {
      mixed = ordinalToGregorian({ ...gregorianToOrdinal(this.c), ...normalized });
    } else {
      mixed = { ...this.toObject(), ...normalized };
      if (isUndefined(normalized.day)) {
        mixed.day = Math.min(daysInMonth(mixed.year, mixed.month), mixed.day);
      }
    }
    const [ts, o2] = objToTS(mixed, this.o, this.zone);
    return clone(this, { ts, o: o2 });
  }
  /**
   * Add a period of time to this DateTime and return the resulting DateTime
   *
   * Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, `dt.plus({ hours: 24 })` may result in a different time than `dt.plus({ days: 1 })` if there's a DST shift in between.
   * @param {Duration|Object|number} duration - The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   * @example DateTime.now().plus(123) //~> in 123 milliseconds
   * @example DateTime.now().plus({ minutes: 15 }) //~> in 15 minutes
   * @example DateTime.now().plus({ days: 1 }) //~> this time tomorrow
   * @example DateTime.now().plus({ days: -1 }) //~> this time yesterday
   * @example DateTime.now().plus({ hours: 3, minutes: 13 }) //~> in 3 hr, 13 min
   * @example DateTime.now().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 3 hr, 13 min
   * @return {DateTime}
   */
  plus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration);
    return clone(this, adjustTime(this, dur));
  }
  /**
   * Subtract a period of time to this DateTime and return the resulting DateTime
   * See {@link DateTime#plus}
   * @param {Duration|Object|number} duration - The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
   @return {DateTime}
   */
  minus(duration) {
    if (!this.isValid) return this;
    const dur = Duration.fromDurationLike(duration).negate();
    return clone(this, adjustTime(this, dur));
  }
  /**
   * "Set" this DateTime to the beginning of a unit of time.
   * @param {string} unit - The unit to go to the beginning of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
   * @example DateTime.local(2014, 3, 3).startOf('month').toISODate(); //=> '2014-03-01'
   * @example DateTime.local(2014, 3, 3).startOf('year').toISODate(); //=> '2014-01-01'
   * @example DateTime.local(2014, 3, 3).startOf('week').toISODate(); //=> '2014-03-03', weeks always start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('day').toISOTime(); //=> '00:00.000-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).startOf('hour').toISOTime(); //=> '05:00:00.000-05:00'
   * @return {DateTime}
   */
  startOf(unit, { useLocaleWeeks = false } = {}) {
    if (!this.isValid) return this;
    const o2 = {}, normalizedUnit = Duration.normalizeUnit(unit);
    switch (normalizedUnit) {
      case "years":
        o2.month = 1;
      case "quarters":
      case "months":
        o2.day = 1;
      case "weeks":
      case "days":
        o2.hour = 0;
      case "hours":
        o2.minute = 0;
      case "minutes":
        o2.second = 0;
      case "seconds":
        o2.millisecond = 0;
        break;
    }
    if (normalizedUnit === "weeks") {
      if (useLocaleWeeks) {
        const startOfWeek = this.loc.getStartOfWeek();
        const { weekday } = this;
        if (weekday < startOfWeek) {
          o2.weekNumber = this.weekNumber - 1;
        }
        o2.weekday = startOfWeek;
      } else {
        o2.weekday = 1;
      }
    }
    if (normalizedUnit === "quarters") {
      const q2 = Math.ceil(this.month / 3);
      o2.month = (q2 - 1) * 3 + 1;
    }
    return this.set(o2);
  }
  /**
   * "Set" this DateTime to the end (meaning the last millisecond) of a unit of time
   * @param {string} unit - The unit to go to the end of. Can be 'year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', or 'millisecond'.
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week
   * @example DateTime.local(2014, 3, 3).endOf('month').toISO(); //=> '2014-03-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('year').toISO(); //=> '2014-12-31T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3).endOf('week').toISO(); // => '2014-03-09T23:59:59.999-05:00', weeks start on Mondays
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('day').toISO(); //=> '2014-03-03T23:59:59.999-05:00'
   * @example DateTime.local(2014, 3, 3, 5, 30).endOf('hour').toISO(); //=> '2014-03-03T05:59:59.999-05:00'
   * @return {DateTime}
   */
  endOf(unit, opts) {
    return this.isValid ? this.plus({ [unit]: 1 }).startOf(unit, opts).minus(1) : this;
  }
  // OUTPUT
  /**
   * Returns a string representation of this DateTime formatted according to the specified format string.
   * **You may not want this.** See {@link DateTime#toLocaleString} for a more flexible formatting tool. For a table of tokens and their interpretations, see [here](https://moment.github.io/luxon/#/formatting?id=table-of-tokens).
   * Defaults to en-US if no locale has been specified, regardless of the system's locale.
   * @param {string} fmt - the format string
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toFormat('yyyy LLL dd') //=> '2017 Apr 22'
   * @example DateTime.now().setLocale('fr').toFormat('yyyy LLL dd') //=> '2017 avr. 22'
   * @example DateTime.now().toFormat('yyyy LLL dd', { locale: "fr" }) //=> '2017 avr. 22'
   * @example DateTime.now().toFormat("HH 'hours and' mm 'minutes'") //=> '20 hours and 55 minutes'
   * @return {string}
   */
  toFormat(fmt, opts = {}) {
    return this.isValid ? Formatter.create(this.loc.redefaultToEN(opts)).formatDateTimeFromString(this, fmt) : INVALID;
  }
  /**
   * Returns a localized string representing this date. Accepts the same options as the Intl.DateTimeFormat constructor and any presets defined by Luxon, such as `DateTime.DATE_FULL` or `DateTime.TIME_SIMPLE`.
   * The exact behavior of this method is browser-specific, but in general it will return an appropriate representation
   * of the DateTime in the assigned locale.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
   * @param formatOpts {Object} - Intl.DateTimeFormat constructor options and configuration options
   * @param {Object} opts - opts to override the configuration options on this DateTime
   * @example DateTime.now().toLocaleString(); //=> 4/20/2017
   * @example DateTime.now().setLocale('en-gb').toLocaleString(); //=> '20/04/2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL); //=> 'April 20, 2017'
   * @example DateTime.now().toLocaleString(DateTime.DATE_FULL, { locale: 'fr' }); //=> '28 août 2022'
   * @example DateTime.now().toLocaleString(DateTime.TIME_SIMPLE); //=> '11:32 AM'
   * @example DateTime.now().toLocaleString(DateTime.DATETIME_SHORT); //=> '4/20/2017, 11:32 AM'
   * @example DateTime.now().toLocaleString({ weekday: 'long', month: 'long', day: '2-digit' }); //=> 'Thursday, April 20'
   * @example DateTime.now().toLocaleString({ weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); //=> 'Thu, Apr 20, 11:27 AM'
   * @example DateTime.now().toLocaleString({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); //=> '11:32'
   * @return {string}
   */
  toLocaleString(formatOpts = DATE_SHORT, opts = {}) {
    return this.isValid ? Formatter.create(this.loc.clone(opts), formatOpts).formatDateTime(this) : INVALID;
  }
  /**
   * Returns an array of format "parts", meaning individual tokens along with metadata. This is allows callers to post-process individual sections of the formatted output.
   * Defaults to the system's locale if no locale has been specified
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat/formatToParts
   * @param opts {Object} - Intl.DateTimeFormat constructor options, same as `toLocaleString`.
   * @example DateTime.now().toLocaleParts(); //=> [
   *                                   //=>   { type: 'day', value: '25' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'month', value: '05' },
   *                                   //=>   { type: 'literal', value: '/' },
   *                                   //=>   { type: 'year', value: '1982' }
   *                                   //=> ]
   */
  toLocaleParts(opts = {}) {
    return this.isValid ? Formatter.create(this.loc.clone(opts), opts).formatDateTimeParts(this) : [];
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=false] - add the time zone format extension
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @param {string} [opts.precision='milliseconds'] - truncate output to desired presicion: 'years', 'months', 'days', 'hours', 'minutes', 'seconds' or 'milliseconds'. When precision and suppressSeconds or suppressMilliseconds are used together, precision sets the maximum unit shown in the output, however seconds or milliseconds will still be suppressed if they are 0.
   * @example DateTime.utc(1983, 5, 25).toISO() //=> '1982-05-25T00:00:00.000Z'
   * @example DateTime.now().toISO() //=> '2017-04-22T20:47:05.335-04:00'
   * @example DateTime.now().toISO({ includeOffset: false }) //=> '2017-04-22T20:47:05.335'
   * @example DateTime.now().toISO({ format: 'basic' }) //=> '20170422T204705.335-0400'
   * @example DateTime.now().toISO({ precision: 'day' }) //=> '2017-04-22Z'
   * @example DateTime.now().toISO({ precision: 'minute' }) //=> '2017-04-22T20:47Z'
   * @return {string|null}
   */
  toISO({
    format = "extended",
    suppressSeconds = false,
    suppressMilliseconds = false,
    includeOffset = true,
    extendedZone = false,
    precision = "milliseconds"
  } = {}) {
    if (!this.isValid) {
      return null;
    }
    precision = normalizeUnit(precision);
    const ext = format === "extended";
    let c2 = toISODate(this, ext, precision);
    if (orderedUnits.indexOf(precision) >= 3) c2 += "T";
    c2 += toISOTime(
      this,
      ext,
      suppressSeconds,
      suppressMilliseconds,
      includeOffset,
      extendedZone,
      precision
    );
    return c2;
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's date component
   * @param {Object} opts - options
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @param {string} [opts.precision='day'] - truncate output to desired precision: 'years', 'months', or 'days'.
   * @example DateTime.utc(1982, 5, 25).toISODate() //=> '1982-05-25'
   * @example DateTime.utc(1982, 5, 25).toISODate({ format: 'basic' }) //=> '19820525'
   * @example DateTime.utc(1982, 5, 25).toISODate({ precision: 'month' }) //=> '1982-05'
   * @return {string|null}
   */
  toISODate({ format = "extended", precision = "day" } = {}) {
    if (!this.isValid) {
      return null;
    }
    return toISODate(this, format === "extended", normalizeUnit(precision));
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's week date
   * @example DateTime.utc(1982, 5, 25).toISOWeekDate() //=> '1982-W21-2'
   * @return {string}
   */
  toISOWeekDate() {
    return toTechFormat(this, "kkkk-'W'WW-c");
  }
  /**
   * Returns an ISO 8601-compliant string representation of this DateTime's time component
   * @param {Object} opts - options
   * @param {boolean} [opts.suppressMilliseconds=false] - exclude milliseconds from the format if they're 0
   * @param {boolean} [opts.suppressSeconds=false] - exclude seconds from the format if they're 0
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.extendedZone=true] - add the time zone format extension
   * @param {boolean} [opts.includePrefix=false] - include the `T` prefix
   * @param {string} [opts.format='extended'] - choose between the basic and extended format
   * @param {string} [opts.precision='milliseconds'] - truncate output to desired presicion: 'hours', 'minutes', 'seconds' or 'milliseconds'. When precision and suppressSeconds or suppressMilliseconds are used together, precision sets the maximum unit shown in the output, however seconds or milliseconds will still be suppressed if they are 0.
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime() //=> '07:34:19.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34, seconds: 0, milliseconds: 0 }).toISOTime({ suppressSeconds: true }) //=> '07:34Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ format: 'basic' }) //=> '073419.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34 }).toISOTime({ includePrefix: true }) //=> 'T07:34:19.361Z'
   * @example DateTime.utc().set({ hour: 7, minute: 34, second: 56 }).toISOTime({ precision: 'minute' }) //=> '07:34Z'
   * @return {string}
   */
  toISOTime({
    suppressMilliseconds = false,
    suppressSeconds = false,
    includeOffset = true,
    includePrefix = false,
    extendedZone = false,
    format = "extended",
    precision = "milliseconds"
  } = {}) {
    if (!this.isValid) {
      return null;
    }
    precision = normalizeUnit(precision);
    let c2 = includePrefix && orderedUnits.indexOf(precision) >= 3 ? "T" : "";
    return c2 + toISOTime(
      this,
      format === "extended",
      suppressSeconds,
      suppressMilliseconds,
      includeOffset,
      extendedZone,
      precision
    );
  }
  /**
   * Returns an RFC 2822-compatible string representation of this DateTime
   * @example DateTime.utc(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 +0000'
   * @example DateTime.local(2014, 7, 13).toRFC2822() //=> 'Sun, 13 Jul 2014 00:00:00 -0400'
   * @return {string}
   */
  toRFC2822() {
    return toTechFormat(this, "EEE, dd LLL yyyy HH:mm:ss ZZZ", false);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in HTTP headers. The output is always expressed in GMT.
   * Specifically, the string conforms to RFC 1123.
   * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec3.html#sec3.3.1
   * @example DateTime.utc(2014, 7, 13).toHTTP() //=> 'Sun, 13 Jul 2014 00:00:00 GMT'
   * @example DateTime.utc(2014, 7, 13, 19).toHTTP() //=> 'Sun, 13 Jul 2014 19:00:00 GMT'
   * @return {string}
   */
  toHTTP() {
    return toTechFormat(this.toUTC(), "EEE, dd LLL yyyy HH:mm:ss 'GMT'");
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Date
   * @example DateTime.utc(2014, 7, 13).toSQLDate() //=> '2014-07-13'
   * @return {string|null}
   */
  toSQLDate() {
    if (!this.isValid) {
      return null;
    }
    return toISODate(this, true);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL Time
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc().toSQL() //=> '05:15:16.345'
   * @example DateTime.now().toSQL() //=> '05:15:16.345 -04:00'
   * @example DateTime.now().toSQL({ includeOffset: false }) //=> '05:15:16.345'
   * @example DateTime.now().toSQL({ includeZone: false }) //=> '05:15:16.345 America/New_York'
   * @return {string}
   */
  toSQLTime({ includeOffset = true, includeZone = false, includeOffsetSpace = true } = {}) {
    let fmt = "HH:mm:ss.SSS";
    if (includeZone || includeOffset) {
      if (includeOffsetSpace) {
        fmt += " ";
      }
      if (includeZone) {
        fmt += "z";
      } else if (includeOffset) {
        fmt += "ZZ";
      }
    }
    return toTechFormat(this, fmt, true);
  }
  /**
   * Returns a string representation of this DateTime appropriate for use in SQL DateTime
   * @param {Object} opts - options
   * @param {boolean} [opts.includeZone=false] - include the zone, such as 'America/New_York'. Overrides includeOffset.
   * @param {boolean} [opts.includeOffset=true] - include the offset, such as 'Z' or '-04:00'
   * @param {boolean} [opts.includeOffsetSpace=true] - include the space between the time and the offset, such as '05:15:16.345 -04:00'
   * @example DateTime.utc(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 Z'
   * @example DateTime.local(2014, 7, 13).toSQL() //=> '2014-07-13 00:00:00.000 -04:00'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeOffset: false }) //=> '2014-07-13 00:00:00.000'
   * @example DateTime.local(2014, 7, 13).toSQL({ includeZone: true }) //=> '2014-07-13 00:00:00.000 America/New_York'
   * @return {string}
   */
  toSQL(opts = {}) {
    if (!this.isValid) {
      return null;
    }
    return `${this.toSQLDate()} ${this.toSQLTime(opts)}`;
  }
  /**
   * Returns a string representation of this DateTime appropriate for debugging
   * @return {string}
   */
  toString() {
    return this.isValid ? this.toISO() : INVALID;
  }
  /**
   * Returns a string representation of this DateTime appropriate for the REPL.
   * @return {string}
   */
  [Symbol.for("nodejs.util.inspect.custom")]() {
    if (this.isValid) {
      return `DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`;
    } else {
      return `DateTime { Invalid, reason: ${this.invalidReason} }`;
    }
  }
  /**
   * Returns the epoch milliseconds of this DateTime. Alias of {@link DateTime#toMillis}
   * @return {number}
   */
  valueOf() {
    return this.toMillis();
  }
  /**
   * Returns the epoch milliseconds of this DateTime.
   * @return {number}
   */
  toMillis() {
    return this.isValid ? this.ts : NaN;
  }
  /**
   * Returns the epoch seconds (including milliseconds in the fractional part) of this DateTime.
   * @return {number}
   */
  toSeconds() {
    return this.isValid ? this.ts / 1e3 : NaN;
  }
  /**
   * Returns the epoch seconds (as a whole number) of this DateTime.
   * @return {number}
   */
  toUnixInteger() {
    return this.isValid ? Math.floor(this.ts / 1e3) : NaN;
  }
  /**
   * Returns an ISO 8601 representation of this DateTime appropriate for use in JSON.
   * @return {string}
   */
  toJSON() {
    return this.toISO();
  }
  /**
   * Returns a BSON serializable equivalent to this DateTime.
   * @return {Date}
   */
  toBSON() {
    return this.toJSDate();
  }
  /**
   * Returns a JavaScript object with this DateTime's year, month, day, and so on.
   * @param opts - options for generating the object
   * @param {boolean} [opts.includeConfig=false] - include configuration attributes in the output
   * @example DateTime.now().toObject() //=> { year: 2017, month: 4, day: 22, hour: 20, minute: 49, second: 42, millisecond: 268 }
   * @return {Object}
   */
  toObject(opts = {}) {
    if (!this.isValid) return {};
    const base = { ...this.c };
    if (opts.includeConfig) {
      base.outputCalendar = this.outputCalendar;
      base.numberingSystem = this.loc.numberingSystem;
      base.locale = this.loc.locale;
    }
    return base;
  }
  /**
   * Returns a JavaScript Date equivalent to this DateTime.
   * @return {Date}
   */
  toJSDate() {
    return new Date(this.isValid ? this.ts : NaN);
  }
  // COMPARE
  /**
   * Return the difference between two DateTimes as a Duration.
   * @param {DateTime} otherDateTime - the DateTime to compare this one to
   * @param {string|string[]} [unit=['milliseconds']] - the unit or array of units (such as 'hours' or 'days') to include in the duration.
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @example
   * var i1 = DateTime.fromISO('1982-05-25T09:45'),
   *     i2 = DateTime.fromISO('1983-10-14T10:30');
   * i2.diff(i1).toObject() //=> { milliseconds: 43807500000 }
   * i2.diff(i1, 'hours').toObject() //=> { hours: 12168.75 }
   * i2.diff(i1, ['months', 'days']).toObject() //=> { months: 16, days: 19.03125 }
   * i2.diff(i1, ['months', 'days', 'hours']).toObject() //=> { months: 16, days: 19, hours: 0.75 }
   * @return {Duration}
   */
  diff(otherDateTime, unit = "milliseconds", opts = {}) {
    if (!this.isValid || !otherDateTime.isValid) {
      return Duration.invalid("created by diffing an invalid DateTime");
    }
    const durOpts = { locale: this.locale, numberingSystem: this.numberingSystem, ...opts };
    const units = maybeArray(unit).map(Duration.normalizeUnit), otherIsLater = otherDateTime.valueOf() > this.valueOf(), earlier = otherIsLater ? this : otherDateTime, later = otherIsLater ? otherDateTime : this, diffed = diff(earlier, later, units, durOpts);
    return otherIsLater ? diffed.negate() : diffed;
  }
  /**
   * Return the difference between this DateTime and right now.
   * See {@link DateTime#diff}
   * @param {string|string[]} [unit=['milliseconds']] - the unit or units units (such as 'hours' or 'days') to include in the duration
   * @param {Object} opts - options that affect the creation of the Duration
   * @param {string} [opts.conversionAccuracy='casual'] - the conversion system to use
   * @return {Duration}
   */
  diffNow(unit = "milliseconds", opts = {}) {
    return this.diff(DateTime.now(), unit, opts);
  }
  /**
   * Return an Interval spanning between this DateTime and another DateTime
   * @param {DateTime} otherDateTime - the other end point of the Interval
   * @return {Interval|DateTime}
   */
  until(otherDateTime) {
    return this.isValid ? Interval.fromDateTimes(this, otherDateTime) : this;
  }
  /**
   * Return whether this DateTime is in the same unit of time as another DateTime.
   * Higher-order units must also be identical for this function to return `true`.
   * Note that time zones are **ignored** in this comparison, which compares the **local** calendar time. Use {@link DateTime#setZone} to convert one of the dates if needed.
   * @param {DateTime} otherDateTime - the other DateTime
   * @param {string} unit - the unit of time to check sameness on
   * @param {Object} opts - options
   * @param {boolean} [opts.useLocaleWeeks=false] - If true, use weeks based on the locale, i.e. use the locale-dependent start of the week; only the locale of this DateTime is used
   * @example DateTime.now().hasSame(otherDT, 'day'); //~> true if otherDT is in the same current calendar day
   * @return {boolean}
   */
  hasSame(otherDateTime, unit, opts) {
    if (!this.isValid) return false;
    const inputMs = otherDateTime.valueOf();
    const adjustedToZone = this.setZone(otherDateTime.zone, { keepLocalTime: true });
    return adjustedToZone.startOf(unit, opts) <= inputMs && inputMs <= adjustedToZone.endOf(unit, opts);
  }
  /**
   * Equality check
   * Two DateTimes are equal if and only if they represent the same millisecond, have the same zone and location, and are both valid.
   * To compare just the millisecond values, use `+dt1 === +dt2`.
   * @param {DateTime} other - the other DateTime
   * @return {boolean}
   */
  equals(other) {
    return this.isValid && other.isValid && this.valueOf() === other.valueOf() && this.zone.equals(other.zone) && this.loc.equals(other.loc);
  }
  /**
   * Returns a string representation of a this time relative to now, such as "in two days". Can only internationalize if your
   * platform supports Intl.RelativeTimeFormat. Rounds towards zero by default.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} [options.style="long"] - the style of units, must be "long", "short", or "narrow"
   * @param {string|string[]} options.unit - use a specific unit or array of units; if omitted, or an array, the method will pick the best unit. Use an array or one of "years", "quarters", "months", "weeks", "days", "hours", "minutes", or "seconds"
   * @param {boolean} [options.round=true] - whether to round the numbers in the output.
   * @param {string} [options.rounding="trunc"] - rounding method to use when rounding the numbers in the output. Can be "trunc" (toward zero), "expand" (away from zero), "round", "floor", or "ceil".
   * @param {number} [options.padding=0] - padding in milliseconds. This allows you to round up the result if it fits inside the threshold. Don't use in combination with {round: false} because the decimal output will include the padding.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelative() //=> "in 1 day"
   * @example DateTime.now().setLocale("es").toRelative({ days: 1 }) //=> "dentro de 1 día"
   * @example DateTime.now().plus({ days: 1 }).toRelative({ locale: "fr" }) //=> "dans 23 heures"
   * @example DateTime.now().minus({ days: 2 }).toRelative() //=> "2 days ago"
   * @example DateTime.now().minus({ days: 2 }).toRelative({ unit: "hours" }) //=> "48 hours ago"
   * @example DateTime.now().minus({ hours: 36 }).toRelative({ round: false }) //=> "1.5 days ago"
   */
  toRelative(options = {}) {
    if (!this.isValid) return null;
    const base = options.base || DateTime.fromObject({}, { zone: this.zone }), padding = options.padding ? this < base ? -options.padding : options.padding : 0;
    let units = ["years", "months", "days", "hours", "minutes", "seconds"];
    let unit = options.unit;
    if (Array.isArray(options.unit)) {
      units = options.unit;
      unit = void 0;
    }
    return diffRelative(base, this.plus(padding), {
      ...options,
      numeric: "always",
      units,
      unit
    });
  }
  /**
   * Returns a string representation of this date relative to today, such as "yesterday" or "next month".
   * Only internationalizes on platforms that supports Intl.RelativeTimeFormat.
   * @param {Object} options - options that affect the output
   * @param {DateTime} [options.base=DateTime.now()] - the DateTime to use as the basis to which this time is compared. Defaults to now.
   * @param {string} options.locale - override the locale of this DateTime
   * @param {string} options.unit - use a specific unit; if omitted, the method will pick the unit. Use one of "years", "quarters", "months", "weeks", or "days"
   * @param {string} options.numberingSystem - override the numberingSystem of this DateTime. The Intl system may choose not to honor this
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar() //=> "tomorrow"
   * @example DateTime.now().setLocale("es").plus({ days: 1 }).toRelative() //=> ""mañana"
   * @example DateTime.now().plus({ days: 1 }).toRelativeCalendar({ locale: "fr" }) //=> "demain"
   * @example DateTime.now().minus({ days: 2 }).toRelativeCalendar() //=> "2 days ago"
   */
  toRelativeCalendar(options = {}) {
    if (!this.isValid) return null;
    return diffRelative(options.base || DateTime.fromObject({}, { zone: this.zone }), this, {
      ...options,
      numeric: "auto",
      units: ["years", "months", "days"],
      calendary: true
    });
  }
  /**
   * Return the min of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the minimum
   * @return {DateTime} the min DateTime, or undefined if called with no argument
   */
  static min(...dateTimes) {
    if (!dateTimes.every(DateTime.isDateTime)) {
      throw new InvalidArgumentError("min requires all arguments be DateTimes");
    }
    return bestBy(dateTimes, (i2) => i2.valueOf(), Math.min);
  }
  /**
   * Return the max of several date times
   * @param {...DateTime} dateTimes - the DateTimes from which to choose the maximum
   * @return {DateTime} the max DateTime, or undefined if called with no argument
   */
  static max(...dateTimes) {
    if (!dateTimes.every(DateTime.isDateTime)) {
      throw new InvalidArgumentError("max requires all arguments be DateTimes");
    }
    return bestBy(dateTimes, (i2) => i2.valueOf(), Math.max);
  }
  // MISC
  /**
   * Explain how a string would be parsed by fromFormat()
   * @param {string} text - the string to parse
   * @param {string} fmt - the format the string is expected to be in (see description)
   * @param {Object} options - options taken by fromFormat()
   * @return {Object}
   */
  static fromFormatExplain(text, fmt, options = {}) {
    const { locale = null, numberingSystem = null } = options, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    });
    return explainFromTokens(localeToUse, text, fmt);
  }
  /**
   * @deprecated use fromFormatExplain instead
   */
  static fromStringExplain(text, fmt, options = {}) {
    return DateTime.fromFormatExplain(text, fmt, options);
  }
  /**
   * Build a parser for `fmt` using the given locale. This parser can be passed
   * to {@link DateTime.fromFormatParser} to a parse a date in this format. This
   * can be used to optimize cases where many dates need to be parsed in a
   * specific format.
   *
   * @param {String} fmt - the format the string is expected to be in (see
   * description)
   * @param {Object} options - options used to set locale and numberingSystem
   * for parser
   * @returns {TokenParser} - opaque object to be used
   */
  static buildFormatParser(fmt, options = {}) {
    const { locale = null, numberingSystem = null } = options, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    });
    return new TokenParser(localeToUse, fmt);
  }
  /**
   * Create a DateTime from an input string and format parser.
   *
   * The format parser must have been created with the same locale as this call.
   *
   * @param {String} text - the string to parse
   * @param {TokenParser} formatParser - parser from {@link DateTime.buildFormatParser}
   * @param {Object} opts - options taken by fromFormat()
   * @returns {DateTime}
   */
  static fromFormatParser(text, formatParser, opts = {}) {
    if (isUndefined(text) || isUndefined(formatParser)) {
      throw new InvalidArgumentError(
        "fromFormatParser requires an input string and a format parser"
      );
    }
    const { locale = null, numberingSystem = null } = opts, localeToUse = Locale.fromOpts({
      locale,
      numberingSystem,
      defaultToEN: true
    });
    if (!localeToUse.equals(formatParser.locale)) {
      throw new InvalidArgumentError(
        `fromFormatParser called with a locale of ${localeToUse}, but the format parser was created for ${formatParser.locale}`
      );
    }
    const { result, zone, specificOffset, invalidReason } = formatParser.explainFromTokens(text);
    if (invalidReason) {
      return DateTime.invalid(invalidReason);
    } else {
      return parseDataToDateTime(
        result,
        zone,
        opts,
        `format ${formatParser.format}`,
        text,
        specificOffset
      );
    }
  }
  // FORMAT PRESETS
  /**
   * {@link DateTime#toLocaleString} format like 10/14/1983
   * @type {Object}
   */
  static get DATE_SHORT() {
    return DATE_SHORT;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED() {
    return DATE_MED;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, Oct 14, 1983'
   * @type {Object}
   */
  static get DATE_MED_WITH_WEEKDAY() {
    return DATE_MED_WITH_WEEKDAY;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983'
   * @type {Object}
   */
  static get DATE_FULL() {
    return DATE_FULL;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Tuesday, October 14, 1983'
   * @type {Object}
   */
  static get DATE_HUGE() {
    return DATE_HUGE;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_SIMPLE() {
    return TIME_SIMPLE;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SECONDS() {
    return TIME_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_SHORT_OFFSET() {
    return TIME_WITH_SHORT_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get TIME_WITH_LONG_OFFSET() {
    return TIME_WITH_LONG_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_SIMPLE() {
    return TIME_24_SIMPLE;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SECONDS() {
    return TIME_24_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 EDT', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_SHORT_OFFSET() {
    return TIME_24_WITH_SHORT_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '09:30:23 Eastern Daylight Time', always 24-hour.
   * @type {Object}
   */
  static get TIME_24_WITH_LONG_OFFSET() {
    return TIME_24_WITH_LONG_OFFSET;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT() {
    return DATETIME_SHORT;
  }
  /**
   * {@link DateTime#toLocaleString} format like '10/14/1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_SHORT_WITH_SECONDS() {
    return DATETIME_SHORT_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED() {
    return DATETIME_MED;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Oct 14, 1983, 9:30:33 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_SECONDS() {
    return DATETIME_MED_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Fri, 14 Oct 1983, 9:30 AM'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_MED_WITH_WEEKDAY() {
    return DATETIME_MED_WITH_WEEKDAY;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL() {
    return DATETIME_FULL;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'October 14, 1983, 9:30:33 AM EDT'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_FULL_WITH_SECONDS() {
    return DATETIME_FULL_WITH_SECONDS;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE() {
    return DATETIME_HUGE;
  }
  /**
   * {@link DateTime#toLocaleString} format like 'Friday, October 14, 1983, 9:30:33 AM Eastern Daylight Time'. Only 12-hour if the locale is.
   * @type {Object}
   */
  static get DATETIME_HUGE_WITH_SECONDS() {
    return DATETIME_HUGE_WITH_SECONDS;
  }
}
function friendlyDateTime(dateTimeish) {
  if (DateTime.isDateTime(dateTimeish)) {
    return dateTimeish;
  } else if (dateTimeish && dateTimeish.valueOf && isNumber(dateTimeish.valueOf())) {
    return DateTime.fromJSDate(dateTimeish);
  } else if (dateTimeish && typeof dateTimeish === "object") {
    return DateTime.fromObject(dateTimeish);
  } else {
    throw new InvalidArgumentError(
      `Unknown datetime argument: ${dateTimeish}, of type ${typeof dateTimeish}`
    );
  }
}
var __spreadArray = function(to, from, pack) {
  if (pack || arguments.length === 2) for (var i2 = 0, l2 = from.length, ar; i2 < l2; i2++) {
    if (ar || !(i2 in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i2);
      ar[i2] = from[i2];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
};
function lazyDataLastImpl(fn, args, lazyFactory) {
  var ret = function(data) {
    return fn.apply(void 0, __spreadArray([data], Array.from(args), false));
  };
  var lazy = lazyFactory !== null && lazyFactory !== void 0 ? lazyFactory : fn.lazy;
  return lazy === void 0 ? ret : Object.assign(ret, { lazy, lazyArgs: args });
}
function purry(fn, args, lazyFactory) {
  var diff2 = fn.length - args.length;
  if (diff2 === 0) {
    return fn.apply(void 0, Array.from(args));
  }
  if (diff2 === 1) {
    return lazyDataLastImpl(fn, args, lazyFactory);
  }
  throw new Error("Wrong number of arguments");
}
function pipe(input) {
  var _a;
  var operations = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    operations[_i - 1] = arguments[_i];
  }
  var output = input;
  var lazyOperations = operations.map(function(op) {
    return "lazy" in op ? prepareLazyOperation(op) : void 0;
  });
  var operationIndex = 0;
  while (operationIndex < operations.length) {
    var lazyOperation = lazyOperations[operationIndex];
    if (lazyOperation === void 0 || !isIterable(output)) {
      var operation = operations[operationIndex];
      output = operation(output);
      operationIndex += 1;
      continue;
    }
    var lazySequence = [];
    for (var index = operationIndex; index < operations.length; index++) {
      var lazyOp = lazyOperations[index];
      if (lazyOp === void 0) {
        break;
      }
      lazySequence.push(lazyOp);
      if (lazyOp.isSingle) {
        break;
      }
    }
    var accumulator = [];
    var iterator = output[Symbol.iterator]();
    while (true) {
      var result = iterator.next();
      if ((_a = result.done) !== null && _a !== void 0 ? _a : false) {
        break;
      }
      var shouldExitEarly = _processItem(result.value, accumulator, lazySequence);
      if (shouldExitEarly) {
        break;
      }
    }
    var isSingle = lazySequence[lazySequence.length - 1].isSingle;
    output = isSingle ? accumulator[0] : accumulator;
    operationIndex += lazySequence.length;
  }
  return output;
}
function _processItem(item, accumulator, lazySequence) {
  var _a;
  if (lazySequence.length === 0) {
    accumulator.push(item);
    return false;
  }
  var currentItem = item;
  var lazyResult = { done: false, hasNext: false };
  var isDone = false;
  for (var operationsIndex = 0; operationsIndex < lazySequence.length; operationsIndex++) {
    var lazyFn = lazySequence[operationsIndex];
    var isIndexed = lazyFn.isIndexed, index = lazyFn.index, items = lazyFn.items;
    items.push(currentItem);
    lazyResult = isIndexed ? lazyFn(currentItem, index, items) : lazyFn(currentItem);
    lazyFn.index += 1;
    if (lazyResult.hasNext) {
      if ((_a = lazyResult.hasMany) !== null && _a !== void 0 ? _a : false) {
        for (var _i = 0, _b = lazyResult.next; _i < _b.length; _i++) {
          var subItem = _b[_i];
          var subResult = _processItem(subItem, accumulator, lazySequence.slice(operationsIndex + 1));
          if (subResult) {
            return true;
          }
        }
        return false;
      }
      currentItem = lazyResult.next;
    }
    if (!lazyResult.hasNext) {
      break;
    }
    if (lazyResult.done) {
      isDone = true;
    }
  }
  if (lazyResult.hasNext) {
    accumulator.push(currentItem);
  }
  if (isDone) {
    return true;
  }
  return false;
}
function prepareLazyOperation(op) {
  var lazy = op.lazy, lazyArgs = op.lazyArgs;
  var fn = lazy.apply(void 0, lazyArgs !== null && lazyArgs !== void 0 ? lazyArgs : []);
  return Object.assign(fn, {
    isIndexed: lazy.indexed,
    isSingle: lazy.single,
    index: 0,
    items: []
  });
}
function isIterable(something) {
  return typeof something === "string" || typeof something === "object" && something !== null && Symbol.iterator in something;
}
function _reduceLazy(array, lazy, isIndexed) {
  if (isIndexed === void 0) {
    isIndexed = false;
  }
  var out = [];
  for (var index = 0; index < array.length; index++) {
    var item = array[index];
    var result = isIndexed ? lazy(item, index, array) : lazy(item);
    if (result.hasMany === true) {
      out.push.apply(out, result.next);
    } else if (result.hasNext) {
      out.push(result.next);
    }
    if (result.done) {
      break;
    }
  }
  return out;
}
var _toLazyIndexed = function(fn) {
  return Object.assign(fn, { indexed: true });
};
function filter() {
  return purry(_filter(false), arguments, filter.lazy);
}
var _filter = function(indexed) {
  return function(array, fn) {
    return _reduceLazy(array, indexed ? filter.lazyIndexed(fn) : filter.lazy(fn), indexed);
  };
};
var _lazy$1 = function(indexed) {
  return function(fn) {
    return function(value, index, array) {
      return (indexed ? fn(value, index, array) : fn(value)) ? { done: false, hasNext: true, next: value } : { done: false, hasNext: false };
    };
  };
};
(function(filter2) {
  function indexed() {
    return purry(_filter(true), arguments, filter2.lazyIndexed);
  }
  filter2.indexed = indexed;
  filter2.lazy = _lazy$1(false);
  filter2.lazyIndexed = _toLazyIndexed(_lazy$1(true));
})(filter || (filter = {}));
function flatten() {
  return purry(_flatten, arguments, flatten.lazy);
}
function _flatten(items) {
  return _reduceLazy(items, flatten.lazy());
}
(function(flatten2) {
  flatten2.lazy = function() {
    return function(item) {
      return Array.isArray(item) ? { done: false, hasNext: true, hasMany: true, next: item } : { done: false, hasNext: true, next: item };
    };
  };
})(flatten || (flatten = {}));
function flatMap() {
  return purry(_flatMap, arguments, flatMap.lazy);
}
function _flatMap(array, fn) {
  return flatten(array.map(function(item) {
    return fn(item);
  }));
}
(function(flatMap2) {
  flatMap2.lazy = function(fn) {
    return function(value) {
      var next = fn(value);
      return Array.isArray(next) ? { done: false, hasNext: true, hasMany: true, next } : { done: false, hasNext: true, next };
    };
  };
})(flatMap || (flatMap = {}));
function isDeepEqual() {
  return purry(isDeepEqualImplementation, arguments);
}
function isDeepEqualImplementation(data, other) {
  if (data === other) {
    return true;
  }
  if (typeof data === "number" && typeof other === "number") {
    return data !== data && other !== other;
  }
  if (typeof data !== "object" || typeof other !== "object") {
    return false;
  }
  if (data === null || other === null) {
    return false;
  }
  if (Object.getPrototypeOf(data) !== Object.getPrototypeOf(other)) {
    return false;
  }
  if (data instanceof Set) {
    return isDeepEqualSets(data, other);
  }
  if (Array.isArray(data)) {
    if (data.length !== other.length) {
      return false;
    }
    for (var i2 = 0; i2 < data.length; i2++) {
      if (!isDeepEqualImplementation(data[i2], other[i2])) {
        return false;
      }
    }
    return true;
  }
  if (data instanceof Date) {
    return data.getTime() === other.getTime();
  }
  if (data instanceof RegExp) {
    return data.toString() === other.toString();
  }
  if (data instanceof Map) {
    return isDeepEqualMaps(data, other);
  }
  var keys = Object.keys(data);
  if (keys.length !== Object.keys(other).length) {
    return false;
  }
  for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
    var key = keys_1[_i];
    if (!Object.prototype.hasOwnProperty.call(other, key)) {
      return false;
    }
    if (!isDeepEqualImplementation(data[key], other[key])) {
      return false;
    }
  }
  return true;
}
function isDeepEqualMaps(data, other) {
  if (data.size !== other.size) {
    return false;
  }
  var keys = Array.from(data.keys());
  for (var _i = 0, keys_2 = keys; _i < keys_2.length; _i++) {
    var key = keys_2[_i];
    if (!other.has(key)) {
      return false;
    }
    if (!isDeepEqualImplementation(data.get(key), other.get(key))) {
      return false;
    }
  }
  return true;
}
function isDeepEqualSets(data, other) {
  if (data.size !== other.size) {
    return false;
  }
  var dataArr = Array.from(data.values());
  var otherArr = Array.from(other.values());
  for (var _i = 0, dataArr_1 = dataArr; _i < dataArr_1.length; _i++) {
    var dataItem = dataArr_1[_i];
    var isFound = false;
    for (var i2 = 0; i2 < otherArr.length; i2++) {
      if (isDeepEqualImplementation(dataItem, otherArr[i2])) {
        isFound = true;
        otherArr.splice(i2, 1);
        break;
      }
    }
    if (!isFound) {
      return false;
    }
  }
  return true;
}
function isArray(data) {
  return Array.isArray(data);
}
function isObject(data) {
  return Boolean(data) && !Array.isArray(data) && typeof data === "object";
}
function isString(data) {
  return typeof data === "string";
}
function isEmpty(data) {
  if (data === void 0) {
    return true;
  }
  if (isArray(data) || isString(data)) {
    return data.length === 0;
  }
  if (isObject(data)) {
    return Object.keys(data).length === 0;
  }
  return false;
}
function map() {
  return purry(_map(false), arguments, map.lazy);
}
var _map = function(indexed) {
  return function(array, fn) {
    return _reduceLazy(array, indexed ? map.lazyIndexed(fn) : map.lazy(fn), indexed);
  };
};
var _lazy = function(indexed) {
  return function(fn) {
    return function(value, index, array) {
      return {
        done: false,
        hasNext: true,
        next: indexed ? fn(value, index, array) : fn(value)
      };
    };
  };
};
(function(map2) {
  function indexed() {
    return purry(_map(true), arguments, map2.lazyIndexed);
  }
  map2.indexed = indexed;
  map2.lazy = _lazy(false);
  map2.lazyIndexed = _toLazyIndexed(_lazy(true));
  map2.strict = map2;
})(map || (map = {}));
var __assign = function() {
  __assign = Object.assign || function(t3) {
    for (var s2, i2 = 1, n2 = arguments.length; i2 < n2; i2++) {
      s2 = arguments[i2];
      for (var p2 in s2) if (Object.prototype.hasOwnProperty.call(s2, p2))
        t3[p2] = s2[p2];
    }
    return t3;
  };
  return __assign.apply(this, arguments);
};
function merge() {
  return purry(_merge, arguments);
}
function _merge(data, source) {
  return __assign(__assign({}, data), source);
}
function reduce() {
  return purry(_reduce(false), arguments);
}
var _reduce = function(indexed) {
  return function(items, fn, initialValue) {
    return items.reduce(function(acc, item, index) {
      return indexed ? fn(acc, item, index, items) : fn(acc, item);
    }, initialValue);
  };
};
(function(reduce2) {
  function indexed() {
    return purry(_reduce(true), arguments);
  }
  reduce2.indexed = indexed;
})(reduce || (reduce = {}));
function sort() {
  return purry(_sort, arguments);
}
function _sort(items, cmp) {
  var ret = items.slice();
  ret.sort(cmp);
  return ret;
}
(function(sort2) {
  sort2.strict = sort2;
})(sort || (sort = {}));
const t$1 = Symbol.for("@ts-pattern/matcher"), e$1 = Symbol.for("@ts-pattern/isVariadic"), n$1 = "@ts-pattern/anonymous-select-key", r$1 = (t3) => Boolean(t3 && "object" == typeof t3), i$1 = (e2) => e2 && !!e2[t$1], o$1 = (n2, s2, c2) => {
  if (i$1(n2)) {
    const e2 = n2[t$1](), { matched: r2, selections: i2 } = e2.match(s2);
    return r2 && i2 && Object.keys(i2).forEach((t3) => c2(t3, i2[t3])), r2;
  }
  if (r$1(n2)) {
    if (!r$1(s2)) return false;
    if (Array.isArray(n2)) {
      if (!Array.isArray(s2)) return false;
      let t3 = [], r2 = [], a2 = [];
      for (const o2 of n2.keys()) {
        const s3 = n2[o2];
        i$1(s3) && s3[e$1] ? a2.push(s3) : a2.length ? r2.push(s3) : t3.push(s3);
      }
      if (a2.length) {
        if (a2.length > 1) throw new Error("Pattern error: Using `...P.array(...)` several times in a single pattern is not allowed.");
        if (s2.length < t3.length + r2.length) return false;
        const e2 = s2.slice(0, t3.length), n3 = 0 === r2.length ? [] : s2.slice(-r2.length), i2 = s2.slice(t3.length, 0 === r2.length ? Infinity : -r2.length);
        return t3.every((t4, n4) => o$1(t4, e2[n4], c2)) && r2.every((t4, e3) => o$1(t4, n3[e3], c2)) && (0 === a2.length || o$1(a2[0], i2, c2));
      }
      return n2.length === s2.length && n2.every((t4, e2) => o$1(t4, s2[e2], c2));
    }
    return Reflect.ownKeys(n2).every((e2) => {
      const r2 = n2[e2];
      return (e2 in s2 || i$1(a2 = r2) && "optional" === a2[t$1]().matcherType) && o$1(r2, s2[e2], c2);
      var a2;
    });
  }
  return Object.is(s2, n2);
}, s$1 = (e2) => {
  var n2, o2, a2;
  return r$1(e2) ? i$1(e2) ? null != (n2 = null == (o2 = (a2 = e2[t$1]()).getSelectionKeys) ? void 0 : o2.call(a2)) ? n2 : [] : Array.isArray(e2) ? c$1(e2, s$1) : c$1(Object.values(e2), s$1) : [];
}, c$1 = (t3, e2) => t3.reduce((t4, n2) => t4.concat(e2(n2)), []);
function u(t3) {
  return Object.assign(t3, { optional: () => l$1(t3), and: (e2) => m(t3, e2), or: (e2) => d$1(t3, e2), select: (e2) => void 0 === e2 ? y$1(t3) : y$1(e2, t3) });
}
function l$1(e2) {
  return u({ [t$1]: () => ({ match: (t3) => {
    let n2 = {};
    const r2 = (t4, e3) => {
      n2[t4] = e3;
    };
    return void 0 === t3 ? (s$1(e2).forEach((t4) => r2(t4, void 0)), { matched: true, selections: n2 }) : { matched: o$1(e2, t3, r2), selections: n2 };
  }, getSelectionKeys: () => s$1(e2), matcherType: "optional" }) });
}
function m(...e2) {
  return u({ [t$1]: () => ({ match: (t3) => {
    let n2 = {};
    const r2 = (t4, e3) => {
      n2[t4] = e3;
    };
    return { matched: e2.every((e3) => o$1(e3, t3, r2)), selections: n2 };
  }, getSelectionKeys: () => c$1(e2, s$1), matcherType: "and" }) });
}
function d$1(...e2) {
  return u({ [t$1]: () => ({ match: (t3) => {
    let n2 = {};
    const r2 = (t4, e3) => {
      n2[t4] = e3;
    };
    return c$1(e2, s$1).forEach((t4) => r2(t4, void 0)), { matched: e2.some((e3) => o$1(e3, t3, r2)), selections: n2 };
  }, getSelectionKeys: () => c$1(e2, s$1), matcherType: "or" }) });
}
function p$1(e2) {
  return { [t$1]: () => ({ match: (t3) => ({ matched: Boolean(e2(t3)) }) }) };
}
function y$1(...e2) {
  const r2 = "string" == typeof e2[0] ? e2[0] : void 0, i2 = 2 === e2.length ? e2[1] : "string" == typeof e2[0] ? void 0 : e2[0];
  return u({ [t$1]: () => ({ match: (t3) => {
    let e3 = { [null != r2 ? r2 : n$1]: t3 };
    return { matched: void 0 === i2 || o$1(i2, t3, (t4, n2) => {
      e3[t4] = n2;
    }), selections: e3 };
  }, getSelectionKeys: () => [null != r2 ? r2 : n$1].concat(void 0 === i2 ? [] : s$1(i2)) }) });
}
function v(t3) {
  return "number" == typeof t3;
}
function b$1(t3) {
  return "string" == typeof t3;
}
function w$1(t3) {
  return "bigint" == typeof t3;
}
u(p$1(function(t3) {
  return true;
}));
const j = (t3) => Object.assign(u(t3), { startsWith: (e2) => {
  return j(m(t3, (n2 = e2, p$1((t4) => b$1(t4) && t4.startsWith(n2)))));
  var n2;
}, endsWith: (e2) => {
  return j(m(t3, (n2 = e2, p$1((t4) => b$1(t4) && t4.endsWith(n2)))));
  var n2;
}, minLength: (e2) => j(m(t3, ((t4) => p$1((e3) => b$1(e3) && e3.length >= t4))(e2))), length: (e2) => j(m(t3, ((t4) => p$1((e3) => b$1(e3) && e3.length === t4))(e2))), maxLength: (e2) => j(m(t3, ((t4) => p$1((e3) => b$1(e3) && e3.length <= t4))(e2))), includes: (e2) => {
  return j(m(t3, (n2 = e2, p$1((t4) => b$1(t4) && t4.includes(n2)))));
  var n2;
}, regex: (e2) => {
  return j(m(t3, (n2 = e2, p$1((t4) => b$1(t4) && Boolean(t4.match(n2))))));
  var n2;
} });
j(p$1(b$1));
const x$1 = (t3) => Object.assign(u(t3), { between: (e2, n2) => x$1(m(t3, ((t4, e3) => p$1((n3) => v(n3) && t4 <= n3 && e3 >= n3))(e2, n2))), lt: (e2) => x$1(m(t3, ((t4) => p$1((e3) => v(e3) && e3 < t4))(e2))), gt: (e2) => x$1(m(t3, ((t4) => p$1((e3) => v(e3) && e3 > t4))(e2))), lte: (e2) => x$1(m(t3, ((t4) => p$1((e3) => v(e3) && e3 <= t4))(e2))), gte: (e2) => x$1(m(t3, ((t4) => p$1((e3) => v(e3) && e3 >= t4))(e2))), int: () => x$1(m(t3, p$1((t4) => v(t4) && Number.isInteger(t4)))), finite: () => x$1(m(t3, p$1((t4) => v(t4) && Number.isFinite(t4)))), positive: () => x$1(m(t3, p$1((t4) => v(t4) && t4 > 0))), negative: () => x$1(m(t3, p$1((t4) => v(t4) && t4 < 0))) }), E$1 = x$1(p$1(v)), A$1 = (t3) => Object.assign(u(t3), { between: (e2, n2) => A$1(m(t3, ((t4, e3) => p$1((n3) => w$1(n3) && t4 <= n3 && e3 >= n3))(e2, n2))), lt: (e2) => A$1(m(t3, ((t4) => p$1((e3) => w$1(e3) && e3 < t4))(e2))), gt: (e2) => A$1(m(t3, ((t4) => p$1((e3) => w$1(e3) && e3 > t4))(e2))), lte: (e2) => A$1(m(t3, ((t4) => p$1((e3) => w$1(e3) && e3 <= t4))(e2))), gte: (e2) => A$1(m(t3, ((t4) => p$1((e3) => w$1(e3) && e3 >= t4))(e2))), positive: () => A$1(m(t3, p$1((t4) => w$1(t4) && t4 > 0))), negative: () => A$1(m(t3, p$1((t4) => w$1(t4) && t4 < 0))) });
A$1(p$1(w$1));
u(p$1(function(t3) {
  return "boolean" == typeof t3;
}));
u(p$1(function(t3) {
  return "symbol" == typeof t3;
}));
const _ = u(p$1(function(t3) {
  return null == t3;
}));
u(p$1(function(t3) {
  return null != t3;
}));
var N$1 = { __proto__: null, number: E$1, nullish: _ };
class W extends Error {
  constructor(t3) {
    let e2;
    try {
      e2 = JSON.stringify(t3);
    } catch (n2) {
      e2 = t3;
    }
    super(`Pattern matching error: no pattern matches value ${e2}`), this.input = void 0, this.input = t3;
  }
}
const $ = { matched: false, value: void 0 };
function z$1(t3) {
  return new I(t3, $);
}
class I {
  constructor(t3, e2) {
    this.input = void 0, this.state = void 0, this.input = t3, this.state = e2;
  }
  with(...t3) {
    if (this.state.matched) return this;
    const e2 = t3[t3.length - 1], r2 = [t3[0]];
    let i2;
    3 === t3.length && "function" == typeof t3[1] ? i2 = t3[1] : t3.length > 2 && r2.push(...t3.slice(1, t3.length - 1));
    let s2 = false, c2 = {};
    const a2 = (t4, e3) => {
      s2 = true, c2[t4] = e3;
    }, u2 = !r2.some((t4) => o$1(t4, this.input, a2)) || i2 && !Boolean(i2(this.input)) ? $ : { matched: true, value: e2(s2 ? n$1 in c2 ? c2[n$1] : c2 : this.input, this.input) };
    return new I(this.input, u2);
  }
  when(t3, e2) {
    if (this.state.matched) return this;
    const n2 = Boolean(t3(this.input));
    return new I(this.input, n2 ? { matched: true, value: e2(this.input, this.input) } : $);
  }
  otherwise(t3) {
    return this.state.matched ? this.state.value : t3(this.input);
  }
  exhaustive(t3 = L$1) {
    return this.state.matched ? this.state.value : t3(this.input);
  }
  run() {
    return this.exhaustive();
  }
  returnType() {
    return this;
  }
  narrow() {
    return this;
  }
}
function L$1(t3) {
  throw new W(t3);
}
const __variableDynamicImportRuntimeHelper = (glob, path, segs) => {
  const v2 = glob[path];
  if (v2) {
    return typeof v2 === "function" ? v2() : Promise.resolve(v2);
  }
  return new Promise((_2, reject) => {
    (typeof queueMicrotask === "function" ? queueMicrotask : setTimeout)(
      reject.bind(
        null,
        new Error(
          "Unknown variable dynamic import: " + path + (path.split("/").length !== segs ? ". Note that variables only represent file names one level deep." : "")
        )
      )
    );
  });
};
const sourceLocale = `en`;
const targetLocales = [`de`, `de-DE`];
const { getLocale, setLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: (locale) => __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({}), `../generated/locales/${locale}.js`, 4)
});
function getCurrentLocale() {
  var _a;
  return getLocale() || ((_a = document.documentElement.lang) == null ? void 0 : _a.slice(0, 2)) || "en";
}
async function setAppLocale(locale) {
  await setLocale(locale);
}
function formatDateTime(dateTime, format) {
  return dateTime.setLocale(getCurrentLocale()).toFormat(format);
}
function getLocalizedMonth(month) {
  const date = DateTime.local().set({ month });
  return formatDateTime(date, "MMM");
}
function getLocalizedWeekdayShort(weekday) {
  const date = DateTime.local().set({
    weekday
  });
  return formatDateTime(date, "ccc");
}
var __getOwnPropDesc$7 = Object.getOwnPropertyDescriptor;
var __decorateClass$7 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$7(target, key) : target;
  for (var i2 = decorators.length - 1, decorator; i2 >= 0; i2--)
    if (decorator = decorators[i2])
      result = decorator(result) || result;
  return result;
};
let Context = class extends LitElement {
  render() {
    return html` <div>
            <span>${getLocalizedWeekdayShort(1)}</span>
            <span>${getLocalizedWeekdayShort(2)}</span>
            <span>${getLocalizedWeekdayShort(3)}</span>
            <span>${getLocalizedWeekdayShort(4)}</span>
            <span>${getLocalizedWeekdayShort(5)}</span>
            <span>${getLocalizedWeekdayShort(6)}</span>
            <span>${getLocalizedWeekdayShort(7)}</span>
        </div>`;
  }
};
Context.styles = css`
        div {
            height: var(--context-height, 1.75em);
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        span {
            padding: var(--context-padding, 0.25em);
            text-align: var(--context-text-align, left);
        }
    `;
Context = __decorateClass$7([
  customElement("lms-calendar-context"),
  localized()
], Context);
var __defProp$6 = Object.defineProperty;
var __getOwnPropDesc$6 = Object.getOwnPropertyDescriptor;
var __decorateClass$6 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$6(target, key) : target;
  for (var i2 = decorators.length - 1, decorator; i2 >= 0; i2--)
    if (decorator = decorators[i2])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$6(target, key, result);
  return result;
};
let Day = class extends LitElement {
  constructor() {
    super(...arguments);
    this._hours = [...Array(25).keys()];
    this._hasActiveSidebar = false;
  }
  _renderSeparatorMaybe(index, hour) {
    return index ? html`<div class="separator" style="grid-row: ${hour * 60}"></div>` : nothing;
  }
  _renderIndicatorValue(hour) {
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
  }
  render() {
    return html` <div class="all-day">
                <slot
                    name="all-day"
                    id="all-day"
                    class="entry"
                    @slotchange=${this._handleSlotChange}
                ></slot>
            </div>
            <div class="container">
                <div
                    class="main ${classMap({
      "w-100": !this._hasActiveSidebar,
      "w-70": this._hasActiveSidebar
    })}"
                >
                    ${map$1(
      this._hours,
      (hour, index) => html`
                            <div
                                class="hour"
                                style=${this._getHourIndicator(hour)}
                            >
                                <span class="indicator">
                                    ${this._renderIndicatorValue(hour)}
                                </span>
                            </div>
                            ${this._renderSeparatorMaybe(index, hour)}
                            <slot name="${hour}" class="entry"></slot>
                        `
    )}
                </div>
                <div
                    class="sidebar w-30"
                    ?hidden=${!this._hasActiveSidebar}
                ></div>
            </div>`;
  }
  _handleSlotChange(e2) {
    const target = e2.target;
    if (!(target instanceof HTMLSlotElement)) {
      return;
    }
    const childNodes = target.assignedElements({
      flatten: true
    });
    this.container.style.height = `calc(100% - 3.5em - ${childNodes.length * 24}px)`;
  }
  _getHourIndicator(hour) {
    return hour !== 24 ? `grid-row: ${(hour + 1) * 60 - 59}/${(hour + 1) * 60}` : "grid-row: 1440";
  }
};
Day.styles = css`
        .container {
            display: flex;
            height: var(--view-container-height);
            width: 100%;
        }

        .main {
            display: grid;
            grid-template-columns: var(
                --day-grid-columns,
                var(--calendar-grid-columns-day)
            );
            grid-template-rows: var(--calendar-grid-rows-time);
            height: var(--main-content-height);
            gap: var(--day-gap, 1px);
            overflow-y: scroll;
            text-align: var(--day-text-align, center);
            padding: var(--day-padding, 0.5em);
            position: relative;
        }

        .hour {
            display: var(--day-show-time-column, block);
            text-align: var(--hour-text-align, center);
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
        }

        .indicator {
            position: relative;
            top: var(--indicator-top, -0.6em);
        }

        .separator {
            grid-column: 2 / 3;
            border-top: var(
                --separator-border,
                1px solid var(--separator-light)
            );
            position: absolute;
            width: 100%;
            z-index: 0;
        }

        .sidebar {
            height: 100%;
            border-left: var(
                --sidebar-border,
                1px solid var(--separator-light)
            );
        }

        .w-100 {
            width: 100%;
        }

        .w-70 {
            width: 70%;
        }

        .w-30 {
            width: 30%;
        }

        .w-0 {
            width: 0;
        }

        .all-day {
            font-size: var(--day-all-day-font-size, 16px);
            margin: var(--day-all-day-margin, 0 1.25em 0 4.25em);
        }
    `;
__decorateClass$6([
  state()
], Day.prototype, "_hours", 2);
__decorateClass$6([
  state()
], Day.prototype, "_hasActiveSidebar", 2);
__decorateClass$6([
  query(".container")
], Day.prototype, "container", 2);
Day = __decorateClass$6([
  customElement("lms-calendar-day")
], Day);
const messages = {
  day: () => msg("Day"),
  week: () => msg("Week"),
  month: () => msg("Month"),
  currentMonth: () => msg("Current Month"),
  allDay: () => msg("All Day"),
  today: () => msg("Today"),
  noTitle: () => msg("No Title"),
  noContent: () => msg("No Content"),
  noTime: () => msg("No Time"),
  eventDetails: () => msg("Event Details"),
  exportAsICS: () => msg("Export as ICS"),
  title: () => msg("Title"),
  time: () => msg("Time"),
  date: () => msg("Date"),
  notes: () => msg("Notes"),
  minimize: () => msg("Minimize"),
  close: () => msg("Close"),
  dragToMove: () => msg("Drag to move menu")
};
var __defProp$5 = Object.defineProperty;
var __getOwnPropDesc$5 = Object.getOwnPropertyDescriptor;
var __decorateClass$5 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$5(target, key) : target;
  for (var i2 = decorators.length - 1, decorator; i2 >= 0; i2--)
    if (decorator = decorators[i2])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$5(target, key, result);
  return result;
};
let Entry = class extends LitElement {
  constructor() {
    super();
    this.heading = "";
    this.isContinuation = false;
    this._sumReducer = (accumulator, currentValue) => accumulator + currentValue;
    this.addEventListener("click", this._handleInteraction);
    this.addEventListener("keydown", this._handleInteraction);
  }
  _renderTitle() {
    return z$1(this.content).with(N$1.nullish, () => this.heading).otherwise(() => `${this.heading}: ${this.content}`);
  }
  _renderInterval() {
    return this.isContinuation ? html`<span>${messages.allDay()}</span>` : html`<span class="interval"
                  >${this._displayInterval(this.time)}</span
              >`;
  }
  render() {
    return html`
            <div
                class="main"
                tabindex="1"
                title=${this._renderTitle()}
                data-full-content=${this.content || ""}
                ?data-extended=${this._extended}
            >
                <span>
                    <span>${this.heading}</span>
                </span>
                ${this._renderInterval()}
            </div>
        `;
  }
  _displayInterval(time) {
    if (!time) {
      return nothing;
    }
    const END_HOURS = 2;
    const components = [
      time.start.hour,
      time.start.minute,
      time.end.hour,
      time.end.minute
    ];
    const lastsAllDay = components[END_HOURS] === 24 && components.reduce(this._sumReducer, 0) % 24 === 0;
    if (lastsAllDay) {
      return messages.allDay();
    }
    const [startHours, startMinutes, endHours, endMinutes] = components.map(
      (component) => component < 10 ? `0${component}` : component
    );
    return `${startHours}:${startMinutes} - ${endHours}:${endMinutes}`;
  }
  _handleInteraction(e2) {
    var _a;
    if (e2 instanceof KeyboardEvent && e2.key !== "Enter" && e2.key !== " ") {
      return;
    }
    e2.preventDefault();
    e2.stopPropagation();
    if (!this._highlighted) {
      this._highlighted = true;
      if (!this.date) {
        return;
      }
      const eventDetails = {
        heading: this.heading || messages.noTitle(),
        content: this.content || messages.noContent(),
        time: this.time ? `${String(this.time.start.hour).padStart(
          2,
          "0"
        )}:${String(this.time.start.minute).padStart(
          2,
          "0"
        )} - ${String(this.time.end.hour).padStart(
          2,
          "0"
        )}:${String(this.time.end.minute).padStart(2, "0")}` : messages.noTime(),
        date: (_a = this.date) == null ? void 0 : _a.start
      };
      const openMenuEvent = new CustomEvent("open-menu", {
        detail: eventDetails,
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(openMenuEvent);
      const handleMenuClose = () => {
        this._highlighted = false;
        this.removeEventListener("menu-close", handleMenuClose);
      };
      this.addEventListener("menu-close", handleMenuClose);
    }
  }
};
Entry.styles = css`
        :host {
            font-size: var(--entry-font-size, small);
            grid-column: 2;
            display: block;
            cursor: pointer;
            user-select: none;
            border-radius: var(--entry-border-radius, var(--border-radius-sm));
            grid-row: var(--start-slot);
            width: var(--entry-width);
            margin: var(--entry-margin);
            background-color: var(
                --entry-background-color,
                var(--background-color)
            );
            color: var(--entry-color, var(--primary-color));
            /* z-index of separators in day view is 0 */
            z-index: 1;
            box-sizing: border-box;
            padding-bottom: 1px;
            min-height: 1.5em; /* Ensure minimum height for short events */
        }

        :host(:last-child) {
            padding-bottom: 0;
        }

        :host([data-highlighted]) {
            background: var(--entry-highlight-color, var(--separator-light));
        }

        :host([data-extended]) {
            background: var(
                --entry-extended-background-color,
                var(--background-color)
            );
        }

        :host(:focus-within) {
            outline: 2px solid var(--entry-focus-color, var(--primary-color));
            outline-offset: -2px;
        }

        .main {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: var(--entry-padding, 0.25em);
            border-radius: var(--entry-border-radius, var(--border-radius-sm));
            background-color: inherit;
            text-align: left;
            height: 100%;
            box-sizing: border-box;
        }

        .main > span:first-child {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-grow: 1;
            min-width: 0; /* Required for text-overflow to work in a flex container */
            position: relative;
        }

        .main > span:first-child::after {
            content: attr(data-full-content);
            white-space: normal;
            position: absolute;
            left: 0;
            top: 100%;
            width: 100%;
            background-color: inherit;
            display: none;
        }

        :host([data-extended]) .main > span:first-child::after {
            display: block;
        }

        .interval {
            font-family: var(--entry-font-family, monospace);
            white-space: nowrap;
            margin-left: var(--entry-interval-margin, 0.5em);
            flex-shrink: 0; /* Prevent time from being compressed */
        }
    `;
__decorateClass$5([
  property({ attribute: false })
], Entry.prototype, "time", 2);
__decorateClass$5([
  property()
], Entry.prototype, "heading", 2);
__decorateClass$5([
  property()
], Entry.prototype, "content", 2);
__decorateClass$5([
  property({ type: Boolean })
], Entry.prototype, "isContinuation", 2);
__decorateClass$5([
  property({ type: Object })
], Entry.prototype, "date", 2);
__decorateClass$5([
  state()
], Entry.prototype, "_highlighted", 2);
__decorateClass$5([
  state()
], Entry.prototype, "_extended", 2);
Entry = __decorateClass$5([
  customElement("lms-calendar-entry"),
  localized()
], Entry);
const currentViewMode = r$2("month");
const activeDate = r$2({
  day: (/* @__PURE__ */ new Date()).getDate(),
  month: (/* @__PURE__ */ new Date()).getMonth() + 1,
  year: (/* @__PURE__ */ new Date()).getFullYear()
});
function switchToMonthView() {
  currentViewMode.set("month");
}
function switchToWeekView() {
  currentViewMode.set("week");
}
function switchToDayView() {
  currentViewMode.set("day");
}
function jumpToToday() {
  const today = /* @__PURE__ */ new Date();
  activeDate.set({
    day: today.getDate(),
    month: today.getMonth() + 1,
    year: today.getFullYear()
  });
}
function setActiveDate(date) {
  activeDate.set(date);
}
function navigateNext() {
  const current = activeDate.get();
  const viewMode = currentViewMode.get();
  if (viewMode === "month") {
    const nextMonth = new Date(current.year, current.month, 1);
    setActiveDate({
      day: 1,
      month: nextMonth.getMonth() + 1,
      year: nextMonth.getFullYear()
    });
  } else if (viewMode === "week") {
    const currentDateObj = new Date(
      current.year,
      current.month - 1,
      current.day
    );
    currentDateObj.setDate(currentDateObj.getDate() + 7);
    setActiveDate({
      day: currentDateObj.getDate(),
      month: currentDateObj.getMonth() + 1,
      year: currentDateObj.getFullYear()
    });
  } else if (viewMode === "day") {
    const nextDay = new Date(
      current.year,
      current.month - 1,
      current.day + 1
    );
    setActiveDate({
      day: nextDay.getDate(),
      month: nextDay.getMonth() + 1,
      year: nextDay.getFullYear()
    });
  }
}
function navigatePrevious() {
  const current = activeDate.get();
  const viewMode = currentViewMode.get();
  if (viewMode === "month") {
    const prevMonth = new Date(current.year, current.month - 2, 1);
    setActiveDate({
      day: 1,
      month: prevMonth.getMonth() + 1,
      year: prevMonth.getFullYear()
    });
  } else if (viewMode === "week") {
    const currentDateObj = new Date(
      current.year,
      current.month - 1,
      current.day
    );
    currentDateObj.setDate(currentDateObj.getDate() - 7);
    setActiveDate({
      day: currentDateObj.getDate(),
      month: currentDateObj.getMonth() + 1,
      year: currentDateObj.getFullYear()
    });
  } else if (viewMode === "day") {
    const prevDay = new Date(
      current.year,
      current.month - 1,
      current.day - 1
    );
    setActiveDate({
      day: prevDay.getDate(),
      month: prevDay.getMonth() + 1,
      year: prevDay.getFullYear()
    });
  }
}
var __defProp$4 = Object.defineProperty;
var __getOwnPropDesc$4 = Object.getOwnPropertyDescriptor;
var __decorateClass$4 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$4(target, key) : target;
  for (var i2 = decorators.length - 1, decorator; i2 >= 0; i2--)
    if (decorator = decorators[i2])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$4(target, key, result);
  return result;
};
let Header = class extends e$2(LitElement) {
  render() {
    return html`<div class="controls">
            <div class="info">
                <span>
                    <strong>${this.heading || messages.currentMonth()}</strong>
                </span>
                <div ?hidden=${currentViewMode.get() !== "day"}>
                    <span class="day">${activeDate.get().day}</span>
                    <span class="month"
                        >${getLocalizedMonth(activeDate.get().month)}</span
                    >
                    <span class="year">${activeDate.get().year}</span>
                </div>
                <div ?hidden=${currentViewMode.get() === "day"}>
                    <span class="month"
                        >${getLocalizedMonth(activeDate.get().month)}</span
                    >
                    <span class="year">${activeDate.get().year}</span>
                </div>
            </div>
            <div class="context" @click=${this._dispatchSwitchView}>
                <button
                    ?data-active=${currentViewMode.get() === "day"}
                    data-context="day"
                    class="btn-change-view"
                >
                    ${messages.day()}
                </button>
                <button
                    ?data-active=${currentViewMode.get() === "week"}
                    data-context="week"
                    class="btn-change-view"
                >
                    ${messages.week()}
                </button>
                <button
                    ?data-active=${currentViewMode.get() === "month"}
                    data-context="month"
                    class="btn-change-view"
                >
                    ${messages.month()}
                </button>
            </div>
            <div class="buttons" @click=${this._dispatchSwitchDate}>
                <button name="previous">«</button>
                <button name="today" @click=${this._handleTodayClick}>
                    ${messages.today()}
                </button>
                <button name="next">»</button>
            </div>
        </div>`;
  }
  _handleTodayClick(e2) {
    e2.stopPropagation();
    const today = /* @__PURE__ */ new Date();
    const todayDate = {
      day: today.getDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear()
    };
    const event = new CustomEvent("jumptoday", {
      detail: { date: todayDate },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
  _dispatchSwitchDate(e2) {
    const target = e2.target;
    if (!(target instanceof HTMLButtonElement)) {
      return;
    }
    const direction = e2.target === e2.currentTarget ? "container" : target.name;
    const event = new CustomEvent("switchdate", {
      detail: { direction },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
  _dispatchSwitchView(e2) {
    const target = e2.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const view = e2.target === e2.currentTarget ? "container" : target.dataset.context;
    const event = new CustomEvent("switchview", {
      detail: { view },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
};
Header.styles = css`
        .controls {
            height: var(--header-height, 3.5em);
            width: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            align-content: center;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--separator-light);
        }

        @media (max-width: 375px) {
            .controls {
                font-size: small;
                height: var(--header-height-mobile, 4.5em);
            }
        }
        .info {
            padding-left: var(--header-info-padding-left, 1em);
            text-align: right;
        }
        .day,
        .month,
        .year {
            color: var(--header-text-color, rgba(0, 0, 0, 0.6));
        }
        .buttons {
            padding-right: var(--header-buttons-padding-right, 1em);
        }
        button {
            padding: var(--button-padding, 0.75em);
            margin: 0;
            border-radius: var(--button-border-radius, 50%);
            line-height: 0.5em;
            border: 1px solid transparent;
        }
        .context {
            display: flex;
        }
        .context > * {
            margin: 0 0.5em;
        }
    `;
__decorateClass$4([
  property({ type: String })
], Header.prototype, "heading", 2);
__decorateClass$4([
  property({ type: Object })
], Header.prototype, "activeDate", 2);
__decorateClass$4([
  property({ type: Object })
], Header.prototype, "expandedDate", 2);
Header = __decorateClass$4([
  customElement("lms-calendar-header"),
  localized()
], Header);
var t2 = { dragStart: true }, e = { delay: 0, distance: 3 };
function n(n2, c2 = {}) {
  let u2, f, { bounds: g, axis: h3 = "both", gpuAcceleration: p2 = true, legacyTranslate: m2 = false, transform: y2, applyUserSelectHack: w2 = true, disabled: b2 = false, ignoreMultitouch: v2 = false, recomputeBounds: x2 = t2, grid: _2, threshold: E2 = e, position: S, cancel: A2, handle: C, defaultClass: D2 = "neodrag", defaultClassDragging: N2 = "neodrag-dragging", defaultClassDragged: M = "neodrag-dragged", defaultPosition: B2 = { x: 0, y: 0 }, onDragStart: R, onDrag: $2, onDragEnd: X2 } = c2, Y2 = false, q2 = false, H2 = 0, P = false, T = false, k2 = 0, L2 = 0, j2 = 0, z2 = 0, I2 = 0, O2 = 0, { x: U, y: W2 } = S ? { x: (S == null ? void 0 : S.x) ?? 0, y: (S == null ? void 0 : S.y) ?? 0 } : B2;
  ot(U, W2);
  let F, G2, J2, K, Q2, V = "", Z2 = !!S;
  x2 = { ...t2, ...x2 }, E2 = { ...e, ...E2 ?? {} };
  let tt2 = /* @__PURE__ */ new Set();
  function et2(t3) {
    Y2 && !q2 && T && P && Q2 && (q2 = true, function(t4) {
      it("neodrag:start", R, t4);
    }(t3), rt2.add(N2), w2 && (V = nt.userSelect, nt.userSelect = "none"));
  }
  const nt = document.body.style, rt2 = n2.classList;
  function ot(t3 = k2, e2 = L2) {
    if (!y2) {
      if (m2) {
        let r3 = `${+t3}px, ${+e2}px`;
        return d(n2, "transform", p2 ? `translate3d(${r3}, 0)` : `translate(${r3})`);
      }
      return d(n2, "translate", `${+t3}px ${+e2}px`);
    }
    const r2 = y2({ offsetX: t3, offsetY: e2, rootNode: n2 });
    o(r2) && d(n2, "transform", r2);
  }
  function it(t3, e2, r2) {
    const o2 = /* @__PURE__ */ function(t4) {
      return { offsetX: k2, offsetY: L2, rootNode: n2, currentNode: Q2, event: t4 };
    }(r2);
    n2.dispatchEvent(new CustomEvent(t3, { detail: o2 })), e2 == null ? void 0 : e2(o2);
  }
  const at = addEventListener, st = new AbortController(), dt = { signal: st.signal, capture: false };
  function lt() {
    let t3 = n2.offsetWidth / G2.width;
    return isNaN(t3) && (t3 = 1), t3;
  }
  return d(n2, "touch-action", "none"), at("pointerdown", (t3) => {
    if (b2) return;
    if (2 === t3.button) return;
    if (tt2.add(t3.pointerId), v2 && tt2.size > 1) return t3.preventDefault();
    if (x2.dragStart && (F = s(g, n2)), o(C) && o(A2) && C === A2) throw new Error("`handle` selector can't be same as `cancel` selector");
    if (rt2.add(D2), J2 = function(t4, e3) {
      if (!t4) return [e3];
      if (l(t4)) return [t4];
      if (Array.isArray(t4)) return t4;
      const n3 = e3.querySelectorAll(t4);
      if (null === n3) throw new Error("Selector passed for `handle` option should be child of the element on which the action is applied");
      return Array.from(n3.values());
    }(C, n2), K = function(t4, e3) {
      if (!t4) return [];
      if (l(t4)) return [t4];
      if (Array.isArray(t4)) return t4;
      const n3 = e3.querySelectorAll(t4);
      if (null === n3) throw new Error("Selector passed for `cancel` option should be child of the element on which the action is applied");
      return Array.from(n3.values());
    }(A2, n2), u2 = /(both|x)/.test(h3), f = /(both|y)/.test(h3), a(K, J2)) throw new Error("Element being dragged can't be a child of the element on which `cancel` is applied");
    const e2 = t3.composedPath()[0];
    if (!J2.some((t4) => {
      var _a;
      return t4.contains(e2) || ((_a = t4.shadowRoot) == null ? void 0 : _a.contains(e2));
    }) || a(K, [e2])) return;
    Q2 = 1 === J2.length ? n2 : J2.find((t4) => t4.contains(e2)), Y2 = true, H2 = Date.now(), E2.delay || (P = true), G2 = n2.getBoundingClientRect();
    const { clientX: r2, clientY: i2 } = t3, d2 = lt();
    u2 && (j2 = r2 - U / d2), f && (z2 = i2 - W2 / d2), F && (I2 = r2 - G2.left, O2 = i2 - G2.top);
  }, dt), at("pointermove", (t3) => {
    if (!Y2 || v2 && tt2.size > 1) return;
    if (!q2) {
      if (!P) {
        Date.now() - H2 >= E2.delay && (P = true, et2(t3));
      }
      if (!T) {
        const e3 = t3.clientX - j2, n3 = t3.clientY - z2;
        Math.sqrt(e3 ** 2 + n3 ** 2) >= E2.distance && (T = true, et2(t3));
      }
      if (!q2) return;
    }
    x2.drag && (F = s(g, n2)), t3.preventDefault(), G2 = n2.getBoundingClientRect();
    let e2 = t3.clientX, o2 = t3.clientY;
    const a2 = lt();
    if (F) {
      const t4 = { left: F.left + I2, top: F.top + O2, right: F.right + I2 - G2.width, bottom: F.bottom + O2 - G2.height };
      e2 = r(e2, t4.left, t4.right), o2 = r(o2, t4.top, t4.bottom);
    }
    if (Array.isArray(_2)) {
      let [t4, n3] = _2;
      if (isNaN(+t4) || t4 < 0) throw new Error("1st argument of `grid` must be a valid positive number");
      if (isNaN(+n3) || n3 < 0) throw new Error("2nd argument of `grid` must be a valid positive number");
      let r2 = e2 - j2, s2 = o2 - z2;
      [r2, s2] = i([t4 / a2, n3 / a2], r2, s2), e2 = j2 + r2, o2 = z2 + s2;
    }
    u2 && (k2 = Math.round((e2 - j2) * a2)), f && (L2 = Math.round((o2 - z2) * a2)), U = k2, W2 = L2, it("neodrag", $2, t3), ot();
  }, dt), at("pointerup", (t3) => {
    (tt2.delete(t3.pointerId), Y2) && (q2 && (at("click", (t4) => t4.stopPropagation(), { once: true, signal: st.signal, capture: true }), x2.dragEnd && (F = s(g, n2)), rt2.remove(N2), rt2.add(M), w2 && (nt.userSelect = V), it("neodrag:end", X2, t3), u2 && (j2 = k2), f && (z2 = L2)), Y2 = false, q2 = false, P = false, T = false);
  }, dt), { destroy: () => st.abort(), update: (n3) => {
    var _a, _b;
    h3 = n3.axis || "both", b2 = n3.disabled ?? false, v2 = n3.ignoreMultitouch ?? false, C = n3.handle, g = n3.bounds, x2 = n3.recomputeBounds ?? t2, A2 = n3.cancel, w2 = n3.applyUserSelectHack ?? true, _2 = n3.grid, p2 = n3.gpuAcceleration ?? true, m2 = n3.legacyTranslate ?? false, y2 = n3.transform, E2 = { ...e, ...n3.threshold ?? {} };
    const r2 = rt2.contains(M);
    rt2.remove(D2, M), D2 = n3.defaultClass ?? "neodrag", N2 = n3.defaultClassDragging ?? "neodrag-dragging", M = n3.defaultClassDragged ?? "neodrag-dragged", rt2.add(D2), r2 && rt2.add(M), Z2 && (U = k2 = ((_a = n3.position) == null ? void 0 : _a.x) ?? k2, W2 = L2 = ((_b = n3.position) == null ? void 0 : _b.y) ?? L2, ot());
  } };
}
var r = (t3, e2, n2) => Math.min(Math.max(t3, e2), n2), o = (t3) => "string" == typeof t3, i = ([t3, e2], n2, r2) => {
  const o2 = (t4, e3) => 0 === e3 ? 0 : Math.ceil(t4 / e3) * e3;
  return [o2(n2, t3), o2(r2, e2)];
};
var a = (t3, e2) => t3.some((t4) => e2.some((e3) => t4.contains(e3)));
function s(t3, e2) {
  if (void 0 === t3) return;
  if (l(t3)) return t3.getBoundingClientRect();
  if ("object" == typeof t3) {
    const { top: e3 = 0, left: n3 = 0, right: r2 = 0, bottom: o2 = 0 } = t3;
    return { top: e3, right: window.innerWidth - r2, bottom: window.innerHeight - o2, left: n3 };
  }
  if ("parent" === t3) return e2.parentNode.getBoundingClientRect();
  const n2 = document.querySelector(t3);
  if (null === n2) throw new Error("The selector provided for bound doesn't exists in the document.");
  return n2.getBoundingClientRect();
}
var d = (t3, e2, n2) => t3.style.setProperty(e2, n2), l = (t3) => t3 instanceof HTMLElement, c = class {
  constructor(t3, e2 = {}) {
    __publicField(this, "_drag_instance");
    __publicField(this, "_options", {});
    this.node = t3, this._drag_instance = n(t3, this._options = e2);
  }
  updateOptions(t3) {
    this._drag_instance.update(Object.assign(this._options, t3));
  }
  set options(t3) {
    this._drag_instance.update(this._options = t3);
  }
  get options() {
    return this._options;
  }
  destroy() {
    this._drag_instance.destroy();
  }
};
var O = (e2) => Object.fromEntries(Object.entries(e2).map(([t3, n2]) => [n2, t3]));
var Re = { action: "ACTION", description: "DESCRIPTION", duration: "DURATION", repeat: "REPEAT", summary: "SUMMARY", trigger: "TRIGGER", attachments: "ATTACH", attendees: "ATTENDEE" };
O(Re);
var De = { method: "METHOD", prodId: "PRODID", version: "VERSION", name: "X-WR-CALNAME" };
O(De);
var Ne = { alarms: "ALARM", categories: "CATEGORIES", created: "CREATED", description: "DESCRIPTION", lastModified: "LAST-MODIFIED", location: "LOCATION", exceptionDates: "EXDATE", recurrenceRule: "RRULE", stamp: "DTSTAMP", start: "DTSTART", summary: "SUMMARY", uid: "UID", timeTransparent: "TRANSP", url: "URL", end: "DTEND", duration: "DURATION", geo: "GEO", class: "CLASS", organizer: "ORGANIZER", priority: "PRIORITY", sequence: "SEQUENCE", status: "STATUS", attach: "ATTACH", recurrenceId: "RECURRENCE-ID", attendees: "ATTENDEE", comment: "COMMENT" };
O(Ne);
var be = { id: "TZID", lastModified: "LAST-MODIFIED", url: "TZURL" };
O(be);
var Ae = { comment: "COMMENT", name: "TZNAME", offsetFrom: "TZOFFSETFROM", offsetTo: "TZOFFSETTO", recurrenceDate: "RDATE", recurrenceRule: "RRULE", start: "DTSTART" };
O(Ae);
var Pt = { byDay: "BYDAY", byHour: "BYHOUR", byMinute: "BYMINUTE", byMonth: "BYMONTH", byMonthday: "BYMONTHDAY", bySecond: "BYSECOND", bySetPos: "BYSETPOS", byWeekNo: "BYWEEKNO", byYearday: "BYYEARDAY", count: "COUNT", frequency: "FREQ", interval: "INTERVAL", until: "UNTIL", workweekStart: "WKST" };
O(Pt);
var ve = { categories: "CATEGORIES", created: "CREATED", description: "DESCRIPTION", lastModified: "LAST-MODIFIED", location: "LOCATION", exceptionDates: "EXDATE", recurrenceRule: "RRULE", stamp: "DTSTAMP", start: "DTSTART", summary: "SUMMARY", uid: "UID", url: "URL", duration: "DURATION", geo: "GEO", class: "CLASS", organizer: "ORGANIZER", priority: "PRIORITY", sequence: "SEQUENCE", status: "STATUS", attach: "ATTACH", recurrenceId: "RECURRENCE-ID", attendees: "ATTENDEE", comment: "COMMENT", completed: "COMPLETED", due: "DUE", percentComplete: "PERCENT-COMPLETE" };
O(ve);
var Ke = { categories: "CATEGORIES", created: "CREATED", description: "DESCRIPTION", lastModified: "LAST-MODIFIED", exceptionDates: "EXDATE", recurrenceRule: "RRULE", stamp: "DTSTAMP", start: "DTSTART", summary: "SUMMARY", uid: "UID", url: "URL", geo: "GEO", class: "CLASS", organizer: "ORGANIZER", sequence: "SEQUENCE", status: "STATUS", attach: "ATTACH", recurrenceId: "RECURRENCE-ID", attendees: "ATTENDEE", comment: "COMMENT" };
O(Ke);
var Ce = { stamp: "DTSTAMP", start: "DTSTART", uid: "UID", url: "URL", organizer: "ORGANIZER", attendees: "ATTENDEE", comment: "COMMENT", end: "DTEND", freeBusy: "FREEBUSY" };
O(Ce);
var $t = /\r\n/, je = `\r
`, oe = ";", Se = "=";
var Pe = (e2) => `${e2}${je}`, y = (e2, t3, n2) => n2 ? t3 == null ? "" : Pe(`${e2};${n2}:${t3}`) : Pe(`${e2}:${t3}`), D = (e2) => Pe(`BEGIN:${e2}`), N = (e2) => Pe(`END:${e2}`);
var E = (e2) => {
  if (!(e2.length < 1)) return `${e2.map((t3) => `${t3.key}${Se}${t3.value}`).join(oe)}`;
};
var er = (e2) => {
  if (e2.type === "uri") {
    let t3 = E([e2.formatType && { key: "FMTTYPE", value: e2.formatType }].filter((n2) => !!n2));
    return y("ATTACH", e2.url, t3);
  }
  if (e2.type === "binary") {
    let t3 = E([e2.value && { key: "VALUE", value: e2.value }, e2.encoding && { key: "ENCODING", value: e2.encoding }].filter((n2) => !!n2));
    return y("ATTACH", e2.binary, t3);
  }
  throw Error(`IcsAttachment has no type! ${JSON.stringify(e2)}`);
};
var J = (e2, t3) => t3 ? `"MAILTO:${e2}"` : `MAILTO:${e2}`;
var z = (e2, t3) => {
  let n2 = E([e2.dir && { key: "DIR", value: `"${e2.dir}"` }, e2.delegatedFrom && { key: "DELEGATED-FROM", value: J(e2.delegatedFrom, true) }, e2.member && { key: "MEMBER", value: J(e2.member, true) }, e2.role && { key: "ROLE", value: e2.role }, e2.name && { key: "CN", value: e2.name }, e2.partstat && { key: "PARTSTAT", value: e2.partstat }, e2.sentBy && { key: "SENT-BY", value: J(e2.sentBy, true) }, e2.rsvp !== void 0 && (e2.rsvp === true || e2.rsvp === false) && { key: "RSVP", value: e2.rsvp === true ? "TRUE" : "FALSE" }].filter((r2) => !!r2));
  return y(t3, J(e2.email), n2);
};
var B = (e2) => {
  if (Object.values(e2).filter((n2) => typeof n2 == "number").length === 0) return;
  let t3 = "";
  return e2.before && (t3 += "-"), t3 += "P", e2.weeks !== void 0 && (t3 += `${e2.weeks}W`), e2.days !== void 0 && (t3 += `${e2.days}D`), (e2.hours !== void 0 || e2.minutes !== void 0 || e2.seconds !== void 0) && (t3 += "T", e2.hours !== void 0 && (t3 += `${e2.hours}H`), e2.minutes !== void 0 && (t3 += `${e2.minutes}M`), e2.seconds !== void 0 && (t3 += `${e2.seconds}S`)), t3;
};
var tr = 6048e5, ce = 6e4, ie = 36e5;
var ht = Symbol.for("constructDateFrom");
function x(e2, t3) {
  return typeof e2 == "function" ? e2(t3) : e2 && typeof e2 == "object" && ht in e2 ? e2[ht](t3) : e2 instanceof Date ? new e2.constructor(t3) : new Date(t3);
}
function p(e2, t3) {
  return x(t3 || e2, e2);
}
function G(e2, t3, n2) {
  let r2 = p(e2, n2 == null ? void 0 : n2.in);
  return isNaN(t3) ? x((n2 == null ? void 0 : n2.in) || e2, NaN) : (t3 && r2.setDate(r2.getDate() + t3), r2);
}
function Fe(e2, t3, n2) {
  let r2 = p(e2, void 0);
  if (isNaN(t3)) return x(e2, NaN);
  if (!t3) return r2;
  let o2 = r2.getDate(), a2 = x(e2, r2.getTime());
  a2.setMonth(r2.getMonth() + t3 + 1, 0);
  let s2 = a2.getDate();
  return o2 >= s2 ? a2 : (r2.setFullYear(a2.getFullYear(), a2.getMonth(), o2), r2);
}
function me(e2, t3, n2) {
  return x(e2, +p(e2) + t3);
}
function ke(e2, t3, n2) {
  return me(e2, t3 * ie);
}
var Kn = {};
function w() {
  return Kn;
}
function se(e2, t3) {
  var c2, i2, f, l2;
  let n2 = w(), r2 = (t3 == null ? void 0 : t3.weekStartsOn) ?? ((i2 = (c2 = t3 == null ? void 0 : t3.locale) == null ? void 0 : c2.options) == null ? void 0 : i2.weekStartsOn) ?? n2.weekStartsOn ?? ((l2 = (f = n2.locale) == null ? void 0 : f.options) == null ? void 0 : l2.weekStartsOn) ?? 0, o2 = p(e2, t3 == null ? void 0 : t3.in), a2 = o2.getDay(), s2 = (a2 < r2 ? 7 : 0) + a2 - r2;
  return o2.setDate(o2.getDate() - s2), o2.setHours(0, 0, 0, 0), o2;
}
function H(e2, ...t3) {
  let n2 = x.bind(null, t3.find((r2) => typeof r2 == "object"));
  return t3.map(n2);
}
function ge(e2, t3) {
  let n2 = p(e2, void 0);
  return n2.setHours(0, 0, 0, 0), n2;
}
function pe(e2, t3, n2) {
  let r2 = p(e2, void 0);
  return r2.setTime(r2.getTime() + t3 * ce), r2;
}
function Ue(e2, t3, n2) {
  return me(e2, t3 * 1e3);
}
function q(e2, t3, n2) {
  return G(e2, t3 * 7, n2);
}
function We(e2, t3, n2) {
  return Fe(e2, t3 * 12);
}
function ue(e2, t3) {
  let n2 = +p(e2) - +p(t3);
  return n2 < 0 ? -1 : n2 > 0 ? 1 : n2;
}
function Je(e2) {
  return e2 instanceof Date || typeof e2 == "object" && Object.prototype.toString.call(e2) === "[object Date]";
}
function Mt(e2, t3) {
  let n2 = p(e2, void 0), r2 = n2.getMonth();
  return n2.setFullYear(n2.getFullYear(), r2 + 1, 0), n2.setHours(23, 59, 59, 999), n2;
}
function pr(e2, t3) {
  let [n2, r2] = H(e2, t3.start, t3.end);
  return { start: n2, end: r2 };
}
function ur(e2, t3) {
  let { start: n2, end: r2 } = pr(void 0, e2), o2 = +n2 > +r2, a2 = o2 ? +n2 : +r2, s2 = o2 ? r2 : n2;
  s2.setHours(0, 0, 0, 0);
  let c2 = 1;
  let i2 = [];
  for (; +s2 <= a2; ) i2.push(x(n2, s2)), s2.setDate(s2.getDate() + c2), s2.setHours(0, 0, 0, 0);
  return o2 ? i2.reverse() : i2;
}
function zt(e2, t3) {
  let n2 = p(e2, void 0);
  return n2.setDate(1), n2.setHours(0, 0, 0, 0), n2;
}
function fr(e2, t3) {
  let n2 = p(e2, void 0), r2 = n2.getFullYear();
  return n2.setFullYear(r2 + 1, 0, 0), n2.setHours(23, 59, 59, 999), n2;
}
function dr(e2, t3) {
  let n2 = p(e2, void 0);
  return n2.setFullYear(n2.getFullYear(), 0, 1), n2.setHours(0, 0, 0, 0), n2;
}
function yr(e2, t3) {
  var l2, S, T, u2;
  let n2 = p(e2, t3 == null ? void 0 : t3.in), r2 = n2.getFullYear(), o2 = w(), a2 = (t3 == null ? void 0 : t3.firstWeekContainsDate) ?? ((S = (l2 = t3 == null ? void 0 : t3.locale) == null ? void 0 : l2.options) == null ? void 0 : S.firstWeekContainsDate) ?? o2.firstWeekContainsDate ?? ((u2 = (T = o2.locale) == null ? void 0 : T.options) == null ? void 0 : u2.firstWeekContainsDate) ?? 1, s2 = x((t3 == null ? void 0 : t3.in) || e2, 0);
  s2.setFullYear(r2 + 1, 0, a2), s2.setHours(0, 0, 0, 0);
  let c2 = se(s2, t3), i2 = x((t3 == null ? void 0 : t3.in) || e2, 0);
  i2.setFullYear(r2, 0, a2), i2.setHours(0, 0, 0, 0);
  let f = se(i2, t3);
  return +n2 >= +c2 ? r2 + 1 : +n2 >= +f ? r2 : r2 - 1;
}
function lr(e2, t3) {
  var c2, i2, f, l2;
  let n2 = w(), r2 = (t3 == null ? void 0 : t3.firstWeekContainsDate) ?? ((i2 = (c2 = t3 == null ? void 0 : t3.locale) == null ? void 0 : c2.options) == null ? void 0 : i2.firstWeekContainsDate) ?? n2.firstWeekContainsDate ?? ((l2 = (f = n2.locale) == null ? void 0 : f.options) == null ? void 0 : l2.firstWeekContainsDate) ?? 1, o2 = yr(e2, t3), a2 = x((t3 == null ? void 0 : t3.in) || e2, 0);
  return a2.setFullYear(o2, 0, r2), a2.setHours(0, 0, 0, 0), se(a2, t3);
}
function Tr(e2, t3) {
  let n2 = p(e2, t3 == null ? void 0 : t3.in), r2 = +se(n2, t3) - +lr(n2, t3);
  return Math.round(r2 / tr) + 1;
}
function xe(e2, t3) {
  return p(e2, void 0).getDay();
}
function He(e2, t3) {
  let n2 = p(e2, void 0), r2 = n2.getFullYear(), o2 = n2.getMonth(), a2 = x(n2, 0);
  return a2.setFullYear(r2, o2 + 1, 0), a2.setHours(0, 0, 0, 0), a2.getDate();
}
function Ir(e2, t3) {
  return p(e2, void 0).getHours();
}
function Sr(e2, t3) {
  return p(e2, void 0).getMinutes();
}
function qe(e2, t3) {
  return p(e2, void 0).getMonth();
}
function gr(e2) {
  return p(e2).getSeconds();
}
function xr(e2, t3) {
  return p(e2, void 0).getFullYear();
}
function Er(e2, t3) {
  return +p(e2) == +p(t3);
}
function Or(e2, t3, n2) {
  let r2 = p(e2, n2 == null ? void 0 : n2.in), o2 = Tr(r2, n2) - t3;
  return r2.setDate(r2.getDate() - o2 * 7), p(r2, n2 == null ? void 0 : n2.in);
}
function Ee(e2, t3, n2) {
  var S, T, u2, m2;
  let r2 = w(), o2 = (n2 == null ? void 0 : n2.weekStartsOn) ?? ((T = (S = n2 == null ? void 0 : n2.locale) == null ? void 0 : S.options) == null ? void 0 : T.weekStartsOn) ?? r2.weekStartsOn ?? ((m2 = (u2 = r2.locale) == null ? void 0 : u2.options) == null ? void 0 : m2.weekStartsOn) ?? 0, a2 = p(e2, n2 == null ? void 0 : n2.in), s2 = a2.getDay(), i2 = (t3 % 7 + 7) % 7, f = 7 - o2, l2 = t3 < 0 || t3 > 6 ? t3 - (s2 + f) % 7 : (i2 + f) % 7 - (s2 + f) % 7;
  return G(a2, l2, n2);
}
function $e(e2, t3, n2) {
  let r2 = +p(e2, void 0), [o2, a2] = [+p(t3.start, void 0), +p(t3.end, void 0)].sort((s2, c2) => s2 - c2);
  return r2 >= o2 && r2 <= a2;
}
function Rr(e2) {
  let t3 = e2 / ie;
  return Math.trunc(t3);
}
function Dr(e2) {
  let t3 = e2 / ce;
  return Math.trunc(t3);
}
function Nr(e2, t3, n2) {
  let r2 = p(e2, void 0), o2 = r2.getFullYear(), a2 = r2.getDate(), s2 = x(e2, 0);
  s2.setFullYear(o2, t3, 15), s2.setHours(0, 0, 0, 0);
  let c2 = He(s2);
  return r2.setMonth(t3, Math.min(a2, c2)), r2;
}
function br(e2, t3, n2) {
  let r2 = p(e2, void 0);
  return r2.setDate(t3), r2;
}
function Ar(e2, t3, n2) {
  let r2 = p(e2, void 0);
  return r2.setMonth(0), r2.setDate(t3), r2;
}
function vr(e2, t3, n2) {
  let r2 = p(e2, void 0);
  return r2.setHours(t3), r2;
}
function Kr(e2, t3, n2) {
  let r2 = p(e2, void 0);
  return r2.setMinutes(t3), r2;
}
function Cr(e2, t3, n2) {
  let r2 = p(e2, void 0);
  return r2.setSeconds(t3), r2;
}
function Vr(e2, t3, n2) {
  return q(e2, -t3, n2);
}
var Ze = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
var fe = (e2, t3) => t3 === void 0 ? false : e2 >= t3, Mr = (e2, { start: t3, end: n2 }, r2) => {
  if (fe(r2.length, e2.count)) return;
  let o2 = e2.frequency, a2 = e2.interval || 1;
  if (!o2) return;
  let s2 = t3;
  if (o2 === "SECONDLY") {
    for (; s2 < n2; ) {
      if (fe(r2.length, e2.count)) return;
      s2 = Ue(s2, a2), r2.push([s2]);
    }
    return;
  }
  if (o2 === "MINUTELY") {
    for (; s2 < n2; ) {
      if (fe(r2.length, e2.count)) return;
      s2 = pe(s2, a2), r2.push([s2]);
    }
    return;
  }
  if (o2 === "HOURLY") {
    for (; s2 < n2; ) {
      if (fe(r2.length, e2.count)) return;
      s2 = ke(s2, a2), r2.push([s2]);
    }
    return;
  }
  if (o2 === "DAILY") {
    for (; s2 < n2; ) {
      if (fe(r2.length, e2.count)) return;
      s2 = G(s2, a2), r2.push([s2]);
    }
    return;
  }
  if (o2 === "WEEKLY") {
    for (; s2 < n2; ) {
      if (fe(r2.length, e2.count)) return;
      s2 = q(s2, a2), r2.push([s2]);
    }
    return;
  }
  if (o2 === "MONTHLY") {
    for (; s2 < n2; ) s2 = Fe(s2, a2), r2.push([s2]);
    return;
  }
  if (o2 === "YEARLY") {
    for (; s2 < n2; ) s2 = We(s2, a2), r2.push([s2]);
    return;
  }
};
var zr = (e2, t3, n2, r2) => {
  let o2 = n2.map(({ day: a2, occurence: s2 }) => ({ occurence: s2, day: Ze.indexOf(a2) }));
  return e2.frequency === "YEARLY" ? e2.byYearday || e2.byMonthday ? t3.map((a2) => a2.filter((s2) => o2.find(({ day: c2 }) => c2 === xe(s2)))) : e2.byWeekNo ? t3.map((a2) => a2.flatMap((s2) => o2.map(({ day: c2 }) => Ee(s2, c2, { weekStartsOn: r2 })))) : e2.byMonth ? t3.map((a2) => a2.flatMap((s2) => o2.flatMap(({ day: c2, occurence: i2 }) => Bt(Z(zt(s2)), Z(Mt(s2)), c2, r2, i2)))) : t3.map((a2) => a2.flatMap((s2) => o2.flatMap(({ day: c2, occurence: i2 }) => Bt(Z(dr(s2)), Z(fr(s2)), c2, r2, i2)))) : e2.frequency === "MONTHLY" ? e2.byMonthday ? t3.map((a2) => a2.filter((s2) => o2.find(({ day: c2 }) => c2 === xe(s2)))) : t3.map((a2) => a2.flatMap((s2) => o2.flatMap(({ day: c2, occurence: i2 }) => Bt(Z(zt(s2)), Z(Mt(s2)), c2, r2, i2)))) : e2.frequency === "WEEKLY" ? t3.map((a2) => a2.flatMap((s2) => o2.map(({ day: c2 }) => Ee(s2, c2, { weekStartsOn: r2 })))) : t3.map((a2) => a2.filter((s2) => o2.find(({ day: c2 }) => c2 === xe(s2))));
}, Bt = (e2, t3, n2, r2, o2) => {
  if (o2 !== void 0) {
    if (!(o2 < 0)) {
      let l2 = Ee(e2, n2, { weekStartsOn: r2 }), S = e2 > l2;
      return q(l2, (o2 || 1) - 1 + (S ? 1 : 0));
    }
    let c2 = Ee(t3, n2, { weekStartsOn: r2 }), i2 = t3 < c2;
    return Z(ge(Vr(c2, -(o2 || 1) - 1 + (i2 ? 1 : 0))));
  }
  return ur({ start: e2, end: t3 }).map((s2) => Z(s2)).filter((s2) => $e(s2, { start: e2, end: t3 })).filter((s2) => n2 === xe(s2));
}, Z = (e2) => pe(e2, -e2.getTimezoneOffset());
var Br = (e2, t3, n2) => e2.frequency === "YEARLY" || e2.frequency === "MONTHLY" || e2.frequency === "WEEKLY" || e2.frequency === "DAILY" ? t3.map((r2) => r2.flatMap((o2) => n2.map((a2) => vr(o2, a2)))) : t3.map((r2) => r2.filter((o2) => n2.includes(Ir(o2))));
var Yr = (e2, t3, n2) => e2.frequency === "YEARLY" || e2.frequency === "MONTHLY" || e2.frequency === "WEEKLY" || e2.frequency === "DAILY" || e2.frequency === "HOURLY" ? t3.map((r2) => r2.flatMap((o2) => n2.map((a2) => Kr(o2, a2)))) : t3.map((r2) => r2.filter((o2) => n2.includes(Sr(o2))));
var _r = (e2, t3, n2) => e2.frequency === "YEARLY" ? t3.map((r2) => r2.flatMap((o2) => n2.map((a2) => Nr(o2, a2)))) : t3.map((r2) => r2.filter((o2) => n2.includes(qe(o2))));
var jr = (e2, t3, n2) => e2.frequency === "YEARLY" || e2.frequency === "MONTHLY" ? t3.map((r2) => r2.flatMap((o2) => {
  let a2 = He(o2);
  return n2.map((s2) => s2 > a2 ? void 0 : br(o2, s2)).filter((s2) => !!s2);
})) : e2.frequency === "WEEKLY" ? t3 : t3.map((r2) => r2.filter((o2) => n2.includes(qe(o2))));
var Pr = (e2, t3, n2) => e2.frequency === "YEARLY" || e2.frequency === "MONTHLY" || e2.frequency === "WEEKLY" || e2.frequency === "DAILY" || e2.frequency === "HOURLY" || e2.frequency === "MINUTELY" ? t3.map((r2) => r2.flatMap((o2) => n2.map((a2) => Cr(o2, a2)))) : t3.map((r2) => r2.filter((o2) => n2.includes(gr(o2))));
var Fr = (e2, t3, n2) => !e2.byYearday && !e2.byWeekNo && !e2.byMonthday && !e2.byMonth && !e2.byDay && !e2.byHour && !e2.byMinute && !e2.bySecond ? t3 : t3.map((r2) => r2.sort(ue).filter((o2, a2) => n2.some((s2) => s2 > 0 ? a2 === 0 ? false : a2 % s2 === 0 : a2 === 0 ? r2.length - 1 + s2 === 0 : a2 % (r2.length - 1 + s2) === 0)));
var kr = (e2, t3, n2, r2) => e2.frequency === "YEARLY" ? t3.map((o2) => o2.flatMap((a2) => n2.map((s2) => Or(a2, s2, { weekStartsOn: r2 })))) : t3;
var Ur = (e2, t3, n2) => e2.frequency === "YEARLY" ? t3.map((r2) => r2.flatMap((o2) => n2.map((a2) => Ar(o2, a2)))) : e2.frequency === "MONTHLY" || e2.frequency === "WEEKLY" || e2.frequency === "DAILY" ? t3 : t3.map((r2) => r2.filter((o2) => n2.includes(xr(o2))));
var Wr = (e2, t3, n2) => {
  let r2 = n2;
  return e2.byMonth && (r2 = _r(e2, r2, e2.byMonth)), e2.byWeekNo && (r2 = kr(e2, r2, e2.byWeekNo, t3.weekStartsOn)), e2.byYearday && (r2 = Ur(e2, r2, e2.byYearday)), e2.byMonthday && (r2 = jr(e2, r2, e2.byMonthday)), e2.byDay && (r2 = zr(e2, r2, e2.byDay, t3.weekStartsOn)), e2.byHour && (r2 = Br(e2, r2, e2.byHour)), e2.byMinute && (r2 = Yr(e2, r2, e2.byMinute)), e2.bySecond && (r2 = Pr(e2, r2, e2.bySecond)), e2.bySetPos && (r2 = Fr(e2, r2, e2.bySetPos)), r2.map((a2) => a2.sort(ue).filter((s2) => !(t3.exceptions.length > 0 && t3.exceptions.some((c2) => Er(c2, s2)) || !$e(s2, { start: t3.start, end: t3.end }))));
};
var Cn = 2, Jr = (e2, t3) => {
  var f;
  let n2 = t3.start, r2 = ((f = e2.until) == null ? void 0 : f.date) || (t3 == null ? void 0 : t3.end) || We(n2, Cn), o2 = t3.exceptions || [], a2 = (e2.workweekStart ? Ze.indexOf(e2.workweekStart) : 1) % 7, s2 = [[n2]];
  Mr(e2, { start: n2, end: r2 }, s2);
  let c2 = Wr(e2, { start: n2, end: r2, exceptions: o2, weekStartsOn: a2 }, s2);
  return e2.count ? c2.flat().splice(0, e2.count) : c2.flat();
};
var Gr = (e2, t3) => t3.flatMap((n2) => !n2.recurrenceRule || n2.recurrenceRule.until && n2.recurrenceRule.until.date < e2 ? n2 : Jr(n2.recurrenceRule, { start: n2.start, end: e2 }).map((o2) => ({ ...n2, start: o2 })));
var Yt = (e2) => {
  let t3 = e2[0] === "+" ? 1 : -1, n2 = Number(e2.slice(1, 3)), r2 = e2.length > 3 ? Number(e2.slice(3, 5)) : 0, o2 = e2.length > 5 ? Number(e2.slice(5, 7)) : 0;
  return ((n2 * 60 + r2) * 60 + o2) * 1e3 * t3;
};
var wr = (e2, t3) => {
  let n2 = "en-US", r2 = new Date(t3.toLocaleString(n2, { timeZone: "UTC" }));
  try {
    return new Date(t3.toLocaleString(n2, { timeZone: e2 })).getTime() - r2.getTime();
  } catch {
    return t3.getTime() - r2.getTime();
  }
};
var Xe = (e2, t3, n2) => {
  let r2 = n2 == null ? void 0 : n2.find((a2) => a2.id === t3);
  if (r2) {
    let a2 = Gr(e2, r2.props).sort((i2, f) => ue(i2.start, f.start));
    for (let i2 = 0; i2 < a2.length; i2 += 1) if (e2 < a2[i2].start) {
      let f = a2[i2 - 1] ? a2[i2 - 1].offsetTo : a2[i2].offsetFrom, l2 = f.length > 5 ? f.substring(0, 5) : f;
      return { offset: l2, milliseconds: Yt(l2) };
    }
    let s2 = a2[a2.length - 1].offsetTo, c2 = s2.length > 5 ? s2.substring(0, 5) : s2;
    return { offset: c2, milliseconds: Yt(c2) };
  }
  let o2 = wr(t3, e2);
  if (!Number.isNaN(o2)) {
    let a2 = o2 < 0, s2 = Math.abs(Rr(o2)), c2 = Math.abs(Dr(o2)) - s2 * 60, i2 = s2.toString().length === 1 ? `0${s2}` : s2.toString(), f = c2.toString().length === 1 ? `0${c2}` : c2.toString();
    return { offset: `${a2 ? "-" : "+"}${i2}${f}`, milliseconds: o2 };
  }
};
var Qe = (e2) => {
  if (!Je(e2)) throw Error(`Incorrect date object: ${e2}`);
  let t3 = e2.toISOString(), n2 = t3.slice(0, 4), r2 = t3.slice(5, 7), o2 = t3.slice(8, 10);
  return `${n2}${r2}${o2}`;
}, h2 = (e2) => {
  if (!Je(e2)) throw Error(`Incorrect date object: ${e2}`);
  return qr(e2);
}, Hr = (e2, t3, n2) => {
  let r2 = t3.date;
  if (!Je(r2)) throw Error(`Incorrect date object: ${r2}`);
  return Xe(r2, t3.timezone, n2) ? qr(r2, true) : h2(e2);
}, qr = (e2, t3) => {
  let n2 = e2.toISOString(), r2 = n2.slice(0, 4), o2 = n2.slice(5, 7), a2 = n2.slice(8, 10), s2 = n2.slice(11, 13), c2 = n2.slice(14, 16), i2 = n2.slice(17, 19);
  return `${r2}${o2}${a2}T${s2}${c2}${i2}${t3 ? "" : "Z"}`;
};
var $r = (e2) => {
  var n2, r2;
  let t3 = E([((n2 = e2.options) == null ? void 0 : n2.related) && { key: "RELATED", value: e2.options.related }].filter((o2) => !!o2));
  if (e2.type === "absolute") return y("TRIGGER", h2((r2 = e2.value) == null ? void 0 : r2.date));
  if (e2.type === "relative") return y("TRIGGER", B(e2.value), t3);
};
var b = (e2) => Object.keys(e2);
var A = (e2, t3) => {
  if (!e2) return "";
  let n2 = "";
  return Object.entries(e2).map(([r2, o2]) => {
    {
      n2 += y(Vn(r2), o2 == null ? void 0 : o2.toString());
      return;
    }
  }), n2;
}, Vn = (e2) => {
  let t3 = "X-";
  for (let n2 of e2) n2 === n2.toUpperCase() && (t3 += "-"), t3 += n2.toUpperCase();
  return t3;
};
var Zr = (e2, t3) => {
  let n2 = b(e2), r2 = "";
  return r2 += D("VALARM"), n2.forEach((o2) => {
    if (o2 === "attachments" || o2 === "attendees") return;
    if (o2 === "nonStandard") {
      r2 += A(e2[o2]);
      return;
    }
    let a2 = Re[o2];
    if (!a2) return;
    let s2 = e2[o2];
    if (s2 && s2 != null) {
      if (o2 === "trigger") {
        r2 += $r(s2);
        return;
      }
      if (o2 === "duration") {
        r2 += y(a2, B(s2));
        return;
      }
      if (o2 === "repeat") {
        r2 += y(a2, s2 == null ? void 0 : s2.toString());
        return;
      }
      r2 += y(a2, String(s2));
    }
  }), e2.attachments && e2.attachments.length > 0 && e2.attachments.forEach((o2) => {
    r2 += er(o2);
  }), e2.attendees && e2.attendees.length > 0 && e2.attendees.forEach((o2) => {
    r2 += z(o2, "ATTENDEE");
  }), r2 += N("VALARM"), r2;
};
var L = (e2, t3, n2 = [], r2) => {
  let o2 = E([t3.type && { key: "VALUE", value: t3.type }, t3.local && !(r2 != null && r2.forceUtc) && { key: "TZID", value: t3.local.timezone }, ...n2].filter((s2) => !!s2)), a2 = t3.type === "DATE" ? Qe(t3.date) : t3.local && !(r2 != null && r2.forceUtc) ? Hr(t3.date, t3.local, r2 == null ? void 0 : r2.timezones) : h2(t3.date);
  return y(e2, a2, o2);
};
var de = (e2, t3, n2) => L(t3, e2, void 0, n2);
var X = (e2) => {
  let t3 = E([e2.dir && { key: "DIR", value: `"${e2.dir}"` }, e2.name && { key: "CN", value: e2.name }, e2.sentBy && { key: "SENT-BY", value: J(e2.sentBy) }].filter((n2) => !!n2));
  return y("ORGANIZER", J(e2.email), t3);
};
var Xr = (e2) => e2.occurence ? `${e2.occurence}${e2.day}` : e2.day;
var Q = (e2) => {
  var r2;
  let t3 = "", n2 = E([e2.byDay && { key: "BYDAY", value: e2.byDay.map((o2) => Xr(o2)).join(",") }, e2.byHour && { key: "BYHOUR", value: e2.byHour.join(",") }, e2.byMinute && { key: "BYMINUTE", value: e2.byMinute.join(",") }, e2.byMonth && { key: "BYMONTH", value: e2.byMonth.map((o2) => o2 + 1).join(",") }, e2.byMonthday && { key: "BYMONTHDAY", value: e2.byMonthday.join(",") }, e2.bySecond && { key: "BYSECOND", value: e2.bySecond.join(",") }, e2.bySetPos && { key: "BYSETPOS", value: e2.bySetPos.join(",") }, e2.byWeekNo && { key: "BYWEEKNO", value: e2.byWeekNo.join(",") }, e2.byYearday && { key: "BYYEARDAY", value: e2.byYearday.join(",") }, e2.count && { key: "COUNT", value: e2.count.toString() }, e2.frequency && { key: "FREQ", value: e2.frequency }, e2.interval && { key: "INTERVAL", value: e2.interval.toString() }, e2.until && { key: "UNTIL", value: e2.until.type === "DATE" ? Qe(e2.until.date) : h2(((r2 = e2.until.local) == null ? void 0 : r2.date) || e2.until.date) }, e2.workweekStart && { key: "WKST", value: e2.workweekStart }].filter((o2) => !!o2));
  return t3 += y("RRULE", n2), t3;
};
var hn = (e2) => {
  let t3 = (e2.match(/\n/g) || []).length;
  return e2.length + t3;
}, Y = (e2) => {
  let t3 = e2.split($t), n2 = [];
  return t3.forEach((r2) => {
    if (hn(r2) < 75) {
      n2.push(r2);
      return;
    }
    Ln(r2, 75).forEach((o2) => {
      n2.push(o2);
    });
  }), n2.join(je);
}, Ln = (e2, t3) => {
  let n2 = [], r2 = "", o2 = 0;
  for (let a2 = 0; a2 < e2.length; a2++) {
    let s2 = e2[a2], i2 = s2 === `
` ? 2 : 1;
    o2 + i2 > t3 ? (n2.push(n2.length === 0 ? r2 : ` ${r2}`), r2 = s2, o2 = i2) : (r2 += s2, o2 += i2);
  }
  return r2 && n2.push(n2.length === 0 ? r2 : ` ${r2}`), n2;
};
var k = (e2) => e2.replace(/([\\;,])|(\n)/g, (t3, n2, r2) => n2 ? `\\${n2}` : "\\n");
var ye = (e2, t3) => {
  let n2 = "";
  return n2 += L("RECURRENCE-ID", e2.value, e2.range ? [{ key: "RANGE", value: e2.range }] : void 0, t3), n2;
};
var Mn = ["stamp", "start", "end", "created", "lastModified"], et = (e2) => Mn.includes(e2), zn = ["categories"], tt = (e2) => zn.includes(e2), Bn = ["description", "location", "comment", "summary"], rt = (e2) => Bn.includes(e2);
var Qr = (e2, t3) => {
  let n2 = b(e2), r2 = "";
  return r2 += D("VEVENT"), n2.forEach((o2) => {
    if (o2 === "alarms" || o2 === "attendees" || o2 === "exceptionDates") return;
    if (o2 === "nonStandard") {
      r2 += A(e2[o2]);
      return;
    }
    if (o2 === "descriptionAltRep") return;
    let a2 = Ne[o2];
    if (!a2) return;
    let s2 = e2[o2];
    if (s2 != null) {
      if (et(o2)) {
        r2 += L(a2, s2, void 0, { timezones: void 0, forceUtc: o2 === "stamp" });
        return;
      }
      if (tt(o2)) {
        r2 += y(a2, s2.join(","));
        return;
      }
      if (o2 === "description" && e2.descriptionAltRep) {
        r2 += y(a2, k(s2), E([{ key: "ALTREP", value: `"${e2.descriptionAltRep}"` }]));
        return;
      }
      if (rt(o2)) {
        r2 += y(a2, k(s2));
        return;
      }
      if (o2 === "recurrenceRule") {
        r2 += Q(s2);
        return;
      }
      if (o2 === "duration") {
        r2 += y(a2, B(s2));
        return;
      }
      if (o2 === "organizer") {
        r2 += X(s2);
        return;
      }
      if (o2 === "sequence") {
        r2 += y(a2, s2.toString());
        return;
      }
      if (o2 === "recurrenceId") {
        r2 += ye(s2, { timezones: void 0 });
        return;
      }
      r2 += y(a2, String(s2));
    }
  }), e2.alarms && e2.alarms.length > 0 && e2.alarms.forEach((o2) => {
    r2 += Zr(o2);
  }), e2.attendees && e2.attendees.length > 0 && e2.attendees.forEach((o2) => {
    r2 += z(o2, "ATTENDEE");
  }), e2.exceptionDates && e2.exceptionDates.length > 0 && e2.exceptionDates.forEach((o2) => {
    r2 += de(o2, "EXDATE", { timezones: void 0 });
  }), r2 += N("VEVENT"), Y(r2);
};
var __defProp$3 = Object.defineProperty;
var __getOwnPropDesc$3 = Object.getOwnPropertyDescriptor;
var __decorateClass$3 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$3(target, key) : target;
  for (var i2 = decorators.length - 1, decorator; i2 >= 0; i2--)
    if (decorator = decorators[i2])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$3(target, key, result);
  return result;
};
let Menu = class extends LitElement {
  constructor() {
    super(...arguments);
    this.open = false;
    this.eventDetails = {
      heading: "",
      content: "",
      time: ""
    };
    this.minimized = false;
    this._handleMinimize = () => {
      this.minimized = !this.minimized;
    };
    this._handleClose = () => {
      this.open = false;
      this.minimized = false;
      this.dispatchEvent(
        new CustomEvent("menu-close", { bubbles: true, composed: true })
      );
    };
    this._handleExport = () => {
      const { heading, content, time, date } = this.eventDetails;
      const eventYear = (date == null ? void 0 : date.year) ?? 2025;
      const eventMonth = ((date == null ? void 0 : date.month) ?? 4) - 1;
      const eventDay = (date == null ? void 0 : date.day) ?? 18;
      let start, end;
      if (typeof time === "string") {
        const match2 = time.match(/(\d{2}):(\d{2}) - (\d{2}):(\d{2})/);
        if (match2) {
          start = {
            date: new Date(
              eventYear,
              eventMonth,
              eventDay,
              parseInt(match2[1]),
              parseInt(match2[2])
            )
          };
          end = {
            date: new Date(
              eventYear,
              eventMonth,
              eventDay,
              parseInt(match2[3]),
              parseInt(match2[4])
            )
          };
        }
      }
      const event = {
        start: {
          date: start && start.date || new Date(eventYear, eventMonth, eventDay, 12, 0)
        },
        end: {
          date: end && end.date || new Date(eventYear, eventMonth, eventDay, 13, 0)
        },
        summary: heading,
        description: content,
        status: "CONFIRMED",
        uid: `${Date.now()}@lms-calendar`,
        stamp: { date: /* @__PURE__ */ new Date() }
      };
      const vevent = Qr(event);
      const icsString = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//LMS Calendar//EN",
        vevent.trim(),
        "END:VCALENDAR"
      ].join("\r\n");
      const blob = new Blob([icsString], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a2 = document.createElement("a");
      a2.href = url;
      a2.download = `${heading || "event"}.ics`;
      document.body.appendChild(a2);
      a2.click();
      setTimeout(() => {
        document.body.removeChild(a2);
        URL.revokeObjectURL(url);
      }, 0);
    };
  }
  connectedCallback() {
    super.connectedCallback();
  }
  disconnectedCallback() {
    var _a;
    super.disconnectedCallback();
    (_a = this._dragInstance) == null ? void 0 : _a.destroy();
  }
  firstUpdated() {
    const handle = this.renderRoot.querySelector(".header");
    if (handle) {
      this._dragInstance = new c(this, { handle });
    }
  }
  render() {
    this.style.display = this.open ? "" : "none";
    return html`
            <div>
                <div class="header" title=${messages.dragToMove()}>
                    <span class="title">${messages.eventDetails()}</span>
                    <button
                        @click=${this._handleMinimize}
                        title=${messages.minimize()}
                    >
                        ${this.minimized ? "+" : "-"}
                    </button>
                    <button
                        @click=${this._handleClose}
                        title=${messages.close()}
                    >
                        ×
                    </button>
                </div>
                <div class="content" ?hidden=${this.minimized}>
                    <div
                        class="menu-item"
                        @click=${this._handleExport}
                        title=${messages.exportAsICS()}
                    >
                        ${messages.exportAsICS()}
                    </div>
                    <div class="event-details">
                        <div class="event-detail">
                            <strong>${messages.title()}:</strong>
                            <span
                                >${this.eventDetails.heading || messages.noTitle()}</span
                            >
                        </div>
                        <div class="event-detail">
                            <strong>${messages.time()}:</strong>
                            <span
                                >${this.eventDetails.time || messages.noTime()}</span
                            >
                        </div>
                        ${this.eventDetails.date ? html`<div class="event-detail">
                                  <strong>${messages.date()}:</strong>
                                  <span
                                      >${this.eventDetails.date.day}/${this.eventDetails.date.month}/${this.eventDetails.date.year}</span
                                  >
                              </div>` : ""}
                        ${this.eventDetails.content ? html`<div class="event-detail">
                                  <strong>${messages.notes()}:</strong>
                                  <span>${this.eventDetails.content}</span>
                              </div>` : ""}
                    </div>
                </div>
            </div>
        `;
  }
};
Menu.styles = css`
        :host {
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, 0);
            z-index: 1000;
            background: var(--background-color);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--separator-light);
            border-radius: var(--border-radius-sm);
            min-width: var(--menu-min-width);
            max-width: var(--menu-max-width);
            font-family: var(--system-ui);
            transition: opacity 0.2s, visibility 0.2s;
            opacity: 1;
            visibility: visible;
        }
        .header {
            display: flex;
            align-items: center;
            gap: var(--menu-detail-gap);
            background: var(--background-color);
            cursor: grab;
            padding: var(--menu-header-padding);
            border-bottom: 1px solid var(--separator-light);
            border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
            user-select: none;
        }
        .header .title {
            flex: 1;
            font-size: var(--menu-title-font-size);
            font-weight: var(--menu-title-font-weight);
            color: var(--separator-dark);
        }
        .header button {
            background: none;
            border: 1px solid transparent;
            border-radius: var(--button-border-radius);
            cursor: pointer;
            font-size: var(--menu-title-font-size);
            line-height: 1;
            padding: var(--menu-button-padding);
            width: var(--menu-button-size);
            height: var(--menu-button-size);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--header-text-color);
            transition: background-color 0.15s, color 0.15s;
        }
        .header button:hover {
            background-color: var(--separator-light);
            color: var(--separator-dark);
        }
        .content {
            padding: var(--menu-content-padding);
            display: block;
            font-size: var(--menu-content-font-size);
        }
        .content[hidden] {
            display: none;
        }
        .menu-item {
            padding: var(--menu-item-padding);
            margin-bottom: var(--menu-item-margin-bottom);
            background: var(--separator-light);
            border-radius: var(--border-radius-sm);
            cursor: pointer;
            font-weight: var(--menu-item-font-weight);
            text-align: center;
            transition: background-color 0.15s, color 0.15s;
            border: 1px solid transparent;
        }
        .menu-item:hover {
            background: var(--primary-color);
            color: white;
        }
        .event-details {
            display: flex;
            flex-direction: column;
            gap: var(--menu-detail-gap);
        }
        .event-detail {
            display: flex;
            align-items: flex-start;
            gap: var(--menu-detail-gap);
        }
        .event-detail strong {
            min-width: var(--menu-detail-label-min-width);
            font-weight: var(--menu-item-font-weight);
            color: var(--header-text-color);
            font-size: var(--menu-detail-label-font-size);
        }
        .event-detail span {
            flex: 1;
            color: var(--separator-dark);
            word-break: break-word;
        }
    `;
__decorateClass$3([
  property({ type: Boolean })
], Menu.prototype, "open", 2);
__decorateClass$3([
  property({ type: Object })
], Menu.prototype, "eventDetails", 2);
__decorateClass$3([
  state()
], Menu.prototype, "minimized", 2);
Menu = __decorateClass$3([
  customElement("lms-menu"),
  localized()
], Menu);
class DirectionalCalendarDateCalculator {
  constructor({
    date,
    direction
  }) {
    if (date) {
      this.date = date;
    }
    this._direction = direction;
  }
  set date(date) {
    const newDate = DateTime.fromObject(date);
    if (!newDate.isValid) {
      throw new Error("date couldn't be converted to DateTime object");
    }
    this._date = newDate;
  }
  set direction(direction) {
    this._direction = direction;
  }
  _toCalendarDate(date) {
    return {
      day: date.day,
      month: date.month,
      year: date.year
    };
  }
  getDateByDayInDirection() {
    if (!this._date || !this._date.isValid) {
      throw new Error("date is not set or invalid");
    }
    if (!this._direction) {
      throw new Error("direction is not set");
    }
    const adjustedDate = this._date.plus({
      days: this._direction === "next" ? 1 : -1
    });
    if (!adjustedDate.isValid) {
      throw new Error("generated date is invalid");
    }
    this._date = adjustedDate;
    return this._toCalendarDate(adjustedDate);
  }
  getDateByMonthInDirection() {
    if (!this._date || !this._date.isValid) {
      throw new Error("date is not set");
    }
    if (!this._direction) {
      throw new Error("direction is not set");
    }
    const adjustedDate = this._date.plus({
      months: this._direction === "next" ? 1 : -1
    });
    if (!adjustedDate.isValid) {
      throw new Error("generated date is invalid");
    }
    this._date = adjustedDate;
    return this._toCalendarDate(adjustedDate);
  }
}
var __defProp$2 = Object.defineProperty;
var __getOwnPropDesc$2 = Object.getOwnPropertyDescriptor;
var __decorateClass$2 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$2(target, key) : target;
  for (var i2 = decorators.length - 1, decorator; i2 >= 0; i2--)
    if (decorator = decorators[i2])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$2(target, key, result);
  return result;
};
let Month = class extends LitElement {
  constructor() {
    super(...arguments);
    this.currentDate = /* @__PURE__ */ new Date();
    this.activeDate = {
      day: this.currentDate.getDate(),
      month: this.currentDate.getMonth() + 1,
      year: this.currentDate.getFullYear()
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("open-menu", (e2) => {
      const customEvent = e2;
      if (e2.target !== this) {
        e2.stopPropagation();
        const forwardedEvent = new CustomEvent("open-menu", {
          detail: customEvent.detail,
          bubbles: true,
          composed: true
        });
        this.dispatchEvent(forwardedEvent);
      }
    });
  }
  _isCurrentDate(date) {
    return new Date(date).toDateString() === this.currentDate.toDateString();
  }
  _renderIndicator({ year, month, day }) {
    const isCurrentDate = this._isCurrentDate(`${year}/${month}/${day}`);
    const isActiveMonth = month === this.activeDate.month && year === this.activeDate.year;
    return html` <div
            class="indicator ${classMap({
      current: isCurrentDate
    })}"
        >
            ${z$1([day, isActiveMonth]).with(
      [1, true],
      () => html` ${day}. ${getLocalizedMonth(month)} `
    ).with(
      [1, false],
      () => html` ${day}. ${getLocalizedMonth(month)} `
    ).otherwise(() => html` ${day} `)}
        </div>`;
  }
  render() {
    var _a;
    return html`
            <div class="month">
                ${(_a = this._getCalendarArray()) == null ? void 0 : _a.map(
      ({ year, month, day }) => html`<div
                            class="day"
                            data-date="${year}-${month}-${day}"
                            @click=${this._dispatchExpand}
                            @keydown=${this._handleKeydown}
                            tabindex="0"
                        >
                            ${this._renderIndicator({ year, month, day })}
                            <slot
                                name="${year}-${month}-${day}"
                                .date=${{ year, month, day }}
                            ></slot>
                        </div>`
    )}
            </div>
        `;
  }
  _dispatchExpand(e2) {
    const target = e2.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.closest("lms-calendar-entry")) {
      return;
    }
    const { date } = target.dataset;
    if (!date) {
      return;
    }
    const [year, month, day] = date.split("-").map((field) => parseInt(field, 10));
    const event = new CustomEvent("expand", {
      detail: { date: { day, month, year } },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
  _handleKeydown(e2) {
    const key = e2.key;
    if (!(key === "Space" || key === "Enter")) {
      return;
    }
    this._dispatchExpand(e2);
  }
  _getDaysInMonth(date) {
    return z$1(date).with(
      { year: N$1.number, month: N$1.number, day: N$1.number },
      ({ year, month }) => {
        const days = new Date(year, month, 0).getDate();
        return days > 0 ? days : 0;
      }
    ).otherwise(() => 0);
  }
  _getOffsetOfFirstDayInMonth(date) {
    return z$1(date).with({ year: N$1.number, month: N$1.number }, ({ year, month }) => {
      const offset2 = (/* @__PURE__ */ new Date(`${year}/${month}/01`)).getDay();
      return offset2 === 0 ? 6 : offset2 - 1;
    }).otherwise(() => 0);
  }
  _getDatesInMonthAsArray(date, sliceArgs) {
    const daysInMonth2 = this._getDaysInMonth(date);
    return z$1(daysInMonth2).with(0, () => []).otherwise(
      (days) => Array.from(Array(days).keys(), (_2, n2) => ({
        year: date.year,
        month: date.month,
        day: n2 + 1
      })).slice(...sliceArgs || [0])
    );
  }
  _getCalendarArray() {
    if (!this.activeDate) {
      return [];
    }
    const dateTransformer = new DirectionalCalendarDateCalculator({
      date: this.activeDate
    });
    try {
      dateTransformer.direction = "previous";
      const offset2 = this._getOffsetOfFirstDayInMonth(this.activeDate);
      const previousMonth = offset2 > 0 ? this._getDatesInMonthAsArray(
        dateTransformer.getDateByMonthInDirection(),
        [-offset2]
      ) : [];
      const activeMonth = this._getDatesInMonthAsArray(
        this.activeDate,
        []
      );
      dateTransformer.date = this.activeDate;
      dateTransformer.direction = "next";
      const remainingDays = 42 - (previousMonth.length + activeMonth.length);
      const nextMonth = remainingDays > 0 ? this._getDatesInMonthAsArray(
        dateTransformer.getDateByMonthInDirection(),
        [0, remainingDays]
      ) : [];
      return previousMonth.concat(activeMonth, nextMonth);
    } catch (error) {
      console.error("Error generating calendar array:", error);
      return [];
    }
  }
};
Month.styles = css`
        .month {
            height: calc(
                100% - var(--month-header-context-height, 5.5em) + 2px
            );
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            border-top: 1px solid var(--separator-light);
        }

        .month > div {
            border-bottom: 1px solid var(--separator-light);
            border-right: 1px solid var(--separator-light);
        }

        .month > div:nth-child(7n + 7) {
            border-right: none;
        }

        .month > div:nth-last-child(-n + 7) {
            border-bottom: none;
        }

        .day {
            width: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
            gap: var(--month-day-gap, 1px);
        }

        .indicator.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .indicator {
            position: sticky;
            top: var(--indicator-top, 0.25em);
            text-align: right;
            padding: 0 var(--indicator-padding, 0.25em);
            margin-bottom: var(--indicator-margin-bottom, 0.25em);
            text-align: left;
        }
    `;
__decorateClass$2([
  property({ attribute: false })
], Month.prototype, "activeDate", 2);
Month = __decorateClass$2([
  customElement("lms-calendar-month"),
  localized()
], Month);
var __defProp$1 = Object.defineProperty;
var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
var __decorateClass$1 = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc$1(target, key) : target;
  for (var i2 = decorators.length - 1, decorator; i2 >= 0; i2--)
    if (decorator = decorators[i2])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp$1(target, key, result);
  return result;
};
let Week = class extends LitElement {
  constructor() {
    super(...arguments);
    this.activeDate = {
      day: (/* @__PURE__ */ new Date()).getDate(),
      month: (/* @__PURE__ */ new Date()).getMonth() + 1,
      year: (/* @__PURE__ */ new Date()).getFullYear()
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("open-menu", (e2) => {
      const customEvent = e2;
      const forwardedEvent = new CustomEvent("open-menu", {
        detail: customEvent.detail,
        bubbles: true,
        composed: true
      });
      this.dispatchEvent(forwardedEvent);
    });
  }
  _getWeekDates() {
    const currentDate = new Date(
      this.activeDate.year,
      this.activeDate.month - 1,
      this.activeDate.day
    );
    const dayOfWeek2 = currentDate.getDay();
    const mondayOffset = dayOfWeek2 === 0 ? -6 : 1 - dayOfWeek2;
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_2, i2) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i2);
      return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear()
      };
    });
  }
  _isCurrentDate(date) {
    const today = /* @__PURE__ */ new Date();
    return date.day === today.getDate() && date.month === today.getMonth() + 1 && date.year === today.getFullYear();
  }
  render() {
    const weekDates = this._getWeekDates();
    return html`
            <div class="week-container">
                <div class="week-header">
                    <div class="time-header"></div>
                    ${weekDates.map(
      (date, index) => html`
                            <div
                                class="day-label ${classMap({
        current: this._isCurrentDate(date)
      })}"
                                @click=${() => this._handleDayLabelClick(date)}
                            >
                                <div>
                                    ${getLocalizedWeekdayShort(index + 1)}
                                </div>
                                <div>${date.day}</div>
                            </div>
                        `
    )}
                </div>
                <div class="week-content">
                    <!-- Hour indicators -->
                    ${Array.from({ length: 25 }).map(
      (_2, hour) => html`
                            <div
                                class="hour-indicator"
                                style="grid-column: 1; grid-row: ${hour * 60 + 1};"
                            >
                                ${this._renderIndicatorValue(hour)}
                            </div>
                        `
    )}

                    <!-- Hour separators -->
                    ${Array.from({ length: 25 }).map(
      (_2, hour) => html`
                            ${hour > 0 ? html`
                                <div
                                    class="hour-separator"
                                    style="grid-column: 2 / -1; grid-row: ${hour * 60};"
                                ></div>
                            ` : ""}
                        `
    )}

                    <!-- All-day area for each day -->
                    ${weekDates.map(
      (date, dayIndex) => html`
                            <div
                                class="all-day-area"
                                style="grid-column: ${dayIndex + 2}; grid-row: 1 / 60;"
                            >
                                <slot
                                    name="all-day-${date.year}-${date.month}-${date.day}"
                                ></slot>
                            </div>
                        `
    )}

                    <!-- Hour slots for each day -->
                    ${weekDates.map(
      (date, dayIndex) => html`
                            ${Array.from({ length: 25 }).map(
        (_2, hour) => html`
                                    <div
                                        class="hour-slot-container"
                                        style="grid-column: ${dayIndex + 2}; grid-row: ${hour * 60 + 1} / ${(hour + 1) * 60 + 1}; position: relative;"
                                    >
                                        <slot
                                            name="${date.year}-${date.month}-${date.day}-${hour}"
                                            data-debug="Day ${dayIndex + 1} (${date.month}/${date.day}) Hour ${hour}"
                                        ></slot>
                                    </div>
                                `
      )}
                        `
    )}
                </div>
            </div>
        `;
  }
  _renderIndicatorValue(hour) {
    return hour < 10 ? `0${hour}:00` : `${hour}:00`;
  }
  _handleDayLabelClick(date) {
    const event = new CustomEvent("expand", {
      detail: { date },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
  _handleDayColumnClick(e2, _date) {
    e2.stopPropagation();
  }
};
Week.styles = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        .week-container {
            display: flex;
            flex-direction: column;
            height: var(--view-container-height);
            overflow: hidden;
        }

        .week-header {
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            height: var(--day-header-height, 3.5em);
            flex-shrink: 0;
            border-bottom: var(--separator-border);
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
        }

        .time-header {
            border-right: 1px solid var(--separator-light);
        }

        .day-label {
            text-align: center;
            padding: var(--day-padding, 0.5em);
            font-weight: var(--day-label-font-weight);
            border-right: var(--separator-border);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .day-label:hover {
            background-color: var(--separator-light);
        }

        .day-label:last-child {
            border-right: none;
        }

        .day-label.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .week-content {
            flex: 1;
            overflow-y: auto;
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            grid-template-rows: var(--calendar-grid-rows-time);
            height: var(--main-content-height);
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
            min-height: 0;
            position: relative;
        }

        .time-slots {
            grid-column: 1;
            border-right: var(
                --sidebar-border,
                1px solid var(--separator-light)
            );
            background: var(--background-color, white);
        }

        .hour-indicator {
            position: relative;
            top: var(--indicator-top, -0.6em);
            text-align: var(--hour-text-align, center);
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
        }

        .week-days {
            display: contents;
        }

        .day-column {
            border-right: var(
                --sidebar-border,
                1px solid var(--separator-light)
            );
            position: relative;
        }

        .day-column:last-child {
            border-right: none;
        }

        .hour-separator {
            grid-column: 2 / 3;
            border-top: var(
                --separator-border,
                1px solid var(--separator-light)
            );
            position: absolute;
            width: 100%;
            z-index: 0;
        }

        .all-day-area {
            font-size: var(--day-all-day-font-size, 16px);
            margin: 0;
            padding: 0.25em;
            z-index: 1;
            position: relative;
            overflow: hidden;
            width: 100%;
            box-sizing: border-box;
        }

        .hour-slot-container {
            overflow: hidden;
        }
    `;
__decorateClass$1([
  property({ attribute: false })
], Week.prototype, "activeDate", 2);
Week = __decorateClass$1([
  customElement("lms-calendar-week"),
  localized()
], Week);
function getColorTextWithContrast(color) {
  let red = 0;
  let green = 0;
  let blue = 0;
  if (!color || !color.trim()) {
    return ["rgb(255,255,255)", "rgb(0,0,0)"];
  }
  const normalizedColor = color.startsWith("#") ? color : `#${color}`;
  const matches = normalizedColor.replace(
    /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
    (_m, r2, g, b2) => `#${r2}${r2}${g}${g}${b2}${b2}`
  ).substring(1).match(/.{2}/g);
  if (!matches || matches.length !== 3) {
    return ["rgb(255,255,255)", "rgb(0,0,0)"];
  }
  try {
    [red, green, blue] = matches.map((x2) => parseInt(x2, 16));
    if (isNaN(red) || isNaN(green) || isNaN(blue)) {
      return ["rgb(255,255,255)", "rgb(0,0,0)"];
    }
  } catch {
    return ["rgb(255,255,255)", "rgb(0,0,0)"];
  }
  const brightness = (red * 299 + green * 587 + blue * 114) / 1e3;
  const lightText = (255 * 299 + 255 * 587 + 255 * 114) / 1e3;
  const darkText = (0 * 299 + 0 * 587 + 0 * 114) / 1e3;
  const backgroundColor = `rgb(${red},${green},${blue})`;
  const textColor = Math.abs(brightness - lightText) > Math.abs(brightness - darkText) ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)";
  return [backgroundColor, textColor];
}
function partitionOverlappingIntervals(intervals) {
  const rightEndValues = intervals.map((r2) => r2.end).sort((a2, b2) => a2 - b2);
  intervals.sort((a2, b2) => a2.start - b2.start);
  let i2 = 0;
  let j2 = 0;
  let active = 0;
  const groups = [];
  let cur = [];
  while (i2 < intervals.length && j2 < rightEndValues.length) {
    if (intervals[i2].start < rightEndValues[j2]) {
      cur.push(intervals[i2++]);
      ++active;
      continue;
    }
    ++j2;
    if (--active === 0) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length > 0) {
    groups.push(cur);
  }
  return groups;
}
function getOverlappingEntitiesIndices(partitions) {
  const accumulator = getNonOverlappingPartitions(partitions);
  const overlappingPartitions = filterOverlappingPartitions(partitions);
  recursiveReduce(overlappingPartitions, accumulator);
  return accumulator.sort((a2, b2) => a2.index - b2.index);
}
function calculateIndex(partitions, index) {
  return [partitions.slice(0, index)].flatMap(
    (item) => item.flat().length
  )[0];
}
function getNonOverlappingPartitions(partitions) {
  return partitions.reduce(
    (accumulator, partition, index) => partition.length === 1 ? [
      ...accumulator,
      {
        index: calculateIndex(partitions, index),
        depth: 0,
        group: index
      }
    ] : [...accumulator],
    []
  );
}
function filterOverlappingPartitions(partitions) {
  return partitions.map(
    (partition, index) => partition.map((item, _index) => ({
      ...item,
      index: calculateIndex(partitions, index) + _index,
      group: index
    }))
  ).filter((partition) => partition.length > 1);
}
function partitionReducer(accumulator, partition, depth, currentGroup) {
  const { group } = partition[0];
  if (currentGroup !== group) {
    depth = 0;
    currentGroup = group;
  }
  const delta = partition.map(({ start, end }) => end - start);
  const maxDelta = Math.max(...delta);
  const indexMaxDelta = delta.indexOf(maxDelta);
  {
    const { index, group: group2 } = partition[indexMaxDelta];
    if (index === void 0 || group2 === void 0) {
      throw Error(
        `Error in partition reduction with args: ${JSON.stringify(
          partition[indexMaxDelta]
        )}`
      );
    }
    accumulator.push({
      index,
      depth,
      group: group2
    });
  }
  partition.splice(delta.indexOf(maxDelta), 1);
  return recursiveReduce(
    partitionOverlappingIntervals(partition),
    accumulator,
    depth + 1
  );
}
function recursiveReduce(partitions, accumulator, depth = 0, currentGroup) {
  if (partitions.length === 0) {
    return accumulator;
  }
  const [currentPartition, ...remainingPartitions] = partitions;
  const updatedAccumulator = partitionReducer(
    accumulator,
    currentPartition,
    depth
  );
  return recursiveReduce(
    remainingPartitions,
    updatedAccumulator,
    depth + 1
  );
}
function rearrangeDepths(gradings) {
  const groups = /* @__PURE__ */ new Map();
  gradings.forEach((item) => {
    if (!groups.has(item.group)) {
      groups.set(item.group, []);
    }
    groups.get(item.group).push({ index: item.index, depth: item.depth, group: item.group });
  });
  const result = [];
  groups.forEach((groupGradings) => {
    groupGradings.sort((a2, b2) => a2.index - b2.index);
    groupGradings.forEach((item, i2) => {
      result.push({ index: item.index, depth: i2, group: item.group });
    });
  });
  result.sort((a2, b2) => a2.index - b2.index);
  return result;
}
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i2 = decorators.length - 1, decorator; i2 >= 0; i2--)
    if (decorator = decorators[i2])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp2(target, key, result);
  return result;
};
let LMSCalendar = class extends e$2(LitElement) {
  constructor() {
    super(...arguments);
    this.entries = [];
    this.color = "#000000";
    this._calendarWidth = window.innerWidth;
    this._menuOpen = false;
    this._handleResize = (entries) => {
      const [div] = entries;
      this._calendarWidth = div.contentRect.width || this._calendarWidth;
    };
    this._resizeController = new t$2(this, {
      target: null,
      callback: this._handleResize,
      skipInitial: true
    });
  }
  // activeDate is now managed by signals - this property is kept for backward compatibility
  get activeDate() {
    return activeDate.get();
  }
  set activeDate(value) {
    setActiveDate(value);
  }
  // _expandedDate is now managed through view mode signals
  get _expandedDate() {
    return currentViewMode.get() === "day" ? activeDate.get() : void 0;
  }
  firstUpdated(_changedProperties) {
    var _a, _b;
    const firstElementChild = (_a = this.shadowRoot) == null ? void 0 : _a.firstElementChild;
    if (!firstElementChild) {
      return;
    }
    this._resizeController.observe(firstElementChild);
    const docLang = (_b = document.documentElement.lang) == null ? void 0 : _b.slice(0, 2);
    if (docLang && ["de", "en"].includes(docLang)) {
      setAppLocale(docLang);
    }
  }
  /** We filter invalid entries in the willUpdate hook, so be prepared:
   *  - This will not be shown
   *   ```json
   *   { date: ..., time: { start: { hour: 10, minute: 30 }, end: { hour: 10, minute: 00 } } }
   *  ```
   *  - The same goes for invalid dates meaning the end date being before the start date.
   *
   *  We then sort the entries inplace.
   */
  willUpdate(_changedProperties) {
    if (!this.entries.length) {
      return;
    }
    this.entries = pipe(
      this.entries,
      filter(
        (entry) => Interval.fromDateTimes(
          DateTime.fromObject(
            merge(entry.date.start, entry.time.start)
          ),
          DateTime.fromObject(
            merge(entry.date.end, entry.time.end)
          )
        ).isValid
      ),
      sort.strict(
        (a2, b2) => a2.time.start.hour - b2.time.start.hour || a2.time.start.minute - b2.time.start.minute
      )
    );
  }
  render() {
    const viewMode = currentViewMode.get();
    const currentActiveDate = activeDate.get();
    return html`
            <div>
                <lms-calendar-header
                    @switchdate=${this._handleSwitchDate}
                    @switchview=${this._handleSwitchView}
                    @jumptoday=${this._handleJumpToday}
                    .heading=${this.heading}
                    .activeDate=${currentActiveDate}
                    .expandedDate=${viewMode === "day" ? currentActiveDate : void 0}
                >
                </lms-calendar-header>

                ${viewMode === "month" ? html`
                          <lms-calendar-context> </lms-calendar-context>

                          <lms-calendar-month
                              @expand=${this._handleExpand}
                              @open-menu=${this._handleOpenMenu}
                              .activeDate=${currentActiveDate}
                          >
                              ${this._calendarWidth < 768 ? this._renderEntriesSumByDay() : this._renderEntries()}
                          </lms-calendar-month>
                      ` : nothing}
                ${viewMode === "week" ? html`
                          <lms-calendar-week
                              @expand=${this._handleExpand}
                              @open-menu=${this._handleOpenMenu}
                              .activeDate=${currentActiveDate}
                          >
                              ${this._renderEntriesForWeek()}
                          </lms-calendar-week>
                      ` : nothing}
                ${viewMode === "day" ? html`
                          <lms-calendar-day @open-menu=${this._handleOpenMenu}>
                              ${this._renderEntriesByDate()}
                          </lms-calendar-day>
                      ` : nothing}

                <lms-menu
                    ?open=${this._menuOpen}
                    .eventDetails=${this._menuEventDetails || {
      heading: "",
      content: "",
      time: ""
    }}
                    @menu-close=${this._handleMenuClose}
                ></lms-menu>
            </div>
        `;
  }
  _handleSwitchDate(e2) {
    if (e2.detail.direction === "next") {
      navigateNext();
    } else if (e2.detail.direction === "previous") {
      navigatePrevious();
    }
  }
  _handleSwitchView(e2) {
    return z$1(e2.detail.view).with("day", () => switchToDayView()).with("week", () => switchToWeekView()).with("month", () => switchToMonthView()).otherwise(() => {
    });
  }
  _handleJumpToday(_e) {
    jumpToToday();
  }
  _handleExpand(e2) {
    setActiveDate(e2.detail.date);
    switchToDayView();
  }
  _handleOpenMenu(e2) {
    var _a;
    (_a = this.shadowRoot) == null ? void 0 : _a.querySelectorAll("lms-calendar-entry").forEach((entry) => {
      entry._highlighted = false;
    });
    this.openMenu(e2.detail);
  }
  _handleMenuClose() {
    this._menuOpen = false;
    this._menuEventDetails = void 0;
  }
  openMenu(eventDetails) {
    this._menuEventDetails = eventDetails;
    this._menuOpen = true;
  }
  _composeEntry({
    index,
    slot,
    styles,
    entry,
    isContinuation = false
  }) {
    return html`
            <style>
                ${styles}
            </style>
            <lms-calendar-entry
                class=${`_${index}`}
                slot=${slot}
                .time=${entry.time}
                .heading=${entry.heading ?? ""}
                .content=${entry.content}
                .isContinuation=${isContinuation ?? false}
                .date=${entry.date}
            >
            </lms-calendar-entry>
        `;
  }
  /** Create an array of <lms-calendar-entry> elements for each day the entry spans
   *  and add them to the entries array. */
  _expandEntryMaybe({
    entry,
    range
  }) {
    return Array.from({ length: range[2] }, (_2, index) => {
      const currentStartDate = DateTime.fromJSDate(range[0]).plus({
        days: index
      });
      const currentEndDate = currentStartDate.plus({ days: 1 }).minus({ seconds: 1 });
      const currentEntry = {
        ...entry,
        date: {
          start: currentStartDate.toObject(),
          end: currentEndDate.toObject()
        },
        continuation: {
          has: range[2] > 1,
          is: index > 1,
          index
        }
      };
      return currentEntry;
    });
  }
  _renderEntries() {
    if (!this.entries.length) {
      return nothing;
    }
    return pipe(
      this.entries,
      flatMap(
        (entry) => this._expandEntryMaybe({
          entry,
          range: this._getDaysRange(entry.date)
        })
      ),
      map(
        (entry) => [entry, ...getColorTextWithContrast(entry.color)]
      ),
      map.indexed(
        ([entry, background, text], index) => this._composeEntry({
          index,
          slot: `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`,
          styles: css`
                        lms-calendar-entry._${index} {
                            --entry-border-radius: ${unsafeCSS(
            entry.continuation.has ? 0 : "var(--border-radius-sm)"
          )};
                            --entry-margin: 0
                                ${unsafeCSS(
            entry.continuation.has ? 0 : "0.25em"
          )}
                                0
                                ${unsafeCSS(
            entry.continuation.has ? 0 : "1.5em"
          )};
                            --entry-background-color: ${unsafeCSS(background)};
                            --entry-color: ${unsafeCSS(text)};
                        }
                    `,
          entry: {
            time: entry.time,
            heading: entry.heading,
            content: entry.content,
            date: entry.date,
            isContinuation: entry.continuation.is
          }
        })
      )
    );
  }
  _renderEntriesByDate() {
    const currentActiveDate = activeDate.get();
    const viewMode = currentViewMode.get();
    if (viewMode !== "day") {
      return nothing;
    }
    const entriesByDate = pipe(
      this.entries,
      flatMap(
        (entry) => this._expandEntryMaybe({
          entry,
          range: this._getDaysRange(entry.date)
        })
      ),
      filter(
        (entry) => isDeepEqual(
          DateTime.fromObject(entry.date.start).toISODate(),
          DateTime.fromObject(currentActiveDate).toISODate()
        )
      )
    );
    let grading = [];
    if (!isEmpty(entriesByDate)) {
      grading = pipe(
        entriesByDate,
        map(
          (entry) => {
            var _a, _b;
            return Number((_a = entry.time) == null ? void 0 : _a.end.hour) - Number((_b = entry.time) == null ? void 0 : _b.start.hour) < 23 && !entry.continuation.is && !entry.continuation.has ? entry : {
              ...entry,
              time: {
                start: { hour: 0, minute: -1 },
                end: { hour: 0, minute: 1 }
              }
            };
          }
        ),
        map(
          ({ time }) => this._getGridSlotByTime(time).replace(/[^0-9/]+/g, "").split("/")
        ),
        map(([start, end]) => ({
          start: parseInt(start, 10),
          end: parseInt(end, 10)
        })),
        partitionOverlappingIntervals,
        getOverlappingEntitiesIndices,
        rearrangeDepths
      );
    }
    return pipe(
      entriesByDate,
      map((entry) => {
        var _a, _b;
        return {
          ...entry,
          isAllDay: Number((_a = entry.time) == null ? void 0 : _a.end.hour) - Number((_b = entry.time) == null ? void 0 : _b.start.hour) >= 23
        };
      }),
      map(
        (entry) => [entry, ...getColorTextWithContrast(entry.color)]
      ),
      map.indexed(
        ([entry, background, text], index) => (
          //TODO: match on shapes instead.
          z$1(
            entry.continuation.is || entry.continuation.has || entry.isAllDay
          ).with(
            true,
            () => this._composeEntry({
              index,
              slot: "all-day",
              styles: css`
                                lms-calendar-entry._${index} {
                                    --entry-background-color: ${unsafeCSS(
                background
              )};
                                    --entry-color: ${unsafeCSS(text)};
                                }
                            `,
              entry
            })
          ).otherwise(
            () => this._composeEntry({
              index,
              slot: entry.time.start.hour.toString(),
              styles: css`
                                lms-calendar-entry._${index} {
                                    --start-slot: ${unsafeCSS(
                this._getGridSlotByTime(entry.time)
              )};
                                    --entry-width: ${this._getWidthByGroupSize({
                grading,
                index
              })}%;
                                    --entry-margin: 0 1.5em 0
                                        ${this._getOffsetByDepth({
                grading,
                index
              })}%;
                                    --entry-border-radius: var(
                                        --border-radius-sm
                                    );
                                    --entry-background-color: ${unsafeCSS(
                background
              )};
                                    --entry-color: ${unsafeCSS(text)};
                                }
                            `,
              entry
            })
          )
        )
      )
    );
  }
  _renderEntriesSumByDay() {
    return pipe(
      this.entries,
      flatMap(
        (entry) => this._expandEntryMaybe({
          entry,
          range: this._getDaysRange(entry.date)
        })
      ),
      reduce((acc, entry) => {
        const key = `${entry.date.start.day}-${entry.date.start.month}-${entry.date.start.year}`;
        acc[key] = acc[key] ? acc[key] + 1 : 1;
        return acc;
      }, {}),
      Object.entries,
      map.indexed(
        ([key, value], index) => this._composeEntry({
          index,
          slot: key.split("-").reverse().join("-"),
          styles: css`
                        lms-calendar-entry._${index} {
                            --entry-border-radius: var(--border-radius-sm);
                            --entry-margin: 0 auto;
                            --entry-background-color: whitesmoke;
                            --entry-color: black;
                        }
                    `,
          entry: {
            heading: `[ ${value} ]`
          }
        })
      )
    );
  }
  _renderEntriesForWeek() {
    const currentActiveDate = activeDate.get();
    const viewMode = currentViewMode.get();
    if (!this.entries.length || viewMode !== "week") {
      return nothing;
    }
    const weekStartDate = this._getWeekStartDate(currentActiveDate);
    const weekDates = Array.from({ length: 7 }, (_2, i2) => {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i2);
      return {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear()
      };
    });
    return pipe(
      this.entries,
      flatMap(
        (entry) => this._expandEntryMaybe({
          entry,
          range: this._getDaysRange(entry.date)
        })
      ),
      filter((entry) => {
        const entryDateStr = `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`;
        return weekDates.some(
          (date) => `${date.year}-${date.month}-${date.day}` === entryDateStr
        );
      }),
      map(
        (entry) => [entry, ...getColorTextWithContrast(entry.color)]
      ),
      map.indexed(([entry, background, text], index) => {
        var _a, _b;
        const isAllDay = Number((_a = entry.time) == null ? void 0 : _a.end.hour) - Number((_b = entry.time) == null ? void 0 : _b.start.hour) >= 23 || entry.continuation.is || entry.continuation.has;
        if (isAllDay) {
          return this._composeEntry({
            index,
            slot: `all-day-${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`,
            styles: css`
                            lms-calendar-entry._${index} {
                                --entry-background-color: ${unsafeCSS(
              background
            )};
                                --entry-color: ${unsafeCSS(text)};
                            }
                        `,
            entry
          });
        } else {
          return this._composeEntry({
            index,
            slot: `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}-${entry.time.start.hour}`,
            styles: css`
                            lms-calendar-entry._${index} {
                                --start-slot: ${unsafeCSS(
              this._getGridSlotByTime(entry.time)
            )};
                                --entry-background-color: ${unsafeCSS(
              background
            )};
                                --entry-color: ${unsafeCSS(text)};
                            }
                        `,
            entry
          });
        }
      })
    );
  }
  _getWeekStartDate(date) {
    const currentDate = new Date(date.year, date.month - 1, date.day);
    const dayOfWeek2 = currentDate.getDay();
    const mondayOffset = dayOfWeek2 === 0 ? -6 : 1 - dayOfWeek2;
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() + mondayOffset);
    return weekStart;
  }
  _getGridSlotByTime({ start, end }) {
    const startRow = start.hour * 60 + (start.minute + 1);
    const endRow = startRow + (end.hour * 60 + end.minute - startRow);
    if (startRow === endRow) {
      return `${startRow}/${endRow + 1}`;
    }
    return `${startRow}/${endRow}`;
  }
  _getWidthByGroupSize({
    grading,
    index
  }) {
    return 100 / grading.filter((item) => item.group === grading[index].group).length;
  }
  _getOffsetByDepth({
    grading,
    index
  }) {
    if (!grading[index]) {
      return 0;
    }
    return grading[index].depth === 0 ? 0 : grading[index].depth * (100 / grading.filter(
      (item) => item.group === grading[index].group
    ).length);
  }
  _getDaysRange(date) {
    const { start, end } = date;
    const startDate = new Date(start.year, start.month - 1, start.day);
    const endDate = new Date(end.year, end.month - 1, end.day);
    return [
      startDate,
      endDate,
      (endDate.getTime() - startDate.getTime()) / (1e3 * 3600 * 24) + 1
    ];
  }
};
LMSCalendar.styles = css`
        :host {
            --shadow-sm: rgba(0, 0, 0, 0.18) 0px 2px 4px;
            --shadow-md: rgba(0, 0, 0, 0.15) 0px 3px 3px 0px;
            --shadow-lg: rgba(0, 0, 0, 0.15) 0px 2px 8px;
            --shadow-hv: rgba(0, 0, 0, 0.08) 0px 4px 12px;

            --breakpoint-xs: 425px;
            --breakpoint-sm: 768px;
            --breakpoint-md: 1024px;

            --separator-light: rgba(0, 0, 0, 0.1);
            --separator-mid: rgba(0, 0, 0, 0.4);
            --separator-dark: rgba(0, 0, 0, 0.7);

            --system-ui: system-ui, 'Segoe UI', Roboto, Helvetica, Arial,
                sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
                'Segoe UI Symbol';

            --border-radius-sm: 5px;
            --border-radius-md: 7px;
            --border-radius-lg: 12px;

            --background-color: white;
            --primary-color: dodgerblue;

            --height: 100%;
            --width: 100%;

            --entry-font-size: small;
            --entry-border-radius: var(--border-radius-sm);
            --entry-background-color: var(--background-color);
            --entry-color: var(--primary-color);
            --entry-highlight-color: var(--separator-light);
            --entry-focus-color: var(--primary-color);
            --entry-padding: 0.25em;
            --entry-font-family: monospace;
            --entry-interval-margin: 0.5em;

            --context-height: 1.75em;
            --context-padding: 0.25em;
            --context-text-align: left;

            /* Core layout tokens */
            --time-column-width: 4em;
            --grid-rows-per-day: 1440;
            --view-container-height-offset: var(--day-header-height, 3.5em);
            --main-content-height-offset: 1em;

            /* Grid template tokens */
            --calendar-grid-columns-day: var(--time-column-width) 1fr;
            --calendar-grid-columns-week: var(--time-column-width)
                repeat(7, 1fr);
            --calendar-grid-columns-month: repeat(7, 1fr);
            --calendar-grid-rows-time: repeat(var(--grid-rows-per-day), 1fr);

            /* Calculated heights */
            --view-container-height: calc(
                100% - var(--view-container-height-offset)
            );
            --main-content-height: calc(
                100% - var(--main-content-height-offset)
            );

            /* Legacy tokens (for backward compatibility) */
            --day-header-height: 3.5em;
            --day-main-offset: var(--main-content-height-offset);
            --day-gap: 1px;
            --day-text-align: center;
            --day-padding: 0.5em;
            --hour-text-align: center;
            --indicator-top: -0.6em;
            --separator-border: 1px solid var(--separator-light);
            --sidebar-border: 1px solid var(--separator-light);

            /* Typography tokens */
            --hour-indicator-font-size: 0.75em;
            --hour-indicator-color: var(
                --header-text-color,
                rgba(0, 0, 0, 0.6)
            );
            --day-label-font-weight: 500;

            --header-height: 3.5em;
            --header-height-mobile: 4.5em;
            --header-info-padding-left: 1em;
            --header-text-color: rgba(0, 0, 0, 0.6);
            --header-buttons-padding-right: 1em;
            --button-padding: 0.75em;
            --button-border-radius: var(--border-radius-sm);

            --month-header-context-height: 5.5em;
            --month-day-gap: 1px;
            --indicator-color: var(--primary-color);
            --indicator-font-weight: bold;
            --indicator-padding: 0.25em;
            --indicator-margin-bottom: 0.25em;

            --menu-min-width: 17.5em;
            --menu-max-width: 20em;
            --menu-header-padding: 0.75em 1em;
            --menu-content-padding: 1em;
            --menu-item-padding: 0.75em;
            --menu-item-margin-bottom: 0.75em;
            --menu-item-font-weight: 500;
            --menu-button-size: 2em;
            --menu-button-padding: 0.5em;
            --menu-title-font-size: 0.875em;
            --menu-title-font-weight: 500;
            --menu-content-font-size: 0.875em;
            --menu-detail-label-min-width: 4em;
            --menu-detail-label-font-size: 0.8125em;
            --menu-detail-gap: 0.5em;
        }
        div {
            width: var(--width);
            height: var(--height);
            background-color: var(--background-color);
            border-radius: var(--border-radius-lg);
            border: 1px solid var(--separator-light);
            font-family: var(--system-ui);
            color: var(--separator-dark);
            box-shadow: var(--shadow-md);
        }
    `;
__decorateClass([
  property({ type: String })
], LMSCalendar.prototype, "heading", 2);
__decorateClass([
  property({ type: Array })
], LMSCalendar.prototype, "entries", 2);
__decorateClass([
  property({ type: String })
], LMSCalendar.prototype, "color", 2);
__decorateClass([
  state()
], LMSCalendar.prototype, "_calendarWidth", 2);
__decorateClass([
  state()
], LMSCalendar.prototype, "_menuOpen", 2);
__decorateClass([
  state()
], LMSCalendar.prototype, "_menuEventDetails", 2);
LMSCalendar = __decorateClass([
  customElement("lms-calendar"),
  localized()
], LMSCalendar);
export {
  Interval,
  LMSCalendar as default
};
//# sourceMappingURL=lms-calendar.bundled.js.map
