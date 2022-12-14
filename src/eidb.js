/**
 * @module eidb
 */
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
//   - my_primitive -- Specific nouns,   eg. i, j, k, n (maths var with both lower and upper-case)
//   - My_Compound  -- Specific nouns,   eg. John_Doe   (maths var with both lower and upper-case)
//   - MY_INSTANCE  -- Numbers, digits,  eg. MAX_PRICE
// Other guides:
//   - Line <80 chars, max 120 chars
//   - Max 100 lines per function
//   - Max 100 functions per file
//   - Try to reduce lines but more comments

// Modules
import base      from "./eidb/base.js";
import idb       from "./eidb/idb.js";
import idbx      from "./eidb/idbx.js";
import idbxs     from "./eidb/idbxs.js";
import factory   from "./eidb/idb/factory.js";
import key_range from "./eidb/idb/key-range.js";
import wcrypto   from "./eidb/wcrypto.js";
import utils     from "./eidb/utils.js";
import slocal    from "./eidb/storage/slocal.js";
import ssession  from "./eidb/storage/ssession.js";

// Shorthands
var log  = console.log;
var logw = console.warn;
var loge = console.error;

/**
 * Main class of EnIndex library, can be used directly under global scope, 
 * that is `window.eidb` or just `eidb`. It contains mainly sub-namespaces
 * and static aliases to static methods.
 */
class eidb {

    /**
     * _________________________________________________________________________
     */
    SUB_NAMESPACES;

    /**
     * Sub-namespace, IndexedDB wrapper
     */
    static idb;

    /**
     * Sub-namespace, IndexedDB extended features
     */
    static idbx;

    /**
     * Sub-namespace, IndexedDB extended features (secure, encrypted)
     */
    static idbxs;
    static sec;

    /**
     * Sub-namespace, Web Crypto
     */ 
    static wcrypto;

    /**
     * Sub-namespace, utils
     */ 
    static utils;

    /**
     * _________________________________________________________________________
     */
    LITERALS;

    /**
     * Field type, non-unique + single value
     */
    static n1 = 1;

    /**
     * Field type, non-unique + multiple values (array)
     */
    static n2 = 2;

    /**
     * Field type, unique + single value
     */
    static u1 = 3;

    /**
     * Field type, unique + multiple values (array)
     */
    static u2 = 4;

    /**
     * _________________________________________________________________________
     */
    CONSTANTS;

    /**
     * Read-only mode for creating transaction
     */
    static RO = "readonly";

    /**
     * Read-write mode for creating transaction
     */
    static RW = "readwrite";    

    /**
     * _________________________________________________________________________
     */
    PROPERTIES;

    /**
     * Global idb_factory
     */
    static Factory;

    /**
     * _________________________________________________________________________
     */
    METHODS;

    // BASE OPS ****************************************************************
    /**
     * Alias of `eidb.idb.databases` [See here](module-eidb_idb-idb.html#.databases)
     */
    static databases;

    /**
     * Alias of `eidb.idb.open` [See here](module-eidb_idb-idb.html#.open)
     * ```
     * // Example
     * var [Err,Result] = await eidb.open("my-db-name")
     * ```
     */
    static open;

    /**
     * Alias of `eidb.idb.delete_database` [See here](module-eidb_idb-idb.html#.delete_database)
     */
    static delete_database;

    // EXTENDED OPS ************************************************************
    /**
     * Alias of `eidb.idbx.open_av` [See here](module-eidb_idbx-idbx.html#.open_av)
     */
    static open_av;

    /**
     * Alias of `eidb.idbx.reopen` [See here](module-eidb_idbx-idbx.html#.reopen)
     */
    static reopen;

    /**
     * Alias of `eidb.idbx.num_db_cons`
     */
    static num_db_cons;

    /**
     * Alias of `eidb.idbx.set_db` [See here](module-eidb_idbx-idbx.html#.set_db)
     */
    static set_db;

    /**
     * Alias of `eidb.idbx.get_prop` [See here](module-eidb_idbx-idbx.html#.get_prop)
     */
    static get_prop;

    /**
     * Alias of `eidb.idbx.do_op` [See here](module-eidb_idbx-idbx.html#.do_op)
     */
    static do_op;

    /**
     * Alias of `eidb.idbx.del_obj_store`
     */
    static del_obj_store;

