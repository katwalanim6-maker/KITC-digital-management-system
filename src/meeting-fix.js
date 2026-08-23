(()=>{'use strict';
// KITC Meeting Add fix: main.js uses the plural section name "meetings",
// while the form definition is keyed as "meeting". Normalize only that route.
const originalOpenAdd=window.openAdd;
if(typeof originalOpenAdd==='function'){
  window.openAdd=(type='member',id=null)=>originalOpenAdd(type==='meetings'?'meeting':type,id);
}
})();
