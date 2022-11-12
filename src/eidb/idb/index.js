/**
 * @module eidb/idb/index
 */

// Modules
import base              from "../base.js";
import object_store      from "./object-store.js";
import cursor            from "./cursor.js";
import cursor_with_value from "./cursor-with-value.js";

// Shorthands
var   log      = console.log;
const new_lock = base.new_lock;

/**
 * IDBIndex class wrapper
 */
class index {
    self = null;

    /**
     * Constructor
     */
    constructor(Idb_Index){
        this.self = Idb_Index;
    }

    /**
     * _________________________________________________________________________
     */ 
    SETS_AND_GETS;

    /**
     * Get key path
     */
    get Key_Path(){
        return this.self.keyPath;
    }

    /**
     * Get multiEntry 
     */ 
    get multientry(){
        return this.self.multiEntry;
    }

    /**
     * Get name
     */
    get Name(){
        return this.self.name;
    }

    /**
     * Get object store
     */ 
    get Object_Store(){
        return new object_store(this.self.objectStore);
    }

    /**
     * Get unique
     */ 
    get unique(){
        return this.self.unique;
    }

    /*
     * _________________________________________________________________________
     */
    METHODS;

    /**
     * Count
     */
    async count(Range){
        try {
            if (Range==null)
                var Req = this.self.count();
            else
                var Req = this.self.count(Range.self);

            var [Lock,unlock] = new_lock();

            Req.onerror = (Ev)=>{
                unlock(Ev.target.error);
            };
            Req.onsuccess = (Ev)=>{
                unlock(Ev.target.result);
            };
            return await Lock;
        }
        catch (Dom_Exception){
            return Dom_Exception;
        }            
    }

    /**
     * Get
     */
    async get(Range){
        try {
            if (Range==null)
                var Req = this.self.get();
            else
                var Req = this.self.get(Range.self);

            var [Lock,unlock] = new_lock();

            Req.onerror = (Ev)=>{
                unlock(Ev.target.error);
            };
            Req.onsuccess = (Ev)=>{
                unlock(Ev.target.result);
            };
            return await Lock;
        }
        catch (Dom_Exception){
            return Dom_Exception;
        }            
    }

    /**
     * Get all
     */
    async get_all(Range, max){
        try {
            if (Range==null)
                var Req = this.self.getAll();
            else                
                var Req = this.self.getAll(Range.self, max);

            var [Lock,unlock] = new_lock();

            Req.onerror = (Ev)=>{
                unlock(Ev.target.error);
            };
            Req.onsuccess = (Ev)=>{
                unlock(Ev.target.result);
            };
            return await Lock;
        }
        catch (Dom_Exception){
            return Dom_Exception;
        }            
    }

    /**
     * Get all keys (key field of doc only)
     */
    async get_all_keys(Range, max){
        try {
            if (Range==null)
                var Req = this.self.getAllKeys();
            else                
                var Req = this.self.getAllKeys(Range.self, max);

            var [Lock,unlock] = new_lock();

            Req.onerror = (Ev)=>{
                unlock(Ev.target.error);
            };
            Req.onsuccess = (Ev)=>{
                unlock(Ev.target.result);
            };
            return await Lock;
        }
        catch (Dom_Exception){
            return Dom_Exception;
        }            
    }

    /**
     * Get key (key field only)
     */
    async get_key(Range){
        try {
            if (Range==null)
                var Req = this.self.getKey();
            else
                var Req = this.self.getKey(Range.self);

            var [Lock,unlock] = new_lock();

            Req.onerror = (Ev)=>{
                unlock(Ev.target.error);
            };
            Req.onsuccess = (Ev)=>{
                unlock(Ev.target.result);
            };
            return await Lock;
        }
        catch (Dom_Exception){
            return Dom_Exception;
        }            
    }

    /**
     * Open cursor
     */
    async open_cursor(Range,Direction="next"){ 
        try {
            if (Range==null)
                var Req = this.self.openCursor();
            else
                var Req = this.self.openCursor(Range.self,Direction);

            var [Lock,unlock] = new_lock();

            Req.onerror = (Ev)=>{
                unlock(Ev.target.error);
            };
            Req.onsuccess = (Ev)=>{
                unlock(new cursor_with_value(Ev.target.result));
            };
            return await Lock;
        }
        catch (Dom_Exception){
            return Dom_Exception;
        }            
    }

    /**
     * Open key cursor
     */
    async open_key_cursor(Range,Direction="next"){
        try {
            if (Range==null)
                var Req = this.self.openKeyCursor();
            else
                var Req = this.self.openKeyCursor(Range.self,Direction);

            var [Lock,unlock] = new_lock();

            Req.onerror = (Ev)=>{
                unlock(Ev.target.error);
            };
            Req.onsuccess = (Ev)=>{
                unlock(new cursor(Ev.target.result));
            };
            return await Lock;
        }
        catch (Dom_Exception){
            return Dom_Exception;
        }            
    }
}

export default index;
// EOF