    // CRUD OPS ****************************************************************
    /**
     * Alias of `eidb.idbx.crud.insert_one` [See here](module-eidb_idbx_crud-crud.html#.insert_one)</br>
     * CRUD/CREATE
     */
    static insert_one;

    /**
     * Alias of `eidb.idbx.crud.insert_many` [See here](module-eidb_idbx_crud-crud.html#.insert_many)</br>
     * CRUD/CREATE
     */
    static insert_many;

    /**
     * Alias of `eidb.idbx.crud.exists` [See here](module-eidb_idbx_crud-crud.html#.exists)</br>
     * CRUD/READ
     */
    static exists;

    /**
     * Alias of `eidb.idbx.crud.count` [See here](module-eidb_idbx_crud-crud.html#.count)</br>
     * CRUD/READ
     */
    static count;

    /**
     * Alias of `eidb.idbx.crud.count_all` [See here](module-eidb_idbx_crud-crud.html#.count_all)</br>
     * CRUD/READ
     */
    static count_all;

    /**
     * Alias of `eidb.idbx.crud.find_one` [See here](module-eidb_idbx_crud-crud.html#.find_one)</br>
     * CRUD/READ
     */
    static find_one;

    /**
     * Alias of `eidb.idbx.crud.find_many` [See here](module-eidb_idbx_crud-crud.html#.find_many)</br>
     * CRUD/READ
     */
    static find_many;

    /**
     * Alias of `eidb.idbx.crud.find_all` [See here](module-eidb_idbx_crud-crud.html#.find_all)</br>
     * CRUD/READ
     */
    static find_all;

    /**
     * Alias of `eidb.idbx.crud.filter` [See here](module-eidb_idbx_crud-crud.html#.filter)</br>
     * CRUD/READ
     */
    static filter;

    /**
     * Alias of `eidb.idbx.crud.update_one` [See here](module-eidb_idbx_crud-crud.html#.update_one)</br>
     * CRUD/UPDATE
     */
    static update_one;

    /**
     * Alias of `eidb.idbx.crud.update_many` [See here](module-eidb_idbx_crud-crud.html#.update_many)</br>
     * CRUD/UPDATE
     */
    static update_many;

    /**
     * Alias of `eidb.idbx.crud.upsert_one` [See here](module-eidb_idbx_crud-crud.html#.upsert_one)</br>
     * CRUD/UPDATE
     */
    static upsert_one;

    /**
     * Alias of `eidb.idbx.crud.remove_one` [See here](module-eidb_idbx_crud-crud.html#.remove_one)</br>
     * CRUD/DELETE
     */
    static remove_one;

    /**
     * Alias of `eidb.idbx.crud.remove_many` [See here](module-eidb_idbx_crud-crud.html#.remove_many)</br>
     * CRUD/DELETE
     */
    static remove_many;   
    
    // OP HISTORY **************************************************************
    /**
     * Alias of `eidb.idbx.op_hist.set_max_history`
     */
    static set_max_history;

    /**
     * Alias of `eidb.idbx.op_hist.get_op_hist_status`
     */
    static get_op_hist_status;

    /**
     * Alias of `eidb.idbx.op_hist.enable_op_hist`
     */
    static enable_op_hist;

    /**
     * Alias of `eidb.idbx.op_hist.enable_op_hist`
     */
    static disable_op_hist;

    /**
     * Alias of `eidb.idbx.op_hist.get_op_hist`
     */
    static get_op_hist;

    /**
     * Alias of `eidb.idbx.op_hist.clear_op_hist`
     */
    static clear_op_hist;

    // FULL-TEXT SEARCH ********************************************************
    /**
     * Alias of `eidb.idbx.fts.enable_fts`
     */
    static enable_fts;

    /**
     * Alias of `eidb.idbx.fts.disable_fts`
     */
    static disable_fts;

    /**
     * Alias of `eidb.idbx.fts.find_many_by_terms`
     */
    static find_many_by_terms;

    // EXTENDED OPS (SECURE) ***************************************************
    /**
     * Alias of `eidb.idbxs.s_open_av` [See here](module-eidb_idbxs-idbxs.html#.open_av)
     */
    static s_open_av;

