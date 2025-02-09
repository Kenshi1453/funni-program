/**
 * @template T  
 */
class PromiseWithResolvers{
    constructor(){
        /** @type {Promise<T>} */
        this._promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        })
    }
}

/**
 * @template T
 */
class AsyncQueue {
    

    constructor(){
        /** @type {T[]} */
        this._list = []
        /** @type {PromiseWithResolvers<T>} */
        this._promise = new PromiseWithResolvers()
        this._waiting_for_promise = false
    }

    /**
     * 
     * @param {T} item 
     */
    async enqueue(item){
        if(this._waiting_for_promise){
            this._waiting_for_promise = false;
            this._promise.resolve(item)
            this._promise = new PromiseWithResolvers()
        }else{
            this._list.push(item)
        }
    }

    /** @returns {Promise<T>} */
    async dequeue(){
        if(this._list.length > 0){
            return this._list.shift()
        }else{
            this._waiting_for_promise = true
            return this._promise._promise
        }
    }
}

export { AsyncQueue }