import{AsyncDirective as e}from"lit-html/async-directive.js";import{directive as t}from"lit-html/directive.js";import{isServer as n}from"lit-html/is-server.js";import{css as r,LitElement as a,html as i,nothing as s,unsafeCSS as o}from"lit";import{property as l,customElement as c,state as d}from"lit/decorators.js";import{classMap as u}from"lit/directives/class-map.js";import{map as h}from"lit/directives/map.js";let m=class{constructor(e,{target:t,config:r,callback:a,skipInitial:i}){this.t=/* @__PURE__ */new Set,this.o=!1,this.i=!1,this.h=e,null!==t&&this.t.add(t??e),this.l=r,this.o=i??this.o,this.callback=a,n||(window.ResizeObserver?(this.u=new ResizeObserver(e=>{this.handleChanges(e),this.h.requestUpdate()}),e.addController(this)):console.warn("ResizeController error: browser does not support ResizeObserver."))}handleChanges(e){this.value=this.callback?.(e,this.u)}hostConnected(){for(const e of this.t)this.observe(e)}hostDisconnected(){this.disconnect()}async hostUpdated(){!this.o&&this.i&&this.handleChanges([]),this.i=!1}observe(e){this.t.add(e),this.u.observe(e,this.l),this.i=!0,this.h.requestUpdate()}unobserve(e){this.t.delete(e),this.u.unobserve(e)}disconnect(){this.u.disconnect()}target(e){return f(this,e)}};const f=t(class extends e{constructor(){super(...arguments),this.observing=!1}render(e,t){}update(e,[t,n]){this.controller=t,this.part=e,this.observe=n,!1===n?(t.unobserve(e.element),this.observing=!1):!1===this.observing&&(t.observe(e.element),this.observing=!0)}disconnected(){this.controller?.unobserve(this.part.element),this.observing=!1}reconnected(){!1!==this.observe&&!1===this.observing&&(this.controller?.observe(this.part.element),this.observing=!0)}});class y extends Error{}class p extends y{constructor(e){super(`Invalid DateTime: ${e.toMessage()}`)}}class g extends y{constructor(e){super(`Invalid Interval: ${e.toMessage()}`)}}class b extends y{constructor(e){super(`Invalid Duration: ${e.toMessage()}`)}}class v extends y{}class w extends y{constructor(e){super(`Invalid unit ${e}`)}}class k extends y{}class D extends y{constructor(){super("Zone is an abstract class")}}const S="numeric",x="short",T="long",E={year:S,month:S,day:S},M={year:S,month:x,day:S},O={year:S,month:x,day:S,weekday:x},$={year:S,month:T,day:S},N={year:S,month:T,day:S,weekday:T},C={hour:S,minute:S},I={hour:S,minute:S,second:S},_={hour:S,minute:S,second:S,timeZoneName:x},A={hour:S,minute:S,second:S,timeZoneName:T},R={hour:S,minute:S,hourCycle:"h23"},L={hour:S,minute:S,second:S,hourCycle:"h23"},z={hour:S,minute:S,second:S,hourCycle:"h23",timeZoneName:x},W={hour:S,minute:S,second:S,hourCycle:"h23",timeZoneName:T},F={year:S,month:S,day:S,hour:S,minute:S},V={year:S,month:S,day:S,hour:S,minute:S,second:S},j={year:S,month:x,day:S,hour:S,minute:S},Y={year:S,month:x,day:S,hour:S,minute:S,second:S},U={year:S,month:x,day:S,weekday:x,hour:S,minute:S},Z={year:S,month:T,day:S,hour:S,minute:S,timeZoneName:x},H={year:S,month:T,day:S,hour:S,minute:S,second:S,timeZoneName:x},q={year:S,month:T,day:S,weekday:T,hour:S,minute:S,timeZoneName:T},P={year:S,month:T,day:S,weekday:T,hour:S,minute:S,second:S,timeZoneName:T};class B{get type(){throw new D}get name(){throw new D}get ianaName(){return this.name}get isUniversal(){throw new D}offsetName(e,t){throw new D}formatOffset(e,t){throw new D}offset(e){throw new D}equals(e){throw new D}get isValid(){throw new D}}let G=null;class K extends B{static get instance(){return null===G&&(G=new K),G}get type(){return"system"}get name(){return(new Intl.DateTimeFormat).resolvedOptions().timeZone}get isUniversal(){return!1}offsetName(e,{format:t,locale:n}){return pt(e,t,n)}formatOffset(e,t){return wt(this.offset(e),t)}offset(e){return-new Date(e).getTimezoneOffset()}equals(e){return"system"===e.type}get isValid(){return!0}}const J=/* @__PURE__ */new Map;const Q={year:0,month:1,day:2,era:3,hour:4,minute:5,second:6};const X=/* @__PURE__ */new Map;class ee extends B{static create(e){let t=X.get(e);return void 0===t&&X.set(e,t=new ee(e)),t}static resetCache(){X.clear(),J.clear()}static isValidSpecifier(e){return this.isValidZone(e)}static isValidZone(e){if(!e)return!1;try{return new Intl.DateTimeFormat("en-US",{timeZone:e}).format(),!0}catch(t){return!1}}constructor(e){super(),this.zoneName=e,this.valid=ee.isValidZone(e)}get type(){return"iana"}get name(){return this.zoneName}get isUniversal(){return!1}offsetName(e,{format:t,locale:n}){return pt(e,t,n,this.name)}formatOffset(e,t){return wt(this.offset(e),t)}offset(e){if(!this.valid)return NaN;const t=new Date(e);if(isNaN(t))return NaN;const n=function(e){let t=J.get(e);return void 0===t&&(t=new Intl.DateTimeFormat("en-US",{hour12:!1,timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",era:"short"}),J.set(e,t)),t}(this.name);let[r,a,i,s,o,l,c]=n.formatToParts?function(e,t){const n=e.formatToParts(t),r=[];for(let a=0;a<n.length;a++){const{type:e,value:t}=n[a],i=Q[e];"era"===e?r[i]=t:Ge(i)||(r[i]=parseInt(t,10))}return r}(n,t):function(e,t){const n=e.format(t).replace(/\u200E/g,""),r=/(\d+)\/(\d+)\/(\d+) (AD|BC),? (\d+):(\d+):(\d+)/.exec(n),[,a,i,s,o,l,c,d]=r;return[s,a,i,o,l,c,d]}(n,t);"BC"===s&&(r=1-Math.abs(r));let d=+t;const u=d%1e3;return d-=u>=0?u:1e3+u,(ht({year:r,month:a,day:i,hour:24===o?0:o,minute:l,second:c,millisecond:0})-d)/6e4}equals(e){return"iana"===e.type&&e.name===this.name}get isValid(){return this.valid}}let te={};const ne=/* @__PURE__ */new Map;function re(e,t={}){const n=JSON.stringify([e,t]);let r=ne.get(n);return void 0===r&&(r=new Intl.DateTimeFormat(e,t),ne.set(n,r)),r}const ae=/* @__PURE__ */new Map;const ie=/* @__PURE__ */new Map;let se=null;const oe=/* @__PURE__ */new Map;function le(e){let t=oe.get(e);return void 0===t&&(t=new Intl.DateTimeFormat(e).resolvedOptions(),oe.set(e,t)),t}const ce=/* @__PURE__ */new Map;function de(e,t,n,r){const a=e.listingMode();return"error"===a?null:"en"===a?n(t):r(t)}class ue{constructor(e,t,n){this.padTo=n.padTo||0,this.floor=n.floor||!1;const{padTo:r,floor:a,...i}=n;if(!t||Object.keys(i).length>0){const t={useGrouping:!1,...n};n.padTo>0&&(t.minimumIntegerDigits=n.padTo),this.inf=function(e,t={}){const n=JSON.stringify([e,t]);let r=ae.get(n);return void 0===r&&(r=new Intl.NumberFormat(e,t),ae.set(n,r)),r}(e,t)}}format(e){if(this.inf){const t=this.floor?Math.floor(e):e;return this.inf.format(t)}return at(this.floor?Math.floor(e):lt(e,3),this.padTo)}}class he{constructor(e,t,n){let r;if(this.opts=n,this.originalZone=void 0,this.opts.timeZone)this.dt=e;else if("fixed"===e.zone.type){const t=e.offset/60*-1,n=t>=0?`Etc/GMT+${t}`:`Etc/GMT${t}`;0!==e.offset&&ee.create(n).valid?(r=n,this.dt=e):(r="UTC",this.dt=0===e.offset?e:e.setZone("UTC").plus({minutes:e.offset}),this.originalZone=e.zone)}else"system"===e.zone.type?this.dt=e:"iana"===e.zone.type?(this.dt=e,r=e.zone.name):(r="UTC",this.dt=e.setZone("UTC").plus({minutes:e.offset}),this.originalZone=e.zone);const a={...this.opts};a.timeZone=a.timeZone||r,this.dtf=re(t,a)}format(){return this.originalZone?this.formatToParts().map(({value:e})=>e).join(""):this.dtf.format(this.dt.toJSDate())}formatToParts(){const e=this.dtf.formatToParts(this.dt.toJSDate());return this.originalZone?e.map(e=>{if("timeZoneName"===e.type){const t=this.originalZone.offsetName(this.dt.ts,{locale:this.dt.locale,format:this.opts.timeZoneName});return{...e,value:t}}return e}):e}resolvedOptions(){return this.dtf.resolvedOptions()}}class me{constructor(e,t,n){this.opts={style:"long",...n},!t&&Qe()&&(this.rtf=function(e,t={}){const{base:n,...r}=t,a=JSON.stringify([e,r]);let i=ie.get(a);return void 0===i&&(i=new Intl.RelativeTimeFormat(e,t),ie.set(a,i)),i}(e,n))}format(e,t){return this.rtf?this.rtf.format(e,t):function(e,t,n="always",r=!1){const a={years:["year","yr."],quarters:["quarter","qtr."],months:["month","mo."],weeks:["week","wk."],days:["day","day","days"],hours:["hour","hr."],minutes:["minute","min."],seconds:["second","sec."]},i=-1===["hours","minutes","seconds"].indexOf(e);if("auto"===n&&i){const n="days"===e;switch(t){case 1:return n?"tomorrow":`next ${a[e][0]}`;case-1:return n?"yesterday":`last ${a[e][0]}`;case 0:return n?"today":`this ${a[e][0]}`}}const s=Object.is(t,-0)||t<0,o=Math.abs(t),l=1===o,c=a[e],d=r?l?c[1]:c[2]||c[1]:l?a[e][0]:e;return s?`${o} ${d} ago`:`in ${o} ${d}`}(t,e,this.opts.numeric,"long"!==this.opts.style)}formatToParts(e,t){return this.rtf?this.rtf.formatToParts(e,t):[]}}const fe={firstDay:1,minimalDays:4,weekend:[6,7]};class ye{static fromOpts(e){return ye.create(e.locale,e.numberingSystem,e.outputCalendar,e.weekSettings,e.defaultToEN)}static create(e,t,n,r,a=!1){const i=e||_e.defaultLocale,s=i||(a?"en-US":se||(se=(new Intl.DateTimeFormat).resolvedOptions().locale,se)),o=t||_e.defaultNumberingSystem,l=n||_e.defaultOutputCalendar,c=nt(r)||_e.defaultWeekSettings;return new ye(s,o,l,c,i)}static resetCache(){se=null,ne.clear(),ae.clear(),ie.clear(),oe.clear(),ce.clear()}static fromObject({locale:e,numberingSystem:t,outputCalendar:n,weekSettings:r}={}){return ye.create(e,t,n,r)}constructor(e,t,n,r,a){const[i,s,o]=function(e){const t=e.indexOf("-x-");-1!==t&&(e=e.substring(0,t));const n=e.indexOf("-u-");if(-1===n)return[e];{let t,a;try{t=re(e).resolvedOptions(),a=e}catch(r){const i=e.substring(0,n);t=re(i).resolvedOptions(),a=i}const{numberingSystem:i,calendar:s}=t;return[a,i,s]}}(e);this.locale=i,this.numberingSystem=t||s||null,this.outputCalendar=n||o||null,this.weekSettings=r,this.intl=function(e,t,n){return n||t?(e.includes("-u-")||(e+="-u"),n&&(e+=`-ca-${n}`),t&&(e+=`-nu-${t}`),e):e}(this.locale,this.numberingSystem,this.outputCalendar),this.weekdaysCache={format:{},standalone:{}},this.monthsCache={format:{},standalone:{}},this.meridiemCache=null,this.eraCache={},this.specifiedLocale=a,this.fastNumbersCached=null}get fastNumbers(){var e;return null==this.fastNumbersCached&&(this.fastNumbersCached=(!(e=this).numberingSystem||"latn"===e.numberingSystem)&&("latn"===e.numberingSystem||!e.locale||e.locale.startsWith("en")||"latn"===le(e.locale).numberingSystem)),this.fastNumbersCached}listingMode(){const e=this.isEnglish(),t=!(null!==this.numberingSystem&&"latn"!==this.numberingSystem||null!==this.outputCalendar&&"gregory"!==this.outputCalendar);return e&&t?"en":"intl"}clone(e){return e&&0!==Object.getOwnPropertyNames(e).length?ye.create(e.locale||this.specifiedLocale,e.numberingSystem||this.numberingSystem,e.outputCalendar||this.outputCalendar,nt(e.weekSettings)||this.weekSettings,e.defaultToEN||!1):this}redefaultToEN(e={}){return this.clone({...e,defaultToEN:!0})}redefaultToSystem(e={}){return this.clone({...e,defaultToEN:!1})}months(e,t=!1){return de(this,e,Tt,()=>{const n="ja"===this.intl||this.intl.startsWith("ja-"),r=(t&=!n)?{month:e,day:"numeric"}:{month:e},a=t?"format":"standalone";if(!this.monthsCache[a][e]){const t=n?e=>this.dtFormatter(e,r).format():e=>this.extract(e,r,"month");this.monthsCache[a][e]=function(e){const t=[];for(let n=1;n<=12;n++){const r=Cr.utc(2009,n,1);t.push(e(r))}return t}(t)}return this.monthsCache[a][e]})}weekdays(e,t=!1){return de(this,e,$t,()=>{const n=t?{weekday:e,year:"numeric",month:"long",day:"numeric"}:{weekday:e},r=t?"format":"standalone";return this.weekdaysCache[r][e]||(this.weekdaysCache[r][e]=function(e){const t=[];for(let n=1;n<=7;n++){const r=Cr.utc(2016,11,13+n);t.push(e(r))}return t}(e=>this.extract(e,n,"weekday"))),this.weekdaysCache[r][e]})}meridiems(){return de(this,void 0,()=>Nt,()=>{if(!this.meridiemCache){const e={hour:"numeric",hourCycle:"h12"};this.meridiemCache=[Cr.utc(2016,11,13,9),Cr.utc(2016,11,13,19)].map(t=>this.extract(t,e,"dayperiod"))}return this.meridiemCache})}eras(e){return de(this,e,At,()=>{const t={era:e};return this.eraCache[e]||(this.eraCache[e]=[Cr.utc(-40,1,1),Cr.utc(2017,1,1)].map(e=>this.extract(e,t,"era"))),this.eraCache[e]})}extract(e,t,n){const r=this.dtFormatter(e,t).formatToParts().find(e=>e.type.toLowerCase()===n);return r?r.value:null}numberFormatter(e={}){return new ue(this.intl,e.forceSimple||this.fastNumbers,e)}dtFormatter(e,t={}){return new he(e,this.intl,t)}relFormatter(e={}){return new me(this.intl,this.isEnglish(),e)}listFormatter(e={}){return function(e,t={}){const n=JSON.stringify([e,t]);let r=te[n];return r||(r=new Intl.ListFormat(e,t),te[n]=r),r}(this.intl,e)}isEnglish(){return"en"===this.locale||"en-us"===this.locale.toLowerCase()||le(this.intl).locale.startsWith("en-us")}getWeekSettings(){return this.weekSettings?this.weekSettings:Xe()?function(e){let t=ce.get(e);if(!t){const n=new Intl.Locale(e);t="getWeekInfo"in n?n.getWeekInfo():n.weekInfo,"minimalDays"in t||(t={...fe,...t}),ce.set(e,t)}return t}(this.locale):fe}getStartOfWeek(){return this.getWeekSettings().firstDay}getMinDaysInFirstWeek(){return this.getWeekSettings().minimalDays}getWeekendDays(){return this.getWeekSettings().weekend}equals(e){return this.locale===e.locale&&this.numberingSystem===e.numberingSystem&&this.outputCalendar===e.outputCalendar}toString(){return`Locale(${this.locale}, ${this.numberingSystem}, ${this.outputCalendar})`}}let pe=null;class ge extends B{static get utcInstance(){return null===pe&&(pe=new ge(0)),pe}static instance(e){return 0===e?ge.utcInstance:new ge(e)}static parseSpecifier(e){if(e){const t=e.match(/^utc(?:([+-]\d{1,2})(?::(\d{2}))?)?$/i);if(t)return new ge(gt(t[1],t[2]))}return null}constructor(e){super(),this.fixed=e}get type(){return"fixed"}get name(){return 0===this.fixed?"UTC":`UTC${wt(this.fixed,"narrow")}`}get ianaName(){return 0===this.fixed?"Etc/UTC":`Etc/GMT${wt(-this.fixed,"narrow")}`}offsetName(){return this.name}formatOffset(e,t){return wt(this.fixed,t)}get isUniversal(){return!0}offset(){return this.fixed}equals(e){return"fixed"===e.type&&e.fixed===this.fixed}get isValid(){return!0}}class be extends B{constructor(e){super(),this.zoneName=e}get type(){return"invalid"}get name(){return this.zoneName}get isUniversal(){return!1}offsetName(){return null}formatOffset(){return""}offset(){return NaN}equals(){return!1}get isValid(){return!1}}function ve(e,t){if(Ge(e)||null===e)return t;if(e instanceof B)return e;if("string"==typeof e){const n=e.toLowerCase();return"default"===n?t:"local"===n||"system"===n?K.instance:"utc"===n||"gmt"===n?ge.utcInstance:ge.parseSpecifier(n)||ee.create(e)}return Ke(e)?ge.instance(e):"object"==typeof e&&"offset"in e&&"function"==typeof e.offset?e:new be(e)}const we={arab:"[٠-٩]",arabext:"[۰-۹]",bali:"[᭐-᭙]",beng:"[০-৯]",deva:"[०-९]",fullwide:"[０-９]",gujr:"[૦-૯]",hanidec:"[〇|一|二|三|四|五|六|七|八|九]",khmr:"[០-៩]",knda:"[೦-೯]",laoo:"[໐-໙]",limb:"[᥆-᥏]",mlym:"[൦-൯]",mong:"[᠐-᠙]",mymr:"[၀-၉]",orya:"[୦-୯]",tamldec:"[௦-௯]",telu:"[౦-౯]",thai:"[๐-๙]",tibt:"[༠-༩]",latn:"\\d"},ke={arab:[1632,1641],arabext:[1776,1785],bali:[6992,7001],beng:[2534,2543],deva:[2406,2415],fullwide:[65296,65303],gujr:[2790,2799],khmr:[6112,6121],knda:[3302,3311],laoo:[3792,3801],limb:[6470,6479],mlym:[3430,3439],mong:[6160,6169],mymr:[4160,4169],orya:[2918,2927],tamldec:[3046,3055],telu:[3174,3183],thai:[3664,3673],tibt:[3872,3881]},De=we.hanidec.replace(/[\[|\]]/g,"").split("");const Se=/* @__PURE__ */new Map;function xe({numberingSystem:e},t=""){const n=e||"latn";let r=Se.get(n);void 0===r&&(r=/* @__PURE__ */new Map,Se.set(n,r));let a=r.get(t);return void 0===a&&(a=new RegExp(`${we[n]}${t}`),r.set(t,a)),a}let Te,Ee=()=>Date.now(),Me="system",Oe=null,$e=null,Ne=null,Ce=60,Ie=null;class _e{static get now(){return Ee}static set now(e){Ee=e}static set defaultZone(e){Me=e}static get defaultZone(){return ve(Me,K.instance)}static get defaultLocale(){return Oe}static set defaultLocale(e){Oe=e}static get defaultNumberingSystem(){return $e}static set defaultNumberingSystem(e){$e=e}static get defaultOutputCalendar(){return Ne}static set defaultOutputCalendar(e){Ne=e}static get defaultWeekSettings(){return Ie}static set defaultWeekSettings(e){Ie=nt(e)}static get twoDigitCutoffYear(){return Ce}static set twoDigitCutoffYear(e){Ce=e%100}static get throwOnInvalid(){return Te}static set throwOnInvalid(e){Te=e}static resetCaches(){ye.resetCache(),ee.resetCache(),Cr.resetCache(),Se.clear()}}class Ae{constructor(e,t){this.reason=e,this.explanation=t}toMessage(){return this.explanation?`${this.reason}: ${this.explanation}`:this.reason}}const Re=[0,31,59,90,120,151,181,212,243,273,304,334],Le=[0,31,60,91,121,152,182,213,244,274,305,335];function ze(e,t){return new Ae("unit out of range",`you specified ${t} (of type ${typeof t}) as a ${e}, which is invalid`)}function We(e,t,n){const r=new Date(Date.UTC(e,t-1,n));e<100&&e>=0&&r.setUTCFullYear(r.getUTCFullYear()-1900);const a=r.getUTCDay();return 0===a?7:a}function Fe(e,t,n){return n+(ct(e)?Le:Re)[t-1]}function Ve(e,t){const n=ct(e)?Le:Re,r=n.findIndex(e=>e<t);return{month:r+1,day:t-n[r]}}function je(e,t){return(e-t+7)%7+1}function Ye(e,t=4,n=1){const{year:r,month:a,day:i}=e,s=Fe(r,a,i),o=je(We(r,a,i),n);let l,c=Math.floor((s-o+14-t)/7);return c<1?(l=r-1,c=ft(l,t,n)):c>ft(r,t,n)?(l=r+1,c=1):l=r,{weekYear:l,weekNumber:c,weekday:o,...kt(e)}}function Ue(e,t=4,n=1){const{weekYear:r,weekNumber:a,weekday:i}=e,s=je(We(r,1,t),n),o=dt(r);let l,c=7*a+i-s-7+t;c<1?(l=r-1,c+=dt(l)):c>o?(l=r+1,c-=dt(r)):l=r;const{month:d,day:u}=Ve(l,c);return{year:l,month:d,day:u,...kt(e)}}function Ze(e){const{year:t,month:n,day:r}=e;return{year:t,ordinal:Fe(t,n,r),...kt(e)}}function He(e){const{year:t,ordinal:n}=e,{month:r,day:a}=Ve(t,n);return{year:t,month:r,day:a,...kt(e)}}function qe(e,t){if(!Ge(e.localWeekday)||!Ge(e.localWeekNumber)||!Ge(e.localWeekYear)){if(!Ge(e.weekday)||!Ge(e.weekNumber)||!Ge(e.weekYear))throw new v("Cannot mix locale-based week fields with ISO-based week fields");return Ge(e.localWeekday)||(e.weekday=e.localWeekday),Ge(e.localWeekNumber)||(e.weekNumber=e.localWeekNumber),Ge(e.localWeekYear)||(e.weekYear=e.localWeekYear),delete e.localWeekday,delete e.localWeekNumber,delete e.localWeekYear,{minDaysInFirstWeek:t.getMinDaysInFirstWeek(),startOfWeek:t.getStartOfWeek()}}return{minDaysInFirstWeek:4,startOfWeek:1}}function Pe(e){const t=Je(e.year),n=rt(e.month,1,12),r=rt(e.day,1,ut(e.year,e.month));return t?n?!r&&ze("day",e.day):ze("month",e.month):ze("year",e.year)}function Be(e){const{hour:t,minute:n,second:r,millisecond:a}=e,i=rt(t,0,23)||24===t&&0===n&&0===r&&0===a,s=rt(n,0,59),o=rt(r,0,59),l=rt(a,0,999);return i?s?o?!l&&ze("millisecond",a):ze("second",r):ze("minute",n):ze("hour",t)}function Ge(e){return void 0===e}function Ke(e){return"number"==typeof e}function Je(e){return"number"==typeof e&&e%1==0}function Qe(){try{return"undefined"!=typeof Intl&&!!Intl.RelativeTimeFormat}catch(e){return!1}}function Xe(){try{return"undefined"!=typeof Intl&&!!Intl.Locale&&("weekInfo"in Intl.Locale.prototype||"getWeekInfo"in Intl.Locale.prototype)}catch(e){return!1}}function et(e,t,n){if(0!==e.length)return e.reduce((e,r)=>{const a=[t(r),r];return e&&n(e[0],a[0])===e[0]?e:a},null)[1]}function tt(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function nt(e){if(null==e)return null;if("object"!=typeof e)throw new k("Week settings must be an object");if(!rt(e.firstDay,1,7)||!rt(e.minimalDays,1,7)||!Array.isArray(e.weekend)||e.weekend.some(e=>!rt(e,1,7)))throw new k("Invalid week settings");return{firstDay:e.firstDay,minimalDays:e.minimalDays,weekend:Array.from(e.weekend)}}function rt(e,t,n){return Je(e)&&e>=t&&e<=n}function at(e,t=2){let n;return n=e<0?"-"+(""+-e).padStart(t,"0"):(""+e).padStart(t,"0"),n}function it(e){return Ge(e)||null===e||""===e?void 0:parseInt(e,10)}function st(e){return Ge(e)||null===e||""===e?void 0:parseFloat(e)}function ot(e){if(!Ge(e)&&null!==e&&""!==e){const t=1e3*parseFloat("0."+e);return Math.floor(t)}}function lt(e,t,n="round"){const r=10**t;switch(n){case"expand":return e>0?Math.ceil(e*r)/r:Math.floor(e*r)/r;case"trunc":return Math.trunc(e*r)/r;case"round":return Math.round(e*r)/r;case"floor":return Math.floor(e*r)/r;case"ceil":return Math.ceil(e*r)/r;default:throw new RangeError(`Value rounding ${n} is out of range`)}}function ct(e){return e%4==0&&(e%100!=0||e%400==0)}function dt(e){return ct(e)?366:365}function ut(e,t){const n=(r=t-1)-(a=12)*Math.floor(r/a)+1;var r,a;return 2===n?ct(e+(t-n)/12)?29:28:[31,null,31,30,31,30,31,31,30,31,30,31][n-1]}function ht(e){let t=Date.UTC(e.year,e.month-1,e.day,e.hour,e.minute,e.second,e.millisecond);return e.year<100&&e.year>=0&&(t=new Date(t),t.setUTCFullYear(e.year,e.month-1,e.day)),+t}function mt(e,t,n){return-je(We(e,1,t),n)+t-1}function ft(e,t=4,n=1){const r=mt(e,t,n),a=mt(e+1,t,n);return(dt(e)-r+a)/7}function yt(e){return e>99?e:e>_e.twoDigitCutoffYear?1900+e:2e3+e}function pt(e,t,n,r=null){const a=new Date(e),i={hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"};r&&(i.timeZone=r);const s={timeZoneName:t,...i},o=new Intl.DateTimeFormat(n,s).formatToParts(a).find(e=>"timezonename"===e.type.toLowerCase());return o?o.value:null}function gt(e,t){let n=parseInt(e,10);Number.isNaN(n)&&(n=0);const r=parseInt(t,10)||0;return 60*n+(n<0||Object.is(n,-0)?-r:r)}function bt(e){const t=Number(e);if("boolean"==typeof e||""===e||!Number.isFinite(t))throw new k(`Invalid unit value ${e}`);return t}function vt(e,t){const n={};for(const r in e)if(tt(e,r)){const a=e[r];if(null==a)continue;n[t(r)]=bt(a)}return n}function wt(e,t){const n=Math.trunc(Math.abs(e/60)),r=Math.trunc(Math.abs(e%60)),a=e>=0?"+":"-";switch(t){case"short":return`${a}${at(n,2)}:${at(r,2)}`;case"narrow":return`${a}${n}${r>0?`:${r}`:""}`;case"techie":return`${a}${at(n,2)}${at(r,2)}`;default:throw new RangeError(`Value format ${t} is out of range for property format`)}}function kt(e){return function(e,t){return t.reduce((t,n)=>(t[n]=e[n],t),{})}(e,["hour","minute","second","millisecond"])}const Dt=["January","February","March","April","May","June","July","August","September","October","November","December"],St=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],xt=["J","F","M","A","M","J","J","A","S","O","N","D"];function Tt(e){switch(e){case"narrow":return[...xt];case"short":return[...St];case"long":return[...Dt];case"numeric":return["1","2","3","4","5","6","7","8","9","10","11","12"];case"2-digit":return["01","02","03","04","05","06","07","08","09","10","11","12"];default:return null}}const Et=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],Mt=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],Ot=["M","T","W","T","F","S","S"];function $t(e){switch(e){case"narrow":return[...Ot];case"short":return[...Mt];case"long":return[...Et];case"numeric":return["1","2","3","4","5","6","7"];default:return null}}const Nt=["AM","PM"],Ct=["Before Christ","Anno Domini"],It=["BC","AD"],_t=["B","A"];function At(e){switch(e){case"narrow":return[..._t];case"short":return[...It];case"long":return[...Ct];default:return null}}function Rt(e,t){let n="";for(const r of e)r.literal?n+=r.val:n+=t(r.val);return n}const Lt={D:E,DD:M,DDD:$,DDDD:N,t:C,tt:I,ttt:_,tttt:A,T:R,TT:L,TTT:z,TTTT:W,f:F,ff:j,fff:Z,ffff:q,F:V,FF:Y,FFF:H,FFFF:P};class zt{static create(e,t={}){return new zt(e,t)}static parseFormat(e){let t=null,n="",r=!1;const a=[];for(let i=0;i<e.length;i++){const s=e.charAt(i);"'"===s?((n.length>0||r)&&a.push({literal:r||/^\s+$/.test(n),val:""===n?"'":n}),t=null,n="",r=!r):r||s===t?n+=s:(n.length>0&&a.push({literal:/^\s+$/.test(n),val:n}),n=s,t=s)}return n.length>0&&a.push({literal:r||/^\s+$/.test(n),val:n}),a}static macroTokenToFormatOpts(e){return Lt[e]}constructor(e,t){this.opts=t,this.loc=e,this.systemLoc=null}formatWithSystemDefault(e,t){null===this.systemLoc&&(this.systemLoc=this.loc.redefaultToSystem());return this.systemLoc.dtFormatter(e,{...this.opts,...t}).format()}dtFormatter(e,t={}){return this.loc.dtFormatter(e,{...this.opts,...t})}formatDateTime(e,t){return this.dtFormatter(e,t).format()}formatDateTimeParts(e,t){return this.dtFormatter(e,t).formatToParts()}formatInterval(e,t){return this.dtFormatter(e.start,t).dtf.formatRange(e.start.toJSDate(),e.end.toJSDate())}resolvedOptions(e,t){return this.dtFormatter(e,t).resolvedOptions()}num(e,t=0,n=void 0){if(this.opts.forceSimple)return at(e,t);const r={...this.opts};return t>0&&(r.padTo=t),n&&(r.signDisplay=n),this.loc.numberFormatter(r).format(e)}formatDateTimeFromString(e,t){const n="en"===this.loc.listingMode(),r=this.loc.outputCalendar&&"gregory"!==this.loc.outputCalendar,a=(t,n)=>this.loc.extract(e,t,n),i=t=>e.isOffsetFixed&&0===e.offset&&t.allowZ?"Z":e.isValid?e.zone.formatOffset(e.ts,t.format):"",s=()=>n?function(e){return Nt[e.hour<12?0:1]}(e):a({hour:"numeric",hourCycle:"h12"},"dayperiod"),o=(t,r)=>n?function(e,t){return Tt(t)[e.month-1]}(e,t):a(r?{month:t}:{month:t,day:"numeric"},"month"),l=(t,r)=>n?function(e,t){return $t(t)[e.weekday-1]}(e,t):a(r?{weekday:t}:{weekday:t,month:"long",day:"numeric"},"weekday"),c=t=>{const n=zt.macroTokenToFormatOpts(t);return n?this.formatWithSystemDefault(e,n):t},d=t=>n?function(e,t){return At(t)[e.year<0?0:1]}(e,t):a({era:t},"era");return Rt(zt.parseFormat(t),t=>{switch(t){case"S":return this.num(e.millisecond);case"u":case"SSS":return this.num(e.millisecond,3);case"s":return this.num(e.second);case"ss":return this.num(e.second,2);case"uu":return this.num(Math.floor(e.millisecond/10),2);case"uuu":return this.num(Math.floor(e.millisecond/100));case"m":return this.num(e.minute);case"mm":return this.num(e.minute,2);case"h":return this.num(e.hour%12==0?12:e.hour%12);case"hh":return this.num(e.hour%12==0?12:e.hour%12,2);case"H":return this.num(e.hour);case"HH":return this.num(e.hour,2);case"Z":return i({format:"narrow",allowZ:this.opts.allowZ});case"ZZ":return i({format:"short",allowZ:this.opts.allowZ});case"ZZZ":return i({format:"techie",allowZ:this.opts.allowZ});case"ZZZZ":return e.zone.offsetName(e.ts,{format:"short",locale:this.loc.locale});case"ZZZZZ":return e.zone.offsetName(e.ts,{format:"long",locale:this.loc.locale});case"z":return e.zoneName;case"a":return s();case"d":return r?a({day:"numeric"},"day"):this.num(e.day);case"dd":return r?a({day:"2-digit"},"day"):this.num(e.day,2);case"c":case"E":return this.num(e.weekday);case"ccc":return l("short",!0);case"cccc":return l("long",!0);case"ccccc":return l("narrow",!0);case"EEE":return l("short",!1);case"EEEE":return l("long",!1);case"EEEEE":return l("narrow",!1);case"L":return r?a({month:"numeric",day:"numeric"},"month"):this.num(e.month);case"LL":return r?a({month:"2-digit",day:"numeric"},"month"):this.num(e.month,2);case"LLL":return o("short",!0);case"LLLL":return o("long",!0);case"LLLLL":return o("narrow",!0);case"M":return r?a({month:"numeric"},"month"):this.num(e.month);case"MM":return r?a({month:"2-digit"},"month"):this.num(e.month,2);case"MMM":return o("short",!1);case"MMMM":return o("long",!1);case"MMMMM":return o("narrow",!1);case"y":return r?a({year:"numeric"},"year"):this.num(e.year);case"yy":return r?a({year:"2-digit"},"year"):this.num(e.year.toString().slice(-2),2);case"yyyy":return r?a({year:"numeric"},"year"):this.num(e.year,4);case"yyyyyy":return r?a({year:"numeric"},"year"):this.num(e.year,6);case"G":return d("short");case"GG":return d("long");case"GGGGG":return d("narrow");case"kk":return this.num(e.weekYear.toString().slice(-2),2);case"kkkk":return this.num(e.weekYear,4);case"W":return this.num(e.weekNumber);case"WW":return this.num(e.weekNumber,2);case"n":return this.num(e.localWeekNumber);case"nn":return this.num(e.localWeekNumber,2);case"ii":return this.num(e.localWeekYear.toString().slice(-2),2);case"iiii":return this.num(e.localWeekYear,4);case"o":return this.num(e.ordinal);case"ooo":return this.num(e.ordinal,3);case"q":return this.num(e.quarter);case"qq":return this.num(e.quarter,2);case"X":return this.num(Math.floor(e.ts/1e3));case"x":return this.num(e.ts);default:return c(t)}})}formatDurationFromString(e,t){const n="negativeLargestOnly"===this.opts.signMode?-1:1,r=e=>{switch(e[0]){case"S":return"milliseconds";case"s":return"seconds";case"m":return"minutes";case"h":return"hours";case"d":return"days";case"w":return"weeks";case"M":return"months";case"y":return"years";default:return null}},a=zt.parseFormat(t),i=a.reduce((e,{literal:t,val:n})=>t?e:e.concat(n),[]),s=e.shiftTo(...i.map(r).filter(e=>e));return Rt(a,((e,t)=>a=>{const i=r(a);if(i){const r=t.isNegativeDuration&&i!==t.largestUnit?n:1;let s;return s="negativeLargestOnly"===this.opts.signMode&&i!==t.largestUnit?"never":"all"===this.opts.signMode?"always":"auto",this.num(e.get(i)*r,a.length,s)}return a})(s,{isNegativeDuration:s<0,largestUnit:Object.keys(s.values)[0]}))}}const Wt=/[A-Za-z_+-]{1,256}(?::?\/[A-Za-z0-9_+-]{1,256}(?:\/[A-Za-z0-9_+-]{1,256})?)?/;function Ft(...e){const t=e.reduce((e,t)=>e+t.source,"");return RegExp(`^${t}$`)}function Vt(...e){return t=>e.reduce(([e,n,r],a)=>{const[i,s,o]=a(t,r);return[{...e,...i},s||n,o]},[{},null,1]).slice(0,2)}function jt(e,...t){if(null==e)return[null,null];for(const[n,r]of t){const t=n.exec(e);if(t)return r(t)}return[null,null]}function Yt(...e){return(t,n)=>{const r={};let a;for(a=0;a<e.length;a++)r[e[a]]=it(t[n+a]);return[r,null,n+a]}}const Ut=/(?:([Zz])|([+-]\d\d)(?::?(\d\d))?)/,Zt=/(\d\d)(?::?(\d\d)(?::?(\d\d)(?:[.,](\d{1,30}))?)?)?/,Ht=RegExp(`${Zt.source}${`(?:${Ut.source}?(?:\\[(${Wt.source})\\])?)?`}`),qt=RegExp(`(?:[Tt]${Ht.source})?`),Pt=Yt("weekYear","weekNumber","weekDay"),Bt=Yt("year","ordinal"),Gt=RegExp(`${Zt.source} ?(?:${Ut.source}|(${Wt.source}))?`),Kt=RegExp(`(?: ${Gt.source})?`);function Jt(e,t,n){const r=e[t];return Ge(r)?n:it(r)}function Qt(e,t){return[{hours:Jt(e,t,0),minutes:Jt(e,t+1,0),seconds:Jt(e,t+2,0),milliseconds:ot(e[t+3])},null,t+4]}function Xt(e,t){const n=!e[t]&&!e[t+1],r=gt(e[t+1],e[t+2]);return[{},n?null:ge.instance(r),t+3]}function en(e,t){return[{},e[t]?ee.create(e[t]):null,t+1]}const tn=RegExp(`^T?${Zt.source}$`),nn=/^-?P(?:(?:(-?\d{1,20}(?:\.\d{1,20})?)Y)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20}(?:\.\d{1,20})?)W)?(?:(-?\d{1,20}(?:\.\d{1,20})?)D)?(?:T(?:(-?\d{1,20}(?:\.\d{1,20})?)H)?(?:(-?\d{1,20}(?:\.\d{1,20})?)M)?(?:(-?\d{1,20})(?:[.,](-?\d{1,20}))?S)?)?)$/;function rn(e){const[t,n,r,a,i,s,o,l,c]=e,d="-"===t[0],u=l&&"-"===l[0],h=(e,t=!1)=>void 0!==e&&(t||e&&d)?-e:e;return[{years:h(st(n)),months:h(st(r)),weeks:h(st(a)),days:h(st(i)),hours:h(st(s)),minutes:h(st(o)),seconds:h(st(l),"-0"===l),milliseconds:h(ot(c),u)}]}const an={GMT:0,EDT:-240,EST:-300,CDT:-300,CST:-360,MDT:-360,MST:-420,PDT:-420,PST:-480};function sn(e,t,n,r,a,i,s){const o={year:2===t.length?yt(it(t)):it(t),month:St.indexOf(n)+1,day:it(r),hour:it(a),minute:it(i)};return s&&(o.second=it(s)),e&&(o.weekday=e.length>3?Et.indexOf(e)+1:Mt.indexOf(e)+1),o}const on=/^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|(?:([+-]\d\d)(\d\d)))$/;function ln(e){const[,t,n,r,a,i,s,o,l,c,d,u]=e,h=sn(t,a,r,n,i,s,o);let m;return m=l?an[l]:c?0:gt(d,u),[h,new ge(m)]}const cn=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), (\d\d) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d\d):(\d\d):(\d\d) GMT$/,dn=/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (\d\d)-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d\d) (\d\d):(\d\d):(\d\d) GMT$/,un=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ( \d|\d\d) (\d\d):(\d\d):(\d\d) (\d{4})$/;function hn(e){const[,t,n,r,a,i,s,o]=e;return[sn(t,a,r,n,i,s,o),ge.utcInstance]}function mn(e){const[,t,n,r,a,i,s,o]=e;return[sn(t,o,n,r,a,i,s),ge.utcInstance]}const fn=Ft(/([+-]\d{6}|\d{4})(?:-?(\d\d)(?:-?(\d\d))?)?/,qt),yn=Ft(/(\d{4})-?W(\d\d)(?:-?(\d))?/,qt),pn=Ft(/(\d{4})-?(\d{3})/,qt),gn=Ft(Ht),bn=Vt(function(e,t){return[{year:Jt(e,t),month:Jt(e,t+1,1),day:Jt(e,t+2,1)},null,t+3]},Qt,Xt,en),vn=Vt(Pt,Qt,Xt,en),wn=Vt(Bt,Qt,Xt,en),kn=Vt(Qt,Xt,en);const Dn=Vt(Qt);const Sn=Ft(/(\d{4})-(\d\d)-(\d\d)/,Kt),xn=Ft(Gt),Tn=Vt(Qt,Xt,en);const En="Invalid Duration",Mn={weeks:{days:7,hours:168,minutes:10080,seconds:604800,milliseconds:6048e5},days:{hours:24,minutes:1440,seconds:86400,milliseconds:864e5},hours:{minutes:60,seconds:3600,milliseconds:36e5},minutes:{seconds:60,milliseconds:6e4},seconds:{milliseconds:1e3}},On={years:{quarters:4,months:12,weeks:52,days:365,hours:8760,minutes:525600,seconds:31536e3,milliseconds:31536e6},quarters:{months:3,weeks:13,days:91,hours:2184,minutes:131040,seconds:7862400,milliseconds:78624e5},months:{weeks:4,days:30,hours:720,minutes:43200,seconds:2592e3,milliseconds:2592e6},...Mn},$n=365.2425,Nn=30.436875,Cn={years:{quarters:4,months:12,weeks:52.1775,days:$n,hours:8765.82,minutes:525949.2,seconds:525949.2*60,milliseconds:525949.2*60*1e3},quarters:{months:3,weeks:13.044375,days:91.310625,hours:2191.455,minutes:131487.3,seconds:525949.2*60/4,milliseconds:7889237999.999999},months:{weeks:4.3481250000000005,days:Nn,hours:730.485,minutes:43829.1,seconds:2629746,milliseconds:2629746e3},...Mn},In=["years","quarters","months","weeks","days","hours","minutes","seconds","milliseconds"],_n=In.slice(0).reverse();function An(e,t,n=!1){const r={values:n?t.values:{...e.values,...t.values||{}},loc:e.loc.clone(t.loc),conversionAccuracy:t.conversionAccuracy||e.conversionAccuracy,matrix:t.matrix||e.matrix};return new Wn(r)}function Rn(e,t){let n=t.milliseconds??0;for(const r of _n.slice(1))t[r]&&(n+=t[r]*e[r].milliseconds);return n}function Ln(e,t){const n=Rn(e,t)<0?-1:1;In.reduceRight((r,a)=>{if(Ge(t[a]))return r;if(r){const i=t[r]*n,s=e[a][r],o=Math.floor(i/s);t[a]+=o*n,t[r]-=o*s*n}return a},null),In.reduce((n,r)=>{if(Ge(t[r]))return n;if(n){const a=t[n]%1;t[n]-=a,t[r]+=a*e[n][r]}return r},null)}function zn(e){const t={};for(const[n,r]of Object.entries(e))0!==r&&(t[n]=r);return t}class Wn{constructor(e){const t="longterm"===e.conversionAccuracy||!1;let n=t?Cn:On;e.matrix&&(n=e.matrix),this.values=e.values,this.loc=e.loc||ye.create(),this.conversionAccuracy=t?"longterm":"casual",this.invalid=e.invalid||null,this.matrix=n,this.isLuxonDuration=!0}static fromMillis(e,t){return Wn.fromObject({milliseconds:e},t)}static fromObject(e,t={}){if(null==e||"object"!=typeof e)throw new k("Duration.fromObject: argument expected to be an object, got "+(null===e?"null":typeof e));return new Wn({values:vt(e,Wn.normalizeUnit),loc:ye.fromObject(t),conversionAccuracy:t.conversionAccuracy,matrix:t.matrix})}static fromDurationLike(e){if(Ke(e))return Wn.fromMillis(e);if(Wn.isDuration(e))return e;if("object"==typeof e)return Wn.fromObject(e);throw new k(`Unknown duration argument ${e} of type ${typeof e}`)}static fromISO(e,t){const[n]=jt(e,[nn,rn]);return n?Wn.fromObject(n,t):Wn.invalid("unparsable",`the input "${e}" can't be parsed as ISO 8601`)}static fromISOTime(e,t){const[n]=jt(e,[tn,Dn]);return n?Wn.fromObject(n,t):Wn.invalid("unparsable",`the input "${e}" can't be parsed as ISO 8601`)}static invalid(e,t=null){if(!e)throw new k("need to specify a reason the Duration is invalid");const n=e instanceof Ae?e:new Ae(e,t);if(_e.throwOnInvalid)throw new b(n);return new Wn({invalid:n})}static normalizeUnit(e){const t={year:"years",years:"years",quarter:"quarters",quarters:"quarters",month:"months",months:"months",week:"weeks",weeks:"weeks",day:"days",days:"days",hour:"hours",hours:"hours",minute:"minutes",minutes:"minutes",second:"seconds",seconds:"seconds",millisecond:"milliseconds",milliseconds:"milliseconds"}[e?e.toLowerCase():e];if(!t)throw new w(e);return t}static isDuration(e){return e&&e.isLuxonDuration||!1}get locale(){return this.isValid?this.loc.locale:null}get numberingSystem(){return this.isValid?this.loc.numberingSystem:null}toFormat(e,t={}){const n={...t,floor:!1!==t.round&&!1!==t.floor};return this.isValid?zt.create(this.loc,n).formatDurationFromString(this,e):En}toHuman(e={}){if(!this.isValid)return En;const t=!1!==e.showZeros,n=In.map(n=>{const r=this.values[n];return Ge(r)||0===r&&!t?null:this.loc.numberFormatter({style:"unit",unitDisplay:"long",...e,unit:n.slice(0,-1)}).format(r)}).filter(e=>e);return this.loc.listFormatter({type:"conjunction",style:e.listStyle||"narrow",...e}).format(n)}toObject(){return this.isValid?{...this.values}:{}}toISO(){if(!this.isValid)return null;let e="P";return 0!==this.years&&(e+=this.years+"Y"),0===this.months&&0===this.quarters||(e+=this.months+3*this.quarters+"M"),0!==this.weeks&&(e+=this.weeks+"W"),0!==this.days&&(e+=this.days+"D"),0===this.hours&&0===this.minutes&&0===this.seconds&&0===this.milliseconds||(e+="T"),0!==this.hours&&(e+=this.hours+"H"),0!==this.minutes&&(e+=this.minutes+"M"),0===this.seconds&&0===this.milliseconds||(e+=lt(this.seconds+this.milliseconds/1e3,3)+"S"),"P"===e&&(e+="T0S"),e}toISOTime(e={}){if(!this.isValid)return null;const t=this.toMillis();if(t<0||t>=864e5)return null;e={suppressMilliseconds:!1,suppressSeconds:!1,includePrefix:!1,format:"extended",...e,includeOffset:!1};return Cr.fromMillis(t,{zone:"UTC"}).toISOTime(e)}toJSON(){return this.toISO()}toString(){return this.toISO()}[/* @__PURE__ */Symbol.for("nodejs.util.inspect.custom")](){return this.isValid?`Duration { values: ${JSON.stringify(this.values)} }`:`Duration { Invalid, reason: ${this.invalidReason} }`}toMillis(){return this.isValid?Rn(this.matrix,this.values):NaN}valueOf(){return this.toMillis()}plus(e){if(!this.isValid)return this;const t=Wn.fromDurationLike(e),n={};for(const r of In)(tt(t.values,r)||tt(this.values,r))&&(n[r]=t.get(r)+this.get(r));return An(this,{values:n},!0)}minus(e){if(!this.isValid)return this;const t=Wn.fromDurationLike(e);return this.plus(t.negate())}mapUnits(e){if(!this.isValid)return this;const t={};for(const n of Object.keys(this.values))t[n]=bt(e(this.values[n],n));return An(this,{values:t},!0)}get(e){return this[Wn.normalizeUnit(e)]}set(e){if(!this.isValid)return this;return An(this,{values:{...this.values,...vt(e,Wn.normalizeUnit)}})}reconfigure({locale:e,numberingSystem:t,conversionAccuracy:n,matrix:r}={}){return An(this,{loc:this.loc.clone({locale:e,numberingSystem:t}),matrix:r,conversionAccuracy:n})}as(e){return this.isValid?this.shiftTo(e).get(e):NaN}normalize(){if(!this.isValid)return this;const e=this.toObject();return Ln(this.matrix,e),An(this,{values:e},!0)}rescale(){if(!this.isValid)return this;return An(this,{values:zn(this.normalize().shiftToAll().toObject())},!0)}shiftTo(...e){if(!this.isValid)return this;if(0===e.length)return this;e=e.map(e=>Wn.normalizeUnit(e));const t={},n={},r=this.toObject();let a;for(const i of In)if(e.indexOf(i)>=0){a=i;let e=0;for(const t in n)e+=this.matrix[t][i]*n[t],n[t]=0;Ke(r[i])&&(e+=r[i]);const s=Math.trunc(e);t[i]=s,n[i]=(1e3*e-1e3*s)/1e3}else Ke(r[i])&&(n[i]=r[i]);for(const i in n)0!==n[i]&&(t[a]+=i===a?n[i]:n[i]/this.matrix[a][i]);return Ln(this.matrix,t),An(this,{values:t},!0)}shiftToAll(){return this.isValid?this.shiftTo("years","months","weeks","days","hours","minutes","seconds","milliseconds"):this}negate(){if(!this.isValid)return this;const e={};for(const t of Object.keys(this.values))e[t]=0===this.values[t]?0:-this.values[t];return An(this,{values:e},!0)}removeZeros(){if(!this.isValid)return this;return An(this,{values:zn(this.values)},!0)}get years(){return this.isValid?this.values.years||0:NaN}get quarters(){return this.isValid?this.values.quarters||0:NaN}get months(){return this.isValid?this.values.months||0:NaN}get weeks(){return this.isValid?this.values.weeks||0:NaN}get days(){return this.isValid?this.values.days||0:NaN}get hours(){return this.isValid?this.values.hours||0:NaN}get minutes(){return this.isValid?this.values.minutes||0:NaN}get seconds(){return this.isValid?this.values.seconds||0:NaN}get milliseconds(){return this.isValid?this.values.milliseconds||0:NaN}get isValid(){return null===this.invalid}get invalidReason(){return this.invalid?this.invalid.reason:null}get invalidExplanation(){return this.invalid?this.invalid.explanation:null}equals(e){if(!this.isValid||!e.isValid)return!1;if(!this.loc.equals(e.loc))return!1;function t(e,t){return void 0===e||0===e?void 0===t||0===t:e===t}for(const n of In)if(!t(this.values[n],e.values[n]))return!1;return!0}}const Fn="Invalid Interval";class Vn{constructor(e){this.s=e.start,this.e=e.end,this.invalid=e.invalid||null,this.isLuxonInterval=!0}static invalid(e,t=null){if(!e)throw new k("need to specify a reason the Interval is invalid");const n=e instanceof Ae?e:new Ae(e,t);if(_e.throwOnInvalid)throw new g(n);return new Vn({invalid:n})}static fromDateTimes(e,t){const n=Ir(e),r=Ir(t),a=function(e,t){return e&&e.isValid?t&&t.isValid?t<e?Vn.invalid("end before start",`The end of an interval must be after its start, but you had start=${e.toISO()} and end=${t.toISO()}`):null:Vn.invalid("missing or invalid end"):Vn.invalid("missing or invalid start")}(n,r);return a??new Vn({start:n,end:r})}static after(e,t){const n=Wn.fromDurationLike(t),r=Ir(e);return Vn.fromDateTimes(r,r.plus(n))}static before(e,t){const n=Wn.fromDurationLike(t),r=Ir(e);return Vn.fromDateTimes(r.minus(n),r)}static fromISO(e,t){const[n,r]=(e||"").split("/",2);if(n&&r){let e,i,s,o;try{e=Cr.fromISO(n,t),i=e.isValid}catch(a){i=!1}try{s=Cr.fromISO(r,t),o=s.isValid}catch(a){o=!1}if(i&&o)return Vn.fromDateTimes(e,s);if(i){const n=Wn.fromISO(r,t);if(n.isValid)return Vn.after(e,n)}else if(o){const e=Wn.fromISO(n,t);if(e.isValid)return Vn.before(s,e)}}return Vn.invalid("unparsable",`the input "${e}" can't be parsed as ISO 8601`)}static isInterval(e){return e&&e.isLuxonInterval||!1}get start(){return this.isValid?this.s:null}get end(){return this.isValid?this.e:null}get lastDateTime(){return this.isValid&&this.e?this.e.minus(1):null}get isValid(){return null===this.invalidReason}get invalidReason(){return this.invalid?this.invalid.reason:null}get invalidExplanation(){return this.invalid?this.invalid.explanation:null}length(e="milliseconds"){return this.isValid?this.toDuration(e).get(e):NaN}count(e="milliseconds",t){if(!this.isValid)return NaN;const n=this.start.startOf(e,t);let r;return r=t?.useLocaleWeeks?this.end.reconfigure({locale:n.locale}):this.end,r=r.startOf(e,t),Math.floor(r.diff(n,e).get(e))+(r.valueOf()!==this.end.valueOf())}hasSame(e){return!!this.isValid&&(this.isEmpty()||this.e.minus(1).hasSame(this.s,e))}isEmpty(){return this.s.valueOf()===this.e.valueOf()}isAfter(e){return!!this.isValid&&this.s>e}isBefore(e){return!!this.isValid&&this.e<=e}contains(e){return!!this.isValid&&(this.s<=e&&this.e>e)}set({start:e,end:t}={}){return this.isValid?Vn.fromDateTimes(e||this.s,t||this.e):this}splitAt(...e){if(!this.isValid)return[];const t=e.map(Ir).filter(e=>this.contains(e)).sort((e,t)=>e.toMillis()-t.toMillis()),n=[];let{s:r}=this,a=0;for(;r<this.e;){const e=t[a]||this.e,i=+e>+this.e?this.e:e;n.push(Vn.fromDateTimes(r,i)),r=i,a+=1}return n}splitBy(e){const t=Wn.fromDurationLike(e);if(!this.isValid||!t.isValid||0===t.as("milliseconds"))return[];let n,{s:r}=this,a=1;const i=[];for(;r<this.e;){const e=this.start.plus(t.mapUnits(e=>e*a));n=+e>+this.e?this.e:e,i.push(Vn.fromDateTimes(r,n)),r=n,a+=1}return i}divideEqually(e){return this.isValid?this.splitBy(this.length()/e).slice(0,e):[]}overlaps(e){return this.e>e.s&&this.s<e.e}abutsStart(e){return!!this.isValid&&+this.e===+e.s}abutsEnd(e){return!!this.isValid&&+e.e===+this.s}engulfs(e){return!!this.isValid&&(this.s<=e.s&&this.e>=e.e)}equals(e){return!(!this.isValid||!e.isValid)&&(this.s.equals(e.s)&&this.e.equals(e.e))}intersection(e){if(!this.isValid)return this;const t=this.s>e.s?this.s:e.s,n=this.e<e.e?this.e:e.e;return t>=n?null:Vn.fromDateTimes(t,n)}union(e){if(!this.isValid)return this;const t=this.s<e.s?this.s:e.s,n=this.e>e.e?this.e:e.e;return Vn.fromDateTimes(t,n)}static merge(e){const[t,n]=e.sort((e,t)=>e.s-t.s).reduce(([e,t],n)=>t?t.overlaps(n)||t.abutsStart(n)?[e,t.union(n)]:[e.concat([t]),n]:[e,n],[[],null]);return n&&t.push(n),t}static xor(e){let t=null,n=0;const r=[],a=e.map(e=>[{time:e.s,type:"s"},{time:e.e,type:"e"}]),i=Array.prototype.concat(...a).sort((e,t)=>e.time-t.time);for(const s of i)n+="s"===s.type?1:-1,1===n?t=s.time:(t&&+t!==+s.time&&r.push(Vn.fromDateTimes(t,s.time)),t=null);return Vn.merge(r)}difference(...e){return Vn.xor([this].concat(e)).map(e=>this.intersection(e)).filter(e=>e&&!e.isEmpty())}toString(){return this.isValid?`[${this.s.toISO()} – ${this.e.toISO()})`:Fn}[/* @__PURE__ */Symbol.for("nodejs.util.inspect.custom")](){return this.isValid?`Interval { start: ${this.s.toISO()}, end: ${this.e.toISO()} }`:`Interval { Invalid, reason: ${this.invalidReason} }`}toLocaleString(e=E,t={}){return this.isValid?zt.create(this.s.loc.clone(t),e).formatInterval(this):Fn}toISO(e){return this.isValid?`${this.s.toISO(e)}/${this.e.toISO(e)}`:Fn}toISODate(){return this.isValid?`${this.s.toISODate()}/${this.e.toISODate()}`:Fn}toISOTime(e){return this.isValid?`${this.s.toISOTime(e)}/${this.e.toISOTime(e)}`:Fn}toFormat(e,{separator:t=" – "}={}){return this.isValid?`${this.s.toFormat(e)}${t}${this.e.toFormat(e)}`:Fn}toDuration(e,t){return this.isValid?this.e.diff(this.s,e,t):Wn.invalid(this.invalidReason)}mapEndpoints(e){return Vn.fromDateTimes(e(this.s),e(this.e))}}class jn{static hasDST(e=_e.defaultZone){const t=Cr.now().setZone(e).set({month:12});return!e.isUniversal&&t.offset!==t.set({month:6}).offset}static isValidIANAZone(e){return ee.isValidZone(e)}static normalizeZone(e){return ve(e,_e.defaultZone)}static getStartOfWeek({locale:e=null,locObj:t=null}={}){return(t||ye.create(e)).getStartOfWeek()}static getMinimumDaysInFirstWeek({locale:e=null,locObj:t=null}={}){return(t||ye.create(e)).getMinDaysInFirstWeek()}static getWeekendWeekdays({locale:e=null,locObj:t=null}={}){return(t||ye.create(e)).getWeekendDays().slice()}static months(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null,outputCalendar:a="gregory"}={}){return(r||ye.create(t,n,a)).months(e)}static monthsFormat(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null,outputCalendar:a="gregory"}={}){return(r||ye.create(t,n,a)).months(e,!0)}static weekdays(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null}={}){return(r||ye.create(t,n,null)).weekdays(e)}static weekdaysFormat(e="long",{locale:t=null,numberingSystem:n=null,locObj:r=null}={}){return(r||ye.create(t,n,null)).weekdays(e,!0)}static meridiems({locale:e=null}={}){return ye.create(e).meridiems()}static eras(e="short",{locale:t=null}={}){return ye.create(t,null,"gregory").eras(e)}static features(){return{relative:Qe(),localeWeek:Xe()}}}function Yn(e,t){const n=e=>e.toUTC(0,{keepLocalTime:!0}).startOf("day").valueOf(),r=n(t)-n(e);return Math.floor(Wn.fromMillis(r).as("days"))}function Un(e,t,n,r){let[a,i,s,o]=function(e,t,n){const r=[["years",(e,t)=>t.year-e.year],["quarters",(e,t)=>t.quarter-e.quarter+4*(t.year-e.year)],["months",(e,t)=>t.month-e.month+12*(t.year-e.year)],["weeks",(e,t)=>{const n=Yn(e,t);return(n-n%7)/7}],["days",Yn]],a={},i=e;let s,o;for(const[l,c]of r)n.indexOf(l)>=0&&(s=l,a[l]=c(e,t),o=i.plus(a),o>t?(a[l]--,(e=i.plus(a))>t&&(o=e,a[l]--,e=i.plus(a))):e=o);return[e,a,o,s]}(e,t,n);const l=t-a,c=n.filter(e=>["hours","minutes","seconds","milliseconds"].indexOf(e)>=0);0===c.length&&(s<t&&(s=a.plus({[o]:1})),s!==a&&(i[o]=(i[o]||0)+l/(s-a)));const d=Wn.fromObject(i,r);return c.length>0?Wn.fromMillis(l,r).shiftTo(...c).plus(d):d}function Zn(e,t=e=>e){return{regex:e,deser:([e])=>t(function(e){let t=parseInt(e,10);if(isNaN(t)){t="";for(let n=0;n<e.length;n++){const r=e.charCodeAt(n);if(-1!==e[n].search(we.hanidec))t+=De.indexOf(e[n]);else for(const e in ke){const[n,a]=ke[e];r>=n&&r<=a&&(t+=r-n)}}return parseInt(t,10)}return t}(e))}}const Hn=`[ ${String.fromCharCode(160)}]`,qn=new RegExp(Hn,"g");function Pn(e){return e.replace(/\./g,"\\.?").replace(qn,Hn)}function Bn(e){return e.replace(/\./g,"").replace(qn," ").toLowerCase()}function Gn(e,t){return null===e?null:{regex:RegExp(e.map(Pn).join("|")),deser:([n])=>e.findIndex(e=>Bn(n)===Bn(e))+t}}function Kn(e,t){return{regex:e,deser:([,e,t])=>gt(e,t),groups:t}}function Jn(e){return{regex:e,deser:([e])=>e}}const Qn={year:{"2-digit":"yy",numeric:"yyyyy"},month:{numeric:"M","2-digit":"MM",short:"MMM",long:"MMMM"},day:{numeric:"d","2-digit":"dd"},weekday:{short:"EEE",long:"EEEE"},dayperiod:"a",dayPeriod:"a",hour12:{numeric:"h","2-digit":"hh"},hour24:{numeric:"H","2-digit":"HH"},minute:{numeric:"m","2-digit":"mm"},second:{numeric:"s","2-digit":"ss"},timeZoneName:{long:"ZZZZZ",short:"ZZZ"}};let Xn=null;function er(e,t){return Array.prototype.concat(...e.map(e=>function(e,t){if(e.literal)return e;const n=rr(zt.macroTokenToFormatOpts(e.val),t);return null==n||n.includes(void 0)?e:n}(e,t)))}class tr{constructor(e,t){if(this.locale=e,this.format=t,this.tokens=er(zt.parseFormat(t),e),this.units=this.tokens.map(t=>function(e,t){const n=xe(t),r=xe(t,"{2}"),a=xe(t,"{3}"),i=xe(t,"{4}"),s=xe(t,"{6}"),o=xe(t,"{1,2}"),l=xe(t,"{1,3}"),c=xe(t,"{1,6}"),d=xe(t,"{1,9}"),u=xe(t,"{2,4}"),h=xe(t,"{4,6}"),m=e=>{return{regex:RegExp((t=e.val,t.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&"))),deser:([e])=>e,literal:!0};var t},f=(f=>{if(e.literal)return m(f);switch(f.val){case"G":return Gn(t.eras("short"),0);case"GG":return Gn(t.eras("long"),0);case"y":return Zn(c);case"yy":case"kk":return Zn(u,yt);case"yyyy":case"kkkk":return Zn(i);case"yyyyy":return Zn(h);case"yyyyyy":return Zn(s);case"M":case"L":case"d":case"H":case"h":case"m":case"q":case"s":case"W":return Zn(o);case"MM":case"LL":case"dd":case"HH":case"hh":case"mm":case"qq":case"ss":case"WW":return Zn(r);case"MMM":return Gn(t.months("short",!0),1);case"MMMM":return Gn(t.months("long",!0),1);case"LLL":return Gn(t.months("short",!1),1);case"LLLL":return Gn(t.months("long",!1),1);case"o":case"S":return Zn(l);case"ooo":case"SSS":return Zn(a);case"u":return Jn(d);case"uu":return Jn(o);case"uuu":case"E":case"c":return Zn(n);case"a":return Gn(t.meridiems(),0);case"EEE":return Gn(t.weekdays("short",!1),1);case"EEEE":return Gn(t.weekdays("long",!1),1);case"ccc":return Gn(t.weekdays("short",!0),1);case"cccc":return Gn(t.weekdays("long",!0),1);case"Z":case"ZZ":return Kn(new RegExp(`([+-]${o.source})(?::(${r.source}))?`),2);case"ZZZ":return Kn(new RegExp(`([+-]${o.source})(${r.source})?`),2);case"z":return Jn(/[a-z_+-/]{1,256}?/i);case" ":return Jn(/[^\S\n\r]/);default:return m(f)}})(e)||{invalidReason:"missing Intl.DateTimeFormat.formatToParts support"};return f.token=e,f}(t,e)),this.disqualifyingUnit=this.units.find(e=>e.invalidReason),!this.disqualifyingUnit){const[e,t]=[`^${(n=this.units).map(e=>e.regex).reduce((e,t)=>`${e}(${t.source})`,"")}$`,n];this.regex=RegExp(e,"i"),this.handlers=t}var n}explainFromTokens(e){if(this.isValid){const[t,n]=function(e,t,n){const r=e.match(t);if(r){const e={};let t=1;for(const a in n)if(tt(n,a)){const i=n[a],s=i.groups?i.groups+1:1;!i.literal&&i.token&&(e[i.token.val[0]]=i.deser(r.slice(t,t+s))),t+=s}return[r,e]}return[r,{}]}(e,this.regex,this.handlers),[r,a,i]=n?function(e){let t,n=null;return Ge(e.z)||(n=ee.create(e.z)),Ge(e.Z)||(n||(n=new ge(e.Z)),t=e.Z),Ge(e.q)||(e.M=3*(e.q-1)+1),Ge(e.h)||(e.h<12&&1===e.a?e.h+=12:12===e.h&&0===e.a&&(e.h=0)),0===e.G&&e.y&&(e.y=-e.y),Ge(e.u)||(e.S=ot(e.u)),[Object.keys(e).reduce((t,n)=>{const r=(e=>{switch(e){case"S":return"millisecond";case"s":return"second";case"m":return"minute";case"h":case"H":return"hour";case"d":return"day";case"o":return"ordinal";case"L":case"M":return"month";case"y":return"year";case"E":case"c":return"weekday";case"W":return"weekNumber";case"k":return"weekYear";case"q":return"quarter";default:return null}})(n);return r&&(t[r]=e[n]),t},{}),n,t]}(n):[null,null,void 0];if(tt(n,"a")&&tt(n,"H"))throw new v("Can't include meridiem when specifying 24-hour format");return{input:e,tokens:this.tokens,regex:this.regex,rawMatches:t,matches:n,result:r,zone:a,specificOffset:i}}return{input:e,tokens:this.tokens,invalidReason:this.invalidReason}}get isValid(){return!this.disqualifyingUnit}get invalidReason(){return this.disqualifyingUnit?this.disqualifyingUnit.invalidReason:null}}function nr(e,t,n){return new tr(e,n).explainFromTokens(t)}function rr(e,t){if(!e)return null;const n=zt.create(t,e).dtFormatter((Xn||(Xn=Cr.fromMillis(1555555555555)),Xn)),r=n.formatToParts(),a=n.resolvedOptions();return r.map(t=>function(e,t,n){const{type:r,value:a}=e;if("literal"===r){const e=/^\s+$/.test(a);return{literal:!e,val:e?" ":a}}const i=t[r];let s=r;"hour"===r&&(s=null!=t.hour12?t.hour12?"hour12":"hour24":null!=t.hourCycle?"h11"===t.hourCycle||"h12"===t.hourCycle?"hour12":"hour24":n.hour12?"hour12":"hour24");let o=Qn[s];if("object"==typeof o&&(o=o[i]),o)return{literal:!1,val:o}}(t,e,a))}const ar="Invalid DateTime",ir=864e13;function sr(e){return new Ae("unsupported zone",`the zone "${e.name}" is not supported`)}function or(e){return null===e.weekData&&(e.weekData=Ye(e.c)),e.weekData}function lr(e){return null===e.localWeekData&&(e.localWeekData=Ye(e.c,e.loc.getMinDaysInFirstWeek(),e.loc.getStartOfWeek())),e.localWeekData}function cr(e,t){const n={ts:e.ts,zone:e.zone,c:e.c,o:e.o,loc:e.loc,invalid:e.invalid};return new Cr({...n,...t,old:n})}function dr(e,t,n){let r=e-60*t*1e3;const a=n.offset(r);if(t===a)return[r,t];r-=60*(a-t)*1e3;const i=n.offset(r);return a===i?[r,a]:[e-60*Math.min(a,i)*1e3,Math.max(a,i)]}function ur(e,t){const n=new Date(e+=60*t*1e3);return{year:n.getUTCFullYear(),month:n.getUTCMonth()+1,day:n.getUTCDate(),hour:n.getUTCHours(),minute:n.getUTCMinutes(),second:n.getUTCSeconds(),millisecond:n.getUTCMilliseconds()}}function hr(e,t,n){return dr(ht(e),t,n)}function mr(e,t){const n=e.o,r=e.c.year+Math.trunc(t.years),a=e.c.month+Math.trunc(t.months)+3*Math.trunc(t.quarters),i={...e.c,year:r,month:a,day:Math.min(e.c.day,ut(r,a))+Math.trunc(t.days)+7*Math.trunc(t.weeks)},s=Wn.fromObject({years:t.years-Math.trunc(t.years),quarters:t.quarters-Math.trunc(t.quarters),months:t.months-Math.trunc(t.months),weeks:t.weeks-Math.trunc(t.weeks),days:t.days-Math.trunc(t.days),hours:t.hours,minutes:t.minutes,seconds:t.seconds,milliseconds:t.milliseconds}).as("milliseconds"),o=ht(i);let[l,c]=dr(o,n,e.zone);return 0!==s&&(l+=s,c=e.zone.offset(l)),{ts:l,o:c}}function fr(e,t,n,r,a,i){const{setZone:s,zone:o}=n;if(e&&0!==Object.keys(e).length||t){const r=t||o,a=Cr.fromObject(e,{...n,zone:r,specificOffset:i});return s?a:a.setZone(o)}return Cr.invalid(new Ae("unparsable",`the input "${a}" can't be parsed as ${r}`))}function yr(e,t,n=!0){return e.isValid?zt.create(ye.create("en-US"),{allowZ:n,forceSimple:!0}).formatDateTimeFromString(e,t):null}function pr(e,t,n){const r=e.c.year>9999||e.c.year<0;let a="";if(r&&e.c.year>=0&&(a+="+"),a+=at(e.c.year,r?6:4),"year"===n)return a;if(t){if(a+="-",a+=at(e.c.month),"month"===n)return a;a+="-"}else if(a+=at(e.c.month),"month"===n)return a;return a+=at(e.c.day),a}function gr(e,t,n,r,a,i,s){let o=!n||0!==e.c.millisecond||0!==e.c.second,l="";switch(s){case"day":case"month":case"year":break;default:if(l+=at(e.c.hour),"hour"===s)break;if(t){if(l+=":",l+=at(e.c.minute),"minute"===s)break;o&&(l+=":",l+=at(e.c.second))}else{if(l+=at(e.c.minute),"minute"===s)break;o&&(l+=at(e.c.second))}if("second"===s)break;!o||r&&0===e.c.millisecond||(l+=".",l+=at(e.c.millisecond,3))}return a&&(e.isOffsetFixed&&0===e.offset&&!i?l+="Z":e.o<0?(l+="-",l+=at(Math.trunc(-e.o/60)),l+=":",l+=at(Math.trunc(-e.o%60))):(l+="+",l+=at(Math.trunc(e.o/60)),l+=":",l+=at(Math.trunc(e.o%60)))),i&&(l+="["+e.zone.ianaName+"]"),l}const br={month:1,day:1,hour:0,minute:0,second:0,millisecond:0},vr={weekNumber:1,weekday:1,hour:0,minute:0,second:0,millisecond:0},wr={ordinal:1,hour:0,minute:0,second:0,millisecond:0},kr=["year","month","day","hour","minute","second","millisecond"],Dr=["weekYear","weekNumber","weekday","hour","minute","second","millisecond"],Sr=["year","ordinal","hour","minute","second","millisecond"];function xr(e){const t={year:"year",years:"year",month:"month",months:"month",day:"day",days:"day",hour:"hour",hours:"hour",minute:"minute",minutes:"minute",quarter:"quarter",quarters:"quarter",second:"second",seconds:"second",millisecond:"millisecond",milliseconds:"millisecond",weekday:"weekday",weekdays:"weekday",weeknumber:"weekNumber",weeksnumber:"weekNumber",weeknumbers:"weekNumber",weekyear:"weekYear",weekyears:"weekYear",ordinal:"ordinal"}[e.toLowerCase()];if(!t)throw new w(e);return t}function Tr(e){switch(e.toLowerCase()){case"localweekday":case"localweekdays":return"localWeekday";case"localweeknumber":case"localweeknumbers":return"localWeekNumber";case"localweekyear":case"localweekyears":return"localWeekYear";default:return xr(e)}}function Er(e,t){const n=ve(t.zone,_e.defaultZone);if(!n.isValid)return Cr.invalid(sr(n));const r=ye.fromObject(t);let a,i;if(Ge(e.year))a=_e.now();else{for(const n of kr)Ge(e[n])&&(e[n]=br[n]);const t=Pe(e)||Be(e);if(t)return Cr.invalid(t);const r=function(e){if(void 0===$r&&($r=_e.now()),"iana"!==e.type)return e.offset($r);const t=e.name;let n=Nr.get(t);return void 0===n&&(n=e.offset($r),Nr.set(t,n)),n}(n);[a,i]=hr(e,r,n)}return new Cr({ts:a,zone:n,loc:r,o:i})}function Mr(e,t,n){const r=!!Ge(n.round)||n.round,a=Ge(n.rounding)?"trunc":n.rounding,i=(e,i)=>{e=lt(e,r||n.calendary?0:2,n.calendary?"round":a);return t.loc.clone(n).relFormatter(n).format(e,i)},s=r=>n.calendary?t.hasSame(e,r)?0:t.startOf(r).diff(e.startOf(r),r).get(r):t.diff(e,r).get(r);if(n.unit)return i(s(n.unit),n.unit);for(const o of n.units){const e=s(o);if(Math.abs(e)>=1)return i(e,o)}return i(e>t?-0:0,n.units[n.units.length-1])}function Or(e){let t,n={};return e.length>0&&"object"==typeof e[e.length-1]?(n=e[e.length-1],t=Array.from(e).slice(0,e.length-1)):t=Array.from(e),[n,t]}let $r;const Nr=/* @__PURE__ */new Map;class Cr{constructor(e){const t=e.zone||_e.defaultZone;let n=e.invalid||(Number.isNaN(e.ts)?new Ae("invalid input"):null)||(t.isValid?null:sr(t));this.ts=Ge(e.ts)?_e.now():e.ts;let r=null,a=null;if(!n){if(e.old&&e.old.ts===this.ts&&e.old.zone.equals(t))[r,a]=[e.old.c,e.old.o];else{const i=Ke(e.o)&&!e.old?e.o:t.offset(this.ts);r=ur(this.ts,i),n=Number.isNaN(r.year)?new Ae("invalid input"):null,r=n?null:r,a=n?null:i}}this._zone=t,this.loc=e.loc||ye.create(),this.invalid=n,this.weekData=null,this.localWeekData=null,this.c=r,this.o=a,this.isLuxonDateTime=!0}static now(){return new Cr({})}static local(){const[e,t]=Or(arguments),[n,r,a,i,s,o,l]=t;return Er({year:n,month:r,day:a,hour:i,minute:s,second:o,millisecond:l},e)}static utc(){const[e,t]=Or(arguments),[n,r,a,i,s,o,l]=t;return e.zone=ge.utcInstance,Er({year:n,month:r,day:a,hour:i,minute:s,second:o,millisecond:l},e)}static fromJSDate(e,t={}){const n=(r=e,"[object Date]"===Object.prototype.toString.call(r)?e.valueOf():NaN);var r;if(Number.isNaN(n))return Cr.invalid("invalid input");const a=ve(t.zone,_e.defaultZone);return a.isValid?new Cr({ts:n,zone:a,loc:ye.fromObject(t)}):Cr.invalid(sr(a))}static fromMillis(e,t={}){if(Ke(e))return e<-ir||e>ir?Cr.invalid("Timestamp out of range"):new Cr({ts:e,zone:ve(t.zone,_e.defaultZone),loc:ye.fromObject(t)});throw new k(`fromMillis requires a numerical input, but received a ${typeof e} with value ${e}`)}static fromSeconds(e,t={}){if(Ke(e))return new Cr({ts:1e3*e,zone:ve(t.zone,_e.defaultZone),loc:ye.fromObject(t)});throw new k("fromSeconds requires a numerical input")}static fromObject(e,t={}){e=e||{};const n=ve(t.zone,_e.defaultZone);if(!n.isValid)return Cr.invalid(sr(n));const r=ye.fromObject(t),a=vt(e,Tr),{minDaysInFirstWeek:i,startOfWeek:s}=qe(a,r),o=_e.now(),l=Ge(t.specificOffset)?n.offset(o):t.specificOffset,c=!Ge(a.ordinal),d=!Ge(a.year),u=!Ge(a.month)||!Ge(a.day),h=d||u,m=a.weekYear||a.weekNumber;if((h||c)&&m)throw new v("Can't mix weekYear/weekNumber units with year/month/day or ordinals");if(u&&c)throw new v("Can't mix ordinal dates with month/day");const f=m||a.weekday&&!h;let y,p,g=ur(o,l);f?(y=Dr,p=vr,g=Ye(g,i,s)):c?(y=Sr,p=wr,g=Ze(g)):(y=kr,p=br);let b=!1;for(const v of y){Ge(a[v])?a[v]=b?p[v]:g[v]:b=!0}const w=f?function(e,t=4,n=1){const r=Je(e.weekYear),a=rt(e.weekNumber,1,ft(e.weekYear,t,n)),i=rt(e.weekday,1,7);return r?a?!i&&ze("weekday",e.weekday):ze("week",e.weekNumber):ze("weekYear",e.weekYear)}(a,i,s):c?function(e){const t=Je(e.year),n=rt(e.ordinal,1,dt(e.year));return t?!n&&ze("ordinal",e.ordinal):ze("year",e.year)}(a):Pe(a),k=w||Be(a);if(k)return Cr.invalid(k);const D=f?Ue(a,i,s):c?He(a):a,[S,x]=hr(D,l,n),T=new Cr({ts:S,zone:n,o:x,loc:r});return a.weekday&&h&&e.weekday!==T.weekday?Cr.invalid("mismatched weekday",`you can't specify both a weekday of ${a.weekday} and a date of ${T.toISO()}`):T.isValid?T:Cr.invalid(T.invalid)}static fromISO(e,t={}){const[n,r]=jt(e,[fn,bn],[yn,vn],[pn,wn],[gn,kn]);return fr(n,r,t,"ISO 8601",e)}static fromRFC2822(e,t={}){const[n,r]=jt(function(e){return e.replace(/\([^()]*\)|[\n\t]/g," ").replace(/(\s\s+)/g," ").trim()}(e),[on,ln]);return fr(n,r,t,"RFC 2822",e)}static fromHTTP(e,t={}){const[n,r]=jt(e,[cn,hn],[dn,hn],[un,mn]);return fr(n,r,t,"HTTP",t)}static fromFormat(e,t,n={}){if(Ge(e)||Ge(t))throw new k("fromFormat requires an input string and a format");const{locale:r=null,numberingSystem:a=null}=n,i=ye.fromOpts({locale:r,numberingSystem:a,defaultToEN:!0}),[s,o,l,c]=function(e,t,n){const{result:r,zone:a,specificOffset:i,invalidReason:s}=nr(e,t,n);return[r,a,i,s]}(i,e,t);return c?Cr.invalid(c):fr(s,o,n,`format ${t}`,e,l)}static fromString(e,t,n={}){return Cr.fromFormat(e,t,n)}static fromSQL(e,t={}){const[n,r]=jt(e,[Sn,bn],[xn,Tn]);return fr(n,r,t,"SQL",e)}static invalid(e,t=null){if(!e)throw new k("need to specify a reason the DateTime is invalid");const n=e instanceof Ae?e:new Ae(e,t);if(_e.throwOnInvalid)throw new p(n);return new Cr({invalid:n})}static isDateTime(e){return e&&e.isLuxonDateTime||!1}static parseFormatForOpts(e,t={}){const n=rr(e,ye.fromObject(t));return n?n.map(e=>e?e.val:null).join(""):null}static expandFormat(e,t={}){return er(zt.parseFormat(e),ye.fromObject(t)).map(e=>e.val).join("")}static resetCache(){$r=void 0,Nr.clear()}get(e){return this[e]}get isValid(){return null===this.invalid}get invalidReason(){return this.invalid?this.invalid.reason:null}get invalidExplanation(){return this.invalid?this.invalid.explanation:null}get locale(){return this.isValid?this.loc.locale:null}get numberingSystem(){return this.isValid?this.loc.numberingSystem:null}get outputCalendar(){return this.isValid?this.loc.outputCalendar:null}get zone(){return this._zone}get zoneName(){return this.isValid?this.zone.name:null}get year(){return this.isValid?this.c.year:NaN}get quarter(){return this.isValid?Math.ceil(this.c.month/3):NaN}get month(){return this.isValid?this.c.month:NaN}get day(){return this.isValid?this.c.day:NaN}get hour(){return this.isValid?this.c.hour:NaN}get minute(){return this.isValid?this.c.minute:NaN}get second(){return this.isValid?this.c.second:NaN}get millisecond(){return this.isValid?this.c.millisecond:NaN}get weekYear(){return this.isValid?or(this).weekYear:NaN}get weekNumber(){return this.isValid?or(this).weekNumber:NaN}get weekday(){return this.isValid?or(this).weekday:NaN}get isWeekend(){return this.isValid&&this.loc.getWeekendDays().includes(this.weekday)}get localWeekday(){return this.isValid?lr(this).weekday:NaN}get localWeekNumber(){return this.isValid?lr(this).weekNumber:NaN}get localWeekYear(){return this.isValid?lr(this).weekYear:NaN}get ordinal(){return this.isValid?Ze(this.c).ordinal:NaN}get monthShort(){return this.isValid?jn.months("short",{locObj:this.loc})[this.month-1]:null}get monthLong(){return this.isValid?jn.months("long",{locObj:this.loc})[this.month-1]:null}get weekdayShort(){return this.isValid?jn.weekdays("short",{locObj:this.loc})[this.weekday-1]:null}get weekdayLong(){return this.isValid?jn.weekdays("long",{locObj:this.loc})[this.weekday-1]:null}get offset(){return this.isValid?+this.o:NaN}get offsetNameShort(){return this.isValid?this.zone.offsetName(this.ts,{format:"short",locale:this.locale}):null}get offsetNameLong(){return this.isValid?this.zone.offsetName(this.ts,{format:"long",locale:this.locale}):null}get isOffsetFixed(){return this.isValid?this.zone.isUniversal:null}get isInDST(){return!this.isOffsetFixed&&(this.offset>this.set({month:1,day:1}).offset||this.offset>this.set({month:5}).offset)}getPossibleOffsets(){if(!this.isValid||this.isOffsetFixed)return[this];const e=864e5,t=6e4,n=ht(this.c),r=this.zone.offset(n-e),a=this.zone.offset(n+e),i=this.zone.offset(n-r*t),s=this.zone.offset(n-a*t);if(i===s)return[this];const o=n-i*t,l=n-s*t,c=ur(o,i),d=ur(l,s);return c.hour===d.hour&&c.minute===d.minute&&c.second===d.second&&c.millisecond===d.millisecond?[cr(this,{ts:o}),cr(this,{ts:l})]:[this]}get isInLeapYear(){return ct(this.year)}get daysInMonth(){return ut(this.year,this.month)}get daysInYear(){return this.isValid?dt(this.year):NaN}get weeksInWeekYear(){return this.isValid?ft(this.weekYear):NaN}get weeksInLocalWeekYear(){return this.isValid?ft(this.localWeekYear,this.loc.getMinDaysInFirstWeek(),this.loc.getStartOfWeek()):NaN}resolvedLocaleOptions(e={}){const{locale:t,numberingSystem:n,calendar:r}=zt.create(this.loc.clone(e),e).resolvedOptions(this);return{locale:t,numberingSystem:n,outputCalendar:r}}toUTC(e=0,t={}){return this.setZone(ge.instance(e),t)}toLocal(){return this.setZone(_e.defaultZone)}setZone(e,{keepLocalTime:t=!1,keepCalendarTime:n=!1}={}){if((e=ve(e,_e.defaultZone)).equals(this.zone))return this;if(e.isValid){let r=this.ts;if(t||n){const t=e.offset(this.ts),n=this.toObject();[r]=hr(n,t,e)}return cr(this,{ts:r,zone:e})}return Cr.invalid(sr(e))}reconfigure({locale:e,numberingSystem:t,outputCalendar:n}={}){return cr(this,{loc:this.loc.clone({locale:e,numberingSystem:t,outputCalendar:n})})}setLocale(e){return this.reconfigure({locale:e})}set(e){if(!this.isValid)return this;const t=vt(e,Tr),{minDaysInFirstWeek:n,startOfWeek:r}=qe(t,this.loc),a=!Ge(t.weekYear)||!Ge(t.weekNumber)||!Ge(t.weekday),i=!Ge(t.ordinal),s=!Ge(t.year),o=!Ge(t.month)||!Ge(t.day),l=s||o,c=t.weekYear||t.weekNumber;if((l||i)&&c)throw new v("Can't mix weekYear/weekNumber units with year/month/day or ordinals");if(o&&i)throw new v("Can't mix ordinal dates with month/day");let d;a?d=Ue({...Ye(this.c,n,r),...t},n,r):Ge(t.ordinal)?(d={...this.toObject(),...t},Ge(t.day)&&(d.day=Math.min(ut(d.year,d.month),d.day))):d=He({...Ze(this.c),...t});const[u,h]=hr(d,this.o,this.zone);return cr(this,{ts:u,o:h})}plus(e){if(!this.isValid)return this;return cr(this,mr(this,Wn.fromDurationLike(e)))}minus(e){if(!this.isValid)return this;return cr(this,mr(this,Wn.fromDurationLike(e).negate()))}startOf(e,{useLocaleWeeks:t=!1}={}){if(!this.isValid)return this;const n={},r=Wn.normalizeUnit(e);switch(r){case"years":n.month=1;case"quarters":case"months":n.day=1;case"weeks":case"days":n.hour=0;case"hours":n.minute=0;case"minutes":n.second=0;case"seconds":n.millisecond=0}if("weeks"===r)if(t){const e=this.loc.getStartOfWeek(),{weekday:t}=this;t<e&&(n.weekNumber=this.weekNumber-1),n.weekday=e}else n.weekday=1;if("quarters"===r){const e=Math.ceil(this.month/3);n.month=3*(e-1)+1}return this.set(n)}endOf(e,t){return this.isValid?this.plus({[e]:1}).startOf(e,t).minus(1):this}toFormat(e,t={}){return this.isValid?zt.create(this.loc.redefaultToEN(t)).formatDateTimeFromString(this,e):ar}toLocaleString(e=E,t={}){return this.isValid?zt.create(this.loc.clone(t),e).formatDateTime(this):ar}toLocaleParts(e={}){return this.isValid?zt.create(this.loc.clone(e),e).formatDateTimeParts(this):[]}toISO({format:e="extended",suppressSeconds:t=!1,suppressMilliseconds:n=!1,includeOffset:r=!0,extendedZone:a=!1,precision:i="milliseconds"}={}){if(!this.isValid)return null;const s="extended"===e;let o=pr(this,s,i=xr(i));return kr.indexOf(i)>=3&&(o+="T"),o+=gr(this,s,t,n,r,a,i),o}toISODate({format:e="extended",precision:t="day"}={}){return this.isValid?pr(this,"extended"===e,xr(t)):null}toISOWeekDate(){return yr(this,"kkkk-'W'WW-c")}toISOTime({suppressMilliseconds:e=!1,suppressSeconds:t=!1,includeOffset:n=!0,includePrefix:r=!1,extendedZone:a=!1,format:i="extended",precision:s="milliseconds"}={}){if(!this.isValid)return null;return s=xr(s),(r&&kr.indexOf(s)>=3?"T":"")+gr(this,"extended"===i,t,e,n,a,s)}toRFC2822(){return yr(this,"EEE, dd LLL yyyy HH:mm:ss ZZZ",!1)}toHTTP(){return yr(this.toUTC(),"EEE, dd LLL yyyy HH:mm:ss 'GMT'")}toSQLDate(){return this.isValid?pr(this,!0):null}toSQLTime({includeOffset:e=!0,includeZone:t=!1,includeOffsetSpace:n=!0}={}){let r="HH:mm:ss.SSS";return(t||e)&&(n&&(r+=" "),t?r+="z":e&&(r+="ZZ")),yr(this,r,!0)}toSQL(e={}){return this.isValid?`${this.toSQLDate()} ${this.toSQLTime(e)}`:null}toString(){return this.isValid?this.toISO():ar}[/* @__PURE__ */Symbol.for("nodejs.util.inspect.custom")](){return this.isValid?`DateTime { ts: ${this.toISO()}, zone: ${this.zone.name}, locale: ${this.locale} }`:`DateTime { Invalid, reason: ${this.invalidReason} }`}valueOf(){return this.toMillis()}toMillis(){return this.isValid?this.ts:NaN}toSeconds(){return this.isValid?this.ts/1e3:NaN}toUnixInteger(){return this.isValid?Math.floor(this.ts/1e3):NaN}toJSON(){return this.toISO()}toBSON(){return this.toJSDate()}toObject(e={}){if(!this.isValid)return{};const t={...this.c};return e.includeConfig&&(t.outputCalendar=this.outputCalendar,t.numberingSystem=this.loc.numberingSystem,t.locale=this.loc.locale),t}toJSDate(){return new Date(this.isValid?this.ts:NaN)}diff(e,t="milliseconds",n={}){if(!this.isValid||!e.isValid)return Wn.invalid("created by diffing an invalid DateTime");const r={locale:this.locale,numberingSystem:this.numberingSystem,...n},a=(o=t,Array.isArray(o)?o:[o]).map(Wn.normalizeUnit),i=e.valueOf()>this.valueOf(),s=Un(i?this:e,i?e:this,a,r);var o;return i?s.negate():s}diffNow(e="milliseconds",t={}){return this.diff(Cr.now(),e,t)}until(e){return this.isValid?Vn.fromDateTimes(this,e):this}hasSame(e,t,n){if(!this.isValid)return!1;const r=e.valueOf(),a=this.setZone(e.zone,{keepLocalTime:!0});return a.startOf(t,n)<=r&&r<=a.endOf(t,n)}equals(e){return this.isValid&&e.isValid&&this.valueOf()===e.valueOf()&&this.zone.equals(e.zone)&&this.loc.equals(e.loc)}toRelative(e={}){if(!this.isValid)return null;const t=e.base||Cr.fromObject({},{zone:this.zone}),n=e.padding?this<t?-e.padding:e.padding:0;let r=["years","months","days","hours","minutes","seconds"],a=e.unit;return Array.isArray(e.unit)&&(r=e.unit,a=void 0),Mr(t,this.plus(n),{...e,numeric:"always",units:r,unit:a})}toRelativeCalendar(e={}){return this.isValid?Mr(e.base||Cr.fromObject({},{zone:this.zone}),this,{...e,numeric:"auto",units:["years","months","days"],calendary:!0}):null}static min(...e){if(!e.every(Cr.isDateTime))throw new k("min requires all arguments be DateTimes");return et(e,e=>e.valueOf(),Math.min)}static max(...e){if(!e.every(Cr.isDateTime))throw new k("max requires all arguments be DateTimes");return et(e,e=>e.valueOf(),Math.max)}static fromFormatExplain(e,t,n={}){const{locale:r=null,numberingSystem:a=null}=n;return nr(ye.fromOpts({locale:r,numberingSystem:a,defaultToEN:!0}),e,t)}static fromStringExplain(e,t,n={}){return Cr.fromFormatExplain(e,t,n)}static buildFormatParser(e,t={}){const{locale:n=null,numberingSystem:r=null}=t,a=ye.fromOpts({locale:n,numberingSystem:r,defaultToEN:!0});return new tr(a,e)}static fromFormatParser(e,t,n={}){if(Ge(e)||Ge(t))throw new k("fromFormatParser requires an input string and a format parser");const{locale:r=null,numberingSystem:a=null}=n,i=ye.fromOpts({locale:r,numberingSystem:a,defaultToEN:!0});if(!i.equals(t.locale))throw new k(`fromFormatParser called with a locale of ${i}, but the format parser was created for ${t.locale}`);const{result:s,zone:o,specificOffset:l,invalidReason:c}=t.explainFromTokens(e);return c?Cr.invalid(c):fr(s,o,n,`format ${t.format}`,e,l)}static get DATE_SHORT(){return E}static get DATE_MED(){return M}static get DATE_MED_WITH_WEEKDAY(){return O}static get DATE_FULL(){return $}static get DATE_HUGE(){return N}static get TIME_SIMPLE(){return C}static get TIME_WITH_SECONDS(){return I}static get TIME_WITH_SHORT_OFFSET(){return _}static get TIME_WITH_LONG_OFFSET(){return A}static get TIME_24_SIMPLE(){return R}static get TIME_24_WITH_SECONDS(){return L}static get TIME_24_WITH_SHORT_OFFSET(){return z}static get TIME_24_WITH_LONG_OFFSET(){return W}static get DATETIME_SHORT(){return F}static get DATETIME_SHORT_WITH_SECONDS(){return V}static get DATETIME_MED(){return j}static get DATETIME_MED_WITH_SECONDS(){return Y}static get DATETIME_MED_WITH_WEEKDAY(){return U}static get DATETIME_FULL(){return Z}static get DATETIME_FULL_WITH_SECONDS(){return H}static get DATETIME_HUGE(){return q}static get DATETIME_HUGE_WITH_SECONDS(){return P}}function Ir(e){if(Cr.isDateTime(e))return e;if(e&&e.valueOf&&Ke(e.valueOf()))return Cr.fromJSDate(e);if(e&&"object"==typeof e)return Cr.fromObject(e);throw new k(`Unknown datetime argument: ${e}, of type ${typeof e}`)}function _r(e,t,n){let r=e.length-t.length;if(0===r)return e(...t);if(1===r)return function(e,t,n){let r=n=>e(n,...t);return void 0===n?r:Object.assign(r,{lazy:n,lazyArgs:t})}(e,t,n);throw Error("Wrong number of arguments")}const Ar={done:!1,hasNext:!1};function Rr(e,...t){let n=e,r=t.map(e=>"lazy"in e?function(e){let{lazy:t,lazyArgs:n}=e,r=t(...n);return Object.assign(r,{isSingle:t.single??!1,index:0,items:[]})}(e):void 0),a=0;for(;a<t.length;){if(void 0===r[a]||!zr(n)){n=(0,t[a])(n),a+=1;continue}let e=[];for(let n=a;n<t.length;n++){let t=r[n];if(void 0===t||(e.push(t),t.isSingle))break}let i=[];for(let t of n)if(Lr(t,i,e))break;let{isSingle:s}=e.at(-1);n=s?i[0]:i,a+=e.length}return n}function Lr(e,t,n){if(0===n.length)return t.push(e),!1;let r=e,a=Ar,i=!1;for(let[s,o]of n.entries()){let{index:e,items:l}=o;if(l.push(r),a=o(r,e,l),o.index+=1,a.hasNext){if(a.hasMany){for(let e of a.next)if(Lr(e,t,n.slice(s+1)))return!0;return i}r=a.next}if(!a.hasNext)break;a.done&&(i=!0)}return a.hasNext&&t.push(r),i}function zr(e){return"string"==typeof e||"object"==typeof e&&!!e&&Symbol.iterator in e}const Wr={asc:(e,t)=>e>t,desc:(e,t)=>e<t};function Fr(e,t){let[n,...r]=t;if(!function(e){if(jr(e))return!0;if("object"!=typeof e||!Array.isArray(e))return!1;let[t,n,...r]=e;return jr(t)&&"string"==typeof n&&n in Wr&&0===r.length}(n))return e(n,Vr(...r));let a=Vr(n,...r);return t=>e(t,a)}function Vr(e,t,...n){let r="function"==typeof e?e:e[0],a="function"==typeof e?"asc":e[1],{[a]:i}=Wr,s=void 0===t?void 0:Vr(t,...n);return(e,t)=>{let n=r(e),a=r(t);return i(n,a)?1:i(a,n)?-1:s?.(e,t)??0}}const jr=e=>"function"==typeof e&&1===e.length;function Yr(...e){return _r(Ur,e,Zr)}const Ur=(e,t)=>e.filter(t),Zr=e=>(t,n,r)=>e(t,n,r)?{done:!1,hasNext:!0,next:t}:Ar;function Hr(...e){return _r(qr,e,Pr)}const qr=(e,t)=>e.flatMap(t),Pr=e=>(t,n,r)=>{let a=e(t,n,r);return Array.isArray(a)?{done:!1,hasNext:!0,hasMany:!0,next:a}:{done:!1,hasNext:!0,next:a}};const Br=(e,t)=>{let n=/* @__PURE__ */Object.create(null);for(let r=0;r<e.length;r++){let a=e[r],i=t(a,r,e);if(void 0!==i){let e=n[i];void 0===e?n[i]=[a]:e.push(a)}}return Object.setPrototypeOf(n,Object.prototype),n};function Gr(e,t){if(e===t||Object.is(e,t))return!0;if("object"!=typeof e||"object"!=typeof t||null===e||null===t||Object.getPrototypeOf(e)!==Object.getPrototypeOf(t))return!1;if(Array.isArray(e))return function(e,t){if(e.length!==t.length)return!1;for(let[n,r]of e.entries())if(!Gr(r,t[n]))return!1;return!0}(e,t);if(e instanceof Map)return function(e,t){if(e.size!==t.size)return!1;for(let[n,r]of e.entries())if(!t.has(n)||!Gr(r,t.get(n)))return!1;return!0}(e,t);if(e instanceof Set)return function(e,t){if(e.size!==t.size)return!1;let n=[...t];for(let r of e){let e=!1;for(let[t,a]of n.entries())if(Gr(r,a)){e=!0,n.splice(t,1);break}if(!e)return!1}return!0}(e,t);if(e instanceof Date)return e.getTime()===t.getTime();if(e instanceof RegExp)return e.toString()===t.toString();if(Object.keys(e).length!==Object.keys(t).length)return!1;for(let[n,r]of Object.entries(e))if(!(n in t)||!Gr(r,t[n]))return!1;return!0}function Kr(...e){return _r(Jr,e,Qr)}const Jr=(e,t)=>e.map(t),Qr=e=>(t,n,r)=>({done:!1,hasNext:!0,next:e(t,n,r)});function Xr(...e){return _r(ea,e)}const ea=(e,t)=>({...e,...t});const ta=(e,t,n)=>e.reduce(t,n);function na(e,t){let n=[...e];return n.sort(t),n}const ra=(e,t)=>[...e].sort(t),aa=/* @__PURE__ */Symbol.for("@ts-pattern/matcher"),ia=/* @__PURE__ */Symbol.for("@ts-pattern/isVariadic"),sa="@ts-pattern/anonymous-select-key",oa=e=>Boolean(e&&"object"==typeof e),la=e=>e&&!!e[aa],ca=(e,t,n)=>{if(la(e)){const r=e[aa](),{matched:a,selections:i}=r.match(t);return a&&i&&Object.keys(i).forEach(e=>n(e,i[e])),a}if(oa(e)){if(!oa(t))return!1;if(Array.isArray(e)){if(!Array.isArray(t))return!1;let r=[],a=[],i=[];for(const t of e.keys()){const n=e[t];la(n)&&n[ia]?i.push(n):i.length?a.push(n):r.push(n)}if(i.length){if(i.length>1)throw new Error("Pattern error: Using `...P.array(...)` several times in a single pattern is not allowed.");if(t.length<r.length+a.length)return!1;const e=t.slice(0,r.length),s=0===a.length?[]:t.slice(-a.length),o=t.slice(r.length,0===a.length?1/0:-a.length);return r.every((t,r)=>ca(t,e[r],n))&&a.every((e,t)=>ca(e,s[t],n))&&(0===i.length||ca(i[0],o,n))}return e.length===t.length&&e.every((e,r)=>ca(e,t[r],n))}return Reflect.ownKeys(e).every(r=>{const a=e[r];return(r in t||la(i=a)&&"optional"===i[aa]().matcherType)&&ca(a,t[r],n);var i})}return Object.is(t,e)},da=e=>{var t,n,r;return oa(e)?la(e)?null!=(t=null==(n=(r=e[aa]()).getSelectionKeys)?void 0:n.call(r))?t:[]:Array.isArray(e)?ua(e,da):ua(Object.values(e),da):[]},ua=(e,t)=>e.reduce((e,n)=>e.concat(t(n)),[]);function ha(e){return Object.assign(e,{optional:()=>{return t=e,ha({[aa]:()=>({match:e=>{let n={};const r=(e,t)=>{n[e]=t};return void 0===e?(da(t).forEach(e=>r(e,void 0)),{matched:!0,selections:n}):{matched:ca(t,e,r),selections:n}},getSelectionKeys:()=>da(t),matcherType:"optional"})});var t},and:t=>ma(e,t),or:t=>function(...e){return ha({[aa]:()=>({match:t=>{let n={};const r=(e,t)=>{n[e]=t};return ua(e,da).forEach(e=>r(e,void 0)),{matched:e.some(e=>ca(e,t,r)),selections:n}},getSelectionKeys:()=>ua(e,da),matcherType:"or"})})}(e,t),select:t=>void 0===t?ya(e):ya(t,e)})}function ma(...e){return ha({[aa]:()=>({match:t=>{let n={};const r=(e,t)=>{n[e]=t};return{matched:e.every(e=>ca(e,t,r)),selections:n}},getSelectionKeys:()=>ua(e,da),matcherType:"and"})})}function fa(e){return{[aa]:()=>({match:t=>({matched:Boolean(e(t))})})}}function ya(...e){const t="string"==typeof e[0]?e[0]:void 0,n=2===e.length?e[1]:"string"==typeof e[0]?void 0:e[0];return ha({[aa]:()=>({match:e=>{let r={[null!=t?t:sa]:e};return{matched:void 0===n||ca(n,e,(e,t)=>{r[e]=t}),selections:r}},getSelectionKeys:()=>[null!=t?t:sa].concat(void 0===n?[]:da(n))})})}function pa(e){return!0}function ga(e){return"number"==typeof e}function ba(e){return"string"==typeof e}function va(e){return"bigint"==typeof e}ha(fa(pa)),ha(fa(pa));const wa=e=>Object.assign(ha(e),{startsWith:t=>{return wa(ma(e,(n=t,fa(e=>ba(e)&&e.startsWith(n)))));var n},endsWith:t=>{return wa(ma(e,(n=t,fa(e=>ba(e)&&e.endsWith(n)))));var n},minLength:t=>{return wa(ma(e,(n=t,fa(e=>ba(e)&&e.length>=n))));var n},length:t=>{return wa(ma(e,(n=t,fa(e=>ba(e)&&e.length===n))));var n},maxLength:t=>{return wa(ma(e,(n=t,fa(e=>ba(e)&&e.length<=n))));var n},includes:t=>{return wa(ma(e,(n=t,fa(e=>ba(e)&&e.includes(n)))));var n},regex:t=>{return wa(ma(e,(n=t,fa(e=>ba(e)&&Boolean(e.match(n))))));var n}});wa(fa(ba));const ka=e=>Object.assign(ha(e),{between:(t,n)=>{return ka(ma(e,(r=t,a=n,fa(e=>ga(e)&&r<=e&&a>=e))));var r,a},lt:t=>{return ka(ma(e,(n=t,fa(e=>ga(e)&&e<n))));var n},gt:t=>{return ka(ma(e,(n=t,fa(e=>ga(e)&&e>n))));var n},lte:t=>{return ka(ma(e,(n=t,fa(e=>ga(e)&&e<=n))));var n},gte:t=>{return ka(ma(e,(n=t,fa(e=>ga(e)&&e>=n))));var n},int:()=>ka(ma(e,fa(e=>ga(e)&&Number.isInteger(e)))),finite:()=>ka(ma(e,fa(e=>ga(e)&&Number.isFinite(e)))),positive:()=>ka(ma(e,fa(e=>ga(e)&&e>0))),negative:()=>ka(ma(e,fa(e=>ga(e)&&e<0)))}),Da=ka(fa(ga)),Sa=e=>Object.assign(ha(e),{between:(t,n)=>{return Sa(ma(e,(r=t,a=n,fa(e=>va(e)&&r<=e&&a>=e))));var r,a},lt:t=>{return Sa(ma(e,(n=t,fa(e=>va(e)&&e<n))));var n},gt:t=>{return Sa(ma(e,(n=t,fa(e=>va(e)&&e>n))));var n},lte:t=>{return Sa(ma(e,(n=t,fa(e=>va(e)&&e<=n))));var n},gte:t=>{return Sa(ma(e,(n=t,fa(e=>va(e)&&e>=n))));var n},positive:()=>Sa(ma(e,fa(e=>va(e)&&e>0))),negative:()=>Sa(ma(e,fa(e=>va(e)&&e<0)))});Sa(fa(va)),ha(fa(function(e){return"boolean"==typeof e})),ha(fa(function(e){return"symbol"==typeof e}));const xa=ha(fa(function(e){return null==e}));ha(fa(function(e){return null!=e}));var Ta={__proto__:null,number:Da,nullish:xa};class Ea extends Error{constructor(e){let t;try{t=JSON.stringify(e)}catch(n){t=e}super(`Pattern matching error: no pattern matches value ${t}`),this.input=void 0,this.input=e}}const Ma={matched:!1,value:void 0};function Oa(e){return new $a(e,Ma)}let $a=class e{constructor(e,t){this.input=void 0,this.state=void 0,this.input=e,this.state=t}with(...t){if(this.state.matched)return this;const n=t[t.length-1],r=[t[0]];let a;3===t.length&&"function"==typeof t[1]?a=t[1]:t.length>2&&r.push(...t.slice(1,t.length-1));let i=!1,s={};const o=(e,t)=>{i=!0,s[e]=t},l=!r.some(e=>ca(e,this.input,o))||a&&!Boolean(a(this.input))?Ma:{matched:!0,value:n(i?sa in s?s[sa]:s:this.input,this.input)};return new e(this.input,l)}when(t,n){if(this.state.matched)return this;const r=Boolean(t(this.input));return new e(this.input,r?{matched:!0,value:n(this.input,this.input)}:Ma)}otherwise(e){return this.state.matched?this.state.value:e(this.input)}exhaustive(e=Na){return this.state.matched?this.state.value:e(this.input)}run(){return this.exhaustive()}returnType(){return this}narrow(){return this}};function Na(e){throw new Ea(e)}const Ca={"zh-Hans":"zh-CN","zh-Hant":"zh-TW"};function Ia(e){return Ca[e]||e}const _a=/* @__PURE__ */new Map;const Aa=/* @__PURE__ */new Map;const Ra=/* @__PURE__ */new Map;function La(e,t="en"){return function(e){const t=Ia(e);let n=_a.get(t);return n||(n=Object.freeze(Array.from({length:12},(e,n)=>Cr.local().set({month:n+1}).setLocale(t).toFormat("MMM"))),_a.set(t,n)),n}(t)[e-1]}function za(e,t,n,r="en"){const a=new Date(n,t-1,e);return function(e){const t=Ia(e);let n=Ra.get(t);return n||(n=new Intl.DateTimeFormat(t,{day:"numeric",month:"short"}),Ra.set(t,n)),n}(r).format(a)}function Wa(e,t="en"){return function(e){const t=Ia(e);let n=Aa.get(t);return n||(n=Object.freeze(Array.from({length:7},(e,n)=>Cr.local().set({weekday:n+1}).setLocale(t).toFormat("ccc"))),Aa.set(t,n)),n}(t)[e-1]}function Fa(e,t){return((e-t)%7+7)%7}function Va(e,t){const n=new Date(e.year,e.month-1,e.day),r=Fa(n.getDay(),t),a=new Date(n);return a.setDate(n.getDate()-r),Array.from({length:7},(e,t)=>{const n=new Date(a);return n.setDate(a.getDate()+t),{day:n.getDate(),month:n.getMonth()+1,year:n.getFullYear()}})}function ja(e){const t=0===e?7:e;return Array.from({length:7},(e,n)=>(t-1+n)%7+1)}var Ya=Object.defineProperty,Ua=Object.getOwnPropertyDescriptor,Za=(e,t,n,r)=>{for(var a,i=r>1?void 0:r?Ua(t,n):t,s=e.length-1;s>=0;s--)(a=e[s])&&(i=(r?a(t,n,i):a(i))||i);return r&&i&&Ya(t,n,i),i};let Ha=class extends a{constructor(){super(...arguments),this.firstDayOfWeek=1,this.locale="en"}render(){const e=ja(this.firstDayOfWeek);return i` <div>
            ${e.map(e=>i`<span>${Wa(e,this.locale)}</span>`)}
        </div>`}};Ha.styles=r`
        div {
            height: var(--context-height, 1.75em);
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        span {
            /* Match the month indicator's margin (0.25em) + padding (0.25em) */
            padding: var(--context-padding, 0.25em) var(--context-padding-inline, 0.5em);
            text-align: var(--context-text-align, left);
        }
    `,Za([l({type:Number})],Ha.prototype,"firstDayOfWeek",2),Za([l({type:String})],Ha.prototype,"locale",2),Ha=Za([c("lms-calendar-context")],Ha);var qa=Object.defineProperty,Pa=Object.getOwnPropertyDescriptor,Ba=(e,t,n,r)=>{for(var a,i=r>1?void 0:r?Pa(t,n):t,s=e.length-1;s>=0;s--)(a=e[s])&&(i=(r?a(t,n,i):a(i))||i);return r&&i&&qa(t,n,i),i};let Ga=class extends a{constructor(){super(...arguments),this._hours=[...Array(25).keys()],this._hasActiveSidebar=!1,this.allDayRowCount=0}_renderSeparatorMaybe(e,t){return e?i`<div class="separator" style="grid-row: ${60*t}"></div>`:s}_renderIndicatorValue(e){return e<10?`0${e}:00`:`${e}:00`}render(){const e=this.allDayRowCount>0,t=e?`calc(100% - 3.5em - ${24*this.allDayRowCount}px)`:"100%";return i` <div class="wrapper">
            <div class="all-day-wrapper ${u({collapsed:!e})}">
                <div class="all-day">
                    <slot name="all-day" id="all-day" class="entry"></slot>
                </div>
            </div>
            <div class="container" style="height: ${t}">
                <div
                    class="main ${u({"w-100":!this._hasActiveSidebar,"w-70":this._hasActiveSidebar})}"
                >
                    ${h(this._hours,(e,t)=>i`
                            <div
                                class="hour"
                                style=${this._getHourIndicator(e)}
                            >
                                <span class="indicator">
                                    ${this._renderIndicatorValue(e)}
                                </span>
                            </div>
                            ${this._renderSeparatorMaybe(t,e)}
                            <slot name="${e}" class="entry"></slot>
                        `)}
                </div>
                <div
                    class="sidebar w-30"
                    ?hidden=${!this._hasActiveSidebar}
                ></div>
            </div>
        </div>`}_getHourIndicator(e){return 24!==e?`grid-row: ${60*(e+1)-59}/${60*(e+1)}`:"grid-row: 1440"}};Ga.styles=r`
        .wrapper {
            display: flex;
            flex-direction: column;
            height: var(--view-container-height);
            width: 100%;
        }

        .container {
            display: flex;
            flex: 1;
            width: 100%;
        }

        .main {
            display: grid;
            grid-template-columns: var(--day-grid-columns, var(--calendar-grid-columns-day));
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
            border-top: var(--separator-border, 1px solid var(--separator-light));
            position: absolute;
            width: 100%;
            z-index: 0;
        }

        .sidebar {
            height: 100%;
            border-left: var(--sidebar-border, 1px solid var(--separator-light));
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

        .all-day-wrapper {
            display: grid;
            grid-template-rows: 1fr;
            transition: grid-template-rows 0.2s ease;
            border-bottom: 1px solid var(--separator-light, rgba(0, 0, 0, 0.1));
        }

        .all-day-wrapper.collapsed {
            grid-template-rows: 0fr;
            overflow: hidden;
            border-bottom: none;
        }

        .all-day-wrapper.collapsed .all-day {
            padding: 0;
        }

        .all-day {
            font-size: var(--day-all-day-font-size, 16px);
            margin: var(--day-all-day-margin, 0 1.25em 0 4.25em);
            overflow: hidden;
            min-height: 0;
            padding: 0.5em 0;
        }
    `,Ba([d()],Ga.prototype,"_hours",2),Ba([d()],Ga.prototype,"_hasActiveSidebar",2),Ba([l({type:Number})],Ga.prototype,"allDayRowCount",2),Ga=Ba([c("lms-calendar-day")],Ga);const Ka={ar:{s005053d82b712e0a:"ملاحظات",s090f2107b5a69a7f:"أ",s15ba5784a11e0b88:"الشهر الحالي",s22380c7fc798a44f:"بدون محتوى",s2bc4d1196bce49dc:"تصدير كملف ICS",s48e186fb300e5464:"الوقت",s58ab939b42a026a6:"طوال اليوم",s5e8250fb85d64c23:"إغلاق",s63d040e37887f17e:"اليوم",s680f01021b5e339d:"أسبوع",s98b32ef4a0856c08:"بدون عنوان",s99f110d27e30b289:"العنوان",sa0fd990c985f24bd:"تفاصيل الحدث",sac8252732f2edb19:"التاريخ",sb47daaf9e1c4a905:"شهر",se0955919920ee87d:"يوم",sfce4bfbe0f911aa7:"بدون وقت"},bn:{s005053d82b712e0a:"নোট",s090f2107b5a69a7f:"স",s15ba5784a11e0b88:"বর্তমান মাস",s22380c7fc798a44f:"বিষয়বস্তু নেই",s2bc4d1196bce49dc:"ICS হিসাবে রপ্তানি",s48e186fb300e5464:"সময়",s58ab939b42a026a6:"সারাদিন",s5e8250fb85d64c23:"বন্ধ",s63d040e37887f17e:"আজ",s680f01021b5e339d:"সপ্তাহ",s98b32ef4a0856c08:"শিরোনাম নেই",s99f110d27e30b289:"শিরোনাম",sa0fd990c985f24bd:"ইভেন্টের বিবরণ",sac8252732f2edb19:"তারিখ",sb47daaf9e1c4a905:"মাস",se0955919920ee87d:"দিন",sfce4bfbe0f911aa7:"সময় নেই"},de:{s005053d82b712e0a:"Notizen",s090f2107b5a69a7f:"KW",s15ba5784a11e0b88:"Aktueller Monat",s22380c7fc798a44f:"Kein Inhalt",s2bc4d1196bce49dc:"Als ICS exportieren",s48e186fb300e5464:"Zeit",s58ab939b42a026a6:"Ganztägig",s5e8250fb85d64c23:"Schließen",s63d040e37887f17e:"Heute",s680f01021b5e339d:"Woche",s98b32ef4a0856c08:"Kein Titel",s99f110d27e30b289:"Titel",sa0fd990c985f24bd:"Termindetails",sac8252732f2edb19:"Datum",sb47daaf9e1c4a905:"Monat",se0955919920ee87d:"Tag",sfce4bfbe0f911aa7:"Keine Zeit"},"de-DE":{s005053d82b712e0a:"Notizen",s090f2107b5a69a7f:"KW",s15ba5784a11e0b88:"Aktueller Monat",s22380c7fc798a44f:"Kein Inhalt",s2bc4d1196bce49dc:"Als ICS exportieren",s48e186fb300e5464:"Zeit",s58ab939b42a026a6:"Ganztägig",s5e8250fb85d64c23:"Schließen",s63d040e37887f17e:"Heute",s680f01021b5e339d:"Woche",s98b32ef4a0856c08:"Kein Titel",s99f110d27e30b289:"Titel",sa0fd990c985f24bd:"Termindetails",sac8252732f2edb19:"Datum",sb47daaf9e1c4a905:"Monat",se0955919920ee87d:"Tag",sfce4bfbe0f911aa7:"Keine Zeit"},es:{s005053d82b712e0a:"Notas",s090f2107b5a69a7f:"S",s15ba5784a11e0b88:"Mes actual",s22380c7fc798a44f:"Sin contenido",s2bc4d1196bce49dc:"Exportar como ICS",s48e186fb300e5464:"Hora",s58ab939b42a026a6:"Todo el día",s5e8250fb85d64c23:"Cerrar",s63d040e37887f17e:"Hoy",s680f01021b5e339d:"Semana",s98b32ef4a0856c08:"Sin título",s99f110d27e30b289:"Título",sa0fd990c985f24bd:"Detalles del evento",sac8252732f2edb19:"Fecha",sb47daaf9e1c4a905:"Mes",se0955919920ee87d:"Día",sfce4bfbe0f911aa7:"Sin hora"},fr:{s005053d82b712e0a:"Notes",s090f2107b5a69a7f:"S",s15ba5784a11e0b88:"Mois en cours",s22380c7fc798a44f:"Aucun contenu",s2bc4d1196bce49dc:"Exporter en ICS",s48e186fb300e5464:"Heure",s58ab939b42a026a6:"Toute la journée",s5e8250fb85d64c23:"Fermer",s63d040e37887f17e:"Aujourd'hui",s680f01021b5e339d:"Semaine",s98b32ef4a0856c08:"Sans titre",s99f110d27e30b289:"Titre",sa0fd990c985f24bd:"Détails de l'événement",sac8252732f2edb19:"Date",sb47daaf9e1c4a905:"Mois",se0955919920ee87d:"Jour",sfce4bfbe0f911aa7:"Aucune heure"},hi:{s005053d82b712e0a:"टिप्पणियाँ",s090f2107b5a69a7f:"स",s15ba5784a11e0b88:"वर्तमान महीना",s22380c7fc798a44f:"कोई सामग्री नहीं",s2bc4d1196bce49dc:"ICS के रूप में निर्यात करें",s48e186fb300e5464:"समय",s58ab939b42a026a6:"पूरा दिन",s5e8250fb85d64c23:"बंद करें",s63d040e37887f17e:"आज",s680f01021b5e339d:"सप्ताह",s98b32ef4a0856c08:"कोई शीर्षक नहीं",s99f110d27e30b289:"शीर्षक",sa0fd990c985f24bd:"कार्यक्रम विवरण",sac8252732f2edb19:"तारीख",sb47daaf9e1c4a905:"महीना",se0955919920ee87d:"दिन",sfce4bfbe0f911aa7:"कोई समय नहीं"},id:{s005053d82b712e0a:"Catatan",s090f2107b5a69a7f:"M",s15ba5784a11e0b88:"Bulan Ini",s22380c7fc798a44f:"Tanpa Konten",s2bc4d1196bce49dc:"Ekspor sebagai ICS",s48e186fb300e5464:"Waktu",s58ab939b42a026a6:"Sepanjang Hari",s5e8250fb85d64c23:"Tutup",s63d040e37887f17e:"Hari Ini",s680f01021b5e339d:"Minggu",s98b32ef4a0856c08:"Tanpa Judul",s99f110d27e30b289:"Judul",sa0fd990c985f24bd:"Detail Acara",sac8252732f2edb19:"Tanggal",sb47daaf9e1c4a905:"Bulan",se0955919920ee87d:"Hari",sfce4bfbe0f911aa7:"Tanpa Waktu"},it:{s005053d82b712e0a:"Note",s090f2107b5a69a7f:"S",s15ba5784a11e0b88:"Mese corrente",s22380c7fc798a44f:"Nessun contenuto",s2bc4d1196bce49dc:"Esporta come ICS",s48e186fb300e5464:"Ora",s58ab939b42a026a6:"Tutto il giorno",s5e8250fb85d64c23:"Chiudi",s63d040e37887f17e:"Oggi",s680f01021b5e339d:"Settimana",s98b32ef4a0856c08:"Senza titolo",s99f110d27e30b289:"Titolo",sa0fd990c985f24bd:"Dettagli evento",sac8252732f2edb19:"Data",sb47daaf9e1c4a905:"Mese",se0955919920ee87d:"Giorno",sfce4bfbe0f911aa7:"Nessun orario"},ja:{s005053d82b712e0a:"メモ",s090f2107b5a69a7f:"週",s15ba5784a11e0b88:"今月",s22380c7fc798a44f:"内容なし",s2bc4d1196bce49dc:"ICSとして書き出す",s48e186fb300e5464:"時間",s58ab939b42a026a6:"終日",s5e8250fb85d64c23:"閉じる",s63d040e37887f17e:"今日",s680f01021b5e339d:"週",s98b32ef4a0856c08:"タイトルなし",s99f110d27e30b289:"タイトル",sa0fd990c985f24bd:"予定の詳細",sac8252732f2edb19:"日付",sb47daaf9e1c4a905:"月",se0955919920ee87d:"日",sfce4bfbe0f911aa7:"時間なし"},ko:{s005053d82b712e0a:"메모",s090f2107b5a69a7f:"주",s15ba5784a11e0b88:"이번 달",s22380c7fc798a44f:"내용 없음",s2bc4d1196bce49dc:"ICS로 내보내기",s48e186fb300e5464:"시간",s58ab939b42a026a6:"종일",s5e8250fb85d64c23:"닫기",s63d040e37887f17e:"오늘",s680f01021b5e339d:"주",s98b32ef4a0856c08:"제목 없음",s99f110d27e30b289:"제목",sa0fd990c985f24bd:"일정 상세",sac8252732f2edb19:"날짜",sb47daaf9e1c4a905:"월",se0955919920ee87d:"일",sfce4bfbe0f911aa7:"시간 없음"},nl:{s005053d82b712e0a:"Notities",s090f2107b5a69a7f:"W",s15ba5784a11e0b88:"Huidige maand",s22380c7fc798a44f:"Geen inhoud",s2bc4d1196bce49dc:"Exporteren als ICS",s48e186fb300e5464:"Tijd",s58ab939b42a026a6:"Hele dag",s5e8250fb85d64c23:"Sluiten",s63d040e37887f17e:"Vandaag",s680f01021b5e339d:"Week",s98b32ef4a0856c08:"Geen titel",s99f110d27e30b289:"Titel",sa0fd990c985f24bd:"Details evenement",sac8252732f2edb19:"Datum",sb47daaf9e1c4a905:"Maand",se0955919920ee87d:"Dag",sfce4bfbe0f911aa7:"Geen tijd"},pl:{s005053d82b712e0a:"Notatki",s090f2107b5a69a7f:"T",s15ba5784a11e0b88:"Bieżący miesiąc",s22380c7fc798a44f:"Brak treści",s2bc4d1196bce49dc:"Eksportuj jako ICS",s48e186fb300e5464:"Czas",s58ab939b42a026a6:"Cały dzień",s5e8250fb85d64c23:"Zamknij",s63d040e37887f17e:"Dziś",s680f01021b5e339d:"Tydzień",s98b32ef4a0856c08:"Brak tytułu",s99f110d27e30b289:"Tytuł",sa0fd990c985f24bd:"Szczegóły wydarzenia",sac8252732f2edb19:"Data",sb47daaf9e1c4a905:"Miesiąc",se0955919920ee87d:"Dzień",sfce4bfbe0f911aa7:"Brak czasu"},pt:{s005053d82b712e0a:"Notas",s090f2107b5a69a7f:"S",s15ba5784a11e0b88:"Mês atual",s22380c7fc798a44f:"Sem conteúdo",s2bc4d1196bce49dc:"Exportar como ICS",s48e186fb300e5464:"Hora",s58ab939b42a026a6:"O dia todo",s5e8250fb85d64c23:"Fechar",s63d040e37887f17e:"Hoje",s680f01021b5e339d:"Semana",s98b32ef4a0856c08:"Sem título",s99f110d27e30b289:"Título",sa0fd990c985f24bd:"Detalhes do evento",sac8252732f2edb19:"Data",sb47daaf9e1c4a905:"Mês",se0955919920ee87d:"Dia",sfce4bfbe0f911aa7:"Sem horário"},ru:{s005053d82b712e0a:"Заметки",s090f2107b5a69a7f:"Н",s15ba5784a11e0b88:"Текущий месяц",s22380c7fc798a44f:"Нет содержимого",s2bc4d1196bce49dc:"Экспорт в ICS",s48e186fb300e5464:"Время",s58ab939b42a026a6:"Весь день",s5e8250fb85d64c23:"Закрыть",s63d040e37887f17e:"Сегодня",s680f01021b5e339d:"Неделя",s98b32ef4a0856c08:"Без названия",s99f110d27e30b289:"Название",sa0fd990c985f24bd:"Детали события",sac8252732f2edb19:"Дата",sb47daaf9e1c4a905:"Месяц",se0955919920ee87d:"День",sfce4bfbe0f911aa7:"Нет времени"},th:{s005053d82b712e0a:"บันทึก",s090f2107b5a69a7f:"ส",s15ba5784a11e0b88:"เดือนปัจจุบัน",s22380c7fc798a44f:"ไม่มีเนื้อหา",s2bc4d1196bce49dc:"ส่งออกเป็น ICS",s48e186fb300e5464:"เวลา",s58ab939b42a026a6:"ทั้งวัน",s5e8250fb85d64c23:"ปิด",s63d040e37887f17e:"วันนี้",s680f01021b5e339d:"สัปดาห์",s98b32ef4a0856c08:"ไม่มีชื่อ",s99f110d27e30b289:"ชื่อ",sa0fd990c985f24bd:"รายละเอียดกิจกรรม",sac8252732f2edb19:"วันที่",sb47daaf9e1c4a905:"เดือน",se0955919920ee87d:"วัน",sfce4bfbe0f911aa7:"ไม่มีเวลา"},tr:{s005053d82b712e0a:"Notlar",s090f2107b5a69a7f:"H",s15ba5784a11e0b88:"Bu Ay",s22380c7fc798a44f:"İçerik Yok",s2bc4d1196bce49dc:"ICS Olarak Dışa Aktar",s48e186fb300e5464:"Zaman",s58ab939b42a026a6:"Tüm Gün",s5e8250fb85d64c23:"Kapat",s63d040e37887f17e:"Bugün",s680f01021b5e339d:"Hafta",s98b32ef4a0856c08:"Başlıksız",s99f110d27e30b289:"Başlık",sa0fd990c985f24bd:"Etkinlik Detayları",sac8252732f2edb19:"Tarih",sb47daaf9e1c4a905:"Ay",se0955919920ee87d:"Gün",sfce4bfbe0f911aa7:"Zaman Yok"},uk:{s005053d82b712e0a:"Нотатки",s090f2107b5a69a7f:"Т",s15ba5784a11e0b88:"Поточний місяць",s22380c7fc798a44f:"Без вмісту",s2bc4d1196bce49dc:"Експорт в ICS",s48e186fb300e5464:"Час",s58ab939b42a026a6:"Увесь день",s5e8250fb85d64c23:"Закрити",s63d040e37887f17e:"Сьогодні",s680f01021b5e339d:"Тиждень",s98b32ef4a0856c08:"Без назви",s99f110d27e30b289:"Назва",sa0fd990c985f24bd:"Деталі події",sac8252732f2edb19:"Дата",sb47daaf9e1c4a905:"Місяць",se0955919920ee87d:"День",sfce4bfbe0f911aa7:"Без часу"},vi:{s005053d82b712e0a:"Ghi chú",s090f2107b5a69a7f:"T",s15ba5784a11e0b88:"Tháng hiện tại",s22380c7fc798a44f:"Không có nội dung",s2bc4d1196bce49dc:"Xuất dưới dạng ICS",s48e186fb300e5464:"Thời gian",s58ab939b42a026a6:"Cả ngày",s5e8250fb85d64c23:"Đóng",s63d040e37887f17e:"Hôm nay",s680f01021b5e339d:"Tuần",s98b32ef4a0856c08:"Không có tiêu đề",s99f110d27e30b289:"Tiêu đề",sa0fd990c985f24bd:"Chi tiết sự kiện",sac8252732f2edb19:"Ngày",sb47daaf9e1c4a905:"Tháng",se0955919920ee87d:"Ngày",sfce4bfbe0f911aa7:"Không có thời gian"},"zh-Hans":{s005053d82b712e0a:"备注",s090f2107b5a69a7f:"周",s15ba5784a11e0b88:"本月",s22380c7fc798a44f:"无内容",s2bc4d1196bce49dc:"导出为 ICS",s48e186fb300e5464:"时间",s58ab939b42a026a6:"全天",s5e8250fb85d64c23:"关闭",s63d040e37887f17e:"今天",s680f01021b5e339d:"周",s98b32ef4a0856c08:"无标题",s99f110d27e30b289:"标题",sa0fd990c985f24bd:"事件详情",sac8252732f2edb19:"日期",sb47daaf9e1c4a905:"月",se0955919920ee87d:"日",sfce4bfbe0f911aa7:"无时间"}},Ja=[["day","se0955919920ee87d","Day"],["week","s680f01021b5e339d","Week"],["month","sb47daaf9e1c4a905","Month"],["currentMonth","s15ba5784a11e0b88","Current Month"],["allDay","s58ab939b42a026a6","All Day"],["today","s63d040e37887f17e","Today"],["noTitle","s98b32ef4a0856c08","No Title"],["noContent","s22380c7fc798a44f","No Content"],["noTime","sfce4bfbe0f911aa7","No Time"],["eventDetails","sa0fd990c985f24bd","Event Details"],["exportAsICS","s2bc4d1196bce49dc","Export as ICS"],["title","s99f110d27e30b289","Title"],["time","s48e186fb300e5464","Time"],["date","sac8252732f2edb19","Date"],["notes","s005053d82b712e0a","Notes"],["close","s5e8250fb85d64c23","Close"],["calendarWeek","s090f2107b5a69a7f","CW"]],Qa=/* @__PURE__ */new Map;function Xa(e){let t=Qa.get(e);if(t)return t;const n=function(e){if("en"!==e)return Ka[e]??Ka[e.split("-")[0]]}(e),r={};for(const[a,i,s]of Ja)r[a]=n?.[i]??s;return t=Object.freeze(r),Qa.set(e,t),t}var ei=Object.defineProperty,ti=Object.getOwnPropertyDescriptor,ni=(e,t,n,r)=>{for(var a,i=r>1?void 0:r?ti(t,n):t,s=e.length-1;s>=0;s--)(a=e[s])&&(i=(r?a(t,n,i):a(i))||i);return r&&i&&ei(t,n,i),i};let ri=class extends a{constructor(){super(),this.heading="",this.isContinuation=!1,this.density="standard",this.displayMode="default",this.floatText=!1,this.locale="en",this._sumReducer=(e,t)=>e+t,this.addEventListener("click",this._handleInteraction),this.addEventListener("keydown",this._handleInteraction),this.addEventListener("focus",this._handleFocus)}_renderTitle(){return Oa(this.content).with(Ta.nullish,()=>this.heading).otherwise(()=>`${this.heading}: ${this.content}`)}_renderTime(){const e=Xa(this.locale);if("month-dot"===this.displayMode){if(this.isContinuation)return i`<span class="time">${e.allDay}</span>`;const t=this._displayInterval(this.time);return t?i`<span class="time">${t}</span>`:s}if("compact"===this.density)return s;if(this.isContinuation)return i`<span class="time">${e.allDay}</span>`;const t=this._displayInterval(this.time);return t?i`<span class="time">${t}</span>`:s}_renderContent(){return"full"===this.density&&this.content?i`<span class="content">${this.content}</span>`:s}_shouldShowTime(){return"compact"!==this.density&&(!!this.isContinuation||("standard"===this.density||"full"===this.density))}_getAriaLabel(){const e=this.time?`${String(this.time.start.hour).padStart(2,"0")}:${String(this.time.start.minute).padStart(2,"0")} to ${String(this.time.end.hour).padStart(2,"0")}:${String(this.time.end.minute).padStart(2,"0")}`:"All day",t=this.content?`, ${this.content}`:"";return`Calendar event: ${this.heading}${t}, ${e}. Press Enter or Space to open details.`}render(){const e=`main ${this.density}`;if("month-dot"===this.displayMode){const t=this.isContinuation;return i`
                <div
                    class=${e}
                    tabindex=${this.accessibility?.tabIndex??0}
                    role="button"
                    aria-label="${this.accessibility?.ariaLabel??this._getAriaLabel()}"
                    aria-selected=${this._highlighted?"true":"false"}
                    title=${this._renderTitle()}
                    data-full-content=${this.content||""}
                    ?data-extended=${this._extended}
                    ?data-is-multi-day=${t}
                >
                    ${t?"":i`
                                  <span class="color-dot"></span>
                              `}
                    <span class="title">${this.heading}</span>
                    ${this._renderTime()}
                </div>
            `}return this.floatText?i`
                <div
                    class=${e}
                    style="background-color: var(--entry-background-color); height: 100%; position: relative; overflow: visible;"
                >
                    <div class="text-content">
                        <span style="font-weight: 500;">${this.heading}</span>
                        ${this._renderTime()}
                    </div>
                </div>
            `:i`
            <div
                class=${e}
                tabindex=${this.accessibility?.tabIndex??0}
                role="button"
                aria-label="${this.accessibility?.ariaLabel??this._getAriaLabel()}"
                aria-selected=${this._highlighted?"true":"false"}
                title=${this._renderTitle()}
                data-full-content=${this.content||""}
                ?data-extended=${this._extended}
            >
                <span class="title">${this.heading}</span>
                ${this._shouldShowTime()?this._renderTime():s}
                ${this._renderContent()}
            </div>
        `}_displayInterval(e){if(!e)return s;const t=[e.start.hour,e.start.minute,e.end.hour,e.end.minute];if(24===t[2]&&t.reduce(this._sumReducer,0)%24==0)return Xa(this.locale).allDay;const[n,r,a,i]=t.map(e=>e<10?`0${e}`:e);return`${n}:${r} - ${a}:${i}`}clearSelection(){this._highlighted=!1,this.setAttribute("aria-selected","false")}_handleFocus(e){const t=new CustomEvent("clear-other-selections",{detail:{exceptEntry:this},bubbles:!0,composed:!0});this.dispatchEvent(t)}_handleInteraction(e){if(!(e instanceof KeyboardEvent&&"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),e.stopPropagation(),this._highlighted))){if(this._highlighted=!0,this.setAttribute("aria-selected","true"),!this.date)return;const e=Xa(this.locale),t={heading:this.heading||e.noTitle,content:this.content||e.noContent,time:this.time?`${String(this.time.start.hour).padStart(2,"0")}:${String(this.time.start.minute).padStart(2,"0")} - ${String(this.time.end.hour).padStart(2,"0")}:${String(this.time.end.minute).padStart(2,"0")}`:e.noTime,date:this.date?.start,anchorRect:this.getBoundingClientRect()},n=new CustomEvent("open-menu",{detail:t,bubbles:!0,composed:!0});this.dispatchEvent(n);const r=()=>{this._highlighted=!1,this.setAttribute("aria-selected","false"),this.removeEventListener("menu-close",r)};this.addEventListener("menu-close",r)}}};ri.styles=r`
        :host {
            /* Use shared design tokens from root component */
            font-size: var(--entry-font-size);
            line-height: var(--entry-line-height);
            font-family: var(--system-ui);

            grid-column: 2;
            display: block;
            cursor: pointer;
            user-select: none;
            border-radius: var(--entry-border-radius);
            grid-row: var(--start-slot);
            width: var(--entry-width, 100%);
            margin-left: var(--entry-margin-left, 0);
            background-color: var(--entry-background-color);
            color: var(--entry-color);
            border: var(--entry-border, none);
            /* z-index of separators in day view is 0 */
            z-index: var(--entry-z-index, 1);
            opacity: var(--entry-opacity, 1);
            box-sizing: border-box;
            padding-bottom: 1px;
            min-height: var(--entry-min-height);
            overflow: hidden;
            position: relative;
        }

        /* Color handle indicator on the left - only for day/week views */
        :host::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: var(--entry-handle-width, 0px);
            background-color: var(--entry-handle-color, transparent);
            border-radius: var(--entry-border-radius) 0 0 var(--entry-border-radius);
            display: var(--entry-handle-display, none);
        }

        :host(:last-child) {
            padding-bottom: 0;
        }

        :host([data-highlighted]) {
            background: var(--entry-highlight-color);
        }

        /* ARIA-compliant highlighted border for active menu entries */
        :host([aria-selected='true']) {
            outline: 3px solid var(--entry-focus-color);
            outline-offset: 2px;
            position: relative;
            z-index: 999 !important; /* Ensure highlighted entry appears above others */
        }

        /* Keyboard-only focus styles — mouse clicks won't trigger the outline */
        :host(:focus-visible) {
            outline: 2px solid var(--entry-focus-color);
            outline-offset: 2px;
            position: relative;
            z-index: 999 !important;
        }

        :host([data-extended]) {
            background: var(--entry-extended-background-color, var(--background-color));
        }

        :host(:has(:focus-visible)) {
            outline: 2px solid var(--entry-focus-color);
            outline-offset: 2px;
            position: relative;
            z-index: 999 !important;
        }

        .main {
            padding: var(--entry-padding);
            padding-top: calc(var(--entry-padding-top, 0) + 0.15em);
            border-radius: var(--entry-border-radius);
            background-color: inherit;
            text-align: left;
            height: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: var(--entry-layout);
            align-items: var(--entry-align); /* Use shared design token */
            justify-content: flex-start; /* Always align content to left */
            gap: var(--entry-gap);
            overflow: visible;
            position: relative;
        }

        /* Compact grouped content - don't stretch to fill height */
        .main.compact,
        .main.standard {
            align-self: flex-start; /* Don't stretch vertically */
            height: auto; /* Use natural content height instead of 100% */
            min-height: var(--entry-min-height, 1.2em);
        }

        /* When handle design is used, adjust padding for the colored handle */
        .main {
            padding-left: var(--entry-padding-left, 0.25em);
        }

        .text-content {
            position: absolute;
            top: var(--entry-text-top, -20px);
            left: var(--entry-text-left, 0);
            background: rgba(255, 255, 255, 0.95);
            padding: 2px 6px;
            border-radius: 3px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            font-size: 0.7rem;
            z-index: 1000;
            white-space: nowrap;
            pointer-events: auto;
            line-height: 1.2;
        }

        /* Compact mode: single line with title only */
        .main.compact {
            flex-direction: row;
            align-items: flex-start; /* Top-left alignment for better overlapping visibility */
            gap: 0;
        }

        /* Standard mode: title + time in various layouts */
        .main.standard {
            flex-direction: var(--entry-layout, row);
            align-items: flex-start;
            gap: 0.25em;
        }

        /* Full mode: multi-line with all content */
        .main.full {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.1em;
        }

        .title {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: var(--entry-title-wrap);
            font-weight: var(--entry-title-weight);
        }

        .time {
            font-family: var(--entry-font-family, var(--system-ui));
            font-size: var(--entry-time-font-size);
            opacity: var(--entry-time-opacity);
            white-space: nowrap;
            flex-shrink: 0;
            margin-left: 0; /* Ensure time stays on the left, don't auto-align to right */
        }

        /* Row layout: optimized for side-by-side content */
        .main[style*='--entry-layout: row'] {
            align-items: center; /* Center align for single-line layout */
            gap: 0.5em; /* Gap between title and time */
            flex-wrap: nowrap; /* Prevent wrapping */
            min-height: 1.4em; /* Ensure consistent height */
        }

        .main[style*='--entry-layout: row'] .title {
            flex: 1 1 auto; /* Allow title to grow but not beyond container */
            min-width: 0; /* Allow title to shrink below content size */
            max-width: 65%; /* Reserve space for time, but allow more for title */
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .main[style*='--entry-layout: row'] .time {
            flex: 0 0 auto; /* Fixed size, don't grow or shrink */
            min-width: fit-content; /* Ensure time always fits */
            font-size: 0.8em; /* Slightly smaller in row layout */
            opacity: 0.9;
        }

        /* Column layout: optimized for stacked content */
        .main[style*='--entry-layout: column'] {
            align-items: flex-start;
            gap: 0.15em; /* Tighter spacing for stacked layout */
            padding-top: 0.2em; /* Slight top padding for better visual balance */
        }

        .main[style*='--entry-layout: column'] .title {
            width: 100%;
            font-weight: 500; /* Slightly bolder in column layout */
            line-height: 1.2;
            margin-bottom: 0.1em;
        }

        .main[style*='--entry-layout: column'] .time {
            width: 100%;
            font-size: 0.85em;
            opacity: 0.8;
            line-height: 1.1;
        }

        /* Month view dot indicator styles */
        :host([data-display-mode='month-dot']) {
            background: var(--entry-month-background);
            padding: var(--entry-month-padding);
            border-radius: 0;
            color: var(--entry-month-text-color);
            position: relative;
            z-index: 1;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
        }

        /* Multi-day events keep their background in month view */
        :host([data-display-mode='month-dot'][data-is-continuation='true']),
        :host([data-display-mode='month-dot']) .main[data-is-multi-day='true'] {
            background: var(--entry-background-color);
            border-radius: var(--border-radius-sm);
            color: var(--entry-color);
        }

        :host([data-display-mode='month-dot']) .main {
            padding: 0;
            align-items: center;
            gap: var(--entry-dot-margin);
            flex-wrap: nowrap;
            overflow: hidden;
            flex-direction: row !important;
        }

        :host([data-display-mode='month-dot']) .title {
            color: inherit;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            min-width: 0;
        }

        :host([data-display-mode='month-dot']) .time {
            font-family: var(--entry-time-font);
            text-align: var(--entry-time-align);
            min-width: 3.5em;
            margin-left: auto;
            color: inherit;
            opacity: 0.8;
        }

        .color-dot {
            width: var(--entry-dot-size);
            height: var(--entry-dot-size);
            border-radius: 50%;
            background-color: var(--entry-color);
            flex-shrink: 0;
        }

        .content {
            font-size: 0.9em;
            opacity: 0.9;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Responsive behavior based on available height */
        :host([data-height='compact']) .main {
            flex-direction: row;
            align-items: center;
        }

        :host([data-height='compact']) .time {
            display: var(--entry-compact-show-time, none);
        }

        :host([data-height='standard']) .main {
            flex-direction: row;
            align-items: flex-start;
        }

        :host([data-height='full']) .main {
            flex-direction: column;
            align-items: flex-start;
        }

        :host([data-height='full']) .title {
            white-space: normal;
            word-wrap: break-word;
        }
    `,ni([l({attribute:!1})],ri.prototype,"time",2),ni([l()],ri.prototype,"heading",2),ni([l()],ri.prototype,"content",2),ni([l({type:Boolean})],ri.prototype,"isContinuation",2),ni([l({type:Object})],ri.prototype,"date",2),ni([l({type:String,reflect:!0,attribute:"data-density"})],ri.prototype,"density",2),ni([l({type:String,reflect:!0,attribute:"data-display-mode"})],ri.prototype,"displayMode",2),ni([l({type:Boolean,reflect:!0,attribute:"data-float-text"})],ri.prototype,"floatText",2),ni([l({type:Object,attribute:!1})],ri.prototype,"accessibility",2),ni([l({type:String})],ri.prototype,"locale",2),ni([d()],ri.prototype,"_highlighted",2),ni([d()],ri.prototype,"_extended",2),ri=ni([c("lms-calendar-entry")],ri);var ai=Object.defineProperty,ii=Object.getOwnPropertyDescriptor,si=(e,t,n,r)=>{for(var a,i=r>1?void 0:r?ii(t,n):t,s=e.length-1;s>=0;s--)(a=e[s])&&(i=(r?a(t,n,i):a(i))||i);return r&&i&&ai(t,n,i),i};let oi=class extends a{constructor(){super(...arguments),this.viewMode="month",this.locale="en"}_getWeekInfo(e){const t=Cr.fromObject({year:e.year,month:e.month,day:e.day});return{weekNumber:t.weekNumber,weekYear:t.weekYear}}render(){const e=this.activeDate,t=Xa(this.locale);return i`<div class="controls">
            <div class="info">
                <span>
                    <strong>${this.heading||t.currentMonth}</strong>
                </span>
                <div class="view-detail${"day"===this.viewMode?" active":""}">
                    <span class="day">${e.day}</span>
                    <span class="month"
                        >${La(e.month,this.locale)}</span
                    >
                    <span class="year">${e.year}</span>
                </div>
                <div class="view-detail${"week"===this.viewMode?" active":""}">
                    <span class="week"
                        >${t.calendarWeek}
                        ${this._getWeekInfo(e).weekNumber}</span
                    >
                    <span class="month"
                        >${La(e.month,this.locale)}</span
                    >
                    <span class="year"
                        >${this._getWeekInfo(e).weekYear}</span
                    >
                </div>
                <div class="view-detail${"month"===this.viewMode?" active":""}">
                    <span class="month"
                        >${La(e.month,this.locale)}</span
                    >
                    <span class="year">${e.year}</span>
                </div>
            </div>
            <nav class="context" aria-label="Calendar view" @click=${this._dispatchSwitchView}>
                <button
                    type="button"
                    ?data-active=${"day"===this.viewMode}
                    aria-pressed=${"day"===this.viewMode?"true":"false"}
                    data-context="day"
                    class="btn-change-view"
                >
                    ${t.day}
                </button>
                <button
                    type="button"
                    ?data-active=${"week"===this.viewMode}
                    aria-pressed=${"week"===this.viewMode?"true":"false"}
                    data-context="week"
                    class="btn-change-view"
                >
                    ${t.week}
                </button>
                <button
                    type="button"
                    ?data-active=${"month"===this.viewMode}
                    aria-pressed=${"month"===this.viewMode?"true":"false"}
                    data-context="month"
                    class="btn-change-view"
                >
                    ${t.month}
                </button>
            </nav>
            <div class="buttons" @click=${this._dispatchSwitchDate}>
                <button type="button" name="previous" aria-label="Previous">«</button>
                <button type="button" name="next" aria-label="Next">»</button>
                <span class="separator"></span>
                <button type="button" name="today" @click=${this._handleTodayClick}>
                    ${t.today}
                </button>
            </div>
        </div>`}_handleTodayClick(e){e.stopPropagation();const t=/* @__PURE__ */new Date,n={day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()},r=new CustomEvent("jumptoday",{detail:{date:n},bubbles:!0,composed:!0});this.dispatchEvent(r)}_dispatchSwitchDate(e){const t=e.target;if(!(t instanceof HTMLButtonElement))return;const n=e.target===e.currentTarget?"container":t.name,r=new CustomEvent("switchdate",{detail:{direction:n},bubbles:!0,composed:!0});this.dispatchEvent(r)}_dispatchSwitchView(e){const t=e.target;if(!(t instanceof HTMLElement))return;const n=e.target===e.currentTarget?"container":t.dataset.context,r=new CustomEvent("switchview",{detail:{view:n},bubbles:!0,composed:!0});this.dispatchEvent(r)}};oi.styles=r`
        :host {
            display: block;
            container-type: inline-size;
        }

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

        .info {
            padding-left: var(--header-info-padding-left, 1em);
            text-align: right;
            display: grid;
        }

        @container (max-width: 600px) {
            .controls {
                font-size: small;
                height: auto;
                flex-wrap: wrap;
                justify-content: center;
                padding: 0.5em 0;
                gap: 0.35em;
            }
            .info {
                width: 100%;
                text-align: center;
                padding-left: 0;
            }
            .context,
            .buttons {
                flex-shrink: 0;
            }
            .buttons {
                padding-right: 0;
            }
        }

        .view-detail {
            grid-row: 2;
            grid-column: 1;
            visibility: hidden;
        }

        .view-detail.active {
            visibility: visible;
        }
        .day,
        .week,
        .month,
        .year {
            color: var(--header-text-color, rgba(0, 0, 0, 0.6));
        }
        button {
            padding: 0.4em 0.7em;
            margin: 0;
            border: none;
            background: none;
            font: inherit;
            font-size: 0.85em;
            color: var(--header-text-color, rgba(0, 0, 0, 0.6));
            cursor: pointer;
            border-radius: var(--border-radius-sm, 5px);
            transition: background-color 0.15s ease, color 0.15s ease;
        }

        button:hover {
            background: var(--separator-light, rgba(0, 0, 0, 0.1));
        }

        .context {
            display: flex;
            align-items: center;
            gap: 0;
            background: var(--separator-light, rgba(0, 0, 0, 0.06));
            border-radius: var(--border-radius-sm, 5px);
            padding: 0.15em;
        }

        .context button {
            border-radius: calc(var(--border-radius-sm, 5px) - 1px);
        }

        .context button[data-active] {
            background: var(--background-color, white);
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        }

        .buttons {
            display: flex;
            align-items: center;
            padding-right: var(--header-buttons-padding-right, 1em);
            gap: 0.15em;
        }

        .buttons .separator {
            width: 1px;
            height: 1.2em;
            background: var(--separator-light, rgba(0, 0, 0, 0.15));
            margin: 0 0.2em;
        }
    `,si([l({type:String})],oi.prototype,"heading",2),si([l({type:Object})],oi.prototype,"activeDate",2),si([l({type:String})],oi.prototype,"viewMode",2),si([l({type:Object})],oi.prototype,"expandedDate",2),si([l({type:String})],oi.prototype,"locale",2),oi=si([c("lms-calendar-header")],oi);var li=e=>Object.fromEntries(Object.entries(e).map(([e,t])=>[t,e])),ci={action:"ACTION",description:"DESCRIPTION",duration:"DURATION",repeat:"REPEAT",summary:"SUMMARY",trigger:"TRIGGER",attachments:"ATTACH",attendees:"ATTENDEE"};li(ci);li({method:"METHOD",prodId:"PRODID",version:"VERSION",name:"X-WR-CALNAME"});var di={alarms:"ALARM",categories:"CATEGORIES",created:"CREATED",description:"DESCRIPTION",lastModified:"LAST-MODIFIED",location:"LOCATION",exceptionDates:"EXDATE",recurrenceRule:"RRULE",stamp:"DTSTAMP",start:"DTSTART",summary:"SUMMARY",uid:"UID",timeTransparent:"TRANSP",url:"URL",end:"DTEND",duration:"DURATION",geo:"GEO",class:"CLASS",organizer:"ORGANIZER",priority:"PRIORITY",sequence:"SEQUENCE",status:"STATUS",attach:"ATTACH",recurrenceId:"RECURRENCE-ID",attendees:"ATTENDEE",comment:"COMMENT"};li(di);li({id:"TZID",lastModified:"LAST-MODIFIED",url:"TZURL"});li({comment:"COMMENT",name:"TZNAME",offsetFrom:"TZOFFSETFROM",offsetTo:"TZOFFSETTO",recurrenceDate:"RDATE",recurrenceRule:"RRULE",start:"DTSTART"});li({byDay:"BYDAY",byHour:"BYHOUR",byMinute:"BYMINUTE",byMonth:"BYMONTH",byMonthday:"BYMONTHDAY",bySecond:"BYSECOND",bySetPos:"BYSETPOS",byWeekNo:"BYWEEKNO",byYearday:"BYYEARDAY",count:"COUNT",frequency:"FREQ",interval:"INTERVAL",until:"UNTIL",workweekStart:"WKST"});li({categories:"CATEGORIES",created:"CREATED",description:"DESCRIPTION",lastModified:"LAST-MODIFIED",location:"LOCATION",exceptionDates:"EXDATE",recurrenceRule:"RRULE",stamp:"DTSTAMP",start:"DTSTART",summary:"SUMMARY",uid:"UID",url:"URL",duration:"DURATION",geo:"GEO",class:"CLASS",organizer:"ORGANIZER",priority:"PRIORITY",sequence:"SEQUENCE",status:"STATUS",attach:"ATTACH",recurrenceId:"RECURRENCE-ID",attendees:"ATTENDEE",comment:"COMMENT",completed:"COMPLETED",due:"DUE",percentComplete:"PERCENT-COMPLETE"});li({categories:"CATEGORIES",created:"CREATED",description:"DESCRIPTION",lastModified:"LAST-MODIFIED",exceptionDates:"EXDATE",recurrenceRule:"RRULE",stamp:"DTSTAMP",start:"DTSTART",summary:"SUMMARY",uid:"UID",url:"URL",geo:"GEO",class:"CLASS",organizer:"ORGANIZER",sequence:"SEQUENCE",status:"STATUS",attach:"ATTACH",recurrenceId:"RECURRENCE-ID",attendees:"ATTENDEE",comment:"COMMENT"});li({stamp:"DTSTAMP",start:"DTSTART",uid:"UID",url:"URL",organizer:"ORGANIZER",attendees:"ATTENDEE",comment:"COMMENT",end:"DTEND",freeBusy:"FREEBUSY"});var ui=/\r\n/,hi=e=>`${e}\r\n`,mi=(e,t,n)=>n?null==t?"":hi(`${e};${n}:${t}`):hi(`${e}:${t}`),fi=e=>{if(!(e.length<1))return`${e.map(e=>`${e.key}=${e.value}`).join(";")}`},yi=(e,t)=>t?`"MAILTO:${e}"`:`MAILTO:${e}`,pi=(e,t)=>{let n=fi([e.dir&&{key:"DIR",value:`"${e.dir}"`},e.delegatedFrom&&{key:"DELEGATED-FROM",value:yi(e.delegatedFrom,!0)},e.member&&{key:"MEMBER",value:yi(e.member,!0)},e.role&&{key:"ROLE",value:e.role},e.name&&{key:"CN",value:e.name},e.partstat&&{key:"PARTSTAT",value:e.partstat},e.sentBy&&{key:"SENT-BY",value:yi(e.sentBy,!0)},void 0!==e.rsvp&&(!0===e.rsvp||!1===e.rsvp)&&{key:"RSVP",value:!0===e.rsvp?"TRUE":"FALSE"}].filter(e=>!!e));return mi(t,yi(e.email),n)},gi=e=>{if(0===Object.values(e).filter(e=>"number"==typeof e).length)return;let t="";return e.before&&(t+="-"),t+="P",void 0!==e.weeks&&(t+=`${e.weeks}W`),void 0!==e.days&&(t+=`${e.days}D`),(void 0!==e.hours||void 0!==e.minutes||void 0!==e.seconds)&&(t+="T",void 0!==e.hours&&(t+=`${e.hours}H`),void 0!==e.minutes&&(t+=`${e.minutes}M`),void 0!==e.seconds&&(t+=`${e.seconds}S`)),t},bi=36e5,vi=/* @__PURE__ */Symbol.for("constructDateFrom");function wi(e,t){return"function"==typeof e?e(t):e&&"object"==typeof e&&vi in e?e[vi](t):e instanceof Date?new e.constructor(t):new Date(t)}function ki(e,t){return wi(t||e,e)}function Di(e,t,n){let r=ki(e,null==n?void 0:n.in);return isNaN(t)?wi((null==n?void 0:n.in)||e,NaN):(t&&r.setDate(r.getDate()+t),r)}function Si(e,t,n){let r=ki(e,void 0);if(isNaN(t))return wi(e,NaN);if(!t)return r;let a=r.getDate(),i=wi(e,r.getTime());return i.setMonth(r.getMonth()+t+1,0),a>=i.getDate()?i:(r.setFullYear(i.getFullYear(),i.getMonth(),a),r)}function xi(e,t,n){return wi(e,+ki(e)+t)}function Ti(e,t,n){return xi(e,t*bi)}var Ei={};function Mi(){return Ei}function Oi(e,t){var n,r,a,i;let s=Mi(),o=(null==t?void 0:t.weekStartsOn)??(null==(r=null==(n=null==t?void 0:t.locale)?void 0:n.options)?void 0:r.weekStartsOn)??s.weekStartsOn??(null==(i=null==(a=s.locale)?void 0:a.options)?void 0:i.weekStartsOn)??0,l=ki(e,null==t?void 0:t.in),c=l.getDay(),d=(c<o?7:0)+c-o;return l.setDate(l.getDate()-d),l.setHours(0,0,0,0),l}function $i(e,t,n){let r=ki(e,void 0);return r.setTime(r.getTime()+6e4*t),r}function Ni(e,t,n){return xi(e,1e3*t)}function Ci(e,t,n){return Di(e,7*t,n)}function Ii(e,t,n){return Si(e,12*t)}function _i(e,t){let n=+ki(e)-+ki(t);return n<0?-1:n>0?1:n}function Ai(e){return e instanceof Date||"object"==typeof e&&"[object Date]"===Object.prototype.toString.call(e)}function Ri(e,t){let n=ki(e,void 0),r=n.getMonth();return n.setFullYear(n.getFullYear(),r+1,0),n.setHours(23,59,59,999),n}function Li(e,t){let[n,r]=function(e,...t){let n=wi.bind(null,t.find(e=>"object"==typeof e));return t.map(n)}(0,t.start,t.end);return{start:n,end:r}}function zi(e,t){let n=ki(e,void 0);return n.setDate(1),n.setHours(0,0,0,0),n}function Wi(e,t){var n,r,a,i;let s=Mi(),o=(null==t?void 0:t.firstWeekContainsDate)??(null==(r=null==(n=null==t?void 0:t.locale)?void 0:n.options)?void 0:r.firstWeekContainsDate)??s.firstWeekContainsDate??(null==(i=null==(a=s.locale)?void 0:a.options)?void 0:i.firstWeekContainsDate)??1,l=function(e,t){var n,r,a,i;let s=ki(e,null==t?void 0:t.in),o=s.getFullYear(),l=Mi(),c=(null==t?void 0:t.firstWeekContainsDate)??(null==(r=null==(n=null==t?void 0:t.locale)?void 0:n.options)?void 0:r.firstWeekContainsDate)??l.firstWeekContainsDate??(null==(i=null==(a=l.locale)?void 0:a.options)?void 0:i.firstWeekContainsDate)??1,d=wi((null==t?void 0:t.in)||e,0);d.setFullYear(o+1,0,c),d.setHours(0,0,0,0);let u=Oi(d,t),h=wi((null==t?void 0:t.in)||e,0);h.setFullYear(o,0,c),h.setHours(0,0,0,0);let m=Oi(h,t);return+s>=+u?o+1:+s>=+m?o:o-1}(e,t),c=wi((null==t?void 0:t.in)||e,0);return c.setFullYear(l,0,o),c.setHours(0,0,0,0),Oi(c,t)}function Fi(e,t){return ki(e,void 0).getDay()}function Vi(e,t){let n=ki(e,void 0),r=n.getFullYear(),a=n.getMonth(),i=wi(n,0);return i.setFullYear(r,a+1,0),i.setHours(0,0,0,0),i.getDate()}function ji(e,t){return ki(e,void 0).getMonth()}function Yi(e,t,n){let r=ki(e,null==n?void 0:n.in),a=function(e,t){let n=ki(e,null==t?void 0:t.in),r=+Oi(n,t)-+Wi(n,t);return Math.round(r/6048e5)+1}(r,n)-t;return r.setDate(r.getDate()-7*a),ki(r,null==n?void 0:n.in)}function Ui(e,t,n){var r,a,i,s;let o=Mi(),l=(null==n?void 0:n.weekStartsOn)??(null==(a=null==(r=null==n?void 0:n.locale)?void 0:r.options)?void 0:a.weekStartsOn)??o.weekStartsOn??(null==(s=null==(i=o.locale)?void 0:i.options)?void 0:s.weekStartsOn)??0,c=ki(e,null==n?void 0:n.in),d=c.getDay(),u=7-l;return Di(c,t<0||t>6?t-(d+u)%7:((t%7+7)%7+u)%7-(d+u)%7,n)}function Zi(e,t,n){let r=+ki(e,void 0),[a,i]=[+ki(t.start,void 0),+ki(t.end,void 0)].sort((e,t)=>e-t);return r>=a&&r<=i}var Hi=["SU","MO","TU","WE","TH","FR","SA"],qi=(e,t)=>void 0!==t&&e>=t,Pi=(e,t,n,r)=>{let a=n.map(({day:e,occurrence:t})=>({occurrence:t,day:Hi.indexOf(e)}));return"YEARLY"===e.frequency?e.byYearday||e.byMonthday?t.map(e=>e.filter(e=>a.find(({day:t})=>t===Fi(e)))):e.byWeekNo?t.map(e=>e.flatMap(e=>a.map(({day:t})=>Ui(e,t,{weekStartsOn:r})))):e.byMonth?t.map(e=>e.flatMap(e=>a.flatMap(({day:t,occurrence:n})=>Bi(Gi(zi(e)),Gi(Ri(e)),t,r,n)))):t.map(e=>e.flatMap(e=>a.flatMap(({day:t,occurrence:n})=>Bi(Gi(function(e){let t=ki(e,void 0);return t.setFullYear(t.getFullYear(),0,1),t.setHours(0,0,0,0),t}(e)),Gi(function(e){let t=ki(e,void 0),n=t.getFullYear();return t.setFullYear(n+1,0,0),t.setHours(23,59,59,999),t}(e)),t,r,n)))):"MONTHLY"===e.frequency?e.byMonthday?t.map(e=>e.filter(e=>a.find(({day:t})=>t===Fi(e)))):t.map(e=>e.flatMap(e=>a.flatMap(({day:t,occurrence:n})=>Bi(Gi(zi(e)),Gi(Ri(e)),t,r,n)))):"WEEKLY"===e.frequency?t.map(e=>e.flatMap(e=>a.map(({day:t})=>Ui(e,t,{weekStartsOn:r})))):t.map(e=>e.filter(e=>a.find(({day:t})=>t===Fi(e))))},Bi=(e,t,n,r,a)=>{if(void 0!==a){if(!(a<0)){let t=Ui(e,n,{weekStartsOn:r});return Ci(t,(a||1)-1+(e>t?1:0))}let i=Ui(t,n,{weekStartsOn:r});return Gi(function(e){let t=ki(e,void 0);return t.setHours(0,0,0,0),t}(function(e,t,n){return Ci(e,-t,n)}(i,-(a||1)-1+(t<i?1:0))))}return function(e){let{start:t,end:n}=Li(0,e),r=+t>+n,a=r?+t:+n,i=r?n:t;i.setHours(0,0,0,0);let s=[];for(;+i<=a;)s.push(wi(t,i)),i.setDate(i.getDate()+1),i.setHours(0,0,0,0);return r?s.reverse():s}({start:e,end:t}).map(e=>Gi(e)).filter(n=>Zi(n,{start:e,end:t})).filter(e=>n===Fi(e))},Gi=e=>$i(e,-e.getTimezoneOffset()),Ki=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=ki(e,void 0);return n.setHours(t),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(function(e){return ki(e,void 0).getHours()}(e)))),Ji=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency||"HOURLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=ki(e,void 0);return n.setMinutes(t),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(function(e){return ki(e,void 0).getMinutes()}(e)))),Qi=(e,t,n)=>"YEARLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=ki(e,void 0),r=n.getFullYear(),a=n.getDate(),i=wi(e,0);i.setFullYear(r,t,15),i.setHours(0,0,0,0);let s=Vi(i);return n.setMonth(t,Math.min(a,s)),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(ji(e)))),Xi=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency?t.map(e=>e.flatMap(e=>{let t=Vi(e);return n.map(n=>n>t?void 0:function(e,t){let n=ki(e,void 0);return n.setDate(t),n}(e,n)).filter(e=>!!e)})):"WEEKLY"===e.frequency?t:t.map(e=>e.filter(e=>n.includes(ji(e)))),es=(e,t,n)=>"YEARLY"===e.frequency||"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency||"HOURLY"===e.frequency||"MINUTELY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=ki(e,void 0);return n.setSeconds(t),n}(e,t)))):t.map(e=>e.filter(e=>n.includes(function(e){return ki(e).getSeconds()}(e)))),ts=(e,t,n)=>"YEARLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>function(e,t){let n=ki(e,void 0);return n.setMonth(0),n.setDate(t),n}(e,t)))):"MONTHLY"===e.frequency||"WEEKLY"===e.frequency||"DAILY"===e.frequency?t:t.map(e=>e.filter(e=>n.includes(function(e){return ki(e,void 0).getFullYear()}(e)))),ns=(e,t,n)=>{let r=n;return e.byMonth&&(r=Qi(e,r,e.byMonth)),e.byWeekNo&&(r=((e,t,n,r)=>"YEARLY"===e.frequency?t.map(e=>e.flatMap(e=>n.map(t=>Yi(e,t,{weekStartsOn:r})))):t)(e,r,e.byWeekNo,t.weekStartsOn)),e.byYearday&&(r=ts(e,r,e.byYearday)),e.byMonthday&&(r=Xi(e,r,e.byMonthday)),e.byDay&&(r=Pi(e,r,e.byDay,t.weekStartsOn)),e.byHour&&(r=Ki(e,r,e.byHour)),e.byMinute&&(r=Ji(e,r,e.byMinute)),e.bySecond&&(r=es(e,r,e.bySecond)),e.bySetPos&&(r=((e,t,n)=>e.byYearday||e.byWeekNo||e.byMonthday||e.byMonth||e.byDay||e.byHour||e.byMinute||e.bySecond?t.map(e=>e.sort(_i).filter((t,r)=>n.some(t=>t>0?0!==r&&r%t===0:0===r?e.length-1+t===0:r%(e.length-1+t)===0))):t)(e,r,e.bySetPos)),r.map(e=>e.sort(_i).filter(e=>!(t.exceptions.length>0&&t.exceptions.some(t=>function(e,t){return+ki(e)==+ki(t)}(t,e))||!Zi(e,{start:t.start,end:t.end}))))},rs=(e,t)=>{var n;let r=t.start,a=(null==(n=e.until)?void 0:n.date)||(null==t?void 0:t.end)||Ii(r,2),i=t.exceptions||[],s=(e.workweekStart?Hi.indexOf(e.workweekStart):1)%7,o=[[r]];((e,{start:t,end:n},r)=>{if(qi(r.length,e.count))return;let a=e.frequency,i=e.interval||1;if(!a)return;let s=t;if("SECONDLY"!==a)if("MINUTELY"!==a)if("HOURLY"!==a)if("DAILY"!==a)if("WEEKLY"!==a)if("MONTHLY"!==a)if("YEARLY"!==a);else for(;s<n;)s=Ii(s,i),r.push([s]);else for(;s<n;)s=Si(s,i),r.push([s]);else for(;s<n;){if(qi(r.length,e.count))return;s=Ci(s,i),r.push([s])}else for(;s<n;){if(qi(r.length,e.count))return;s=Di(s,i),r.push([s])}else for(;s<n;){if(qi(r.length,e.count))return;s=Ti(s,i),r.push([s])}else for(;s<n;){if(qi(r.length,e.count))return;s=$i(s,i),r.push([s])}else for(;s<n;){if(qi(r.length,e.count))return;s=Ni(s,i),r.push([s])}})(e,{start:r,end:a},o);let l=ns(e,{start:r,end:a,exceptions:i,weekStartsOn:s},o);return e.count?l.flat().splice(0,e.count):l.flat()},as=e=>{let t="+"===e[0]?1:-1;return 1e3*(60*(60*Number(e.slice(1,3))+(e.length>3?Number(e.slice(3,5)):0))+(e.length>5?Number(e.slice(5,7)):0))*t},is=(e,t,n)=>{let r=null==n?void 0:n.find(e=>e.id===t);if(r){let t=((e,t)=>t.flatMap(t=>!t.recurrenceRule||t.recurrenceRule.until&&t.recurrenceRule.until.date<e?t:rs(t.recurrenceRule,{start:t.start,end:e}).map(e=>({...t,start:e}))))(e,r.props).sort((e,t)=>_i(e.start,t.start));for(let r=0;r<t.length;r+=1)if(e<t[r].start){let e=t[r-1]?t[r-1].offsetTo:t[r].offsetFrom,n=e.length>5?e.substring(0,5):e;return{offset:n,milliseconds:as(n)}}let n=t[t.length-1].offsetTo,a=n.length>5?n.substring(0,5):n;return{offset:a,milliseconds:as(a)}}let a=((e,t)=>{let n="en-US",r=new Date(t.toLocaleString(n,{timeZone:"UTC"}));try{return new Date(t.toLocaleString(n,{timeZone:e})).getTime()-r.getTime()}catch{return t.getTime()-r.getTime()}})(t,e);if(!Number.isNaN(a)){let e=a<0,t=Math.abs(function(e){let t=e/bi;return Math.trunc(t)}(a)),n=Math.abs(function(e){let t=e/6e4;return Math.trunc(t)}(a))-60*t;return{offset:`${e?"-":"+"}${1===t.toString().length?`0${t}`:t.toString()}${1===n.toString().length?`0${n}`:n.toString()}`,milliseconds:a}}},ss=e=>{if(!Ai(e))throw Error(`Incorrect date object: ${e}`);let t=e.toISOString();return`${t.slice(0,4)}${t.slice(5,7)}${t.slice(8,10)}`},os=e=>{if(!Ai(e))throw Error(`Incorrect date object: ${e}`);return ls(e)},ls=(e,t)=>{let n=e.toISOString();return`${n.slice(0,4)}${n.slice(5,7)}${n.slice(8,10)}T${n.slice(11,13)}${n.slice(14,16)}${n.slice(17,19)}${t?"":"Z"}`},cs=e=>Object.keys(e),ds=e=>{let t="X-";for(let n of e)n===n.toUpperCase()&&(t+="-"),t+=n.toUpperCase();return t},us=(e,t)=>{let n=[],r="",a=0;for(let i=0;i<e.length;i++){let s=e[i],o="\n"===s?2:1;a+o>t?(n.push(0===n.length?r:` ${r}`),r=s,a=o):(r+=s,a+=o)}return r&&n.push(0===n.length?r:` ${r}`),n},hs=(e,t)=>{let n=cs(e),r=t.childComponents,a=r?cs(r):[],i=t.generateArrayValues,s=i?cs(i):[],o="";return o+=(e=>hi(`BEGIN:${e}`))(t.icsComponent),n.forEach(n=>{if(a.includes(n)||s.includes(n)||"nonStandard"===n)return;let r=t.icsKeyMap[n];if(!r)return;let i=e[n];if(null==i)return;let l=t.generateValues[n];o+=l?l({icsKey:r,value:i,key:n}):mi(r,String(i))}),r&&a&&a.length>0&&a.forEach(t=>{let n=e[t];!n||!Array.isArray(n)||0===n.length||n.forEach(e=>{let n=r[t];n&&(o+=n(e))})}),i&&s&&s.length>0&&s.forEach(n=>{let r=i[n];if(!r)return;let a=t.icsKeyMap[n];if(!a)return;let s=e[n];!s||!Array.isArray(s)||0===s.length||s.forEach(e=>{o+=r({icsKey:a,value:e})})}),e.nonStandard&&(o+=((e,t)=>{if(!e)return"";let n="";return Object.entries(e).forEach(([e,r])=>{let a=null==t?void 0:t[e];if(!a)return void(n+=mi(ds(e),null==r?void 0:r.toString()));let i=a.generate(r);i&&(n+=mi(a.name,i.value,i.options?fi(Object.entries(i.options).map(([e,t])=>({key:e,value:t}))):void 0))}),n})(e.nonStandard,null==t?void 0:t.nonStandard)),o+=(e=>hi(`END:${e}`))(t.icsComponent),null!=t&&t.skipFormatLines?o:(e=>{let t=e.split(ui),n=[];return t.forEach(e=>{(e=>{let t=(e.match(/\n/g)||[]).length;return e.length+t})(e)<75?n.push(e):us(e,75).forEach(e=>{n.push(e)})}),n.join("\r\n")})(o)},ms=(e,t)=>mi(e,Math.trunc(t).toString()),fs=(e,t)=>hs(e,{icsComponent:"VALARM",icsKeyMap:ci,generateValues:{trigger:({value:e})=>(e=>{var t,n;let r=fi([(null==(t=e.options)?void 0:t.related)&&{key:"RELATED",value:e.options.related}].filter(e=>!!e));return"absolute"===e.type?mi("TRIGGER",os(null==(n=e.value)?void 0:n.date)):"relative"===e.type?mi("TRIGGER",gi(e.value),r):void 0})(e),duration:({icsKey:e,value:t})=>mi(e,gi(t)),repeat:({icsKey:e,value:t})=>ms(e,t)},generateArrayValues:{attendees:({value:e})=>pi(e,"ATTENDEE"),attachments:({value:e})=>(e=>{if("uri"===e.type){let t=fi([e.formatType&&{key:"FMTTYPE",value:e.formatType}].filter(e=>!!e));return mi("ATTACH",e.url,t)}if("binary"===e.type){let t=fi([e.value&&{key:"VALUE",value:e.value},e.encoding&&{key:"ENCODING",value:e.encoding}].filter(e=>!!e));return mi("ATTACH",e.binary,t)}throw Error(`IcsAttachment has no type! ${JSON.stringify(e)}`)})(e)},nonStandard:null==t?void 0:t.nonStandard,skipFormatLines:null==t?void 0:t.skipFormatLines}),ys=(e,t,n=[],r)=>{let a=fi([t.type&&{key:"VALUE",value:t.type},t.local&&!(null!=r&&r.forceUtc)&&{key:"TZID",value:t.local.timezone},...n].filter(e=>!!e)),i="DATE"===t.type?ss(t.date):!t.local||null!=r&&r.forceUtc?os(t.date):((e,t,n)=>{let r=t.date;if(!Ai(r))throw Error(`Incorrect date object: ${r}`);return is(r,t.timezone,n)?ls(r,!0):os(e)})(t.date,t.local,null==r?void 0:r.timezones);return mi(e,i,a)},ps=(e,t,n)=>mi(e,(e=>e.replace(/([\\;,])|(\n)/g,(e,t)=>t?`\\${t}`:"\\n"))(t),n?fi(n):void 0),gs=(e,t)=>hs(e,{icsComponent:"VEVENT",icsKeyMap:di,generateValues:{stamp:({icsKey:e,value:t})=>ys(e,t,void 0,{timezones:void 0,forceUtc:!0}),start:({icsKey:e,value:t})=>ys(e,t,void 0,{timezones:void 0}),end:({icsKey:e,value:t})=>ys(e,t,void 0,{timezones:void 0}),created:({icsKey:e,value:t})=>ys(e,t,void 0,{timezones:void 0}),lastModified:({icsKey:e,value:t})=>ys(e,t,void 0,{timezones:void 0}),categories:({icsKey:e,value:t})=>mi(e,t.join(",")),description:({icsKey:t,value:n})=>ps(t,n,e.descriptionAltRep?[{key:"ALTREP",value:`"${e.descriptionAltRep}"`}]:void 0),location:({icsKey:e,value:t})=>ps(e,t),comment:({icsKey:e,value:t})=>ps(e,t),summary:({icsKey:e,value:t})=>ps(e,t),recurrenceRule:({value:e})=>(e=>{var t;let n="",r=fi([e.frequency&&{key:"FREQ",value:e.frequency},e.byDay&&{key:"BYDAY",value:e.byDay.map(e=>(e=>e.occurrence?`${e.occurrence}${e.day}`:e.day)(e)).join(",")},e.byHour&&{key:"BYHOUR",value:e.byHour.join(",")},e.byMinute&&{key:"BYMINUTE",value:e.byMinute.join(",")},e.byMonth&&{key:"BYMONTH",value:e.byMonth.map(e=>e+1).join(",")},e.byMonthday&&{key:"BYMONTHDAY",value:e.byMonthday.join(",")},e.bySecond&&{key:"BYSECOND",value:e.bySecond.join(",")},e.bySetPos&&{key:"BYSETPOS",value:e.bySetPos.join(",")},e.byWeekNo&&{key:"BYWEEKNO",value:e.byWeekNo.join(",")},e.byYearday&&{key:"BYYEARDAY",value:e.byYearday.join(",")},e.count&&{key:"COUNT",value:e.count.toString()},e.interval&&{key:"INTERVAL",value:e.interval.toString()},e.until&&{key:"UNTIL",value:"DATE"===e.until.type?ss(e.until.date):os((null==(t=e.until.local)?void 0:t.date)||e.until.date)},e.workweekStart&&{key:"WKST",value:e.workweekStart}].filter(e=>!!e));return n+=mi("RRULE",r),n})(e),duration:({icsKey:e,value:t})=>mi(e,gi(t)),organizer:({value:e})=>(e=>{let t=fi([e.dir&&{key:"DIR",value:`"${e.dir}"`},e.name&&{key:"CN",value:e.name},e.sentBy&&{key:"SENT-BY",value:yi(e.sentBy)}].filter(e=>!!e));return mi("ORGANIZER",yi(e.email),t)})(e),sequence:({icsKey:e,value:t})=>ms(e,t),recurrenceId:({value:e})=>((e,t)=>{let n="";return n+=ys("RECURRENCE-ID",e.value,e.range?[{key:"RANGE",value:e.range}]:void 0,t),n})(e,{timezones:void 0})},generateArrayValues:{attendees:({value:e})=>pi(e,"ATTENDEE"),exceptionDates:({value:e})=>((e,t,n)=>ys(t,e,void 0,n))(e,"EXDATE",{timezones:void 0})},childComponents:{alarms:e=>fs(e,{nonStandard:void 0,skipFormatLines:!0})},nonStandard:void 0,skipFormatLines:void 0}),bs=Object.defineProperty,vs=Object.getOwnPropertyDescriptor,ws=(e,t,n,r)=>{for(var a,i=r>1?void 0:r?vs(t,n):t,s=e.length-1;s>=0;s--)(a=e[s])&&(i=(r?a(t,n,i):a(i))||i);return r&&i&&bs(t,n,i),i};let ks=class extends a{constructor(){super(...arguments),this.open=!1,this.eventDetails={heading:"",content:"",time:""},this.locale="en",this._cardTop=0,this._cardLeft=0,this._positioned=!1,this._handleKeydown=e=>{if("Tab"!==e.key)return;const t=Array.from(this.renderRoot.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));if(0===t.length)return;const n=t[0],r=t[t.length-1];e.shiftKey?this.renderRoot.activeElement===n&&(e.preventDefault(),r.focus()):this.renderRoot.activeElement===r&&(e.preventDefault(),n.focus())},this._handleClose=()=>{this.open=!1,this.dispatchEvent(new CustomEvent("menu-close",{bubbles:!0,composed:!0}))},this._handleExport=()=>{const{heading:e,content:t,time:n,date:r}=this.eventDetails,a=r?.year??2025,i=(r?.month??4)-1,s=r?.day??18;let o,l;if("string"==typeof n){const e=n.match(/(\d{2}):(\d{2}) - (\d{2}):(\d{2})/);e&&(o={date:new Date(a,i,s,parseInt(e[1]),parseInt(e[2]))},l={date:new Date(a,i,s,parseInt(e[3]),parseInt(e[4]))})}const c={start:{date:o&&o.date||new Date(a,i,s,12,0)},end:{date:l&&l.date||new Date(a,i,s,13,0)},summary:e,description:t,status:"CONFIRMED",uid:`${Date.now()}@lms-calendar`,stamp:{date:/* @__PURE__ */new Date}},d=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//LMS Calendar//EN",gs(c).trim(),"END:VCALENDAR"].join("\r\n"),u=new Blob([d],{type:"text/calendar"}),h=URL.createObjectURL(u),m=document.createElement("a");m.href=h,m.download=`${e||"event"}.ics`,document.body.appendChild(m),m.click(),setTimeout(()=>{document.body.removeChild(m),URL.revokeObjectURL(h)},0)}}updated(e){(e.has("open")||e.has("anchorRect"))&&this.open&&this.anchorRect&&(this._positioned=!1,this._computePosition(),requestAnimationFrame(()=>{const e=this.renderRoot.querySelector(".close-btn");e?.focus()}))}_computePosition(){requestAnimationFrame(()=>{const e=this.renderRoot.querySelector(".card"),t=this.parentElement;if(!e||!t||!this.anchorRect)return;const n=t.getBoundingClientRect(),r=e.getBoundingClientRect(),a=this.anchorRect.top-n.top,i=this.anchorRect.left-n.left,s=i+this.anchorRect.width,o=a+this.anchorRect.height/2,l=r.width||260,c=r.height||200;let d;d=s+8+l<=n.width?s+8:i-8-l>=0?i-8-l:Math.max(8,(n.width-l)/2);let u=o-c/2;u=Math.max(8,Math.min(u,n.height-c-8)),this._cardTop=u,this._cardLeft=d,this._positioned=!0})}_formatDate(e){return new Date(e.year,e.month-1,e.day).toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"})}render(){const e=Xa(this.locale),t="card"+(this._positioned?" visible":""),n=this.eventDetails.content&&this.eventDetails.content!==e.noContent;return i`
            <div
                class=${t}
                role="dialog"
                aria-modal="true"
                aria-label=${e.eventDetails}
                style="top: ${this._cardTop}px; left: ${this._cardLeft}px;"
                @keydown=${this._handleKeydown}
            >
                <div class="header">
                    <span class="title"
                        >${this.eventDetails.heading||e.noTitle}</span
                    >
                    <button
                        type="button"
                        class="close-btn"
                        @click=${this._handleClose}
                        title=${e.close}
                        aria-label=${e.close}
                    >
                        &times;
                    </button>
                </div>
                <div class="meta">
                    ${this.eventDetails.time||e.noTime}
                </div>
                ${this.eventDetails.date?i`<div class="meta">
                              ${this._formatDate(this.eventDetails.date)}
                          </div>`:s}
                ${n?i`<div class="notes">${this.eventDetails.content}</div>`:s}
                <div class="actions">
                    <button
                        type="button"
                        class="export-btn"
                        @click=${this._handleExport}
                        title=${e.exportAsICS}
                    >
                        ${e.exportAsICS}
                    </button>
                </div>
            </div>
        `}};ks.styles=r`
        :host {
            position: absolute;
            inset: 0;
            z-index: 10000;
            pointer-events: none;
            display: none;
        }
        :host([open]) {
            display: block;
        }
        .card {
            position: absolute;
            pointer-events: auto;
            background: var(--background-color);
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--separator-light);
            font-family: var(--system-ui);
            min-width: 16em;
            max-width: 22em;
            padding: 0.875em 1em;
            opacity: 0;
            transform: scale(0.95);
            transition:
                opacity 0.15s ease,
                transform 0.15s ease;
        }
        .card.visible {
            opacity: 1;
            transform: scale(1);
        }
        .header {
            display: flex;
            align-items: flex-start;
            gap: 0.5em;
            margin-bottom: 0.25em;
        }
        .title {
            flex: 1;
            font-size: 1em;
            font-weight: 600;
            color: var(--separator-dark);
            line-height: 1.3;
            word-break: break-word;
        }
        .close-btn {
            flex-shrink: 0;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.125em;
            line-height: 1;
            padding: 0.15em 0.25em;
            margin: -0.15em -0.25em 0 0;
            border-radius: var(--border-radius-sm);
            color: var(--header-text-color);
            transition: background-color 0.15s;
        }
        .close-btn:hover {
            background-color: var(--separator-light);
        }
        .meta {
            font-size: 0.8125em;
            color: var(--header-text-color);
            line-height: 1.5;
        }
        .notes {
            margin-top: 0.5em;
            padding-top: 0.625em;
            border-top: 1px solid var(--separator-light);
            font-size: 0.8125em;
            color: var(--separator-dark);
            word-break: break-word;
            line-height: 1.4;
        }
        .actions {
            padding-top: 0.625em;
        }
        .export-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-family: var(--system-ui);
            font-size: 0.8125em;
            font-weight: 500;
            color: var(--primary-color);
            padding: 0;
            transition: opacity 0.15s;
        }
        .export-btn:hover {
            opacity: 0.7;
        }
    `,ws([l({type:Boolean,reflect:!0})],ks.prototype,"open",2),ws([l({type:Object})],ks.prototype,"eventDetails",2),ws([l({attribute:!1})],ks.prototype,"anchorRect",2),ws([l({type:String})],ks.prototype,"locale",2),ws([d()],ks.prototype,"_cardTop",2),ws([d()],ks.prototype,"_cardLeft",2),ws([d()],ks.prototype,"_positioned",2),ks=ws([c("lms-menu")],ks);class Ds{constructor({date:e,direction:t}){e&&(this.date=e),this._direction=t}set date(e){const t=Cr.fromObject(e);if(!t.isValid)throw new Error("date couldn't be converted to DateTime object");this._date=t}set direction(e){this._direction=e}_toCalendarDate(e){return{day:e.day,month:e.month,year:e.year}}getDateByDayInDirection(){if(!this._date||!this._date.isValid)throw new Error("date is not set or invalid");if(!this._direction)throw new Error("direction is not set");const e=this._date.plus({days:"next"===this._direction?1:-1});if(!e.isValid)throw new Error("generated date is invalid");return this._date=e,this._toCalendarDate(e)}getDateByMonthInDirection(){if(!this._date||!this._date.isValid)throw new Error("date is not set");if(!this._direction)throw new Error("direction is not set");const e=this._date.plus({months:"next"===this._direction?1:-1});if(!e.isValid)throw new Error("generated date is invalid");return this._date=e,this._toCalendarDate(e)}}var Ss=Object.defineProperty,xs=Object.getOwnPropertyDescriptor,Ts=(e,t,n,r)=>{for(var a,i=r>1?void 0:r?xs(t,n):t,s=e.length-1;s>=0;s--)(a=e[s])&&(i=(r?a(t,n,i):a(i))||i);return r&&i&&Ss(t,n,i),i};let Es=class extends a{constructor(){super(...arguments),this.currentDate=/* @__PURE__ */new Date,this.activeDate={day:this.currentDate.getDate(),month:this.currentDate.getMonth()+1,year:this.currentDate.getFullYear()},this.firstDayOfWeek=1,this.locale="en"}connectedCallback(){super.connectedCallback(),this.addEventListener("open-menu",e=>{const t=e;if(e.target!==this){e.stopPropagation();const n=new CustomEvent("open-menu",{detail:t.detail,bubbles:!0,composed:!0});this.dispatchEvent(n)}}),this._setupScrollDetection()}_setupScrollDetection(){let e=null;this.updateComplete.then(()=>{const t=this.shadowRoot?.querySelectorAll(".day");t?.forEach(t=>{const n=t;n.addEventListener("scroll",()=>(t=>{e||(e=requestAnimationFrame(()=>{t.scrollTop>5?t.classList.add("scrolled"):t.classList.remove("scrolled"),e=null}))})(n),{passive:!0})})})}_isCurrentDate(e){return new Date(e).toDateString()===this.currentDate.toDateString()}_renderIndicator({year:e,month:t,day:n}){const r=this._isCurrentDate(`${e}/${t}/${n}`);return i` <div
            class="indicator ${u({current:r})}"
        >
            ${1===n?za(n,t,e,this.locale):n}
        </div>`}render(){return i`
            <div class="month">
                ${this._getCalendarArray()?.map(({year:e,month:t,day:n})=>i`<div
                            class="day"
                            data-date="${e}-${t}-${n}"
                            @click=${this._dispatchExpand}
                            @keydown=${this._handleKeydown}
                            tabindex="0"
                        >
                            ${this._renderIndicator({year:e,month:t,day:n})}
                            <slot name="${e}-${t}-${n}"></slot>
                        </div>`)}
            </div>
        `}_dispatchExpand(e){const t=e.target;if(!(t instanceof HTMLElement))return;if(t.closest("lms-calendar-entry"))return;const{date:n}=t.dataset;if(!n)return;const[r,a,i]=n.split("-").map(e=>parseInt(e,10)),s=new CustomEvent("expand",{detail:{date:{day:i,month:a,year:r}},bubbles:!0,composed:!0});this.dispatchEvent(s)}_handleKeydown(e){const t=e.key;"Space"!==t&&"Enter"!==t||this._dispatchExpand(e)}_getDaysInMonth(e){return Oa(e).with({year:Ta.number,month:Ta.number,day:Ta.number},({year:e,month:t})=>{const n=new Date(e,t,0).getDate();return n>0?n:0}).otherwise(()=>0)}_getOffsetOfFirstDayInMonth(e){return function(e,t){return Fa(new Date(e.year,e.month-1,1).getDay(),t)}(e,this.firstDayOfWeek)}_getDatesInMonthAsArray(e,t){return Oa(this._getDaysInMonth(e)).with(0,()=>[]).otherwise(n=>Array.from(Array(n).keys(),(t,n)=>({year:e.year,month:e.month,day:n+1})).slice(...t||[0]))}_getCalendarArray(){if(!this.activeDate)return[];const e=new Ds({date:this.activeDate});try{e.direction="previous";const t=this._getOffsetOfFirstDayInMonth(this.activeDate),n=t>0?this._getDatesInMonthAsArray(e.getDateByMonthInDirection(),[-t]):[],r=this._getDatesInMonthAsArray(this.activeDate,[]);e.date=this.activeDate,e.direction="next";const a=42-(n.length+r.length),i=a>0?this._getDatesInMonthAsArray(e.getDateByMonthInDirection(),[0,a]):[];return n.concat(r,i)}catch(t){return console.error("Error generating calendar array:",t),[]}}};Es.styles=r`
        .month {
            height: calc(100% - var(--context-height, 1.75em) - var(--context-padding, 0.25em) * 2);
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
            overflow-y: auto;
            gap: var(--month-day-gap, 1px);
            min-width: 0;
        }

        /* Ensure consistent multi-day event layering */
        ::slotted(lms-calendar-entry) {
            position: relative;
            margin-left: 1em;
            width: calc(100% - 1em);
        }

        .indicator.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .indicator {
            position: sticky;
            top: 0.25em;
            left: 0.25em;
            z-index: 500;
            background: transparent;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            text-align: left;
            min-height: 2em;
            line-height: 2em;
            margin: 0.25em;
            border-radius: 1em;
            align-self: flex-start;
            transition: opacity 0.2s ease-in-out;
            opacity: 1;
            padding: 0 0.25em;
            white-space: nowrap;
        }

        .day.scrolled .indicator {
            opacity: 0;
        }
    `,Ts([l({attribute:!1})],Es.prototype,"activeDate",2),Ts([l({type:Number})],Es.prototype,"firstDayOfWeek",2),Ts([l({type:String})],Es.prototype,"locale",2),Es=Ts([c("lms-calendar-month")],Es);var Ms=Object.defineProperty,Os=Object.getOwnPropertyDescriptor,$s=(e,t,n,r)=>{for(var a,i=r>1?void 0:r?Os(t,n):t,s=e.length-1;s>=0;s--)(a=e[s])&&(i=(r?a(t,n,i):a(i))||i);return r&&i&&Ms(t,n,i),i};let Ns=class extends a{constructor(){super(...arguments),this.activeDate={day:/* @__PURE__ */(new Date).getDate(),month:/* @__PURE__ */(new Date).getMonth()+1,year:/* @__PURE__ */(new Date).getFullYear()},this.allDayRowCount=0,this.firstDayOfWeek=1,this.locale="en"}connectedCallback(){super.connectedCallback()}_getWeekDates(){return Va(this.activeDate,this.firstDayOfWeek)}_isCurrentDate(e){const t=/* @__PURE__ */new Date;return e.day===t.getDate()&&e.month===t.getMonth()+1&&e.year===t.getFullYear()}render(){const e=this._getWeekDates(),t=ja(this.firstDayOfWeek),n=this.allDayRowCount>0,r=n?Math.max(2.5,2*this.allDayRowCount)+1:0,a=n?`calc(var(--main-content-height) - ${r}em)`:"var(--main-content-height)";return i`
            <div class="week-container">
                <div class="week-header">
                    <div class="time-header"></div>
                    ${e.map((e,n)=>i`
                            <div
                                class="day-label ${u({current:this._isCurrentDate(e)})}"
                                tabindex="0"
                                role="button"
                                aria-label="Switch to day view for ${Wa(t[n],this.locale)}, ${e.day}"
                                @click=${()=>this._handleDayLabelClick(e)}
                                @keydown=${t=>this._handleDayLabelKeydown(t,e)}
                            >
                                <span class="day-name">${Wa(t[n],this.locale)}</span>
                                <span class="day-number">${e.day}</span>
                            </div>
                        `)}
                </div>

                <!-- All-day events section -->
                <div
                    class="all-day-wrapper ${u({collapsed:!n})}"
                >
                    <div class="all-day-container">
                        <div class="all-day-time-header">${Xa(this.locale).allDay}</div>
                        ${e.map(e=>i`
                                <div class="all-day-day-column">
                                    <slot
                                        name="all-day-${e.year}-${e.month}-${e.day}"
                                    ></slot>
                                </div>
                            `)}
                    </div>
                </div>
                <div class="week-content" style="height: ${a}">
                    <!-- Hour indicators -->
                    ${Array.from({length:25}).map((e,t)=>i`
                            <div
                                class="hour-indicator"
                                style="grid-column: 1; grid-row: ${60*t+1};"
                            >
                                ${this._renderIndicatorValue(t)}
                            </div>
                        `)}

                    <!-- Hour separators -->
                    ${Array.from({length:25}).map((e,t)=>i`
                            ${t>0?i`
                                      <div
                                          class="hour-separator"
                                          style="grid-column: 2 / -1; grid-row: ${60*t};"
                                      ></div>
                                  `:""}
                        `)}

                    <!-- Hour slots for each day -->
                    ${e.map((e,t)=>i`
                            ${Array.from({length:25}).map((n,r)=>i`
                                    <div
                                        class="hour-slot-container"
                                        style="grid-column: ${t+2}; grid-row: ${60*r+1} / ${60*(r+1)+1}; position: relative;"
                                    >
                                        <slot
                                            name="${e.year}-${e.month}-${e.day}-${r}"
                                            data-debug="Day ${t+1} (${e.month}/${e.day}) Hour ${r}"
                                        ></slot>
                                    </div>
                                `)}
                        `)}

                    <!-- Fallback slot for direct grid positioned entries -->
                    <slot
                        name="week-direct-grid"
                        style="display: contents;"
                    ></slot>
                </div>
            </div>
        `}_renderIndicatorValue(e){return e<10?`0${e}:00`:`${e}:00`}_handleDayLabelClick(e){const t=new CustomEvent("expand",{detail:{date:e},bubbles:!0,composed:!0});this.dispatchEvent(t)}_handleDayLabelKeydown(e,t){"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),this._handleDayLabelClick(t))}};function Cs(e){let t=0,n=0,r=0;if(!e||!e.trim())return["rgb(255,255,255)","rgb(0,0,0)"];const a=(e.startsWith("#")?e:`#${e}`).replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,(e,t,n,r)=>`#${t}${t}${n}${n}${r}${r}`).substring(1).match(/.{2}/g);if(!a||3!==a.length)return["rgb(255,255,255)","rgb(0,0,0)"];try{if([t,n,r]=a.map(e=>parseInt(e,16)),isNaN(t)||isNaN(n)||isNaN(r))return["rgb(255,255,255)","rgb(0,0,0)"]}catch{return["rgb(255,255,255)","rgb(0,0,0)"]}const i=(299*t+587*n+114*r)/1e3;return[`rgb(${t},${n},${r})`,Math.abs(i-255)>Math.abs(i-0)?"rgb(255, 255, 255)":"rgb(0, 0, 0)"]}Ns.styles=r`
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
            gap: var(--day-label-gap, 0.15em);
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .day-name {
            font-size: var(--day-label-name-font-size, 0.75em);
            text-transform: uppercase;
            letter-spacing: 0.03em;
            opacity: 0.7;
        }

        .day-number {
            font-size: var(--day-label-number-font-size, 1.125em);
            font-weight: var(--day-label-number-font-weight, 600);
            line-height: 1;
        }

        .day-label:hover {
            background-color: var(--separator-light);
        }

        .day-label:focus {
            outline: 2px solid var(--entry-focus-color, var(--primary-color));
            outline-offset: 2px;
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
            border-right: var(--sidebar-border, 1px solid var(--separator-light));
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
            border-right: var(--sidebar-border, 1px solid var(--separator-light));
            position: relative;
        }

        .day-column:last-child {
            border-right: none;
        }

        .hour-separator {
            grid-column: 2 / 3;
            border-top: var(--separator-border, 1px solid var(--separator-light));
            position: absolute;
            width: 100%;
            z-index: 0;
        }

        .hour-slot-container {
            overflow: hidden;
        }

        /* All-day events section */
        .all-day-wrapper {
            display: grid;
            grid-template-rows: 1fr;
            transition: grid-template-rows 0.2s ease;
            border-bottom: var(--separator-border);
            background: var(--background-color);
            z-index: 2;
            position: relative;
        }

        .all-day-wrapper.collapsed {
            grid-template-rows: 0fr;
            overflow: hidden;
            border-bottom: none;
        }

        .all-day-wrapper.collapsed .all-day-container {
            padding: 0;
        }

        .all-day-container {
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
            min-height: 0;
            overflow: hidden;
        }

        .all-day-day-column {
            position: relative;
            min-height: 2em;
            padding: 0.25em 0;
        }

        /* Stack all-day events vertically with consistent positioning */
        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry) {
            position: relative !important;
            display: block !important;
            margin-bottom: 0.25em !important;
            z-index: var(--entry-z-index, 1) !important;
        }

        /* Enhanced multi-day spanning styles with consistent ordering */
        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.first-day) {
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            border-top-left-radius: var(--entry-border-radius) !important;
            border-bottom-left-radius: var(--entry-border-radius) !important;
            position: relative !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.middle-day) {
            border-top-left-radius: 0 !important;
            border-top-right-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            position: relative !important;
            border-left: 3px solid rgba(255, 255, 255, 0.4) !important;
            margin-left: -2px !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.last-day) {
            border-top-left-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            border-top-right-radius: var(--entry-border-radius) !important;
            border-bottom-right-radius: var(--entry-border-radius) !important;
            position: relative !important;
            border-left: 3px solid rgba(255, 255, 255, 0.4) !important;
            margin-left: -2px !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.single-day) {
            border-radius: var(--entry-border-radius) !important;
            position: relative !important;
        }

        .all-day-time-header {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
            font-weight: var(--day-label-font-weight);
            border-right: var(--separator-border);
        }
    `,$s([l({attribute:!1})],Ns.prototype,"activeDate",2),$s([l({type:Number})],Ns.prototype,"allDayRowCount",2),$s([l({type:Number})],Ns.prototype,"firstDayOfWeek",2),$s([l({type:String})],Ns.prototype,"locale",2),Ns=$s([c("lms-calendar-week")],Ns);class Is{constructor(e={}){this.config={minuteHeight:e.minuteHeight??1,eventMinHeight:e.eventMinHeight??20}}calculateLayout(e){const t=this.eventsToIntervals(e),n=this.calculateGrading(t);return{boxes:this.calculateBoxes(e,n)}}eventsToIntervals(e){return e.map(e=>({start:60*e.startTime.hour+e.startTime.minute,end:60*e.endTime.hour+e.endTime.minute}))}calculateGrading(e){const t=[];return this.findOverlapGroups(e).forEach((n,r)=>{if(1===n.length)t.push({index:n[0],depth:0,group:r});else{const a=n.map(t=>({...e[t],originalIndex:t})),i=a.reduce((e,t)=>t.end-t.start>e.end-e.start?t:e);let s=1;a.forEach(e=>{const n=e.originalIndex===i.originalIndex?0:s++;t.push({index:e.originalIndex,depth:n,group:r})})}}),t.sort((e,t)=>e.index-t.index),t}findOverlapGroups(e){const t=[],n=/* @__PURE__ */new Set;return e.forEach((r,a)=>{if(n.has(a))return;const i=[a];n.add(a);let s=!0;for(;s;)s=!1,e.forEach((t,r)=>{if(n.has(r))return;i.some(n=>this.intervalsOverlap(e[n],t))&&(i.push(r),n.add(r),s=!0)});t.push(i)}),t}intervalsOverlap(e,t){return e.start<t.end&&t.start<e.end}calculateBoxes(e,t){const n=/* @__PURE__ */new Map;return e.forEach((e,r)=>{const a=t[r]||{depth:0,group:r};n.has(a.group)||n.set(a.group,[]),n.get(a.group).push({event:e,index:r,grade:a})}),e.map((e,r)=>{const a=t[r]||{depth:0,group:r},i=60*e.startTime.hour+e.startTime.minute,s=60*e.endTime.hour+e.endTime.minute-i,o=n.get(a.group)||[],l=Math.max(...o.map(e=>e.grade.depth));let c,d;if(1===o.length)c=100,d=0;else{const e=100-65;0===a.depth?(d=0,c=100):(d=l>0?a.depth/l*e:0,c=100-d)}const u=100+a.depth;return{id:e.id,x:d,y:i*this.config.minuteHeight,width:c,height:Math.max(s*this.config.minuteHeight,this.config.eventMinHeight),depth:a.depth,group:a.group,opacity:0===a.depth?.95:Math.max(.85,.95-.05*a.depth),zIndex:u}})}}const _s=new class{calculatePosition(e){const{viewMode:t,date:n,time:r,isAllDay:a}=e;switch(t){case"day":return this._calculateDayPosition(n,r,a);case"week":return this._calculateWeekPosition(n,e.activeDate,r,a,e.firstDayOfWeek);case"month":return this._calculateMonthPosition(n);default:throw new Error(`Unsupported view mode: ${t}`)}}generatePositionCSS(e,t,n){if(e.useDirectGrid){const n=String(e.gridColumn||2),r=e.gridRow||"1",a=String(t.width),i=String(t.x),s=String(t.zIndex),l=String(t.opacity);return o(`\n                grid-column: ${n};\n                grid-row: ${r};\n                --entry-width: ${a}%;\n                --entry-margin-left: ${i}%;\n                --entry-z-index: ${s};\n                --entry-opacity: ${l};\n            `)}{const e=n?this._getGridSlotByTime(n):"1",r=String(t.width),a=String(t.x),i=String(t.zIndex),s=String(t.opacity);return o(`\n                --start-slot: ${e};\n                --entry-width: ${r}%;\n                --entry-margin-left: ${a}%;\n                --entry-z-index: ${i};\n                --entry-opacity: ${s};\n            `)}}_calculateDayPosition(e,t,n){if(n)return{slotName:"all-day",useDirectGrid:!1};if(!t)throw new Error("Day view entries must have time information");return{slotName:t.start.hour.toString(),useDirectGrid:!1}}_calculateWeekPosition(e,t,n,r,a){const i=this.getWeekDayIndex(e,t,a??1),s=i+2;if(r)return{slotName:`all-day-${e.year}-${e.month}-${e.day}`,gridColumn:s,gridRow:"1 / 60",useDirectGrid:!1,isAllDay:!0,dayIndex:i};if(!n)throw new Error("Week view timed entries must have time information");return{slotName:"",gridColumn:s,gridRow:this._getGridSlotByTime(n),useDirectGrid:!0}}_calculateMonthPosition(e){return{slotName:`${e.year}-${e.month}-${e.day}`,useDirectGrid:!1}}getWeekDayIndex(e,t,n=1){const r=Va(t,n).findIndex(t=>t.day===e.day&&t.month===e.month&&t.year===e.year);return r>=0?r:0}_getGridSlotByTime({start:e,end:t}){const n=60*e.hour+(e.minute+1),r=n+(60*t.hour+t.minute-n);return n===r?`${n}/${r+1}`:`${n}/${r}`}calculateAccessibility(e){const{viewMode:t,date:n,time:r,isAllDay:a,firstDayOfWeek:i}=e;let s=0;if("week"===t&&r&&!a){s=1e4+1e4*this.getWeekDayIndex(n,e.activeDate,i??1)+100*r.start.hour+r.start.minute}else if("day"===t&&r&&!a)s=60*r.start.hour+r.start.minute;else if(a)if("week"===t){s=1e3+this.getWeekDayIndex(n,e.activeDate,i??1)}else s=0;return{tabIndex:s,role:"button",ariaLabel:this._generateAriaLabel(e)}}_generateAriaLabel(e){const{date:t,time:n,isAllDay:r}=e;return`Calendar event on ${`${t.month}/${t.day}/${t.year}`}, ${r||!n?"All day":`${String(n.start.hour).padStart(2,"0")}:${String(n.start.minute).padStart(2,"0")} to ${String(n.end.hour).padStart(2,"0")}:${String(n.end.minute).padStart(2,"0")}`}. Press Enter or Space to open details.`}getPositionDescription(e){const t=this.calculatePosition(e);return t.useDirectGrid?`Direct grid: column ${t.gridColumn}, row ${t.gridRow}`:`Slot: "${t.slotName}"`}validatePosition(e){try{return this.calculatePosition(e),{valid:!0}}catch(t){return{valid:!1,error:t instanceof Error?t.message:"Unknown validation error"}}}};class As{constructor(e){this._viewMode="month",this._host=e,e.addController(this);const t=/* @__PURE__ */new Date;this._activeDate={day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()}}hostConnected(){}get viewMode(){return this._viewMode}get activeDate(){return this._activeDate}get expandedDate(){return"day"===this._viewMode?this._activeDate:void 0}setViewMode(e){this._viewMode=e,this._host.requestUpdate()}setActiveDate(e){this._activeDate=e,this._host.requestUpdate()}navigateNext(){const e=this._activeDate;if("month"===this._viewMode){const t=new Date(e.year,e.month,1);this.setActiveDate({day:1,month:t.getMonth()+1,year:t.getFullYear()})}else if("week"===this._viewMode){const t=new Date(e.year,e.month-1,e.day);t.setDate(t.getDate()+7),this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}else if("day"===this._viewMode){const t=new Date(e.year,e.month-1,e.day+1);this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}}navigatePrevious(){const e=this._activeDate;if("month"===this._viewMode){const t=new Date(e.year,e.month-2,1);this.setActiveDate({day:1,month:t.getMonth()+1,year:t.getFullYear()})}else if("week"===this._viewMode){const t=new Date(e.year,e.month-1,e.day);t.setDate(t.getDate()-7),this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}else if("day"===this._viewMode){const t=new Date(e.year,e.month-1,e.day-1);this.setActiveDate({day:t.getDate(),month:t.getMonth()+1,year:t.getFullYear()})}}jumpToToday(){const e=/* @__PURE__ */new Date;this.setActiveDate({day:e.getDate(),month:e.getMonth()+1,year:e.getFullYear()})}switchToMonthView(){this.setViewMode("month")}switchToWeekView(){this.setViewMode("week")}switchToDayView(){this.setViewMode("day")}}var Rs=Object.defineProperty,Ls=Object.getOwnPropertyDescriptor,zs=(e,t,n,r)=>{for(var a,i=r>1?void 0:r?Ls(t,n):t,s=e.length-1;s>=0;s--)(a=e[s])&&(i=(r?a(t,n,i):a(i))||i);return r&&i&&Rs(t,n,i),i};let Ws=class extends a{constructor(){super(...arguments),this.firstDayOfWeek=1,this.locale=document.documentElement.lang||"en",this._viewState=new As(this),this.entries=[],this.color="#000000",this._calendarWidth=window.innerWidth,this._menuOpen=!1,this._layoutCalculator=new Is({timeColumnWidth:80,minuteHeight:1,eventMinHeight:20,cascadeOffset:15,paddingLeft:10}),this._handleResize=e=>{const[t]=e;this._calendarWidth=t.contentRect.width||this._calendarWidth},this._resizeController=new m(this,{target:null,callback:this._handleResize,skipInitial:!0}),this._handleClickOutside=e=>{if(!this._menuOpen)return;const t=e.composedPath(),n=this.shadowRoot?.querySelector("lms-menu"),r=n&&t.includes(n),a=t.some(e=>e instanceof HTMLElement&&"LMS-CALENDAR-ENTRY"===e.tagName);r||a||this._closeMenuAndClearSelections()},this._handleEscape=e=>{"Escape"===e.key&&this._menuOpen&&this._closeMenuAndClearSelections()}}get activeDate(){return this._viewState.activeDate}set activeDate(e){this._viewState.setActiveDate(e)}get _expandedDate(){return this._viewState.expandedDate}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._handleClickOutside,!0),document.addEventListener("keydown",this._handleEscape)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._handleClickOutside,!0),document.removeEventListener("keydown",this._handleEscape)}_closeMenuAndClearSelections(){this._menuOpen=!1,this._menuEventDetails=void 0,this._returnFocusToTrigger(),this.shadowRoot?.querySelectorAll("lms-calendar-entry").forEach(e=>{e.clearSelection()})}_returnFocusToTrigger(){if(this._menuTriggerEntry){const e=this._menuTriggerEntry.shadowRoot?.querySelector('[role="button"]');(e??this._menuTriggerEntry).focus(),this._menuTriggerEntry=void 0}}firstUpdated(e){const t=this.shadowRoot?.firstElementChild;t&&this._resizeController.observe(t)}willUpdate(e){this.entries.length&&(this.entries=Rr(this.entries,Yr(e=>Vn.fromDateTimes(Cr.fromObject(Xr(e.date.start,e.time.start)),Cr.fromObject(Xr(e.date.end,e.time.end))).isValid),function(...e){return _r(na,e)}((e,t)=>e.time.start.hour-t.time.start.hour||e.time.start.minute-t.time.start.minute)))}render(){const e=this._viewState.viewMode,t=this._viewState.activeDate;return i`
            <div class="calendar-container">
                <header>
                    <lms-calendar-header
                        @switchdate=${this._handleSwitchDate}
                        @switchview=${this._handleSwitchView}
                        @jumptoday=${this._handleJumpToday}
                        .heading=${this.heading}
                        .activeDate=${t}
                        .viewMode=${e}
                        .expandedDate=${"day"===e?t:void 0}
                        .locale=${this.locale}
                    >
                    </lms-calendar-header>
                </header>

                <main role="region" aria-live="polite" aria-label="${e} view">
                    ${"month"===e?i`
                              <lms-calendar-context
                                  .firstDayOfWeek=${this.firstDayOfWeek}
                                  .locale=${this.locale}
                              > </lms-calendar-context>

                              <lms-calendar-month
                                  @expand=${this._handleExpand}
                                  @open-menu=${this._handleOpenMenu}
                                  @clear-other-selections=${this._handleClearOtherSelections}
                                  .activeDate=${t}
                                  .firstDayOfWeek=${this.firstDayOfWeek}
                                  .locale=${this.locale}
                              >
                                  ${this._calendarWidth<768?this._renderEntriesSumByDay():this._renderEntries()}
                              </lms-calendar-month>
                          `:s}
                    ${"week"===e?(()=>{const e=this._renderEntriesByDate();return i`
                                      <lms-calendar-week
                                          @expand=${this._handleExpand}
                                          @open-menu=${this._handleOpenMenu}
                                          @clear-other-selections=${this._handleClearOtherSelections}
                                          .activeDate=${t}
                                          .allDayRowCount=${e.allDayRowCount}
                                          .firstDayOfWeek=${this.firstDayOfWeek}
                                          .locale=${this.locale}
                                      >
                                          ${e.elements}
                                      </lms-calendar-week>
                                  `})():s}
                    ${"day"===e?(()=>{const e=this._renderEntriesByDate();return i`
                                      <lms-calendar-day
                                          @open-menu=${this._handleOpenMenu}
                                          @clear-other-selections=${this._handleClearOtherSelections}
                                          .allDayRowCount=${e.allDayRowCount}
                                      >
                                          ${e.elements}
                                      </lms-calendar-day>
                                  `})():s}
                </main>

                <lms-menu
                    ?open=${this._menuOpen}
                    .eventDetails=${this._menuEventDetails||{heading:"",content:"",time:""}}
                    .anchorRect=${this._menuEventDetails?.anchorRect}
                    .locale=${this.locale}
                    @menu-close=${this._handleMenuClose}
                ></lms-menu>
            </div>
        `}_handleSwitchDate(e){"next"===e.detail.direction?this._viewState.navigateNext():"previous"===e.detail.direction&&this._viewState.navigatePrevious()}_handleSwitchView(e){return Oa(e.detail.view).with("day",()=>this._viewState.switchToDayView()).with("week",()=>this._viewState.switchToWeekView()).with("month",()=>this._viewState.switchToMonthView()).otherwise(()=>{})}_handleJumpToday(e){this._viewState.jumpToToday()}_handleExpand(e){this._viewState.setActiveDate(e.detail.date),this._viewState.switchToDayView()}_handleOpenMenu(e){const t=e.target;this.shadowRoot?.querySelectorAll("lms-calendar-entry").forEach(e=>{e!==t&&e.clearSelection()}),this._menuTriggerEntry=t,this.openMenu(e.detail)}_handleClearOtherSelections(e){const t=e.detail.exceptEntry;this.shadowRoot?.querySelectorAll("lms-calendar-entry").forEach(e=>{e!==t&&e.clearSelection()})}_handleMenuClose(){this._menuOpen=!1,this._menuEventDetails=void 0,this._returnFocusToTrigger()}openMenu(e){this._menuEventDetails=e,this._menuOpen=!0}_composeEntry({index:e,slot:t,styles:n,entry:r,isContinuation:a=!1,density:s,displayMode:o="default",floatText:l=!1,spanClass:c}){const d=s||this._determineDensity(r,void 0,void 0,void 0);return i`
            <style>
                ${n}
            </style>
            <lms-calendar-entry
                class=${`_${e}${c?` ${c}`:""}`}
                slot=${t}
                .time=${r.time}
                .heading=${r.heading??""}
                .content=${r.content}
                .isContinuation=${a??!1}
                .date=${r.date}
                .density=${d}
                .displayMode=${o}
                .floatText=${l}
                .accessibility=${r.accessibility}
                .locale=${this.locale}
            >
            </lms-calendar-entry>
        `}_getEntriesCountForDay(e){return this.entries.filter(t=>{const n=Cr.fromObject(t.date.start),r=Cr.fromObject(t.date.end),a=Cr.fromObject(e);return a>=n&&a<=r}).length}_determineDensity(e,t,n,r){if(!e.time)return"compact";if(n&&void 0!==r&&n[r])return"standard";const a=60*(e.time.end.hour-e.time.start.hour)+(e.time.end.minute-e.time.start.minute);return a<30?"compact":a>120&&e.content?"full":"standard"}_expandEntryMaybe({entry:e,range:t}){return Array.from({length:t[2]},(n,r)=>{const a=Cr.fromJSDate(t[0]).plus({days:r}),i=a.plus({days:1}).minus({seconds:1});return{...e,date:{start:a.toObject(),end:i.toObject()},isContinuation:r>0,continuation:{has:t[2]>1,is:r>0,index:r,total:t[2]},originalStartDate:e.date?.start}})}_createConsistentEventId(e){const t=e.originalStartDate||e.date?.start;return t?`${e.heading||"unknown"}-${t.year}-${t.month}-${t.day}-${e.time?.start.hour||0}-${e.time?.start.minute||0}`:`${e.heading||"unknown"}-fallback`}_renderEntries(){if(!this.entries.length)return s;const e=/* @__PURE__ */new Map;return this.entries.forEach((t,n)=>{e.set(this._createConsistentEventId(t),n)}),Rr(this.entries,Hr(e=>this._expandEntryMaybe({entry:e,range:this._getDaysRange(e.date)})),function(...e){return Fr(ra,e)}(t=>{const n=this._createConsistentEventId(t),r=e.get(n)||0,a=t;return a.continuation?.has||!1?r-1e3:r}),Kr(e=>[e,...Cs(e.color)]),Kr(([t,n,a],i)=>{const s=this._createConsistentEventId(t),l=e.get(s)||i,c=t.isContinuation||t.continuation?.has||!1?"all-day-":"";return this._composeEntry({index:l,slot:`${c}${t.date.start.year}-${t.date.start.month}-${t.date.start.day}`,styles:r`
                        lms-calendar-entry._${l} {
                            --entry-color: ${o(n)};
                            --entry-background-color: ${o(n)};
                            /* Add z-index based on original order for consistent layering */
                            z-index: ${100+l};
                        }
                    `,entry:{time:t.time,heading:t.heading,content:t.content,date:t.date,isContinuation:t.isContinuation||!1,continuation:t.continuation},density:this._determineDensity({time:t.time,heading:t.heading,content:t.content},this._getEntriesCountForDay(t.date.start),void 0,void 0),displayMode:"month-dot"})}))}_renderEntriesByDate(){const e=this._viewState.activeDate,t=this._viewState.viewMode;if("day"!==t&&"week"!==t)return s;const n=Rr(this.entries,Hr(e=>this._expandEntryMaybe({entry:e,range:this._getDaysRange(e.date)})),Yr(n=>{if("day"===t)return function(...e){return _r(Gr,e)}(Cr.fromObject(n.date.start).toISODate(),Cr.fromObject(e).toISODate());{const t=this._getWeekStartDate(e),r=Array.from({length:7},(e,n)=>{const r=new Date(t);return r.setDate(t.getDate()+n),Cr.fromJSDate(r).toISODate()}),a=Cr.fromObject(n.date.start).toISODate();return r.includes(a)}})),r=n.filter(e=>!e.time||e.time&&Number(e.time.end.hour)-Number(e.time.start.hour)>=23||e.continuation?.is||e.continuation?.has),a=n.filter(e=>!(!e.time||Number(e.time.end.hour)-Number(e.time.start.hour)>=23||e.continuation?.is||e.continuation?.has));return a.length||r.length?this._renderEntriesWithSlotManager(t,e,r,a):{elements:s,allDayRowCount:0}}_renderEntriesWithSlotManager(e,t,n,a){const i=[];if(a.length>0)if("week"===e){const n=function(...e){return _r(Br,e)}(a,e=>`${e.date.start.year}-${e.date.start.month}-${e.date.start.day}`);Object.entries(n).map(([e,t])=>({dayKey:e,dayEntries:t})).filter(({dayEntries:e})=>e&&e.length>0).sort((e,n)=>{const r=e.dayEntries[0],a=n.dayEntries[0];if(!(r&&a&&r.date&&a.date))return 0;return _s.getWeekDayIndex(r.date.start,t,this.firstDayOfWeek)-_s.getWeekDayIndex(a.date.start,t,this.firstDayOfWeek)}).forEach(({dayEntries:n})=>{const r=this._renderDayEntriesWithSlotManager(n,e,t,a);i.push(...r)})}else{const n=this._renderDayEntriesWithSlotManager(a,e,t,a);i.push(...n)}const s=n.map(n=>({id:this._createConsistentEventId(n),days:["week"===e?_s.getWeekDayIndex(n.date.start,t,this.firstDayOfWeek):0],isMultiDay:n.continuation?.is||n.continuation?.has||!1})),l=/* @__PURE__ */new Map;s.forEach(e=>{const t=l.get(e.id);t?t.days.push(...e.days):l.set(e.id,{...e,days:[...e.days]})});const{rowAssignments:c,totalRows:d}=function(e){const t=/* @__PURE__ */new Map;if(0===e.length)return{rowAssignments:t,totalRows:0};const n=[],r=[];e.forEach(e=>{e.isMultiDay?n.push(e):r.push(e)}),n.sort((e,t)=>{const n=Math.min(...e.days),r=Math.min(...t.days);return n!==r?n-r:e.id.localeCompare(t.id)}),r.sort((e,t)=>Math.min(...e.days)-Math.min(...t.days));const a=/* @__PURE__ */new Map;for(let s=0;s<7;s++)a.set(s,/* @__PURE__ */new Set);n.forEach(e=>{let n=0,r=!1;for(;!r;){let i=!0;for(const t of e.days)if(a.get(t)?.has(n)){i=!1;break}if(i){r=!0,t.set(e.id,n);for(const t of e.days)a.get(t)?.add(n)}else n++}}),r.forEach(e=>{const n=e.days[0];let r=0;for(;a.get(n)?.has(r);)r++;t.set(e.id,r),a.get(n)?.add(r)});let i=0;return a.forEach(e=>{i=Math.max(i,e.size)}),{rowAssignments:t,totalRows:i}}(Array.from(l.values()));return{elements:[...n.map((n,i)=>{const[s,d]=Cs(n.color),u=this._createConsistentEventId(n),h={viewMode:e,date:n.date.start,isAllDay:!0,activeDate:t,firstDayOfWeek:this.firstDayOfWeek},m=_s.calculatePosition(h),f=_s.calculateAccessibility(h),y=c.get(u)??0,p={width:100,x:0,zIndex:100+y,opacity:1},g=_s.generatePositionCSS(m,p),b=n.continuation;let v="single-day";if((b?.has||b?.is||!1)&&b){const r=l.get(u),a=[...r?.days??[]].sort((e,t)=>e-t),i="week"===e?_s.getWeekDayIndex(n.date.start,t,this.firstDayOfWeek):0;v=function(e){const{continuationIndex:t,totalDays:n,visibleStartIndex:r,visibleEndIndex:a}=e;if(n<=1)return"single-day";const i=t===r,s=t===a;return i&&s?"single-day":i?"first-day":s?"last-day":"middle-day"}({continuationIndex:i,totalDays:b.total,visibleStartIndex:a[0]??i,visibleEndIndex:a[a.length-1]??i})}return this._composeEntry({index:i+a.length,slot:m.slotName||"week-direct-grid",styles:r`
                    lms-calendar-entry._${i+a.length} {
                        --entry-background-color: ${o(s)};
                        --entry-color: ${o(d)};
                        order: ${y};
                        ${g};
                    }
                `,entry:{...n,accessibility:f},density:"standard",floatText:!1,spanClass:v})}),...i],allDayRowCount:d}}_renderDayEntriesWithSlotManager(e,t,n,a){const i=e.map((e,t)=>({id:String(t),heading:e.heading||"",startTime:{hour:e.time.start.hour,minute:e.time.start.minute},endTime:{hour:e.time.end.hour,minute:e.time.end.minute},color:e.color||"#1976d2"})),s=this._layoutCalculator.calculateLayout(i);return e.map((e,i)=>{const l=s.boxes[i],c=a.indexOf(e),d={viewMode:t,date:e.date.start,time:e.time,activeDate:n,isAllDay:e.isContinuation||this._isAllDayEvent(e),firstDayOfWeek:this.firstDayOfWeek},u=_s.calculatePosition(d),h=_s.calculateAccessibility(d),m={width:l.width,x:l.x,zIndex:l.zIndex,opacity:l.opacity,height:l.height},f=_s.generatePositionCSS(u,m,e.time);return this._composeEntry({index:c,slot:u.slotName||"week-direct-grid",styles:r`
                    lms-calendar-entry._${c} {
                        --entry-background-color: rgba(250, 250, 250, 0.8);
                        --entry-color: #333;
                        --entry-border: 1px solid rgba(0, 0, 0, 0.15);
                        --entry-handle-color: ${o(e.color||"#1976d2")};
                        --entry-handle-width: 4px;
                        --entry-handle-display: block;
                        --entry-padding-left: calc(4px + 0.35em);
                        --entry-layout: ${o(this._getSmartLayout(e,l.height,l.width,{depth:l.depth,opacity:l.opacity}))};
                        ${f};
                    }
                `,entry:{...e,accessibility:h},density:"standard",floatText:!1})})}_renderEntriesSumByDay(){return Rr(this.entries,Hr(e=>this._expandEntryMaybe({entry:e,range:this._getDaysRange(e.date)})),function(...e){return _r(ta,e)}((e,t)=>{const n=`${t.date.start.day}-${t.date.start.month}-${t.date.start.year}`;return e[n]=e[n]?e[n]+1:1,e},{}),Object.entries,Kr(([e,t],n)=>this._composeEntry({index:n,slot:e.split("-").reverse().join("-"),styles:r`
                        lms-calendar-entry._${n} {
                            --entry-color: var(--separator-mid);
                            text-align: center;
                        }
                    `,entry:{heading:`${t} events`},displayMode:"month-dot"})))}_getWeekStartDate(e){const t=Va(e,this.firstDayOfWeek)[0];return new Date(t.year,t.month-1,t.day)}_getSmartLayout(e,t,n,r){if(!e.time)return"row";if(!(r&&r.depth>0))return"row";return t>=40?"column":"row"}_getDaysRange(e){const{start:t,end:n}=e,r=new Date(t.year,t.month-1,t.day),a=new Date(n.year,n.month-1,n.day);return[r,a,(a.getTime()-r.getTime())/864e5+1]}_isAllDayEvent(e){if(!e.time)return!0;const{start:t,end:n}=e.time;return 0===t.hour&&0===t.minute&&23===n.hour&&59===n.minute}};Ws.styles=r`
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

            --system-ui:
                system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji',
                'Segoe UI Emoji', 'Segoe UI Symbol';
            --monospace-ui:
                'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;

            --border-radius-sm: 5px;
            --border-radius-md: 7px;
            --border-radius-lg: 12px;

            --background-color: white;
            --primary-color: dodgerblue;

            --height: 100%;
            --width: 100%;

            /* Entry design tokens - responsive and density-aware */
            --entry-font-size: 0.8rem;
            --entry-line-height: 1.3;
            --entry-min-height: 1.2em;
            --entry-border-radius: var(--border-radius-sm);
            --entry-background-color: var(--background-color);
            --entry-color: var(--primary-color);
            --entry-highlight-color: var(--separator-light);
            --entry-focus-color: var(--primary-color);
            --entry-padding: 0.2em 0.35em;
            --entry-font-family: system-ui;
            --entry-gap: 0.25em;

            /* Month view dot indicator tokens */
            --entry-dot-size: 0.5em;
            --entry-dot-margin: 0.25em;
            --entry-month-background: transparent;
            --entry-month-padding: 0.1em 0.3em 0.1em 0;
            --entry-time-font: var(--monospace-ui);
            --entry-time-align: right;
            --entry-month-text-color: var(--separator-dark);

            /* Entry typography tokens */
            --entry-title-weight: 500;
            --entry-title-wrap: nowrap;
            --entry-time-font-size: 0.85em;
            --entry-time-opacity: 0.8;

            /* Entry density mode tokens */
            --entry-compact-show-time: none;
            --entry-layout: row;
            --entry-align: flex-start;

            /* Responsive scaling for different viewport sizes */
            --entry-font-size-sm: 0.7rem;
            --entry-font-size-md: 0.75rem;
            --entry-font-size-lg: 0.8rem;

            --context-height: 1.75em;
            --context-padding: 0.25em;
            --context-text-align: left;

            /* Core layout tokens */
            --time-column-width: 4em;
            --grid-rows-per-day: 1440;
            --view-container-height-offset: 0px;
            --main-content-height-offset: 1em;

            /* Grid template tokens */
            --calendar-grid-columns-day: var(--time-column-width) 1fr;
            --calendar-grid-columns-week: var(--time-column-width) repeat(7, 1fr);
            --calendar-grid-columns-month: repeat(7, 1fr);
            --calendar-grid-rows-time: repeat(var(--grid-rows-per-day), 1fr);

            /* Calculated heights */
            --view-container-height: calc(100% - var(--view-container-height-offset));
            --main-content-height: calc(100% - var(--main-content-height-offset));

            /* Legacy tokens (for backward compatibility) */
            --day-header-height: 3.5em;
            --day-main-offset: var(--main-content-height-offset);
            --day-gap: 1px;
            --day-text-align: center;
            --day-padding: 0.5em;
            --day-all-day-font-size: 0.875rem;
            --day-all-day-margin: 0 1.25em 0 4.25em;
            --hour-text-align: center;
            --indicator-top: -0.55em;
            --separator-border: 1px solid var(--separator-light);
            --sidebar-border: 1px solid var(--separator-light);

            /* Typography tokens */
            --hour-indicator-font-size: 0.8125em;
            --hour-indicator-color: var(--header-text-color, rgba(0, 0, 0, 0.6));
            --day-label-font-weight: 500;
            --day-label-name-font-size: 0.75em;
            --day-label-number-font-size: 1.125em;
            --day-label-number-font-weight: 600;
            --day-label-gap: 0.15em;

            --header-height: 3.5em;
            --header-height-mobile: 4.5em;
            --header-info-padding-left: 1em;
            --header-text-color: rgba(0, 0, 0, 0.6);
            --header-buttons-padding-right: 1em;
            --button-padding: 0.75em;
            --button-border-radius: var(--border-radius-sm);

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
        .calendar-container {
            width: var(--width);
            height: var(--height);
            background-color: var(--background-color);
            border-radius: var(--border-radius-lg);
            border: 1px solid var(--separator-light);
            font-family: var(--system-ui);
            color: var(--separator-dark);
            box-shadow: var(--shadow-md);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        header {
            flex-shrink: 0;
        }
        main {
            flex: 1;
            min-height: 0;
            overflow: hidden;
        }

        /* Responsive entry scaling based on viewport width */
        @media (max-width: 480px) {
            :host {
                --entry-font-size: var(--entry-font-size-sm);
                --entry-padding: 0.1em 0.2em;
                --entry-gap: 0.15em;
                --entry-line-height: 1.15;
                --entry-min-height: 1.1em;
                --entry-compact-show-time: none;
            }
        }

        @media (min-width: 481px) and (max-width: 768px) {
            :host {
                --entry-font-size: var(--entry-font-size-md);
                --entry-padding: 0.15em 0.25em;
                --entry-gap: 0.2em;
                --entry-line-height: 1.2;
                --entry-compact-show-time: none;
            }
        }

        @media (min-width: 769px) {
            :host {
                --entry-font-size: var(--entry-font-size-lg);
                --entry-compact-show-time: inline;
            }
        }
    `,zs([l({type:String})],Ws.prototype,"heading",2),zs([l({type:Number,attribute:"first-day-of-week"})],Ws.prototype,"firstDayOfWeek",2),zs([l({type:String})],Ws.prototype,"locale",2),zs([l({type:Array})],Ws.prototype,"entries",2),zs([l({type:String})],Ws.prototype,"color",2),zs([d()],Ws.prototype,"_calendarWidth",2),zs([d()],Ws.prototype,"_menuOpen",2),zs([d()],Ws.prototype,"_menuEventDetails",2),Ws=zs([c("lms-calendar")],Ws);export{Vn as Interval,Ws as default};
//# sourceMappingURL=lms-calendar.bundled.js.map