    // CRUD OPS (SECURE) *******************************************************
    /**
     * Alias of `eidb.idbxs.cruds.insert_one` [See here](module-eidb_idbxs_cruds-cruds.html#.insert_one)</br>
     * CRUD/CREATE
     */
    static s_insert_one;

    /**
     * Alias of `eidb.idbxs.cruds.insert_many` [See here](module-eidb_idbxs_cruds-cruds.html#.insert_many)</br>
     * CRUD/CREATE
     */
    static s_insert_many;

    /**
     * Alias of `eidb.idbxs.cruds.exists` [See here](module-eidb_idbxs_cruds-cruds.html#.exists)</br>
     * CRUD/READ
     */
    static s_exists;

    /**
     * Alias of `eidb.idbxs.cruds.count` [See here](module-eidb_idbxs_cruds-cruds.html#.count)</br>
     * CRUD/READ
     */
    static s_count;

    /**
     * Alias of `eidb.idbxs.cruds.count_all` [See here](module-eidb_idbxs_cruds-cruds.html#.count_all)</br>
     * CRUD/READ
     */
    static s_count_all;

    /**
     * Alias of `eidb.idbx.crud.find_one` [See here](module-eidb_idbxs_cruds-cruds.html#.find_one)
     * </br>
     * CRUD/READ
     */
    static s_find_one;

    /**
     * Alias of `eidb.idbxs.cruds.find_many` [See here](module-eidb_idbxs_cruds-cruds.html#.find_many)</br>
     * CRUD/READ
     */
    static s_find_many;

    /**
     * Alias of `eidb.idbxs.cruds.find_all` [See here](module-eidb_idbxs_cruds-cruds.html#.find_all)</br>
     * CRUD/READ
     */
    static s_find_all;

    /**
     * Alias of `eidb.idbxs.cruds.filter` [See here](module-eidb_idbxs_cruds-cruds.html#.filter)</br>
     * CRUD/READ
     */
    static s_filter;

    /**
     * Alias of `eidb.idbxs.cruds.update_one` [See here](module-eidb_idbxs_cruds-cruds.html#.update_one)</br>
     * CRUD/UPDATE
     */
    static s_update_one;

    /**
     * Alias of `eidb.idbxs.cruds.update_many` [See here](module-eidb_idbxs_cruds-cruds.html#.update_many)</br>
     * CRUD/UPDATE
     */
    static s_update_many;

    /**
     * Alias of `eidb.idbxs.cruds.upsert_one` [See here](module-eidb_idbxs_cruds-cruds.html#.upsert_one)</br>
     * CRUD/UPDATE
     */
    static s_upsert_one;

    /**
     * Alias of `eidb.idbxs.cruds.remove_one` [See here](module-eidb_idbxs_cruds-cruds.html#.remove_one)</br>
     * CRUD/DELETE
     */
    static s_remove_one;

    /**
     * Alias of `eidb.idbxs.cruds.remove_many` [See here](module-eidb_idbxs_cruds-cruds.html#.remove_many)</br>
     * CRUD/DELETE
     */
    static s_remove_many;   
    
    // OP HISTORY (SECURE) *****************************************************
    /**
     * Alias of `eidb.idbxs.op_hists.set_max_history`
     */
    static s_set_max_history;

    /**
     * Alias of `eidb.idbxs.op_hists.get_op_hist_status`
     */
    static s_get_op_hist_status;

    /**
     * Alias of `eidb.idbxs.op_hists.enable_op_hist`
     */
    static s_enable_op_hist;

    /**
     * Alias of `eidb.idbxs.op_hists.enable_op_hist`
     */
    static s_disable_op_hist;

    /**
     * Alias of `eidb.idbxs.op_hists.get_op_hist`
     */
    static s_get_op_hist;

    /**
     * Alias of `eidb.idbxs.op_hists.clear_op_hist`
     */
    static s_clear_op_hist;

    // FULL-TEXT SEARCH (SECURE) ***********************************************
    /**
     * Alias of `eidb.idbxs.ftss.enable_fts`
     */
    static s_enable_fts;

    /**
     * Alias of `eidb.idbxs.ftss.disable_fts`
     */
    static s_disable_fts;

    /**
     * Alias of `eidb.idbx.fts.find_many_by_terms`
     */
    static s_find_many_by_terms;

    /*
     * _________________________________________________________________________
     */
    METHODS(){}

