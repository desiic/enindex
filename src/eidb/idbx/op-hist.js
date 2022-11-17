/**
 * @module eidb/idbx/op_hist
 */ 

// Modules
import idbx from "../idbx.js";

// Shorthands
var log  = console.log;
var logw = console.warn;
var loge = console.error;

// Constants
const OP_HIST_STORE = "op_hist";

// 4 arrays of ids, supposed to be unique but laxed
const OP_HIST_INDICES = {Create:2, Read:2, Update:2, Delete:2}; 

/**
 * CRUD operation history
 */ 
class op_hist {
    static max_history = 1000;
    static enabled     = false;

    /**
     * Change default max entries per op type in history
     */ 
    static set_max_history(max){
        history.max_history = max;
    }

    /**
     * Get op hist status
     */ 
    static get_op_hist_stat(){
        return op_hist.enabled? "enabled":"disabled";
    }

    /**
     * Enable op history<br/>
     * WARN: IF USED, MUST RUN THIS METHOD BEFORE ANY OTHER OP HISTORY METHODS,
     *       RECOMMENDED TO RUN RIGHT AFTER open_av TO  CREATE 'history' STORE 
     *       IF NOT EXISTING.
     */
    static async enable_op_hist(){
        // Check if store `history` exists
        var Db          = await eidb.reopen();
        var Store_Names = Db.Object_Store_Names;
        Db.close();
        
        // Exists? set enabled
        if (Store_Names.indexOf(OP_HIST_STORE) >= 0){
            op_hist.enabled = true;
            return;
        }

        // Not existing, create the store
        var Db_Name     = window._Db_Name;
        var Cur_Indices = await idbx.get_cur_indices(Db_Name);
        var New_Indices = Cur_Indices;
        New_Indices[OP_HIST_STORE] = OP_HIST_INDICES;
        var Db = await eidb.open_av(Db_Name, New_Indices);

        if (Db instanceof Error){
            loge("history.enable_op_hist: Failed to alter indices, error:",Db);
            return;
        }
        
        // Finally
        Db.close();
        op_hist.enabled = true;
    }

    /**
     * Disable history
     */ 
    static disable_op_hist(){
        op_hist.enabled = false;
    }

    /**
     * Update op hist CRUD<br/>
     * NOTE: NOT TO AWAIT ANYTHING IN OP HIST FUNCS, BE IN BACKGROUND
     */ 
    static update_op_hist(Op_Type, Ids){
        // ???
    }

    /**
     * Update op hist CRUD:C<br/>
     * NOTE: NOT TO AWAIT ANYTHING IN OP HIST FUNCS, BE IN BACKGROUND
     */ 
    static update_op_hist_c(Ids){
        op_hist.update_op_hist("Create",Ids);
    }

    /**
     * Update op hist CRUD:R<br/>
     * NOTE: NOT TO AWAIT ANYTHING IN OP HIST FUNCS, BE IN BACKGROUND
     */ 
    static update_op_hist_r(Ids){
        op_hist.update_op_hist("Read",Ids);
    }

    /**
     * Update op hist CRUD:U<br/>
     * NOTE: NOT TO AWAIT ANYTHING IN OP HIST FUNCS, BE IN BACKGROUND
     */ 
    static update_op_hist_u(Ids){
        op_hist.update_op_hist("Update",Ids);
    }

    /**
     * Update op hist CRUD:D<br/>
     * NOTE: NOT TO AWAIT ANYTHING IN OP HIST FUNCS, BE IN BACKGROUND
     */ 
    static update_op_hist_d(Ids){
        op_hist.update_op_hist("Delete",Ids);
    }
}

export default op_hist;
// EOF