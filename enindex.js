// EnIndex
// Encrypted IndexedDB for JavaScript
// Convenient wrapper for IndexedDB APIs with encryption
// See: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

// Conventions
// ===========
// Naming rules:
// Rather similar to natural language, only my_primitive is maths
// Rather similar to C++ STL standard, only My_Compound differs
//   - my_namespace -- Generic nouns,    eg. app.ui.utils
//   - my_class     -- Generic nouns,    eg. technical_manager
//   - my_method    -- Verbs, aux verbs, eg. process_documents
//   - my_primitive -- Specific nouns,   eg. i, j, k, n (specific nouns, but maths)
//   - My_Compound  -- Specific nouns,   eg. John_Doe
//   - MY_INSTANCE  -- Numbers, digits,  eg. MAX_PRICE
// Other guides:
//   - Line <80 chars, max 120 chars
//   - Max 100 lines per function
//   - Max 100 functions per file
//   - Try to reduce lines but more comments

// Modules
import base from "./modules/base.js";
import idb  from "./modules/idb.js";

// Shorthands
var log  = console.log;
var logw = console.warn;
var loge = console.error;

// Exported functions
var eidb = {
    idb: idb, // IndexedDB Wrapper

    // Methods on window.indexedDB instance
    open: idb.open
};

// Global bindings, base functionalities
window.new_lock = base.new_lock;

// Global bindings, whole lib
window.eidb = eidb;
// EOF