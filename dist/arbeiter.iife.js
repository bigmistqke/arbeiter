var arbeiter=function(){"use strict";var g=Object.defineProperty;var m=(r,t,e)=>t in r?g(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var s=(r,t,e)=>(m(r,typeof t!="symbol"?t+"":t,e),e);class r{constructor(e){s(this,"methods");s(this,"worker");s(this,"messageId",0);s(this,"responseQueue",{});s(this,"getMethods",e=>Object.fromEntries(Object.entries(e()).filter(([o,n])=>typeof n=="function").map(([o,n])=>[o,(...i)=>new Promise(a=>{this.messageId++,this.responseQueue[this.messageId]={resolve:a};const h=i.filter(u=>u instanceof OffscreenCanvas);this.worker.postMessage([this.messageId,o,i],h)})])));s(this,"onmessage",e=>{const[o,n]=e.data;this.responseQueue&&(this.responseQueue[o].resolve(n),delete this.responseQueue[o])});s(this,"getWorkerString",e=>`
const methods = (${e.toString()})();

onmessage = function ({data: [id, key, arguments]}) {
  const response = methods[key](...arguments);
  postMessage([id, response])
  return;
}
    `);s(this,"getWorker",e=>new Worker("data:text/javascript;charset=utf-8,"+encodeURIComponent(this.getWorkerString(e))));this.worker=this.getWorker(e),this.worker.onmessage=this.onmessage,this.methods=this.getMethods(e)}terminate(){this.worker.terminate()}}return r}();
