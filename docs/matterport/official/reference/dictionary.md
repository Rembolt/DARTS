<!-- source: https://developers.matterport.com/reference/dictionary/ -->

On this page

A homogenous collection of items indexable by string like a standard JavaScript object. Can also be iterated with a `for..of` loop.

Methods

  * [Symbol.iterator]



## Methods​

### [Symbol.iterator]​

[Symbol.iterator](): IterableIterator<[string, ItemT]>

Iterate all items in the collection using `for..of`.
    
    
    for (const [key, item] of collection) {  
    
    
      console.log(`the collection contains ${item} at the index ${key}`);  
    
    
    }  
    

**Returns:** `IterableIterator`<[string, `ItemT`]>

  * Methods
    * [Symbol.iterator]



  * Methods
    * [Symbol.iterator]


