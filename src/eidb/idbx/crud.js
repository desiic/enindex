/**
 * @module eidb/idbx/crud
 */

// Modules
import base    from "../base.js";
import utils   from "../utils.js";
import op_hist from "./op-hist.js";
import fts     from "./fts.js";
import ftss    from "../idbxs/ftss.js";

// Shorthands
var log      = console.log;
var logw     = console.warn;
var loge     = console.error;
var new_lock = base.new_lock;
var json2obj = JSON.parse;
var obj2json = JSON.stringify;

/**
 * CRUD op class<br/>
 * NOTE: ONLY insert_one, find_one, update_one, upsert_one, remove_one WILL 
 *       AFFECT THE OP HISTORY.<br/>
 * NOTE: ONLY OPERATIONS THOSE CHANGE DATA AFFECT FTS, ie. insert, update, upsert, remove.
 */
class crud {

    /**
     * Insert one
     * @return {Number} Id of the new obj
     */
    static async insert_one(Store_Name,Obj, secure=false,Original_Obj=null){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RW);
        var Store = T.store1()

        // Got store, next
        var Obj_ = {...Obj}; // Clone to delete id
        delete Obj_.id;      // Id is auto-incremented

        // Insert
        var new_id = await Store.add(Obj_);

        if (new_id instanceof Error){
            loge("crud.insert_one: Failed, error:",new_id);
            if (Store==null) Db.close();
            return null;
        }

        op_hist.update_op_hist_c(Store.Name, [new_id]);

        if (secure)
            ftss.update_fts_c(Store.Name, new_id, Original_Obj);
        else
            fts.update_fts_c(Store.Name, new_id, Obj);