    /**
     * Initialise EnIndex library
     */ 
    static init(){
        // Subnamespaces
        eidb.idb      = idb;
        eidb.idbx     = idbx;
        eidb.idbxs    = idbxs;
        eidb.sec      = idbxs; // The same as idbxs
        eidb.wcrypto  = wcrypto;
        eidb.utils    = utils;

        eidb.idb.    init();
        eidb.idbx.   init();
        eidb.idbxs.  init(); // No .sec.init(), not twice.
        eidb.wcrypto.init();
        eidb.utils.  init();

        // Subnamespace shortcuts, window.* binding but must put here 
        // to ensure modules are imported completely coz they are modules, not others.
        window.slocal   = slocal;
        window.ssession = ssession;

        // Static properties
        eidb.Factory = new factory(window.indexedDB);

        // Aliases -------------------------------------------------------------
        // Base ops
        eidb.databases       = idb.databases;
        eidb.open            = idb.open;
        eidb.delete_database = idb.delete_database;

        // Extended ops
        eidb.open_av       = idbx.open_av;
        eidb.reopen        = idbx.reopen;
        eidb.num_db_cons   = idbx.num_db_cons;
        eidb.set_db        = idbx.set_db;
        eidb.get_prop      = idbx.get_prop;
        eidb.do_op         = idbx.do_op;
        eidb.del_obj_store = idbx.del_obj_store;

        // CRUD ops
        eidb.insert_one  = idbx.crud.insert_one;
        eidb.insert_many = idbx.crud.insert_many;
        eidb.exists      = idbx.crud.exists;
        eidb.count       = idbx.crud.count;
        eidb.count_all   = idbx.crud.count_all;
        eidb.find_one    = idbx.crud.find_one;
        eidb.find_many   = idbx.crud.find_many;
        eidb.find_all    = idbx.crud.find_all;
        eidb.filter      = idbx.crud.filter;
        eidb.update_one  = idbx.crud.update_one;
        eidb.update_many = idbx.crud.update_many;
        eidb.upsert_one  = idbx.crud.upsert_one;
        eidb.remove_one  = idbx.crud.remove_one;
        eidb.remove_many = idbx.crud.remove_many;

        // Op history
        eidb.set_max_history    = idbx.op_hist.set_max_history;
        eidb.get_op_hist_status = idbx.op_hist.get_op_hist_status;
        eidb.enable_op_hist     = idbx.op_hist.enable_op_hist;
        eidb.disable_op_hist    = idbx.op_hist.disable_op_hist;
        eidb.get_op_hist        = idbx.op_hist.get_op_hist;
        eidb.clear_op_hist      = idbx.op_hist.clear_op_hist;

        // FTS
        eidb.enable_fts         = idbx.fts.enable_fts;
        eidb.disable_fts        = idbx.fts.disable_fts;
        eidb.find_many_by_terms = idbx.fts.find_many_by_terms;

        // Extended ops (Secure)
        eidb.s_open_av = idbxs.open_av;

        // CRUD ops (Secure)
        eidb.s_insert_one  = idbxs.cruds.insert_one;
        eidb.s_insert_many = idbxs.cruds.insert_many;
        eidb.s_exists      = idbxs.cruds.exists;
        eidb.s_count       = idbxs.cruds.count;
        eidb.s_count_all   = idbxs.cruds.count_all;
        eidb.s_find_one    = idbxs.cruds.find_one;
        eidb.s_find_many   = idbxs.cruds.find_many;
        eidb.s_find_all    = idbxs.cruds.find_all;
        eidb.s_filter      = idbxs.cruds.filter;
        eidb.s_update_one  = idbxs.cruds.update_one;
        eidb.s_update_many = idbxs.cruds.update_many;
        eidb.s_upsert_one  = idbxs.cruds.upsert_one;
        eidb.s_remove_one  = idbxs.cruds.remove_one;
        eidb.s_remove_many = idbxs.cruds.remove_many;

        // Op history (Secure)
        eidb.s_set_max_history    = idbxs.op_hists.set_max_history;
        eidb.s_get_op_hist_status = idbxs.op_hists.get_op_hist_status;
        eidb.s_enable_op_hist     = idbxs.op_hists.enable_op_hist;
        eidb.s_disable_op_hist    = idbxs.op_hists.disable_op_hist;
        eidb.s_get_op_hist        = idbxs.op_hists.get_op_hist;
        eidb.s_clear_op_hist      = idbxs.op_hists.clear_op_hist;

        // FTS (Secure)
        eidb.s_enable_fts         = idbxs.ftss.enable_fts;
        eidb.s_disable_fts        = idbxs.ftss.disable_fts;
        eidb.s_find_many_by_terms = idbxs.ftss.find_many_by_terms;

        // Global bindings to window global object -----------------------------
        // See after this class, leave them at module scope 
        // to be documented.
    }
}

