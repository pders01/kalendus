/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
function t(t,e,i,s){var r,n=arguments.length,o=n<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(o=(n<3?r(o):n>3?r(e,i,o):r(e,i))||o);return n>3&&o&&Object.defineProperty(e,i,o),o
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */}const e=window,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),r=new WeakMap;class n{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=r.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(e,t))}return t}toString(){return this.cssText}}const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce(((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1]),t[0]);return new n(i,t,s)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,s))(e)})(t):t
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */;var d;const l=window,h=l.trustedTypes,c=h?h.emptyScript:"",p=l.reactiveElementPolyfillSupport,u={toAttribute(t,e){switch(e){case Boolean:t=t?c:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},v=(t,e)=>e!==t&&(e==e||t==t),g={attribute:!0,type:String,converter:u,reflect:!1,hasChanged:v};class m extends HTMLElement{constructor(){super(),this._$Ei=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$El=null,this.u()}static addInitializer(t){var e;this.finalize(),(null!==(e=this.h)&&void 0!==e?e:this.h=[]).push(t)}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach(((e,i)=>{const s=this._$Ep(i,e);void 0!==s&&(this._$Ev.set(s,i),t.push(s))})),t}static createProperty(t,e=g){if(e.state&&(e.attribute=!1),this.finalize(),this.elementProperties.set(t,e),!e.noAccessor&&!this.prototype.hasOwnProperty(t)){const i="symbol"==typeof t?Symbol():"__"+t,s=this.getPropertyDescriptor(t,i,e);void 0!==s&&Object.defineProperty(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){return{get(){return this[e]},set(s){const r=this[t];this[e]=s,this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||g}static finalize(){if(this.hasOwnProperty("finalized"))return!1;this.finalized=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),void 0!==t.h&&(this.h=[...t.h]),this.elementProperties=new Map(t.elementProperties),this._$Ev=new Map,this.hasOwnProperty("properties")){const t=this.properties,e=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const i of e)this.createProperty(i,t[i])}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Ep(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}u(){var t;this._$E_=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$Eg(),this.requestUpdate(),null===(t=this.constructor.h)||void 0===t||t.forEach((t=>t(this)))}addController(t){var e,i;(null!==(e=this._$ES)&&void 0!==e?e:this._$ES=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(i=t.hostConnected)||void 0===i||i.call(t))}removeController(t){var e;null===(e=this._$ES)||void 0===e||e.splice(this._$ES.indexOf(t)>>>0,1)}_$Eg(){this.constructor.elementProperties.forEach(((t,e)=>{this.hasOwnProperty(e)&&(this._$Ei.set(e,this[e]),delete this[e])}))}createRenderRoot(){var t;const s=null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{i?t.adoptedStyleSheets=s.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet)):s.forEach((i=>{const s=document.createElement("style"),r=e.litNonce;void 0!==r&&s.setAttribute("nonce",r),s.textContent=i.cssText,t.appendChild(s)}))})(s,this.constructor.elementStyles),s}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$ES)||void 0===t||t.forEach((t=>{var e;return null===(e=t.hostConnected)||void 0===e?void 0:e.call(t)}))}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$ES)||void 0===t||t.forEach((t=>{var e;return null===(e=t.hostDisconnected)||void 0===e?void 0:e.call(t)}))}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$EO(t,e,i=g){var s;const r=this.constructor._$Ep(t,i);if(void 0!==r&&!0===i.reflect){const n=(void 0!==(null===(s=i.converter)||void 0===s?void 0:s.toAttribute)?i.converter:u).toAttribute(e,i.type);this._$El=t,null==n?this.removeAttribute(r):this.setAttribute(r,n),this._$El=null}}_$AK(t,e){var i;const s=this.constructor,r=s._$Ev.get(t);if(void 0!==r&&this._$El!==r){const t=s.getPropertyOptions(r),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null===(i=t.converter)||void 0===i?void 0:i.fromAttribute)?t.converter:u;this._$El=r,this[r]=n.fromAttribute(e,t.type),this._$El=null}}requestUpdate(t,e,i){let s=!0;void 0!==t&&(((i=i||this.constructor.getPropertyOptions(t)).hasChanged||v)(this[t],e)?(this._$AL.has(t)||this._$AL.set(t,e),!0===i.reflect&&this._$El!==t&&(void 0===this._$EC&&(this._$EC=new Map),this._$EC.set(t,i))):s=!1),!this.isUpdatePending&&s&&(this._$E_=this._$Ej())}async _$Ej(){this.isUpdatePending=!0;try{await this._$E_}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Ei&&(this._$Ei.forEach(((t,e)=>this[e]=t)),this._$Ei=void 0);let e=!1;const i=this._$AL;try{e=this.shouldUpdate(i),e?(this.willUpdate(i),null===(t=this._$ES)||void 0===t||t.forEach((t=>{var e;return null===(e=t.hostUpdate)||void 0===e?void 0:e.call(t)})),this.update(i)):this._$Ek()}catch(t){throw e=!1,this._$Ek(),t}e&&this._$AE(i)}willUpdate(t){}_$AE(t){var e;null===(e=this._$ES)||void 0===e||e.forEach((t=>{var e;return null===(e=t.hostUpdated)||void 0===e?void 0:e.call(t)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$Ek(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$E_}shouldUpdate(t){return!0}update(t){void 0!==this._$EC&&(this._$EC.forEach(((t,e)=>this._$EO(e,this[e],t))),this._$EC=void 0),this._$Ek()}updated(t){}firstUpdated(t){}}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var y;m.finalized=!0,m.elementProperties=new Map,m.elementStyles=[],m.shadowRootOptions={mode:"open"},null==p||p({ReactiveElement:m}),(null!==(d=l.reactiveElementVersions)&&void 0!==d?d:l.reactiveElementVersions=[]).push("1.6.1");const $=window,f=$.trustedTypes,_=f?f.createPolicy("lit-html",{createHTML:t=>t}):void 0,b=`lit$${(Math.random()+"").slice(9)}$`,x="?"+b,w=`<${x}>`,A=document,E=(t="")=>A.createComment(t),D=t=>null===t||"object"!=typeof t&&"function"!=typeof t,S=Array.isArray,C=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,k=/-->/g,M=/>/g,O=RegExp(">|[ \t\n\f\r](?:([^\\s\"'>=/]+)([ \t\n\f\r]*=[ \t\n\f\r]*(?:[^ \t\n\f\r\"'`<>=]|(\"|')|))|$)","g"),T=/'/g,P=/"/g,H=/^(?:script|style|textarea|title)$/i,U=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),I=Symbol.for("lit-noChange"),L=Symbol.for("lit-nothing"),N=new WeakMap,R=A.createTreeWalker(A,129,null,!1),j=(t,e)=>{const i=t.length-1,s=[];let r,n=2===e?"<svg>":"",o=C;for(let e=0;e<i;e++){const i=t[e];let a,d,l=-1,h=0;for(;h<i.length&&(o.lastIndex=h,d=o.exec(i),null!==d);)h=o.lastIndex,o===C?"!--"===d[1]?o=k:void 0!==d[1]?o=M:void 0!==d[2]?(H.test(d[2])&&(r=RegExp("</"+d[2],"g")),o=O):void 0!==d[3]&&(o=O):o===O?">"===d[0]?(o=null!=r?r:C,l=-1):void 0===d[1]?l=-2:(l=o.lastIndex-d[2].length,a=d[1],o=void 0===d[3]?O:'"'===d[3]?P:T):o===P||o===T?o=O:o===k||o===M?o=C:(o=O,r=void 0);const c=o===O&&t[e+1].startsWith("/>")?" ":"";n+=o===C?i+w:l>=0?(s.push(a),i.slice(0,l)+"$lit$"+i.slice(l)+b+c):i+b+(-2===l?(s.push(void 0),e):c)}const a=n+(t[i]||"<?>")+(2===e?"</svg>":"");if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return[void 0!==_?_.createHTML(a):a,s]};class z{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let r=0,n=0;const o=t.length-1,a=this.parts,[d,l]=j(t,e);if(this.el=z.createElement(d,i),R.currentNode=this.el.content,2===e){const t=this.el.content,e=t.firstChild;e.remove(),t.append(...e.childNodes)}for(;null!==(s=R.nextNode())&&a.length<o;){if(1===s.nodeType){if(s.hasAttributes()){const t=[];for(const e of s.getAttributeNames())if(e.endsWith("$lit$")||e.startsWith(b)){const i=l[n++];if(t.push(e),void 0!==i){const t=s.getAttribute(i.toLowerCase()+"$lit$").split(b),e=/([.?@])?(.*)/.exec(i);a.push({type:1,index:r,name:e[2],strings:t,ctor:"."===e[1]?G:"?"===e[1]?Y:"@"===e[1]?K:V})}else a.push({type:6,index:r})}for(const e of t)s.removeAttribute(e)}if(H.test(s.tagName)){const t=s.textContent.split(b),e=t.length-1;if(e>0){s.textContent=f?f.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],E()),R.nextNode(),a.push({type:2,index:++r});s.append(t[e],E())}}}else if(8===s.nodeType)if(s.data===x)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=s.data.indexOf(b,t+1));)a.push({type:7,index:r}),t+=b.length-1}r++}}static createElement(t,e){const i=A.createElement("template");return i.innerHTML=t,i}}function B(t,e,i=t,s){var r,n,o,a;if(e===I)return e;let d=void 0!==s?null===(r=i._$Co)||void 0===r?void 0:r[s]:i._$Cl;const l=D(e)?void 0:e._$litDirective$;return(null==d?void 0:d.constructor)!==l&&(null===(n=null==d?void 0:d._$AO)||void 0===n||n.call(d,!1),void 0===l?d=void 0:(d=new l(t),d._$AT(t,i,s)),void 0!==s?(null!==(o=(a=i)._$Co)&&void 0!==o?o:a._$Co=[])[s]=d:i._$Cl=d),void 0!==d&&(e=B(t,d._$AS(t,e.values),d,s)),e}class W{constructor(t,e){this.u=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}v(t){var e;const{el:{content:i},parts:s}=this._$AD,r=(null!==(e=null==t?void 0:t.creationScope)&&void 0!==e?e:A).importNode(i,!0);R.currentNode=r;let n=R.nextNode(),o=0,a=0,d=s[0];for(;void 0!==d;){if(o===d.index){let e;2===d.type?e=new F(n,n.nextSibling,this,t):1===d.type?e=new d.ctor(n,d.name,d.strings,this,t):6===d.type&&(e=new J(n,this,t)),this.u.push(e),d=s[++a]}o!==(null==d?void 0:d.index)&&(n=R.nextNode(),o++)}return r}p(t){let e=0;for(const i of this.u)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class F{constructor(t,e,i,s){var r;this.type=2,this._$AH=L,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cm=null===(r=null==s?void 0:s.isConnected)||void 0===r||r}get _$AU(){var t,e;return null!==(e=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==e?e:this._$Cm}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=B(this,t,e),D(t)?t===L||null==t||""===t?(this._$AH!==L&&this._$AR(),this._$AH=L):t!==this._$AH&&t!==I&&this.g(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>S(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]))(t)?this.k(t):this.g(t)}O(t,e=this._$AB){return this._$AA.parentNode.insertBefore(t,e)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}g(t){this._$AH!==L&&D(this._$AH)?this._$AA.nextSibling.data=t:this.T(A.createTextNode(t)),this._$AH=t}$(t){var e;const{values:i,_$litType$:s}=t,r="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=z.createElement(s.h,this.options)),s);if((null===(e=this._$AH)||void 0===e?void 0:e._$AD)===r)this._$AH.p(i);else{const t=new W(r,this),e=t.v(this.options);t.p(i),this.T(e),this._$AH=t}}_$AC(t){let e=N.get(t.strings);return void 0===e&&N.set(t.strings,e=new z(t)),e}k(t){S(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const r of t)s===e.length?e.push(i=new F(this.O(E()),this.O(E()),this,this.options)):i=e[s],i._$AI(r),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){var i;for(null===(i=this._$AP)||void 0===i||i.call(this,!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this._$Cm=t,null===(e=this._$AP)||void 0===e||e.call(this,t))}}class V{constructor(t,e,i,s,r){this.type=1,this._$AH=L,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=L}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,e=this,i,s){const r=this.strings;let n=!1;if(void 0===r)t=B(this,t,e,0),n=!D(t)||t!==this._$AH&&t!==I,n&&(this._$AH=t);else{const s=t;let o,a;for(t=r[0],o=0;o<r.length-1;o++)a=B(this,s[i+o],e,o),a===I&&(a=this._$AH[o]),n||(n=!D(a)||a!==this._$AH[o]),a===L?t=L:t!==L&&(t+=(null!=a?a:"")+r[o+1]),this._$AH[o]=a}n&&!s&&this.j(t)}j(t){t===L?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"")}}class G extends V{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===L?void 0:t}}const q=f?f.emptyScript:"";class Y extends V{constructor(){super(...arguments),this.type=4}j(t){t&&t!==L?this.element.setAttribute(this.name,q):this.element.removeAttribute(this.name)}}class K extends V{constructor(t,e,i,s,r){super(t,e,i,s,r),this.type=5}_$AI(t,e=this){var i;if((t=null!==(i=B(this,t,e,0))&&void 0!==i?i:L)===I)return;const s=this._$AH,r=t===L&&s!==L||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,n=t!==L&&(s===L||r);r&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e,i;"function"==typeof this._$AH?this._$AH.call(null!==(i=null===(e=this.options)||void 0===e?void 0:e.host)&&void 0!==i?i:this.element,t):this._$AH.handleEvent(t)}}class J{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){B(this,t)}}const Z=$.litHtmlPolyfillSupport;null==Z||Z(z,F),(null!==(y=$.litHtmlVersions)&&void 0!==y?y:$.litHtmlVersions=[]).push("2.6.1");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
var Q,X;class tt extends m{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{var s,r;const n=null!==(s=null==i?void 0:i.renderBefore)&&void 0!==s?s:e;let o=n._$litPart$;if(void 0===o){const t=null!==(r=null==i?void 0:i.renderBefore)&&void 0!==r?r:null;n._$litPart$=o=new F(e.insertBefore(E(),t),t,void 0,null!=i?i:{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Do)||void 0===t||t.setConnected(!1)}render(){return I}}tt.finalized=!0,tt._$litElement$=!0,null===(Q=globalThis.litElementHydrateSupport)||void 0===Q||Q.call(globalThis,{LitElement:tt});const et=globalThis.litElementPolyfillSupport;null==et||et({LitElement:tt}),(null!==(X=globalThis.litElementVersions)&&void 0!==X?X:globalThis.litElementVersions=[]).push("3.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const it=t=>e=>"function"==typeof e?((t,e)=>(customElements.define(t,e),e))(t,e):((t,e)=>{const{kind:i,elements:s}=e;return{kind:i,elements:s,finisher(e){customElements.define(t,e)}}})(t,e)
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */,st=(t,e)=>"method"===e.kind&&e.descriptor&&!("value"in e.descriptor)?{...e,finisher(i){i.createProperty(e.key,t)}}:{kind:"field",key:Symbol(),placement:"own",descriptor:{},originalKey:e.key,initializer(){"function"==typeof e.initializer&&(this[e.key]=e.initializer.call(this))},finisher(i){i.createProperty(e.key,t)}};function rt(t){return(e,i)=>void 0!==i?((t,e,i)=>{e.constructor.createProperty(i,t)})(t,e,i):st(t,e)
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */}function nt(t){return rt({...t,state:!0})}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */var ot;null===(ot=window.HTMLSlotElement)||void 0===ot||ot.prototype.assignedElements;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const at=(t,e,i)=>{let s=t[0];for(let r=1;r<t.length;r++)s+=e[i?i[r-1]:r-1],s+=t[r];return s},dt=t=>{return"string"!=typeof(e=t)&&"strTag"in e?at(t.strings,t.values):t;var e};
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class lt{constructor(t){this.__litLocalizeEventHandler=t=>{"ready"===t.detail.status&&this.host.requestUpdate()},this.host=t}hostConnected(){window.addEventListener("lit-localize-status",this.__litLocalizeEventHandler)}hostDisconnected(){window.removeEventListener("lit-localize-status",this.__litLocalizeEventHandler)}}const ht=t=>t.addController(new lt(t)),ct=()=>t=>"function"==typeof t?ut(t):pt(t),pt=({kind:t,elements:e})=>({kind:t,elements:e,finisher(t){t.addInitializer(ht)}}),ut=t=>(t.addInitializer(ht),t);
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
class vt{constructor(){this.settled=!1,this.promise=new Promise(((t,e)=>{this._resolve=t,this._reject=e}))}resolve(t){this.settled=!0,this._resolve(t)}reject(t){this.settled=!0,this._reject(t)}}
/**
 * @license
 * Copyright 2014 Travis Webb
 * SPDX-License-Identifier: MIT
 */const gt=[];for(let t=0;t<256;t++)gt[t]=(t>>4&15).toString(16)+(15&t).toString(16);function mt(t,e){return(e?"h":"s")+function(t){let e=0,i=8997,s=0,r=33826,n=0,o=40164,a=0,d=52210;for(let l=0;l<t.length;l++)i^=t.charCodeAt(l),e=435*i,s=435*r,n=435*o,a=435*d,n+=i<<8,a+=r<<8,s+=e>>>16,i=65535&e,n+=s>>>16,r=65535&s,d=a+(n>>>16)&65535,o=65535&n;return gt[d>>8]+gt[255&d]+gt[o>>8]+gt[255&o]+gt[r>>8]+gt[255&r]+gt[i>>8]+gt[255&i]}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */("string"==typeof t?t:t.join(""))}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const yt=new WeakMap,$t=new Map;function ft(t,e,i){var s;if(t){const r=null!==(s=null==i?void 0:i.id)&&void 0!==s?s:function(t){const e="string"==typeof t?t:t.strings;let i=$t.get(e);void 0===i&&(i=mt(e,"string"!=typeof t&&!("strTag"in t)),$t.set(e,i));return i}
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */(e),n=t[r];if(n){if("string"==typeof n)return n;if("strTag"in n)return at(n.strings,e.values,n.values);{let t=yt.get(n);return void 0===t&&(t=n.values,yt.set(n,t)),{...n,values:t.map((t=>e.values[t]))}}}}return dt(e)}function _t(t){window.dispatchEvent(new CustomEvent("lit-localize-status",{detail:t}))}let bt,xt,wt,At,Et,Dt="",St=new vt;St.resolve();let Ct=0;const kt=()=>Dt,Mt=t=>{if(t===(null!=bt?bt:Dt))return St.promise;if(!wt||!At)throw new Error("Internal error");if(!wt.has(t))throw new Error("Invalid locale code");Ct++;const e=Ct;bt=t,St.settled&&(St=new vt),_t({status:"loading",loadingLocale:t});return(t===xt?Promise.resolve({templates:void 0}):At(t)).then((i=>{Ct===e&&(Dt=t,bt=void 0,Et=i.templates,_t({status:"ready",readyLocale:t}),St.resolve())}),(i=>{Ct===e&&(_t({status:"error",errorLocale:t,errorMessage:i.toString()}),St.reject(i))})),St.promise};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
let Ot=dt,Tt=!1;const Pt=["de","de-DE"],{getLocale:Ht,setLocale:Ut}=(It={sourceLocale:"en",targetLocales:Pt,loadLocale:t=>import(`/lib/generated/locales/${t}.js`)},function(t){if(Tt)throw new Error("lit-localize can only be configured once");Ot=t,Tt=!0}(((t,e)=>ft(Et,t,e))),Dt=xt=It.sourceLocale,wt=new Set(It.targetLocales),wt.add(It.sourceLocale),At=It.loadLocale,{getLocale:kt,setLocale:Mt});var It;function Lt(t){return!t||0===Object.keys(t).length}let Nt=class extends tt{render(){var t,e,i;return U`<div class="controls"><div class="info"><span><strong>${this.heading||Ot("Current Month")}</strong></span><br><span class="day" ?hidden="${Lt(this.expandedDate)}">${null===(t=this.expandedDate)||void 0===t?void 0:t.day}</span> <span class="month">${null===(e=this.activeDate)||void 0===e?void 0:e.month}</span> <span class="year">${null===(i=this.activeDate)||void 0===i?void 0:i.year}</span></div><div class="context" @click="${this._dispatchSwitchView}"><span ?data-active="${!Lt(this.expandedDate)}" data-context="day">${Ot("Day")}</span> <span ?data-active="${Lt(this.expandedDate)}" data-context="month">${Ot("Month")}</span></div><div class="buttons" @click="${this._dispatchSwitchDate}"><button name="previous">«</button> <button name="next">»</button></div></div>`}_dispatchSwitchDate(t){const e=t.target,i=t.target===t.currentTarget?"container":e.name,s=new CustomEvent("switchdate",{detail:{direction:i},bubbles:!0,composed:!0});console.log(s),this.dispatchEvent(s)}_dispatchSwitchView(t){const e=t.target,i=t.target===t.currentTarget?"container":e.dataset.context,s=new CustomEvent("switchview",{detail:{view:i},bubbles:!0,composed:!0});this.dispatchEvent(s)}};Nt.styles=o`.controls{height:3.5em;width:100%;display:flex;flex-direction:row;flex-wrap:nowrap;align-content:center;justify-content:space-between;align-items:center;border-bottom:1px solid var(--separator-light)}@media (max-width:360px){.controls{font-size:small;height:4.5em}}.info{padding-left:1em;text-align:right}.day,.month,.year{color:rgba(0,0,0,.6)}.context{display:flex}.context>*{padding:.25em .5em;border:1px solid var(--separator-light)}.context>:first-child{border-radius:var(--border-radius-sm) 0 0 var(--border-radius-sm);border-right:none}.context>:last-child{border-radius:0 var(--border-radius-sm) var(--border-radius-sm) 0;border-left:none}.buttons{padding-right:1em}button{padding:.75em;margin:0;border-radius:50%;line-height:.5em;border:1px solid transparent}span[data-active]{background-color:var(--separator-light)}`,t([rt({type:String})],Nt.prototype,"heading",void 0),t([rt({type:Object})],Nt.prototype,"activeDate",void 0),t([rt({type:Object})],Nt.prototype,"expandedDate",void 0),Nt=t([ct(),it("lms-calendar-header")],Nt);class Rt{constructor({date:t,direction:e}){this.date=t,this.direction=e}set _date(t){this.date=t}set _direction(t){this.direction=t}getDateByDayInDirection(){if(!this.date)throw Error("Date is not defined.");if(!this.direction)throw Error("Direction is not defined.");if("previous"===this.direction){const t=new Date(this.date.year,this.date.month-1,this.date.day-1);return{day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()}}if("next"===this.direction){const t=new Date(this.date.year,this.date.month-1,this.date.day+1);return{day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()}}return this.date}getDateByMonthInDirection(){if(!this.date)throw Error("Date is not defined.");if(!this.direction)throw Error("Direction is not defined.");return"previous"===this.direction?this.date.month-1==0?{...this.date,year:this.date.year-1,month:12}:{...this.date,month:this.date.month-1}:"next"===this.direction?this.date.month+1===13?{...this.date,year:this.date.year+1,month:1}:{...this.date,month:this.date.month+1}:this.date}}let jt=class extends tt{render(){var t;return 0!==Object.keys(this.activeDate||{day:1,month:1,year:2022}).length?U`<div class="month">${null===(t=this._getCalendarArray())||void 0===t?void 0:t.map((({year:t,month:e,day:i})=>U`<div class="day" data-date="${t}-${e}-${i}" @click="${this._handleExpand}"><div class="indicator">${1===i?`${i}. ${e}`:i}</div><slot name="${t}-${e}-${i}"></slot></div>`))}</div>`:U``}_handleExpand(t){if(null===t.target)return;const e=t.target,{date:i}=e.dataset;if(!i)return;const[s,r,n]=i.split("-").map((t=>parseInt(t,10))),o=new CustomEvent("expand",{detail:{date:{day:n,month:r,year:s}},bubbles:!0,composed:!0});this.dispatchEvent(o)}_getDaysInMonth(t){return new Date(t.year,t.month,0).getDate()}_getOffsetOfFirstDayInMonth(t){const e=new Date(`${t.year}-${t.month}-01`).getDay()-1;return-1===e?6:e}_getDatesInMonthAsArray(t,e){return[...Array.from(Array(this._getDaysInMonth(t)).keys(),((e,i)=>({year:t.year,month:t.month,day:i+1}))).slice(...e)]}_getCalendarArray(){if(!this.activeDate)return;const t=new Rt({date:this.activeDate||{day:1,month:1,year:2022}});t._direction="previous";const e=this._getDatesInMonthAsArray(t.getDateByMonthInDirection(),this._getOffsetOfFirstDayInMonth(this.activeDate)?[-1*this._getOffsetOfFirstDayInMonth(this.activeDate)]:[-0,-0]),i=this._getDatesInMonthAsArray(this.activeDate,[]);t._direction="next";const s=this._getDatesInMonthAsArray(t.getDateByMonthInDirection(),[0,42-(e.length+i.length)]);return e.concat(i,s)}};jt.styles=o`.month{height:calc(100% - 5.5em + 2px);display:grid;grid-template-columns:repeat(7,1fr);border-top:1px solid var(--separator-light)}.month>div{border-bottom:1px solid var(--separator-light);border-right:1px solid var(--separator-light)}.month>div:nth-child(7n + 7){border-right:none}.month>div:nth-last-child(-n + 7){border-bottom:none}.day{width:100%;position:relative;display:flex;flex-direction:column;overflow-x:hidden;gap:1px}.indicator{position:sticky;top:.25em;text-align:right;padding:0 .25em;margin-bottom:.25em;text-align:left}`,t([rt({attribute:!1})],jt.prototype,"activeDate",void 0),jt=t([it("lms-calendar-month")],jt);let zt=class extends tt{constructor(){super(...arguments),this._hours=[...Array(25).keys()],this._hasActiveSidebar=!1}render(){return U`<div class="container"><div class="main w-${this._hasActiveSidebar?"70":"100"}">${this._hours.map(((t,e)=>U`<div class="hour" style="${this._getHourIndicator(t)}"><span class="indicator">${t<10?`0${t}:00`:`${t}:00`}</span></div>${e?U`<div class="separator" style="grid-row:${60*t}"></div>`:U``}<slot name="${t}" class="entry"></slot>`))}</div><div class="sidebar w-${this._hasActiveSidebar?"30":"0"}" ?hidden="${!this._hasActiveSidebar}"></div></div>`}_getHourIndicator(t){return 24!==t?`grid-row: ${60*(t+1)-59}/${60*(t+1)}`:"grid-row: 1440"}};zt.styles=o`.container{display:flex;height:calc(100% - 3.5em);width:100%}.main{display:grid;grid-template-columns:4em 1fr;grid-template-rows:repeat(1440,1fr);height:calc(100% - 1em);gap:1px;overflow-y:scroll;text-align:center;padding:.5em;position:relative}.hour{text-align:center}.indicator{position:relative;top:-.6em}.separator{grid-column:2/3;border-top:1px solid var(--separator-light);position:absolute;width:100%;z-index:0}.sidebar{height:100%;border-left:1px solid var(--separator-light)}.w-100{width:100%}.w-70{width:70%}.w-30{width:30%}.w-0{width:0}`,t([nt()],zt.prototype,"_hours",void 0),t([nt()],zt.prototype,"_hasActiveSidebar",void 0),zt=t([it("lms-calendar-day")],zt);let Bt=class extends tt{render(){return U`<div><span>${Ot("Mon")}</span> <span>${Ot("Tues")}</span> <span>${Ot("Wed")}</span> <span>${Ot("Thurs")}</span> <span>${Ot("Fri")}</span> <span>${Ot("Sat")}</span> <span>${Ot("Sun")}</span></div>`}};Bt.styles=o`div{height:1.75em;display:grid;grid-template-columns:repeat(7,1fr)}span{padding:.25em;text-align:left}`,Bt=t([ct(),it("lms-calendar-context")],Bt);let Wt=class extends tt{constructor(){super(...arguments),this.heading="",this.isContinuation=!1}render(){return U`<div class="main" ?data-highlighted="${this._highlighted}" ?data-extended="${this._extended}"><span @click="${this._handleClick}"><span>${this.heading} </span><span ?hidden="${Lt(this.content)}">· ${this.content}</span> </span>${this.isContinuation?U`<span>${this._displayStartTime(this.time)}</span>`:U``}</div>`}_displayStartTime(t){if(!t)return"Error: No time provided";const e=t.start.hours;let i=t.start.minutes;return i<10&&(i=`0${i}`),"0:00"==`${e}:${i}`?"•":`${e}:${i}`}_handleClick(){this._highlighted=!this._highlighted,this._extended=!this._extended}};function Ft(t){let e=0,i=0,s=0;if(t){const r=t.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,((t,e,i,s)=>`#${e}${e}${i}${i}${s}${s}`)).substring(1).match(/.{2}/g);if(!r)return["rgb(255,255,255)","rgb(0,0,0)"];[e,i,s]=r.map((t=>parseInt(t,16)))}const r=(299*e+587*i+114*s)/1e3;return[`rgb(${e},${i},${s})`,Math.abs(r-255)>Math.abs(r-0)?"rgb(255, 255, 255)":"rgb(0, 0, 0)"]}function Vt(t){const e=t.map((t=>t.end)).sort(((t,e)=>t-e));t.sort(((t,e)=>t.start-e.start));let i=0,s=0,r=0;const n=[];let o=[];for(;;)if(i<t.length&&t[i].start<e[s])o.push(t[i++]),++r;else{if(!(s<t.length))break;++s,0==--r&&(n.push(o),o=[])}return n}Wt.styles=o`:host{font-size:small;grid-column:2;border-radius:var(--entry-br);grid-row:var(--start-slot);width:var(--entry-w);margin:var(--entry-m);background-color:var(--entry-bc);color:var(--entry-c);z-index:1}.main{display:flex;justify-content:space-between;padding:.25em;border-radius:var(--border-radius-sm);background-color:inherit}.main>span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}div[data-highlighted]{background:var(--separator-light)}`,t([rt({attribute:!1})],Wt.prototype,"time",void 0),t([rt()],Wt.prototype,"heading",void 0),t([rt()],Wt.prototype,"content",void 0),t([rt()],Wt.prototype,"isContinuation",void 0),t([nt()],Wt.prototype,"_highlighted",void 0),t([nt()],Wt.prototype,"_extended",void 0),Wt=t([it("lms-calendar-entry")],Wt);class Gt{constructor(t,e,i){this.entry=t,this.startDate=e,this.index=i,this.entry=t,this.startDate=e,this.currentStartDate=new Date(this.startDate.getTime()+864e5*this.index),this.currentEndDate=new Date(this.currentStartDate.getTime()+864e5-1)}getEntry(){return{...this.entry,date:{start:{day:this.currentStartDate.getDate(),month:this.currentStartDate.getMonth()+1,year:this.currentStartDate.getFullYear()},end:{day:this.currentEndDate.getDate(),month:this.currentEndDate.getMonth()+1,year:this.currentEndDate.getFullYear()}}}}}let qt=class extends tt{constructor(){super(...arguments),this.heading="",this.activeDate={day:1,month:1,year:2022},this.entries=[],this.color="#000000",this._viewportWidth=window.innerWidth}connectedCallback(){super.connectedCallback(),this._setLocale()}render(){return U`
      <div>
        <lms-calendar-header
          @switchdate=${this._handleSwitchDate}
          @switchview=${this._handleSwitchView}
          .heading=${this.heading}
          .activeDate=${this.activeDate}
          .expandedDate=${this._expandedDate}
        >
        </lms-calendar-header>

        <lms-calendar-context
          ?hidden=${!Lt(this._expandedDate)}
        >
        </lms-calendar-context>

        <lms-calendar-month
          @expand=${this._handleExpand}
          .activeDate=${this.activeDate}
          ?hidden=${!Lt(this._expandedDate)}
        >
          ${this._getEntries()}
        </lms-calendar-month>

        <lms-calendar-day
          ?hidden=${Lt(this._expandedDate)}
        >
          ${this._getEntriesByDate()}
        </lms-calendar-day>
      </div>
    `}async _setLocale(){try{await(async()=>{const t=window.navigator.language||"en";await Ut(t)})()}catch(t){console.error(`Error loading locale: ${t.message}`)}}_handleSwitchDate(t){console.log("Fired");const e=new Rt({});if(e._direction=t.detail.direction,this._expandedDate){e._date=this._expandedDate;const t=e.getDateByDayInDirection();return this._expandedDate=t,void(this.activeDate=t)}e._date=this.activeDate,this.activeDate=e.getDateByMonthInDirection()}_handleSwitchView(t){var e;"day"===t.detail.view&&(this._expandedDate=Lt(this._expandedDate)?this.activeDate:this._expandedDate),"month"===t.detail.view&&(this.activeDate=null!==(e=this._expandedDate)&&void 0!==e?e:this.activeDate,this._expandedDate=void 0)}_handleExpand(t){this._expandedDate=t.detail.date}_getEntries(){if(this.entries.length){const t=this.entries.sort(((t,e)=>t.time.start.hours-e.time.start.hours||t.time.start.minutes-e.time.start.minutes)),e=t.map((({date:t,time:e,heading:i,color:s},r)=>{const[n,o]=Ft(s),[a,,d]=this._getDaysRange(t),l=[];for(let h=0;h<d;h++){const c=new Gt({date:t,time:e,heading:i,color:s,content:""},a,h).getEntry(),p=h>0&&d>1,u=U`
              <style>
                lms-calendar-entry.${`_${r}`} {
                  --entry-br: ${d>1?0:"var(--border-radius-sm)"};
                  --entry-m: 0 ${0!==h?0:"0.25em"} 0
                    ${0!==h?0:"1.5em"};
                  --entry-bc: ${n};
                  --entry-c: ${o};
                }
              </style>
              <lms-calendar-entry
                class=${`_${r}`}
                slot="${c.date.start.year}-${c.date.start.month}-${c.date.start.day}"
                .time=${c.time}
                .heading=${p?"":c.heading}
                .isContinuation=${p}
              >
              </lms-calendar-entry>
            `;l.push(u)}return l}));return e.flat()}return L}_getEntriesByDate(){if(Lt(this._expandedDate))return;const t=this.entries.filter((t=>function(t,e){return Object.keys(t).length===Object.keys(e).length&&Object.entries(t).every((([i,s])=>i in t&&i in e&&typeof t[i]==typeof e[i]&&s===e[i]))}(t.date.start,this._expandedDate||{}))),e=function(t){const e=new Map;t.forEach((t=>{e.has(t.group)||e.set(t.group,[]),e.get(t.group).push({index:t.index,depth:t.depth,group:t.group})}));const i=[];return e.forEach((t=>{t.sort(((t,e)=>t.index-e.index)),t.forEach(((t,e)=>{i.push({index:t.index,depth:e,group:t.group})}))})),i.sort(((t,e)=>t.index-e.index)),i}(Lt(t)?[]:function(t){const e=t.reduce(((e,i,s)=>1===i.length?[...e,{index:[t.slice(0,s)].flatMap((t=>t.flat().length))[0],depth:0,group:s}]:[...e]),[]),i=t.map(((e,i)=>e.map(((e,s)=>({...e,index:[t.slice(0,i)].flatMap((t=>t.flat().length))[0]+s,group:i}))))).filter((t=>t.length>1));let s=0,r=Math.min(...i.map((t=>t[0].group)));return function t({partitions:i,isNested:n=!1}){s=n?s+=1:0,i.forEach((i=>{const{group:n}=i[0];r!==n&&(s=0),r=n;const o=[...i.map((({start:t,end:e})=>e-t))],a=Math.max(...o),d=o.indexOf(a);e.push({index:i[d].index,depth:s,group:i[d].group}),i.splice(o.indexOf(a),1),t({partitions:Vt(i),isNested:!0})}))}({partitions:i}),e.sort(((t,e)=>t.index-e.index))}(this._getPartitionedSlottedItems(t)));return t.map((({time:t,heading:i,content:s,color:r},n)=>{const[o,a]=Ft(r);return U`
        <style>
          lms-calendar-entry.${`_${n}`} {
            --start-slot: ${this._getGridSlotByTime(t)};
            --entry-w: ${this._getWidthByGroupSize({grading:e,index:n})}%;
            --entry-m: 0 1.5em 0 ${this._getOffsetByDepth({grading:e,index:n})}%;
            --entry-bc: ${o};
            --entry-c: ${a};
          }
        </style>
        <lms-calendar-entry
          class=${`_${n}`}
          slot=${t.start.hours}
          .time=${t}
          .heading=${i}
          .content=${s}
        >
        </lms-calendar-entry>
      `}))}_getGridSlotByTime({start:t,end:e}){const i=60*t.hours+(t.minutes+1);return`${i}/${i+(60*e.hours+e.minutes-i)}`}_getWidthByGroupSize({grading:t,index:e}){return 100/t.filter((i=>i.group===t[e].group)).length}_getOffsetByDepth({grading:t,index:e}){return 0===t[e].depth?0:t[e].depth*(100/t.filter((i=>i.group===t[e].group)).length)}_getPartitionedSlottedItems(t){return Vt(t.map((t=>this._getGridSlotByTime(t.time).replace(/[^0-9/]+/g,"").split("/"))).map((([t,e])=>[parseInt(t,10),parseInt(e,10)])).map((([t,e])=>({start:t,end:e}))))}_getDaysRange(t){const{start:e,end:i}=t,s=new Date(e.year,e.month-1,e.day),r=new Date(i.year,i.month-1,i.day);return[s,r,(r.getTime()-s.getTime())/864e5+1]}};qt.styles=o`
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

      --system-ui: system, -apple-system, '.SFNSText-Regular', 'San Francisco',
        'Roboto', 'Segoe UI', 'Helvetica Neue', 'Lucida Grande', sans-serif;

      --border-radius-sm: 5px;
      --border-radius-md: 7px;
      --border-radius-lg: 12px;
    }
    div {
      height: 100%;
      width: 100%;
      background-color: #fff;
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--separator-light);
      font-family: var(--system-ui);
      color: var(--separator-dark);
      box-shadow: var(--shadow-md);
    }
  `,t([rt({type:String})],qt.prototype,"heading",void 0),t([rt({type:Object})],qt.prototype,"activeDate",void 0),t([rt({type:Array})],qt.prototype,"entries",void 0),t([rt({type:String})],qt.prototype,"color",void 0),t([nt()],qt.prototype,"_expandedDate",void 0),t([nt()],qt.prototype,"_viewportWidth",void 0),qt=t([ct(),it("lms-calendar")],qt);var Yt=qt;export{Yt as default};
//# sourceMappingURL=lms-calendar.bundled.js.map