        if (Store==null) Db.close();
        return new_id;
    }

    /**
     * Insert many
     * @return {Array} List of inserted object ids
     */
    static async insert_many(Store_Name,Objs, secure=false,Original_Objs=null){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RW);            
        var Store = T.store1();

        // Got store, next
        var Ids           = [];
        var [Lock,unlock] = new_lock();
        if (Objs==null || Objs.length==0) { Db.close(); return []; }
        
        // Add all objects till all added
        for (let Obj of Objs){
            let Obj_ = {...Obj}; // Clone to delete id
            delete Obj_.id;      // Id is auto-incremented
            let Req = Store.self.add(Obj_); // MUST BE 'let' HERE, EACH Req IS DIFFERENT.

            Req.onerror = (Ev)=>{
                loge("crud.insert_many: Failed to add object, error:",Ev.target.error);
                Ids.push(null);
                if (Ids.length == Objs.length) unlock();
            };
            Req.onsuccess = (Ev)=>{
                Ids.push(Ev.target.result);
                if (Ids.length == Objs.length) unlock();
            };            
        }
        await Lock;

        for (let i=0; i<Ids.length; i++)
            if (secure)
                ftss.update_fts_c(Store.Name, Ids[i], Original_Objs[i]);
            else
                fts.update_fts_c(Store.Name, Ids[i], Objs[i]);

        Db.close();        
        return Ids;
    }

    /**
     * Get object by 1 condition only<br/>
     * Keys of Conds are all index names.
     */
    static async get_1stcond_obj(Store,Cond){ // Cond can't be empty {}
        var Keys  = Object.keys(Cond);
        var Index = Store.index(Keys[0]);

        if (Index instanceof Error){
            loge("crud.get_1stcond_obj: Failed to get index, "+
                 "add this index to schema:",Store.Name,"/",Keys[0]);
            return null;
        }

        var Range = Cond[Keys[0]];
        return await Index.get(Range);
    }

    /**
     * Get objects by 1 condition only<br/>
     * Keys of Conds are all index names.
     */
    static async get_1stcond_objs(Store,Cond){ // Cond can't be empty {}
        var Keys  = Object.keys(Cond);
        var Index = Store.index(Keys[0]);

        if (Index instanceof Error){
            loge("crud.get_1stcond_obj: Failed to get index, "+
                 "add this index to schema:",Store.Name,"/",Keys[0]);
            return null;
        }

        var Range = Cond[Keys[0]];        
        return await Index.get_all(Range);
    }

    /**
     * Intersect conditions (key values) to get ids, eg. Cond {foo:"a", bar:"b"},
     * key foo gives multiple items of value 'a', key bar gives multiple items
     * of value 'b', intersect these 2 for id list.<br/>
     * Keys of Conds are all index names.
     */ 
    static async intersect_cond(Store,Cond){
        var Keys = Object.keys(Cond);
        if (Keys.length==0) return [];

        // Multiple conditions, intersect       
        var Id_Arrays = [];

        for (let Key of Keys){
            let Index = Store.index(Key);

            if (Index instanceof Error){
                loge("crud.get_1stcond_obj: Failed to get index, "+
                     "add this index to schema:",Store.Name,"/",Key);
                return null;
            }

            let Range = Cond[Key];
            let Objs  = await Index.get_all(Range);
            let Ids   = Objs.map(Obj=>Obj.id);
            Id_Arrays.push(Ids);
        }
        
        return utils.intersect_arrs(Id_Arrays);
    }

    /**
     * Intersect conditions (key values) to get ids, eg. Cond {foo:"a", bar:"b"},
     * key foo gives multiple items of value 'a', key bar gives multiple items
     * of value 'b', intersect these 2 for object list.<br/>
     * Keys of Conds are all index names.
     */ 
     static async intersect_cond_getobjs(Store,Cond){
        var Keys = Object.keys(Cond);
        if (Keys.length==0) return [];

        // Multiple conditions, intersect       
        var Id_Arrays = [];
        var Id2Objs   = {};

        for (let Key of Keys){
            let Index = Store.index(Key);

            if (Index instanceof Error){
                loge("crud.get_1stcond_obj: Failed to get index, "+
                     "add this index to schema:",Store.Name,"/",Key);
                return null;
            }

            let Range = Cond[Key];
            let Objs  = await Index.get_all(Range);

            let Ids = Objs.map(Obj=>{
                Id2Objs[Obj.id] = Obj;
                return Obj.id;
            });

            Id_Arrays.push(Ids);
        }
        
        var Id_Intersection = utils.intersect_arrs(Id_Arrays);
        return Id_Intersection.map(id => Id2Objs[id]);
    }

    /**
     * Check existence of obj<br/>
     * Avoid multiple conds in Cond, use compound index.<br/>
     * Note: Read but no fetching data, no op history<br/>
     * Keys of Conds are all index names.
     * @return {Boolean}
     */
    static async exists(Store_Name,Cond, secure=false){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RO);
        var Store = T.store1();

        // Got store, next
        var Keys = Object.keys(Cond);
        if (Keys.length==0) { Db.close(); return []; }

        // Single cond
        if (Keys.length==1){
            let Obj = await crud.get_1stcond_obj(Store,Cond);
            Db.close();
            return Obj!=null;
        }

        // Multiple conds
        var Ids = await crud.intersect_cond(Store,Cond);
        Db.close();
        return Ids.length>0;
    }

    /**
     * Count<br/>
     * Avoid multiple conds in Cond, use compound index<br/>
     * Note: Read but no fetching data, no op history<br/>
     * Keys of Conds are all index names.
     * @return {Number}
     */
    static async count(Store_Name,Cond, secure=false){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RO);
        var Store = T.store1();

        // Got store, next
        var Keys = Object.keys(Cond);
        if (Keys.length==0) { Db.close(); return null; }

        // Single cond
        if (Keys.length==1){
            let Objs = await crud.get_1stcond_objs(Store,Cond);
            Db.close();
            return Objs.length;
        }

        // Multiple conds
        var Ids = await crud.intersect_cond(Store,Cond);
        Db.close();
        return Ids.length;
    }

    /**
     * Count all<br/>
     * Note: Read but no fetching data, no op history
     * @return {Number}
     */
    static async count_all(Store_Name, secure=false){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RO);
        var Store = T.store1();

        // Got store, next
        var count = await Store.count();
        Db.close();
        return count;
    }

    /**
     * Find one, avoid using multiple conditions in Cond coz it's slow<br/>
     * Keys of Conds are all index names.
     * @return {Object}
     */
    static async find_one(Store_Name,Cond, secure=false){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RO);
        var Store = T.store1();

        // Got store, next
        var Keys = Object.keys(Cond);
        if (Keys.length==0) { Db.close(); return null; }

        // Single cond
        if (Keys.length==1){
            let Obj = await crud.get_1stcond_obj(Store,Cond);
            if (Obj==null) { Db.close(); return null; }

            // Update op history and return
            op_hist.update_op_hist_r(Store.Name, [Obj.id]);
            Db.close();
            return Obj;
        }

        // Multiple conds
        var Ids = await crud.intersect_cond(Store,Cond);
        if (Ids.length==0) { Db.close(); return null; }

        // Update op history & return        
        var Obj = await Store.get(value_is(Ids[0]));
        op_hist.update_op_hist_r(Store.Name, Ids);
        Db.close();
        return Obj;
    }

    /**
     * Find many, avoid using multiple conditions in Cond coz it's slow,
     * USE COMPOUND INDEX INSTEAD.<br/>
     * Keys of Conds are all index names.
     * @return {Object}
     */
    static async find_many(Store_Name,Cond, limit=Number.MAX_SAFE_INTEGER, secure=false){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RO);
        var Store = T.store1();

        // Got store, next
        var Keys = Object.keys(Cond);
        if (Keys.length==0) { Db.close(); return null; }

        // Single cond
        if (Keys.length==1){
            let Objs = await crud.get_1stcond_objs(Store,Cond);
            Db.close();
            return Objs;
        }

        // Multiple conds
        var Ids = await crud.intersect_cond(Store,Cond);
        if (Ids==null || Ids.length==0) { Db.close(); return []; }

        var Objs          = [];
        var [Lock,unlock] = new_lock();

        for (let id of Ids){
            let Req = Store.self.get(value_is(id).self)

            Req.onerror = (Ev)=>{
                Objs.push(null);
                if (Objs.length == Ids.length) unlock();
                if (Objs.length >= limit)      unlock();
            };
            Req.onsuccess = (Ev)=>{
                Objs.push(Ev.target.result);
                if (Objs.length == Ids.length) unlock();
                if (Objs.length >= limit)      unlock();
            };
        }        

        await Lock;
        Db.close();
        return Objs;
    }

    /**
     * Find all
     * @return {Array}
     */
    static async find_all(Store_Name, secure=false){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RO);
        var Store = T.store1();

        // Got store, next
        var Objs = await Store.get_all();
        Db.close();
        return Objs;
    }

    /**
     * Get value at prop path
     */ 
    static get_proppath_value(Obj,Path){
        var Tokens = Path.split(".");
        var Value  = Obj;

        for (let Token of Tokens)
            if (Value[Token] != null)
                Value = Value[Token];     
            else 
                return null;

        return Value;
    }

    /**
     * Check if object matches condition<br/>
     * Keys of Conds are all index names.
     */ 
    static obj_matches_cond(Obj,Cond){
        for (let Key in Cond){
            let Value     = Cond[Key];
            let Obj_Value = crud.get_proppath_value(Obj,Key);

            if (Obj_Value==null)
                return false;
            if (obj2json(Obj_Value).indexOf(Value) == -1)
                return false;
        }

        return true;
    }

    /**
     * Filter (value contain, for exact match: use find, find_many)<br/>
     * Keys of Conds are all index names.
     */ 
    static async filter(Store_Name,Cond, limit=Number.MAX_SAFE_INTEGER, secure=false){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RO);
        var Store = T.store1();

        // Got store, next
        var Objs = [];

        await Store.open_cursor(range_gte(0),"next",Cursor=>{
            var Value = Cursor.value;

            if (crud.obj_matches_cond(Value,Cond))
                Objs.push(Value);
            if (Objs.length >= limit)
                return _stop;
        });

        Db.close();
        return Objs;
    }

    /**
     * Update one, avoid using multiple conditions in Cond coz it's slow,
     * USE COMPOUND INDEX INSTEAD.<br/>
     * Keys of Conds are all index names.
     * @return {Object}
     */
    static async update_one(Store_Name,Cond,Changes, secure=false,Original_Obj=null){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RW);
        var Store = T.store1();

        // Got store, next
        var Keys = Object.keys(Cond);
        if (Keys.length==0) { Db.close(); return null; }

        let Changes_ = {...Changes}; // Clone to delete id
        delete Changes_.id;          // Id is auto-incremented

        // Single cond
        if (Keys.length==1){
            let Obj = await crud.get_1stcond_obj(Store,Cond);
            if (Obj==null) { Db.close(); return null; }

            // Apply changes
            Obj = {...Obj,...Changes_};
            Store.put(Obj);
            op_hist.update_op_hist_u(Store.Name, [Obj.id]);

            if (secure)
                ftss.update_fts_u(Store.Name, Obj.id, Original_Obj);
            else
                fts.update_fts_u(Store.Name, Obj.id, Obj);

            Db.close();
            return Obj;
        }

        // Multiple conds
        var Ids = await crud.intersect_cond(Store,Cond);
        if (Ids==null || Ids.length==0) { Db.close(); return null; }

        var Obj = await Store.get(value_is(Ids[0]));
        if (Obj==null) { Db.close(); return null; }

        // Apply changes
        Obj = {...Obj,...Changes_};
        await Store.put(Obj);
        op_hist.update_op_hist_u(Store.Name, [Obj.id]);

        if (secure)
            ftss.update_fts_u(Store.Name, Obj.id, Obj);
        else
            fts.update_fts_u(Store.Name, Obj.id, Obj);

        Db.close();
        return Obj;
    }

    /**
     * Update many, avoid using multiple conditions in Cond coz it's slow,
     * USE COMPOUND INDEX INSTEAD.<br/>
     * Keys of Conds are all index names.
     * @return {Object}
     */
    static async update_many(Store_Name,Cond,Changes, limit=Number.MAX_SAFE_INTEGER, secure=false){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RW);
        var Store = T.store1();

        // Got store, next
        var Keys = Object.keys(Cond);
        if (Keys.length==0) { Db.close(); return null; }

        let Changes_ = {...Changes}; // Clone to delete id
        delete Changes_.id;          // Id is auto-incremented

        // Single cond
        if (Keys.length==1){
            var Objs = await crud.get_1stcond_objs(Store,Cond);
            if (Objs==null)     { Db.close(); return null; }
            if (Objs.length==0) { Db.close(); return []; }
        }
        // Multiple conds
        else{        
            var Objs = await crud.intersect_cond_getobjs(Store,Cond);
            if (Objs==null)     { Db.close(); return null; }
            if (Objs.length==0) { Db.close(); return []; }
        }

        // Update
        let Updated_Objs  = [];
        let [Lock,unlock] = new_lock();

        for (let Obj of Objs){
            let Replacement = {...Obj,...Changes_};
            let Req         = Store.self.put(Replacement);
            
            Req.onerror = (Ev)=>{
                loge("crud.update_many: Failed to update object:",Obj);
                Updated_Objs.push(null);
                if (Updated_Objs.length == Objs.length) unlock();
                if (Updated_Objs.length >= limit)       unlock();
            };
            Req.onsuccess = (Ev)=>{
                Updated_Objs.push({...Replacement, ...{id:Ev.target.result}});
                if (Updated_Objs.length == Objs.length) unlock();
                if (Updated_Objs.length >= limit)       unlock();
            }
        }
        await Lock;

        for (let i=0; i<Updated_Objs.length; i++)
            if (secure){
                // FTS secure is updated in cruds.js for this case
                // ftss.update_fts_u(Store.Name, Updated_Objs[i].id, Updated_Objs[i]);
            }
            else
                fts.update_fts_u(Store.Name, Updated_Objs[i].id, Updated_Objs[i]);

        Db.close();        
        return Updated_Objs;
    }

    /**
     * Upsert one, avoid using multiple conditions in Cond coz it's slow,
     * USE COMPOUND INDEX INSTEAD<br/>
     * Keys of Conds are all index names.
     * @return {Number} Object id
     */
    static async upsert_one(Store_Name,Cond,Changes, secure=false,Original_Obj=null){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RW);
        var Store = T.store1();

        // Got store, next
        var Keys = Object.keys(Cond);
        if (Keys.length==0) { Db.close(); return null; }

        let Changes_ = {...Changes}; // Clone to delete id
        delete Changes_.id;          // Id is auto-incremented

        // Single cond
        if (Keys.length==1){
            let Obj = await crud.get_1stcond_obj(Store,Cond);

            // Insert
            if (Obj==null){
                let id = await Store.add(Changes_);
                op_hist.update_op_hist_c(Store.Name, [id]);

                if (secure)
                    ftss.update_fts_c(Store.Name, id, Original_Obj);
                else
                    fts.update_fts_c(Store.Name, id, Changes);

                Db.close();
                return id;
            };

            // Update
            Obj = {...Obj,...Changes_};
            Store.put(Obj);
            op_hist.update_op_hist_u(Store.Name, [Obj.id]);

            if (secure)
                ftss.update_fts_u(Store.Name, Obj.id, Original_Obj);
            else
                fts.update_fts_u(Store.Name, Obj.id, Obj);

            Db.close();
            return Obj.id;
        }

        // Multiple conds
        var Ids = await crud.intersect_cond(Store,Cond);
        if (Ids==null || Ids.length==0) { Db.close(); return null; }

        // Insert
        var Obj = await Store.get(value_is(Ids[0]));

        if (Obj==null){
            let id = await Store.add(Changes_);
            op_hist.update_op_hist_c(Store.Name, [id]);

            if (secure)
                ftss.update_fts_c(Store.Name, id, Original_Obj);
            else
                fts.update_fts_c(Store.Name, id, Changes);

            Db.close();
            return id;
        };

        // Update
        Obj = {...Obj,...Changes_};
        Store.put(Obj);
        op_hist.update_op_hist_u(Store.Name, [Obj.id]);

        if (secure)
            ftss.update_fts_u(Store.Name, Obj.id, Original_Obj);
        else
            fts.update_fts_u(Store.Name, Obj.id, Obj);

        Db.close();
        return Obj.id;
    }

    /**
     * Remove one, avoid using multiple conditions in Cond coz it's slow,
     * USE COMPOUND INDEX INSTEAD<br/>
     * Keys of Conds are all index names.
     * @return {null}
     */
    static async remove_one(Store_Name,Cond, secure=false,Original_Obj=null){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RW);
        var Store = T.store1();

        // Got store, next
        var Keys = Object.keys(Cond);
        if (Keys.length==0) { Db.close(); return null; }

        // Single cond
        if (Keys.length==1){
            let Obj = await crud.get_1stcond_obj(Store,Cond);
            if (Obj==null) { Db.close(); return null; }
            
            let id = await Store.delete(value_is(Obj.id));
            op_hist.update_op_hist_d(Store.Name, [Obj.id]);

            if (secure)
                ftss.update_fts_d(Store.Name, Obj.id, Original_Obj);
            else
                fts.update_fts_d(Store.Name, Obj.id, Obj);

            Db.close();
            return id; // Always null, from IDBObjectStore.delete
        }

        // Multiple conds
        var Objs = await crud.intersect_cond_getobjs(Store,Cond);
        var Ids  = Objs.map(X=>X.id);
        if (Ids==null || Ids.length==0) { Db.close(); return null; }
        
        var id = await Store.delete(value_is(Ids[0]));
        op_hist.update_op_hist_d(Store.Name, [Ids[0]]);

        if (secure)
            ftss.update_fts_d(Store.Name, Ids[0], Original_Obj);
        else
            fts.update_fts_d(Store.Name, Ids[0], Objs[0]);

        Db.close();
        return id; // Always null, from IDBObjectStore.delete
    }

    /**
     * Remove many, avoid using multiple conditions in Cond coz it's slow,
     * USE COMPOUND INDEX INSTEAD<br/>
     * Keys of Conds are all index names.
     * @return {null}
     */
    static async remove_many(Store_Name,Cond, secure=false,Original_Objs=null){
        var Db    = await eidb.reopen();
        var T     = Db.transaction(Store_Name,RW);
        var Store = T.store1();

        // Got store, next
        var Keys = Object.keys(Cond);
        if (Keys.length==0) { Db.close(); return null; }

        // Single cond
        var Objs = [];
        var Ids  = [];

        if (Keys.length==1){
            Objs = await crud.get_1stcond_objs(Store,Cond);            
            Ids = Objs.map(Obj=>Obj.id);
            if (Objs==null || Objs.length==0) { Db.close(); return null; }            
        }
        else{
            // Multiple conds
            Objs = await crud.intersect_cond_getobjs(Store,Cond);
            Ids  = Objs.map(X=>X.id);
            if (Ids==null || Ids.length==0) { Db.close(); return null; }
        }

        var [Lock,unlock] = new_lock();
        var count         = 0;

        for (let id of Ids){
            let Req = Store.self.delete(value_is(id).self);

            Req.onerror = (Ev)=>{
                count++;
                if (count == Ids.length) unlock();
            };
            Req.onsuccess = (Ev)=>{
                count++;
                if (count == Ids.length) unlock();
            };
        }        
        await Lock;

        for (let i=0; i<Ids.length; i++)
            if (secure)
                ftss.update_fts_d(Store.Name, Ids[i], Original_Objs[i]);
            else
                fts.update_fts_d(Store.Name, Ids[i], Objs[i]);

        Db.close();
        return null;
    }

    /**
     */
    static init(){
    } 
}

export default crud;
// EOF