/**
 * _____________________________________________________________________________
 */
var EXPORTS_LITERALS; // Kinda keywords

/**
 * Key type literal: non-unique, single-entry
 */ 
window.n1 = eidb.n1; // Index schema, use 1 for syntax colouring, eg. field:1

/**
 * Key type literal: non-unique, multi-entry
 */ 
window.n2 = eidb.n2; // Index schema, use 2 for syntax colouring, eg. field:2
 
/**
 * Key type literal: unique, single-entry
 */ 
window.u1 = eidb.u1; // Index schema eg. field:u1
 
/**
 * Key type literal: non-unique, single-entry
 */ 
window.u2 = eidb.u2; // Index schema eg. field:u2

/**
 * Secure mode for store
 */ 
window._secure = true;

/**
 * Result of cursor callback to stop iterating
 */ 
window._stop = "stop";

/**
 * _____________________________________________________________________________
 */
var EXPORTS_CONSTANTS;

/**
 * Read-only transaction mode
 */
const RO = eidb.RO;
window.RO = RO;
 
/**
 * Read-write transaction mode
 */
const RW = eidb.RW;
window.RW = RW;

/*
Range	            Code
All keys ??? x	    IDBKeyRange.lowerBound (x)
All keys > x	    IDBKeyRange.lowerBound (x, true)
All keys ??? y	    IDBKeyRange.upperBound (y)
All keys < y	    IDBKeyRange.upperBound (y, true)
All keys ??? x && ??? y	IDBKeyRange.bound (x, y)
All keys > x &&< y	IDBKeyRange.bound (x, y, true, true)
All keys > x && ??? y	IDBKeyRange.bound (x, y, true, false)
All keys ??? x &&< y	IDBKeyRange.bound (x, y, false, true)
The key = z	        IDBKeyRange.only (z)
*/
/**
 * Indicates that left value in index value range is included
 */
const WITH_LEFT = false;
window.WITH_LEFT = WITH_LEFT;

/**
 * Indicates that right value in key range is included
 */
const WITH_RIGHT = false;
window.WITH_RIGHT = WITH_RIGHT;

/**
 * Indicates that left value in key range is EXCLUDED
 */
const NO_LEFT = true;
window.NO_LEFT = NO_LEFT;

/**
 * Indicates that right value in key range is EXCLUDED
 */
const NO_RIGHT = true;
window.NO_RIGHT = NO_RIGHT;

/**
 * _____________________________________________________________________________
 */
var EXPORTS_OP_NAMES;

/**
 * Operation name to work with eidb.do_op, eg.: `eidb.do_op("my-store",_add,{})`
 */
const _add = "add";
window._add = _add;

/**
 * Operation name to work with eidb.do_op
 */
const _clear = "clear";
window._clear = _clear;

/**
 * Operation name to work with eidb.do_op
 */
const _count = "count";
window._count = _count;

/**
 * Operation name to work with eidb.do_op
 */
const _create_index = "create_index";
window._create_index = _create_index;

/**
 * Operation name to work with eidb.do_op
 */
const _delete = "delete";
window._delete = _delete;

/**
 * Operation name to work with eidb.do_op
 */
const _delete_index = "delete_index";
window._delete_index = _delete_index;

/**
 * Operation name to work with eidb.do_op
 */
const _get = "get";
window._get = _get;

/**
 * Operation name to work with eidb.do_op
 */
const _get_all = "get_all";
window._get_all = _get_all;

/**
 * Operation name to work with eidb.do_op
 */
const _get_all_keys = "get_all_keys";
window._get_all_keys = _get_all_keys;

/**
 * Operation name to work with eidb.do_op
 */
const _get_key = "get_key";
window._get_key = _get_key;

/**
 * Operation name to work with eidb.do_op
 */
