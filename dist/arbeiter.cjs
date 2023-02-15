"use strict";var g=Object.defineProperty;var u=(r,e,s)=>e in r?g(r,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):r[e]=s;var t=(r,e,s)=>(u(r,typeof e!="symbol"?e+"":e,s),s);class m{constructor(e){t(this,"methods");t(this,"worker");t(this,"messageId",0);t(this,"responseQueue",{});t(this,"getMethods",e=>Object.fromEntries(Object.entries(e()).filter(([s,o])=>typeof o=="function").map(([s,o])=>[s,(...n)=>new Promise(i=>{this.messageId++,this.responseQueue[this.messageId]={resolve:i};const a=n.filter(h=>h instanceof OffscreenCanvas);this.worker.postMessage([this.messageId,s,n],a)})])));t(this,"onmessage",e=>{const[s,o]=e.data;this.responseQueue&&(this.responseQueue[s].resolve(o),delete this.responseQueue[s])});t(this,"getWorkerString",e=>`
const methods = (${e.toString()})();

onmessage = function ({data: [id, key, arguments]}) {
  const response = methods[key](...arguments);
  postMessage([id, response])
  return;
}
    `);t(this,"getWorker",e=>new Worker("data:text/javascript;charset=utf-8,"+encodeURIComponent(this.getWorkerString(e))));this.worker=this.getWorker(e),this.worker.onmessage=this.onmessage,this.methods=this.getMethods(e)}terminate(){this.worker.terminate()}}module.exports=m;