const _index = "index";
window._index = _index;

/**
 * Operation name to work with eidb.do_op
 */
const _open_cursor = "open_cursor";
window._open_cursor = _open_cursor;

/**
 * Operation name to work with eidb.do_op
 */
const _open_key_cursor = "open_key_cursor";
window._open_key_cursor = _open_key_cursor;

/**
 * Operation name to work with eidb.do_op
 */
const _put = "put";
window._put = _put;

/*
 * _____________________________________________________________________________
 */
var EXPORTS_METHODS;

/**
 * Key range (greater than or equal)
 */
const range_gte = (x)=>new key_range(IDBKeyRange.lowerBound(x));
window.range_gte = range_gte;

/**
 * Key range (greater than)
 */
const range_gt = (x)=>new key_range(IDBKeyRange.lowerBound(x, true));
window.range_gt = range_gt;

/**
 * Key range (less than or equal)
 */
const range_lte = (y)=>new key_range(IDBKeyRange.upperBound(y)); 
window.range_lte = range_lte;

/**
 * Key range (less than)
 */
const range_lt = (y)=>new key_range(IDBKeyRange.upperBound(y, true)); 
window.range_lt = range_lt;

/**
 * Key range between 2 values: [..], (..], [..), or (..)
 * @param {Any}     x   - Left value
 * @param {Any}     y   - Right value
 * @param {Boolean} exl - Indicates whether to exclude left value
 * @param {Boolean} exr - Indicates whether to exclude right value
 */
const range_between = (x,y,exl,exr)=>new key_range(IDBKeyRange.bound(x,y, exl,exr));
window.range_between = range_between;

/**
 * Key range of exact only 1 value
 */
const value_is = (z)=>new key_range(IDBKeyRange.only(z));
window.value_is = value_is;

// Global bindings, base functionalities
/** 
 * Create async/await lock, example:
 * ```
 * var [Lock,unlock] = new_lock();
 * ```
 */
/** @func new_lock */
const new_lock = base.new_lock;
window.new_lock = new_lock;

/** 
 * Stay idle for a number of milliseconds (similar to sleep but the thread
 * is actually still running, so it's not sleep)
 */
/** @func stay_idle */
const stay_idle = base.stay_idle;
window.stay_idle = stay_idle;

/*
 * _____________________________________________________________________________
 */
var EXPORTS_CLASS;

// Global bindings, whole lib
// EnIndex library global object
window.eidb = eidb;
log("EnIndex loaded");

/**
 * Note
 * ----
 * 
 * All members & methods of this module are bound to global scope under `window` object.
 * 
 * Examples
 * --------
 * 
 * EnIndex library is delivered as ES6 module, use `script` tag with `type="module"` to load:
 * ```
 * // Warn: Type module is loaded asynchronously, may not exist when root global JS
 * // script is executed even if this module tag is at first position in HTML file.
 * <script type="module" src="/path/to/eidb.js"></script>
 * ```
 * 
 * Sample index schema
 * ```
 * // 1:Single value, 2:Multientry, u1:Unique single value, u2:Unique multientry
 * // Do not use _ prefix for store names, it's for EnIndex internal use.
 * var Indices = {
 *     my_store: { 
 *         foo:1, bar:2, foobar:u1, barfoo:u2, "foo.bar":1, "bar.foo":2         
 *     }
 * };
 * ```
 * 
 * Open database with automatic versioning
 * ```
 * eidb.init();
 * var Db = eidb.open_av("my_db", Indices);
 * 
 * if (Db instanceof Error){
 *     ...
 * }
 * eidb.enable_op_hist();
 * eidb.enable_fts();
 * 
 * // Do some ops
 * // Use eidb.sec.* instead of eidb.idbxs.* for secure ops,
 * // they are the same alias but eidb.sec has better clarity.
 * ...
 * Db.close();
 * ```
 * 
 * `open_av` is to be called once at app load, use `reopen` later on. Avoid
 * being blocked in db upgrade when app is in multiple browser tabs, 
 * call `reopen` and close for every transaction.
 * ```
 * var Db = eidb.reopen();
 * ...
 * Db.close();
 * ```
 */

// WARNING: The 'Examples' block above should be right above this export
// to be used as module description by JSDoc.
// Module export, for submodules to use only, outer JS uses window.* above
export default eidb; 
// EOF